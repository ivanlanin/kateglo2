BEGIN;

WITH peringkat AS (
  SELECT
    e.id,
    row_number() OVER (
      PARTITION BY e.indeks
      ORDER BY
        CASE
          WHEN NULLIF(TRIM(BOTH FROM COALESCE(e.lafal, '')), '') IS NULL THEN 0
          ELSE 1
        END,
        e.homonim ASC NULLS LAST,
        LOWER(e.entri) ASC,
        e.id ASC
    ) AS urutan_baru
  FROM entri e
)
UPDATE entri e
SET urutan = p.urutan_baru
FROM peringkat p
WHERE p.id = e.id
  AND e.urutan IS DISTINCT FROM p.urutan_baru;

COMMIT;
