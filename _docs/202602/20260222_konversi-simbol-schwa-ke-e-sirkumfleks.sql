-- Konversi representasi schwa pada lafal:
-- dari simbol IPA `ə` menjadi notasi KBBI `ê`

UPDATE entri
SET lafal = REPLACE(lafal, 'ə', 'ê'),
    updated_at = NOW()
WHERE lafal IS NOT NULL
  AND lafal LIKE '%ə%';
