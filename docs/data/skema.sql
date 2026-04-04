-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Generated: 2026-04-04T04:31:18.972Z

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

create table artikel (
  id serial primary key,
  judul text not null,
  slug text not null,
  konten text not null default ''::text,
  penulis_id integer references pengguna(id) not null,
  penyunting_id integer references pengguna(id),
  diterbitkan boolean not null default false,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  diterbitkan_pada timestamp without time zone,
  constraint artikel_slug_key unique (slug)
);
create unique index artikel_slug_key on artikel using btree (slug);
create index idx_artikel_diterbitkan on artikel using btree (diterbitkan, diterbitkan_pada DESC);
create index idx_artikel_penulis on artikel using btree (penulis_id);
create trigger trg_set_timestamp_fields__artikel
  before insert or update on artikel
  for each row
  execute function set_timestamp_fields();

create table artikel_topik (
  artikel_id integer references artikel(id) on delete cascade,
  topik text
);
create index idx_artikel_topik_topik on artikel_topik using btree (topik);

-- Bukti penggunaan kata dari sumber nyata (kutipan + metadata)
create table atestasi (
  id serial primary key,
  kandidat_id integer references kandidat_entri(id) on delete cascade not null,
  kutipan text not null, -- Kalimat asli yang mengandung kata kandidat
  konteks_pra text, -- Kalimat sebelumnya (opsional)
  konteks_pasca text, -- Kalimat sesudahnya (opsional)
  sumber_tipe text not null, -- Jenis sumber: berita, web, media-sosial, buku, jurnal, kontribusi, ensiklopedia
  sumber_url text, -- URL sumber asli untuk atribusi
  sumber_nama text, -- Nama sumber (kode sumber_korpus atau nama manual)
  sumber_penulis text,
  tanggal_terbit date,
  crawler_id text, -- ID proses crawler yang membuat atestasi ini
  skor_konfiden numeric(3,2), -- Skor kepercayaan 0.00-1.00 dari heuristik NLP
  penulis_anonim boolean default false,
  konten_dihapus boolean default false,
  aktif boolean default true,
  created_at timestamp without time zone not null default now(),
  constraint atestasi_sumber_tipe_check check (sumber_tipe = ANY (ARRAY['berita'::text, 'web'::text, 'media-sosial'::text, 'buku'::text, 'jurnal'::text, 'kontribusi'::text, 'ensiklopedia'::text]))
);
create index idx_atestasi_kandidat on atestasi using btree (kandidat_id);
create index idx_atestasi_tanggal on atestasi using btree (tanggal_terbit DESC);

