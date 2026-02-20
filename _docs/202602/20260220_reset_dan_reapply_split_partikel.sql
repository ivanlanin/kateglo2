-- Reset kelas kata prep/konj/intj menjadi partikel (p), lalu terapkan ulang logika split
-- Referensi logika: 20260219_split_partikel_ke_preposisi_konjungsi_interjeksi.sql
-- Tanggal: 2026-02-20

BEGIN;

-- 1) Reset seluruh hasil split sebelumnya
UPDATE makna
SET kelas_kata = 'p',
    updated_at = NOW()
WHERE LOWER(TRIM(COALESCE(kelas_kata, ''))) IN ('prep', 'konj', 'intj');

-- 2) Terapkan ulang logika split dari partikel (p/partikel)
-- 2a) Interjeksi (kata seru)
UPDATE makna
SET kelas_kata = 'intj',
    updated_at = NOW()
WHERE aktif = TRUE
  AND LOWER(TRIM(COALESCE(kelas_kata, ''))) IN ('p', 'partikel')
  AND (
    LOWER(makna) LIKE '%interjeksi%'
    OR LOWER(makna) LIKE '%kata seru%'
  );

-- 2b) Konjungsi (kata hubung/penghubung)
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

-- 2c) Preposisi (kata depan)
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
