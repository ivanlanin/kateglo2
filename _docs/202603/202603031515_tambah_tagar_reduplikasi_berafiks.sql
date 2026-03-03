-- Tambah tagar reduplikasi berafiks (R.berafiks)

INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan, aktif)
VALUES (
  'R.berafiks',
  'R.berafiks',
  'reduplikasi',
  'Reduplikasi berafiks: salah satu unsur merupakan bentuk berafiks dari unsur lain',
  43,
  TRUE
)
ON CONFLICT (kode)
DO UPDATE SET
  nama = EXCLUDED.nama,
  kategori = EXCLUDED.kategori,
  deskripsi = EXCLUDED.deskripsi,
  urutan = EXCLUDED.urutan,
  aktif = TRUE;
