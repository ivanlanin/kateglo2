-- ============================================================
-- SINKRONISASI MASTER BIDANG
-- Tanggal: 2026-03-08
-- Deskripsi:
--   1. Ubah bidang.kode dari format slug menjadi kode singkatan KBBI
--   2. Tambahkan entri bidang yang ada di label.bidang tapi belum di tabel bidang
--   3. Tambahkan entri bidang baru dari referensi daftar-bidang.xlsx
--   4. Set bidang.aktif = false untuk bidang yang tidak terpakai
--   5. Hapus label.kategori = 'bidang'
-- ============================================================

BEGIN;

-- ============================================================
-- BAGIAN 1: Ubah kode dari slug ke kode singkatan
-- ============================================================

UPDATE bidang SET kode = 'Isl'   WHERE nama = 'Agama Islam';
UPDATE bidang SET kode = 'Kris'  WHERE nama = 'Agama Kristen';
UPDATE bidang SET kode = 'Antr'  WHERE nama = 'Antropologi';
UPDATE bidang SET kode = 'Ark'   WHERE nama = 'Arkeologi';
UPDATE bidang SET kode = 'Ars'   WHERE nama = 'Arsitektur';
UPDATE bidang SET kode = 'Bio'   WHERE nama = 'Biologi';
UPDATE bidang SET kode = 'Ek'    WHERE nama = 'Ekonomi dan Keuangan';
UPDATE bidang SET kode = 'El'    WHERE nama = 'Elektronika';
UPDATE bidang SET kode = 'Far'   WHERE nama = 'Farmasi dan Farmakologi';
UPDATE bidang SET kode = 'Fil'   WHERE nama = 'Filsafat';
UPDATE bidang SET kode = 'Fis'   WHERE nama = 'Fisika';
UPDATE bidang SET kode = 'Geo'   WHERE nama = 'Geografi dan Geologi';
UPDATE bidang SET kode = 'Graf'  WHERE nama = 'Grafika';
UPDATE bidang SET kode = 'Huk'   WHERE nama = 'Hukum';
UPDATE bidang SET kode = 'Kom'   WHERE nama = 'Ilmu Komunikasi';
UPDATE bidang SET kode = 'Dok'   WHERE nama = 'Kedokteran dan Fisiologi';
UPDATE bidang SET kode = 'Hut'   WHERE nama = 'Kehutanan';
UPDATE bidang SET kode = 'Mil'   WHERE nama = 'Kemiliteran';
UPDATE bidang SET kode = 'Keu'   WHERE nama = 'Keuangan';
UPDATE bidang SET kode = 'Kim'   WHERE nama = 'Kimia';
UPDATE bidang SET kode = 'Komp'  WHERE nama = 'Komputer';
UPDATE bidang SET kode = 'Ling'  WHERE nama = 'Linguistik';
UPDATE bidang SET kode = 'Man'   WHERE nama = 'Manajemen';
UPDATE bidang SET kode = 'Mat'   WHERE nama = 'Matematika';
UPDATE bidang SET kode = 'Mek'   WHERE nama = 'Mekanika';
UPDATE bidang SET kode = 'Olr'   WHERE nama = 'Olahraga';
UPDATE bidang SET kode = 'Prw'   WHERE nama = 'Pariwisata';
UPDATE bidang SET kode = 'Lay'   WHERE nama = 'Pelayaran';
UPDATE bidang SET kode = 'Dik'   WHERE nama = 'Pendidikan';
UPDATE bidang SET kode = 'Terb'  WHERE nama = 'Penerbangan';
UPDATE bidang SET kode = 'Dag'   WHERE nama = 'Perdagangan';
UPDATE bidang SET kode = 'Hub'   WHERE nama = 'Perhubungan';
UPDATE bidang SET kode = 'Ikn'   WHERE nama = 'Perikanan';
UPDATE bidang SET kode = 'Kap'   WHERE nama = 'Perkapalan';
UPDATE bidang SET kode = 'Tan'   WHERE nama = 'Pertanian';
UPDATE bidang SET kode = 'Tern'  WHERE nama = 'Peternakan';
UPDATE bidang SET kode = 'Pet'   WHERE nama = 'Petrologi dan Migas';
UPDATE bidang SET kode = 'Pol'   WHERE nama = 'Politik dan Pemerintahan';
UPDATE bidang SET kode = 'Psi'   WHERE nama = 'Psikologi';
UPDATE bidang SET kode = 'Sas'   WHERE nama = 'Sastra';
UPDATE bidang SET kode = 'Sos'   WHERE nama = 'Sosiologi';
UPDATE bidang SET kode = 'Stat'  WHERE nama = 'Statistik';
UPDATE bidang SET kode = 'Tbg'   WHERE nama = 'Tata Boga';
UPDATE bidang SET kode = 'Tbs'   WHERE nama = 'Tata Busana';
UPDATE bidang SET kode = 'Trs'   WHERE nama = 'Tata Rias';
UPDATE bidang SET kode = 'Tek'   WHERE nama = 'Teknik';
UPDATE bidang SET kode = 'Umum'  WHERE nama = 'Umum';

