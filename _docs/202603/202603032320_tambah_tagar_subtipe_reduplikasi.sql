-- Tambah tagar subtipe reduplikasi (R.penuh tetap menggunakan kode R)
INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan, aktif)
VALUES
  ('R.salin',  'R.salin',  'reduplikasi', 'Reduplikasi salin suara', 39, TRUE),
  ('R.purwa',  'R.purwa',  'reduplikasi', 'Reduplikasi sebagian awal (dwipurwa)', 40, TRUE),
  ('R.wasana', 'R.wasana', 'reduplikasi', 'Reduplikasi sebagian akhir (dwiwasana)', 41, TRUE),
  ('R.tri',    'R.tri',    'reduplikasi', 'Reduplikasi tiga unsur (trilingga)', 42, TRUE)
ON CONFLICT (kode)
DO UPDATE SET
  nama = EXCLUDED.nama,
  kategori = EXCLUDED.kategori,
  deskripsi = EXCLUDED.deskripsi,
  urutan = EXCLUDED.urutan,
  aktif = EXCLUDED.aktif;
