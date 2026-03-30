-- Tambah tagar preposisi agar beda dengan prefiks ber-hubung
-- ke  (preposisi) ≠ ke- (prefiks)
-- di  (preposisi) ≠ di- (prefiks)

BEGIN;

INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan, aktif)
VALUES
  ('ke', 'ke', 'prakategorial', 'Preposisi ke (kata depan)', 20, TRUE),
  ('di', 'di', 'prakategorial', 'Preposisi di (kata depan)', 21, TRUE)
ON CONFLICT (kode) DO UPDATE
SET
  nama = EXCLUDED.nama,
  kategori = EXCLUDED.kategori,
  deskripsi = EXCLUDED.deskripsi,
  urutan = EXCLUDED.urutan,
  aktif = EXCLUDED.aktif;

COMMIT;
