-- Migrasi 001: Tabel otorisasi pengguna
-- Jalankan: psql $DATABASE_URL -f _docs/migrasi-001-otorisasi.sql

BEGIN;

-- ============================================
-- TABEL PERAN
-- ============================================

CREATE TABLE peran (
  id SERIAL PRIMARY KEY,
  kode TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  keterangan TEXT
);

-- ============================================
-- TABEL IZIN
-- ============================================

CREATE TABLE izin (
  id SERIAL PRIMARY KEY,
  kode TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  kelompok TEXT
);

-- ============================================
-- TABEL PERAN_IZIN (mapping role → permissions)
-- ============================================

CREATE TABLE peran_izin (
  peran_id INTEGER NOT NULL REFERENCES peran(id) ON DELETE CASCADE,
  izin_id INTEGER NOT NULL REFERENCES izin(id) ON DELETE CASCADE,
  PRIMARY KEY (peran_id, izin_id)
);

-- ============================================
-- TABEL PENGGUNA
-- ============================================

CREATE TABLE pengguna (
  id SERIAL PRIMARY KEY,
  google_id TEXT NOT NULL UNIQUE,
  surel TEXT NOT NULL,
  nama TEXT NOT NULL,
  foto TEXT,
  peran_id INTEGER NOT NULL DEFAULT 1 REFERENCES peran(id),
  aktif INTEGER NOT NULL DEFAULT 1,
  login_terakhir TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pengguna_surel ON pengguna (surel);

-- ============================================
-- SEED DATA: PERAN
-- ============================================

INSERT INTO peran (kode, nama, keterangan) VALUES
  ('pengguna', 'Pengguna', 'Pengguna biasa, hanya bisa melihat'),
  ('penyunting', 'Penyunting', 'Bisa mengedit konten kamus'),
  ('admin', 'Admin', 'Akses penuh');

-- ============================================
-- SEED DATA: IZIN
-- ============================================

INSERT INTO izin (kode, nama, kelompok) VALUES
  ('lihat_lema', 'Lihat lema', 'lema'),
  ('tambah_lema', 'Tambah lema', 'lema'),
  ('edit_lema', 'Edit lema', 'lema'),
  ('hapus_lema', 'Hapus lema', 'lema'),
  ('tambah_makna', 'Tambah makna', 'lema'),
  ('edit_makna', 'Edit makna', 'lema'),
  ('hapus_makna', 'Hapus makna', 'lema'),
  ('tambah_contoh', 'Tambah contoh', 'lema'),
  ('edit_contoh', 'Edit contoh', 'lema'),
  ('hapus_contoh', 'Hapus contoh', 'lema'),
  ('lihat_glosarium', 'Lihat glosarium', 'glosarium'),
  ('tambah_glosarium', 'Tambah glosarium', 'glosarium'),
  ('edit_glosarium', 'Edit glosarium', 'glosarium'),
  ('hapus_glosarium', 'Hapus glosarium', 'glosarium'),
  ('lihat_tesaurus', 'Lihat tesaurus', 'tesaurus'),
  ('edit_tesaurus', 'Edit tesaurus', 'tesaurus'),
  ('kelola_pengguna', 'Kelola pengguna', 'pengguna'),
  ('kelola_peran', 'Kelola peran', 'pengguna');

-- ============================================
-- SEED DATA: PERAN_IZIN
-- ============================================

-- Admin mendapat semua izin
INSERT INTO peran_izin (peran_id, izin_id)
  SELECT (SELECT id FROM peran WHERE kode = 'admin'), id FROM izin;

-- Penyunting: semua kecuali hapus dan kelola
INSERT INTO peran_izin (peran_id, izin_id)
  SELECT (SELECT id FROM peran WHERE kode = 'penyunting'), id FROM izin
  WHERE kode NOT IN ('hapus_lema', 'hapus_makna', 'hapus_contoh', 'hapus_glosarium', 'kelola_pengguna', 'kelola_peran');

-- Pengguna biasa: hanya lihat
INSERT INTO peran_izin (peran_id, izin_id)
  SELECT (SELECT id FROM peran WHERE kode = 'pengguna'), id FROM izin
  WHERE kode LIKE 'lihat_%';

COMMIT;
