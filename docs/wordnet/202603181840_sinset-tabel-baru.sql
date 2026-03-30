-- ============================================================
-- Tabel WordNet untuk Kateglo
-- Migration: 202603181840_sinset-tabel-baru.sql
--
-- 4 tabel: tipe_relasi, sinset, sinset_lema, relasi_sinset
-- Semua data Inggris tetap tersimpan sebagai rujukan kurasi.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Tipe relasi (referensi, 26 jenis)
-- ============================================================

CREATE TABLE tipe_relasi (
  kode        TEXT PRIMARY KEY,
  nama        TEXT NOT NULL,               -- Nama teknis: 'Hipernim'
  nama_publik TEXT NOT NULL,               -- User-friendly: 'Kata Umum'
  kategori    TEXT NOT NULL,               -- hierarki | leksikal | morfologi | verba | domain
  kebalikan   TEXT,                        -- kode relasi kebalikan (diisi setelah semua row ada)
  simetris    BOOLEAN NOT NULL DEFAULT FALSE,
  urutan      SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT tipe_relasi_kategori_check CHECK (
    kategori IN ('hierarki', 'leksikal', 'morfologi', 'verba', 'domain')
  )
);

-- Seed 26 tipe relasi
INSERT INTO tipe_relasi (kode, nama, nama_publik, kategori, simetris, urutan) VALUES
  -- Hierarki (10)
  ('hipernim',            'Hipernim',            'Kata Umum',               'hierarki',  FALSE, 1),
  ('hiponim',             'Hiponim',             'Kata Spesifik',           'hierarki',  FALSE, 2),
  ('hipernim_instans',    'Hipernim Instans',    'Kelas Dari',              'hierarki',  FALSE, 3),
  ('hiponim_instans',     'Hiponim Instans',     'Contoh Dari',             'hierarki',  FALSE, 4),
  ('holonim_bagian',      'Holonim Bagian',      'Keseluruhan (bagian)',     'hierarki',  FALSE, 5),
  ('meronim_bagian',      'Meronim Bagian',      'Bagian Dari',             'hierarki',  FALSE, 6),
  ('holonim_anggota',     'Holonim Anggota',     'Kelompok (anggota)',       'hierarki',  FALSE, 7),
  ('meronim_anggota',     'Meronim Anggota',     'Anggota Dari',            'hierarki',  FALSE, 8),
  ('holonim_substansi',   'Holonim Substansi',   'Mengandung',              'hierarki',  FALSE, 9),
  ('meronim_substansi',   'Meronim Substansi',   'Terbuat Dari',            'hierarki',  FALSE, 10),
  -- Leksikal (4)
  ('antonim',             'Antonim',             'Lawan Kata',              'leksikal',  TRUE,  11),
  ('mirip',               'Mirip',               'Mirip',                   'leksikal',  TRUE,  12),
  ('lihat_juga',          'Lihat Juga',          'Lihat Juga',              'leksikal',  TRUE,  13),
  ('atribut',             'Atribut',             'Atribut',                 'leksikal',  TRUE,  14),
  -- Morfologi (3)
  ('derivasi',            'Derivasi',            'Turunan',                 'morfologi', TRUE,  15),
  ('pertainim',           'Pertainim',           'Berkaitan',               'morfologi', FALSE, 16),
  ('partisipial',         'Partisipial',         'Partisipial',             'morfologi', FALSE, 17),
  -- Verba (3)
  ('mengimplikasikan',    'Mengimplikasikan',    'Mengimplikasikan',        'verba',     FALSE, 18),
  ('menyebabkan',         'Menyebabkan',         'Menyebabkan',            'verba',     FALSE, 19),
  ('kelompok_verba',      'Kelompok Verba',      'Kelompok Verba',          'verba',     TRUE,  20),
  -- Domain (6)
  ('domain_topik',        'Domain Topik',        'Domain Topik',            'domain',    FALSE, 21),
  ('ber_domain_topik',    'Ber-domain Topik',    'Bertopik',                'domain',    FALSE, 22),
  ('domain_wilayah',      'Domain Wilayah',      'Domain Wilayah',          'domain',    FALSE, 23),
  ('ber_domain_wilayah',  'Ber-domain Wilayah',  'Berwilayah',             'domain',    FALSE, 24),
  ('domain_penggunaan',   'Domain Penggunaan',   'Domain Penggunaan',       'domain',    FALSE, 25),
  ('ber_domain_penggunaan','Ber-domain Penggunaan','Berpenggunaan',         'domain',    FALSE, 26);

