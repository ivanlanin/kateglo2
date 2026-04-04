# Rancangan Fitur Artikel

Tanggal: 4 April 2026

## Ringkasan

Fitur Artikel adalah sistem konten editorial Kateglo yang memungkinkan redaksi menerbitkan artikel tentang bahasa Indonesia. Konten disimpan di database PostgreSQL dan diedit lewat antarmuka WYSIWYG di area redaksi.

Kondisi implementasi mutakhir per 4 April 2026:

- Topik artikel bersifat bebas dan disimpan apa adanya di `artikel_topik`
- Judul artikel mendukung markdown italic ringan (`*italic*` atau `_italic_`) pada tampilan admin dan publik
- Slug tidak diedit manual dan tidak ditampilkan di form redaksi, tetapi saat ini di-generate otomatis dari judul saat create maupun saat judul diubah

---

## Referensi Tampilan

### Merriam-Webster Grammar

Audit halaman `https://www.merriam-webster.com/grammar` menunjukkan beberapa pola yang relevan untuk hub artikel Kateglo:

- Beranda artikel dibagi menjadi rak editorial per tema, bukan satu daftar datar panjang
- Tema/topik sangat eksplisit dan mudah dipindai, misalnya `Commonly Confused`, `Usage Notes`, `Spelling & Pronunciation`, dan `Punctuation`
- Setiap seksi memiliki heading jelas dan tautan `See All`/`See More` untuk eksplorasi lanjutan
- Kartu artikel menonjolkan judul, subjudul singkat, dan kadang thumbnail, sehingga navigasi terasa editorial, bukan sekadar arsip
- Ada seksi `Popular` di atas untuk membantu discovery cepat

Implikasi untuk Kateglo: struktur topik publik sebaiknya tetap mudah dipindai, badge topik perlu jelas, dan ke depan halaman artikel publik bisa berkembang dari grid sederhana menjadi hub editorial bertingkat.

### Dictionary.com Articles

Audit otomatis untuk `https://www.dictionary.com/articles` gagal karena halaman mengembalikan `HTTP 403` ke tool fetch pada 4 April 2026. Karena itu, dokumen ini hanya mencatat keterbatasan tersebut dan tidak menurunkan keputusan implementasi spesifik dari halaman itu.

---

## 1. Skema Database

### Slug: Strategi Otomatis Berbasis Judul

Slug saat ini dihasilkan otomatis dari judul, baik saat artikel dibuat maupun saat judul diubah melalui form redaksi. Slug tidak dapat diedit manual dari UI atau payload API; nilainya selalu diturunkan dari judul.

- Saat membuat artikel baru: slug di-generate otomatis dari judul (huruf kecil, spasi → `-`, hapus karakter non-alfanumerik, normalisasi Unicode)
- Saat judul artikel diubah: slug di-generate ulang dari judul baru
- Jika slug hasil generate sudah ada, tambahkan suffix numerik: `mengenal-kata-2`, `mengenal-kata-3`
- Slug **tidak diedit manual** — endpoint edit tidak menerima perubahan slug langsung
- Di form redaksi, slug saat ini **tidak ditampilkan**

### Tabel `artikel`

```sql
create table artikel (
  id serial primary key,
  judul text not null,
  slug text not null,
  konten text not null,             -- Markdown (dihasilkan dari WYSIWYG editor)
  penulis_id integer references pengguna(id) not null,
  penyunting_id integer references pengguna(id),
  diterbitkan boolean not null default false,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  diterbitkan_pada timestamp without time zone,
  constraint artikel_slug_key unique (slug)
);
create index idx_artikel_diterbitkan on artikel using btree (diterbitkan, diterbitkan_pada desc);
create index idx_artikel_penulis on artikel using btree (penulis_id);
create unique index artikel_slug_key on artikel using btree (slug);
create trigger trg_set_timestamp_fields__artikel
  before insert or update on artikel
  for each row
  execute function set_timestamp_fields();
```

### Topik: Tabel Junction (Multi-Topik Bebas)

