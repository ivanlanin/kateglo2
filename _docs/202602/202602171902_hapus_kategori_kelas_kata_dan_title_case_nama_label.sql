-- Hapus kategori label legacy 'kelas_kata' dan normalisasi nama label ke Title Case
-- Tanggal: 2026-02-17

BEGIN;

DELETE FROM label
WHERE kategori = 'kelas_kata';

UPDATE label
SET nama = INITCAP(REGEXP_REPLACE(LOWER(TRIM(nama)), '\s+', ' ', 'g'))
WHERE nama IS NOT NULL
  AND TRIM(nama) <> '';

COMMIT;
