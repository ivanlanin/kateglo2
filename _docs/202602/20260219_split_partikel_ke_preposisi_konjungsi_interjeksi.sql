-- Split kelas kata partikel (p) menjadi preposisi, konjungsi, interjeksi (bertahap)
-- Urutan kelas kata setelah numeralia:
-- preposisi, konjungsi, interjeksi, partikel
-- Tanggal: 2026-02-19

BEGIN;

-- 1) Tambah/aktifkan label kelas kata baru
INSERT INTO label (kategori, kode, nama, keterangan, aktif, urutan)
VALUES
  ('kelas-kata', 'prep', 'Preposisi', 'Kata depan', TRUE, 7),
  ('kelas-kata', 'konj', 'Konjungsi', 'Kata hubung', TRUE, 8),
  ('kelas-kata', 'intj', 'Interjeksi', 'Kata seru', TRUE, 9)
ON CONFLICT (kategori, kode)
DO UPDATE SET
  nama = EXCLUDED.nama,
  keterangan = EXCLUDED.keterangan,
  aktif = TRUE,
  urutan = EXCLUDED.urutan,
  updated_at = NOW();

-- 2) Pastikan label partikel tetap aktif di urutan terakhir blok setelah interjeksi
UPDATE label
SET urutan = 10,
    aktif = TRUE,
    updated_at = NOW()
WHERE kategori = 'kelas-kata'
  AND (LOWER(TRIM(COALESCE(kode, ''))) = 'p' OR LOWER(TRIM(COALESCE(nama, ''))) = 'partikel');

-- 3) Normalisasi urutan label kelas kata utama sesuai urutan model
UPDATE label
SET urutan = CASE
  WHEN LOWER(TRIM(COALESCE(kode, ''))) = 'n' OR LOWER(TRIM(COALESCE(nama, ''))) = 'nomina' THEN 1
  WHEN LOWER(TRIM(COALESCE(kode, ''))) = 'v' OR LOWER(TRIM(COALESCE(nama, ''))) = 'verba' THEN 2
  WHEN LOWER(TRIM(COALESCE(kode, ''))) = 'a' OR LOWER(TRIM(COALESCE(nama, ''))) = 'adjektiva' THEN 3
  WHEN LOWER(TRIM(COALESCE(kode, ''))) = 'adv' OR LOWER(TRIM(COALESCE(nama, ''))) = 'adverbia' THEN 4
  WHEN LOWER(TRIM(COALESCE(kode, ''))) = 'pron' OR LOWER(TRIM(COALESCE(nama, ''))) = 'pronomina' THEN 5
  WHEN LOWER(TRIM(COALESCE(kode, ''))) = 'num' OR LOWER(TRIM(COALESCE(nama, ''))) = 'numeralia' THEN 6
  WHEN LOWER(TRIM(COALESCE(kode, ''))) = 'prep' OR LOWER(TRIM(COALESCE(nama, ''))) = 'preposisi' THEN 7
  WHEN LOWER(TRIM(COALESCE(kode, ''))) = 'konj' OR LOWER(TRIM(COALESCE(nama, ''))) = 'konjungsi' THEN 8
  WHEN LOWER(TRIM(COALESCE(kode, ''))) = 'intj' OR LOWER(TRIM(COALESCE(nama, ''))) = 'interjeksi' THEN 9
  WHEN LOWER(TRIM(COALESCE(kode, ''))) = 'p' OR LOWER(TRIM(COALESCE(nama, ''))) = 'partikel' THEN 10
  ELSE urutan
END,
updated_at = NOW()
WHERE kategori = 'kelas-kata';

-- 4) Auto-map bertahap dari makna.kelas_kata='p' untuk kasus yang eksplisit
-- 4a) Interjeksi (kata seru)
UPDATE makna
SET kelas_kata = 'intj',
    updated_at = NOW()
WHERE aktif = TRUE
  AND LOWER(TRIM(COALESCE(kelas_kata, ''))) IN ('p', 'partikel')
  AND (
    LOWER(makna) LIKE '%interjeksi%'
    OR LOWER(makna) LIKE '%kata seru%'
  );

-- 4b) Konjungsi (kata hubung/penghubung)
UPDATE makna
SET kelas_kata = 'konj',
    updated_at = NOW()
WHERE aktif = TRUE
  AND LOWER(TRIM(COALESCE(kelas_kata, ''))) IN ('p', 'partikel')
  AND (
    LOWER(makna) LIKE '%konjungsi%'
    OR LOWER(makna) LIKE '%kata hubung%'
    OR LOWER(makna) LIKE '%kata penghubung%'
  );

-- 4c) Preposisi (kata depan)
UPDATE makna
SET kelas_kata = 'prep',
    updated_at = NOW()
WHERE aktif = TRUE
  AND LOWER(TRIM(COALESCE(kelas_kata, ''))) IN ('p', 'partikel')
  AND (
    LOWER(makna) LIKE '%preposisi%'
    OR LOWER(makna) LIKE '%kata depan%'
  );

COMMIT;
