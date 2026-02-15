BEGIN;

ALTER TABLE IF EXISTS glosarium RENAME COLUMN discipline TO bidang;
ALTER INDEX IF EXISTS idx_glosarium_discipline RENAME TO idx_glosarium_bidang;

COMMIT;
