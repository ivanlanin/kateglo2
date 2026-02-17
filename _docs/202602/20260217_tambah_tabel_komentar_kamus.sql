BEGIN;

CREATE TABLE IF NOT EXISTS komentar_kamus (
  id SERIAL PRIMARY KEY,
  indeks TEXT NOT NULL,
  pengguna_id INTEGER NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  komentar TEXT NOT NULL,
  aktif BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT komentar_kamus_indeks_pengguna_key UNIQUE (indeks, pengguna_id),
  CONSTRAINT komentar_kamus_indeks_check CHECK (TRIM(BOTH FROM indeks) <> ''),
  CONSTRAINT komentar_kamus_komentar_check CHECK (TRIM(BOTH FROM komentar) <> '')
);

CREATE INDEX IF NOT EXISTS idx_komentar_kamus_indeks
  ON komentar_kamus USING btree (indeks);

CREATE INDEX IF NOT EXISTS idx_komentar_kamus_indeks_aktif
  ON komentar_kamus USING btree (indeks, aktif);

CREATE INDEX IF NOT EXISTS idx_komentar_kamus_pengguna_id
  ON komentar_kamus USING btree (pengguna_id);

CREATE INDEX IF NOT EXISTS idx_komentar_kamus_updated_at
  ON komentar_kamus USING btree (updated_at DESC);

COMMIT;
