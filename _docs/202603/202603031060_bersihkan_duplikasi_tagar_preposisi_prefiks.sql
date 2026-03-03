-- Bersihkan tagar prefiks yang duplikat saat tagar preposisi sudah ada
-- Jika entri sudah punya 'ke' (preposisi), hapus 'ke-' (prefiks)
-- Jika entri sudah punya 'di' (preposisi), hapus 'di-' (prefiks)

BEGIN;

WITH kode_tagar AS (
  SELECT
    MAX(CASE WHEN kode = 'ke' THEN id END) AS ke_id,
    MAX(CASE WHEN kode = 'ke-' THEN id END) AS ke_prefiks_id,
    MAX(CASE WHEN kode = 'di' THEN id END) AS di_id,
    MAX(CASE WHEN kode = 'di-' THEN id END) AS di_prefiks_id
  FROM tagar
)
DELETE FROM entri_tagar et
USING kode_tagar kt
WHERE (
  et.tagar_id = kt.ke_prefiks_id
  AND EXISTS (
    SELECT 1
    FROM entri_tagar et2
    WHERE et2.entri_id = et.entri_id
      AND et2.tagar_id = kt.ke_id
  )
) OR (
  et.tagar_id = kt.di_prefiks_id
  AND EXISTS (
    SELECT 1
    FROM entri_tagar et2
    WHERE et2.entri_id = et.entri_id
      AND et2.tagar_id = kt.di_id
  )
);

COMMIT;
