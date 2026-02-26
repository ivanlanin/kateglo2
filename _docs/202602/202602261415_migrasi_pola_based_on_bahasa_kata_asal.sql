-- =============================================================================
-- Migrasi: Isi bahasa + kata_asal dari pola "[based on <bahasa> <kata_asal>]"
-- Tanggal: 2026-02-26 14:15
-- =============================================================================

BEGIN;

WITH extracted AS (
  SELECT
    e.id,
    LOWER(NULLIF(BTRIM(SPLIT_PART(BTRIM(SPLIT_PART(SPLIT_PART(e.sumber_definisi, '[based on ', 2), ']', 1)), ' ', 1)), '')) AS bahasa_token,
    NULLIF(
      BTRIM(
        SPLIT_PART(
          SPLIT_PART(
            BTRIM(
              SUBSTRING(
                BTRIM(SPLIT_PART(SPLIT_PART(e.sumber_definisi, '[based on ', 2), ']', 1))
                FROM LENGTH(SPLIT_PART(BTRIM(SPLIT_PART(SPLIT_PART(e.sumber_definisi, '[based on ', 2), ']', 1)), ' ', 1)) + 1
              )
            ),
            '(<',
            1
          ),
          '(',
          1
        )
      ),
      ''
    ) AS kata_token
  FROM etimologi e
  WHERE NULLIF(BTRIM(e.sumber_definisi), '') IS NOT NULL
    AND LOWER(e.sumber_definisi) LIKE '%[based on %'
), mapped AS (
  SELECT
    ex.id,
    CASE ex.bahasa_token
      WHEN 'english' THEN 'Inggris'
      WHEN 'inggris' THEN 'Inggris'
      WHEN 'dutch' THEN 'Belanda'
      WHEN 'belanda' THEN 'Belanda'
      WHEN 'french' THEN 'Prancis'
      WHEN 'prancis' THEN 'Prancis'
      WHEN 'arabic' THEN 'Arab'
      WHEN 'arab' THEN 'Arab'
      WHEN 'latin' THEN 'Latin'
      WHEN 'greek' THEN 'Yunani'
      WHEN 'yunani' THEN 'Yunani'
      WHEN 'sanskrit' THEN 'Sanskerta'
      WHEN 'sanskerta' THEN 'Sanskerta'
      WHEN 'persian' THEN 'Persia'
      WHEN 'persia' THEN 'Persia'
      WHEN 'portuguese' THEN 'Portugis'
      WHEN 'portugis' THEN 'Portugis'
      WHEN 'spanish' THEN 'Spanyol'
      WHEN 'spanyol' THEN 'Spanyol'
      WHEN 'italian' THEN 'Italia'
      WHEN 'italia' THEN 'Italia'
      WHEN 'german' THEN 'Jerman'
      WHEN 'jerman' THEN 'Jerman'
      WHEN 'russian' THEN 'Rusia'
      WHEN 'rusia' THEN 'Rusia'
      WHEN 'hindi' THEN 'Hindi'
      WHEN 'tamil' THEN 'Tamil'
      WHEN 'japanese' THEN 'Jepang'
      WHEN 'jepang' THEN 'Jepang'
      WHEN 'mandarin' THEN 'Mandarin'
      WHEN 'cantonese' THEN 'Kanton'
      WHEN 'kanton' THEN 'Kanton'
      WHEN 'hebrew' THEN 'Ibrani'
      WHEN 'ibrani' THEN 'Ibrani'
      WHEN 'amoy' THEN 'Amoy'
      WHEN 'javanese' THEN 'Jawa'
      WHEN 'jawa' THEN 'Jawa'
      ELSE NULL
    END AS bahasa_baru,
    ex.kata_token AS kata_asal_baru
  FROM extracted ex
)
UPDATE etimologi e
SET bahasa = CASE
      WHEN NULLIF(BTRIM(e.bahasa), '') IS NULL AND m.bahasa_baru IS NOT NULL THEN m.bahasa_baru
      ELSE e.bahasa
    END,
    kata_asal = CASE
      WHEN NULLIF(BTRIM(e.kata_asal), '') IS NULL AND m.kata_asal_baru IS NOT NULL THEN m.kata_asal_baru
      ELSE e.kata_asal
    END,
    updated_at = NOW()
FROM mapped m
WHERE e.id = m.id
  AND (
    (NULLIF(BTRIM(e.bahasa), '') IS NULL AND m.bahasa_baru IS NOT NULL)
    OR (NULLIF(BTRIM(e.kata_asal), '') IS NULL AND m.kata_asal_baru IS NOT NULL)
  );

COMMIT;
