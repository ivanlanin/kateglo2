-- =============================================================================
-- Migrasi: Aktifkan hak akses penyunting
-- Tanggal: 2026-02-19
-- Deskripsi:
--   Sebelumnya seluruh route /api/redaksi/* hanya bisa diakses admin.
--   Migrasi ini melengkapi data izin dan peran_izin agar peran `penyunting`
--   (dan `admin`) bisa mengakses sesuai wewenangnya.
--
--   Izin baru yang ditambahkan:
--     Kelompok tesaurus : tambah_tesaurus, hapus_tesaurus
--     Kelompok komentar : kelola_komentar
--     Kelompok label    : kelola_label
--     Kelompok statistik: lihat_statistik
--
--   Pembagian wewenang per peran:
--     pengguna   : lihat saja (sudah ada, tidak berubah)
--     penyunting : edit konten + lihat statistik + kelola komentar
--     admin      : semua izin termasuk hapus, kelola label, kelola pengguna
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tambah izin baru
-- -----------------------------------------------------------------------------
INSERT INTO izin (kode, nama, kelompok) VALUES
  ('tambah_tesaurus', 'Tambah tesaurus', 'tesaurus'),
  ('hapus_tesaurus',  'Hapus tesaurus',  'tesaurus'),
  ('kelola_komentar', 'Kelola komentar', 'komentar'),
  ('kelola_label',    'Kelola label',    'label'),
  ('lihat_statistik', 'Lihat statistik', 'statistik')
ON CONFLICT (kode) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Berikan izin baru ke penyunting (edit + lihat, TIDAK bisa hapus atau kelola label)
-- -----------------------------------------------------------------------------
INSERT INTO peran_izin (peran_id, izin_id)
SELECT p.id, i.id
FROM peran p
CROSS JOIN izin i
WHERE p.kode = 'penyunting'
  AND i.kode IN ('tambah_tesaurus', 'kelola_komentar', 'lihat_statistik')
  AND NOT EXISTS (
    SELECT 1 FROM peran_izin pi2
    WHERE pi2.peran_id = p.id AND pi2.izin_id = i.id
  );

-- -----------------------------------------------------------------------------
-- 3. Berikan semua izin baru ke admin
-- -----------------------------------------------------------------------------
INSERT INTO peran_izin (peran_id, izin_id)
SELECT p.id, i.id
FROM peran p
CROSS JOIN izin i
WHERE p.kode = 'admin'
  AND i.kode IN ('tambah_tesaurus', 'hapus_tesaurus', 'kelola_komentar', 'kelola_label', 'lihat_statistik')
  AND NOT EXISTS (
    SELECT 1 FROM peran_izin pi2
    WHERE pi2.peran_id = p.id AND pi2.izin_id = i.id
  );

-- -----------------------------------------------------------------------------
-- 4. Verifikasi hasil
-- -----------------------------------------------------------------------------
SELECT
  p.kode            AS peran,
  i.kelompok,
  i.kode            AS izin
FROM peran_izin pi
JOIN peran p ON p.id = pi.peran_id
JOIN izin   i ON i.id = pi.izin_id
ORDER BY p.id, i.kelompok, i.kode;
