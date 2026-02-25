-- =============================================================================
-- Migrasi: Rebuild tabel etimologi dari etimologi_lwim (lengkap + remap entri)
-- Tanggal: 2026-02-26
-- =============================================================================

BEGIN;

DROP TABLE IF EXISTS etimologi;

CREATE TABLE etimologi (
  id serial PRIMARY KEY,
  indeks text NOT NULL,
  entri_id integer REFERENCES entri(id) ON DELETE SET NULL,
  homonim integer,
  lafal text,
  bahasa text,
  sumber text NOT NULL DEFAULT 'LWIM',
  sumber_sitasi text,
  sumber_isi text,
  sumber_aksara text,
  sumber_lihat text,
  sumber_varian text,
  sumber_definisi text,
  sumber_id text,
  aktif boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT etimologi_indeks_check CHECK (TRIM(BOTH FROM indeks) <> ''::text)
);

CREATE INDEX idx_etimologi_indeks ON etimologi USING btree (indeks);
CREATE INDEX idx_etimologi_indeks_homonim ON etimologi USING btree (indeks, homonim);
CREATE INDEX idx_etimologi_lafal ON etimologi USING btree (lafal);
CREATE INDEX idx_etimologi_bahasa ON etimologi USING btree (bahasa);
CREATE INDEX idx_etimologi_entri_id ON etimologi USING btree (entri_id);
CREATE INDEX idx_etimologi_aktif ON etimologi USING btree (aktif);
CREATE INDEX idx_etimologi_sumber_id ON etimologi USING btree (sumber_id);
CREATE INDEX idx_etimologi_created_at ON etimologi USING btree (created_at DESC);

INSERT INTO etimologi (
  indeks,
  entri_id,
  homonim,
  lafal,
  bahasa,
  sumber,
  sumber_sitasi,
  sumber_isi,
  sumber_aksara,
  sumber_lihat,
  sumber_varian,
  sumber_definisi,
  sumber_id,
  aktif,
  created_at,
  updated_at
)
SELECT
  l.indeks_query AS indeks,
  NULL::integer AS entri_id,
  l.lwim_hom AS homonim,
  l.lwim_orth AS lafal,
  l.etym_lang AS bahasa,
  'LWIM' AS sumber,
  l.etym_cite AS sumber_sitasi,
  l.etym_mentioned AS sumber_isi,
  l.etym_aksara AS sumber_aksara,
  l.xr_lihat AS sumber_lihat,
  l.xr_varian AS sumber_varian,
  l.raw_def AS sumber_definisi,
  l.lwim_id AS sumber_id,
  false AS aktif,
  (l.fetched_at AT TIME ZONE 'UTC') AS created_at,
  (l.fetched_at AT TIME ZONE 'UTC') AS updated_at
FROM etimologi_lwim l;

-- Reset idempoten sebelum pemetaan
UPDATE etimologi
SET entri_id = NULL,
    aktif = false,
    updated_at = created_at;

-- Aturan 1 (paling yakin): indeks + homonim + lafal cocok, kandidat tunggal
UPDATE etimologi et
SET entri_id = m.entri_id,
    aktif = true,
    updated_at = NOW()
FROM (
  SELECT
    et1.id AS etimologi_id,
    MIN(en.id) AS entri_id
  FROM etimologi et1
  JOIN entri en
    ON LOWER(en.indeks) = LOWER(et1.indeks)
   AND en.aktif = 1
  WHERE et1.homonim IS NOT NULL
    AND NULLIF(BTRIM(et1.lafal), '') IS NOT NULL
    AND en.homonim = et1.homonim
    AND LOWER(COALESCE(en.lafal, '')) = LOWER(BTRIM(et1.lafal))
  GROUP BY et1.id
  HAVING COUNT(*) = 1
) m
WHERE et.id = m.etimologi_id
  AND et.entri_id IS NULL;

-- Aturan 2: indeks + homonim cocok, kandidat tunggal (lafal sumber kosong/tidak pasti)
UPDATE etimologi et
SET entri_id = m.entri_id,
    aktif = true,
    updated_at = NOW()
FROM (
  SELECT
    et1.id AS etimologi_id,
    MIN(en.id) AS entri_id
  FROM etimologi et1
  JOIN entri en
    ON LOWER(en.indeks) = LOWER(et1.indeks)
   AND en.aktif = 1
  WHERE et1.homonim IS NOT NULL
    AND en.homonim = et1.homonim
  GROUP BY et1.id
  HAVING COUNT(*) = 1
) m
WHERE et.id = m.etimologi_id
  AND et.entri_id IS NULL;

-- Aturan 3: indeks + lafal cocok, kandidat tunggal (saat homonim sumber kosong)
UPDATE etimologi et
SET entri_id = m.entri_id,
    aktif = true,
    updated_at = NOW()
FROM (
  SELECT
    et1.id AS etimologi_id,
    MIN(en.id) AS entri_id
  FROM etimologi et1
  JOIN entri en
    ON LOWER(en.indeks) = LOWER(et1.indeks)
   AND en.aktif = 1
  WHERE et1.homonim IS NULL
    AND NULLIF(BTRIM(et1.lafal), '') IS NOT NULL
    AND LOWER(COALESCE(en.lafal, '')) = LOWER(BTRIM(et1.lafal))
  GROUP BY et1.id
  HAVING COUNT(*) = 1
) m
WHERE et.id = m.etimologi_id
  AND et.entri_id IS NULL;

-- Aturan 4 (fallback aman): indeks punya satu kandidat entri aktif (kandidat tunggal)
UPDATE etimologi et
SET entri_id = m.entri_id,
    aktif = true,
    updated_at = NOW()
FROM (
  SELECT
    et1.id AS etimologi_id,
    MIN(en.id) AS entri_id
  FROM etimologi et1
  JOIN entri en
    ON LOWER(en.indeks) = LOWER(et1.indeks)
   AND en.aktif = 1
  GROUP BY et1.id
  HAVING COUNT(*) = 1
) m
WHERE et.id = m.etimologi_id
  AND et.entri_id IS NULL;

COMMIT;
