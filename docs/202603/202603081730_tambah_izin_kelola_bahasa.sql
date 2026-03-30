BEGIN;

INSERT INTO izin (kode, nama, kelompok)
VALUES ('kelola_bahasa', 'Kelola master bahasa', 'glosarium')
ON CONFLICT (kode) DO NOTHING;

INSERT INTO peran_izin (peran_id, izin_id)
SELECT p.id, i.id
FROM peran p
JOIN izin i ON i.kode = 'kelola_bahasa'
WHERE p.kode = 'admin'
ON CONFLICT (peran_id, izin_id) DO NOTHING;

COMMIT;