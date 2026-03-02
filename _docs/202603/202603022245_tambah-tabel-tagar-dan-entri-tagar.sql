-- Migration: Tambah tabel tagar dan entri_tagar
-- Tanggal: 2026-03-02
-- Deskripsi: Sistem tagar morfologis untuk entri kamus (many-to-many)
-- Keputusan desain:
--   - Kategori: prefiks, sufiks, infiks, klitik, reduplikasi, prakategorial (tidak ada konfiks)
--   - Alomorf digabung: me- mencakup meng-/mem-/men-/meny-, ber- mencakup be-, ter- mencakup te-
--   - Reduplikasi berimbuhan dipisah: tagar R + tagar ber/me/dll secara terpisah

-- ============================================================
-- 1. TABEL tagar (master data)
-- ============================================================

CREATE TABLE tagar (
  id SERIAL PRIMARY KEY,
  kode TEXT NOT NULL,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  deskripsi TEXT,
  urutan INTEGER NOT NULL DEFAULT 1,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT tagar_kode_key UNIQUE (kode),
  CONSTRAINT tagar_nama_check CHECK (TRIM(BOTH FROM nama) <> ''),
  CONSTRAINT tagar_kode_check CHECK (TRIM(BOTH FROM kode) <> ''),
  CONSTRAINT tagar_kategori_check CHECK (
    kategori IN ('prefiks', 'sufiks', 'infiks', 'klitik', 'reduplikasi', 'prakategorial')
  )
);

CREATE INDEX idx_tagar_kategori_urutan ON tagar USING BTREE (kategori, urutan);
CREATE INDEX idx_tagar_aktif ON tagar USING BTREE (aktif);

CREATE TRIGGER trg_set_timestamp_fields__tagar
  BEFORE INSERT OR UPDATE ON tagar
  FOR EACH ROW EXECUTE FUNCTION set_timestamp_fields();

-- ============================================================
-- 2. TABEL entri_tagar (junction many-to-many)
-- ============================================================

CREATE TABLE entri_tagar (
  entri_id INTEGER NOT NULL REFERENCES entri(id) ON DELETE CASCADE,
  tagar_id INTEGER NOT NULL REFERENCES tagar(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entri_id, tagar_id)
);

CREATE INDEX idx_entri_tagar_tagar_id ON entri_tagar USING BTREE (tagar_id);
CREATE INDEX idx_entri_tagar_entri_id ON entri_tagar USING BTREE (entri_id);

-- ============================================================
-- 3. IZIN baru
-- ============================================================

INSERT INTO izin (kode, nama, kelompok)
VALUES ('kelola_tagar', 'Kelola tagar morfologis', 'tagar');

-- Assign ke peran yang punya akses redaksi (admin & redaksi)
INSERT INTO peran_izin (peran_id, izin_id)
SELECT p.id, i.id
FROM peran p, izin i
WHERE i.kode = 'kelola_tagar'
  AND p.akses_redaksi = TRUE
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. SEED DATA tagar morfologis
-- ============================================================

-- Prefiks (urutan: paling umum dulu)
INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan) VALUES
  ('me',  'me-',  'prefiks', 'Prefiks aktif (termasuk alomorf meng-, mem-, men-, meny-)', 1),
  ('ber', 'ber-', 'prefiks', 'Prefiks statis/intransitif (termasuk alomorf be-)', 2),
  ('di',  'di-',  'prefiks', 'Prefiks pasif', 3),
  ('ter', 'ter-', 'prefiks', 'Prefiks pasif/aspek (termasuk alomorf te-)', 4),
  ('per', 'per-', 'prefiks', 'Prefiks kausatif', 5),
  ('ke',  'ke-',  'prefiks', 'Prefiks ordinal/nominal', 6),
  ('se',  'se-',  'prefiks', 'Prefiks satu/semua', 7),
  ('pe',  'pe-',  'prefiks', 'Prefiks agentif (termasuk alomorf peng-, pem-, pen-, peny-)', 8);

-- Sufiks
INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan) VALUES
  ('an',  '-an',  'sufiks', 'Sufiks nominalisasi, paling umum', 1),
  ('kan', '-kan', 'sufiks', 'Sufiks kausatif', 2),
  ('i',   '-i',   'sufiks', 'Sufiks lokatif/benefaktif', 3);

-- Infiks
INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan) VALUES
  ('el', '-el-', 'infiks', 'Infiks (telunjuk, geligi)', 1),
  ('em', '-em-', 'infiks', 'Infiks (gemuruh, temali)', 2),
  ('er', '-er-', 'infiks', 'Infiks (gerigi, seruling)', 3),
  ('in', '-in-', 'infiks', 'Infiks serapan (sinambung)', 4);

-- Klitik
INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan) VALUES
  ('nya', '-nya', 'klitik', 'Klitik posesif/referensial', 1),
  ('ku',  '-ku',  'klitik', 'Klitik posesif orang pertama', 2),
  ('mu',  '-mu',  'klitik', 'Klitik posesif orang kedua', 3),
  ('kah', '-kah', 'klitik', 'Klitik interogatif', 4),
  ('lah', '-lah', 'klitik', 'Klitik imperatif/penegas', 5),
  ('pun', '-pun', 'klitik', 'Klitik penegas/konsesif', 6),
  ('tah', '-tah', 'klitik', 'Klitik arkaik interogatif', 7);

-- Reduplikasi
INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan) VALUES
  ('R',     'R-',     'reduplikasi', 'Reduplikasi murni: X → X-X', 1),
  ('R-an',  'R--an',  'reduplikasi', 'Reduplikasi + sufiks -an: X → X-Xan', 2),
  ('R-kan', 'R--kan', 'reduplikasi', 'Reduplikasi + sufiks -kan: X → X-Xkan', 3),
  ('R-nya', 'R--nya', 'reduplikasi', 'Reduplikasi + klitik -nya: X → X-Xnya', 4);