-- Pasang FK kebalikan setelah semua row ada
ALTER TABLE tipe_relasi ADD CONSTRAINT tipe_relasi_kebalikan_fk
  FOREIGN KEY (kebalikan) REFERENCES tipe_relasi(kode);

UPDATE tipe_relasi SET kebalikan = 'hiponim'              WHERE kode = 'hipernim';
UPDATE tipe_relasi SET kebalikan = 'hipernim'              WHERE kode = 'hiponim';
UPDATE tipe_relasi SET kebalikan = 'hiponim_instans'       WHERE kode = 'hipernim_instans';
UPDATE tipe_relasi SET kebalikan = 'hipernim_instans'      WHERE kode = 'hiponim_instans';
UPDATE tipe_relasi SET kebalikan = 'meronim_bagian'        WHERE kode = 'holonim_bagian';
UPDATE tipe_relasi SET kebalikan = 'holonim_bagian'        WHERE kode = 'meronim_bagian';
UPDATE tipe_relasi SET kebalikan = 'meronim_anggota'       WHERE kode = 'holonim_anggota';
UPDATE tipe_relasi SET kebalikan = 'holonim_anggota'       WHERE kode = 'meronim_anggota';
UPDATE tipe_relasi SET kebalikan = 'meronim_substansi'     WHERE kode = 'holonim_substansi';
UPDATE tipe_relasi SET kebalikan = 'holonim_substansi'     WHERE kode = 'meronim_substansi';
UPDATE tipe_relasi SET kebalikan = 'antonim'               WHERE kode = 'antonim';
UPDATE tipe_relasi SET kebalikan = 'mirip'                 WHERE kode = 'mirip';
UPDATE tipe_relasi SET kebalikan = 'lihat_juga'            WHERE kode = 'lihat_juga';
UPDATE tipe_relasi SET kebalikan = 'atribut'               WHERE kode = 'atribut';
UPDATE tipe_relasi SET kebalikan = 'derivasi'              WHERE kode = 'derivasi';
UPDATE tipe_relasi SET kebalikan = 'kelompok_verba'        WHERE kode = 'kelompok_verba';
UPDATE tipe_relasi SET kebalikan = 'ber_domain_topik'      WHERE kode = 'domain_topik';
UPDATE tipe_relasi SET kebalikan = 'domain_topik'          WHERE kode = 'ber_domain_topik';
UPDATE tipe_relasi SET kebalikan = 'ber_domain_wilayah'    WHERE kode = 'domain_wilayah';
UPDATE tipe_relasi SET kebalikan = 'domain_wilayah'        WHERE kode = 'ber_domain_wilayah';
UPDATE tipe_relasi SET kebalikan = 'ber_domain_penggunaan' WHERE kode = 'domain_penggunaan';
UPDATE tipe_relasi SET kebalikan = 'domain_penggunaan'     WHERE kode = 'ber_domain_penggunaan';

-- ============================================================
-- 2. Synset (unit makna)
-- ============================================================

