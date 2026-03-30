-- =============================================================================
-- Migrasi: Tambah kolom entri_id + aktif pada etimologi, lalu pemetaan otomatis
-- Tanggal: 2026-02-26
-- =============================================================================

BEGIN;

ALTER TABLE etimologi
  ADD COLUMN IF NOT EXISTS entri_id integer REFERENCES entri(id) ON DELETE SET NULL;

ALTER TABLE etimologi
  ADD COLUMN IF NOT EXISTS aktif boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_etimologi_entri_id ON etimologi USING btree (entri_id);
CREATE INDEX IF NOT EXISTS idx_etimologi_aktif ON etimologi USING btree (aktif);
CREATE INDEX IF NOT EXISTS idx_etimologi_indeks_homonim ON etimologi USING btree (indeks, homonim);

-- Reset hasil pemetaan agar idempoten saat migrasi dijalankan ulang
UPDATE etimologi
SET entri_id = NULL,
    aktif = false,
    updated_at = NOW();

-- Aturan 1 (paling yakin): indeks + homonim + lafal cocok persis (ci) dan kandidat tunggal
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

-- Aturan 2: indeks + homonim cocok dan kandidat tunggal
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

-- Aturan 3: indeks + lafal cocok persis (ci) dan kandidat tunggal (hanya bila homonim etimologi kosong)
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

-- Aturan 4 (fallback aman): indeks punya satu kandidat aktif (kandidat tunggal)
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
