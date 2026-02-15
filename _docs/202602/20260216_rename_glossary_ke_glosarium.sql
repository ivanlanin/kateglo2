BEGIN;

ALTER TABLE IF EXISTS glossary RENAME TO glosarium;

ALTER TABLE IF EXISTS glosarium RENAME COLUMN glo_uid TO id;
ALTER TABLE IF EXISTS glosarium RENAME COLUMN phrase TO indonesia;
ALTER TABLE IF EXISTS glosarium RENAME COLUMN original TO asing;
ALTER TABLE IF EXISTS glosarium RENAME COLUMN lang TO bahasa;
ALTER TABLE IF EXISTS glosarium RENAME COLUMN ref_source TO sumber;

ALTER INDEX IF EXISTS idx_glossary_discipline RENAME TO idx_glosarium_discipline;
ALTER INDEX IF EXISTS idx_glossary_original RENAME TO idx_glosarium_asing;
ALTER INDEX IF EXISTS idx_glossary_original_trgm RENAME TO idx_glosarium_asing_trgm;
ALTER INDEX IF EXISTS idx_glossary_phrase RENAME TO idx_glosarium_indonesia;
ALTER INDEX IF EXISTS idx_glossary_phrase_trgm RENAME TO idx_glosarium_indonesia_trgm;
ALTER INDEX IF EXISTS idx_glossary_ref_source RENAME TO idx_glosarium_sumber;

CREATE INDEX IF NOT EXISTS idx_glosarium_indonesia_lower_trgm
  ON glosarium USING gin (LOWER(indonesia) gin_trgm_ops);

COMMIT;
