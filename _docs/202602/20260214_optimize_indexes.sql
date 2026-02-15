-- Migration: Optimasi indeks untuk kinerja frontend
-- Date: 2026-02-14
-- Description:
--   Menambahkan indeks yang belum ada berdasarkan pola query di backend models.
--   Menggunakan indeks fungsional LOWER() untuk pencarian case-insensitive,
--   indeks trigram (pg_trgm) untuk pencarian ILIKE '%...%',
--   dan indeks biasa untuk kolom foreign key yang sering di-JOIN.
--
-- Indeks yang sudah ada (tidak diubah):
--   idx_abbr_key              ON abbr_entry(abbr_key)
--   idx_definition_phrase     ON definition(phrase)
--   idx_glossary_discipline   ON glossary(discipline)
--   idx_glossary_original     ON glossary(original)
--   idx_glossary_phrase       ON glossary(phrase)
--   idx_glossary_ref_source   ON glossary(ref_source)
--   idx_relation_related      ON relation(related_phrase)
--   idx_relation_root         ON relation(root_phrase)
--   idx_relation_unique       ON relation(root_phrase, related_phrase, rel_type) UNIQUE
--   idx_searched_phrase        ON searched_phrase(search_count DESC)

-- ============================================
-- STEP 0: Aktifkan ekstensi pg_trgm untuk ILIKE/LIKE queries
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- STEP 1: Tabel phrase — tabel utama, BELUM ADA indeks sama sekali
-- ============================================

-- Pencarian LOWER(phrase) = LOWER($1) — dipakai di ambilFrasa, ambilDefinisi, dll
CREATE INDEX IF NOT EXISTS idx_phrase_lower
  ON phrase (LOWER(phrase));

-- Pencarian ILIKE prefix (cariKamus: phrase ILIKE 'query%')
CREATE INDEX IF NOT EXISTS idx_phrase_trgm
  ON phrase USING gin (phrase gin_trgm_ops);

-- Filter beranda: WHERE phrase NOT LIKE '% %' AND lex_class IS NOT NULL
-- (ambilLemaAcak, ambilSalahEja)
CREATE INDEX IF NOT EXISTS idx_phrase_type
  ON phrase (phrase_type);

CREATE INDEX IF NOT EXISTS idx_phrase_actual
  ON phrase (actual_phrase)
  WHERE actual_phrase IS NOT NULL AND actual_phrase != '';

-- ============================================
-- STEP 2: Tabel definition — hanya ada idx_definition_phrase
-- ============================================

-- Pencarian LOWER(phrase) = LOWER($1) — dipakai di ambilDefinisi
CREATE INDEX IF NOT EXISTS idx_definition_phrase_lower
  ON definition (LOWER(phrase));

-- Urutkan definisi: def_num, def_uid
CREATE INDEX IF NOT EXISTS idx_definition_phrase_order
  ON definition (phrase, def_num, def_uid);

-- JOIN ke lexical_class dan discipline
CREATE INDEX IF NOT EXISTS idx_definition_lex_class
  ON definition (lex_class);

CREATE INDEX IF NOT EXISTS idx_definition_discipline
  ON definition (discipline);

-- ============================================
-- STEP 3: Tabel relation — ada idx_relation_root, idx_relation_related
-- ============================================

-- Pencarian LOWER(root_phrase) — dipakai di ambilRelasi, ambilKataDasar
CREATE INDEX IF NOT EXISTS idx_relation_root_lower
  ON relation (LOWER(root_phrase));

-- ============================================
-- STEP 4: Tabel proverb — BELUM ADA indeks
-- ============================================

-- Pencarian LOWER(phrase) = LOWER($1) — dipakai di ambilPeribahasa
CREATE INDEX IF NOT EXISTS idx_proverb_phrase_lower
  ON proverb (LOWER(phrase));

-- Pencarian ILIKE untuk halaman peribahasa (cariPeribahasa)
CREATE INDEX IF NOT EXISTS idx_proverb_trgm
  ON proverb USING gin (proverb gin_trgm_ops);

-- ============================================
-- STEP 5: Tabel translation — BELUM ADA indeks
-- ============================================

-- Pencarian LOWER(lemma) = LOWER($1) — dipakai di ambilTerjemahan
CREATE INDEX IF NOT EXISTS idx_translation_lemma_lower
  ON translation (LOWER(lemma));

-- ============================================
-- STEP 6: Tabel external_ref — BELUM ADA indeks
-- ============================================

-- Pencarian LOWER(phrase) = LOWER($1) — dipakai di ambilTautan
CREATE INDEX IF NOT EXISTS idx_external_ref_phrase_lower
  ON external_ref (LOWER(phrase));

-- ============================================
-- STEP 7: Tabel searched_phrase — historis (tracking populer nonaktif)
-- ============================================

-- Primary key pencarian frase (untuk upsert saat tracking pencarian)
CREATE UNIQUE INDEX IF NOT EXISTS idx_searched_phrase_phrase
  ON searched_phrase (phrase);

-- ============================================
-- STEP 8: Tabel abbr_entry — ada idx_abbr_key
-- ============================================

-- Pencarian ILIKE di abbr_id dan abbr_en (cariSingkatan)
CREATE INDEX IF NOT EXISTS idx_abbr_entry_trgm
  ON abbr_entry USING gin (abbr_key gin_trgm_ops);

-- ============================================
-- STEP 9: Tabel glossary — sudah ada 4 indeks, tambah trigram
-- ============================================

-- Pencarian ILIKE di phrase dan original (cariGlosarium)
CREATE INDEX IF NOT EXISTS idx_glossary_phrase_trgm
  ON glossary USING gin (phrase gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_glossary_original_trgm
  ON glossary USING gin (original gin_trgm_ops);

-- Verification (uncomment to check):
-- SELECT indexname, tablename, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
