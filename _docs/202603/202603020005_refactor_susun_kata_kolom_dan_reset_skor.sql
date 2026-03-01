-- Refactor kolom Susun Kata + reset data skor agar permainan bisa diulang

ALTER TABLE susun_kata
  DROP COLUMN IF EXISTS sumber,
  DROP COLUMN IF EXISTS diubah_oleh;

ALTER TABLE susun_kata
  RENAME COLUMN keterangan_admin TO keterangan;

ALTER TABLE susun_kata_skor
  RENAME COLUMN waktu_detik TO detik;

ALTER TABLE susun_kata_skor
  ADD COLUMN IF NOT EXISTS tebakan text NOT NULL DEFAULT '';

DROP INDEX IF EXISTS idx_susun_kata_skor_harian;
CREATE INDEX idx_susun_kata_skor_harian
  ON susun_kata_skor USING btree (susun_kata_id, menang DESC, percobaan ASC, detik ASC);

TRUNCATE TABLE susun_kata_skor;
