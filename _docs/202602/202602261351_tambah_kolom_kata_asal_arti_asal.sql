-- =============================================================================
-- Migrasi: Tambah kolom kata_asal dan arti_asal pada tabel etimologi
-- Tanggal: 2026-02-26 13:51
-- =============================================================================

BEGIN;

ALTER TABLE etimologi
  ADD COLUMN IF NOT EXISTS kata_asal text,
  ADD COLUMN IF NOT EXISTS arti_asal text;

COMMIT;
