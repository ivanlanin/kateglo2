-- =============================================================================
-- Migrasi: Backfill etimologi dari sumber_lihat → indeks
-- Aturan:
--   - Target: baris etimologi yang punya sumber_lihat dan bahasa/kata_asal masih kosong.
--   - Referensi: baris etimologi dengan indeks = sumber_lihat (trim) yang memiliki
--     bahasa dan kata_asal terisi.
--   - Pemilihan referensi jika ganda: prioritaskan aktif=true, lalu id terkecil.
-- Tanggal: 2026-02-26 16:20
-- =============================================================================

BEGIN;

WITH kandidat AS (
  SELECT
    t.id,
    src.bahasa AS bahasa_ref,
    src.kata_asal AS kata_asal_ref
  FROM etimologi t
  JOIN LATERAL (
    SELECT s.bahasa, s.kata_asal, s.aktif, s.id
    FROM etimologi s
    WHERE s.indeks = BTRIM(t.sumber_lihat)
      AND NULLIF(BTRIM(s.bahasa), '') IS NOT NULL
      AND NULLIF(BTRIM(s.kata_asal), '') IS NOT NULL
    ORDER BY s.aktif DESC, s.id ASC
    LIMIT 1
  ) src ON TRUE
  WHERE NULLIF(BTRIM(t.sumber_lihat), '') IS NOT NULL
    AND (
      NULLIF(BTRIM(t.bahasa), '') IS NULL
      OR NULLIF(BTRIM(t.kata_asal), '') IS NULL
    )
)
UPDATE etimologi e
SET bahasa = CASE
      WHEN NULLIF(BTRIM(e.bahasa), '') IS NULL THEN kandidat.bahasa_ref
      ELSE e.bahasa
    END,
    kata_asal = CASE
      WHEN NULLIF(BTRIM(e.kata_asal), '') IS NULL THEN kandidat.kata_asal_ref
      ELSE e.kata_asal
    END,
    updated_at = NOW()
FROM kandidat
WHERE e.id = kandidat.id
  AND (
    (NULLIF(BTRIM(e.bahasa), '') IS NULL AND kandidat.bahasa_ref IS NOT NULL)
    OR (NULLIF(BTRIM(e.kata_asal), '') IS NULL AND kandidat.kata_asal_ref IS NOT NULL)
  );

COMMIT;