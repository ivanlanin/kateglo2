-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Generated: 2026-03-03T05:39:56.000Z

-- ============================================
-- TRIGGER FUNCTIONS (Standalone Procedures)
-- ============================================

-- Function: pencarian_route
create or replace function pencarian_route()
 returns trigger
 language plpgsql
as $function$
declare
  nama_tabel text;
  awal_bulan date;
  akhir_bulan date;
  waktu_utc timestamp without time zone;
begin
  IF NEW.tanggal IS NULL THEN
    NEW.tanggal := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  end IF;

  IF NEW.kata IS NULL OR btrim(NEW.kata) = '' THEN
    RETURN NULL;
  end IF;

  IF NEW.jumlah IS NULL OR NEW.jumlah < 1 THEN
    NEW.jumlah := 1;
  end IF;

  IF NEW.domain IS NULL OR NEW.domain NOT IN (1, 2, 3, 4, 5) THEN
    NEW.domain := 1;
  end IF;

  waktu_utc := now() AT TIME ZONE 'UTC';

  IF NEW.created_at IS NULL THEN
    NEW.created_at := waktu_utc;
  end IF;

  IF NEW.updated_at IS NULL THEN
    NEW.updated_at := waktu_utc;
  end IF;

  nama_tabel := format('pencarian_%s', to_char(NEW.tanggal, 'YYYYMM'));
  awal_bulan := date_trunc('month', NEW.tanggal)::date;
  akhir_bulan := (date_trunc('month', NEW.tanggal) + interval '1 month')::date;

  EXECUTE format(
    $fmt$
    CREATE TABLE IF NOT EXISTS %1$I (
      CHECK (tanggal >= date %2$L AND tanggal < date %3$L),
      CHECK (domain IN (1, 2, 3, 4, 5))
    ) INHERITS (pencarian)
    $fmt$,
    nama_tabel,
    awal_bulan,
    akhir_bulan
  );

  EXECUTE format(
    $fmt$
    CREATE UNIQUE INDEX IF NOT EXISTS %1$I ON %2$I (tanggal, domain, kata)
    $fmt$,
    nama_tabel || '_tanggal_domain_kata_key',
    nama_tabel
  );

  EXECUTE format(
    $fmt$
    INSERT INTO %1$I (tanggal, domain, kata, jumlah, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (tanggal, domain, kata)
    DO UPDATE SET
      jumlah = %1$I.jumlah + EXCLUDED.jumlah,
      created_at = LEAST(%1$I.created_at, EXCLUDED.created_at),
      updated_at = GREATEST(%1$I.updated_at, EXCLUDED.updated_at)
    $fmt$,
    nama_tabel
  ) USING NEW.tanggal, NEW.domain, lower(btrim(NEW.kata)), NEW.jumlah, NEW.created_at, NEW.updated_at;

  RETURN NULL;
end;
$function$


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

create table audit_makna (
  id serial primary key,
  indeks text not null,
  jumlah integer not null default 0,
  entri_id integer references entri(id) on delete set null,
  makna_id integer references makna(id) on delete set null,
  status text not null default 'tinjau'::text,
  catatan text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint audit_makna_indeks_key unique (indeks),
  constraint audit_makna_jumlah_check check (jumlah >= 0),
  constraint audit_makna_status_check check (status = ANY (ARRAY['tinjau'::text, 'salah'::text, 'tambah'::text, 'nama'::text])),
  constraint audit_makna_indeks_check check (TRIM(BOTH FROM indeks) <> ''::text),
  constraint audit_makna_indeks_lowercase_check check (indeks = lower(indeks))
);
create unique index audit_makna_indeks_key on audit_makna using btree (indeks);
create index idx_audit_makna_entri_id on audit_makna using btree (entri_id);
create index idx_audit_makna_jumlah on audit_makna using btree (jumlah DESC, indeks);
create index idx_audit_makna_makna_id on audit_makna using btree (makna_id);
create index idx_audit_makna_status_jumlah on audit_makna using btree (status, jumlah DESC, indeks);
create trigger trg_set_timestamp_fields__audit_makna
  before insert or update on audit_makna
  for each row
  execute function set_timestamp_fields();

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
  homograf integer,
  entri_rujuk integer,
  sumber_id integer references sumber(id) on delete restrict on update cascade,
  constraint entri_legacy_eid_key unique (legacy_eid),
  constraint entri_entri_check check (TRIM(BOTH FROM entri) <> ''::text)
);
create unique index entri_legacy_eid_key on entri using btree (legacy_eid);
create index idx_entri_entri_rujuk on entri using btree (entri_rujuk);
create index idx_entri_indeks on entri using btree (indeks);
create index idx_entri_indeks_homograf_homonim on entri using btree (indeks, homograf, homonim, id);
create index idx_entri_induk on entri using btree (induk);
create index idx_entri_induk_aktif_jenis_entri on entri using btree (induk, aktif, jenis, entri);
create index idx_entri_jenis on entri using btree (jenis);
create index idx_entri_lema_rujuk on entri using btree (lema_rujuk);
create index idx_entri_lower on entri using btree (lower(entri));
create index idx_entri_serupa_norm_aktif on entri using btree (lower(regexp_replace(replace(entri, '-'::text, ''::text), '\s*\([0-9]+\)\s*$'::text, ''::text))) WHERE (aktif = 1);
create index idx_entri_sumber_id on entri using btree (sumber_id);
create index idx_entri_trgm on entri using gin (entri gin_trgm_ops);
create trigger trg_set_timestamp_fields__entri
  before insert or update on entri
  for each row
  execute function set_timestamp_fields();

