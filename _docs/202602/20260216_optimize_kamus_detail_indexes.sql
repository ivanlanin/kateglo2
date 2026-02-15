BEGIN;

ALTER TABLE glosarium RENAME CONSTRAINT glossary_pkey TO glosarium_pkey;

CREATE INDEX IF NOT EXISTS idx_lema_serupa_norm_aktif
  ON lema (
    LOWER(REGEXP_REPLACE(REPLACE(lema, '-', ''), '\s*\([0-9]+\)\s*$', ''))
  )
  WHERE aktif = 1;

CREATE INDEX IF NOT EXISTS idx_lema_induk_aktif_jenis_lema
  ON lema (induk, aktif, jenis, lema);

ANALYZE lema;
ANALYZE glosarium;

COMMIT;
