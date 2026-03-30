-- Tambah kolom status aktif untuk glosarium dan tesaurus
ALTER TABLE glosarium
  ADD COLUMN IF NOT EXISTS aktif boolean NOT NULL DEFAULT true;

ALTER TABLE tesaurus
  ADD COLUMN IF NOT EXISTS aktif boolean NOT NULL DEFAULT true;
