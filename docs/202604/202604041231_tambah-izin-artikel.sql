-- Tambah izin untuk fitur Artikel
-- tulis_artikel   : membuat, mengedit, menghapus, dan mengunggah gambar artikel (draf)
-- terbitkan_artikel: menerbitkan atau menarik artikel ke/dari publik

INSERT INTO izin (kode, nama, kelompok) VALUES
  ('tulis_artikel',      'Tulis artikel',      'artikel'),
  ('terbitkan_artikel',  'Terbitkan artikel',  'artikel')
ON CONFLICT (kode) DO NOTHING;
