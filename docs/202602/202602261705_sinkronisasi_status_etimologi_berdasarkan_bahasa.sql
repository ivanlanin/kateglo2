-- =============================================================================
-- Migrasi: Sinkronisasi status etimologi berdasarkan isi kolom bahasa
-- Aturan:
--   - aktif = TRUE  jika bahasa terisi (setelah trim)
--   - aktif = FALSE jika bahasa kosong / NULL
-- Tanggal: 2026-02-26 17:05
-- =============================================================================

BEGIN;

UPDATE etimologi
SET aktif = CASE
      WHEN NULLIF(BTRIM(COALESCE(bahasa, '')), '') IS NOT NULL THEN TRUE
      ELSE FALSE
    END,
    updated_at = NOW()
WHERE aktif IS DISTINCT FROM CASE
      WHEN NULLIF(BTRIM(COALESCE(bahasa, '')), '') IS NOT NULL THEN TRUE
      ELSE FALSE
    END;

COMMIT;