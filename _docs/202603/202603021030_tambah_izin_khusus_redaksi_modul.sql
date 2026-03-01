-- Tambah izin khusus per modul redaksi:
-- 1) kelola_susun_kata -> SusunKataAdmin
-- 2) lihat_pencarian   -> PencarianAdmin
-- 3) audit_makna       -> AuditMaknaAdmin

BEGIN;

INSERT INTO izin (kode, nama, kelompok)
VALUES
  ('kelola_susun_kata', 'Kelola Susun Kata', 'gim'),
  ('lihat_pencarian', 'Lihat pencarian', 'statistik'),
  ('audit_makna', 'Audit makna', 'audit')
ON CONFLICT (kode) DO UPDATE
SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok;

-- Wariskan assignment izin lama agar peran yang sudah aktif tetap memiliki akses modul.
INSERT INTO peran_izin (peran_id, izin_id)
SELECT DISTINCT pi.peran_id, izin_baru.id
FROM peran_izin pi
JOIN izin izin_lama ON izin_lama.id = pi.izin_id
JOIN izin izin_baru ON izin_baru.kode = 'kelola_susun_kata'
WHERE izin_lama.kode = 'lihat_entri'
ON CONFLICT DO NOTHING;

INSERT INTO peran_izin (peran_id, izin_id)
SELECT DISTINCT pi.peran_id, izin_baru.id
FROM peran_izin pi
JOIN izin izin_lama ON izin_lama.id = pi.izin_id
JOIN izin izin_baru ON izin_baru.kode = 'lihat_pencarian'
WHERE izin_lama.kode = 'lihat_statistik'
ON CONFLICT DO NOTHING;

INSERT INTO peran_izin (peran_id, izin_id)
SELECT DISTINCT pi.peran_id, izin_baru.id
FROM peran_izin pi
JOIN izin izin_lama ON izin_lama.id = pi.izin_id
JOIN izin izin_baru ON izin_baru.kode = 'audit_makna'
WHERE izin_lama.kode = 'edit_makna'
ON CONFLICT DO NOTHING;

COMMIT;
