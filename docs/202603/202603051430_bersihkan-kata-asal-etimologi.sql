-- =============================================================================
-- Migrasi: Bersihkan kolom kata_asal pada tabel etimologi
-- Tanggal: 2026-03-05 14:30
--
-- Latar belakang:
--   kata_asal yang tampil ke publik mengandung campuran referensi sumber,
--   alternatif kata, prefiks nama bahasa, dan notasi morfologi dari data LWIM.
--   Kolom sumber_definisi tetap dipertahankan sebagai cadangan data mentah.
--
-- Enam langkah pembersihan (berurutan, setiap langkah membangun dari hasil sebelumnya):
--   1. Hapus duplikasi karakter CJK: "XX XX roman" → "XX roman"
--   2. Hapus prefiks nama bahasa: "Belanda (hand) doek]" → "(hand) doek]"
--   3. Hapus prefiks opsional dalam kurung: "(hand) doek]" → "doek]"
--   4. Hapus trailing "]"
--   5. Pertahankan hanya alternatif pertama (sebelum " or ")
--   6. Hapus referensi sumber, nomor halaman, dan notasi "+"
--   7. Trim dan null-kan nilai kosong
--
-- Perkiraan dampak:
--   CJK duplikat    : ~457 baris
--   Referensi sumber: ~315 baris
--   Alternatif "or" : ~314 baris
--   Notasi "+"      : ~66 baris
--   Prefiks bahasa  : ~26 baris
--   Trailing "]"    : ~30 baris
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- Langkah 1: Hapus duplikasi token CJK
-- Pola: "XY XY romanization" → "XY romanization"
-- Contoh: "阿姊 阿姊 á chí" → "阿姊 á chí"
-- -----------------------------------------------------------------------
UPDATE etimologi
SET kata_asal  = TRIM(REGEXP_REPLACE(kata_asal, E'^(\\S+)\\s+\\1\\s+', E'\\1 ')),
    updated_at = NOW()
WHERE kata_asal ~ E'^(\\S+)\\s+\\1\\s+'
  AND kata_asal != TRIM(REGEXP_REPLACE(kata_asal, E'^(\\S+)\\s+\\1\\s+', E'\\1 '));

-- -----------------------------------------------------------------------
-- Langkah 2: Hapus prefiks nama bahasa di awal
-- Pola: "^Bahasa ..." → hapus "Bahasa "
-- Contoh: "Belanda (hand) doek]" → "(hand) doek]"
-- -----------------------------------------------------------------------
UPDATE etimologi
SET kata_asal  = TRIM(REGEXP_REPLACE(kata_asal,
    E'^(Amoy|Belanda|Bugis|Cina|Hakka|Hindi|Hokkien|Inggris|Jawa|Kanton|Latin|'
     'Melayu|Min Nan|Persia|Portugis|Prancis|Sanskerta|Tamil|Yunani)\\s+',
    '', 'i')),
    updated_at = NOW()
WHERE kata_asal ~* E'^(Amoy|Belanda|Bugis|Cina|Hakka|Hindi|Hokkien|Inggris|Jawa|Kanton|Latin|'
                    'Melayu|Min Nan|Persia|Portugis|Prancis|Sanskerta|Tamil|Yunani)\\s';

-- -----------------------------------------------------------------------
-- Langkah 3: Hapus prefiks opsional dalam kurung di awal
-- Pola: "^(context) word" → "word"
-- Contoh: "(hand) doek" → "doek"
--         "(mettez vous) en garde" → "en garde"
-- -----------------------------------------------------------------------
UPDATE etimologi
SET kata_asal  = TRIM(REGEXP_REPLACE(kata_asal, E'^\\([^)]*\\)\\s*', '')),
    updated_at = NOW()
WHERE kata_asal ~ E'^\\([^)]*\\)\\s*\\S'
  AND kata_asal != TRIM(REGEXP_REPLACE(kata_asal, E'^\\([^)]*\\)\\s*', ''));

-- -----------------------------------------------------------------------
-- Langkah 4: Hapus trailing "]"
-- -----------------------------------------------------------------------
UPDATE etimologi
SET kata_asal  = TRIM(TRAILING ']' FROM TRIM(kata_asal)),
    updated_at = NOW()
WHERE kata_asal LIKE '%]';

-- -----------------------------------------------------------------------
-- Langkah 5: Pertahankan hanya alternatif pertama (sebelum " or ")
-- Contoh: "alkali or < Arabic al-qily" → "alkali"
--         "acclimatisering or based on Inggris acclimatization" → "acclimatisering"
-- -----------------------------------------------------------------------
UPDATE etimologi
SET kata_asal  = TRIM(SPLIT_PART(kata_asal, ' or ', 1)),
    updated_at = NOW()
WHERE kata_asal ILIKE '% or %';

-- -----------------------------------------------------------------------
-- Langkah 6a: Hapus referensi sumber kamus (Wehr, Monier-Williams, dll.)
-- Pola: " Wehr1961:xxx" / " Monier-Williams:xxx" dll. → hapus
-- Contoh: "ṭamaʿ Wehr1961:569" → "ṭamaʿ"
-- -----------------------------------------------------------------------
UPDATE etimologi
SET kata_asal  = TRIM(REGEXP_REPLACE(kata_asal,
    E'\\s+(Wehr|Monier-Williams|Monier|McGregor|Steingass|Wilkinson|Gonda)\\S*.*$',
    '', 'i')),
    updated_at = NOW()
WHERE kata_asal ~* E'\\s+(Wehr|Monier-Williams|Monier|McGregor|Steingass|Wilkinson|Gonda)\\S';

-- -----------------------------------------------------------------------
-- Langkah 6b: Hapus nomor halaman di akhir (standalone digits, contoh: " 850")
-- Contoh: "kīmiyāʾ 850" → "kīmiyāʾ"
-- -----------------------------------------------------------------------
UPDATE etimologi
SET kata_asal  = TRIM(REGEXP_REPLACE(kata_asal, E'\\s+\\d{2,4}(\\.\\d+)?\\s*$', '')),
    updated_at = NOW()
WHERE kata_asal ~ E'\\s+\\d{2,4}(\\.\\d+)?\\s*$';

-- -----------------------------------------------------------------------
-- Langkah 6c: Hapus notasi "+" dan seterusnya
-- Contoh: "guerilla + from -wan" → "guerilla"
--         "aqua +" → "aqua"
--         "bhāva + -sa +" → "bhāva"
-- -----------------------------------------------------------------------
UPDATE etimologi
SET kata_asal  = TRIM(REGEXP_REPLACE(kata_asal, E'\\s*\\+.*$', '')),
    updated_at = NOW()
WHERE kata_asal LIKE '%+%';

-- -----------------------------------------------------------------------
-- Langkah 7: Trim sisa whitespace dan null-kan yang kosong
-- -----------------------------------------------------------------------
UPDATE etimologi
SET kata_asal  = TRIM(kata_asal),
    updated_at = NOW()
WHERE kata_asal != TRIM(kata_asal);

UPDATE etimologi
SET kata_asal  = NULL,
    updated_at = NOW()
WHERE kata_asal = '';

COMMIT;
