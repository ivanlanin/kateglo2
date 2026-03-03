-- Normalisasi tagar.kode agar notasi afiks eksplisit dengan tanda hubung
-- Prefiks: meng -> meng-, di -> di-, ke -> ke-, dst.
-- Sufiks: an -> -an, kan -> -kan, i -> -i, dst.

BEGIN;

UPDATE tagar
SET
  kode = CONCAT(REGEXP_REPLACE(kode, '-+$', ''), '-'),
  nama = CONCAT(REGEXP_REPLACE(nama, '-+$', ''), '-')
WHERE kategori = 'prefiks'
  AND kode NOT LIKE '%-';

UPDATE tagar
SET
  kode = CONCAT('-', REGEXP_REPLACE(kode, '^-+', '')),
  nama = CONCAT('-', REGEXP_REPLACE(nama, '^-+', ''))
WHERE kategori = 'sufiks'
  AND kode NOT LIKE '-%';

COMMIT;
