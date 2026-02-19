BEGIN;

WITH target_urutan AS (
  SELECT
    COALESCE(
      (
        SELECT l.urutan
        FROM label l
        WHERE l.kategori = 'bentuk-kata'
          AND LOWER(TRIM(COALESCE(l.kode, ''))) = 'klitik'
        ORDER BY l.urutan ASC
        LIMIT 1
      ),
      (
        SELECT MAX(l.urutan)
        FROM label l
        WHERE l.kategori = 'bentuk-kata'
      ),
      0
    ) + 1 AS urutan_target
),
shift_urutan AS (
  UPDATE label l
  SET urutan = l.urutan + 1
  FROM target_urutan t
  WHERE l.kategori = 'bentuk-kata'
    AND l.urutan >= t.urutan_target
    AND LOWER(TRIM(COALESCE(l.kode, ''))) <> 'prakategorial'
  RETURNING l.id
)
INSERT INTO label (kategori, kode, nama, urutan, aktif)
SELECT
  'bentuk-kata',
  'prakategorial',
  'prakategorial',
  t.urutan_target,
  TRUE
FROM target_urutan t
ON CONFLICT (kategori, kode) DO UPDATE
SET
  nama = EXCLUDED.nama,
  urutan = EXCLUDED.urutan,
  aktif = TRUE;

UPDATE entri e
SET jenis = 'prakategorial'
WHERE e.aktif = 1
  AND LOWER(TRIM(COALESCE(e.jenis, ''))) = 'dasar'
  AND NOT EXISTS (
    SELECT 1
    FROM makna m
    WHERE m.entri_id = e.id
      AND m.aktif = TRUE
  )
  AND EXISTS (
    SELECT 1
    FROM entri c
    WHERE c.induk = e.id
      AND c.aktif = 1
      AND LOWER(TRIM(COALESCE(c.jenis, ''))) = 'turunan'
  );

COMMIT;
