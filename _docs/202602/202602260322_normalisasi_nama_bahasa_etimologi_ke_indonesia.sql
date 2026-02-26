-- =============================================================================
-- Migrasi: Normalisasi nama bahasa etimologi ke bahasa Indonesia
-- Tanggal: 2026-02-26
-- Cakupan:
--   1) etimologi.bahasa
--   2) sebutan bahasa di etimologi.sumber_definisi
-- =============================================================================

BEGIN;

-- 1) Normalisasi kolom bahasa
WITH cleaned AS (
  SELECT
    id,
    NULLIF(BTRIM(regexp_replace(COALESCE(bahasa, ''), '<[^>]*>', '', 'g')), '') AS bahasa_bersih
  FROM etimologi
), mapped AS (
  SELECT
    id,
    CASE LOWER(bahasa_bersih)
      WHEN 'arabic' THEN 'Arab'
      WHEN 'american-english' THEN 'Inggris Amerika'
      WHEN 'dutch' THEN 'Belanda'
      WHEN 'english' THEN 'Inggris'
      WHEN 'sanskrit' THEN 'Sanskerta'
      WHEN 'persian' THEN 'Persia'
      WHEN 'portuguese' THEN 'Portugis'
      WHEN 'latin' THEN 'Latin'
      WHEN 'tamil' THEN 'Tamil'
      WHEN 'hindi' THEN 'Hindi'
      WHEN 'japanese' THEN 'Jepang'
      WHEN 'chiangchiu' THEN 'Chiangchiu'
      WHEN 'italian' THEN 'Italia'
      WHEN 'greek' THEN 'Yunani'
      WHEN 'french' THEN 'Prancis'
      WHEN 'cantonese' THEN 'Kanton'
      WHEN 'foochow' THEN 'Foochow'
      WHEN 'hakka' THEN 'Hakka'
      WHEN 'german' THEN 'Jerman'
      WHEN 'javanese' THEN 'Jawa'
      WHEN 'mandarin' THEN 'Mandarin'
      WHEN 'russian' THEN 'Rusia'
      WHEN 'spanish' THEN 'Spanyol'
      WHEN 'thai' THEN 'Thai'
      WHEN 'ningpo' THEN 'Ningpo'
      WHEN 'tsoanchiu' THEN 'Tsoanchiu'
      WHEN 'amoy' THEN 'Amoy'
      WHEN 'amoy?' THEN 'Amoy'
      WHEN 'amoy/ts' THEN 'Amoy/Ts'
      WHEN 'chinese.a' THEN 'Tionghoa'
      WHEN 'hebrew' THEN 'Ibrani'
      WHEN 'teochew' THEN 'Teochew'
      WHEN 'tong''an' THEN 'Tong''an'
      WHEN 'tong''an/a' THEN 'Tong''an/A'
      ELSE bahasa_bersih
    END AS bahasa_id
  FROM cleaned
)
UPDATE etimologi e
SET bahasa = m.bahasa_id,
    updated_at = NOW()
FROM mapped m
WHERE e.id = m.id
  AND COALESCE(e.bahasa, '') IS DISTINCT FROM COALESCE(m.bahasa_id, '');

UPDATE etimologi
SET bahasa = 'Arab',
    updated_at = NOW()
WHERE bahasa IS NOT NULL
  AND bahasa ~* '^arabic';

-- 2) Normalisasi sebutan bahasa di sumber_definisi
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT *
    FROM (VALUES
      ('American-English', 'Inggris Amerika'),
      ('Arabic', 'Arab'),
      ('Dutch', 'Belanda'),
      ('English', 'Inggris'),
      ('Sanskrit', 'Sanskerta'),
      ('Persian', 'Persia'),
      ('Portuguese', 'Portugis'),
      ('Italian', 'Italia'),
      ('French', 'Prancis'),
      ('German', 'Jerman'),
      ('Greek', 'Yunani'),
      ('Spanish', 'Spanyol'),
      ('Russian', 'Rusia'),
      ('Japanese', 'Jepang'),
      ('Javanese', 'Jawa'),
      ('Cantonese', 'Kanton'),
      ('Hebrew', 'Ibrani'),
      ('Turkish', 'Turki'),
      ('Czech', 'Ceko'),
      ('Chinese', 'Tionghoa')
    ) AS t(src, dst)
  LOOP
    UPDATE etimologi
    SET sumber_definisi = regexp_replace(sumber_definisi, E'\\m' || rec.src || E'\\M', rec.dst, 'gi'),
        updated_at = NOW()
    WHERE sumber_definisi IS NOT NULL
      AND sumber_definisi ~* (E'\\m' || rec.src || E'\\M');
  END LOOP;
END $$;

COMMIT;
