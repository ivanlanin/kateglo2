-- ============================================================
-- SINKRONISASI MASTER BAHASA
-- Tanggal: 2026-03-08
-- Deskripsi:
--   1. Buat tabel bahasa (master bahasa dengan iso2/iso3)
--   2. Isi dari label.bahasa (sumber primer), dengan resolusi konflik:
--      - Sb (Sumbawa) → diganti kode Sbw; entri Sb (Sabu) dari Excel
--      - Mrd (Bian Marind Deg) → diganti kode BMr; entri Mrd (Moraid) dari Excel
--   3. Tambahkan entri dari referensi daftar-bahasa.xlsx yang belum ada
--   4. Tambahkan bahasa yang hanya ada di etimologi (dialek Tionghoa, dll.)
--   5. Set iso2 = 'en' untuk Inggris
--   6. Perbaiki makna.bahasa: Sb→Sbw, Mrd→BMr, XXX→null
--   7. Perbaiki contoh.bahasa: 'Minangkabau'→'Mk' (nama penuh → kode)
--   8. Tambah kolom etimologi.bahasa_id (FK), isi, lalu hapus etimologi.bahasa
--   9. Tambah kolom glosarium.bahasa_id (FK), isi, lalu hapus glosarium.bahasa
--  10. Set bahasa.aktif = false untuk bahasa tidak terpakai di makna/contoh
--  11. Hapus label.kategori = 'bahasa'
-- ============================================================

BEGIN;

-- ============================================================
-- BAGIAN 1: Buat tabel bahasa
-- ============================================================

CREATE TABLE bahasa (
  id         serial primary key,
  kode       text not null,
  nama       text not null,
  iso2       text,
  iso3       text,
  aktif      boolean not null default true,
  keterangan text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint bahasa_kode_key unique (kode),
  constraint bahasa_nama_key unique (nama)
);

CREATE TRIGGER trg_set_timestamp_fields__bahasa
  BEFORE INSERT OR UPDATE ON bahasa
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp_fields();

-- ============================================================
-- BAGIAN 2: Isi dari label.bahasa (sumber primer KBBI)
-- Resolusi konflik:
--   'Sb'  (Sumbawa) → kode menjadi 'Sbw' (Excel: Sb = Sabu, Sbw = Sumbawa)
--   'Mrd' (Bian Marind Deg) → kode menjadi 'BMr' (Excel: Mrd = Moraid)
-- ============================================================

INSERT INTO bahasa (kode, nama)
SELECT
  CASE kode
    WHEN 'Sb'  THEN 'Sbw'   -- Sumbawa: ikuti kode Excel
    WHEN 'Mrd' THEN 'BMr'   -- Bian Marind Deg: ikuti kode Excel
    ELSE kode
  END,
  nama
FROM label
WHERE kategori = 'bahasa'
ORDER BY nama;

-- ============================================================
-- BAGIAN 3: Perbaiki nilai di makna.bahasa dan contoh.bahasa
-- ============================================================

-- Sesuaikan kode yang berubah akibat resolusi konflik
UPDATE makna SET bahasa = 'Sbw' WHERE bahasa = 'Sb';   -- Sumbawa → kode baru Sbw
UPDATE makna SET bahasa = 'BMr' WHERE bahasa = 'Mrd';  -- Bian Marind Deg → kode baru BMr
UPDATE makna SET bahasa = NULL  WHERE bahasa = 'XXX';  -- Kode tidak dikenal → null

-- Ubah contoh.bahasa dari nama penuh ke kode singkat
UPDATE contoh SET bahasa = 'Mk' WHERE bahasa = 'Minangkabau';

-- ============================================================
-- BAGIAN 4: Tambahkan entri dari referensi daftar-bahasa.xlsx
-- yang belum ada di tabel (dari label). Gunakan ON CONFLICT DO NOTHING
-- agar entri yang sudah ada dari label tidak tertimpa.
-- Catatan: 'Dam' (Damal) dan 'Ss' (Sasak) sengaja dihilangkan
-- karena namanya sudah ada dalam tabel (Dml=Damal, Sk=Sasak).
-- ============================================================

