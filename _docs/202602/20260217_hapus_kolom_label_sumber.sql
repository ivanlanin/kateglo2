-- Hapus kolom label.sumber
-- Tanggal: 2026-02-17

BEGIN;

ALTER TABLE label
  DROP COLUMN IF EXISTS sumber;

COMMIT;