Topik menggunakan pola junction table yang sama dengan `entri_tagar`, sehingga satu artikel bisa punya lebih dari satu topik. Nilai topik saat ini bersifat bebas: tidak ada tabel master, tidak ada enum lunak, dan tidak ada whitelist backend.

```sql
create table artikel_topik (
  artikel_id integer references artikel(id) on delete cascade,
  topik text not null,
  primary key (artikel_id, topik)
);
create index idx_artikel_topik_topik on artikel_topik using btree (topik);
```

**Contoh topik editorial yang dapat dipakai**

Contoh di bawah ini adalah inspirasi editorial, bukan daftar tertutup sistem:

| Nilai | Label |
|-------|-------|
| `asal kata` | Asal Kata |
| `kesalahan umum` | Kesalahan Umum |
| `penggunaan` | Penggunaan |
| `ejaan dan pelafalan` | Ejaan dan Pelafalan |
| `tanda baca` | Tanda Baca |
| `tanya jawab` | Tanya Jawab |

**Pertimbangan saat ini:** topik bebas mempercepat editorial dan menghindari bottleneck pengelolaan master data. Jika di masa mendatang topik perlu dikurasi, dinormalisasi, atau digabung, barulah tabel master `topik` terpisah layak dipertimbangkan.

### Kolom `artikel`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | serial PK | — |
| `judul` | text | Judul artikel, dapat berubah |
| `slug` | text, unique | Di-generate otomatis dari judul; saat ini ikut berubah bila judul diubah |
| `konten` | text | Isi artikel dalam format Markdown |
| `penulis_id` | FK → pengguna.id | Wajib |
| `penyunting_id` | FK → pengguna.id | Opsional; diisi saat pengguna lain menyimpan perubahan |
| `diterbitkan` | boolean | `false` = draf, `true` = terbit |
| `diterbitkan_pada` | timestamp | Waktu penerbitan |
| `created_at` / `updated_at` | timestamp | Otomatis via trigger |

---

## 2. API Routes

### Publik (`/api/publik/artikel/`)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/publik/artikel` | Daftar artikel terbit, dengan filter `?topik=` dan `?q=`, cursor pagination |
| GET | `/api/publik/artikel/:slug` | Detail satu artikel berdasarkan slug |
| GET | `/api/publik/artikel/topik` | Daftar topik beserta jumlah artikel |

Query params untuk daftar:
- `topik` — filter berdasarkan topik (backend mendukung multi-value: `?topik=asal%20kata&topik=penggunaan`)
- `q` — pencarian judul/konten
- `cursor` — cursor pagination
- `limit` — default 20

### Redaksi (`/api/redaksi/artikel/`, auth required)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/redaksi/artikel` | Daftar semua artikel (draf + terbit), dengan filter `?topik=`, `?diterbitkan=` |
| GET | `/api/redaksi/artikel/:id` | Detail satu artikel berdasarkan id |
| POST | `/api/redaksi/artikel` | Buat artikel baru |
| PUT | `/api/redaksi/artikel/:id` | Perbarui artikel; slug diturunkan ulang dari judul bila judul berubah |
| DELETE | `/api/redaksi/artikel/:id` | Hapus artikel |
| PUT | `/api/redaksi/artikel/:id/terbitkan` | Terbitkan atau tarik artikel |
| POST | `/api/redaksi/artikel/unggah-gambar` | Unggah gambar ke R2, kembalikan URL |

### Izin Redaksi

Dua izin terpisah:

| Kode Izin | Deskripsi |
|-----------|-----------|
| `tulis_artikel` | Dapat membuat draf, mengedit, dan mengunggah gambar |
| `terbitkan_artikel` | Dapat menerbitkan atau menarik artikel |

Peran `redaksi` biasa mendapat `tulis_artikel`; peran penyunting kepala / pemimpin redaksi mendapat `terbitkan_artikel`.

---

## 3. Model (Backend)

**Lokasi:** `backend/models/artikel/modelArtikel.js`

