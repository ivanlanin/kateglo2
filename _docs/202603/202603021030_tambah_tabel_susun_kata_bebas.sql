BEGIN;

CREATE TABLE IF NOT EXISTS susun_kata_bebas (
  id serial PRIMARY KEY,
  tanggal date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date,
  panjang integer NOT NULL,
  kata text NOT NULL,
  pengguna_id integer REFERENCES pengguna(id) ON DELETE CASCADE NOT NULL,
  percobaan integer NOT NULL,
  tebakan text NOT NULL DEFAULT ''::text,
  detik integer NOT NULL,
  menang boolean NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT susun_kata_bebas_kata_check CHECK (kata ~ '^[a-z]+$'::text),
  CONSTRAINT susun_kata_bebas_kata_panjang_check CHECK (char_length(kata) = panjang),
  CONSTRAINT susun_kata_bebas_panjang_check CHECK (panjang >= 4 AND panjang <= 6),
  CONSTRAINT susun_kata_bebas_percobaan_check CHECK (percobaan >= 1 AND percobaan <= 6),
  CONSTRAINT susun_kata_bebas_detik_check CHECK (detik >= 0)
);

CREATE INDEX IF NOT EXISTS idx_susun_kata_bebas_created_at
  ON susun_kata_bebas USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_susun_kata_bebas_pengguna_created
  ON susun_kata_bebas USING btree (pengguna_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_susun_kata_bebas_klasemen
  ON susun_kata_bebas USING btree (menang, percobaan, detik, created_at);

COMMIT;
