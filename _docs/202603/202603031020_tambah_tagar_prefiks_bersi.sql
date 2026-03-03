-- Tambah tagar prefiks bersi- (sementara, belum resmi)
INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan, aktif)
VALUES (
  'bersi',
  'bersi-',
  'prefiks',
  'Prefiks bersi- (sementara, belum resmi)',
  38,
  TRUE
)
ON CONFLICT (kode)
DO UPDATE SET
  nama = EXCLUDED.nama,
  kategori = EXCLUDED.kategori,
  deskripsi = EXCLUDED.deskripsi,
  urutan = EXCLUDED.urutan,
  aktif = EXCLUDED.aktif;
