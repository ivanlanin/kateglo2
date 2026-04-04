# Rancangan Fitur Artikel

Tanggal: 4 April 2026

## Ringkasan

Fitur Artikel adalah sistem konten editorial Kateglo yang memungkinkan redaksi menerbitkan artikel tentang bahasa Indonesia — tanya jawab, asal kata, kesalahan umum, kata baru, dan topik lain. Konten disimpan di database PostgreSQL dan diedit lewat antarmuka WYSIWYG di area redaksi.

---

## 1. Skema Database

### Slug: Strategi Imutabel

Slug dibuat **sekali saat artikel pertama kali dibuat** dari judul, lalu tidak pernah berubah meski judul diedit. Ini adalah pola standar di Ghost, WordPress, dan hampir semua CMS modern — memastikan tautan tidak pernah putus.

- Saat membuat artikel baru: slug di-generate otomatis dari judul (huruf kecil, spasi → `-`, hapus karakter non-alfanumerik, normalisasi Unicode)
- Jika slug hasil generate sudah ada, tambahkan suffix numerik: `mengenal-kata-2`, `mengenal-kata-3`
- Setelah tersimpan pertama kali, slug **tidak dapat diubah** — kolom ini read-only di endpoint edit
- Di form redaksi, slug ditampilkan sebagai informasi saja (tidak bisa diedit)

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

### Topik: Tabel Junction (Multi-Topik)

Topik menggunakan pola junction table yang sama dengan `entri_tagar`, sehingga satu artikel bisa punya lebih dari satu topik. Daftar nilai topik bersifat enum lunak — didefinisikan di kode, bukan tabel master terpisah.

```sql
create table artikel_topik (
  artikel_id integer references artikel(id) on delete cascade,
  topik text not null,              -- 'tanya-jawab' | 'asal-kata' | 'kata-baru' | 'kesalahan-umum' | 'lainnya'
  primary key (artikel_id, topik)
);
create index idx_artikel_topik_topik on artikel_topik using btree (topik);
```

**Daftar nilai topik:**

| Nilai | Label |
|-------|-------|
| `tanya-jawab` | Tanya Jawab |
| `asal-kata` | Asal Kata |
| `kata-baru` | Kata Baru |
| `kesalahan-umum` | Kesalahan Umum |
| `lainnya` | Lainnya |

**Pertimbangan: mengapa tidak tabel master `topik` tersendiri?** Karena daftar topik stabil dan dikendalikan redaksi kode — menambah topik baru cukup dengan update enum di kode dan dokumentasi. Jika di masa mendatang topik perlu dikelola via UI redaksi (tambah/rename), baru buat tabel `topik` master dan migrasi.

### Kolom `artikel`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | serial PK | — |
| `judul` | text | Judul artikel, dapat berubah |
| `slug` | text, unique | Di-generate saat dibuat, **imutabel** setelahnya |
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
- `topik` — filter berdasarkan topik (bisa multi-value: `?topik=tanya-jawab&topik=asal-kata`)
- `q` — pencarian judul/konten
- `cursor` — cursor pagination
- `limit` — default 20

### Redaksi (`/api/redaksi/artikel/`, auth required)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/redaksi/artikel` | Daftar semua artikel (draf + terbit), dengan filter `?topik=`, `?diterbitkan=` |
| GET | `/api/redaksi/artikel/:id` | Detail satu artikel berdasarkan id |
| POST | `/api/redaksi/artikel` | Buat artikel baru |
| PUT | `/api/redaksi/artikel/:id` | Perbarui artikel (slug tidak dapat diubah) |
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
- `buat({ judul, slug, konten, topik[], penulis_id })` — buat draf + insert topik ke junction table
- `perbarui(id, data)` — perbarui kolom yang diberikan; jika `topik[]` disertakan, hapus lama dan insert ulang
- `terbitkan(id, terbitkan)` — toggle `diterbitkan` dan set/hapus `diterbitkan_pada`
- `hapus(id)`
- `buatSlug(judul)` — utilitas: slugify + cek keunikan + suffix numerik jika perlu

---

## 4. Frontend — Publik

### Rute

Ditambahkan ke `frontend/src/pages/publik/rutePublik.js`:

```
/artikel                    → HalamanDaftarArtikel
/artikel/topik/:topik       → HalamanDaftarArtikel (dengan filter aktif)
/artikel/:slug              → HalamanDetailArtikel
```

### Menu Navigasi

Menu "Artikel" diletakkan di bawah dropdown **"Referensi"** yang juga menampung:
- Ejaan
- Gramatika
- Makna
- Rima

Dropdown ini menggantikan beberapa item menu utama yang saat ini berdiri sendiri, sesuai rencana reorganisasi menu (Fase 1 dari rencana pengembangan, lihat dokumen `202603141500_rencana-pengembangan-kateglo.md`).

### Halaman Publik

**`HalamanDaftarArtikel`**
- Header dengan judul "Artikel" dan deskripsi singkat
- Tab/filter topik (semua, tanya-jawab, asal-kata, kata-baru, kesalahan-umum) — filter bisa multi-pilih
- Kartu artikel: judul, topik (badge tiap topik), penulis, tanggal terbit, cuplikan konten (~150 karakter)
- Cursor pagination

**`HalamanDetailArtikel`**
- Judul artikel
- Meta: topik (badge), penulis, penyunting (jika ada), tanggal terbit
- Konten markdown dirender (sama dengan renderer Gramatika/Ejaan)
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
- Tabel: judul, topik (badge), penulis, status (draf/terbit), tanggal perbarui
- Filter: topik, status
- Tombol: Tulis Artikel Baru, Edit, Terbitkan/Tarik, Hapus

**`HalamanRedaksiFormArtikel`** (buat & edit)
- Input: Judul, Topik (multi-select, mirip SeksiTagar di KamusAdmin), Penyunting (opsional, dropdown pengguna)
- Slug ditampilkan read-only di bawah judul (hanya form edit)
- Editor WYSIWYG (lihat bagian 6)
- Tombol: Simpan Draf, Simpan & Terbitkan (hanya jika punya izin `terbitkan_artikel`)

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
  → Penyunting membuka & menyunting
    → penyunting_id dipilih via autocomplete pengguna redaksi aktif (atau dikosongkan)
  → Terbitkan (diterbitkan = true, diterbitkan_pada = now())  — butuh izin terbitkan_artikel
  → Tarik artikel (diterbitkan = false, diterbitkan_pada = null)
```

---

## 10. SEO

- Setiap artikel punya URL kanonik: `/artikel/:slug`
- Meta tag: `og:title`, `og:description` (dari 150 karakter pertama konten), `og:type = article`
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
- **`diterbitkan_pada` dapat diedit** — field ini dapat diubah manual dari form redaksi (input `datetime-local`).
- **Menu publik disembunyikan sementara** — item "Artikel" dihapus dari dropdown Referensi di `NavbarPublik` sampai konten siap. Rute `/artikel` tetap dapat diakses langsung.
- **SSR prefetch untuk artikel belum diimplementasikan** — halaman artikel belum menggunakan pola SSR prefetch seperti kamus dan glosarium.
