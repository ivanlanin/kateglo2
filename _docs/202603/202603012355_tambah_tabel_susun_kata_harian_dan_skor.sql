-- Tabel kata harian Susun Kata dan skor pemain

CREATE TABLE IF NOT EXISTS susun_kata (
  id serial PRIMARY KEY,
  tanggal date NOT NULL,
  panjang integer NOT NULL,
  kata text NOT NULL,
  sumber text NOT NULL DEFAULT 'auto',
  diubah_oleh integer REFERENCES pengguna(id) ON DELETE SET NULL,
  keterangan_admin text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT susun_kata_tanggal_panjang_key UNIQUE (tanggal, panjang),
  CONSTRAINT susun_kata_panjang_check CHECK (panjang BETWEEN 4 AND 8),
  CONSTRAINT susun_kata_kata_check CHECK (kata ~ '^[a-z]+$'),
  CONSTRAINT susun_kata_kata_panjang_check CHECK (char_length(kata) = panjang),
  CONSTRAINT susun_kata_sumber_check CHECK (sumber IN ('auto', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_susun_kata_tanggal ON susun_kata USING btree (tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_susun_kata_panjang_tanggal ON susun_kata USING btree (panjang, tanggal DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_timestamp_fields') THEN
    DROP TRIGGER IF EXISTS trg_set_timestamp_fields__susun_kata ON susun_kata;
    CREATE TRIGGER trg_set_timestamp_fields__susun_kata
      BEFORE INSERT OR UPDATE ON susun_kata
      FOR EACH ROW
      EXECUTE FUNCTION set_timestamp_fields();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS susun_kata_skor (
  id serial PRIMARY KEY,
  susun_kata_id integer NOT NULL REFERENCES susun_kata(id) ON DELETE CASCADE,
  pengguna_id integer NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  percobaan integer NOT NULL,
  waktu_detik integer NOT NULL,
  menang boolean NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT susun_kata_skor_unik_harian_user UNIQUE (susun_kata_id, pengguna_id),
  CONSTRAINT susun_kata_skor_percobaan_check CHECK (percobaan BETWEEN 1 AND 6),
  CONSTRAINT susun_kata_skor_waktu_check CHECK (waktu_detik >= 0)
);

CREATE INDEX IF NOT EXISTS idx_susun_kata_skor_harian ON susun_kata_skor USING btree (susun_kata_id, menang DESC, percobaan ASC, waktu_detik ASC);
CREATE INDEX IF NOT EXISTS idx_susun_kata_skor_pengguna ON susun_kata_skor USING btree (pengguna_id, created_at DESC);
