-- Hapus pembatas kategori pada tabel label
-- Alasan: memungkinkan kategori baru (mis. 'sumber') ditambahkan tanpa perubahan constraint.

BEGIN;

ALTER TABLE label
  DROP CONSTRAINT IF EXISTS label_kategori_check;

COMMIT;
