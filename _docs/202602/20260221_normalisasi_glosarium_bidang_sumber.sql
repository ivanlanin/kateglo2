BEGIN;

CREATE TABLE IF NOT EXISTS bidang (
  id serial PRIMARY KEY,
  kode text NOT NULL UNIQUE,
  nama text NOT NULL UNIQUE,
  aktif boolean NOT NULL DEFAULT true,
  keterangan text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_set_timestamp_fields__bidang ON bidang;
CREATE TRIGGER trg_set_timestamp_fields__bidang
  BEFORE INSERT OR UPDATE ON bidang
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp_fields();

CREATE TABLE IF NOT EXISTS sumber (
  id serial PRIMARY KEY,
  kode text NOT NULL UNIQUE,
  nama text NOT NULL UNIQUE,
  aktif boolean NOT NULL DEFAULT true,
  keterangan text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_set_timestamp_fields__sumber ON sumber;
CREATE TRIGGER trg_set_timestamp_fields__sumber
  BEFORE INSERT OR UPDATE ON sumber
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp_fields();

INSERT INTO bidang (kode, nama, aktif)
SELECT
  lower(regexp_replace(trim(v.nama), '[^a-zA-Z0-9]+', '-', 'g')) AS kode,
  v.nama,
  true
FROM (
  SELECT DISTINCT trim(g.bidang) AS nama
  FROM glosarium g
  WHERE g.bidang IS NOT NULL AND trim(g.bidang) <> ''
) v
ON CONFLICT (nama) DO NOTHING;

INSERT INTO sumber (kode, nama, aktif)
SELECT
  lower(regexp_replace(trim(v.nama), '[^a-zA-Z0-9]+', '-', 'g')) AS kode,
  v.nama,
  true
FROM (
  SELECT DISTINCT trim(g.sumber) AS nama
  FROM glosarium g
  WHERE g.sumber IS NOT NULL AND trim(g.sumber) <> ''
) v
ON CONFLICT (nama) DO NOTHING;

ALTER TABLE glosarium
  ADD COLUMN IF NOT EXISTS bidang_id integer,
  ADD COLUMN IF NOT EXISTS sumber_id integer;

UPDATE glosarium g
SET bidang_id = b.id
FROM bidang b
WHERE b.nama = g.bidang
  AND (g.bidang_id IS NULL OR g.bidang_id <> b.id);

UPDATE glosarium g
SET sumber_id = s.id
FROM sumber s
WHERE s.nama = g.sumber
  AND (g.sumber_id IS NULL OR g.sumber_id <> s.id);

ALTER TABLE glosarium
  ALTER COLUMN bidang_id SET NOT NULL,
  ALTER COLUMN sumber_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_glosarium_bidang'
      AND table_name = 'glosarium'
  ) THEN
    ALTER TABLE glosarium
      ADD CONSTRAINT fk_glosarium_bidang
      FOREIGN KEY (bidang_id) REFERENCES bidang(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_glosarium_sumber'
      AND table_name = 'glosarium'
  ) THEN
    ALTER TABLE glosarium
      ADD CONSTRAINT fk_glosarium_sumber
      FOREIGN KEY (sumber_id) REFERENCES sumber(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END
$$;

DROP INDEX IF EXISTS idx_glosarium_aktif_bidang_indonesia;
DROP INDEX IF EXISTS idx_glosarium_aktif_sumber_indonesia;
DROP INDEX IF EXISTS idx_glosarium_bidang;
DROP INDEX IF EXISTS idx_glosarium_sumber;

CREATE INDEX IF NOT EXISTS idx_glosarium_aktif_bidang_id_indonesia
  ON glosarium USING btree (bidang_id, indonesia)
  WHERE (aktif = true);
CREATE INDEX IF NOT EXISTS idx_glosarium_aktif_sumber_id_indonesia
  ON glosarium USING btree (sumber_id, indonesia)
  WHERE (aktif = true);
CREATE INDEX IF NOT EXISTS idx_glosarium_bidang_id
  ON glosarium USING btree (bidang_id);
CREATE INDEX IF NOT EXISTS idx_glosarium_sumber_id
  ON glosarium USING btree (sumber_id);

ALTER TABLE glosarium
  DROP COLUMN IF EXISTS bidang,
  DROP COLUMN IF EXISTS sumber;

INSERT INTO izin (kode, nama, kelompok)
VALUES
  ('kelola_bidang', 'Kelola bidang glosarium', 'glosarium'),
  ('kelola_sumber', 'Kelola sumber glosarium', 'glosarium')
ON CONFLICT (kode) DO UPDATE
SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok;

INSERT INTO peran_izin (peran_id, izin_id)
SELECT p.id, i.id
FROM peran p
JOIN izin i ON i.kode IN ('kelola_bidang', 'kelola_sumber')
WHERE p.kode = 'admin'
ON CONFLICT (peran_id, izin_id) DO NOTHING;

COMMIT;
