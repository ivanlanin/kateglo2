BEGIN;

CREATE TABLE IF NOT EXISTS pencarian_hitam (
  id serial PRIMARY KEY,
  kata text NOT NULL,
  aktif boolean NOT NULL DEFAULT true,
  catatan text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT pencarian_hitam_kata_check CHECK (btrim(kata) <> ''),
  CONSTRAINT pencarian_hitam_kata_lowercase_check CHECK (kata = lower(kata))
);

CREATE UNIQUE INDEX IF NOT EXISTS pencarian_hitam_kata_key
  ON pencarian_hitam USING btree (kata);

CREATE INDEX IF NOT EXISTS idx_pencarian_hitam_aktif
  ON pencarian_hitam USING btree (aktif, kata);

DROP TRIGGER IF EXISTS trg_set_timestamp_fields__pencarian_hitam ON pencarian_hitam;
CREATE TRIGGER trg_set_timestamp_fields__pencarian_hitam
  BEFORE INSERT OR UPDATE ON pencarian_hitam
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp_fields();

INSERT INTO pencarian_hitam (kata, aktif, catatan)
SELECT DISTINCT lower(btrim(e.indeks)) AS kata,
       true AS aktif,
       'Seed otomatis dari makna.ragam = kas' AS catatan
FROM entri e
JOIN makna m ON m.entri_id = e.id
WHERE m.ragam = 'kas'
  AND e.indeks IS NOT NULL
  AND btrim(e.indeks) <> ''
ON CONFLICT (kata)
DO UPDATE SET
  aktif = true,
  catatan = COALESCE(pencarian_hitam.catatan, EXCLUDED.catatan),
  updated_at = now();

COMMIT;
