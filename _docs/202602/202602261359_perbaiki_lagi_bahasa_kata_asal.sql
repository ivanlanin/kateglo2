-- =============================================================================
-- Perbaikan lanjutan: bahasa + kata_asal
-- Tanggal: 2026-02-26 13:59
-- =============================================================================

BEGIN;

-- A) Bahasa kosong: ambil token bahasa pertama dari [< ...] atau (f ...)
WITH token_bahasa AS (
  SELECT
    e.id,
    LOWER(COALESCE(
      SUBSTRING(e.sumber_definisi FROM E'\\[\\s*<\\s*([A-Za-zÀ-ÿ-]+)'),
      SUBSTRING(e.sumber_definisi FROM E'\\(\\s*f\\s*([A-Za-zÀ-ÿ-]+)')
    )) AS token
  FROM etimologi e
  WHERE NULLIF(BTRIM(e.bahasa), '') IS NULL
    AND NULLIF(BTRIM(e.sumber_definisi), '') IS NOT NULL
), mapped AS (
  SELECT
    t.id,
    CASE t.token
      WHEN 'dutch' THEN 'Belanda'
      WHEN 'belanda' THEN 'Belanda'
      WHEN 'english' THEN 'Inggris'
      WHEN 'inggris' THEN 'Inggris'
      WHEN 'arabic' THEN 'Arab'
      WHEN 'arab' THEN 'Arab'
      WHEN 'french' THEN 'Prancis'
      WHEN 'prancis' THEN 'Prancis'
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
    END AS bahasa_baru
  FROM token_bahasa t
)
UPDATE etimologi e
SET bahasa = m.bahasa_baru,
    updated_at = NOW()
FROM mapped m
WHERE e.id = m.id
  AND m.bahasa_baru IS NOT NULL
  AND NULLIF(BTRIM(e.bahasa), '') IS NULL;

-- B) Kata asal: bersihkan fallback yang masih membawa rantai bahasa (< ...)
WITH frag AS (
  SELECT
    e.id,
    BTRIM(
      SPLIT_PART(
        SPLIT_PART(
          COALESCE(e.sumber_definisi, ''),
          '[<',
          2
        ),
        '] ',
        1
      )
    ) AS frag_def
  FROM etimologi e
  WHERE NULLIF(BTRIM(e.kata_asal), '') IS NULL
     OR e.kata_asal LIKE '%<%'
), kandidat AS (
  SELECT
    e.id,
    CASE
      WHEN NULLIF(BTRIM(e.sumber_aksara), '') IS NOT NULL
        AND NULLIF(BTRIM(e.sumber_isi), '') IS NOT NULL
        THEN CONCAT(BTRIM(e.sumber_aksara), ' ', BTRIM(e.sumber_isi))
      WHEN NULLIF(BTRIM(e.sumber_aksara), '') IS NOT NULL
        THEN BTRIM(e.sumber_aksara)
      WHEN NULLIF(BTRIM(e.sumber_isi), '') IS NOT NULL
        THEN BTRIM(e.sumber_isi)
      WHEN NULLIF(BTRIM(f.frag_def), '') IS NOT NULL
        THEN NULLIF(BTRIM(SUBSTRING(f.frag_def FROM E'([^\\s]+)$')), '')
      ELSE NULL
    END AS kata_baru
  FROM etimologi e
  LEFT JOIN frag f ON f.id = e.id
)
UPDATE etimologi e
SET kata_asal = k.kata_baru,
    updated_at = NOW()
FROM kandidat k
WHERE e.id = k.id
  AND k.kata_baru IS NOT NULL
  AND (
    NULLIF(BTRIM(e.kata_asal), '') IS NULL
    OR e.kata_asal LIKE '%<%'
  );

COMMIT;
