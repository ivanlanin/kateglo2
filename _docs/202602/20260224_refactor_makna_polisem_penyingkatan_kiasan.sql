BEGIN;

UPDATE makna
SET polisem = urutan;

ALTER TABLE makna
  DROP COLUMN urutan;

ALTER TABLE makna
  RENAME COLUMN tipe_penyingkat TO penyingkatan;

ALTER TABLE makna
  RENAME CONSTRAINT makna_tipe_penyingkat_check TO makna_penyingkatan_check;

ALTER TABLE makna
  ALTER COLUMN kiasan DROP DEFAULT;

ALTER TABLE makna
  ALTER COLUMN kiasan TYPE boolean
  USING (
    CASE
      WHEN kiasan IS NULL THEN FALSE
      WHEN kiasan::integer <> 0 THEN TRUE
      ELSE FALSE
    END
  );

ALTER TABLE makna
  ALTER COLUMN kiasan SET DEFAULT FALSE,
  ALTER COLUMN kiasan SET NOT NULL;

UPDATE makna
SET ragam_varian = CASE LOWER(BTRIM(ragam_varian))
  WHEN 'cak' THEN 'cak'
  WHEN 'cakapan' THEN 'cak'
  WHEN 'hor' THEN 'hor'
  WHEN 'hormat' THEN 'hor'
  WHEN 'kl' THEN 'kl'
  WHEN 'klasik' THEN 'kl'
  WHEN 'kas' THEN 'kas'
  WHEN 'kasar' THEN 'kas'
  ELSE NULL
END
WHERE ragam_varian IS NOT NULL
  AND BTRIM(ragam_varian) <> '';

ALTER TABLE makna
  DROP CONSTRAINT IF EXISTS makna_ragam_varian_check;

ALTER TABLE makna
  ADD CONSTRAINT makna_ragam_varian_check
  CHECK (
    ragam_varian IS NULL
    OR ragam_varian = ANY (ARRAY['cak'::text, 'hor'::text, 'kl'::text, 'kas'::text])
  );

DROP INDEX IF EXISTS idx_makna_entri;
CREATE INDEX idx_makna_entri ON makna USING btree (entri_id, polisem);

COMMIT;