-- ============================================================
-- BAGIAN 2: Tambah entri dari label.bidang yang belum ada
-- (bidang yang ada di label KBBI tapi belum di tabel bidang)
-- ============================================================

INSERT INTO bidang (kode, nama) VALUES
  ('Adm',    'Administrasi dan Kepegawaian'),
  ('Bud',    'Agama Buddha'),
  ('Hin',    'Agama Hindu'),
  ('Kat',    'Agama Katolik'),
  ('Anat',   'Anatomi'),
  ('Astrol', 'Astrologi'),
  ('Astron', 'Astronomi'),
  ('Bakt',   'Bakteriologi'),
  ('Bot',    'Botani'),
  ('Dem',    'Demografi'),
  ('Ent',    'Entomologi'),
  ('Filol',  'Filologi'),
  ('Hid',    'Hidrologi'),
  ('Hidm',   'Hidrometeorologi'),
  ('Dirg',   'Kedirgantaraan'),
  ('Kes',    'Kesehatan'),
  ('Sen',    'Kesenian'),
  ('Metal',  'Metalurgi'),
  ('Met',    'Meteorologi'),
  ('Mik',    'Mikologi'),
  ('Min',    'Mineralogi'),
  ('Mus',    'Musik'),
  ('Idt',    'Perindustrian dan Kerajinan'),
  ('Tas',    'Tasawuf'),
  ('Telekom','Telekomunikasi'),
  ('Zool',   'Zoologi')
ON CONFLICT (kode) DO NOTHING;

-- ============================================================
-- BAGIAN 3: Tambah entri baru dari referensi daftar-bidang.xlsx
-- (yang belum ada di label maupun tabel bidang)
-- ============================================================

INSERT INTO bidang (kode, nama) VALUES
  ('Bu',     'Budaya'),
  ('Ekol',   'Ekologi'),
  ('Ft',     'Fotografi'),
  ('Geof',   'Geofisika'),
  ('Gz',     'Ilmu Gizi'),
  ('Pang',   'Ilmu Pangan'),
  ('Pust',   'Ilmu Perpustakaan dan Dokumentasi'),
  ('Tn',     'Ilmu Tanah'),
  ('Pls',    'Kepolisian'),
  ('Lgk',    'Lingkungan'),
  ('Nanotek','Nanoteknologi'),
  ('Or',     'Ornitologi'),
  ('Osn',    'Oseanografi'),
  ('Oto',    'Otomotif'),
  ('Film',   'Perfilman'),
  ('Hot',    'Perhotelan'),
  ('Han',    'Pertahanan'),
  ('Prm',    'Pramuka'),
  ('Rpb',    'Rupabumi'),
  ('Tamb',   'Teknik Pertambangan'),
  ('Sip',    'Teknik Sipil'),
  ('If',     'Teknologi Informasi'),
  ('Trp',    'Transportasi')
ON CONFLICT (kode) DO NOTHING;

-- ============================================================
-- BAGIAN 4: Set aktif berdasarkan pemakaian
-- aktif = true  : dipakai di makna.bidang, contoh.bidang, atau glosarium.bidang_id
-- aktif = false : tidak dipakai di mana pun
-- ============================================================

UPDATE bidang
SET aktif = false
WHERE kode NOT IN (
  SELECT DISTINCT bidang FROM makna WHERE bidang IS NOT NULL
  UNION
  SELECT DISTINCT bidang FROM contoh WHERE bidang IS NOT NULL
)
AND id NOT IN (
  SELECT DISTINCT bidang_id FROM glosarium WHERE bidang_id IS NOT NULL
);

-- ============================================================
-- BAGIAN 5: Hapus label.kategori = 'bidang'
-- ============================================================

DELETE FROM label WHERE kategori = 'bidang';

COMMIT;
