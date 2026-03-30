-- Migration: Perbaiki duplikat kata susun_kata + tambah constraint UNIQUE(kata)
-- Tanggal: 2026-03-28

-- 1. Perbaiki duplikat "floit" pada 2026-03-31 (id=148) -> "abadi"
UPDATE susun_kata SET kata = 'abadi', keterangan = 'Pengganti duplikat "floit"', updated_at = now() WHERE id = 148;

-- 2. Tambahkan constraint UNIQUE pada kolom kata
ALTER TABLE susun_kata ADD CONSTRAINT susun_kata_kata_key UNIQUE (kata);
