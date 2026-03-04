BEGIN;

UPDATE tagar
SET kategori = 'konfiks'
WHERE LOWER(TRIM(COALESCE(kategori, ''))) IN ('prakategorial', 'prekategorial');

COMMIT;