INSERT INTO bahasa (kode, nama) VALUES
  ('Ab',    'Abui'),
  ('Abn',   'Abun'),
  ('Ad',    'Adang'),
  ('Alr',   'Alor'),
  ('Aln',   'Alune'),
  ('ArS',   'Armati Sarma'),
  ('Auy',   'Auye'),
  ('Bc',    'Bacan'),
  ('Bd',    'Bada'),
  ('BhDi',  'Bahau Diaq Lay'),
  ('BhUj',  'Bahau Ujoh Bilang'),
  ('BjPd',  'Bajau Pondong'),
  ('Bjo',   'Bajo'),
  ('Bkt',   'Bakatik'),
  ('Bkp',   'Bakumpai'),
  ('Bnd',   'Banda'),
  ('Bgi',   'Banggai'),
  ('Btk',   'Bantik'),
  ('Bas',   'Basap'),
  ('Bat',   'Batik'),
  ('Btl',   'Batuley'),
  ('Ba',    'Baun'),
  ('Beng',  'Bengkulu'),
  ('Bla',   'Blagar'),
  ('Bo',    'Boing'),
  ('BlM',   'Bolaang Mongondow'),
  ('BuBu',  'Budong-Budong'),
  ('Buli',  'Buli'),
  ('Blg',   'Bulungan'),
  ('Bun',   'Bunak'),
  ('Bgk',   'Bungku'),
  ('Buo',   'Buol'),
  ('Ca',    'Cia-Cia'),
  ('Cl',    'Culambacu'),
  ('Dwn',   'Dawan'),
  ('DyNg',  'Dayak Ngaju'),
  ('Dvn',   'Devayan'),
  ('Dd',    'Dondo'),
  ('Dey',   'Dusun Deyah'),
  ('Ekr',   'Ekari'),
  ('Eln',   'Elnama'),
  ('Eng',   'Enggano'),
  ('Gal',   'Galela'),
  ('Gn',    'Gane'),
  ('Gau',   'Gaura'),
  ('Gor',   'Gorontalo'),
  ('Hat',   'Hatam'),
  ('Hw',    'Hawaii'),
  ('He',    'Helong'),
  ('Ht',    'Hitu'),
  ('Ibo',   'Ibo'),
  ('Imb',   'Imbuti (Marind)'),
  ('In',    'India'),
  ('Ira',   'Irarutu'),
  ('Isrw',  'Isirawa'),
  ('Kae',   'Kaera'),
  ('Khm',   'Kaham'),
  ('Kai',   'Kaiely'),
  ('Klb',   'Kalabra'),
  ('Ka',    'Kamang'),
  ('Kb',    'Kambera'),
  ('Ky',    'Karey'),
  ('Kyn',   'Kayaan'),
  ('KAg',   'Kayu Agung'),
  ('Kei',   'Kei'),
  ('Kem',   'Kemak'),
  ('Ke',    'Kenyah'),
  ('Krc',   'Kerinci'),
  ('Kl',    'Klesi'),
  ('Koa',   'Koa-Koa'),
  ('Kkd',   'Kokoda'),
  ('Kol',   'Kola'),
  ('Kla',   'Kola-Kola'),
  ('Kbai',  'Kombai'),
  ('Ko',    'Komering'),
  ('Kon',   'Kone-konee'),
  ('Kj',    'Konjo'),
  ('Kor',   'Korea'),
  ('Kls',   'Kulisusu'),
  ('Kur',   'Kur'),
  ('Lmh',   'Lamaholot'),
  ('Lj',    'Lauje'),
  ('Lmg',   'Lemolang'),
  ('Let',   'Letti'),
  ('Lio',   'Lio'),
  ('Lh',    'Luhu'),
  ('Ldy',   'Lundayeh'),
  ('Maa',   'Maanyan'),
  ('Mbt',   'Maibrat'),
  ('Mai',   'Mairasi'),
  ('MkD',   'Makian Dalam'),
  ('MkL',   'Makian Luar'),
  ('Mnm',   'Manem'),
  ('Mg',    'Manggarai'),
  ('Mar',   'Marlasi'),
  ('Mee',   'Mee'),
  ('MAb',   'Melayu Ambon'),
  ('MBa',   'Melayu Bangka'),
  ('MBl',   'Melayu Belitung'),
  ('Kpr',   'Melayu Kep. Riau'),
  ('MKp',   'Melayu Kupang'),
  ('Mtm',   'Melayu Tamiang'),
  ('Mt',    'Mentawai'),
  ('Myh',   'Meyah'),
  ('Tsg',   'Minahasa Tonsawang'),
  ('Moa',   'Moa'),
  ('Mdl',   'Modole'),
  ('MSg',   'Moi Sigin'),
  ('Mom',   'Momuna'),
  ('Mooi',  'Mooi'),
  ('Mrd',   'Moraid'),
  ('Me',    'Moronene'),
  ('Nbg',   'Namblong'),
  ('Nla',   'Namla'),
  ('Nd',    'Ndao'),
  ('Ndb',   'Nedebang'),
  ('Ng',    'Ngada'),
  ('Ngl',   'Ngalum'),
  ('Og',    'Ogan'),
  ('Oi',    'Oirata'),
  ('Oy',    'Orya'),
  ('Pm',    'Pamona'),
  ('Psr',   'Pasir (Paser)'),
  ('Pi',    'Piliana'),
  ('Pnk',   'Ponosakan'),
  ('Rrk',   'Rarankwa'),
  ('Rjg',   'Rejang'),
  ('Ro',    'Rongga'),
  ('Rt',    'Rote'),
  ('Sb',    'Sabu'),
  ('Sh',    'Sahu'),
  ('Sls',   'Salas'),
  ('Sln',   'Saluan'),
  ('Sw',    'Sawai'),
  ('Seg',   'Segaai'),
  ('Seko',  'Seko'),
  ('Slw',   'Seluwarsa'),
  ('Srm',   'Seram'),
  ('Sa',    'Serua'),
  ('SLa',   'Serui Laut'),
  ('Sg',    'Sigulai'),
  ('Si',    'Sikka'),
  ('Sob',   'Sobey'),
  ('Su',    'Sula'),
  ('Smb',   'Sumba'),
  ('Taa',   'Taa'),
  ('Tab',   'Tabla'),
  ('Tag',   'Tagalog'),
  ('Tm',    'Taman'),
  ('tmg',   'Tamiang'),
  ('Trbar', 'Tarangan Barat'),
  ('Trtim', 'Tarangan Timur'),
  ('Trf',   'Tarfia'),
  ('Tht',   'Tehit'),
  ('Tew',   'Teiwa'),
  ('Teng',  'Tenggalan'),
  ('Tr',    'Ternate'),
  ('Te',    'Tetun'),
  ('Th',    'Thai'),
  ('Td',    'Tidung'),
  ('Tbt',   'Tobati'),
  ('Tb',    'Tobelo'),
  ('Tot',   'Totoli'),
  ('Tsw',   'Tswana'),
  ('Tj',    'Tunjung'),
  ('Tur',   'Turki'),
  ('WaKe',  'Wambon Kenondik'),
  ('Wr',    'Warry'),
  ('We',    'Wemale'),
  ('Ylh',   'Yalahatan'),
  ('YaGr',  'Yali Anggruk'),
  ('Zu',    'Zulu')
