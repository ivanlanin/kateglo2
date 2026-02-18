-- Kurasi lanjutan kelas kata partikel (sisa p)
-- Tujuan: meninjau data makna.kelas_kata='p' yang belum terpetakan otomatis
-- Tanggal: 2026-02-19

-- =========================================================
-- A) Audit cepat jumlah sisa
-- =========================================================
SELECT
  LOWER(TRIM(COALESCE(kelas_kata, ''))) AS kelas_norm,
  COUNT(*) AS jumlah
FROM makna
WHERE aktif = TRUE
  AND LOWER(TRIM(COALESCE(kelas_kata, ''))) IN ('p', 'prep', 'konj', 'intj')
GROUP BY 1
ORDER BY 1;

-- =========================================================
-- B) Daftar kandidat kurasi (prioritas: indikasi lebih jelas dulu)
-- Catatan:
-- - kolom rekomendasi hanya bantuan, tetap perlu validasi editor/leksikograf
-- =========================================================
WITH kandidat AS (
  SELECT
    m.id AS makna_id,
    e.id AS entri_id,
    e.entri,
    m.urutan,
    m.makna,
    CASE
      WHEN LOWER(m.makna) LIKE '%kata depan%'
        OR LOWER(m.makna) LIKE '%preposisi%'
        OR LOWER(m.makna) LIKE '% kepada%'
        OR LOWER(m.makna) LIKE '% terhadap%'
        OR LOWER(m.makna) LIKE '% tentang%'
      THEN 'prep'

      WHEN LOWER(m.makna) LIKE '%kata hubung%'
        OR LOWER(m.makna) LIKE '%kata penghubung%'
        OR LOWER(m.makna) LIKE '%konjungsi%'
        OR LOWER(m.makna) LIKE '%antarkalimat%'
      THEN 'konj'

      WHEN LOWER(m.makna) LIKE '%kata seru%'
        OR LOWER(m.makna) LIKE '%interjeksi%'
        OR LOWER(m.makna) LIKE '%seruan%'
      THEN 'intj'

      ELSE NULL
    END AS rekomendasi
  FROM makna m
  JOIN entri e ON e.id = m.entri_id
  WHERE m.aktif = TRUE
    AND LOWER(TRIM(COALESCE(m.kelas_kata, ''))) = 'p'
)
SELECT *
FROM kandidat
ORDER BY
  CASE WHEN rekomendasi IS NULL THEN 1 ELSE 0 END,
  entri ASC,
  urutan ASC,
  makna_id ASC;

-- =========================================================
-- C) Ambil batch kerja kurasi (contoh 100 baris)
-- Ubah OFFSET untuk lanjut batch berikutnya
-- =========================================================
SELECT
  m.id AS makna_id,
  e.entri,
  m.urutan,
  m.makna
FROM makna m
JOIN entri e ON e.id = m.entri_id
WHERE m.aktif = TRUE
  AND LOWER(TRIM(COALESCE(m.kelas_kata, ''))) = 'p'
ORDER BY e.entri, m.urutan, m.id
LIMIT 100 OFFSET 0;

-- =========================================================
-- D) Template update hasil kurasi manual per batch
-- 1) Ganti daftar ID sesuai hasil review
-- 2) Jalankan dalam transaksi
-- =========================================================
-- BEGIN;
--
-- UPDATE makna
-- SET kelas_kata = 'prep',
--     updated_at = NOW()
-- WHERE id = ANY(ARRAY[
--   0
-- ]::int[])
--   AND LOWER(TRIM(COALESCE(kelas_kata, ''))) = 'p';
--
-- UPDATE makna
-- SET kelas_kata = 'konj',
--     updated_at = NOW()
-- WHERE id = ANY(ARRAY[
--   0
-- ]::int[])
--   AND LOWER(TRIM(COALESCE(kelas_kata, ''))) = 'p';
--
-- UPDATE makna
-- SET kelas_kata = 'intj',
--     updated_at = NOW()
-- WHERE id = ANY(ARRAY[
--   0
-- ]::int[])
--   AND LOWER(TRIM(COALESCE(kelas_kata, ''))) = 'p';
--
-- COMMIT;

-- =========================================================
-- E) Verifikasi setelah update batch
-- =========================================================
SELECT
  LOWER(TRIM(COALESCE(kelas_kata, ''))) AS kelas_norm,
  COUNT(*) AS jumlah
FROM makna
WHERE aktif = TRUE
  AND LOWER(TRIM(COALESCE(kelas_kata, ''))) IN ('p', 'prep', 'konj', 'intj')
GROUP BY 1
ORDER BY 1;
