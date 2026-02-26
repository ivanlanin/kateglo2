-- =============================================================================
-- Langkah 1: Isi kolom bahasa yang masih kosong dari sumber_definisi
-- Aturan: ambil bahasa pertama (sumber langsung), dengan normalisasi ke Indonesia
-- Tanggal: 2026-02-26 13:52
-- =============================================================================

BEGIN;

WITH kandidat AS (
  SELECT
    e.id,
    CASE
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Belanda|Dutch)\\b|\\(\\s*f\\s*(Belanda|Dutch)\\b)' THEN 'Belanda'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Inggris|English)\\b|\\(\\s*f\\s*(Inggris|English)\\b)' THEN 'Inggris'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Inggris Amerika|American-English)\\b|\\(\\s*f\\s*(Inggris Amerika|American-English)\\b)' THEN 'Inggris Amerika'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Arab|Arabic)\\b|\\(\\s*f\\s*(Arab|Arabic)\\b)' THEN 'Arab'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Prancis|French)\\b|\\(\\s*f\\s*(Prancis|French)\\b)' THEN 'Prancis'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Latin)\\b|\\(\\s*f\\s*(Latin)\\b)' THEN 'Latin'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Yunani|Greek)\\b|\\(\\s*f\\s*(Yunani|Greek)\\b)' THEN 'Yunani'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Sanskerta|Sanskrit)\\b|\\(\\s*f\\s*(Sanskerta|Sanskrit)\\b)' THEN 'Sanskerta'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Persia|Persian)\\b|\\(\\s*f\\s*(Persia|Persian)\\b)' THEN 'Persia'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Portugis|Portuguese)\\b|\\(\\s*f\\s*(Portugis|Portuguese)\\b)' THEN 'Portugis'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Spanyol|Spanish)\\b|\\(\\s*f\\s*(Spanyol|Spanish)\\b)' THEN 'Spanyol'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Italia|Italian)\\b|\\(\\s*f\\s*(Italia|Italian)\\b)' THEN 'Italia'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Jerman|German)\\b|\\(\\s*f\\s*(Jerman|German)\\b)' THEN 'Jerman'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Rusia|Russian)\\b|\\(\\s*f\\s*(Rusia|Russian)\\b)' THEN 'Rusia'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Hindi)\\b|\\(\\s*f\\s*(Hindi)\\b)' THEN 'Hindi'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Tamil)\\b|\\(\\s*f\\s*(Tamil)\\b)' THEN 'Tamil'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Jepang|Japanese)\\b|\\(\\s*f\\s*(Jepang|Japanese)\\b)' THEN 'Jepang'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Mandarin)\\b|\\(\\s*f\\s*(Mandarin)\\b)' THEN 'Mandarin'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Kanton|Cantonese)\\b|\\(\\s*f\\s*(Kanton|Cantonese)\\b)' THEN 'Kanton'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Ibrani|Hebrew)\\b|\\(\\s*f\\s*(Ibrani|Hebrew)\\b)' THEN 'Ibrani'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Amoy)\\b|\\(\\s*f\\s*(Amoy)\\b)' THEN 'Amoy'
      WHEN e.sumber_definisi ~* E'(\\[\\s*<\\s*(Jawa|Javanese)\\b|\\(\\s*f\\s*(Jawa|Javanese)\\b)' THEN 'Jawa'
      ELSE NULL
    END AS bahasa_tebakan
  FROM etimologi e
  WHERE NULLIF(BTRIM(e.bahasa), '') IS NULL
    AND NULLIF(BTRIM(e.sumber_definisi), '') IS NOT NULL
)
UPDATE etimologi e
SET bahasa = k.bahasa_tebakan,
    updated_at = NOW()
FROM kandidat k
WHERE e.id = k.id
  AND k.bahasa_tebakan IS NOT NULL;

COMMIT;
