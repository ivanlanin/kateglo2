-- Kasus B: normalisasi aksen non-standar pada lafal
-- Kebijakan saat ini: é/è/ê/ë dipetakan ke ə

UPDATE entri
SET lafal = translate(lafal, 'éèêëÉÈÊË', 'əəəəƏƏƏƏ'),
    updated_at = NOW()
WHERE jenis = 'dasar'
  AND aktif = 1
  AND entri ~* 'e'
  AND lafal IS NOT NULL
  AND BTRIM(lafal) <> ''
  AND lafal ~ '[éèêëÉÈÊË]';
