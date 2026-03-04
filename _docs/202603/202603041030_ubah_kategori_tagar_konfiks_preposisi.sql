-- Ubah kategori tagar konfiks dan preposisi agar konsisten dengan klasifikasi terbaru

BEGIN;

UPDATE tagar
SET kategori = 'konfiks'
WHERE kode IN ('ber--an', 'ke--an', 'per--an', 'peng--an');

UPDATE tagar
SET kategori = 'preposisi'
WHERE kode IN ('ke', 'di');

COMMIT;
