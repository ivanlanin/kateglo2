-- Migration: Ubah semua kolom character varying menjadi text
-- Date: 2026-02-14
-- Description:
--   Mengganti semua kolom bertipe character varying(N) menjadi text
--   agar lebih fleksibel tanpa batasan panjang karakter.
--   PostgreSQL tidak memiliki perbedaan performa antara varchar dan text.
--   Perubahan ini aman dan tidak merusak data yang sudah ada.

BEGIN;

-- ============================================
-- STEP 1: Tabel _thesaurus
-- ============================================
ALTER TABLE _thesaurus
  ALTER COLUMN lemma         TYPE text,
  ALTER COLUMN synonym       TYPE text,
  ALTER COLUMN antonym       TYPE text,
  ALTER COLUMN parent        TYPE text;

-- ============================================
-- STEP 2: Tabel abbr_entry
-- ============================================
ALTER TABLE abbr_entry
  ALTER COLUMN abbr_key      TYPE text,
  ALTER COLUMN abbr_id       TYPE text,
  ALTER COLUMN abbr_en       TYPE text,
  ALTER COLUMN abbr_type     TYPE text,
  ALTER COLUMN lang          TYPE text,
  ALTER COLUMN redirect_to   TYPE text,
  ALTER COLUMN source        TYPE text,
  ALTER COLUMN url           TYPE text,
  ALTER COLUMN notes         TYPE text;

-- ============================================
-- STEP 3: Tabel definition
-- ============================================
ALTER TABLE definition
  ALTER COLUMN phrase        TYPE text,
  ALTER COLUMN lex_class     TYPE text,
  ALTER COLUMN def_text      TYPE text,
  ALTER COLUMN discipline    TYPE text,
  ALTER COLUMN sample        TYPE text,
  ALTER COLUMN see           TYPE text,
  ALTER COLUMN updater       TYPE text;

-- ============================================
-- STEP 4: Tabel discipline
-- ============================================
ALTER TABLE discipline
  ALTER COLUMN discipline       TYPE text,
  ALTER COLUMN discipline_name  TYPE text,
  ALTER COLUMN updater          TYPE text;

-- ============================================
-- STEP 5: Tabel external_ref
-- ============================================
ALTER TABLE external_ref
  ALTER COLUMN phrase        TYPE text,
  ALTER COLUMN label         TYPE text,
  ALTER COLUMN url           TYPE text,
  ALTER COLUMN updater       TYPE text;

-- ============================================
-- STEP 6: Tabel glossary
-- ============================================
ALTER TABLE glossary
  ALTER COLUMN phrase        TYPE text,
  ALTER COLUMN original      TYPE text,
  ALTER COLUMN discipline    TYPE text,
  ALTER COLUMN lang          TYPE text,
  ALTER COLUMN ref_source    TYPE text,
  ALTER COLUMN wpid          TYPE text,
  ALTER COLUMN wpen          TYPE text,
  ALTER COLUMN updater       TYPE text;

-- ============================================
-- STEP 7: Tabel language
-- ============================================
ALTER TABLE language
  ALTER COLUMN lang          TYPE text,
  ALTER COLUMN lang_name     TYPE text,
  ALTER COLUMN updater       TYPE text;

-- ============================================
-- STEP 8: Tabel lexical_class
-- ============================================
ALTER TABLE lexical_class
  ALTER COLUMN lex_class         TYPE text,
  ALTER COLUMN lex_class_name    TYPE text,
  ALTER COLUMN lex_class_ref     TYPE text,
  ALTER COLUMN updater           TYPE text;

-- ============================================
-- STEP 9: Tabel new_lemma
-- ============================================
ALTER TABLE new_lemma
  ALTER COLUMN new_lemma     TYPE text;

