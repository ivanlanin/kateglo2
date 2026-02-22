-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Generated: 2026-02-22T07:16:19.266Z

-- ============================================
-- TRIGGER FUNCTIONS (Standalone Procedures)
-- ============================================

-- Function: set_timestamp_fields
create or replace function set_timestamp_fields()
 returns trigger
 language plpgsql
as $function$
begin
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, NOW());
    NEW.updated_at := COALESCE(NEW.updated_at, NEW.created_at, NOW());
    RETURN NEW;
  end IF;

  NEW.created_at := COALESCE(NEW.created_at, OLD.created_at, NOW());
  NEW.updated_at := NOW();
  RETURN NEW;
end;
$function$


-- Function: touch_entri_updated_at_from_makna
create or replace function touch_entri_updated_at_from_makna()
 returns trigger
 language plpgsql
as $function$
declare
  target_entri_id INTEGER;
begin
  target_entri_id := COALESCE(NEW.entri_id, OLD.entri_id);

  IF target_entri_id IS NULL THEN
    RETURN NULL;
  end IF;

  UPDATE entri
     SET updated_at = NOW()
   WHERE id = target_entri_id;

  RETURN NULL;
end;
$function$


-- Function: touch_makna_updated_at_from_contoh
create or replace function touch_makna_updated_at_from_contoh()
 returns trigger
 language plpgsql
as $function$
declare
  target_makna_id INTEGER;
begin
  target_makna_id := COALESCE(NEW.makna_id, OLD.makna_id);

  IF target_makna_id IS NULL THEN
    RETURN NULL;
  end IF;

  UPDATE makna
     SET updated_at = NOW()
   WHERE id = target_makna_id;

  RETURN NULL;
end;
$function$



-- ============================================
-- TABLES
-- ============================================

create table bidang (
  id serial primary key,
  kode text not null,
  nama text not null,
  aktif boolean not null default true,
  keterangan text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint bidang_kode_key unique (kode),
  constraint bidang_nama_key unique (nama)
);
create unique index bidang_kode_key on bidang using btree (kode);
create unique index bidang_nama_key on bidang using btree (nama);
create trigger trg_set_timestamp_fields__bidang
  before insert or update on bidang
  for each row
  execute function set_timestamp_fields();

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
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  aktif boolean not null default true,
  constraint contoh_legacy_cid_key unique (legacy_cid),
  constraint contoh_contoh_check check (TRIM(BOTH FROM contoh) <> ''::text)
);
create unique index contoh_legacy_cid_key on contoh using btree (legacy_cid);
create index idx_contoh_makna on contoh using btree (makna_id, urutan);
create trigger trg_set_timestamp_fields__contoh
  before insert or update on contoh
  for each row
  execute function set_timestamp_fields();
create trigger trg_touch_makna_updated_at_from_contoh
  after delete or insert or update on contoh
  for each row
  execute function touch_makna_updated_at_from_contoh();

create table entri (
  id serial primary key,
  legacy_eid integer,
  entri text not null,
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
  indeks text not null,
  homonim integer,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  sumber text,
  homograf integer,
  constraint entri_legacy_eid_key unique (legacy_eid),
  constraint entri_entri_check check (TRIM(BOTH FROM entri) <> ''::text)
);
create unique index entri_legacy_eid_key on entri using btree (legacy_eid);
create index idx_entri_indeks on entri using btree (indeks);
create index idx_entri_indeks_homograf_homonim on entri using btree (indeks, homograf, homonim, id);
create index idx_entri_induk on entri using btree (induk);
create index idx_entri_induk_aktif_jenis_entri on entri using btree (induk, aktif, jenis, entri);
create index idx_entri_jenis on entri using btree (jenis);
create index idx_entri_lower on entri using btree (lower(entri));
create index idx_entri_serupa_norm_aktif on entri using btree (lower(regexp_replace(replace(entri, '-'::text, ''::text), '\s*\([0-9]+\)\s*$'::text, ''::text))) WHERE (aktif = 1);
create index idx_entri_trgm on entri using gin (entri gin_trgm_ops);
create trigger trg_set_timestamp_fields__entri
  before insert or update on entri
  for each row
  execute function set_timestamp_fields();

create table etimologi_lwim (
  lwim_id text,
  indeks_query text not null,
  lwim_orth text not null,
  lwim_hom integer,
  etym_lang text,
  etym_mentioned text,
  etym_cite text,
  etym_aksara text,
  raw_def text,
  xr_lihat text,
  xr_varian text,
  fetched_at timestamp without time zone not null default now()
);
create index idx_etimologi_lwim_indeks on etimologi_lwim using btree (indeks_query);
create index idx_etimologi_lwim_orth on etimologi_lwim using btree (lwim_orth);

create table glosarium (
  id serial primary key,
  indonesia text not null,
  asing text not null,
  bahasa text not null default 'en'::text,
  wpid text,
  wpen text,
  updated timestamp without time zone,
  updater text not null,
  wikipedia_updated timestamp without time zone,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  aktif boolean not null default true,
  bidang_id integer references bidang(id) on delete restrict on update cascade not null,
  sumber_id integer references sumber(id) on delete restrict on update cascade not null
);
create index idx_glosarium_aktif_bahasa_indonesia on glosarium using btree (bahasa, indonesia) WHERE (aktif = true);
create index idx_glosarium_aktif_bidang_id_asing on glosarium using btree (bidang_id, asing) WHERE (aktif = true);
create index idx_glosarium_aktif_sumber_id_asing on glosarium using btree (sumber_id, asing) WHERE (aktif = true);
create index idx_glosarium_asing on glosarium using btree (asing);
create index idx_glosarium_asing_trgm on glosarium using gin (asing gin_trgm_ops);
create index idx_glosarium_bidang_id on glosarium using btree (bidang_id);
create index idx_glosarium_indonesia on glosarium using btree (indonesia);
create index idx_glosarium_indonesia_lower_trgm on glosarium using gin (lower(indonesia) gin_trgm_ops);
create index idx_glosarium_indonesia_trgm on glosarium using gin (indonesia gin_trgm_ops);
create index idx_glosarium_indonesia_tsv_simple on glosarium using gin (to_tsvector('simple'::regconfig, indonesia));
create index idx_glosarium_sumber_id on glosarium using btree (sumber_id);
create trigger trg_set_timestamp_fields__glosarium
  before insert or update on glosarium
  for each row
  execute function set_timestamp_fields();

