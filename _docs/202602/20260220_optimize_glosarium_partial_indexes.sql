BEGIN;

CREATE INDEX IF NOT EXISTS idx_glosarium_aktif_bidang_indonesia
  ON glosarium (bidang, indonesia)
  WHERE aktif = TRUE;

CREATE INDEX IF NOT EXISTS idx_glosarium_aktif_sumber_indonesia
  ON glosarium (sumber, indonesia)
  WHERE aktif = TRUE;

CREATE INDEX IF NOT EXISTS idx_glosarium_aktif_bahasa_indonesia
  ON glosarium (bahasa, indonesia)
  WHERE aktif = TRUE;

ANALYZE glosarium;

COMMIT;
