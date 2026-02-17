-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Generated: 2026-02-16T16:43:24.341Z

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

create table entri (
  id serial primary key,
  legacy_eid integer,
  entri text not null,
  indeks text not null,
  homonim integer,
  urutan integer not null default 1,
  jenis text not null,
  induk integer references entri(id) on delete set null,
  pemenggalan text,
  lafal text,
  varian text,
  jenis_rujuk text,
  lema_rujuk text,
  aktif integer not null default 1,
  legacy_tabel text,
  legacy_tid integer,
  constraint entri_legacy_eid_key unique (legacy_eid),
  constraint entri_entri_check check (TRIM(BOTH FROM entri) <> ''::text),
  constraint entri_jenis_check check (jenis = ANY (ARRAY['dasar'::text, 'turunan'::text, 'gabungan'::text, 'idiom'::text, 'peribahasa'::text, 'varian'::text]))
);
create unique index entri_legacy_eid_key on entri using btree (legacy_eid);
create index idx_entri_induk on entri using btree (induk);
create index idx_entri_induk_aktif_jenis_entri on entri using btree (induk, aktif, jenis, entri);
create index idx_entri_indeks on entri using btree (indeks);
create index idx_entri_indeks_urutan on entri using btree (indeks, urutan, id);
create index idx_entri_jenis on entri using btree (jenis);
create index idx_entri_lower on entri using btree (lower(entri));
create index idx_entri_serupa_norm_aktif on entri using btree (lower(regexp_replace(replace(entri, '-'::text, ''::text), '\s*\([0-9]+\)\s*$'::text, ''::text))) WHERE (aktif = 1);
create index idx_entri_trgm on entri using gin (entri gin_trgm_ops);

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

create table izin (
  id serial primary key,
  kode text not null,
  nama text not null,
  kelompok text,
  constraint izin_kode_key unique (kode)
);
create unique index izin_kode_key on izin using btree (kode);

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

create table makna (
  id serial primary key,
  legacy_mid integer,
  entri_id integer references entri(id) on delete cascade not null,
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
create index idx_makna_entri on makna using btree (entri_id, urutan);
create index idx_makna_kelas_kata on makna using btree (kelas_kata);
create unique index makna_legacy_mid_key on makna using btree (legacy_mid);

create table pengguna (
  id serial primary key,
  google_id text not null,
  surel text not null,
  nama text not null,
  foto text,
  peran_id integer references peran(id) not null default 1,
  aktif integer not null default 1,
  login_terakhir timestamp without time zone,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint pengguna_google_id_key unique (google_id)
);
create index idx_pengguna_surel on pengguna using btree (surel);
create unique index pengguna_google_id_key on pengguna using btree (google_id);

create table peran (
  id serial primary key,
  kode text not null,
  nama text not null,
  keterangan text,
  constraint peran_kode_key unique (kode)
);
create unique index peran_kode_key on peran using btree (kode);

create table peran_izin (
  peran_id integer references peran(id) on delete cascade,
  izin_id integer references izin(id) on delete cascade
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

-- Schema extraction completed successfully