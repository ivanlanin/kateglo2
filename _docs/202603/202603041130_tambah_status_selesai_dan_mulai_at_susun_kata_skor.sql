-- Tambah dukungan progres in-progress untuk Susun Kata harian

ALTER TABLE susun_kata_skor
  ADD COLUMN IF NOT EXISTS selesai boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS mulai_at timestamp without time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_susun_kata_skor_selesai
  ON susun_kata_skor USING btree (susun_kata_id, pengguna_id, selesai);

UPDATE susun_kata_skor
SET
  selesai = true,
  mulai_at = COALESCE(mulai_at, created_at, now()),
  updated_at = COALESCE(updated_at, created_at, now())
WHERE selesai IS DISTINCT FROM true
   OR mulai_at IS NULL
   OR updated_at IS NULL;
