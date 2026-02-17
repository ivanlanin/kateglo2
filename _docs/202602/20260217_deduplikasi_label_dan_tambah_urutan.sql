-- Deduplikasi label kategori tertentu + tambah kolom urutan
-- Tanggal: 2026-02-17

BEGIN;

-- Hapus label lama yang kode = nama pada kategori target
DELETE FROM label
WHERE kategori IN ('kelas-kata', 'kelas_kata', 'ragam', 'bahasa', 'bidang')
  AND LOWER(TRIM(kode)) = LOWER(TRIM(nama));

-- Tambah kolom urutan untuk pengurutan tampilan dropdown
ALTER TABLE label
  ADD COLUMN IF NOT EXISTS urutan integer;

UPDATE label
SET urutan = 1
WHERE urutan IS NULL;

ALTER TABLE label
  ALTER COLUMN urutan SET DEFAULT 1,
  ALTER COLUMN urutan SET NOT NULL;

COMMIT;