Method utama:
- `ambilDaftarPublik({ topik, q, cursor, limit })` — hanya `diterbitkan = true`, join ke `artikel_topik`
- `ambilSatuPublik(slug)` — hanya `diterbitkan = true`, join ke pengguna + topik
- `ambilDaftarRedaksi({ topik, diterbitkan, cursor, limit })` — semua status
- `ambilSatuRedaksi(id)` — semua status, join ke pengguna untuk nama penulis & penyunting
- `buat({ judul, konten, topik[], penulis_id })` — buat draf + generate slug + insert topik ke junction table
- `perbarui(id, data)` — perbarui kolom yang diberikan; jika `judul` berubah maka slug ikut di-generate ulang; jika `topik[]` disertakan, hapus lama dan insert ulang
- `terbitkan(id, terbitkan)` — toggle `diterbitkan` dan set/hapus `diterbitkan_pada`
- `hapus(id)`
- `buatSlug(judul)` — utilitas: slugify + cek keunikan + suffix numerik jika perlu

---

## 4. Frontend — Publik

### Rute

Ditambahkan ke `frontend/src/pages/publik/rutePublik.js`:

```
/artikel                    → HalamanDaftarArtikel
/artikel/:slug              → HalamanDetailArtikel
```

Filter topik publik saat ini menggunakan query string `?topik=` pada halaman daftar, bukan segmen path khusus.

### Menu Navigasi

Secara rancangan, menu "Artikel" diletakkan di bawah dropdown **"Referensi"** yang juga menampung:
- Ejaan
- Gramatika
- Makna
- Rima

Namun pada kondisi implementasi saat ini, item menu publik untuk artikel masih disembunyikan sementara. Rute `/artikel` dan `/artikel/:slug` tetap dapat diakses langsung.

### Halaman Publik

**`HalamanDaftarArtikel`**
- Header dengan judul "Artikel" dan deskripsi singkat
- Satu kartu unggulan di atas, diikuti grid kartu artikel lain
- Filter topik saat ini dibentuk dinamis dari data topik aktual di database; UI saat ini single-select di query string
- Kartu artikel menampilkan judul, topik (badge tiap topik), penulis, tanggal terbit, dan cuplikan konten (~150 karakter)
- Judul artikel mendukung markdown italic ringan pada tampilan kartu
- Cursor pagination backend tersedia; UI publik saat ini memakai muatan awal sederhana tanpa kontrol halaman eksplisit tambahan

**`HalamanDetailArtikel`**
- Judul artikel
- Meta: topik (badge), penulis, penyunting (jika ada), tanggal terbit
- Konten markdown dirender (sama dengan renderer Gramatika/Ejaan)
- Judul artikel mendukung markdown italic ringan
- Navigasi artikel sebelum/sesudah (opsional, fase berikut)

---

## 5. Frontend — Redaksi

### Struktur Menu Redaksi

Artikel dikelompokkan dalam kelompok menu **"Referensi"** di sidebar redaksi, terpisah dari kelompok Leksikon, Gim, Audit, dll.

```
Referensi
  └── Artikel
```

Kelompok ini dapat diperluas di masa mendatang untuk menampung fitur seperti Daftar Kata Tematik.

### Halaman Redaksi

**`HalamanRedaksiDaftarArtikel`**
- Tabel saat ini: terbit, judul, penulis, topik, status
- Urutan daftar: `diterbitkan_pada DESC`, lalu `updated_at DESC`
- Filter: topik, status
- Tombol: Tulis Artikel Baru, Edit, Terbitkan/Tarik, Hapus

**`HalamanRedaksiFormArtikel`** (buat & edit)
- Input: Judul, Penulis + Penyunting (satu baris), Topik, Terbit + Status (satu baris), Konten
- Topik menggunakan input chip bebas, mirip UX `SeksiTagar` di KamusAdmin tetapi tanpa master data/dropdown pilihan tetap
- Penulis wajib, penyunting opsional; autocomplete saat ini menampilkan nama saja
- Slug tidak ditampilkan di form
- Editor WYSIWYG (lihat bagian 6)
- Status artikel memakai switch `Draf` / `Terbit`; pada mode tambah artikel selalu mulai sebagai draf
- Judul di panel admin juga mendukung markdown italic ringan saat ditampilkan kembali di daftar

