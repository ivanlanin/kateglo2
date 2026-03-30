-- Sistem pelacakan kata terpopuler (minimal, efisien)
-- Referensi: docs/202602/202602232254_sistem-pelacakan-kata-terpopuler-efisien.md

CREATE TABLE IF NOT EXISTS pencarian (
  tanggal date NOT NULL,
  kata text NOT NULL,
  jumlah integer NOT NULL DEFAULT 0,
  CONSTRAINT pencarian_jumlah_check CHECK (jumlah >= 0)
);

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

  nama_tabel := format('pencarian_%s', to_char(NEW.tanggal, 'YYYYMM'));
  awal_bulan := date_trunc('month', NEW.tanggal)::date;
  akhir_bulan := (date_trunc('month', NEW.tanggal) + interval '1 month')::date;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I (
      CHECK (tanggal >= date %L AND tanggal < date %L)
    ) INHERITS (pencarian)',
    nama_tabel, awal_bulan, akhir_bulan
  );

  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I (tanggal, kata)',
    nama_tabel || '_tanggal_kata_key',
    nama_tabel
  );

  EXECUTE format(
    'INSERT INTO %I (tanggal, kata, jumlah)
     VALUES ($1, $2, $3)
     ON CONFLICT (tanggal, kata)
     DO UPDATE SET jumlah = %I.jumlah + EXCLUDED.jumlah',
    nama_tabel,
    nama_tabel
  ) USING NEW.tanggal, lower(btrim(NEW.kata)), NEW.jumlah;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_pencarian_route ON pencarian;

CREATE TRIGGER trg_pencarian_route
BEFORE INSERT ON pencarian
FOR EACH ROW
EXECUTE FUNCTION pencarian_route();
