-- Hapus data legacy label kategori sumber.
-- Sumber sekarang dikelola oleh tabel master `sumber`.

BEGIN;

DELETE FROM label
WHERE kategori = 'sumber';

COMMIT;