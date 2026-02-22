-- Kasus D: isi lafal kosong dari sibling indeks yang konsisten tunggal
-- Kriteria aman:
-- 1) jenis='dasar', aktif=1, entri mengandung e
-- 2) lafal kosong
-- 3) dalam grup LOWER(indeks) ada lafal terisi
-- 4) seluruh lafal terisi pada grup tsb hanya memiliki 1 nilai unik

WITH per_indeks AS (
  SELECT
    LOWER(indeks) AS idx,
    COUNT(*) FILTER (WHERE lafal IS NULL OR BTRIM(lafal)='') AS empty_count,
    COUNT(*) FILTER (WHERE lafal IS NOT NULL AND BTRIM(lafal)<>'') AS filled_count,
    COUNT(DISTINCT LOWER(lafal)) FILTER (WHERE lafal IS NOT NULL AND BTRIM(lafal)<>'') AS distinct_filled,
    MIN(lafal) FILTER (WHERE lafal IS NOT NULL AND BTRIM(lafal)<>'') AS lafal_target
  FROM entri
  WHERE jenis='dasar' AND aktif=1 AND entri ~* 'e'
  GROUP BY LOWER(indeks)
), candidates AS (
  SELECT e.id, p.lafal_target
  FROM entri e
  JOIN per_indeks p ON LOWER(e.indeks)=p.idx
  WHERE e.jenis='dasar'
    AND e.aktif=1
    AND e.entri ~* 'e'
    AND (e.lafal IS NULL OR BTRIM(e.lafal)='')
    AND p.empty_count > 0
    AND p.filled_count > 0
    AND p.distinct_filled = 1
)
UPDATE entri e
SET lafal = c.lafal_target,
    updated_at = NOW()
FROM candidates c
WHERE e.id = c.id;
