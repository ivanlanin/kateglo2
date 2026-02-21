-- Perbaiki HTML entities di kolom glosarium.asing dan glosarium.indonesia
-- Karakter yang diubah adalah transliterasi Arab-Latin berdiakritik:
--   &#257; → ā (a panjang, U+0101)
--   &#299; → ī (i panjang, U+012B)
--   &#363; → ū (u panjang, U+016B)
--
-- Scope: 1.528 baris di kolom 'asing', 5 baris di kolom 'indonesia'

-- Perbaiki kolom 'asing'
UPDATE glosarium
SET asing = REPLACE(REPLACE(REPLACE(asing,
  '&#257;', 'ā'),
  '&#299;', 'ī'),
  '&#363;', 'ū')
WHERE asing ~ '&#(257|299|363);';

-- Perbaiki kolom 'indonesia'
UPDATE glosarium
SET indonesia = REPLACE(REPLACE(REPLACE(indonesia,
  '&#257;', 'ā'),
  '&#299;', 'ī'),
  '&#363;', 'ū')
WHERE indonesia ~ '&#(257|299|363);';
