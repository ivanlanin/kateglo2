BEGIN;

ALTER TABLE bidang RENAME COLUMN aktif TO kamus;

ALTER TABLE bidang
  ADD COLUMN glosarium boolean NOT NULL DEFAULT true;

UPDATE bidang b
SET kamus = false
WHERE NOT EXISTS (
  SELECT 1
  FROM makna m
  WHERE m.bidang IS NOT NULL
    AND LOWER(TRIM(m.bidang)) = LOWER(TRIM(b.kode))
);

UPDATE bidang b
SET glosarium = false
WHERE NOT EXISTS (
  SELECT 1
  FROM glosarium g
  WHERE g.bidang_id = b.id
);

COMMIT;