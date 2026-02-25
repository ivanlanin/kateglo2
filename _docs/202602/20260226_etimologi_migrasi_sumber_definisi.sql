-- =============================================================================
-- Migrasi: Tambah dan isi kolom sumber_definisi dari etimologi_lwim.raw_def
-- Tanggal: 2026-02-26
-- Aturan cocok: indeks_query = indeks dan lwim_hom = homonim
-- =============================================================================

BEGIN;

ALTER TABLE etimologi
  ADD COLUMN IF NOT EXISTS sumber_definisi text;

WITH kandidat AS (
  SELECT
    l.indeks_query AS indeks,
    l.lwim_hom AS homonim,
    MAX(NULLIF(BTRIM(l.raw_def), '')) AS raw_def_terpilih,
    COUNT(*) FILTER (WHERE NULLIF(BTRIM(l.raw_def), '') IS NOT NULL) AS jumlah_raw_def_terisi,
    COUNT(DISTINCT NULLIF(BTRIM(l.raw_def), '')) FILTER (WHERE NULLIF(BTRIM(l.raw_def), '') IS NOT NULL) AS jumlah_raw_def_unik
  FROM etimologi_lwim l
  GROUP BY l.indeks_query, l.lwim_hom
), kandidat_aman AS (
  SELECT indeks, homonim, raw_def_terpilih
  FROM kandidat
  WHERE jumlah_raw_def_terisi > 0
    AND jumlah_raw_def_unik = 1
)
UPDATE etimologi e
SET sumber_definisi = k.raw_def_terpilih,
    updated_at = NOW()
FROM kandidat_aman k
WHERE e.indeks = k.indeks
  AND e.homonim = k.homonim;

COMMIT;