-- ============================================
-- STEP 10: Tabel phrase
-- ============================================
ALTER TABLE phrase
  ALTER COLUMN phrase           TYPE text,
  ALTER COLUMN phrase_type      TYPE text,
  ALTER COLUMN lex_class        TYPE text,
  ALTER COLUMN roget_class      TYPE text,
  ALTER COLUMN pronounciation   TYPE text,
  ALTER COLUMN etymology        TYPE text,
  ALTER COLUMN ref_source       TYPE text,
  ALTER COLUMN actual_phrase    TYPE text,
  ALTER COLUMN info             TYPE text,
  ALTER COLUMN notes            TYPE text,
  ALTER COLUMN updater          TYPE text,
  ALTER COLUMN creator          TYPE text;

-- ============================================
-- STEP 11: Tabel phrase_type
-- ============================================
ALTER TABLE phrase_type
  ALTER COLUMN phrase_type       TYPE text,
  ALTER COLUMN phrase_type_name  TYPE text,
  ALTER COLUMN updater           TYPE text;

-- ============================================
-- STEP 12: Tabel proverb
-- ============================================
ALTER TABLE proverb
  ALTER COLUMN phrase        TYPE text,
  ALTER COLUMN proverb       TYPE text,
  ALTER COLUMN meaning       TYPE text,
  ALTER COLUMN updater       TYPE text;

-- ============================================
-- STEP 13: Tabel ref_source
-- ============================================
ALTER TABLE ref_source
  ALTER COLUMN ref_source       TYPE text,
  ALTER COLUMN ref_source_name  TYPE text,
  ALTER COLUMN updater          TYPE text;

-- ============================================
-- STEP 14: Tabel relation
-- ============================================
ALTER TABLE relation
  ALTER COLUMN root_phrase      TYPE text,
  ALTER COLUMN related_phrase   TYPE text,
  ALTER COLUMN rel_type         TYPE text,
  ALTER COLUMN updater          TYPE text;

-- ============================================
-- STEP 15: Tabel relation_type
-- ============================================
ALTER TABLE relation_type
  ALTER COLUMN rel_type         TYPE text,
  ALTER COLUMN rel_type_name    TYPE text,
  ALTER COLUMN updater          TYPE text;

-- ============================================
-- STEP 16: Tabel roget_class
-- ============================================
ALTER TABLE roget_class
  ALTER COLUMN roget_class      TYPE text,
  ALTER COLUMN number           TYPE text,
  ALTER COLUMN suffix           TYPE text,
  ALTER COLUMN roget_name       TYPE text,
  ALTER COLUMN english_name     TYPE text,
  ALTER COLUMN asterix          TYPE text,
  ALTER COLUMN caret            TYPE text;

-- ============================================
-- STEP 17: Tabel searched_phrase
-- ============================================
ALTER TABLE searched_phrase
  ALTER COLUMN phrase        TYPE text;

-- ============================================
-- STEP 18: Tabel sys_abbrev
-- ============================================
ALTER TABLE sys_abbrev
  ALTER COLUMN abbrev        TYPE text,
  ALTER COLUMN label         TYPE text,
  ALTER COLUMN type          TYPE text,
  ALTER COLUMN updater       TYPE text;

-- ============================================
-- STEP 19: Tabel sys_comment
-- ============================================
ALTER TABLE sys_comment
  ALTER COLUMN ses_id           TYPE text,
  ALTER COLUMN sender_name      TYPE text,
  ALTER COLUMN sender_email     TYPE text,
  ALTER COLUMN url              TYPE text,
  ALTER COLUMN comment_text     TYPE text,
  ALTER COLUMN response         TYPE text;

-- ============================================
-- STEP 20: Tabel sys_user
-- ============================================
ALTER TABLE sys_user
  ALTER COLUMN user_id       TYPE text,
  ALTER COLUMN pass_key      TYPE text,
  ALTER COLUMN full_name     TYPE text,
  ALTER COLUMN updater       TYPE text;

-- ============================================
-- STEP 21: Tabel translation
-- ============================================
ALTER TABLE translation
  ALTER COLUMN lemma         TYPE text,
  ALTER COLUMN ref_source    TYPE text,
  ALTER COLUMN translation   TYPE text;

COMMIT;

-- Verification (uncomment to check):
-- SELECT table_name, column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND data_type = 'character varying'
-- ORDER BY table_name, ordinal_position;
