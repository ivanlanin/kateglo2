-- Pindahkan induk gabungan dari entri dasar ke berimbuhan yang sesuai
-- Logika: jika entri gabungan dimulai dengan entri berimbuhan + spasi,
-- maka induknya diubah ke berimbuhan tersebut (pilih yang terpanjang).
-- Contoh: "berlatih tanding" induknya berubah dari "latih" ke "berlatih"
-- Dampak: ~3.367 baris dari total ~23.536 gabungan

UPDATE entri g
SET induk = b_match.id
FROM (
  SELECT DISTINCT ON (g2.id) g2.id AS gabungan_id, b2.id
  FROM entri g2
  JOIN entri b2 ON b2.induk = g2.induk
    AND b2.jenis = 'berimbuhan'
    AND b2.aktif = 1
    AND g2.entri ILIKE b2.entri || ' %'
  WHERE g2.jenis = 'gabungan'
    AND g2.aktif = 1
    AND g2.induk IS NOT NULL
    AND EXISTS (SELECT 1 FROM entri p WHERE p.id = g2.induk AND p.jenis = 'dasar')
  ORDER BY g2.id, length(b2.entri) DESC
) b_match
WHERE g.id = b_match.gabungan_id;
