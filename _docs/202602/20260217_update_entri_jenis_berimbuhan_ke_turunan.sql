-- Migrasi data: ganti entri.jenis 'berimbuhan' menjadi 'turunan'
-- Date: 2026-02-17

BEGIN;

ALTER TABLE entri DROP CONSTRAINT IF EXISTS entri_jenis_check;
ALTER TABLE entri
ADD CONSTRAINT entri_jenis_check CHECK (
  jenis = ANY (
    ARRAY[
      'dasar'::text,
      'berimbuhan'::text,
      'turunan'::text,
      'gabungan'::text,
      'idiom'::text,
      'peribahasa'::text,
      'varian'::text
    ]
  )
);

UPDATE entri
SET jenis = 'turunan'
WHERE jenis = 'berimbuhan';

ALTER TABLE entri DROP CONSTRAINT IF EXISTS entri_jenis_check;
ALTER TABLE entri
ADD CONSTRAINT entri_jenis_check CHECK (
  jenis = ANY (
    ARRAY[
      'dasar'::text,
      'turunan'::text,
      'gabungan'::text,
      'idiom'::text,
      'peribahasa'::text,
      'varian'::text
    ]
  )
);

COMMIT;
