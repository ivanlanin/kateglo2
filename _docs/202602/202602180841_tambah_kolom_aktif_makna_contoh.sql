-- Tambah kolom status aktif untuk makna dan contoh
ALTER TABLE makna
  ADD COLUMN IF NOT EXISTS aktif boolean NOT NULL DEFAULT true;

ALTER TABLE contoh
  ADD COLUMN IF NOT EXISTS aktif boolean NOT NULL DEFAULT true;
