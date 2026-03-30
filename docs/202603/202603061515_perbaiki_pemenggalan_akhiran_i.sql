-- Memisahkan akhiran -i pada pemenggalan entri turunan bertagar -i.
-- Contoh: meng.i.ringi → meng.i.ring.i

BEGIN;

WITH target AS (
  SELECT DISTINCT e.id
  FROM entri e
  JOIN entri_tagar et ON et.entri_id = e.id
  JOIN tagar t ON t.id = et.tagar_id
  WHERE e.jenis = 'turunan'
    AND t.kode = '-i'
    AND e.pemenggalan IS NOT NULL
    AND BTRIM(e.pemenggalan) <> ''
    AND RIGHT(BTRIM(e.pemenggalan), 2) <> '.i'
    AND BTRIM(e.pemenggalan) ~ 'i$'
)
UPDATE entri e
SET pemenggalan = REGEXP_REPLACE(BTRIM(e.pemenggalan), 'i$', '.i')
FROM target
WHERE e.id = target.id;

COMMIT;
