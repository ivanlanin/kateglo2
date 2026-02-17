-- Refactor unsur terikat:
-- 1) Hilangkan constraint entri.jenis
-- 2) Normalisasi nilai jenis 'bentuk terikat' -> 'terikat'
-- 3) Pindahkan klasifikasi unsur terikat ke entri.jenis
-- 4) Perbaikan khusus kasus entri si-/si
-- Date: 2026-02-17

BEGIN;

ALTER TABLE entri DROP CONSTRAINT IF EXISTS entri_jenis_check;

-- Normalisasi nilai lama pada entri.jenis
UPDATE entri
SET jenis = 'terikat'
WHERE LOWER(TRIM(jenis)) IN ('bentuk terikat', 'bentuk_terikat');

-- Sinkronisasi entri.jenis berdasarkan makna.kelas_kata unsur terikat
WITH kandidat AS (
  SELECT
    m.entri_id,
    (ARRAY_AGG(
      CASE LOWER(TRIM(m.kelas_kata))
        WHEN 'bentuk terikat' THEN 'terikat'
        WHEN 'bentuk_terikat' THEN 'terikat'
        WHEN 'terikat' THEN 'terikat'
        WHEN 'prefiks' THEN 'prefiks'
        WHEN 'infiks' THEN 'infiks'
        WHEN 'sufiks' THEN 'sufiks'
        WHEN 'konfiks' THEN 'konfiks'
        WHEN 'klitik' THEN 'klitik'
        ELSE NULL
      END
      ORDER BY m.urutan ASC, m.id ASC
    ) FILTER (
      WHERE LOWER(TRIM(m.kelas_kata)) IN (
        'bentuk terikat', 'bentuk_terikat', 'terikat',
        'prefiks', 'infiks', 'sufiks', 'konfiks', 'klitik'
      )
    ))[1] AS jenis_terikat
  FROM makna m
  GROUP BY m.entri_id
  HAVING BOOL_OR(
    m.kelas_kata IS NOT NULL
    AND LOWER(TRIM(m.kelas_kata)) IN (
      'bentuk terikat', 'bentuk_terikat', 'terikat',
      'prefiks', 'infiks', 'sufiks', 'konfiks', 'klitik'
    )
  )
  AND BOOL_AND(
    m.kelas_kata IS NULL
    OR LOWER(TRIM(m.kelas_kata)) IN (
      'bentuk terikat', 'bentuk_terikat', 'terikat',
      'prefiks', 'infiks', 'sufiks', 'konfiks', 'klitik'
    )
  )
)
UPDATE entri e
SET jenis = k.jenis_terikat
FROM kandidat k
WHERE e.id = k.entri_id
  AND k.jenis_terikat IS NOT NULL;

-- Perbaikan khusus: si- (4) -> si- (1)
UPDATE entri
SET entri = 'si- (1)',
    indeks = 'si',
    homonim = 1,
    urutan = 1,
    jenis = 'terikat'
WHERE entri = 'si- (4)';

-- Buat entri si- (2) jika belum ada
INSERT INTO entri (entri, indeks, homonim, urutan, jenis, aktif)
SELECT 'si- (2)', 'si', 2, 2, 'terikat', 1
WHERE NOT EXISTS (
  SELECT 1 FROM entri WHERE entri = 'si- (2)'
);

-- Pastikan metadata si- (2) konsisten
UPDATE entri
SET indeks = 'si',
    homonim = 2,
    urutan = 2,
    jenis = 'terikat'
WHERE entri = 'si- (2)';

-- Pindahkan makna kelas_kata unsur terikat dari si (1) ke si- (2)
WITH src AS (
  SELECT id FROM entri WHERE entri = 'si (1)' ORDER BY id LIMIT 1
),
dst AS (
  SELECT id FROM entri WHERE entri = 'si- (2)' ORDER BY id LIMIT 1
)
UPDATE makna m
SET entri_id = dst.id,
    kelas_kata = NULL
FROM src, dst
WHERE m.entri_id = src.id
  AND LOWER(TRIM(COALESCE(m.kelas_kata, ''))) IN ('bentuk terikat', 'bentuk_terikat', 'terikat');

-- Untuk entri unsur terikat, kosongkan kelas_kata di makna
UPDATE makna m
SET kelas_kata = NULL
FROM entri e
WHERE m.entri_id = e.id
  AND e.jenis IN ('terikat', 'prefiks', 'infiks', 'sufiks', 'konfiks', 'klitik')
  AND LOWER(TRIM(COALESCE(m.kelas_kata, ''))) IN (
    'bentuk terikat', 'bentuk_terikat', 'terikat',
    'prefiks', 'infiks', 'sufiks', 'konfiks', 'klitik'
  );

-- Koreksi entri campuran: bila masih punya kelas_kata non-terikat, kembalikan jadi dasar
UPDATE entri e
SET jenis = 'dasar'
WHERE e.jenis IN ('terikat', 'prefiks', 'infiks', 'sufiks', 'konfiks', 'klitik')
  AND EXISTS (
    SELECT 1
    FROM makna m
    WHERE m.entri_id = e.id
      AND m.kelas_kata IS NOT NULL
      AND LOWER(TRIM(m.kelas_kata)) NOT IN (
        'bentuk terikat', 'bentuk_terikat', 'terikat',
        'prefiks', 'infiks', 'sufiks', 'konfiks', 'klitik'
      )
  );

-- Rapikan urutan makna untuk si- (2)
WITH target AS (
  SELECT id FROM entri WHERE entri = 'si- (2)' ORDER BY id LIMIT 1
),
ranked AS (
  SELECT m.id, ROW_NUMBER() OVER (ORDER BY m.urutan ASC, m.id ASC) AS urut_baru
  FROM makna m
  JOIN target t ON t.id = m.entri_id
)
UPDATE makna m
SET urutan = r.urut_baru
FROM ranked r
WHERE m.id = r.id;

COMMIT;
