WITH duplikat AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY entri_id
           ORDER BY tanggal ASC, created_at ASC, id ASC
         ) AS urutan
    FROM kata_hari_ini
)
DELETE FROM kata_hari_ini khi
USING duplikat
WHERE khi.id = duplikat.id
  AND duplikat.urutan > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'kata_hari_ini'::regclass
       AND conname = 'kata_hari_ini_entri_id_key'
  ) THEN
    ALTER TABLE kata_hari_ini
      ADD CONSTRAINT kata_hari_ini_entri_id_key UNIQUE (entri_id);
  END IF;
END $$;

DROP INDEX IF EXISTS idx_kata_hari_ini_entri_id;