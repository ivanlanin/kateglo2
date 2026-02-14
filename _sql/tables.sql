-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Generated: 2026-02-14T02:08:36.480Z

-- ============================================
-- TABLES
-- ============================================

create table _thesaurus (
  lemma character varying(32) default ''::character varying,
  synonym character varying(1000) not null,
  antonym character varying(1000) default NULL::character varying,
  parent character varying(32) default NULL::character varying
);

create table abbr_entry (
  abbr_idx serial primary key,
  abbr_key character varying(255) default NULL::character varying,
  abbr_id character varying(4000) default NULL::character varying,
  abbr_en character varying(4000) default NULL::character varying,
  abbr_type character varying(255) default NULL::character varying,
  lang character varying(16) default NULL::character varying,
  redirect_to character varying(255) default NULL::character varying,
  source character varying(16) default NULL::character varying,
  url character varying(255) default NULL::character varying,
  notes character varying(4000) default NULL::character varying
);
create index idx_abbr_key on abbr_entry using btree (abbr_key);

create table definition (
  def_uid serial primary key,
  phrase character varying(255) not null,
  def_num smallint not null default '1'::smallint,
  lex_class character varying(16) default NULL::character varying,
  def_text character varying(4000) not null,
  discipline character varying(32) default NULL::character varying,
  sample character varying(4000) default NULL::character varying,
  see character varying(255) default NULL::character varying,
  updated timestamp without time zone,
  updater character varying(32) default NULL::character varying,
  wikipedia_updated timestamp without time zone
);
create index idx_definition_phrase on definition using btree (phrase);

create table discipline (
  discipline character varying(32),
  discipline_name character varying(255) not null,
  glossary_count integer not null default 0,
  updated timestamp without time zone,
  updater character varying(32) default NULL::character varying
);

create table external_ref (
  ext_uid serial primary key,
  phrase character varying(255) not null,
  label character varying(255) default NULL::character varying,
  url character varying(255) not null,
  updated timestamp without time zone,
  updater character varying(32) default NULL::character varying
);

create table glossary (
  glo_uid serial primary key,
  phrase character varying(255) not null,
  original character varying(255) not null,
  discipline character varying(32) default NULL::character varying,
  lang character varying(16) not null default 'en'::character varying,
  ref_source character varying(16) default NULL::character varying,
  wpid character varying(255) default NULL::character varying,
  wpen character varying(255) default NULL::character varying,
  updated timestamp without time zone,
  updater character varying(32) not null,
  wikipedia_updated timestamp without time zone
);
create index idx_glossary_discipline on glossary using btree (discipline);
create index idx_glossary_original on glossary using btree (original);
create index idx_glossary_phrase on glossary using btree (phrase);
create index idx_glossary_ref_source on glossary using btree (ref_source);

create table language (
  lang character varying(16),
  lang_name character varying(255) default NULL::character varying,
  updated timestamp without time zone,
  updater character varying(32) not null
);

create table lexical_class (
  lex_class character varying(16),
  lex_class_name character varying(255) not null,
  lex_class_ref character varying(255) default NULL::character varying,
  sort_order smallint not null default '1'::smallint,
  updated timestamp without time zone,
  updater character varying(32) default NULL::character varying
);

create table new_lemma (
  new_lemma character varying(255),
  glossary_count integer not null default 0,
  is_exists smallint not null default '0'::smallint,
  is_valid smallint not null default '0'::smallint
);

create table phrase (
  phrase character varying(255),
  phrase_type character varying(16) not null default 'r'::character varying,
  lex_class character varying(16) not null,
  roget_class character varying(16) default NULL::character varying,
  pronounciation character varying(4000) default NULL::character varying,
  etymology character varying(4000) default NULL::character varying,
  ref_source character varying(16) default NULL::character varying,
  def_count integer not null default 0,
  actual_phrase character varying(255) default NULL::character varying,
  info character varying(255) default NULL::character varying,
  notes character varying(4000) default NULL::character varying,
  updated timestamp without time zone,
  updater character varying(32) default NULL::character varying,
  created timestamp without time zone,
  creator character varying(32) not null,
  proverb_updated timestamp without time zone,
  wikipedia_updated timestamp without time zone,
  kbbi_updated timestamp without time zone
);

create table phrase_type (
  phrase_type character varying(16),
  phrase_type_name character varying(255) not null,
  sort_order smallint not null default '1'::smallint,
  updated timestamp without time zone,
  updater character varying(32) not null
);

create table proverb (
  prv_uid serial primary key,
  phrase character varying(255) not null,
  proverb character varying(4000) not null,
  meaning character varying(4000) default NULL::character varying,
  prv_type integer not null default 0,
  updated timestamp without time zone,
  updater character varying(32) not null
);

create table ref_source (
  ref_source character varying(16),
  ref_source_name character varying(255) not null,
  dictionary smallint not null default '0'::smallint,
  glossary smallint not null default '0'::smallint,
  translation smallint not null default '0'::smallint,
  glossary_count integer not null default 0,
  updated timestamp without time zone,
  updater character varying(32) not null
);

create table relation (
  rel_uid serial primary key,
  root_phrase character varying(255) not null,
  related_phrase character varying(255) not null,
  rel_type character varying(16) not null,
  updated timestamp without time zone,
  updater character varying(32) default NULL::character varying
);
create index idx_relation_related on relation using btree (related_phrase);
create index idx_relation_root on relation using btree (root_phrase);
create unique index idx_relation_unique on relation using btree (root_phrase, related_phrase, rel_type);

create table relation_type (
  rel_type character varying(16),
  rel_type_name character varying(255) not null,
  sort_order smallint not null default '1'::smallint,
  updated timestamp without time zone,
  updater character varying(32) default NULL::character varying
);

create table roget_class (
  roget_class character varying(16),
  number character varying(16) default NULL::character varying,
  suffix character varying(16) default NULL::character varying,
  roget_name character varying(255) default NULL::character varying,
  english_name character varying(255) default NULL::character varying,
  asterix character varying(16) default NULL::character varying,
  caret character varying(16) default NULL::character varying,
  class_num smallint,
  division_num smallint,
  section_num smallint
);

create table searched_phrase (
  phrase character varying(255),
  search_count integer not null default 0,
  last_searched timestamp without time zone not null
);
create index idx_searched_phrase on searched_phrase using btree (search_count DESC);

create table sys_abbrev (
  abbrev character varying(16),
  label character varying(255) default NULL::character varying,
  type character varying(16) default NULL::character varying,
  updated timestamp without time zone,
  updater character varying(32) default NULL::character varying
);

create table sys_comment (
  comment_id serial primary key,
  ses_id character varying(32) default NULL::character varying,
  sender_name character varying(255) not null,
  sender_email character varying(255) not null,
  url character varying(255) default NULL::character varying,
  status smallint not null default '1'::smallint,
  sent_date timestamp without time zone not null,
  comment_text character varying(4000) default NULL::character varying,
  response character varying(4000) default NULL::character varying
);

create table sys_user (
  user_id character varying(32),
  pass_key character varying(32) not null,
  full_name character varying(255) default NULL::character varying,
  last_access timestamp without time zone,
  updated timestamp without time zone,
  updater character varying(32) not null
);

create table translation (
  lemma character varying(255),
  ref_source character varying(16),
  translation character varying(4000) default NULL::character varying
);

-- Schema extraction completed successfully