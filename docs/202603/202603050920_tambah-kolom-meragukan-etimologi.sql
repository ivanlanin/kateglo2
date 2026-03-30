-- =============================================================================
-- Migrasi: Tambah kolom meragukan + tandai doubtful + aktifkan baris meyakinkan
-- Tanggal: 2026-03-05 09:20
--
-- Empat langkah:
-- 1. Tambah kolom meragukan (boolean, default false)
-- 2. Tandai baris dengan "(doubtful entry)" di sumber_definisi → meragukan = true
-- 3. Aktifkan baris yang meyakinkan: terhubung ke entri + bahasa terisi
-- 4. Nonaktifkan kembali yang meragukan (tidak ditampilkan ke publik)
--
-- Hasil yang diharapkan setelah migrasi:
--   aktif = true,  meragukan = false : 15.475 (linked + bahasa + tidak doubtful)
--   aktif = false, meragukan = true  :    146 (doubtful entry, disimpan tapi disembunyikan)
--   aktif = false, meragukan = false :    891 (orphan atau tanpa bahasa)
-- =============================================================================

BEGIN;

-- 1. Tambah kolom meragukan
ALTER TABLE etimologi
  ADD COLUMN IF NOT EXISTS meragukan boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_etimologi_meragukan
  ON etimologi USING btree (meragukan);

-- 2. Tandai baris yang di sumber_definisi mengandung "(doubtful entry)"
--    sebagai meragukan = true
UPDATE etimologi
SET meragukan = true,
    updated_at = NOW()
WHERE sumber_definisi ILIKE '%doubtful%'
  AND meragukan = false;

-- 3. Aktifkan baris yang meyakinkan:
--    - terhubung ke entri (entri_id IS NOT NULL)
--    - bahasa asal terisi (bahasa NOT NULL dan tidak kosong)
UPDATE etimologi
SET aktif = true,
    updated_at = NOW()
WHERE aktif = false
  AND entri_id IS NOT NULL
  AND NULLIF(BTRIM(COALESCE(bahasa, '')), '') IS NOT NULL;

-- 4. Nonaktifkan kembali yang meragukan — tidak ditampilkan ke publik
--    Data tetap disimpan untuk keperluan audit dan perbaikan homonim
UPDATE etimologi
SET aktif = false,
    updated_at = NOW()
WHERE meragukan = true
  AND aktif = true;

COMMIT;
