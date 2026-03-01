-- Refactor quoting dynamic SQL pada pencarian_route
-- Tujuan: menghindari rawan salah escape petik tunggal pada EXECUTE format

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
    $fmt$
    CREATE TABLE IF NOT EXISTS %1$I (
      CHECK (tanggal >= date %2$L AND tanggal < date %3$L),
      CHECK (domain IN (1, 2, 3, 4, 5))
    ) INHERITS (pencarian)
    $fmt$,
    nama_tabel,
    awal_bulan,
    akhir_bulan
  );

  EXECUTE format(
    $fmt$
    CREATE UNIQUE INDEX IF NOT EXISTS %1$I ON %2$I (tanggal, domain, kata)
    $fmt$,
    nama_tabel || '_tanggal_domain_kata_key',
    nama_tabel
  );

  EXECUTE format(
    $fmt$
    INSERT INTO %1$I (tanggal, domain, kata, jumlah, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (tanggal, domain, kata)
    DO UPDATE SET
      jumlah = %1$I.jumlah + EXCLUDED.jumlah,
      created_at = LEAST(%1$I.created_at, EXCLUDED.created_at),
      updated_at = GREATEST(%1$I.updated_at, EXCLUDED.updated_at)
    $fmt$,
    nama_tabel
  ) USING NEW.tanggal, NEW.domain, lower(btrim(NEW.kata)), NEW.jumlah, NEW.created_at, NEW.updated_at;

  RETURN NULL;
END;
$$;
