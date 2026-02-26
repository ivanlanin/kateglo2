-- Draft skema sederhana KBBI4 -> Kateglo
-- Date: 2026-02-14
-- Prinsip:
--   1) Inti data: entri, makna, contoh, label
--   2) Tanpa entri_relasi
--   3) ilmiah & kimia melekat ke makna (asumsi 1:1 per makna)

BEGIN;

-- ============================================
-- LABEL LOOKUP (gabungan bahasa, bidang, kelaskata, ragam)
-- ============================================
CREATE TABLE IF NOT EXISTS label (
  label_id           BIGSERIAL PRIMARY KEY,
  kategori           TEXT NOT NULL CHECK (kategori IN ('ragam', 'kelas_kata', 'bahasa', 'bidang')),
  kode               TEXT NOT NULL,
  nama               TEXT NOT NULL,
  keterangan         TEXT,
  sumber_legacy      TEXT,
  UNIQUE (kategori, kode)
);

CREATE INDEX IF NOT EXISTS idx_label_kategori_nama ON label (kategori, nama);

-- ============================================
-- ENTRI (gabungan kata/turunan/gabungan/idiom/peribahasa/varian)
-- ============================================
CREATE TABLE IF NOT EXISTS entri (
  entri_id              BIGSERIAL PRIMARY KEY,
  legacy_eid            BIGINT UNIQUE,
  lemma                 TEXT NOT NULL,
  jenis_entri           TEXT NOT NULL,
  induk_entri_id        BIGINT REFERENCES entri(entri_id) ON DELETE SET NULL,
  induk_lemma_legacy    TEXT,
  homonim_no            INTEGER,
  varian_homonim        TEXT,
  pemenggalan           TEXT,
  lafal                 TEXT,
  mode_entri            TEXT NOT NULL DEFAULT 'makna' CHECK (mode_entri IN ('makna', 'rujuk')),
  jenis_rujuk           TEXT,
  entri_rujuk           TEXT,
  jumlah_makna          INTEGER NOT NULL DEFAULT 0,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  catatan               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (TRIM(lemma) <> ''),
  CHECK (jenis_entri IN ('entri_dasar', 'kata_turunan', 'gabungan_kata', 'idiom', 'peribahasa', 'varian', 'ungkapan'))
);

CREATE INDEX IF NOT EXISTS idx_entri_lemma_lower ON entri (LOWER(lemma));
CREATE INDEX IF NOT EXISTS idx_entri_jenis ON entri (jenis_entri);
CREATE INDEX IF NOT EXISTS idx_entri_mode ON entri (mode_entri);

-- ============================================
-- MAKNA
-- ============================================
CREATE TABLE IF NOT EXISTS makna (
  makna_id              BIGSERIAL PRIMARY KEY,
  legacy_mid            BIGINT UNIQUE,
  entri_id              BIGINT NOT NULL REFERENCES entri(entri_id) ON DELETE CASCADE,
  polisem_no            INTEGER NOT NULL DEFAULT 1,
  urutan_tampil         INTEGER NOT NULL DEFAULT 1,
  isi_makna             TEXT NOT NULL,
  ragam_label           TEXT,
  ragam_varian_label    TEXT,
  kelas_kata_label      TEXT,
  bahasa_label          TEXT,
  bidang_label          TEXT,
  is_kiasan             BOOLEAN NOT NULL DEFAULT FALSE,
  tipe_penyingkat       TEXT CHECK (tipe_penyingkat IN ('akronim', 'kependekan', 'singkatan')),
  ilmiah                TEXT,
  kimia                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (TRIM(isi_makna) <> '')
);

CREATE INDEX IF NOT EXISTS idx_makna_entri ON makna (entri_id, urutan_tampil);
CREATE INDEX IF NOT EXISTS idx_makna_ragam_label ON makna (ragam_label);
CREATE INDEX IF NOT EXISTS idx_makna_ragam_varian_label ON makna (ragam_varian_label);
CREATE INDEX IF NOT EXISTS idx_makna_kelas_kata_label ON makna (kelas_kata_label);
CREATE INDEX IF NOT EXISTS idx_makna_bahasa_label ON makna (bahasa_label);
CREATE INDEX IF NOT EXISTS idx_makna_bidang_label ON makna (bidang_label);

-- ============================================
-- CONTOH (menggabungkan contoh + maknacontoh)
-- ============================================
CREATE TABLE IF NOT EXISTS contoh (
  contoh_id             BIGSERIAL PRIMARY KEY,
  legacy_cid            BIGINT UNIQUE,
  makna_id              BIGINT NOT NULL REFERENCES makna(makna_id) ON DELETE CASCADE,
  urutan_tampil         INTEGER NOT NULL DEFAULT 1,
  isi_contoh            TEXT NOT NULL,
  ragam_label           TEXT,
  bahasa_label          TEXT,
  bidang_label          TEXT,
  is_kiasan             BOOLEAN NOT NULL DEFAULT FALSE,
  makna_contoh          TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (TRIM(isi_contoh) <> '')
);

CREATE INDEX IF NOT EXISTS idx_contoh_makna ON contoh (makna_id, urutan_tampil);
CREATE INDEX IF NOT EXISTS idx_contoh_ragam_label ON contoh (ragam_label);
CREATE INDEX IF NOT EXISTS idx_contoh_bahasa_label ON contoh (bahasa_label);
CREATE INDEX IF NOT EXISTS idx_contoh_bidang_label ON contoh (bidang_label);

COMMIT;

-- Catatan mapping ringkas:
-- - entri.mode_entri / jenis_rujuk / entri_rujuk menyerap data dari tabel rujuk tanpa tabel relasi terpisah.
-- - makna/contoh menyimpan teks label langsung untuk kemudahan display
-- - tabel label tetap ada sebagai tabel rujukan sumber lookup
-- - makna.ilmiah <= tabel ilmiah.nama (jika multi nilai, digabung '; ')
-- - makna.kimia   <= tabel kimia.rumus (jika multi nilai, digabung '; ')
-- - contoh.makna_contoh <= tabel maknacontoh.makna_contoh (jika multi nilai, digabung '; ')
-- - contoh.ragam_label/bahasa_label/bidang_label <= maknacontoh.ragam/bahasa/bidang (jika ada)
-- - contoh.is_kiasan <= interpretasi dari maknacontoh.ki