-- ==========================================================================
-- Aktifkan compound sejati etimologi (bahasa NULL tapi kata_asal terisi)
-- Dibuat  : 2026-03-05 20:00
-- Target  : 100 baris
-- Kondisi : aktif=false, meragukan=false, entri_id IS NOT NULL,
--           kata_asal terisi, bahasa kosong
-- ==========================================================================

BEGIN;

UPDATE etimologi
SET aktif = true, updated_at = NOW()
WHERE aktif = false
  AND meragukan = false
  AND entri_id IS NOT NULL
  AND NULLIF(BTRIM(COALESCE(kata_asal, '')), '') IS NOT NULL
  AND NULLIF(BTRIM(COALESCE(bahasa, '')), '') IS NULL;

-- Verifikasi
SELECT
    aktif, meragukan,
    COUNT(*) AS jumlah
FROM etimologi
GROUP BY aktif, meragukan
ORDER BY aktif DESC, meragukan;

COMMIT;
