-- =============================================================================
-- Migrasi: Rename izin lema→entri dan kelola_label hanya admin
-- Tanggal: 2026-02-19
-- Deskripsi:
--   1. Rename kode dan kelompok izin dari 'lema' menjadi 'entri'
--      sesuai rename tabel phrase/lema → entri.
--      Sebelum:  lihat_lema, tambah_lema, edit_lema, hapus_lema (kelompok: lema)
--      Sesudah:  lihat_entri, tambah_entri, edit_entri, hapus_entri (kelompok: entri)
--   2. Izin kelola_label sudah dibuat di migration sebelumnya (20260219_aktifkan).
--      Di sini dikonfirmasi hanya admin yang memilikinya (penyunting tidak punya).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Rename kode izin: lema → entri
-- -----------------------------------------------------------------------------
UPDATE izin SET kode = 'lihat_entri',   kelompok = 'entri' WHERE kode = 'lihat_lema';
UPDATE izin SET kode = 'tambah_entri',  kelompok = 'entri' WHERE kode = 'tambah_lema';
UPDATE izin SET kode = 'edit_entri',    kelompok = 'entri' WHERE kode = 'edit_lema';
UPDATE izin SET kode = 'hapus_entri',   kelompok = 'entri' WHERE kode = 'hapus_lema';

-- -----------------------------------------------------------------------------
-- 2. Update nama izin yang kelompoknya masih 'lema' (makna, contoh)
-- -----------------------------------------------------------------------------
UPDATE izin SET kelompok = 'entri' WHERE kelompok = 'lema';

-- -----------------------------------------------------------------------------
-- 3. Pastikan kelola_label TIDAK dimiliki penyunting (hanya admin)
--    (aman dijalankan berkali-kali)
-- -----------------------------------------------------------------------------
DELETE FROM peran_izin
WHERE peran_id = (SELECT id FROM peran WHERE kode = 'penyunting')
  AND izin_id  = (SELECT id FROM izin  WHERE kode = 'kelola_label');

-- -----------------------------------------------------------------------------
-- 4. Verifikasi hasil
-- -----------------------------------------------------------------------------
SELECT
  p.kode    AS peran,
  i.kelompok,
  i.kode    AS izin,
  i.nama
FROM peran_izin pi
JOIN peran p ON p.id = pi.peran_id
JOIN izin   i ON i.id = pi.izin_id
ORDER BY p.id, i.kelompok, i.kode;
