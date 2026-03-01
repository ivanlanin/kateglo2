-- Refactor pelacakan pencarian: tambah domain kode numerik
-- Domain:
-- 1=kamus, 2=tesaurus, 3=glosarium, 4=makna, 5=rima

ALTER TABLE pencarian
  ADD COLUMN IF NOT EXISTS domain smallint;

UPDATE pencarian
   SET domain = 1
 WHERE domain IS NULL;

ALTER TABLE pencarian
  ALTER COLUMN domain SET NOT NULL;

ALTER TABLE pencarian
  ALTER COLUMN domain SET DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'pencarian_domain_check'
       AND conrelid = 'pencarian'::regclass
  ) THEN
    ALTER TABLE pencarian
      ADD CONSTRAINT pencarian_domain_check CHECK (domain IN (1, 2, 3, 4, 5));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pencarian_route()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  nama_tabel text;
  awal_bulan date;
  akhir_bulan date;
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
    'INSERT INTO %I (tanggal, domain, kata, jumlah)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tanggal, domain, kata)
     DO UPDATE SET jumlah = %I.jumlah + EXCLUDED.jumlah',
    nama_tabel,
    nama_tabel
  ) USING NEW.tanggal, NEW.domain, lower(btrim(NEW.kata)), NEW.jumlah;

  RETURN NULL;
END;
$$;

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
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS domain smallint', child_table);
    EXECUTE format('UPDATE %I SET domain = 1 WHERE domain IS NULL', child_table);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN domain SET DEFAULT 1', child_table);

    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', child_table, child_table || '_domain_check');
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I CHECK (domain IN (1, 2, 3, 4, 5))',
      child_table,
      child_table || '_domain_check'
    );

    EXECUTE format('DROP INDEX IF EXISTS %I', child_table || '_tanggal_kata_key');
    EXECUTE format(
      'CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I (tanggal, domain, kata)',
      child_table || '_tanggal_domain_kata_key',
      child_table
    );
  END LOOP;
END $$;