create table izin (
  id serial primary key,
  kode text not null,
  nama text not null,
  kelompok text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint izin_kode_key unique (kode)
);
create unique index izin_kode_key on izin using btree (kode);
create trigger trg_set_timestamp_fields__izin
  before insert or update on izin
  for each row
  execute function set_timestamp_fields();

create table komentar_kamus (
  id serial primary key,
  indeks text not null,
  pengguna_id integer references pengguna(id) on delete cascade not null,
  komentar text not null,
  aktif boolean not null default false,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint komentar_kamus_indeks_pengguna_key unique (indeks, pengguna_id),
  constraint komentar_kamus_indeks_check check (TRIM(BOTH FROM indeks) <> ''::text),
  constraint komentar_kamus_komentar_check check (TRIM(BOTH FROM komentar) <> ''::text)
);
create index idx_komentar_kamus_indeks on komentar_kamus using btree (indeks);
create index idx_komentar_kamus_indeks_aktif on komentar_kamus using btree (indeks, aktif);
create index idx_komentar_kamus_pengguna_id on komentar_kamus using btree (pengguna_id);
create index idx_komentar_kamus_updated_at on komentar_kamus using btree (updated_at DESC);
create unique index komentar_kamus_indeks_pengguna_key on komentar_kamus using btree (indeks, pengguna_id);
create trigger trg_set_timestamp_fields__komentar_kamus
  before insert or update on komentar_kamus
  for each row
  execute function set_timestamp_fields();

create table label (
  id serial primary key,
  kategori text not null,
  kode text not null,
  nama text not null,
  keterangan text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  urutan integer not null default 1,
  aktif boolean not null default true,
  constraint label_kategori_kode_key unique (kategori, kode)
);
create index idx_label_kategori_nama on label using btree (kategori, nama);
create unique index label_kategori_kode_key on label using btree (kategori, kode);
create trigger trg_set_timestamp_fields__label
  before insert or update on label
  for each row
  execute function set_timestamp_fields();

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
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  aktif boolean not null default true,
  constraint makna_legacy_mid_key unique (legacy_mid),
  constraint makna_makna_check check (TRIM(BOTH FROM makna) <> ''::text),
  constraint makna_tipe_penyingkat_check check ((tipe_penyingkat IS NULL) OR (tipe_penyingkat = ANY (ARRAY['akronim'::text, 'kependekan'::text, 'singkatan'::text])))
);
create index idx_makna_bidang on makna using btree (bidang);
create index idx_makna_entri on makna using btree (entri_id, urutan);
create index idx_makna_kelas_kata on makna using btree (kelas_kata);
create unique index makna_legacy_mid_key on makna using btree (legacy_mid);
create trigger trg_set_timestamp_fields__makna
  before insert or update on makna
  for each row
  execute function set_timestamp_fields();
create trigger trg_touch_entri_updated_at_from_makna
  after delete or insert or update on makna
  for each row
  execute function touch_entri_updated_at_from_makna();

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
create trigger trg_set_timestamp_fields__pengguna
  before insert or update on pengguna
  for each row
  execute function set_timestamp_fields();

create table peran (
  id serial primary key,
  kode text not null,
  nama text not null,
  keterangan text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  akses_redaksi boolean not null default false,
  constraint peran_kode_key unique (kode)
);
create unique index peran_kode_key on peran using btree (kode);
create trigger trg_set_timestamp_fields__peran
  before insert or update on peran
  for each row
  execute function set_timestamp_fields();

create table peran_izin (
  peran_id integer references peran(id) on delete cascade,
  izin_id integer references izin(id) on delete cascade,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);
create trigger trg_set_timestamp_fields__peran_izin
  before insert or update on peran_izin
  for each row
  execute function set_timestamp_fields();

create table sumber (
  id serial primary key,
  kode text not null,
  nama text not null,
  aktif boolean not null default true,
  keterangan text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint sumber_kode_key unique (kode),
  constraint sumber_nama_key unique (nama)
);
create unique index sumber_kode_key on sumber using btree (kode);
create unique index sumber_nama_key on sumber using btree (nama);
create trigger trg_set_timestamp_fields__sumber
  before insert or update on sumber
  for each row
  execute function set_timestamp_fields();

create table tesaurus (
  id serial primary key,
  indeks text not null,
  sinonim text,
  antonim text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  aktif boolean not null default true,
  constraint tesaurus_indeks_key unique (indeks)
);
create index idx_tesaurus_indeks_lower on tesaurus using btree (lower(indeks));
create index idx_tesaurus_indeks_trgm on tesaurus using gin (indeks gin_trgm_ops);
create unique index tesaurus_indeks_key on tesaurus using btree (indeks);
create trigger trg_set_timestamp_fields__tesaurus
  before insert or update on tesaurus
  for each row
  execute function set_timestamp_fields();

-- Schema extraction completed successfully