> **Catatan implementasi:** Daftar dan form artikel digabungkan dalam satu halaman `ArtikelAdmin.jsx` — menampilkan tabel daftar artikel di atas dan panel form di bawah (slide masuk saat tombol tambah/edit diklik). Tidak ada halaman terpisah `HalamanRedaksiDaftarArtikel` dan `HalamanRedaksiFormArtikel`.

---

## 6. Gambar — Menggunakan R2

Infrastruktur R2 sudah tersedia di `backend/services/sistem/layananLeipzigR2.js` (menggunakan `@aws-sdk/client-s3`). Ada dua bucket: `R2_BUCKET_PRIVATE` (korpus Leipzig) dan `R2_BUCKET_PUBLIC`. Gambar artikel diunggah ke **`R2_BUCKET_PUBLIC`** di prefix `artikel/gambar/`.

### Alur Unggah Gambar

1. Editor klik ikon gambar di WYSIWYG
2. Pilih file gambar di komputer
3. Frontend kirim `POST /api/redaksi/artikel/unggah-gambar` (multipart/form-data)
4. Backend validasi: tipe (jpg/png/webp), ukuran maks (~2 MB)
5. Backend unggah ke R2 public bucket, kembalikan URL publik
6. WYSIWYG sisipkan `![alt](url)` ke konten Markdown

### Layanan yang Perlu Dibuat

`backend/services/sistem/layananGambarR2.js` — terpisah dari Leipzig, menggunakan S3Client yang sama:

```javascript
async function unggahGambarArtikel(buffer, filename, mimeType)
// returns { url: 'https://...' }
```

Konfigurasi env yang sudah tersedia cukup; hanya perlu menambahkan `R2_BUCKET_PUBLIC_URL` (URL publik domain CDN R2 atau custom domain).

---

## 7. Komentar — Rombak ke Struktur Generik

> ⚠️ **Status: Ditunda tanpa batas waktu.** Rombak struktur `komentar` ke polimorfik tidak dilaksanakan bersamaan dengan fitur artikel. Tabel `komentar` tetap menggunakan skema lama (terikat ke entri via kolom `indeks`). Artikel saat ini tidak memiliki fitur komentar. Rombak ini dapat dilakukan di masa mendatang sebagai pekerjaan terpisah.

### Masalah Struktur Saat Ini

Tabel `komentar` saat ini terikat ke entri kamus via kolom `indeks text` (teks kata, bukan ID). Tidak bisa dipakai untuk artikel atau jenis konten lain.

### Skema Baru: Polimorfik

```sql
-- Hapus tabel komentar lama
drop table komentar;

-- Buat ulang dengan struktur generik
create table komentar (
  id serial primary key,
  sumber_tipe text not null,         -- 'entri' | 'artikel' (ekstensibel)
  sumber_id integer not null,        -- ID record yang dikomentari
  pengguna_id integer references pengguna(id) on delete cascade not null,
  komentar text not null,
  aktif boolean not null default false,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint komentar_check check (trim(komentar) <> ''),
  constraint komentar_sumber_pengguna_key unique (sumber_tipe, sumber_id, pengguna_id)
);
create index idx_komentar_sumber on komentar using btree (sumber_tipe, sumber_id);
create index idx_komentar_sumber_aktif on komentar using btree (sumber_tipe, sumber_id, aktif);
create index idx_komentar_pengguna_id on komentar using btree (pengguna_id);
create index idx_komentar_updated_at on komentar using btree (updated_at desc);
create unique index komentar_sumber_pengguna_key on komentar using btree (sumber_tipe, sumber_id, pengguna_id);
create trigger trg_set_timestamp_fields__komentar
  before insert or update on komentar
  for each row
  execute function set_timestamp_fields();
```

### Migrasi Data Lama

