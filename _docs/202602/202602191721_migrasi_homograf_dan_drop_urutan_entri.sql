-- Migrasi aman: tambah homograf, isi lafal kosong (pola aman), lalu drop urutan dari entri
-- Tanggal: 2026-02-19

BEGIN;

ALTER TABLE entri
  ADD COLUMN IF NOT EXISTS homograf integer;

-- 1) Isi lafal kosong dengan versi pepet dari donor lafal yang aman.
-- Kriteria aman:
-- - per (indeks, homonim) hanya punya 1 lafal donor non-kosong
-- - punya baris lafal kosong
-- - donor mengandung huruf e (target konversi ke ə)
-- - donor tidak memuat spasi/tanda baca campuran (menghindari catatan non-lafal murni)
WITH kandidat_aman AS (
  SELECT
    indeks,
    homonim,
    MAX(NULLIF(TRIM(COALESCE(lafal, '')), '')) FILTER (
      WHERE NULLIF(TRIM(COALESCE(lafal, '')), '') IS NOT NULL
    ) AS donor_lafal,
    COUNT(*) FILTER (
      WHERE NULLIF(TRIM(COALESCE(lafal, '')), '') IS NULL
    ) AS cnt_lafal_kosong,
    COUNT(DISTINCT NULLIF(TRIM(COALESCE(lafal, '')), '')) FILTER (
      WHERE NULLIF(TRIM(COALESCE(lafal, '')), '') IS NOT NULL
    ) AS cnt_lafal_isi_distinct
  FROM entri
  WHERE aktif = 1
  GROUP BY indeks, homonim
  HAVING COUNT(*) FILTER (
      WHERE NULLIF(TRIM(COALESCE(lafal, '')), '') IS NULL
    ) > 0
     AND COUNT(DISTINCT NULLIF(TRIM(COALESCE(lafal, '')), '')) FILTER (
      WHERE NULLIF(TRIM(COALESCE(lafal, '')), '') IS NOT NULL
    ) = 1
), kandidat_final AS (
  SELECT
    indeks,
    homonim,
    donor_lafal,
    translate(donor_lafal, 'eEéÉèÈêÊ', 'əƏəƏəƏəƏ') AS lafal_pepet
  FROM kandidat_aman
  WHERE donor_lafal ~ '[eEéÉèÈêÊ]'
    AND donor_lafal !~ '[\s,;/()0-9]'
)
UPDATE entri e
SET lafal = k.lafal_pepet
FROM kandidat_final k
WHERE e.aktif = 1
  AND e.indeks = k.indeks
  AND e.homonim IS NOT DISTINCT FROM k.homonim
  AND NULLIF(TRIM(COALESCE(e.lafal, '')), '') IS NULL;

-- 2) Backfill homograf berdasarkan kelompok lafal per indeks.
-- Prioritas urutan homograf:
--   1) lafal non-pepet
--   2) lafal pepet (mengandung ə)
--   3) lafal kosong
WITH grup_lafal AS (
  SELECT
    indeks,
    COALESCE(NULLIF(TRIM(COALESCE(lafal, '')), ''), '') AS lafal_key
  FROM entri
  GROUP BY indeks, COALESCE(NULLIF(TRIM(COALESCE(lafal, '')), ''), '')
), peringkat AS (
  SELECT
    indeks,
    lafal_key,
    DENSE_RANK() OVER (
      PARTITION BY indeks
      ORDER BY
        CASE
          WHEN lafal_key = '' THEN 2
          WHEN lafal_key ~ '[əƏ]' THEN 1
          ELSE 0
        END,
        LOWER(lafal_key),
        lafal_key
    ) AS homograf_baru
  FROM grup_lafal
)
UPDATE entri e
SET homograf = p.homograf_baru
FROM peringkat p
WHERE p.indeks = e.indeks
  AND p.lafal_key = COALESCE(NULLIF(TRIM(COALESCE(e.lafal, '')), ''), '');

-- 3) Drop artefak urutan lama pada entri
DROP INDEX IF EXISTS idx_entri_indeks_urutan;
ALTER TABLE entri DROP COLUMN IF EXISTS urutan;

-- 4) Tambah indeks baru berbasis homograf + homonim
CREATE INDEX IF NOT EXISTS idx_entri_indeks_homograf_homonim
  ON entri (indeks, homograf, homonim, id);

COMMIT;
