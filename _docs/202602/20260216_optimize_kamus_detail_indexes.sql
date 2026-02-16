BEGIN;

ALTER TABLE glosarium RENAME CONSTRAINT glossary_pkey TO glosarium_pkey;

CREATE INDEX IF NOT EXISTS idx_entri_serupa_norm_aktif
  ON entri (
    LOWER(REGEXP_REPLACE(REPLACE(entri, '-', ''), '\s*\([0-9]+\)\s*$', ''))
  )
  WHERE aktif = 1;

CREATE INDEX IF NOT EXISTS idx_entri_induk_aktif_jenis_entri
  ON entri (induk, aktif, jenis, entri);

ANALYZE entri;
ANALYZE glosarium;

COMMIT;
