ALTER TABLE kata_hari_ini
  DROP CONSTRAINT IF EXISTS kata_hari_ini_mode_pemilihan_check,
  DROP CONSTRAINT IF EXISTS kata_hari_ini_indeks_check,
  DROP CONSTRAINT IF EXISTS kata_hari_ini_makna_check,
  DROP CONSTRAINT IF EXISTS kata_hari_ini_entri_check;

DROP INDEX IF EXISTS idx_kata_hari_ini_mode_tanggal;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'kata_hari_ini'
      AND column_name = 'mode_pemilihan'
  ) THEN
    ALTER TABLE kata_hari_ini RENAME COLUMN mode_pemilihan TO sumber;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'kata_hari_ini'
      AND column_name = 'catatan_admin'
  ) THEN
    ALTER TABLE kata_hari_ini RENAME COLUMN catatan_admin TO catatan;
  END IF;
END $$;

ALTER TABLE kata_hari_ini
  ALTER COLUMN sumber SET DEFAULT 'auto';

ALTER TABLE kata_hari_ini
  DROP COLUMN IF EXISTS indeks,
  DROP COLUMN IF EXISTS entri,
  DROP COLUMN IF EXISTS kelas_kata,
  DROP COLUMN IF EXISTS makna,
  DROP COLUMN IF EXISTS contoh,
  DROP COLUMN IF EXISTS pemenggalan,
  DROP COLUMN IF EXISTS lafal,
  DROP COLUMN IF EXISTS etimologi_bahasa,
  DROP COLUMN IF EXISTS etimologi_kata_asal;

ALTER TABLE kata_hari_ini
  DROP CONSTRAINT IF EXISTS kata_hari_ini_sumber_check;

ALTER TABLE kata_hari_ini
  ADD CONSTRAINT kata_hari_ini_sumber_check CHECK (sumber IN ('auto', 'admin'));

CREATE INDEX IF NOT EXISTS idx_kata_hari_ini_sumber_tanggal ON kata_hari_ini USING btree (sumber, tanggal DESC);