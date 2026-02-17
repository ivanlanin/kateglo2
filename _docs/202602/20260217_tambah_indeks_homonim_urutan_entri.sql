BEGIN;

ALTER TABLE entri
  ADD COLUMN IF NOT EXISTS indeks text;

ALTER TABLE entri
  ADD COLUMN IF NOT EXISTS homonim integer;

ALTER TABLE entri
  ADD COLUMN IF NOT EXISTS urutan integer NOT NULL DEFAULT 1;

UPDATE entri
SET indeks = COALESCE(
  NULLIF(
    TRIM(BOTH FROM regexp_replace(
      regexp_replace(
        regexp_replace(entri, '\s*\([0-9]+\)\s*$', ''),
        '^-+',
        ''
      ),
      '-+$',
      ''
    )),
    ''
  ),
  entri
)
WHERE indeks IS NULL OR indeks = '';

UPDATE entri
SET homonim = CASE
  WHEN entri ~ '\([0-9]+\)\s*$' THEN substring(entri FROM '\(([0-9]+)\)\s*$')::integer
  ELSE NULL
END;

WITH grup_indeks AS (
  SELECT
    indeks,
    MAX(CASE WHEN homonim IS NOT NULL THEN 1 ELSE 0 END) AS ada_homonim
  FROM entri
  GROUP BY indeks
), peringkat AS (
  SELECT
    e.id,
    row_number() OVER (
      PARTITION BY e.indeks
      ORDER BY
        CASE
          WHEN g.ada_homonim = 1 AND e.homonim IS NOT NULL THEN 0
          WHEN g.ada_homonim = 1
            AND e.homonim IS NULL
            AND NULLIF(TRIM(BOTH FROM COALESCE(e.lafal, '')), '') IS NOT NULL THEN 1
          WHEN g.ada_homonim = 1 THEN 2
          WHEN NULLIF(TRIM(BOTH FROM COALESCE(e.lafal, '')), '') IS NOT NULL THEN 0
          ELSE 1
        END,
        e.homonim ASC NULLS LAST,
        LOWER(e.entri) ASC,
        e.id ASC
    ) AS urutan_baru
  FROM entri e
  JOIN grup_indeks g ON g.indeks = e.indeks
)
UPDATE entri e
SET urutan = p.urutan_baru
FROM peringkat p
WHERE p.id = e.id;

ALTER TABLE entri
  ALTER COLUMN indeks SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entri_indeks ON entri USING btree (indeks);
CREATE INDEX IF NOT EXISTS idx_entri_indeks_urutan ON entri USING btree (indeks, urutan, id);

COMMIT;
