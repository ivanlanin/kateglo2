-- =============================================================================
-- Langkah 2: Isi kolom kata_asal
-- Aturan:
--   1) sumber_aksara + sumber_isi -> "<aksara> <latin>"
--   2) sumber_aksara saja
--   3) sumber_isi saja
--   4) fallback parse dari sumber_definisi
-- Tanggal: 2026-02-26 13:53
-- =============================================================================

BEGIN;

WITH fallback_parse AS (
  SELECT
    e.id,
    NULLIF(
      BTRIM(
        regexp_replace(
          COALESCE(
            (regexp_match(
              e.sumber_definisi,
              E'\\[\\s*<\\s*[^\\]\\(<]+?\\s+([^\\]\\(<]+?)\\s*(?:\\(|<|\\])'
            ))[1],
            ''
          ),
          E'\\s{2,}',
          ' ',
          'g'
        )
      ),
      ''
    ) AS kata_fallback
  FROM etimologi e
)
UPDATE etimologi e
SET kata_asal = CASE
    WHEN NULLIF(BTRIM(e.sumber_aksara), '') IS NOT NULL
      AND NULLIF(BTRIM(e.sumber_isi), '') IS NOT NULL
      THEN CONCAT(BTRIM(e.sumber_aksara), ' ', BTRIM(e.sumber_isi))
    WHEN NULLIF(BTRIM(e.sumber_aksara), '') IS NOT NULL
      THEN BTRIM(e.sumber_aksara)
    WHEN NULLIF(BTRIM(e.sumber_isi), '') IS NOT NULL
      THEN BTRIM(e.sumber_isi)
    ELSE f.kata_fallback
  END,
  updated_at = NOW()
FROM fallback_parse f
WHERE e.id = f.id;

COMMIT;
