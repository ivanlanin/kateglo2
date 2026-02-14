-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Generated: 2026-02-14T02:37:53.074Z

-- ============================================
-- TABLES
-- ============================================

create table _thesaurus (
  lemma text default ''::text,
  synonym text not null,
  antonym text,
  parent text
);

create table abbr_entry (
  abbr_idx serial primary key,
  abbr_key text,
  abbr_id text,
  abbr_en text,
  abbr_type text,
  lang text,
  redirect_to text,
  source text,
  url text,
  notes text
);
create index idx_abbr_entry_trgm on abbr_entry using gin (abbr_key gin_trgm_ops);
create index idx_abbr_key on abbr_entry using btree (abbr_key);

create table definition (
  def_uid serial primary key,
  phrase text not null,
  def_num smallint not null default '1'::smallint,
  lex_class text,
  def_text text not null,
  discipline text,
  sample text,
  see text,
  updated timestamp without time zone,
  updater text,
  wikipedia_updated timestamp without time zone
);
create index idx_definition_discipline on definition using btree (discipline);
create index idx_definition_lex_class on definition using btree (lex_class);
create index idx_definition_phrase on definition using btree (phrase);
create index idx_definition_phrase_lower on definition using btree (lower(phrase));
create index idx_definition_phrase_order on definition using btree (phrase, def_num, def_uid);

create table discipline (
  discipline text,
  discipline_name text not null,
  glossary_count integer not null default 0,
  updated timestamp without time zone,
  updater text
);

create table external_ref (
  ext_uid serial primary key,
  phrase text not null,
  label text,
  url text not null,
  updated timestamp without time zone,
  updater text
);
create index idx_external_ref_phrase_lower on external_ref using btree (lower(phrase));

create table glossary (
  glo_uid serial primary key,
  phrase text not null,
  original text not null,
  discipline text,
  lang text not null default 'en'::text,
  ref_source text,
  wpid text,
  wpen text,
  updated timestamp without time zone,
  updater text not null,
  wikipedia_updated timestamp without time zone
);
create index idx_glossary_discipline on glossary using btree (discipline);
create index idx_glossary_original on glossary using btree (original);
create index idx_glossary_original_trgm on glossary using gin (original gin_trgm_ops);
create index idx_glossary_phrase on glossary using btree (phrase);
create index idx_glossary_phrase_trgm on glossary using gin (phrase gin_trgm_ops);
create index idx_glossary_ref_source on glossary using btree (ref_source);

create table language (
  lang text,
  lang_name text,
  updated timestamp without time zone,
  updater text not null
);

create table lexical_class (
  lex_class text,
  lex_class_name text not null,
  lex_class_ref text,
  sort_order smallint not null default '1'::smallint,
  updated timestamp without time zone,
  updater text
);

create table new_lemma (
  new_lemma text,
  glossary_count integer not null default 0,
  is_exists smallint not null default '0'::smallint,
  is_valid smallint not null default '0'::smallint
);

create table phrase (
  phrase text,
  phrase_type text not null default 'r'::text,
  lex_class text not null,
  roget_class text,
  pronounciation text,
  etymology text,
  ref_source text,
  def_count integer not null default 0,
  actual_phrase text,
  info text,
  notes text,
  updated timestamp without time zone,
  updater text,
  created timestamp without time zone,
  creator text not null,
  proverb_updated timestamp without time zone,
  wikipedia_updated timestamp without time zone,
  kbbi_updated timestamp without time zone
);
create index idx_phrase_actual on phrase using btree (actual_phrase) WHERE ((actual_phrase IS NOT NULL) AND (actual_phrase <> ''::text));
create index idx_phrase_lower on phrase using btree (lower(phrase));
create index idx_phrase_trgm on phrase using gin (phrase gin_trgm_ops);
create index idx_phrase_type on phrase using btree (phrase_type);

create table phrase_type (
  phrase_type text,
  phrase_type_name text not null,
  sort_order smallint not null default '1'::smallint,
  updated timestamp without time zone,
  updater text not null
);

create table proverb (
  prv_uid serial primary key,
  phrase text not null,
  proverb text not null,
  meaning text,
  prv_type integer not null default 0,
  updated timestamp without time zone,
  updater text not null
);
create index idx_proverb_phrase_lower on proverb using btree (lower(phrase));
create index idx_proverb_trgm on proverb using gin (proverb gin_trgm_ops);

create table ref_source (
  ref_source text,
  ref_source_name text not null,
  dictionary smallint not null default '0'::smallint,
  glossary smallint not null default '0'::smallint,
  translation smallint not null default '0'::smallint,
  glossary_count integer not null default 0,
  updated timestamp without time zone,
  updater text not null
);

create table relation (
  rel_uid serial primary key,
  root_phrase text not null,
  related_phrase text not null,
  rel_type text not null,
  updated timestamp without time zone,
  updater text
);
create index idx_relation_related on relation using btree (related_phrase);
create index idx_relation_root on relation using btree (root_phrase);
create index idx_relation_root_lower on relation using btree (lower(root_phrase));
create unique index idx_relation_unique on relation using btree (root_phrase, related_phrase, rel_type);

create table relation_type (
  rel_type text,
  rel_type_name text not null,
  sort_order smallint not null default '1'::smallint,
  updated timestamp without time zone,
  updater text
);

create table roget_class (
  roget_class text,
  number text,
  suffix text,
  roget_name text,
  english_name text,
  asterix text,
  caret text,
  class_num smallint,
  division_num smallint,
  section_num smallint
);

create table searched_phrase (
  phrase text,
  search_count integer not null default 0,
  last_searched timestamp without time zone not null
);
create index idx_searched_phrase on searched_phrase using btree (search_count DESC);
create unique index idx_searched_phrase_phrase on searched_phrase using btree (phrase);

create table sys_abbrev (
  abbrev text,
  label text,
  type text,
  updated timestamp without time zone,
  updater text
);

create table sys_comment (
  comment_id serial primary key,
  ses_id text,
  sender_name text not null,
  sender_email text not null,
  url text,
  status smallint not null default '1'::smallint,
  sent_date timestamp without time zone not null,
  comment_text text,
  response text
);

create table sys_user (
  user_id text,
  pass_key text not null,
  full_name text,
  last_access timestamp without time zone,
  updated timestamp without time zone,
  updater text not null
);

create table translation (
  lemma text,
  ref_source text,
  translation text
);
create index idx_translation_lemma_lower on translation using btree (lower(lemma));

-- Schema extraction completed successfully