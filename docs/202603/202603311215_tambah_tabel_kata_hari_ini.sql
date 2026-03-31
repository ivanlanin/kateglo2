CREATE TABLE IF NOT EXISTS kata_hari_ini (
  id serial PRIMARY KEY,
  tanggal date NOT NULL,
  entri_id integer REFERENCES entri(id) ON DELETE RESTRICT ON UPDATE CASCADE NOT NULL,
  indeks text NOT NULL,
  entri text NOT NULL,
  kelas_kata text,
  makna text NOT NULL,
  contoh text,
  pemenggalan text,
  lafal text,
  etimologi_bahasa text,
  etimologi_kata_asal text,
  mode_pemilihan text NOT NULL DEFAULT 'auto',
  catatan_admin text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT kata_hari_ini_tanggal_key UNIQUE (tanggal),
  CONSTRAINT kata_hari_ini_mode_pemilihan_check CHECK (mode_pemilihan IN ('auto', 'admin')),
  CONSTRAINT kata_hari_ini_indeks_check CHECK (TRIM(BOTH FROM indeks) <> ''),
  CONSTRAINT kata_hari_ini_entri_check CHECK (TRIM(BOTH FROM entri) <> ''),
  CONSTRAINT kata_hari_ini_makna_check CHECK (TRIM(BOTH FROM makna) <> '')
);

CREATE INDEX IF NOT EXISTS idx_kata_hari_ini_entri_id ON kata_hari_ini USING btree (entri_id);
CREATE INDEX IF NOT EXISTS idx_kata_hari_ini_mode_tanggal ON kata_hari_ini USING btree (mode_pemilihan, tanggal DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_set_timestamp_fields__kata_hari_ini'
  ) THEN
    CREATE TRIGGER trg_set_timestamp_fields__kata_hari_ini
      BEFORE INSERT OR UPDATE ON kata_hari_ini
      FOR EACH ROW
      EXECUTE FUNCTION set_timestamp_fields();
  END IF;
END
$$;