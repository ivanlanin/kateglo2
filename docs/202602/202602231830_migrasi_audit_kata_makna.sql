-- Migrasi audit kata dari makna yang belum ada di entri
-- Tanggal: 2026-02-23

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.audit_kata_makna') IS NOT NULL
     AND to_regclass('public.audit_makna') IS NULL THEN
    ALTER TABLE audit_kata_makna RENAME TO audit_makna;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.audit_makna') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'audit_makna'
         AND column_name = 'contoh_makna_id'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'audit_makna'
         AND column_name = 'makna_id'
     ) THEN
    ALTER TABLE audit_makna RENAME COLUMN contoh_makna_id TO makna_id;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.audit_makna') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'audit_makna'
         AND column_name = 'status_tinjau'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'audit_makna'
         AND column_name = 'status'
     ) THEN
    ALTER TABLE audit_makna RENAME COLUMN status_tinjau TO status;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS audit_makna (
  id serial PRIMARY KEY,
  indeks text NOT NULL,
  jumlah integer NOT NULL DEFAULT 0,
  entri_id integer REFERENCES entri(id) ON DELETE SET NULL,
  makna_id integer REFERENCES makna(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'tinjau',
  catatan text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_makna_indeks_key UNIQUE (indeks),
  CONSTRAINT audit_makna_indeks_check CHECK (TRIM(BOTH FROM indeks) <> ''::text),
  CONSTRAINT audit_makna_indeks_lowercase_check CHECK (indeks = LOWER(indeks)),
  CONSTRAINT audit_makna_jumlah_check CHECK (jumlah >= 0),
  CONSTRAINT audit_makna_status_check CHECK (
    status = ANY (
      ARRAY[
        'tinjau'::text,
        'salah'::text,
        'tambah'::text,
        'nama'::text
      ]
    )
  )
);

DO $$
BEGIN
  IF to_regclass('public.audit_makna') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'audit_makna'
         AND column_name = 'kata'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'audit_makna'
         AND column_name = 'indeks'
     ) THEN
    ALTER TABLE audit_makna RENAME COLUMN kata TO indeks;
  END IF;
END $$;

ALTER TABLE audit_makna
  ADD COLUMN IF NOT EXISTS indeks text,
  ADD COLUMN IF NOT EXISTS entri_id integer REFERENCES entri(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS makna_id integer REFERENCES makna(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'tinjau';

UPDATE audit_makna
SET indeks = LOWER(TRIM(BOTH FROM indeks))
WHERE indeks IS NOT NULL;

ALTER TABLE audit_makna
  ALTER COLUMN indeks SET NOT NULL;

ALTER TABLE audit_makna DROP CONSTRAINT IF EXISTS audit_makna_kata_key;
ALTER TABLE audit_makna DROP CONSTRAINT IF EXISTS audit_makna_kata_check;
ALTER TABLE audit_makna DROP CONSTRAINT IF EXISTS audit_makna_kata_lowercase_check;
ALTER TABLE audit_makna DROP CONSTRAINT IF EXISTS audit_makna_indeks_key;
ALTER TABLE audit_makna DROP CONSTRAINT IF EXISTS audit_makna_indeks_check;
ALTER TABLE audit_makna DROP CONSTRAINT IF EXISTS audit_makna_indeks_lowercase_check;

ALTER TABLE audit_makna
  ADD CONSTRAINT audit_makna_indeks_key UNIQUE (indeks),
  ADD CONSTRAINT audit_makna_indeks_check CHECK (TRIM(BOTH FROM indeks) <> ''::text),
  ADD CONSTRAINT audit_makna_indeks_lowercase_check CHECK (indeks = LOWER(indeks));

UPDATE audit_makna
SET status = CASE
  WHEN status = 'belum_ditinjau' THEN 'tinjau'
  WHEN status = 'salah_tik' THEN 'salah'
  WHEN status = 'perlu_entri_baru' THEN 'tambah'
  WHEN status = 'abaikan_nama_diri' THEN 'nama'
  ELSE status
END;

ALTER TABLE audit_makna DROP CONSTRAINT IF EXISTS audit_kata_makna_status_tinjau_check;
ALTER TABLE audit_makna DROP CONSTRAINT IF EXISTS audit_makna_status_check;
ALTER TABLE audit_makna
  ADD CONSTRAINT audit_makna_status_check CHECK (
    status = ANY (ARRAY['tinjau'::text, 'salah'::text, 'tambah'::text, 'nama'::text])
  );

CREATE INDEX IF NOT EXISTS idx_audit_makna_status_jumlah
  ON audit_makna (status, jumlah DESC, indeks);

CREATE INDEX IF NOT EXISTS idx_audit_makna_jumlah
  ON audit_makna (jumlah DESC, indeks);

CREATE INDEX IF NOT EXISTS idx_audit_makna_entri_id
  ON audit_makna (entri_id);

CREATE INDEX IF NOT EXISTS idx_audit_makna_makna_id
  ON audit_makna (makna_id);

DROP TRIGGER IF EXISTS trg_set_timestamp_fields__audit_kata_makna ON audit_makna;
DROP TRIGGER IF EXISTS trg_set_timestamp_fields__audit_makna ON audit_makna;

CREATE TRIGGER trg_set_timestamp_fields__audit_makna
  BEFORE INSERT OR UPDATE ON audit_makna
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp_fields();

WITH token AS (
  SELECT
    m.id AS makna_id,
    LOWER(TRIM(BOTH FROM t.kata)) AS indeks
  FROM makna m
  CROSS JOIN LATERAL regexp_split_to_table(m.makna, '[^[:alpha:]]+') AS t(kata)
  WHERE m.aktif = true
),
bersih AS (
  SELECT
    makna_id,
    indeks
  FROM token
  WHERE indeks IS NOT NULL
    AND indeks <> ''
    AND char_length(indeks) > 1
    AND indeks !~ '^[0-9]+$'
),
agregat AS (
  SELECT
    indeks,
    COUNT(*)::integer AS jumlah
  FROM bersih
  GROUP BY indeks
),
contoh AS (
  SELECT
    b.indeks,
    m.entri_id,
    b.makna_id,
    ROW_NUMBER() OVER (PARTITION BY b.indeks ORDER BY b.makna_id ASC) AS rn
  FROM bersih b
  JOIN makna m ON m.id = b.makna_id
),
belum_ada_di_entri AS (
  SELECT
    a.indeks,
    a.jumlah,
    c.entri_id,
    c.makna_id
  FROM agregat a
  LEFT JOIN contoh c
    ON c.indeks = a.indeks
   AND c.rn = 1
  LEFT JOIN entri e
    ON LOWER(e.indeks) = a.indeks
  WHERE e.id IS NULL
)
INSERT INTO audit_makna (
  indeks,
  jumlah,
  entri_id,
  makna_id,
  status
)
SELECT
  b.indeks,
  b.jumlah,
  b.entri_id,
  b.makna_id,
  'tinjau'
FROM belum_ada_di_entri b
ON CONFLICT (indeks)
DO UPDATE SET
  jumlah = EXCLUDED.jumlah,
  entri_id = EXCLUDED.entri_id,
  makna_id = EXCLUDED.makna_id,
  updated_at = now();

DELETE FROM audit_makna a
WHERE EXISTS (
  SELECT 1
  FROM entri e
  WHERE LOWER(e.indeks) = a.indeks
);

ANALYZE audit_makna;

COMMIT;
