-- Sederhanakan tabel tesaurus: hanya pakai sinonim dan antonim
-- 1) Hapus entri tesaurus yang tidak memiliki data sinonim maupun antonim
-- 2) Hapus kolom turunan, gabungan, berkaitan

BEGIN;

DELETE FROM tesaurus
WHERE NULLIF(REGEXP_REPLACE(COALESCE(sinonim, ''), '[\s,;]+', '', 'g'), '') IS NULL
  AND NULLIF(REGEXP_REPLACE(COALESCE(antonim, ''), '[\s,;]+', '', 'g'), '') IS NULL;

ALTER TABLE tesaurus
  DROP COLUMN IF EXISTS turunan,
  DROP COLUMN IF EXISTS gabungan,
  DROP COLUMN IF EXISTS berkaitan;

COMMIT;
