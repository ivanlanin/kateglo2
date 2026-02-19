-- Seed urutan label berdasarkan aturan modelLabel:
-- - Kategori manual: kelas-kata, ragam, bentuk-kata
-- - Kategori lain: alfabetis berdasarkan nama
-- Tanggal: 2026-02-17

BEGIN;

WITH prioritas_manual AS (
  SELECT
    l.id,
    l.kategori,
    CASE
      WHEN l.kategori = 'kelas-kata' THEN
        CASE
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'nomina' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'nomina' THEN 1
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'verba' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'verba' THEN 2
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'adjektiva' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'adjektiva' THEN 3
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'adverbia' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'adverbia' THEN 4
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'pronomina' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'pronomina' THEN 5
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'numeralia' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'numeralia' THEN 6
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'partikel' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'partikel' THEN 7
          ELSE NULL
        END
      WHEN l.kategori = 'ragam' THEN
        CASE
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'arkais' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'arkais' THEN 1
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'klasik' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'klasik' THEN 2
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'hormat' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'hormat' THEN 3
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'cakapan' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'cakapan' THEN 4
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'kasar' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'kasar' THEN 5
          ELSE NULL
        END
      WHEN l.kategori = 'bentuk-kata' THEN
        CASE
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'dasar' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'dasar' THEN 1
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'turunan' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'turunan' THEN 2
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'gabungan' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'gabungan' THEN 3
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'idiom' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'idiom' THEN 4
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'peribahasa' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'peribahasa' THEN 5
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'terikat' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'terikat' THEN 6
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'prefiks' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'prefiks' THEN 7
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'infiks' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'infiks' THEN 8
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'sufiks' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'sufiks' THEN 9
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'konfiks' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'konfiks' THEN 10
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'klitik' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'klitik' THEN 11
          WHEN LOWER(TRIM(COALESCE(l.kode, ''))) = 'prakategorial' OR LOWER(TRIM(COALESCE(l.nama, ''))) = 'prakategorial' THEN 12
          ELSE NULL
        END
      ELSE NULL
    END AS prioritas
  FROM label l
),
ranked AS (
  SELECT
    l.id,
    ROW_NUMBER() OVER (
      PARTITION BY l.kategori
      ORDER BY
        COALESCE(pm.prioritas, 1000),
        LOWER(TRIM(COALESCE(l.nama, ''))),
        LOWER(TRIM(COALESCE(l.kode, ''))),
        l.id
    ) AS urutan_baru
  FROM label l
  LEFT JOIN prioritas_manual pm ON pm.id = l.id
)
UPDATE label l
SET urutan = r.urutan_baru
FROM ranked r
WHERE l.id = r.id;

COMMIT;
