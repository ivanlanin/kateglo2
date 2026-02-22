-- Kasus E: pengisian manual berbasis verifikasi KBBI
-- Sumber rujukan:
-- /entri/kelenteng, /ketel, /lempeng, /per, /rembes, /remet, /serang, /seri
-- Catatan: KBBI memakai ê untuk pepet; di DB dinormalisasi menjadi ə.

UPDATE entri AS e
SET lafal = m.lafal_target,
    updated_at = NOW()
FROM (
  VALUES
    (17440, 'kələntəng'),
    (18467, 'kətəl'),
    (21739, 'ləmpəng'),
    (28611, 'pər'),
    (28612, 'pər'),
    (31551, 'rəmbəs'),
    (31572, 'rəmət'),
    (34620, 'sərang'),
    (34740, 'səri'),
    (34741, 'səri')
) AS m(id, lafal_target)
WHERE e.id = m.id
  AND e.jenis = 'dasar'
  AND e.aktif = 1
  AND (e.lafal IS NULL OR BTRIM(e.lafal) = '');