Untuk entri, `indeks` (teks) harus dikonversi ke `entri.id` (integer):

```sql
-- Buat tabel baru
create table komentar_baru ( ... );  -- seperti di atas

-- Migrasi data: join komentar lama ke entri via indeks
insert into komentar_baru (sumber_tipe, sumber_id, pengguna_id, komentar, aktif, created_at, updated_at)
select 'entri', e.id, k.pengguna_id, k.komentar, k.aktif, k.created_at, k.updated_at
from komentar k
join entri e on e.indeks = k.indeks;

-- Validasi, lalu rename
alter table komentar rename to komentar_lama;
alter table komentar_baru rename to komentar;
drop table komentar_lama;
```

### Dampak pada Kode

| Lapisan | Perubahan |
|---------|-----------|
| `modelKomentar.js` | Query baru: filter `sumber_tipe='entri'` + `sumber_id=entri.id` |
| Route publik komentar | Lookup entri.id dari indeks sebelum query |
| Route redaksi komentar | Tampilkan `sumber_tipe` + `sumber_id` di tabel |
| `KomentarAdmin.jsx` | Kolom baru, filter per sumber_tipe |

---

## 8. WYSIWYG Editor — Perbandingan

Semua kandidat menghasilkan atau mendukung output Markdown. Konten disimpan sebagai Markdown di database.

| Kriteria | **Milkdown** | **TipTap** | **Toast UI Editor** |
|----------|:---:|:---:|:---:|
| Ukuran bundle | ~90 KB | ~60 KB core | ~400 KB |
| Output Markdown | ✅ native | ⚠️ butuh plugin | ✅ native |
| Mode split (edit + preview) | ❌ | ❌ | ✅ built-in |
| Unggah gambar | ⚠️ custom | ⚠️ custom | ✅ built-in hook |
| Tabel editor visual | ✅ | ✅ | ✅ |
| TailwindCSS integration | ✅ mudah | ✅ mudah | ⚠️ perlu override CSS |
| Aktif dikembangkan | ✅ | ✅ | ⚠️ lambat |
| Dokumentasi | ✅ baik | ✅ sangat baik | ✅ baik |
| Ekosistem plugin | Terbatas | Sangat kaya | Terbatas |

**✅ Dipilih dan Diimplementasikan: TipTap + `tiptap-markdown`**

Alasannya:
- Ekosistem plugin paling lengkap: tabel visual, `@mention`, placeholder, karakter limit — semua tersedia
- Bundle core kecil, hanya import yang diperlukan
- `tiptap-markdown` (oleh aguinguerrero) menghasilkan Markdown bersih dan sudah teruji
- Unggah gambar didukung via extension `Image` dengan overridable upload handler (tinggal connect ke endpoint R2)
- Komunitas besar dan support aktif

Contoh konfigurasi:

```javascript
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';

const editor = useEditor({
  extensions: [
    StarterKit,
    Markdown,          // serialisasi ke/dari Markdown
    Image.configure({ uploadHandler: unggahGambarKeR2 }),
    Table.configure({ resizable: true }),
  ],
  content: kontenMarkdown,
});
```

---

## 9. Alur Kerja Editorial

```
Penulis menulis draf
  → Simpan draf (diterbitkan = false)
  → slug otomatis di-generate dari judul
  → Penyunting membuka & menyunting
    → penyunting_id dipilih via autocomplete pengguna redaksi aktif (atau dikosongkan)
    → jika judul berubah, slug ikut diperbarui otomatis
  → Terbitkan (diterbitkan = true, diterbitkan_pada = now())  — butuh izin terbitkan_artikel
  → Tarik artikel (diterbitkan = false, diterbitkan_pada = null)
```

---

## 10. SEO

- Setiap artikel punya URL kanonik: `/artikel/:slug`
- Meta tag: `og:title`, `og:description` (dari 150 karakter pertama konten), `og:type = article`
- Marker markdown italic pada judul dibersihkan dulu untuk metadata SEO agar `og:title` dan title halaman tetap polos
- SSR prefetch untuk halaman detail artikel (sama dengan pola yang dipakai di kamus & glosarium)
- Sitemap: tambahkan `/artikel/*` ke generator sitemap

