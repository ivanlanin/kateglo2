-- ==========================================================================
-- Rematch homonim etimologi
-- Dibuat  : 2026-03-05 18:49
-- YAKIN   : 1 baris (entri_id + aktif)
-- PROBABLE: 0 baris (entri_id saja)
-- MANUAL  : 0 baris (tidak diubah)
-- ==========================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- YAKIN: cocok via homonim persis
-- 1 baris; aktif=true untuk yang bahasa terisi & bukan meragukan
-- -----------------------------------------------------------------------
UPDATE etimologi SET entri_id = 14, aktif = true, updated_at = NOW() WHERE id = 7; -- abah hom=1 (Arab) -> "abah (1)"

COMMIT;
