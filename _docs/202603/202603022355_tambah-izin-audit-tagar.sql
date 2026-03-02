-- Migration: Tambah izin audit_tagar untuk halaman Audit Tagar redaksi
-- Tanggal: 2026-03-02

INSERT INTO izin (kode, nama, kelompok)
VALUES ('audit_tagar', 'Audit cakupan tagar entri', 'audit')
ON CONFLICT (kode) DO UPDATE
SET nama = EXCLUDED.nama,
    kelompok = EXCLUDED.kelompok;

INSERT INTO peran_izin (peran_id, izin_id)
SELECT p.id, i.id
FROM peran p, izin i
WHERE i.kode = 'audit_tagar'
  AND p.akses_redaksi = TRUE
ON CONFLICT DO NOTHING;
