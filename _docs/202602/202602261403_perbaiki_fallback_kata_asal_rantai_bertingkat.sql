-- =============================================================================
-- Perbaikan fallback kata_asal untuk rantai etimologi bertingkat
-- Tanggal: 2026-02-26 14:03
-- =============================================================================

BEGIN;

WITH kandidat AS (
  SELECT
    e.id,
    NULLIF(
      BTRIM(
        SUBSTRING(
          BTRIM(
            SPLIT_PART(
              SPLIT_PART(
                SPLIT_PART(COALESCE(e.sumber_definisi, ''), '[<', 2),
                '(<',
                1
              ),
              '(f',
              1
            )
          )
          FROM E'([^\\s]+)$'
        )
      ),
      ''
    ) AS kata_baru
  FROM etimologi e
  WHERE NULLIF(BTRIM(e.sumber_isi), '') IS NULL
    AND NULLIF(BTRIM(e.sumber_aksara), '') IS NULL
    AND NULLIF(BTRIM(e.sumber_definisi), '') IS NOT NULL
    AND (
      NULLIF(BTRIM(e.kata_asal), '') IS NULL
      OR e.kata_asal LIKE '%)]'
      OR e.kata_asal LIKE '%<%'
    )
)
UPDATE etimologi e
SET kata_asal = k.kata_baru,
    updated_at = NOW()
FROM kandidat k
WHERE e.id = k.id
  AND k.kata_baru IS NOT NULL;

COMMIT;
