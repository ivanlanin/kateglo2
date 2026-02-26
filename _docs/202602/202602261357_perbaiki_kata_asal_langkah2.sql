-- =============================================================================
-- Perbaikan Langkah 2: Perbaiki fallback kata_asal agar tidak menangkap token "or"
-- Tanggal: 2026-02-26 13:57
-- =============================================================================

BEGIN;

WITH kandidat AS (
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
      WHEN STRPOS(COALESCE(e.sumber_definisi, ''), '[<') > 0
        THEN NULLIF(
          BTRIM(
            regexp_replace(
              BTRIM(
                SPLIT_PART(
                  SPLIT_PART(COALESCE(e.sumber_definisi, ''), '[<', 2),
                  '(<',
                  1
                )
              ),
              '^.*\\s',
              ''
            )
          ),
          ''
        )
      ELSE NULL
    END AS kata_baru
  FROM etimologi e
)
UPDATE etimologi e
SET kata_asal = k.kata_baru,
    updated_at = NOW()
FROM kandidat k
WHERE e.id = k.id
  AND k.kata_baru IS NOT NULL
  AND (
    NULLIF(BTRIM(e.kata_asal), '') IS NULL
    OR LOWER(BTRIM(e.kata_asal)) IN ('or', 'and', 'dan')
  );

COMMIT;
