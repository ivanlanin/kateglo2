-- =============================================================================
-- Migrasi: Bentuk tabel etimologi redaksi dari etimologi_lwim
-- Tanggal: 2026-02-26
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS etimologi (
  id serial PRIMARY KEY,
  indeks text NOT NULL,
  homonim integer,
  lafal text,
  bahasa text,
  sumber text NOT NULL DEFAULT 'LWIM',
  sumber_sitasi text,
  sumber_isi text,
  sumber_aksara text,
  sumber_lihat text,
  sumber_varian text,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT etimologi_indeks_check CHECK (TRIM(BOTH FROM indeks) <> ''::text)
);

CREATE INDEX IF NOT EXISTS idx_etimologi_indeks ON etimologi USING btree (indeks);
CREATE INDEX IF NOT EXISTS idx_etimologi_bahasa ON etimologi USING btree (bahasa);
CREATE INDEX IF NOT EXISTS idx_etimologi_created_at ON etimologi USING btree (created_at DESC);

TRUNCATE TABLE etimologi RESTART IDENTITY;

INSERT INTO etimologi (
  indeks,
  homonim,
  lafal,
  bahasa,
  sumber,
  sumber_sitasi,
  sumber_isi,
  sumber_aksara,
  sumber_lihat,
  sumber_varian,
  created_at,
  updated_at
)
SELECT
  l.indeks_query AS indeks,
  l.lwim_hom AS homonim,
  l.lwim_orth AS lafal,
  l.etym_lang AS bahasa,
  'LWIM' AS sumber,
  l.etym_cite AS sumber_sitasi,
  l.etym_mentioned AS sumber_isi,
  l.etym_aksara AS sumber_aksara,
  l.xr_lihat AS sumber_lihat,
  l.xr_varian AS sumber_varian,
  (l.fetched_at AT TIME ZONE 'UTC') AS created_at,
  (l.fetched_at AT TIME ZONE 'UTC') AS updated_at
FROM etimologi_lwim l;

INSERT INTO izin (kode, nama, kelompok)
VALUES ('kelola_etimologi', 'Kelola etimologi', 'etimologi')
ON CONFLICT (kode) DO NOTHING;

INSERT INTO peran_izin (peran_id, izin_id)
SELECT p.id, i.id
FROM peran p
CROSS JOIN izin i
WHERE p.kode IN ('admin', 'penyunting')
  AND i.kode = 'kelola_etimologi'
  AND NOT EXISTS (
    SELECT 1 FROM peran_izin pi2
    WHERE pi2.peran_id = p.id
      AND pi2.izin_id = i.id
  );

COMMIT;
