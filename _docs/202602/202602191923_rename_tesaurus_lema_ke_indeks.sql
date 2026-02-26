-- Rename kolom tesaurus.lema menjadi tesaurus.indeks

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tesaurus'
      AND column_name = 'lema'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tesaurus'
      AND column_name = 'indeks'
  ) THEN
    EXECUTE 'ALTER TABLE tesaurus RENAME COLUMN lema TO indeks';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tesaurus_lema_key'
      AND conrelid = 'tesaurus'::regclass
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tesaurus_indeks_key'
      AND conrelid = 'tesaurus'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE tesaurus RENAME CONSTRAINT tesaurus_lema_key TO tesaurus_indeks_key';
  END IF;
END
$$;

ALTER INDEX IF EXISTS idx_tesaurus_lema_lower RENAME TO idx_tesaurus_indeks_lower;
ALTER INDEX IF EXISTS idx_tesaurus_lema_trgm RENAME TO idx_tesaurus_indeks_trgm;

COMMIT;
