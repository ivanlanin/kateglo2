BEGIN;

UPDATE entri
SET pemenggalan = TRIM(BOTH FROM regexp_replace(pemenggalan, '\s*\([0-9]+\)\s*$', ''))
WHERE pemenggalan ~ '\s*\([0-9]+\)\s*$';

COMMIT;
