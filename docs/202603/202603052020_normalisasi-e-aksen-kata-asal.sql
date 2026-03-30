-- ==========================================================================
-- Normalisasi é → e di kolom kata_asal
-- Dibuat  : 2026-03-05 20:20
-- Target  : ~175 baris
-- ==========================================================================

BEGIN;

UPDATE etimologi
SET kata_asal = REPLACE(kata_asal, 'é', 'e'),
    updated_at = NOW()
WHERE kata_asal LIKE '%é%';

-- Verifikasi sisa
SELECT COUNT(*) AS sisa_bermasalah
FROM etimologi
WHERE kata_asal LIKE '%é%';

COMMIT;
