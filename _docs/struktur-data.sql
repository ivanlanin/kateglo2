-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Generated: 2026-02-15T20:03:50.227Z

-- ============================================
-- TABLES
-- ============================================

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

create table glosarium (
  id serial primary key,
  indonesia text not null,
  asing text not null,
  bidang text,
  bahasa text not null default 'en'::text,
  sumber text,
  wpid text,
  wpen text,
  updated timestamp without time zone,
  updater text not null,
  wikipedia_updated timestamp without time zone
);
create index idx_glosarium_asing on glosarium using btree (asing);
create index idx_glosarium_asing_trgm on glosarium using gin (asing gin_trgm_ops);
create index idx_glosarium_bidang on glosarium using btree (bidang);
create index idx_glosarium_indonesia on glosarium using btree (indonesia);
create index idx_glosarium_indonesia_lower_trgm on glosarium using gin (lower(indonesia) gin_trgm_ops);
create index idx_glosarium_indonesia_trgm on glosarium using gin (indonesia gin_trgm_ops);
create index idx_glosarium_indonesia_tsv_simple on glosarium using gin (to_tsvector('simple'::regconfig, indonesia));
create index idx_glosarium_sumber on glosarium using btree (sumber);

create table label (
  id serial primary key,
  kategori text not null,
  kode text not null,
  nama text not null,
  keterangan text,
  sumber text,
  constraint label_kategori_kode_key unique (kategori, kode)
);
create index idx_label_kategori_nama on label using btree (kategori, nama);
create unique index label_kategori_kode_key on label using btree (kategori, kode);

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
create index idx_lema_induk_aktif_jenis_lema on lema using btree (induk, aktif, jenis, lema);
create index idx_lema_jenis on lema using btree (jenis);
create index idx_lema_lower on lema using btree (lower(lema));
create index idx_lema_serupa_norm_aktif on lema using btree (lower(regexp_replace(replace(lema, '-'::text, ''::text), '\s*\([0-9]+\)\s*$'::text, ''::text))) WHERE (aktif = 1);
create index idx_lema_trgm on lema using gin (lema gin_trgm_ops);
create unique index lema_legacy_eid_key on lema using btree (legacy_eid);

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

-- Schema extraction completed successfully