-- Migrasi: Tabel fondasi KADI (Kamus Deskriptif Indonesia)
-- Tanggal: 2026-03-13
-- Deskripsi: Membuat 4 tabel baru untuk sistem penjaringan neologisme berbasis atestasi
--   - sumber_korpus: registri sumber data korpus
--   - kandidat_entri: staging area kandidat kata baru
--   - atestasi: bukti penggunaan kata dari sumber nyata
--   - riwayat_kurasi: audit trail keputusan redaksi

BEGIN;

-- ============================================================
-- 1. sumber_korpus — Registri sumber data korpus
-- ============================================================

CREATE TABLE sumber_korpus (
  id             serial PRIMARY KEY,
  kode           text UNIQUE NOT NULL,
  nama           text NOT NULL,
  tipe           text NOT NULL,
  genre          text,
  subgenre       text,
  url_dasar      text,
  bahasa         text DEFAULT 'id',
  aktif          boolean DEFAULT true,
  config         jsonb,
  terakhir_crawl timestamp without time zone,
  created_at     timestamp without time zone NOT NULL DEFAULT now(),
  updated_at     timestamp without time zone NOT NULL DEFAULT now(),

  CONSTRAINT sumber_korpus_tipe_check CHECK (tipe IN (
    'rss', 'api', 'scrape', 'upload', 'manual', 'ensiklopedia'
  )),
  CONSTRAINT sumber_korpus_genre_check CHECK (genre IS NULL OR genre IN (
    'jurnalistik', 'percakapan-digital', 'sastra', 'akademik',
    'hukum', 'ensiklopedik', 'lisan', 'bisnis', 'umum'
  ))
);

CREATE TRIGGER trg_set_timestamp_fields__sumber_korpus
  BEFORE INSERT OR UPDATE ON sumber_korpus
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp_fields();

COMMENT ON TABLE sumber_korpus IS 'Registri sumber data untuk korpus KADI';
COMMENT ON COLUMN sumber_korpus.kode IS 'Kode unik sumber, misal wikipedia-id-pilihan';
COMMENT ON COLUMN sumber_korpus.tipe IS 'Jenis sumber: rss, api, scrape, upload, manual, ensiklopedia';
COMMENT ON COLUMN sumber_korpus.genre IS 'Genre korpus sesuai taksonomi KADI';
COMMENT ON COLUMN sumber_korpus.config IS 'Konfigurasi teknis sumber (rate_limit, selectors, auth)';
COMMENT ON COLUMN sumber_korpus.terakhir_crawl IS 'Waktu terakhir sumber ini di-crawl';

-- ============================================================
-- 2. kandidat_entri — Staging area kandidat kata baru
-- ============================================================

CREATE TABLE kandidat_entri (
  id              serial PRIMARY KEY,
  kata            text NOT NULL,
  indeks          text NOT NULL,
  jenis           text,
  kelas_kata      text,
  definisi_awal   text,
  ragam           text,
  bahasa_campur   text,
  status          text NOT NULL DEFAULT 'menunggu',
  catatan_redaksi text,
  entri_id        integer REFERENCES entri(id),
  kontributor_id  integer REFERENCES pengguna(id),
  sumber_scraper  text,
  prioritas       smallint DEFAULT 0,
  created_at      timestamp without time zone NOT NULL DEFAULT now(),
  updated_at      timestamp without time zone NOT NULL DEFAULT now(),

  CONSTRAINT kandidat_kata_check CHECK (trim(kata) <> ''),
  CONSTRAINT kandidat_status_check CHECK (status IN (
    'menunggu', 'ditinjau', 'disetujui', 'ditolak', 'tunda'
  )),
  CONSTRAINT kandidat_jenis_check CHECK (jenis IS NULL OR jenis IN (
    'kata-dasar', 'kata-majemuk', 'frasa', 'singkatan', 'serapan'
  ))
);

CREATE UNIQUE INDEX idx_kandidat_indeks_uq  ON kandidat_entri (indeks);
CREATE INDEX        idx_kandidat_status     ON kandidat_entri (status);
CREATE INDEX        idx_kandidat_prioritas  ON kandidat_entri (prioritas DESC, created_at DESC);
CREATE INDEX        idx_kandidat_created    ON kandidat_entri (created_at DESC);

CREATE TRIGGER trg_set_timestamp_fields__kandidat_entri
  BEFORE INSERT OR UPDATE ON kandidat_entri
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp_fields();

COMMENT ON TABLE kandidat_entri IS 'Staging area untuk kandidat kata baru yang menunggu kurasi redaksi';
COMMENT ON COLUMN kandidat_entri.kata IS 'Bentuk kata asli';
COMMENT ON COLUMN kandidat_entri.indeks IS 'Bentuk ternormalisasi (lowercase, trim) untuk dedup';
COMMENT ON COLUMN kandidat_entri.jenis IS 'Jenis kandidat: kata-dasar, kata-majemuk, frasa, singkatan, serapan';
COMMENT ON COLUMN kandidat_entri.status IS 'Status kurasi: menunggu, ditinjau, disetujui, ditolak, tunda';
COMMENT ON COLUMN kandidat_entri.entri_id IS 'Referensi ke entri kamus jika sudah dimigrasi';
COMMENT ON COLUMN kandidat_entri.sumber_scraper IS 'Kode sumber asal kandidat (referensi ke sumber_korpus.kode)';
COMMENT ON COLUMN kandidat_entri.prioritas IS '0=normal, 1=tinggi, 2=segera';

