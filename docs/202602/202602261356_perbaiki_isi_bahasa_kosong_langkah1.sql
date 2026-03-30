-- =============================================================================
-- Perbaikan Langkah 1: Isi bahasa kosong dengan parser token bahasa pertama
-- Tanggal: 2026-02-26 13:56
-- =============================================================================

BEGIN;

WITH frag AS (
  SELECT
    e.id,
    CASE
      WHEN STRPOS(LOWER(COALESCE(e.sumber_definisi, '')), '[<') > 0
        THEN SUBSTRING(e.sumber_definisi FROM STRPOS(LOWER(e.sumber_definisi), '[<') + 2)
      WHEN STRPOS(LOWER(COALESCE(e.sumber_definisi, '')), '(f ') > 0
        THEN SUBSTRING(e.sumber_definisi FROM STRPOS(LOWER(e.sumber_definisi), '(f ') + 3)
      ELSE NULL
    END AS potongan
  FROM etimologi e
  WHERE NULLIF(BTRIM(e.bahasa), '') IS NULL
    AND NULLIF(BTRIM(e.sumber_definisi), '') IS NOT NULL
), token AS (
  SELECT
    f.id,
    LOWER(
      BTRIM(
        SPLIT_PART(
          SPLIT_PART(
            SPLIT_PART(
              SPLIT_PART(COALESCE(f.potongan, ''), ' ', 1),
              ')',
              1
            ),
            '<',
            1
          ),
          '[',
          1
        )
      )
    ) AS token_bahasa
  FROM frag f
), mapped AS (
  SELECT
    t.id,
    CASE t.token_bahasa
      WHEN 'belanda' THEN 'Belanda'
      WHEN 'dutch' THEN 'Belanda'
      WHEN 'inggris' THEN 'Inggris'
      WHEN 'english' THEN 'Inggris'
      WHEN 'arab' THEN 'Arab'
      WHEN 'arabic' THEN 'Arab'
      WHEN 'prancis' THEN 'Prancis'
      WHEN 'french' THEN 'Prancis'
      WHEN 'latin' THEN 'Latin'
      WHEN 'yunani' THEN 'Yunani'
      WHEN 'greek' THEN 'Yunani'
      WHEN 'sanskerta' THEN 'Sanskerta'
      WHEN 'sanskrit' THEN 'Sanskerta'
      WHEN 'persia' THEN 'Persia'
      WHEN 'persian' THEN 'Persia'
      WHEN 'portugis' THEN 'Portugis'
      WHEN 'portuguese' THEN 'Portugis'
      WHEN 'spanyol' THEN 'Spanyol'
      WHEN 'spanish' THEN 'Spanyol'
      WHEN 'italia' THEN 'Italia'
      WHEN 'italian' THEN 'Italia'
      WHEN 'jerman' THEN 'Jerman'
      WHEN 'german' THEN 'Jerman'
      WHEN 'rusia' THEN 'Rusia'
      WHEN 'russian' THEN 'Rusia'
      WHEN 'hindi' THEN 'Hindi'
      WHEN 'tamil' THEN 'Tamil'
      WHEN 'jepang' THEN 'Jepang'
      WHEN 'japanese' THEN 'Jepang'
      WHEN 'mandarin' THEN 'Mandarin'
      WHEN 'kanton' THEN 'Kanton'
      WHEN 'cantonese' THEN 'Kanton'
      WHEN 'ibrani' THEN 'Ibrani'
      WHEN 'hebrew' THEN 'Ibrani'
      WHEN 'amoy' THEN 'Amoy'
      WHEN 'jawa' THEN 'Jawa'
      WHEN 'javanese' THEN 'Jawa'
      ELSE NULL
    END AS bahasa_tebakan
  FROM token t
)
UPDATE etimologi e
SET bahasa = m.bahasa_tebakan,
    updated_at = NOW()
FROM mapped m
WHERE e.id = m.id
  AND m.bahasa_tebakan IS NOT NULL
  AND NULLIF(BTRIM(e.bahasa), '') IS NULL;

COMMIT;
