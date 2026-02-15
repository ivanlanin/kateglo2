-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Generated: 2026-02-15T13:47:38.904Z

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

create table contoh (
  id serial primary key,
  legacy_cid integer,
  makna_id integer references makna(id) on delete cascade not null,
  urutan integer not null default 1,
  contoh text not null,
  ragam text,
  bahasa text,
  bidang text,
  kiasan integer not null default 0,
  makna_contoh text,
  constraint contoh_legacy_cid_key unique (legacy_cid),
  constraint contoh_contoh_check check (TRIM(BOTH FROM contoh) <> ''::text)
);
create unique index contoh_legacy_cid_key on contoh using btree (legacy_cid);
create index idx_contoh_makna on contoh using btree (makna_id, urutan);

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

create table label (
  id serial primary key,
  kategori text not null,
  kode text not null,
  nama text not null,
  keterangan text,
  sumber text,
  constraint label_kategori_kode_key unique (kategori, kode),
  constraint label_kategori_check check (kategori = ANY (ARRAY['ragam'::text, 'kelas_kata'::text, 'bahasa'::text, 'bidang'::text]))
);
create index idx_label_kategori_nama on label using btree (kategori, nama);
create unique index label_kategori_kode_key on label using btree (kategori, kode);

create table language (
  lang text,
  lang_name text,
  updated timestamp without time zone,
  updater text not null
);

create table lema (
  id serial primary key,
  legacy_eid integer,
  lema text not null,
  jenis text not null,
  induk integer references lema(id) on delete set null,
  pemenggalan text,
  lafal text,
  varian text,
  jenis_rujuk text,
  lema_rujuk text,
  aktif integer not null default 1,
  legacy_tabel text,
  legacy_tid integer,
  constraint lema_legacy_eid_key unique (legacy_eid),
  constraint lema_lema_check check (TRIM(BOTH FROM lema) <> ''::text),
  constraint lema_jenis_check check (jenis = ANY (ARRAY['dasar'::text, 'berimbuhan'::text, 'gabungan'::text, 'idiom'::text, 'peribahasa'::text, 'varian'::text]))
);
create index idx_lema_induk on lema using btree (induk);
create index idx_lema_jenis on lema using btree (jenis);
create index idx_lema_lower on lema using btree (lower(lema));
create index idx_lema_trgm on lema using gin (lema gin_trgm_ops);
create unique index lema_legacy_eid_key on lema using btree (legacy_eid);

create table lexical_class (
  lex_class text,
  lex_class_name text not null,
  lex_class_ref text,
  sort_order smallint not null default '1'::smallint,
  updated timestamp without time zone,
  updater text
);

create table makna (
  id serial primary key,
  legacy_mid integer,
  lema_id integer references lema(id) on delete cascade not null,
  polisem integer not null default 1,
  urutan integer not null default 1,
  makna text not null,
  ragam text,
  ragam_varian text,
  kelas_kata text,
  bahasa text,
  bidang text,
  kiasan integer not null default 0,
  tipe_penyingkat text,
  ilmiah text,
  kimia text,
  constraint makna_legacy_mid_key unique (legacy_mid),
  constraint makna_makna_check check (TRIM(BOTH FROM makna) <> ''::text),
  constraint makna_tipe_penyingkat_check check ((tipe_penyingkat IS NULL) OR (tipe_penyingkat = ANY (ARRAY['akronim'::text, 'kependekan'::text, 'singkatan'::text])))
);
create index idx_makna_bidang on makna using btree (bidang);
create index idx_makna_kelas_kata on makna using btree (kelas_kata);
create index idx_makna_lema on makna using btree (lema_id, urutan);
create unique index makna_legacy_mid_key on makna using btree (legacy_mid);

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

create table tesaurus (
  id serial primary key,
  lema text not null,
  sinonim text,
  antonim text,
  turunan text,
  gabungan text,
  berkaitan text,
  constraint tesaurus_lema_key unique (lema)
);
create index idx_tesaurus_lema_lower on tesaurus using btree (lower(lema));
create index idx_tesaurus_lema_trgm on tesaurus using gin (lema gin_trgm_ops);
create unique index tesaurus_lema_key on tesaurus using btree (lema);

create table translation (
  lemma text,
  ref_source text,
  translation text
);
create index idx_translation_lemma_lower on translation using btree (lower(lemma));

-- Schema extraction completed successfully