CREATE TABLE sinset (
  id             TEXT PRIMARY KEY,            -- '00001740-n' (format WN30)
  kelas_kata     TEXT NOT NULL,               -- 'n', 'v', 'a', 'r' (kode singkat, konsisten dgn makna.kelas_kata)
  ili_id         TEXT,                        -- 'i1' — Interlingual Index, pivot ke OEWN 2024
  oewn_id        TEXT,                        -- 'oewn-00001740-n' — diisi saat upgrade ke OEWN 2024

  -- Bahasa Inggris (rujukan)
  lema_en        TEXT[],                      -- {'entity'} — kata Inggris dalam synset
  definisi_en    TEXT,                        -- 'that which is perceived or known...'
  contoh_en      TEXT[],                      -- {'it was full of rackets...'}

  -- Bahasa Indonesia
  definisi_id    TEXT,                        -- dari wordnetid atau kurasi manual
  contoh_id      TEXT[],                      -- contoh Indonesia

  -- Status kurasi
  status         TEXT NOT NULL DEFAULT 'draf', -- draf | tinjau | terverifikasi
  sumber         TEXT NOT NULL DEFAULT 'wn30', -- wn30 | wordnetid | kateglo
  catatan        TEXT,                        -- catatan redaksi

  created_at     TIMESTAMP NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT sinset_kelas_kata_check CHECK (kelas_kata IN ('n', 'v', 'a', 'r')),
  CONSTRAINT sinset_status_check CHECK (status IN ('draf', 'tinjau', 'terverifikasi'))
);

CREATE INDEX idx_sinset_kelas_kata ON sinset (kelas_kata);
CREATE INDEX idx_sinset_status ON sinset (status);
CREATE INDEX idx_sinset_ili ON sinset (ili_id) WHERE ili_id IS NOT NULL;

-- ============================================================
-- 3. Lema dalam synset (hubungan synset ↔ entri Kateglo)
-- ============================================================

CREATE TABLE sinset_lema (
  id             SERIAL PRIMARY KEY,
  sinset_id      TEXT NOT NULL REFERENCES sinset(id) ON DELETE CASCADE,
  lema           TEXT NOT NULL,                  -- kata Indonesia dari wordnetid
  entri_id       INTEGER REFERENCES entri(id) ON DELETE SET NULL,  -- NULL jika belum cocok
  makna_id       INTEGER REFERENCES makna(id) ON DELETE SET NULL,  -- NULL, diisi saat kurasi
  urutan         SMALLINT NOT NULL DEFAULT 0,
  terverifikasi  BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE setelah kurasi manual
  sumber         TEXT NOT NULL DEFAULT 'wordnetid',
  created_at     TIMESTAMP NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT sinset_lema_unik UNIQUE (sinset_id, lema)
);

CREATE INDEX idx_sinset_lema_sinset ON sinset_lema (sinset_id);
CREATE INDEX idx_sinset_lema_entri ON sinset_lema (entri_id) WHERE entri_id IS NOT NULL;
CREATE INDEX idx_sinset_lema_makna ON sinset_lema (makna_id) WHERE makna_id IS NOT NULL;
CREATE INDEX idx_sinset_lema_lema ON sinset_lema (LOWER(lema));
CREATE INDEX idx_sinset_lema_verifikasi ON sinset_lema (terverifikasi, sinset_id);

-- ============================================================
-- 4. Relasi antar-synset
-- ============================================================

CREATE TABLE relasi_sinset (
  id              SERIAL PRIMARY KEY,
  sinset_asal     TEXT NOT NULL REFERENCES sinset(id) ON DELETE CASCADE,
  sinset_tujuan   TEXT NOT NULL REFERENCES sinset(id) ON DELETE CASCADE,
  tipe_relasi     TEXT NOT NULL REFERENCES tipe_relasi(kode),
  sumber          TEXT NOT NULL DEFAULT 'wn30',
  created_at      TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT relasi_sinset_unik UNIQUE (sinset_asal, sinset_tujuan, tipe_relasi)
);

CREATE INDEX idx_relasi_sinset_asal ON relasi_sinset (sinset_asal);
CREATE INDEX idx_relasi_sinset_tujuan ON relasi_sinset (sinset_tujuan);
CREATE INDEX idx_relasi_sinset_tipe ON relasi_sinset (tipe_relasi);

-- ============================================================
-- 5. Trigger timestamp
-- ============================================================

CREATE TRIGGER trg_set_timestamp_fields__sinset
  BEFORE INSERT OR UPDATE ON sinset
  FOR EACH ROW EXECUTE FUNCTION set_timestamp_fields();

CREATE TRIGGER trg_set_timestamp_fields__sinset_lema
  BEFORE INSERT OR UPDATE ON sinset_lema
  FOR EACH ROW EXECUTE FUNCTION set_timestamp_fields();

COMMIT;
