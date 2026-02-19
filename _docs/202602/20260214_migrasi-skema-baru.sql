-- Migrasi skema baru Kateglo 2.0
-- Mengikuti struktur kbbi.db: label, lema, makna, contoh + tesaurus
-- Date: 2026-02-14

BEGIN;

-- ============================================
-- LABEL (rujukan gabungan: ragam, kelas_kata, bahasa, bidang)
-- ============================================
CREATE TABLE IF NOT EXISTS label (
  id               SERIAL PRIMARY KEY,
  kategori         TEXT NOT NULL CHECK (kategori IN ('ragam', 'kelas_kata', 'bahasa', 'bidang')),
  kode             TEXT NOT NULL,
  nama             TEXT NOT NULL,
  keterangan       TEXT,
  sumber           TEXT,
  UNIQUE (kategori, kode)
);

CREATE INDEX IF NOT EXISTS idx_label_kategori_nama ON label (kategori, nama);

-- ============================================
-- ENTRI (entri kamus: dasar, turunan, gabungan, idiom, peribahasa, varian)
-- ============================================
CREATE TABLE IF NOT EXISTS entri (
  id               SERIAL PRIMARY KEY,
  legacy_eid       INTEGER UNIQUE,
  entri            TEXT NOT NULL,
  jenis            TEXT NOT NULL CHECK (jenis IN ('dasar', 'turunan', 'gabungan', 'idiom', 'peribahasa', 'varian')),
  induk            INTEGER REFERENCES entri(id) ON DELETE SET NULL,
  pemenggalan      TEXT,
  lafal            TEXT,
  varian           TEXT,
  jenis_rujuk      TEXT,
  lema_rujuk       TEXT,
  aktif            INTEGER NOT NULL DEFAULT 1,
  legacy_tabel     TEXT,
  legacy_tid       INTEGER,
  CHECK (TRIM(entri) <> '')
);

CREATE INDEX IF NOT EXISTS idx_entri_lower ON entri (LOWER(entri));
CREATE INDEX IF NOT EXISTS idx_entri_trgm ON entri USING gin (entri gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_entri_jenis ON entri (jenis);
CREATE INDEX IF NOT EXISTS idx_entri_induk ON entri (induk);

-- ============================================
-- MAKNA (definisi per entri)
-- ============================================
CREATE TABLE IF NOT EXISTS makna (
  id               SERIAL PRIMARY KEY,
  legacy_mid       INTEGER UNIQUE,
  entri_id         INTEGER NOT NULL REFERENCES entri(id) ON DELETE CASCADE,
  polisem          INTEGER NOT NULL DEFAULT 1,
  urutan           INTEGER NOT NULL DEFAULT 1,
  makna            TEXT NOT NULL,
  ragam            TEXT,
  ragam_varian     TEXT,
  kelas_kata       TEXT,
  bahasa           TEXT,
  bidang           TEXT,
  kiasan           INTEGER NOT NULL DEFAULT 0,
  tipe_penyingkat  TEXT CHECK (tipe_penyingkat IS NULL OR tipe_penyingkat IN ('akronim', 'kependekan', 'singkatan')),
  ilmiah           TEXT,
  kimia            TEXT,
  CHECK (TRIM(makna) <> '')
);

CREATE INDEX IF NOT EXISTS idx_makna_entri ON makna (entri_id, urutan);
CREATE INDEX IF NOT EXISTS idx_makna_kelas_kata ON makna (kelas_kata);
CREATE INDEX IF NOT EXISTS idx_makna_bidang ON makna (bidang);

-- ============================================
-- CONTOH (contoh penggunaan per makna)
-- ============================================
CREATE TABLE IF NOT EXISTS contoh (
  id               SERIAL PRIMARY KEY,
  legacy_cid       INTEGER UNIQUE,
  makna_id         INTEGER NOT NULL REFERENCES makna(id) ON DELETE CASCADE,
  urutan           INTEGER NOT NULL DEFAULT 1,
  contoh           TEXT NOT NULL,
  ragam            TEXT,
  bahasa           TEXT,
  bidang           TEXT,
  kiasan           INTEGER NOT NULL DEFAULT 0,
  makna_contoh     TEXT,
  CHECK (TRIM(contoh) <> '')
);

CREATE INDEX IF NOT EXISTS idx_contoh_makna ON contoh (makna_id, urutan);

-- ============================================
-- TESAURUS (gabungan data relation + _thesaurus)
-- ============================================
CREATE TABLE IF NOT EXISTS tesaurus (
  id               SERIAL PRIMARY KEY,
  indeks           TEXT NOT NULL UNIQUE,
  sinonim          TEXT,
  antonim          TEXT,
  turunan          TEXT,
  gabungan         TEXT,
  berkaitan        TEXT
);

CREATE INDEX IF NOT EXISTS idx_tesaurus_indeks_lower ON tesaurus (LOWER(indeks));
CREATE INDEX IF NOT EXISTS idx_tesaurus_indeks_trgm ON tesaurus USING gin (indeks gin_trgm_ops);

COMMIT;
