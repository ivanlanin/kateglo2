-- Tambah tagar konfiks untuk hasil kombinasi prefiks + sufiks
-- Digunakan oleh proses seed-entri-tagar tahap pasca-deteksi.

INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan, aktif)
VALUES
  ('ber--an', 'ber--an', 'prakategorial', 'Konfiks ber--an (kombinasi ber- + -an)', 50, TRUE),
  ('ke--an', 'ke--an', 'prakategorial', 'Konfiks ke--an (kombinasi ke- + -an)', 51, TRUE),
  ('per--an', 'per--an', 'prakategorial', 'Konfiks per--an (kombinasi per- + -an)', 52, TRUE),
  ('peng--an', 'peng--an', 'prakategorial', 'Konfiks peng--an (kombinasi peng- + -an)', 53, TRUE)
ON CONFLICT (kode)
DO UPDATE SET
  nama = EXCLUDED.nama,
  kategori = EXCLUDED.kategori,
  deskripsi = EXCLUDED.deskripsi,
  urutan = EXCLUDED.urutan,
  aktif = TRUE;
