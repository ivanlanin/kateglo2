BEGIN;

ALTER TABLE makna
  DROP CONSTRAINT IF EXISTS makna_penyingkatan_check;

UPDATE makna
SET penyingkatan = CASE lower(trim(penyingkatan))
  WHEN 'akronim' THEN 'akr'
  WHEN 'kependekan' THEN 'kp'
  WHEN 'singkatan' THEN 'sing'
  ELSE penyingkatan
END
WHERE penyingkatan IS NOT NULL;

DELETE FROM label
WHERE kategori = 'penyingkatan'
  AND lower(trim(kode)) IN ('akronim', 'kependekan', 'singkatan', 'akr', 'kp', 'sing');

INSERT INTO label (kategori, kode, nama, keterangan, urutan, aktif)
VALUES
  ('penyingkatan', 'akr', 'Akronim', 'Label bentuk penyingkatan untuk makna kamus', 1, TRUE),
  ('penyingkatan', 'kp', 'Kependekan', 'Label bentuk penyingkatan untuk makna kamus', 2, TRUE),
  ('penyingkatan', 'sing', 'Singkatan', 'Label bentuk penyingkatan untuk makna kamus', 3, TRUE);

ALTER TABLE makna
  ADD CONSTRAINT makna_penyingkatan_check
  CHECK (
    penyingkatan IS NULL
    OR penyingkatan = ANY (ARRAY['akr'::text, 'kp'::text, 'sing'::text])
  );

COMMIT;