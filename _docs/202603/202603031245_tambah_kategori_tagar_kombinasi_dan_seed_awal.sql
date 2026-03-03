-- Menghapus pembatas kategori pada tabel tagar agar kategori fleksibel di level UI.
ALTER TABLE tagar
  DROP CONSTRAINT IF EXISTS tagar_kategori_check;

-- Seed awal tagar kategori kombinasi.
INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan, aktif)
VALUES
  ('meng--kan', 'meng--kan', 'kombinasi', 'Kombinasi meng- + -kan', 60, TRUE),
  ('meng--i', 'meng--i', 'kombinasi', 'Kombinasi meng- + -i', 61, TRUE),
  ('ber--kan', 'ber--kan', 'kombinasi', 'Kombinasi ber- + -kan', 62, TRUE),
  ('ber--i', 'ber--i', 'kombinasi', 'Kombinasi ber- + -i', 63, TRUE),
  ('di--kan', 'di--kan', 'kombinasi', 'Kombinasi di- + -kan', 64, TRUE),
  ('di--i', 'di--i', 'kombinasi', 'Kombinasi di- + -i', 65, TRUE),
  ('ter--kan', 'ter--kan', 'kombinasi', 'Kombinasi ter- + -kan', 66, TRUE),
  ('memper-', 'memper-', 'kombinasi', 'Kombinasi memper- (meng- + per-)', 67, TRUE),
  ('memper--kan', 'memper--kan', 'kombinasi', 'Kombinasi memper--kan (meng- + per- + -kan)', 68, TRUE),
  ('memper--i', 'memper--i', 'kombinasi', 'Kombinasi memper--i (meng- + per- + -i)', 69, TRUE)
ON CONFLICT (kode)
DO UPDATE SET
  nama = EXCLUDED.nama,
  kategori = EXCLUDED.kategori,
  deskripsi = EXCLUDED.deskripsi,
  urutan = EXCLUDED.urutan,
  aktif = TRUE;
