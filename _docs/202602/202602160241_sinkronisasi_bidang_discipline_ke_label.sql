-- Sinkronisasi bidang legacy ke label(kategori='bidang')
-- Tanggal: 2026-02-16
-- Catatan:
-- - Menambahkan label bidang baru: Umum (umum)
-- - Mapping keputusan user: agama -> Isl, *umum* -> Umum

BEGIN;

INSERT INTO label (kategori, kode, nama, keterangan, sumber)
VALUES ('bidang', 'Umum', 'umum', 'Bidang umum dari data discipline/glosarium legacy', 'migrasi-20260216')
ON CONFLICT (kategori, kode) DO UPDATE
SET nama = EXCLUDED.nama,
    keterangan = EXCLUDED.keterangan,
    sumber = EXCLUDED.sumber;

WITH mapping(old_kode, new_kode) AS (
  VALUES
    ('agama', 'Isl'),
    ('agamaislam', 'Isl'),
    ('antropologi', 'Antr'),
    ('arkeologi', 'Ark'),
    ('arsitektur', 'Ars'),
    ('asuransi', 'Keu'),
    ('biologi', 'Bio'),
    ('ekonomi', 'Ek'),
    ('elektronika', 'El'),
    ('farmasi', 'Far'),
    ('filsafat', 'Fil'),
    ('fisika', 'Fis'),
    ('fotografi', 'Graf'),
    ('geologi', 'Geo'),
    ('hukum', 'Huk'),
    ('kedokteran', 'Dok'),
    ('kedokteranhewan', 'Dok'),
    ('keuangan', 'Keu'),
    ('kimia', 'Kim'),
    ('komunikasimassa', 'Kom'),
    ('konstruksi', 'Tek'),
    ('kristen', 'Kris'),
    ('linguistik', 'Ling'),
    ('manajemen', 'Man'),
    ('matematika', 'Mat'),
    ('mesin', 'Mek'),
    ('militer', 'Mil'),
    ('minyakgas', 'Pet'),
    ('olahraga', 'Olr'),
    ('otomotif', 'Mek'),
    ('pajak', 'Keu'),
    ('pariwisata', 'Hub'),
    ('paten', 'Huk'),
    ('pelayaran', 'Lay'),
    ('pelelangan', 'Dag'),
    ('pendidikan', 'Dik'),
    ('penerbangan', 'Terb'),
    ('perbankan', 'Keu'),
    ('perhutanan', 'Hut'),
    ('perikanan', 'Ikn'),
    ('perkapalan', 'Kap'),
    ('pertambangan', 'Pet'),
    ('pertanian', 'Tan'),
    ('peternakan', 'Tern'),
    ('politik', 'Pol'),
    ('psikologi', 'Psi'),
    ('saham', 'Keu'),
    ('sastra', 'Sas'),
    ('sosiologi', 'Sos'),
    ('statistika', 'Stat'),
    ('teknik', 'Tek'),
    ('teknikkimia', 'Tek'),
    ('teknologiinformasi', 'Komp'),
    ('transportasi', 'Hub'),
    ('*umum*', 'Umum')
)
UPDATE glosarium g
SET bidang = m.new_kode
FROM mapping m
WHERE LOWER(TRIM(g.bidang)) = LOWER(TRIM(m.old_kode));

DELETE FROM discipline;

INSERT INTO discipline (discipline, discipline_name, glossary_count, updated, updater)
SELECT
  l.kode,
  l.nama,
  COALESCE(x.jumlah, 0)::int,
  NOW(),
  'migrasi-20260216'
FROM label l
LEFT JOIN (
  SELECT bidang, COUNT(*) AS jumlah
  FROM glosarium
  GROUP BY bidang
) x ON x.bidang = l.kode
WHERE l.kategori = 'bidang'
ORDER BY l.kode;

COMMIT;