ON CONFLICT (kode) DO NOTHING;

-- ============================================================
-- BAGIAN 5: Tambahkan bahasa yang hanya ada di etimologi
-- (tidak ada di label maupun Excel, kode dibuat sesuai konvensi)
-- Catatan: Thai (Th) sudah ada dari Excel (Bagian 4)
-- ============================================================

INSERT INTO bahasa (kode, nama, keterangan) VALUES
  ('Amy',  'Amoy',           'Dialek Tionghoa Hokkien dari Amoy (Xiamen), Fujian; mencakup varian Amoy/Ts'),
  ('Chj',  'Chiangchiu',     'Dialek Tionghoa Minnan dari Zhangzhou (Chiangchiu), Fujian'),
  ('Fch',  'Foochow',        'Dialek Tionghoa dari Fuzhou (Foochow), Fujian'),
  ('Hak',  'Hakka',          'Dialek Tionghoa dari komunitas Hakka'),
  ('Hi',   'Hindi',          'Bahasa Indo-Arya dari India Utara'),
  ('IngA', 'Inggris Amerika', 'Varian bahasa Inggris yang digunakan di Amerika Serikat'),
  ('Kan',  'Kanton',         'Dialek Tionghoa Yue dari Guangdong (Kanton)'),
  ('Mdn',  'Mandarin',       'Bahasa Tionghoa standar (Putonghua/Guoyu)'),
  ('Ngp',  'Ningpo',         'Dialek Tionghoa Wu dari Ningbo (Ningpo), Zhejiang'),
  ('Tam',  'Tamil',          'Bahasa Dravida dari India Selatan dan Sri Lanka'),
  ('Tch',  'Teochew',        'Dialek Tionghoa Minnan dari Chaozhou (Teochew), Guangdong'),
  ('Tgh',  'Tionghoa',       'Sebutan umum untuk bahasa atau dialek Tionghoa'),
  ('Tng',  'Tong''an',       'Dialek Tionghoa Minnan dari Tongan, Fujian; mencakup varian Tong''an/A'),
  ('Tsn',  'Tsoanchiu',      'Dialek Tionghoa Minnan dari Quanzhou (Tsoanchiu), Fujian')