---

## 11. Migration SQL

Simpan file terpisah:

**`docs/202604/202604041054_create-artikel.sql`** — tabel `artikel` + `artikel_topik`

~~**`docs/202604/202604041054_rombak-komentar-generik.sql`**~~ — **Tidak dibuat.** Rombak komentar ditunda; lihat catatan di bagian 7.

---

## 12. Urutan Implementasi

1. ~~**Migration SQL komentar**~~ → **DITUNDA** (lihat bagian 7)
2. ~~**Update model & route komentar**~~ → **DITUNDA**
3. ✅ **Migration SQL artikel** → `202604041054_create-artikel.sql` + `202604041231_tambah-izin-artikel.sql`
4. ✅ **Model** → `backend/models/artikel/modelArtikel.js`
5. ✅ **Layanan gambar R2** → `backend/services/sistem/layananGambarR2.js`
6. ✅ **Routes backend** → publik + redaksi (termasuk endpoint unggah gambar)
7. ✅ **Halaman redaksi** → daftar + form digabung dalam `ArtikelAdmin.jsx` (TipTap)
8. ✅ **Halaman publik** → `DaftarArtikel.jsx` + `DetailArtikel.jsx`
9. ✅ **Integrasi menu** → menu publik disembunyikan sementara; menu redaksi aktif
10. ~~**SSR prefetch**~~ → **BELUM DIIMPLEMENTASIKAN**
11. ✅ **Sitemap** → artikel terbit ditambahkan ke generator sitemap dari DB

---

## 13. Keputusan yang Sudah Ditetapkan

- **Env var `R2_BUCKET_PUBLIC_URL`** — sudah ditambahkan di `backend/.env`: `https://pub-4c17d49a59cf4cfc9656d1d4059731ee.r2.dev`
- **Moderasi komentar artikel** — mengikuti moderasi komentar kamus: komentar langsung terlihat oleh pengirim, tetapi tidak terlihat publik sebelum disetujui (`aktif = false` by default). Implementasi komentar ditunda sampai rombak struktur tabel `komentar` dilakukan (lihat bagian 7).
- **Izin menggunakan `snake_case`** — kode izin final adalah `tulis_artikel` dan `terbitkan_artikel` (bukan `artikel:tulis` / `artikel:terbitkan` seperti rancangan awal). Konsisten dengan konvensi seluruh izin di sistem.
- **Rombak komentar ditunda tanpa batas waktu** — kompleksitas migrasi data lama (`indeks` teks ke `entri.id`) diputuskan tidak dikerjakan bersamaan dengan artikel.
- **Penulis dan penyunting dipilih via autocomplete** — endpoint `GET /api/redaksi/pengguna/autocomplete` menyediakan daftar pengguna aktif dengan akses redaksi. Penulis wajib diisi; penyunting opsional.
- **Autocomplete penulis/penyunting menampilkan nama saja** — surel tidak ditampilkan di label pilihan.
- **`diterbitkan_pada` dapat diedit** — field ini dapat diubah manual dari form redaksi (input `datetime-local`).
- **Menu publik disembunyikan sementara** — item "Artikel" dihapus dari dropdown Referensi di `NavbarPublik` sampai konten siap. Rute `/artikel` tetap dapat diakses langsung.
- **SSR prefetch untuk artikel belum diimplementasikan** — halaman artikel belum menggunakan pola SSR prefetch seperti kamus dan glosarium.
- **Slug saat ini tidak imutabel** — implementasi mutakhir mengubah slug otomatis saat judul diubah.
- **Topik saat ini bebas** — tidak ada enum lunak atau master data; topik disimpan sebagai teks bebas di `artikel_topik`.
- **Judul artikel mendukung markdown italic ringan** — berlaku di daftar admin, daftar publik, detail publik, dan metadata SEO menggunakan versi tanpa markup.
