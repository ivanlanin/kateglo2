BEGIN;

CREATE INDEX IF NOT EXISTS idx_glosarium_indonesia_tsv_simple
  ON glosarium
  USING gin (to_tsvector('simple', indonesia));

ANALYZE glosarium;

COMMIT;
