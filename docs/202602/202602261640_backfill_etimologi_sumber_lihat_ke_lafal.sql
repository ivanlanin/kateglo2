-- =============================================================================
-- Migrasi: Backfill etimologi dari sumber_lihat → lafal
-- Aturan:
--   - Target: baris etimologi dengan bahasa kosong dan sumber_lihat terisi.
--   - Referensi: baris etimologi dengan lafal = TRIM(sumber_lihat) yang memiliki
--     bahasa + kata_asal terisi.
--   - Pemilihan referensi jika ganda: prioritaskan aktif=true, lalu id terkecil.
--   - Pengisian: bahasa wajib diisi dari referensi; kata_asal diisi jika masih kosong.
-- Tanggal: 2026-02-26 16:40
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
    WHERE s.lafal = BTRIM(t.sumber_lihat)
      AND NULLIF(BTRIM(s.bahasa), '') IS NOT NULL
      AND NULLIF(BTRIM(s.kata_asal), '') IS NOT NULL
    ORDER BY s.aktif DESC, s.id ASC
    LIMIT 1
  ) src ON TRUE
  WHERE NULLIF(BTRIM(t.bahasa), '') IS NULL
    AND NULLIF(BTRIM(t.sumber_lihat), '') IS NOT NULL
)
UPDATE etimologi e
SET bahasa = kandidat.bahasa_ref,
    kata_asal = CASE
      WHEN NULLIF(BTRIM(e.kata_asal), '') IS NULL THEN kandidat.kata_asal_ref
      ELSE e.kata_asal
    END,
    updated_at = NOW()
FROM kandidat
WHERE e.id = kandidat.id
  AND kandidat.bahasa_ref IS NOT NULL;

COMMIT;