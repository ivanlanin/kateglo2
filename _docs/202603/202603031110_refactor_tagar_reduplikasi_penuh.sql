-- Refactor notasi reduplikasi:
-- 1) R → R.penuh
-- 2) Hapus R-an dan R-nya (diganti kombinasi R.penuh + -an/-nya)

BEGIN;

DO $$
DECLARE
  r_id INT;
  rpenuh_id INT;
BEGIN
  SELECT id INTO r_id FROM tagar WHERE kode = 'R' LIMIT 1;
  SELECT id INTO rpenuh_id FROM tagar WHERE kode = 'R.penuh' LIMIT 1;

  IF r_id IS NOT NULL AND rpenuh_id IS NULL THEN
    UPDATE tagar
    SET kode = 'R.penuh',
        nama = 'R.penuh',
        deskripsi = 'Reduplikasi penuh (X → X-X)'
    WHERE id = r_id;
  ELSIF r_id IS NOT NULL AND rpenuh_id IS NOT NULL THEN
    UPDATE entri_tagar
    SET tagar_id = rpenuh_id
    WHERE tagar_id = r_id;

    DELETE FROM tagar WHERE id = r_id;
  ELSIF r_id IS NULL AND rpenuh_id IS NULL THEN
    INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan, aktif)
    VALUES ('R.penuh', 'R.penuh', 'reduplikasi', 'Reduplikasi penuh (X → X-X)', 1, TRUE);
  END IF;
END $$;

DELETE FROM tagar WHERE kode IN ('R-an', 'R-nya');

COMMIT;