create table entri_tagar (
  entri_id integer references entri(id) on delete cascade,
  tagar_id integer references tagar(id) on delete cascade,
  created_at timestamp without time zone not null default now()
);
create index idx_entri_tagar_entri_id on entri_tagar using btree (entri_id);
create index idx_entri_tagar_tagar_id on entri_tagar using btree (tagar_id);

create table etimologi (
  id serial primary key,
  indeks text not null,
  entri_id integer references entri(id) on delete set null,
  homonim integer,
  lafal text,
  bahasa text,
  sumber_sitasi text,
  sumber_isi text,
  sumber_aksara text,
  sumber_lihat text,
  sumber_varian text,
  sumber_definisi text,
  lwim_ref text,
  aktif boolean not null default false,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null,
  kata_asal text,
  arti_asal text,
  sumber_id integer references sumber(id) on delete restrict on update cascade,
  constraint etimologi_indeks_check check (TRIM(BOTH FROM indeks) <> ''::text)
);
create index idx_etimologi_aktif on etimologi using btree (aktif);
create index idx_etimologi_bahasa on etimologi using btree (bahasa);
create index idx_etimologi_created_at on etimologi using btree (created_at DESC);
create index idx_etimologi_entri_id on etimologi using btree (entri_id);
create index idx_etimologi_indeks on etimologi using btree (indeks);
create index idx_etimologi_indeks_homonim on etimologi using btree (indeks, homonim);
create index idx_etimologi_lafal on etimologi using btree (lafal);
create index idx_etimologi_lwim_ref on etimologi using btree (lwim_ref);
create index idx_etimologi_sumber_id on etimologi using btree (sumber_id);

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

create table komentar (
  id serial primary key,
  indeks text not null,
  pengguna_id integer references pengguna(id) on delete cascade not null,
  komentar text not null,
  aktif boolean not null default false,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint komentar_indeks_pengguna_key unique (indeks, pengguna_id),
  constraint komentar_indeks_check check (TRIM(BOTH FROM indeks) <> ''::text),
  constraint komentar_komentar_check check (TRIM(BOTH FROM komentar) <> ''::text)
);
create index idx_komentar_indeks on komentar using btree (indeks);
create index idx_komentar_indeks_aktif on komentar using btree (indeks, aktif);
create index idx_komentar_pengguna_id on komentar using btree (pengguna_id);
create index idx_komentar_updated_at on komentar using btree (updated_at DESC);
create unique index komentar_indeks_pengguna_key on komentar using btree (indeks, pengguna_id);
create trigger trg_set_timestamp_fields__komentar
  before insert or update on komentar
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
  makna text not null,
  ragam text,
  ragam_varian text,
  kelas_kata text,
  bahasa text,
  bidang text,
  kiasan boolean not null default false,
  penyingkatan text,
  ilmiah text,
  kimia text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  aktif boolean not null default true,
  constraint makna_legacy_mid_key unique (legacy_mid),
  constraint makna_makna_check check (TRIM(BOTH FROM makna) <> ''::text),
  constraint makna_penyingkatan_check check ((penyingkatan IS NULL) OR (penyingkatan = ANY (ARRAY['akronim'::text, 'kependekan'::text, 'singkatan'::text]))),
  constraint makna_ragam_varian_check check ((ragam_varian IS NULL) OR (ragam_varian = ANY (ARRAY['cak'::text, 'hor'::text, 'kl'::text, 'kas'::text])))
);
create index idx_makna_bidang on makna using btree (bidang);
create index idx_makna_entri on makna using btree (entri_id, polisem);
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