-- Antrian audit untuk indeks yang jumlah maknanya perlu ditinjau atau diperbaiki
create table audit_makna (
  id serial primary key,
  indeks text not null, -- Indeks entri yang sedang diaudit dalam bentuk ternormalisasi
  jumlah integer not null default 0, -- Jumlah makna yang terdeteksi untuk indeks terkait
  entri_id integer references entri(id) on delete set null, -- Referensi opsional ke entri yang terkait dengan audit
  makna_id integer references makna(id) on delete set null, -- Referensi opsional ke makna yang terkait dengan audit
  status text not null default 'tinjau'::text, -- Status audit: tinjau, salah, tambah, atau nama
  catatan text, -- Catatan redaksional untuk hasil audit
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

-- Master bahasa yang dipakai pada etimologi dan glosarium
create table bahasa (
  id serial primary key,
  kode text not null, -- Kode internal bahasa yang unik
  nama text not null, -- Nama bahasa untuk tampilan
  iso2 text, -- Kode ISO 639-1 jika tersedia
  iso3 text, -- Kode ISO 639-2 atau ISO 639-3 jika tersedia
  aktif boolean not null default true, -- Flag apakah bahasa aktif dipakai di aplikasi
  keterangan text, -- Keterangan tambahan tentang bahasa
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint bahasa_kode_key unique (kode),
  constraint bahasa_nama_key unique (nama)
);
create unique index bahasa_kode_key on bahasa using btree (kode);
create unique index bahasa_nama_key on bahasa using btree (nama);
create trigger trg_set_timestamp_fields__bahasa
  before insert or update on bahasa
  for each row
  execute function set_timestamp_fields();

-- Master bidang keilmuan atau kategori topik
create table bidang (
  id serial primary key,
  kode text not null, -- Kode bidang yang unik
  nama text not null, -- Nama bidang untuk tampilan
  kamus boolean not null default true, -- Flag apakah bidang dapat dipakai pada data kamus
  keterangan text, -- Keterangan tambahan tentang bidang
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  glosarium boolean not null default true, -- Flag apakah bidang dapat dipakai pada data glosarium
  constraint bidang_kode_key unique (kode),
  constraint bidang_nama_key unique (nama)
);
create unique index bidang_kode_key on bidang using btree (kode);
create unique index bidang_nama_key on bidang using btree (nama);
create trigger trg_set_timestamp_fields__bidang
  before insert or update on bidang
  for each row
  execute function set_timestamp_fields();

-- Contoh pemakaian untuk satu makna
create table contoh (
  id serial primary key,
  legacy_cid integer, -- ID contoh dari basis data lama jika berasal dari migrasi
  makna_id integer references makna(id) on delete cascade not null, -- Referensi ke makna yang memiliki contoh ini
  urutan integer not null default 1, -- Urutan tampilan contoh dalam satu makna
  contoh text not null, -- Teks contoh pemakaian
  makna_contoh text, -- Penjelasan singkat atau arti dari contoh pemakaian
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  aktif boolean not null default true, -- Flag apakah contoh ditampilkan sebagai data aktif
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

-- Entri utama kamus, termasuk kata dasar, turunan, gabungan, dan entri rujukan
create table entri (
  id serial primary key,
  legacy_eid integer, -- ID entri dari basis data lama jika berasal dari migrasi
  entri text not null, -- Bentuk entri sebagaimana ditampilkan ke pengguna
  jenis text not null, -- Jenis entri untuk klasifikasi data dan tampilan
  induk integer references entri(id) on delete set null, -- Referensi ke entri induk dalam hierarki turunan atau gabungan
  pemenggalan text, -- Pemenggalan suku kata untuk entri
  lafal text, -- Representasi lafal atau pelafalan entri
  varian text, -- Varian ejaan atau bentuk lain dari entri
  jenis_rujuk text, -- Penanda jenis rujukan, misalnya simbol atau label rujuk
  lema_rujuk text, -- Teks lema rujukan sebagaimana tersimpan dari sumber lama atau impor
  aktif integer not null default 1, -- Status aktif entri dengan konvensi 1 aktif dan 0 nonaktif
  legacy_tabel text, -- Nama tabel sumber lama tempat entri berasal
  legacy_tid integer, -- ID baris sumber lama pada tabel asal
  indeks text not null, -- Kunci indeks ternormalisasi untuk pencarian dan pengelompokan entri
  homonim integer, -- Nomor urut homonim dalam kelompok indeks yang sama
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  homograf integer, -- Nomor pengelompokan homograf untuk membedakan entri dengan ejaan sama
  entri_rujuk integer, -- Referensi ke entri tujuan rujukan
  sumber_id integer references sumber(id) on delete restrict on update cascade, -- Referensi ke sumber utama entri
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
create index idx_entri_lower_indeks_detail_aktif on entri using btree (lower(indeks), homograf, homonim, entri, id) WHERE ((aktif = 1) AND (indeks <> ''::text));
create index idx_entri_lower_indeks_label_aktif on entri using btree (lower(indeks), indeks) WHERE ((aktif = 1) AND (indeks <> ''::text));
create index idx_entri_serupa_norm_aktif on entri using btree (lower(regexp_replace(replace(entri, '-'::text, ''::text), '\s*\([0-9]+\)\s*$'::text, ''::text))) WHERE (aktif = 1);
create index idx_entri_sumber_id on entri using btree (sumber_id);
create index idx_entri_trgm on entri using gin (entri gin_trgm_ops);
create trigger trg_set_timestamp_fields__entri
  before insert or update on entri
  for each row
  execute function set_timestamp_fields();

-- Tabel penghubung many-to-many antara entri dan tagar morfologis
create table entri_tagar (
  entri_id integer references entri(id) on delete cascade, -- Referensi ke entri yang diberi tagar
  tagar_id integer references tagar(id) on delete cascade, -- Referensi ke tagar yang ditempelkan pada entri
  created_at timestamp without time zone not null default now()
);
create index idx_entri_tagar_entri_id on entri_tagar using btree (entri_id);
create index idx_entri_tagar_tagar_id on entri_tagar using btree (tagar_id);

-- Data etimologi untuk entri kamus, termasuk asal kata dan sitasi sumber
create table etimologi (
  id serial primary key,
  indeks text not null, -- Indeks entri yang dipakai untuk pencocokan etimologi
  entri_id integer references entri(id) on delete set null, -- Referensi opsional ke entri yang dipasangi etimologi
  homonim integer, -- Nomor homonim untuk membantu pencocokan dengan entri
  lafal text, -- Lafal yang terkait dengan data etimologi bila tersedia
  sumber_sitasi text, -- Sitasi singkat sumber etimologi
  sumber_isi text, -- Isi atau kutipan sumber etimologi
  sumber_aksara text, -- Bentuk aksara asal dari bahasa sumber
  sumber_lihat text, -- Rujukan lihat dari sumber etimologi
  sumber_varian text, -- Varian bentuk yang disebut di sumber etimologi
  sumber_definisi text, -- Definisi atau glosa dari sumber etimologi
  lwim_ref text, -- Referensi atau penanda entri asal pada sumber LWIM
  aktif boolean not null default false, -- Flag apakah data etimologi siap ditampilkan
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null,
  kata_asal text, -- Bentuk kata asal yang direkonstruksi atau dikutip dari sumber
  arti_asal text, -- Arti atau glosa dari kata asal
  sumber_id integer references sumber(id) on delete restrict on update cascade, -- Referensi ke sumber utama etimologi
  meragukan boolean not null default false, -- Flag apakah etimologi masih meragukan dan perlu tinjauan
  bahasa_id integer references bahasa(id) on delete set null on update cascade, -- Referensi ke bahasa asal kata
  constraint etimologi_indeks_check check (TRIM(BOTH FROM indeks) <> ''::text)
);
create index idx_etimologi_aktif on etimologi using btree (aktif);
create index idx_etimologi_bahasa_id on etimologi using btree (bahasa_id);
create index idx_etimologi_created_at on etimologi using btree (created_at DESC);
create index idx_etimologi_entri_id on etimologi using btree (entri_id);
create index idx_etimologi_indeks on etimologi using btree (indeks);
create index idx_etimologi_indeks_homonim on etimologi using btree (indeks, homonim);
create index idx_etimologi_lafal on etimologi using btree (lafal);
create index idx_etimologi_lwim_ref on etimologi using btree (lwim_ref);
create index idx_etimologi_meragukan on etimologi using btree (meragukan);
create index idx_etimologi_sumber_id on etimologi using btree (sumber_id);

-- Cache atau hasil ekstraksi mentah etimologi dari sumber LWIM
create table etimologi_lwim (
  lwim_id text, -- ID entri pada sumber LWIM bila tersedia
  indeks_query text not null, -- Indeks yang dipakai saat melakukan kueri ke LWIM
  lwim_orth text not null, -- Bentuk ortografis entri pada LWIM
  lwim_hom integer, -- Nomor homonim pada sumber LWIM
  etym_lang text, -- Bahasa asal menurut LWIM
  etym_mentioned text, -- Bentuk kata asal yang disebut oleh LWIM
  etym_cite text, -- Sitasi atau rujukan sumber dari LWIM
  etym_aksara text, -- Bentuk aksara asal menurut LWIM
  raw_def text, -- Definisi mentah yang diambil dari LWIM
  xr_lihat text, -- Rujukan lihat mentah dari LWIM
  xr_varian text, -- Rujukan varian mentah dari LWIM
  fetched_at timestamp without time zone not null default now() -- Waktu data LWIM diambil
);
create index idx_etimologi_lwim_indeks on etimologi_lwim using btree (indeks_query);
create index idx_etimologi_lwim_orth on etimologi_lwim using btree (lwim_orth);

-- Istilah glosarium bilingual yang menghubungkan istilah Indonesia dan istilah asing
create table glosarium (
  id serial primary key,
  indonesia text not null, -- Istilah atau padanan dalam bahasa Indonesia
  asing text not null, -- Istilah padanan dalam bahasa asing
  wpid text, -- ID halaman Wikipedia bahasa Indonesia jika tersedia
  wpen text, -- ID halaman Wikipedia bahasa Inggris jika tersedia
  updated timestamp without time zone, -- Waktu pembaruan data asal glosarium
  updater text not null, -- Identitas pembaru terakhir pada data asal
  wikipedia_updated timestamp without time zone, -- Waktu sinkronisasi metadata Wikipedia
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  aktif boolean not null default true, -- Flag apakah istilah glosarium aktif ditampilkan
  bidang_id integer references bidang(id) on delete restrict on update cascade not null, -- Referensi ke bidang keilmuan glosarium
  sumber_id integer references sumber(id) on delete restrict on update cascade not null, -- Referensi ke sumber glosarium
  bahasa_id integer references bahasa(id) on delete restrict on update cascade not null -- Referensi ke bahasa asing pada istilah glosarium
);
create index idx_glosarium_aktif_bahasa_id_indonesia on glosarium using btree (bahasa_id, indonesia) WHERE (aktif = true);
create index idx_glosarium_aktif_bidang_id_asing on glosarium using btree (bidang_id, asing) WHERE (aktif = true);
create index idx_glosarium_aktif_sumber_id_asing on glosarium using btree (sumber_id, asing) WHERE (aktif = true);
create index idx_glosarium_asing on glosarium using btree (asing);
create index idx_glosarium_asing_trgm on glosarium using gin (asing gin_trgm_ops);
create index idx_glosarium_bahasa_id on glosarium using btree (bahasa_id);
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

-- Master izin akses granular untuk fitur administrasi atau redaksi
create table izin (
  id serial primary key,
  kode text not null, -- Kode izin yang unik dan dipakai di aplikasi
  nama text not null, -- Nama izin untuk tampilan admin
  kelompok text, -- Kelompok modul atau area yang menaungi izin
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint izin_kode_key unique (kode)
);
create unique index izin_kode_key on izin using btree (kode);
create trigger trg_set_timestamp_fields__izin
  before insert or update on izin
  for each row
  execute function set_timestamp_fields();

-- Staging area untuk kandidat kata baru yang menunggu kurasi redaksi
create table kandidat_entri (
  id serial primary key,
  kata text not null, -- Bentuk kata asli
  indeks text not null, -- Bentuk ternormalisasi (lowercase, trim) untuk dedup
  jenis text, -- Jenis kandidat: kata-dasar, kata-majemuk, frasa, singkatan, serapan
  kelas_kata text,
  definisi_awal text,
  ragam text,
  bahasa_campur text,
  status text not null default 'menunggu'::text, -- Status kurasi: menunggu, ditinjau, disetujui, ditolak, tunda
  catatan_redaksi text,
  entri_id integer references entri(id), -- Referensi ke entri kamus jika sudah dimigrasi
  kontributor_id integer references pengguna(id),
  sumber_scraper text, -- Kode sumber asal kandidat (referensi ke sumber_korpus.kode)
  prioritas smallint default 0, -- 0=normal, 1=tinggi, 2=segera
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint kandidat_jenis_check check ((jenis IS NULL) OR (jenis = ANY (ARRAY['kata-dasar'::text, 'kata-majemuk'::text, 'frasa'::text, 'singkatan'::text, 'serapan'::text]))),
  constraint kandidat_kata_check check (TRIM(BOTH FROM kata) <> ''::text),
  constraint kandidat_status_check check (status = ANY (ARRAY['menunggu'::text, 'ditinjau'::text, 'disetujui'::text, 'ditolak'::text, 'tunda'::text]))
);
create index idx_kandidat_created on kandidat_entri using btree (created_at DESC);
create unique index idx_kandidat_indeks_uq on kandidat_entri using btree (indeks);
create index idx_kandidat_prioritas on kandidat_entri using btree (prioritas DESC, created_at DESC);
create index idx_kandidat_status on kandidat_entri using btree (status);
create trigger trg_set_timestamp_fields__kandidat_entri
  before insert or update on kandidat_entri
  for each row
  execute function set_timestamp_fields();

create table kata_hari_ini (
  id serial primary key,
  tanggal date not null,
  entri_id integer references entri(id) on delete restrict on update cascade not null,
  sumber text not null default 'auto'::text,
  catatan text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint kata_hari_ini_entri_id_key unique (entri_id),
  constraint kata_hari_ini_tanggal_key unique (tanggal),
  constraint kata_hari_ini_sumber_check check (sumber = ANY (ARRAY['auto'::text, 'admin'::text]))
);
create index idx_kata_hari_ini_sumber_tanggal on kata_hari_ini using btree (sumber, tanggal DESC);
create unique index kata_hari_ini_entri_id_key on kata_hari_ini using btree (entri_id);
create unique index kata_hari_ini_tanggal_key on kata_hari_ini using btree (tanggal);
create trigger trg_set_timestamp_fields__kata_hari_ini
  before insert or update on kata_hari_ini
  for each row
  execute function set_timestamp_fields();

-- Komentar pengguna terhadap suatu indeks entri
create table komentar (
  id serial primary key,
  indeks text not null, -- Indeks entri yang dikomentari
  pengguna_id integer references pengguna(id) on delete cascade not null, -- Referensi ke pengguna yang membuat komentar
  komentar text not null, -- Isi komentar pengguna
  aktif boolean not null default false, -- Flag moderasi apakah komentar ditampilkan
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

create table kuis_kata (
  id serial primary key,
  pengguna_id integer references pengguna(id) on delete cascade not null,
  tanggal date not null default ((now() AT TIME ZONE 'Asia/Jakarta'::text))::date,
  jumlah_benar integer not null default 0,
  jumlah_pertanyaan integer not null default 0,
  durasi_detik integer not null default 0,
  jumlah_main integer not null default 0,
  constraint kuis_kata_pengguna_tanggal_key unique (pengguna_id, tanggal),
  constraint kuis_kata_jumlah_benar_check check (jumlah_benar >= 0),
  constraint kuis_kata_jumlah_main_check check (jumlah_main >= 0),
  constraint kuis_kata_jumlah_pertanyaan_check check (jumlah_pertanyaan >= 0),
  constraint kuis_kata_durasi_detik_check check (durasi_detik >= 0)
);
create index idx_kuis_kata_klasemen_harian on kuis_kata using btree (tanggal DESC, jumlah_benar DESC, durasi_detik, jumlah_main DESC);
create index idx_kuis_kata_pengguna_tanggal on kuis_kata using btree (pengguna_id, tanggal DESC);
create index idx_kuis_kata_tanggal on kuis_kata using btree (tanggal DESC);
create unique index kuis_kata_pengguna_tanggal_key on kuis_kata using btree (pengguna_id, tanggal);

-- Master label umum untuk ragam, kelas kata, bahasa, bidang, dan kategori sejenis
create table label (
  id serial primary key,
  kategori text not null, -- Kategori label, misalnya ragam, kelas_kata, bahasa, atau bidang
  kode text not null, -- Kode label yang unik dalam satu kategori
  nama text not null, -- Nama label untuk tampilan
  keterangan text, -- Keterangan tambahan tentang label
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  urutan integer not null default 1, -- Urutan prioritas atau posisi label dalam daftar
  aktif boolean not null default true, -- Flag apakah label aktif dipakai
  constraint label_kategori_kode_key unique (kategori, kode)
);
create index idx_label_kategori_nama on label using btree (kategori, nama);
create unique index label_kategori_kode_key on label using btree (kategori, kode);
create trigger trg_set_timestamp_fields__label
  before insert or update on label
  for each row
  execute function set_timestamp_fields();

-- Definisi atau polisem untuk satu entri kamus
create table makna (
  id serial primary key,
  legacy_mid integer, -- ID makna dari basis data lama jika berasal dari migrasi
  entri_id integer references entri(id) on delete cascade not null, -- Referensi ke entri yang memiliki makna ini
  polisem integer not null default 1, -- Nomor urut makna dalam satu entri
  makna text not null, -- Teks definisi utama
  ragam text, -- Label ragam bahasa yang melekat pada makna
  ragam_varian text, -- Kode varian ringkas untuk ragam tertentu
  kelas_kata text, -- Label kelas kata untuk makna
  bahasa text, -- Label bahasa yang terkait dengan makna
  bidang text, -- Label bidang keilmuan yang terkait dengan makna
  kiasan boolean not null default false, -- Flag apakah makna bersifat kiasan
  penyingkatan text, -- Jenis penyingkatan, misalnya akronim, kependekan, atau singkatan
  ilmiah text, -- Padanan atau nama ilmiah yang terkait dengan makna
  kimia text, -- Padanan atau rumus kimia yang terkait dengan makna
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  aktif boolean not null default true, -- Flag apakah makna aktif ditampilkan
  constraint makna_legacy_mid_key unique (legacy_mid),
  constraint makna_makna_check check (TRIM(BOTH FROM makna) <> ''::text),
  constraint makna_penyingkatan_check check ((penyingkatan IS NULL) OR (penyingkatan = ANY (ARRAY['akr'::text, 'kp'::text, 'sing'::text]))),
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

-- Tabel induk statistik pencarian harian lintas domain publik
create table pencarian (
  tanggal date not null, -- Tanggal pencarian dalam zona waktu aplikasi
  kata text not null, -- Kata atau frasa pencarian yang sudah dinormalisasi
  jumlah integer not null default 0, -- Akumulasi jumlah pencarian untuk kombinasi tanggal, domain, dan kata
  domain smallint not null default 1, -- Kode domain pencarian: 1 kamus, 2 tesaurus, 3 glosarium, 4 makna, 5 rima
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

create table pencarian_202604 (
  tanggal date not null,
  kata text not null,
  jumlah integer not null default 0,
  domain smallint not null default 1,
  created_at timestamp without time zone not null default (now() AT TIME ZONE 'UTC'::text),
  updated_at timestamp without time zone not null default (now() AT TIME ZONE 'UTC'::text),
  constraint pencarian_202604_domain_check check (domain = ANY (ARRAY[1, 2, 3, 4, 5])),
  constraint pencarian_202604_tanggal_check check ((tanggal >= '2026-04-01'::date) AND (tanggal < '2026-05-01'::date)),
  constraint pencarian_domain_check check (domain = ANY (ARRAY[1, 2, 3, 4, 5])),
  constraint pencarian_jumlah_check check (jumlah >= 0)
);
create unique index pencarian_202604_tanggal_domain_kata_key on pencarian_202604 using btree (tanggal, domain, kata);

-- Daftar kata yang dikecualikan dari pencatatan statistik pencarian
create table pencarian_hitam (
  id serial primary key,
  kata text not null, -- Kata ternormalisasi huruf kecil yang diblok dari statistik
  aktif boolean not null default true, -- Flag apakah aturan daftar hitam masih berlaku
  catatan text, -- Catatan alasan pemblokiran kata dari statistik
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

-- Akun pengguna yang terautentikasi untuk fitur komunitas dan administrasi
create table pengguna (
  id serial primary key,
  google_id text not null, -- Identifier unik pengguna dari Google OAuth
  surel text not null, -- Alamat surel pengguna
  nama text not null, -- Nama tampilan pengguna
  foto text, -- URL foto profil pengguna
  peran_id integer references peran(id) not null default 1, -- Referensi ke peran pengguna
  aktif integer not null default 1, -- Status aktif akun dengan konvensi 1 aktif dan 0 nonaktif
  login_terakhir timestamp without time zone, -- Waktu login terakhir pengguna
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

-- Master peran pengguna untuk sistem otorisasi
create table peran (
  id serial primary key,
  kode text not null, -- Kode peran yang unik
  nama text not null, -- Nama peran untuk tampilan
  keterangan text, -- Keterangan tambahan tentang peran
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  akses_redaksi boolean not null default false, -- Flag apakah peran dapat mengakses area redaksi atau admin
  constraint peran_kode_key unique (kode)
);
create unique index peran_kode_key on peran using btree (kode);
create trigger trg_set_timestamp_fields__peran
  before insert or update on peran
  for each row
  execute function set_timestamp_fields();

-- Relasi many-to-many antara peran dan izin
create table peran_izin (
  peran_id integer references peran(id) on delete cascade, -- Referensi ke peran
  izin_id integer references izin(id) on delete cascade, -- Referensi ke izin
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);
create trigger trg_set_timestamp_fields__peran_izin
  before insert or update on peran_izin
  for each row
  execute function set_timestamp_fields();

create table relasi_sinset (
  id serial primary key,
  sinset_asal text references sinset(id) on delete cascade not null,
  sinset_tujuan text references sinset(id) on delete cascade not null,
  tipe_relasi text references tipe_relasi(kode) not null,
  sumber text not null default 'wn30'::text,
  created_at timestamp without time zone not null default now(),
  constraint relasi_sinset_unik unique (sinset_asal, sinset_tujuan, tipe_relasi)
);
create index idx_relasi_sinset_asal on relasi_sinset using btree (sinset_asal);
create index idx_relasi_sinset_tipe on relasi_sinset using btree (tipe_relasi);
create index idx_relasi_sinset_tujuan on relasi_sinset using btree (sinset_tujuan);
create unique index relasi_sinset_unik on relasi_sinset using btree (sinset_asal, sinset_tujuan, tipe_relasi);

-- Audit trail untuk setiap aksi redaksi terhadap kandidat kata
create table riwayat_kurasi (
  id serial primary key,
  kandidat_id integer references kandidat_entri(id) on delete cascade not null,
  redaktur_id integer references pengguna(id) not null,
  aksi text not null, -- Jenis aksi: tinjau, setujui, tolak, tunda, edit
  status_lama text,
  status_baru text,
  catatan text,
  perubahan jsonb, -- Diff field yang diubah (format JSON)
  created_at timestamp without time zone not null default now()
);
create index idx_riwayat_created on riwayat_kurasi using btree (created_at DESC);
create index idx_riwayat_kandidat on riwayat_kurasi using btree (kandidat_id);
create index idx_riwayat_redaktur on riwayat_kurasi using btree (redaktur_id);

create table sinset (
  id text,
  kelas_kata text not null,
  ili_id text,
  oewn_id text,
  lema_en ARRAY,
  definisi_en text,
  contoh_en ARRAY,
  definisi_id text,
  contoh_id ARRAY,
  status text not null default 'draf'::text,
  sumber text not null default 'wn30'::text,
  catatan text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint sinset_kelas_kata_check check (kelas_kata = ANY (ARRAY['n'::text, 'v'::text, 'a'::text, 'r'::text])),
  constraint sinset_status_check check (status = ANY (ARRAY['draf'::text, 'tinjau'::text, 'terverifikasi'::text]))
);
create index idx_sinset_ili on sinset using btree (ili_id) WHERE (ili_id IS NOT NULL);
create index idx_sinset_kelas_kata on sinset using btree (kelas_kata);
create index idx_sinset_status on sinset using btree (status);
create trigger trg_set_timestamp_fields__sinset
  before insert or update on sinset
  for each row
  execute function set_timestamp_fields();

create table sinset_lema (
  id serial primary key,
  sinset_id text references sinset(id) on delete cascade not null,
  lema text not null,
  entri_id integer references entri(id) on delete set null,
  makna_id integer references makna(id) on delete set null,
  urutan smallint not null default 0,
  terverifikasi boolean not null default false,
  sumber text not null default 'wordnetid'::text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint sinset_lema_unik unique (sinset_id, lema)
);
create index idx_sinset_lema_entri on sinset_lema using btree (entri_id) WHERE (entri_id IS NOT NULL);
create index idx_sinset_lema_lema on sinset_lema using btree (lower(lema));
create index idx_sinset_lema_makna on sinset_lema using btree (makna_id) WHERE (makna_id IS NOT NULL);
create index idx_sinset_lema_sinset on sinset_lema using btree (sinset_id);
create index idx_sinset_lema_verifikasi on sinset_lema using btree (terverifikasi, sinset_id);
create unique index sinset_lema_unik on sinset_lema using btree (sinset_id, lema);
create trigger trg_set_timestamp_fields__sinset_lema
  before insert or update on sinset_lema
  for each row
  execute function set_timestamp_fields();

-- Master sumber data untuk kamus, glosarium, tesaurus, dan etimologi
create table sumber (
  id serial primary key,
  kode text not null, -- Kode sumber yang unik
  nama text not null, -- Nama sumber untuk tampilan
  glosarium boolean not null default true, -- Flag apakah sumber dipakai untuk glosarium
  keterangan text, -- Keterangan tambahan tentang sumber
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  kamus boolean not null default false, -- Flag apakah sumber dipakai untuk kamus
  tesaurus boolean not null default false, -- Flag apakah sumber dipakai untuk tesaurus
  etimologi boolean not null default false, -- Flag apakah sumber dipakai untuk etimologi
  constraint sumber_nama_key unique (nama),
  constraint sumber_kode_key unique (kode)
);
create unique index sumber_kode_key on sumber using btree (kode);
create unique index sumber_nama_key on sumber using btree (nama);
create trigger trg_set_timestamp_fields__sumber
  before insert or update on sumber
  for each row
  execute function set_timestamp_fields();

-- Registri sumber data untuk korpus KADI
create table sumber_korpus (
  id serial primary key,
  kode text not null, -- Kode unik sumber, misal wikipedia-id-pilihan
  nama text not null,
  tipe text not null, -- Jenis sumber: rss, api, scrape, upload, manual, ensiklopedia
  genre text, -- Genre korpus sesuai taksonomi KADI
  subgenre text,
  url_dasar text,
  bahasa text default 'id'::text,
  aktif boolean default true,
  config jsonb, -- Konfigurasi teknis sumber (rate_limit, selectors, auth)
  terakhir_crawl timestamp without time zone, -- Waktu terakhir sumber ini di-crawl
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint sumber_korpus_kode_key unique (kode),
  constraint sumber_korpus_tipe_check check (tipe = ANY (ARRAY['rss'::text, 'api'::text, 'scrape'::text, 'upload'::text, 'manual'::text, 'ensiklopedia'::text])),
  constraint sumber_korpus_genre_check check ((genre IS NULL) OR (genre = ANY (ARRAY['jurnalistik'::text, 'percakapan-digital'::text, 'sastra'::text, 'akademik'::text, 'hukum'::text, 'ensiklopedik'::text, 'lisan'::text, 'bisnis'::text, 'umum'::text])))
);
create unique index sumber_korpus_kode_key on sumber_korpus using btree (kode);
create trigger trg_set_timestamp_fields__sumber_korpus
  before insert or update on sumber_korpus
  for each row
  execute function set_timestamp_fields();

-- Bank soal harian untuk gim susun kata
create table susun_kata (
  id serial primary key,
  tanggal date not null, -- Tanggal soal harian berlaku
  panjang integer not null, -- Panjang kata target dalam huruf
  kata text not null, -- Jawaban kata target huruf kecil
  keterangan text, -- Catatan internal untuk soal
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint susun_kata_kata_key unique (kata),
  constraint susun_kata_tanggal_panjang_key unique (tanggal, panjang),
  constraint susun_kata_kata_panjang_check check (char_length(kata) = panjang),
  constraint susun_kata_panjang_check check ((panjang >= 4) AND (panjang <= 8)),
  constraint susun_kata_kata_check check (kata ~ '^[a-z]+$'::text)
);
create index idx_susun_kata_panjang_tanggal on susun_kata using btree (panjang, tanggal DESC);
create index idx_susun_kata_tanggal on susun_kata using btree (tanggal DESC);
create unique index susun_kata_kata_key on susun_kata using btree (kata);
create unique index susun_kata_tanggal_panjang_key on susun_kata using btree (tanggal, panjang);
create trigger trg_set_timestamp_fields__susun_kata
  before insert or update on susun_kata
  for each row
  execute function set_timestamp_fields();

-- Riwayat permainan mode bebas per pengguna
create table susun_kata_bebas (
  id serial primary key,
  tanggal date not null default ((now() AT TIME ZONE 'Asia/Jakarta'::text))::date, -- Tanggal permainan dicatat
  panjang integer not null, -- Panjang kata target pada mode bebas
  kata text not null, -- Kata target huruf kecil
  pengguna_id integer references pengguna(id) on delete cascade not null, -- Referensi ke pengguna yang bermain
  percobaan integer not null, -- Jumlah percobaan yang dipakai sampai permainan selesai
  tebakan text not null default ''::text, -- Rangkaian tebakan yang disimpan untuk kebutuhan replay atau audit
  detik integer not null, -- Durasi bermain dalam detik
  menang boolean not null, -- Flag apakah permainan berakhir menang
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

-- Skor harian gim susun kata per pengguna
create table susun_kata_skor (
  id serial primary key,
  susun_kata_id integer references susun_kata(id) on delete cascade not null, -- Referensi ke soal harian
  pengguna_id integer references pengguna(id) on delete cascade not null, -- Referensi ke pengguna yang mengerjakan soal harian
  percobaan integer not null, -- Jumlah percobaan yang dipakai
  detik integer not null, -- Durasi penyelesaian dalam detik
  menang boolean not null, -- Flag apakah pemain berhasil menyelesaikan soal
  created_at timestamp without time zone not null default now(),
  tebakan text not null default ''::text, -- Rangkaian tebakan yang disimpan untuk audit permainan
  selesai boolean not null default true, -- Flag apakah sesi harian sudah ditandai selesai
  mulai_at timestamp without time zone not null default now(), -- Waktu mulai sesi permainan harian
  updated_at timestamp without time zone not null default now(),
  constraint susun_kata_skor_unik_harian_user unique (susun_kata_id, pengguna_id),
  constraint susun_kata_skor_percobaan_check check ((percobaan >= 1) AND (percobaan <= 6)),
  constraint susun_kata_skor_waktu_check check (detik >= 0)
);
create index idx_susun_kata_skor_harian on susun_kata_skor using btree (susun_kata_id, menang DESC, percobaan, detik);
create index idx_susun_kata_skor_pengguna on susun_kata_skor using btree (pengguna_id, created_at DESC);
create index idx_susun_kata_skor_selesai on susun_kata_skor using btree (susun_kata_id, pengguna_id, selesai);
create unique index susun_kata_skor_unik_harian_user on susun_kata_skor using btree (susun_kata_id, pengguna_id);

-- Master tagar morfologis yang dapat ditempelkan pada entri kamus
create table tagar (
  id serial primary key,
  kode text not null, -- Kode tagar unik yang aman dipakai sebagai identifier
  nama text not null, -- Nama tampilan tagar, misalnya dengan tanda hubung morfologis
  kategori text not null, -- Kategori tagar, misalnya prefiks, sufiks, infiks, konfiks, atau klitik
  deskripsi text, -- Deskripsi singkat fungsi atau penggunaan tagar
  urutan integer not null default 1, -- Urutan tampilan tagar dalam kategorinya
  aktif boolean not null default true, -- Flag apakah tagar aktif dipakai
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint tagar_kode_key unique (kode),
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

-- Data relasi sinonim dan antonim untuk satu indeks
create table tesaurus (
  id serial primary key,
  indeks text not null, -- Indeks entri yang menjadi kepala data tesaurus
  sinonim text, -- Daftar sinonim dalam format teks sesuai sumber
  antonim text, -- Daftar antonim dalam format teks sesuai sumber
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  aktif boolean not null default true, -- Flag apakah data tesaurus aktif ditampilkan
  sumber_id integer references sumber(id) on delete restrict on update cascade, -- Referensi ke sumber data tesaurus
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

create table tipe_relasi (
  kode text,
  nama text not null,
  nama_publik text not null,
  kategori text not null,
  kebalikan text references tipe_relasi(kode),
  simetris boolean not null default false,
  urutan smallint not null default 0,
  constraint tipe_relasi_kategori_check check (kategori = ANY (ARRAY['hierarki'::text, 'leksikal'::text, 'morfologi'::text, 'verba'::text, 'domain'::text]))
);

-- Schema extraction completed successfully