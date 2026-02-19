BEGIN;

ALTER TABLE entri
  ADD COLUMN IF NOT EXISTS sumber text;

ALTER TABLE entri DISABLE TRIGGER trg_set_timestamp_fields__entri;

UPDATE entri
SET sumber = 'KBBI IV'
WHERE sumber IS NULL;

ALTER TABLE entri ENABLE TRIGGER trg_set_timestamp_fields__entri;

COMMIT;