create table pencarian (
  tanggal date not null,
  kata text not null,
  jumlah integer not null default 0,
  domain smallint not null default 1,
  created_at timestamp without time zone not null default (now() AT TIME ZONE 'UTC'::text),
  updated_at timestamp without time zone not null default (now() AT TIME ZONE 'UTC'::text),
  constraint pencarian_domain_check check (domain = ANY (ARRAY[1, 2, 3, 4, 5])),
  constraint pencarian_jumlah_check check (jumlah >= 0)
);
create trigger trg_pencarian_route
  before insert on pencarian
  for each row
  execute function pencarian_route();

create table pencarian_202603 (
  tanggal date not null,
  kata text not null,
  jumlah integer not null default 0,
  domain smallint not null default 1,
  created_at timestamp without time zone not null default (now() AT TIME ZONE 'UTC'::text),
  updated_at timestamp without time zone not null default (now() AT TIME ZONE 'UTC'::text),
  constraint pencarian_202603_domain_check check (domain = ANY (ARRAY[1, 2, 3, 4, 5])),
  constraint pencarian_202603_tanggal_check check ((tanggal >= '2026-03-01'::date) AND (tanggal < '2026-04-01'::date)),
  constraint pencarian_domain_check check (domain = ANY (ARRAY[1, 2, 3, 4, 5])),
  constraint pencarian_jumlah_check check (jumlah >= 0)
);
create unique index pencarian_202603_tanggal_domain_kata_key on pencarian_202603 using btree (tanggal, domain, kata);

create table pencarian_hitam (
  id serial primary key,
  kata text not null,
  aktif boolean not null default true,
  catatan text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint pencarian_hitam_kata_check check (btrim(kata) <> ''::text),
  constraint pencarian_hitam_kata_lowercase_check check (kata = lower(kata))
);
create index idx_pencarian_hitam_aktif on pencarian_hitam using btree (aktif, kata);
create unique index pencarian_hitam_kata_key on pencarian_hitam using btree (kata);
create trigger trg_set_timestamp_fields__pencarian_hitam
  before insert or update on pencarian_hitam
  for each row
  execute function set_timestamp_fields();

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
  glosarium boolean not null default true,
  keterangan text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  kamus boolean not null default false,
  tesaurus boolean not null default false,
  etimologi boolean not null default false,
  constraint sumber_nama_key unique (nama),
  constraint sumber_kode_key unique (kode)
);
create unique index sumber_kode_key on sumber using btree (kode);
create unique index sumber_nama_key on sumber using btree (nama);
create trigger trg_set_timestamp_fields__sumber
  before insert or update on sumber
  for each row
  execute function set_timestamp_fields();

create table susun_kata (
  id serial primary key,
  tanggal date not null,
  panjang integer not null,
  kata text not null,
  keterangan text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint susun_kata_tanggal_panjang_key unique (tanggal, panjang),
  constraint susun_kata_kata_check check (kata ~ '^[a-z]+$'::text),
  constraint susun_kata_kata_panjang_check check (char_length(kata) = panjang),
  constraint susun_kata_panjang_check check ((panjang >= 4) AND (panjang <= 8))
);
create index idx_susun_kata_panjang_tanggal on susun_kata using btree (panjang, tanggal DESC);
create index idx_susun_kata_tanggal on susun_kata using btree (tanggal DESC);
create unique index susun_kata_tanggal_panjang_key on susun_kata using btree (tanggal, panjang);
create trigger trg_set_timestamp_fields__susun_kata
  before insert or update on susun_kata
  for each row
  execute function set_timestamp_fields();