-- ============================================================
-- 3. atestasi — Bukti penggunaan kata dari sumber nyata
-- ============================================================

CREATE TABLE atestasi (
  id             serial PRIMARY KEY,
  kandidat_id    integer NOT NULL REFERENCES kandidat_entri(id) ON DELETE CASCADE,
  kutipan        text NOT NULL,
  konteks_pra    text,
  konteks_pasca  text,
  sumber_tipe    text NOT NULL,
  sumber_url     text,
  sumber_nama    text,
  sumber_penulis text,
  tanggal_terbit date,
  crawler_id     text,
  skor_konfiden  numeric(3,2),
  penulis_anonim boolean DEFAULT false,
  konten_dihapus boolean DEFAULT false,
  aktif          boolean DEFAULT true,
  created_at     timestamp without time zone NOT NULL DEFAULT now(),

  CONSTRAINT atestasi_sumber_tipe_check CHECK (sumber_tipe IN (
    'berita', 'web', 'media-sosial', 'buku', 'jurnal', 'kontribusi', 'ensiklopedia'
  ))
);

CREATE INDEX idx_atestasi_kandidat ON atestasi (kandidat_id);
CREATE INDEX idx_atestasi_tanggal  ON atestasi (tanggal_terbit DESC);

COMMENT ON TABLE atestasi IS 'Bukti penggunaan kata dari sumber nyata (kutipan + metadata)';
COMMENT ON COLUMN atestasi.kutipan IS 'Kalimat asli yang mengandung kata kandidat';
COMMENT ON COLUMN atestasi.konteks_pra IS 'Kalimat sebelumnya (opsional)';
COMMENT ON COLUMN atestasi.konteks_pasca IS 'Kalimat sesudahnya (opsional)';
COMMENT ON COLUMN atestasi.sumber_tipe IS 'Jenis sumber: berita, web, media-sosial, buku, jurnal, kontribusi, ensiklopedia';
COMMENT ON COLUMN atestasi.sumber_url IS 'URL sumber asli untuk atribusi';
COMMENT ON COLUMN atestasi.sumber_nama IS 'Nama sumber (kode sumber_korpus atau nama manual)';
COMMENT ON COLUMN atestasi.crawler_id IS 'ID proses crawler yang membuat atestasi ini';
COMMENT ON COLUMN atestasi.skor_konfiden IS 'Skor kepercayaan 0.00-1.00 dari heuristik NLP';

-- ============================================================
-- 4. riwayat_kurasi — Audit trail keputusan redaksi
-- ============================================================

CREATE TABLE riwayat_kurasi (
  id           serial PRIMARY KEY,
  kandidat_id  integer NOT NULL REFERENCES kandidat_entri(id) ON DELETE CASCADE,
  redaktur_id  integer NOT NULL REFERENCES pengguna(id),
  aksi         text NOT NULL,
  status_lama  text,
  status_baru  text,
  catatan      text,
  perubahan    jsonb,
  created_at   timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_riwayat_kandidat  ON riwayat_kurasi (kandidat_id);
CREATE INDEX idx_riwayat_redaktur  ON riwayat_kurasi (redaktur_id);
CREATE INDEX idx_riwayat_created   ON riwayat_kurasi (created_at DESC);

COMMENT ON TABLE riwayat_kurasi IS 'Audit trail untuk setiap aksi redaksi terhadap kandidat kata';
COMMENT ON COLUMN riwayat_kurasi.aksi IS 'Jenis aksi: tinjau, setujui, tolak, tunda, edit';
COMMENT ON COLUMN riwayat_kurasi.perubahan IS 'Diff field yang diubah (format JSON)';

-- ============================================================
-- 5. Seed data — Sumber korpus Wikipedia
-- ============================================================

INSERT INTO sumber_korpus (kode, nama, tipe, genre, url_dasar, bahasa, config)
VALUES (
  'wikipedia-id-pilihan',
  'Wikipedia Bahasa Indonesia — Artikel Pilihan',
  'ensiklopedia',
  'ensiklopedik',
  'https://id.wikipedia.org',
  'id',
  '{"kategori": "Kategori:Artikel_pilihan", "api": "https://id.wikipedia.org/w/api.php", "rate_limit_ms": 1000}'::jsonb
);

-- ============================================================
-- 6. Seed data — Izin redaksi untuk modul KADI
-- ============================================================

INSERT INTO izin (kode, nama, kelompok) VALUES
  ('lihat_kandidat',        'Lihat Kandidat Kata',   'kadi'),
  ('edit_kandidat',         'Sunting Kandidat Kata',  'kadi'),
  ('ubah_status_kandidat',  'Ubah Status Kandidat',   'kadi'),
  ('hapus_kandidat',        'Hapus Kandidat Kata',    'kadi');

-- Berikan semua izin KADI ke peran admin (peran_id = 3)
INSERT INTO peran_izin (peran_id, izin_id)
SELECT 3, id FROM izin WHERE kelompok = 'kadi';

-- Berikan izin lihat ke peran penyunting (peran_id = 2)
INSERT INTO peran_izin (peran_id, izin_id)
SELECT 2, id FROM izin WHERE kode IN ('lihat_kandidat', 'edit_kandidat', 'ubah_status_kandidat');

COMMIT;
