-- =============================================================================
-- Langkah 3: Isi kolom arti_asal
-- Aturan:
--   - arti_en diambil dari sumber_definisi (bagian gloss sebelum blok etimologi [< ...])
--   - arti_id diambil dari makna aktif pertama entri terkait (jika ada)
--   - format akhir: "Indonesia (Inggris)"
--   - jika arti_id belum ada: "(-) (Inggris)"
-- Tanggal: 2026-02-26 13:54
-- =============================================================================

BEGIN;

WITH makna_utama AS (
  SELECT DISTINCT ON (m.entri_id)
    m.entri_id,
    NULLIF(BTRIM(regexp_replace(regexp_replace(COALESCE(m.makna, ''), '<[^>]*>', '', 'g'), E'\\s+', ' ', 'g')), '') AS arti_id
  FROM makna m
  WHERE m.aktif = TRUE
  ORDER BY m.entri_id, COALESCE(m.polisem, 1), m.id
), gloss_en AS (
  SELECT
    e.id,
    NULLIF(
      BTRIM(
        regexp_replace(
          regexp_replace(COALESCE(e.sumber_definisi, ''), E'\\s*\\[[^\\]]*\\]\\s*$', ''),
          E'\\s+',
          ' ',
          'g'
        )
      ),
      ''
    ) AS arti_en,
    mu.arti_id
  FROM etimologi e
  LEFT JOIN makna_utama mu ON mu.entri_id = e.entri_id
)
UPDATE etimologi e
SET arti_asal = CASE
    WHEN g.arti_id IS NOT NULL AND g.arti_en IS NOT NULL THEN CONCAT(g.arti_id, ' (', g.arti_en, ')')
    WHEN g.arti_id IS NOT NULL THEN g.arti_id
    WHEN g.arti_en IS NOT NULL THEN CONCAT('(-) (', g.arti_en, ')')
    ELSE NULL
  END,
  updated_at = NOW()
FROM gloss_en g
WHERE e.id = g.id;

COMMIT;
