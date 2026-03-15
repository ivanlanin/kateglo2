BEGIN;

CREATE TABLE IF NOT EXISTS kuis_kata (
  id serial PRIMARY KEY,
  pengguna_id integer NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  tanggal date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date,
  jumlah_benar integer NOT NULL DEFAULT 0,
  jumlah_pertanyaan integer NOT NULL DEFAULT 0,
  durasi_detik integer NOT NULL DEFAULT 0,
  jumlah_main integer NOT NULL DEFAULT 0,
  CONSTRAINT kuis_kata_pengguna_tanggal_key UNIQUE (pengguna_id, tanggal),
  CONSTRAINT kuis_kata_jumlah_benar_check CHECK (jumlah_benar >= 0),
  CONSTRAINT kuis_kata_jumlah_pertanyaan_check CHECK (jumlah_pertanyaan >= 0),
  CONSTRAINT kuis_kata_durasi_detik_check CHECK (durasi_detik >= 0),
  CONSTRAINT kuis_kata_jumlah_main_check CHECK (jumlah_main >= 0)
);

CREATE INDEX IF NOT EXISTS idx_kuis_kata_tanggal
  ON kuis_kata USING btree (tanggal DESC);

CREATE INDEX IF NOT EXISTS idx_kuis_kata_klasemen_harian
  ON kuis_kata USING btree (tanggal DESC, jumlah_benar DESC, durasi_detik ASC, jumlah_main DESC);

CREATE INDEX IF NOT EXISTS idx_kuis_kata_pengguna_tanggal
  ON kuis_kata USING btree (pengguna_id, tanggal DESC);

COMMIT;