-- Tambah timestamp UTC untuk pelacakan pencarian
-- Kolom:
--   created_at = waktu pertama kata tercatat pada bucket (tanggal, domain, kata)
--   updated_at = waktu terakhir bucket tersebut ter-update

ALTER TABLE pencarian
  ADD COLUMN IF NOT EXISTS created_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone;

UPDATE pencarian
   SET created_at = COALESCE(created_at, (tanggal::timestamp)),
       updated_at = COALESCE(updated_at, (tanggal::timestamp));

ALTER TABLE pencarian
  ALTER COLUMN created_at SET DEFAULT (now() AT TIME ZONE 'UTC'),
  ALTER COLUMN updated_at SET DEFAULT (now() AT TIME ZONE 'UTC');

ALTER TABLE pencarian
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

DO $$
DECLARE
  child_table text;
BEGIN
  FOR child_table IN
    SELECT c.relname
      FROM pg_inherits i
      JOIN pg_class p ON p.oid = i.inhparent
      JOIN pg_class c ON c.oid = i.inhrelid
     WHERE p.relname = 'pencarian'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I
         ADD COLUMN IF NOT EXISTS created_at timestamp without time zone,
         ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone',
      child_table
    );

    EXECUTE format(
      'UPDATE %I
          SET created_at = COALESCE(created_at, (tanggal::timestamp)),
              updated_at = COALESCE(updated_at, (tanggal::timestamp))',
      child_table
    );

    EXECUTE format(
      'ALTER TABLE %I
         ALTER COLUMN created_at SET DEFAULT (now() AT TIME ZONE ''UTC''),
         ALTER COLUMN updated_at SET DEFAULT (now() AT TIME ZONE ''UTC''),
         ALTER COLUMN created_at SET NOT NULL,
         ALTER COLUMN updated_at SET NOT NULL',
      child_table
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION pencarian_route()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  nama_tabel text;
  awal_bulan date;
  akhir_bulan date;
  waktu_utc timestamp without time zone;
BEGIN
  IF NEW.tanggal IS NULL THEN
    NEW.tanggal := CURRENT_DATE;
  END IF;

  IF NEW.kata IS NULL OR btrim(NEW.kata) = '' THEN
    RETURN NULL;
  END IF;

  IF NEW.jumlah IS NULL OR NEW.jumlah < 1 THEN
    NEW.jumlah := 1;
  END IF;

  IF NEW.domain IS NULL OR NEW.domain NOT IN (1, 2, 3, 4, 5) THEN
    NEW.domain := 1;
  END IF;

  waktu_utc := now() AT TIME ZONE 'UTC';

  IF NEW.created_at IS NULL THEN
    NEW.created_at := waktu_utc;
  END IF;

  IF NEW.updated_at IS NULL THEN
    NEW.updated_at := waktu_utc;
  END IF;

  nama_tabel := format('pencarian_%s', to_char(NEW.tanggal, 'YYYYMM'));
  awal_bulan := date_trunc('month', NEW.tanggal)::date;
  akhir_bulan := (date_trunc('month', NEW.tanggal) + interval '1 month')::date;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I (
      CHECK (tanggal >= date %L AND tanggal < date %L),
      CHECK (domain IN (1, 2, 3, 4, 5))
    ) INHERITS (pencarian)',
    nama_tabel, awal_bulan, akhir_bulan
  );

  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I (tanggal, domain, kata)',
    nama_tabel || '_tanggal_domain_kata_key',
    nama_tabel
  );

  EXECUTE format(
    'INSERT INTO %I (tanggal, domain, kata, jumlah, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tanggal, domain, kata)
     DO UPDATE SET
       jumlah = %I.jumlah + EXCLUDED.jumlah,
       created_at = LEAST(%I.created_at, EXCLUDED.created_at),
       updated_at = GREATEST(%I.updated_at, EXCLUDED.updated_at)',
    nama_tabel,
    nama_tabel,
    nama_tabel,
    nama_tabel
  ) USING NEW.tanggal, NEW.domain, lower(btrim(NEW.kata)), NEW.jumlah, NEW.created_at, NEW.updated_at;

  RETURN NULL;
END;
$$;
