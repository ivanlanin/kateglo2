-- Menautkan tagar -pun ke entri konsesif yang ditentukan user.
-- Catatan homonim: saat migrasi dibuat, semua target memiliki homonim NULL.

BEGIN;

INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan, aktif)
VALUES ('pun', '-pun', 'klitik', 'Klitik penegas/konsesif', 6, TRUE)
ON CONFLICT (kode)
DO UPDATE SET
  nama = EXCLUDED.nama,
  kategori = EXCLUDED.kategori,
  deskripsi = EXCLUDED.deskripsi,
  urutan = EXCLUDED.urutan,
  aktif = TRUE;

INSERT INTO entri_tagar (entri_id, tagar_id)
SELECT e.id, t.id
FROM entri e
JOIN tagar t ON t.kode = 'pun'
WHERE lower(e.entri) = ANY (
  ARRAY[
    'adapun',
    'andaipun',
    'ataupun',
    'bagaimanapun',
    'biarpun',
    'kalaupun',
    'kendatipun',
    'maupun',
    'meskipun',
    'sekalipun',
    'sementangpun',
    'sungguhpun',
    'walaupun'
  ]
)
ON CONFLICT DO NOTHING;

COMMIT;
