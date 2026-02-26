BEGIN;

ALTER TABLE entri
  ADD COLUMN IF NOT EXISTS entri_rujuk INTEGER;

ALTER TABLE entri DISABLE TRIGGER USER;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'entri'
      AND column_name = 'lema_rujuk'
  ) THEN
    EXECUTE $sql$
      WITH kandidat AS (
        SELECT
          e.id AS source_id,
          r.id AS target_id,
          ROW_NUMBER() OVER (
            PARTITION BY e.id
            ORDER BY
              CASE WHEN r.aktif = 1 THEN 0 ELSE 1 END,
              r.homograf ASC NULLS LAST,
              r.homonim ASC NULLS LAST,
              r.id ASC
          ) AS rn
        FROM entri e
        JOIN entri r
          ON (
            LOWER(BTRIM(r.entri)) = LOWER(BTRIM(e.lema_rujuk))
            OR LOWER(BTRIM(r.indeks)) = LOWER(BTRIM(e.lema_rujuk))
          )
        WHERE e.lema_rujuk IS NOT NULL
          AND BTRIM(e.lema_rujuk) <> ''
          AND r.id <> e.id
      )
      UPDATE entri e
      SET entri_rujuk = k.target_id
      FROM kandidat k
      WHERE k.source_id = e.id
        AND k.rn = 1;
    $sql$;
  END IF;
END $$;

ALTER TABLE entri ENABLE TRIGGER USER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'entri_entri_rujuk_fkey'
  ) THEN
    ALTER TABLE entri
      ADD CONSTRAINT entri_entri_rujuk_fkey
      FOREIGN KEY (entri_rujuk)
      REFERENCES entri(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_entri_entri_rujuk ON entri USING btree (entri_rujuk);

-- Keep legacy column for now (admin visibility + audit trail)
-- ALTER TABLE entri
--   DROP COLUMN IF EXISTS lema_rujuk;

COMMIT;
