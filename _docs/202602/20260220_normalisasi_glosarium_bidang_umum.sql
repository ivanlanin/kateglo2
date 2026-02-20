BEGIN;

UPDATE glosarium
SET bidang = 'umum'
WHERE bidang IS NOT NULL
  AND TRIM(LOWER(bidang)) LIKE '%umum%'
  AND TRIM(LOWER(bidang)) <> 'umum';

COMMIT;
