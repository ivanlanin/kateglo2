-- Menjadikan homograf NULL jika indeks tidak membutuhkan pemisahan homograf
-- Aturan: homograf hanya diperlukan bila dalam satu indeks ada >1 grup lafal
-- Tanggal: 2026-02-19

BEGIN;

WITH grup_lafal AS (
  SELECT
    indeks,
    COUNT(DISTINCT COALESCE(NULLIF(TRIM(COALESCE(lafal, '')), ''), '')) AS jumlah_grup_lafal
  FROM entri
  GROUP BY indeks
), indeks_tidak_perlu AS (
  SELECT indeks
  FROM grup_lafal
  WHERE jumlah_grup_lafal <= 1
)
UPDATE entri e
SET homograf = NULL
FROM indeks_tidak_perlu t
WHERE e.indeks = t.indeks
  AND e.homograf IS NOT NULL;

COMMIT;