ON CONFLICT (kode) DO NOTHING;

-- ============================================================
-- BAGIAN 6: Set kode ISO untuk bahasa internasional
-- ============================================================

UPDATE bahasa SET iso2 = 'en' WHERE kode = 'Ing';  -- Inggris

-- ============================================================
-- BAGIAN 7: Tambah kolom bahasa_id ke etimologi, isi, hapus kolom lama
-- ============================================================

ALTER TABLE etimologi
  ADD COLUMN bahasa_id integer
  REFERENCES bahasa(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Isi bahasa_id berdasarkan kecocokan nama (mayoritas kasus)
UPDATE etimologi e
SET bahasa_id = b.id
FROM bahasa b
WHERE e.bahasa = b.nama;

-- Kasus khusus: nama di etimologi berbeda dari nama di tabel bahasa
UPDATE etimologi
SET bahasa_id = (SELECT id FROM bahasa WHERE kode = 'Par')
WHERE bahasa = 'Persia';  -- label menyimpan sebagai 'Parsi'

UPDATE etimologi
SET bahasa_id = (SELECT id FROM bahasa WHERE kode = 'Amy')
WHERE bahasa = 'Amoy/Ts';  -- gabung ke Amoy

UPDATE etimologi
SET bahasa_id = (SELECT id FROM bahasa WHERE kode = 'Tng')
WHERE bahasa LIKE 'Tong''an%';  -- gabung Tong'an dan Tong'an/A

CREATE INDEX idx_etimologi_bahasa_id ON etimologi USING btree (bahasa_id);

-- Hapus kolom lama dan indeksnya
DROP INDEX IF EXISTS idx_etimologi_bahasa;
ALTER TABLE etimologi DROP COLUMN bahasa;

-- ============================================================
-- BAGIAN 8: Tambah kolom bahasa_id ke glosarium, isi, hapus kolom lama
-- ============================================================

ALTER TABLE glosarium
  ADD COLUMN bahasa_id integer
  REFERENCES bahasa(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Isi dari bahasa.iso2 = 'en' (semua data glosarium saat ini adalah Inggris)
UPDATE glosarium g
SET bahasa_id = b.id
FROM bahasa b
WHERE g.bahasa = b.iso2;

-- Set NOT NULL setelah semua baris terisi
ALTER TABLE glosarium ALTER COLUMN bahasa_id SET NOT NULL;

CREATE INDEX idx_glosarium_bahasa_id ON glosarium USING btree (bahasa_id);

-- Hapus kolom lama dan indeksnya
DROP INDEX IF EXISTS idx_glosarium_aktif_bahasa_indonesia;
ALTER TABLE glosarium DROP COLUMN bahasa;

-- Buat ulang indeks yang relevan dengan bahasa_id
CREATE INDEX idx_glosarium_aktif_bahasa_id_indonesia
  ON glosarium USING btree (bahasa_id, indonesia)
  WHERE aktif = true;

-- ============================================================
-- BAGIAN 9: Set bahasa.aktif berdasarkan pemakaian di makna dan contoh
-- aktif = true  : kode terpakai di makna.bahasa atau contoh.bahasa
-- aktif = false : tidak terpakai (termasuk semua bahasa etimologi-only)
-- ============================================================

UPDATE bahasa
SET aktif = false
WHERE kode NOT IN (
  SELECT DISTINCT bahasa FROM makna  WHERE bahasa IS NOT NULL
  UNION
  SELECT DISTINCT bahasa FROM contoh WHERE bahasa IS NOT NULL
);

-- ============================================================
-- BAGIAN 10: Hapus label.kategori = 'bahasa'
-- ============================================================

DELETE FROM label WHERE kategori = 'bahasa';

COMMIT;