create table susun_kata_bebas (
  id serial primary key,
  tanggal date not null default ((now() AT TIME ZONE 'Asia/Jakarta'::text))::date,
  panjang integer not null,
  kata text not null,
  pengguna_id integer references pengguna(id) on delete cascade not null,
  percobaan integer not null,
  tebakan text not null default ''::text,
  detik integer not null,
  menang boolean not null,
  created_at timestamp without time zone not null default now(),
  constraint susun_kata_bebas_kata_check check (kata ~ '^[a-z]+$'::text),
  constraint susun_kata_bebas_kata_panjang_check check (char_length(kata) = panjang),
  constraint susun_kata_bebas_panjang_check check ((panjang >= 4) AND (panjang <= 6)),
  constraint susun_kata_bebas_percobaan_check check ((percobaan >= 1) AND (percobaan <= 6)),
  constraint susun_kata_bebas_detik_check check (detik >= 0)
);
create index idx_susun_kata_bebas_created_at on susun_kata_bebas using btree (created_at DESC);
create index idx_susun_kata_bebas_klasemen on susun_kata_bebas using btree (menang, percobaan, detik, created_at);
create index idx_susun_kata_bebas_pengguna_created on susun_kata_bebas using btree (pengguna_id, created_at DESC);

create table susun_kata_skor (
  id serial primary key,
  susun_kata_id integer references susun_kata(id) on delete cascade not null,
  pengguna_id integer references pengguna(id) on delete cascade not null,
  percobaan integer not null,
  detik integer not null,
  menang boolean not null,
  created_at timestamp without time zone not null default now(),
  tebakan text not null default ''::text,
  constraint susun_kata_skor_unik_harian_user unique (susun_kata_id, pengguna_id),
  constraint susun_kata_skor_percobaan_check check ((percobaan >= 1) AND (percobaan <= 6)),
  constraint susun_kata_skor_waktu_check check (detik >= 0)
);
create index idx_susun_kata_skor_harian on susun_kata_skor using btree (susun_kata_id, menang DESC, percobaan, detik);
create index idx_susun_kata_skor_pengguna on susun_kata_skor using btree (pengguna_id, created_at DESC);
create unique index susun_kata_skor_unik_harian_user on susun_kata_skor using btree (susun_kata_id, pengguna_id);

create table tagar (
  id serial primary key,
  kode text not null,
  nama text not null,
  kategori text not null,
  deskripsi text,
  urutan integer not null default 1,
  aktif boolean not null default true,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint tagar_kode_key unique (kode),
  constraint tagar_kategori_check check (kategori = ANY (ARRAY['prefiks'::text, 'sufiks'::text, 'infiks'::text, 'klitik'::text, 'reduplikasi'::text, 'prakategorial'::text])),
  constraint tagar_kode_check check (TRIM(BOTH FROM kode) <> ''::text),
  constraint tagar_nama_check check (TRIM(BOTH FROM nama) <> ''::text)
);
create index idx_tagar_aktif on tagar using btree (aktif);
create index idx_tagar_kategori_urutan on tagar using btree (kategori, urutan);
create unique index tagar_kode_key on tagar using btree (kode);
create trigger trg_set_timestamp_fields__tagar
  before insert or update on tagar
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
  sumber_id integer references sumber(id) on delete restrict on update cascade,
  constraint tesaurus_indeks_key unique (indeks)
);
create index idx_tesaurus_indeks_lower on tesaurus using btree (lower(indeks));
create index idx_tesaurus_indeks_trgm on tesaurus using gin (indeks gin_trgm_ops);
create index idx_tesaurus_sumber_id on tesaurus using btree (sumber_id);
create unique index tesaurus_indeks_key on tesaurus using btree (indeks);
create trigger trg_set_timestamp_fields__tesaurus
  before insert or update on tesaurus
  for each row
  execute function set_timestamp_fields();

-- Schema extraction completed successfully