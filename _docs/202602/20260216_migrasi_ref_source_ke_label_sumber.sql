-- Migrasi ref_source -> label (kategori: sumber)

BEGIN;

INSERT INTO label (kategori, kode, nama, keterangan, sumber)
SELECT
  'sumber' AS kategori,
  TRIM(ref_source) AS kode,
  TRIM(ref_source_name) AS nama,
  NULL::text AS keterangan,
  'migrasi-ref_source-20260216' AS sumber
FROM ref_source
WHERE ref_source IS NOT NULL
  AND TRIM(ref_source) <> ''
  AND ref_source_name IS NOT NULL
  AND TRIM(ref_source_name) <> ''
ON CONFLICT (kategori, kode)
DO UPDATE SET
  nama = EXCLUDED.nama,
  sumber = EXCLUDED.sumber;

COMMIT;
