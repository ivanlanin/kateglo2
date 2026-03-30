# Dokumentasi SSR dan SEO Aktual

## Ringkasan

Dokumentasi SSR/SEO di repo ini sebelumnya sudah ada, tetapi masih tersebar dan belum menjadi referensi operasional tunggal:

- `README.md` menjelaskan cara menjalankan SSR production dan menyebut `robots.txt` serta `sitemap.xml` secara ringkas.
- `docs/202602/202602180019_rencana-ssr-efisien.md` dan `docs/202602/202602180024_ssr-penuh-struktur-folder.md` berisi rencana arsitektur, bukan keadaan implementasi final saat ini.
- `docs/202603/202603212130_penerapan-og-image-dinamis.md` sudah mendokumentasikan Open Graph image dinamis secara khusus.

Dokumen ini melengkapi gap tersebut dengan menjelaskan implementasi SSR/SEO yang aktif sekarang, alur request, cakupan route, jenis render, dan contoh untuk tiap jenis.

## Lokasi Implementasi

Komponen utama SSR/SEO saat ini:

- `backend/services/sistem/layananSsrRuntime.js`
  Runtime backend yang:
  - mencari artefak build frontend SSR;
  - membaca `index.html` hasil build;
  - memanggil renderer SSR frontend;
  - melakukan prefetch data untuk route tertentu;
  - fallback ke template statis jika bundle SSR belum ada atau render gagal.

- `frontend/src/entry-server.jsx`
  Renderer SSR frontend yang:
  - merender HTML React dengan `renderToString()`;
  - membentuk `title`, `meta description`, canonical, Open Graph, dan Twitter Card;
  - menentukan status `404` untuk route markdown statis yang tidak ditemukan;
  - mengecualikan area `/redaksi/*` dari SSR body.

- `backend/routes/sistem/seoPublik.js`
  Route publik untuk:
  - `GET /robots.txt`
  - `GET /sitemap.xml`
  - `GET /og/default.png`
  - `GET /og/:section.png`
  - `GET /og/:section/:slug.png`

- `backend/services/publik/layananSeoPublik.js`
  Service SEO publik yang:
  - membangun isi `robots.txt`;
  - membangun XML sitemap;
  - mengumpulkan path sitemap statis dan dinamis;
  - merender OG image dinamis berbasis SVG lalu mengubahnya menjadi PNG.

## Alur Request SSR

Alur normal untuk halaman publik:

1. Request masuk ke backend Express.
2. Runtime frontend di `layananSsrRuntime.js` melewatkan request API, auth, health, dan asset file.
3. Backend membaca template `frontend/dist/index.html`.
4. Jika bundle SSR tersedia, backend melakukan prefetch data bila route memerlukannya.
5. Backend memanggil `render(url, prefetchedData)` dari `frontend/dist/server/entry-server.js`.
6. Frontend menghasilkan:
   - `appHtml`
   - `headTags`
   - `statusCode`
7. Backend menyisipkan `headTags` ke `<head>` dan `appHtml` ke `#root`.
8. Response HTML dikirim ke crawler atau browser.

Jika bundle SSR tidak ada atau renderer melempar error, backend mengirim `index.html` tanpa HTML hasil SSR sebagai fallback aman.

## Jenis SSR yang Dipakai

### 1. SSR penuh untuk halaman publik umum

Ini adalah mode default untuk route publik yang tidak dikecualikan.

Karakteristik:

- `renderToString()` dipakai untuk body HTML.
- Meta SEO dibentuk di server.
- Data route tertentu bisa ikut diprefetch.

Contoh:

- `/`
- `/kamus`
- `/makna`
- `/rima`
- `/alat`
- `/gim`

Contoh head yang dihasilkan:

```html
<title>Kamus — Kateglo</title>
<meta name="description" content="Kamus Bahasa Indonesia di Kateglo." />
<link rel="canonical" href="https://kateglo.org/kamus" />
<meta property="og:title" content="Kamus | Kateglo" />
<meta property="og:image" content="https://kateglo.org/og/kamus.png?title=Kamus&context=Kamus+Bahasa+Indonesia" />
```

### 2. SSR penuh dengan prefetch data dari DB/service

Mode ini dipakai ketika metadata dan konten awal akan lebih baik jika backend mengambil data terlebih dulu sebelum render.

Route yang diprefetch saat ini:

- `/kamus/detail/:indeks`
- `/kamus/cari/:kata`
- `/tesaurus/cari/:kata`
- `/glosarium/cari/:kata`
- `/glosarium/bidang/:bidang`
- `/glosarium/sumber/:sumber`
- `/glosarium/detail/:asing`

Sumber datanya:

- kamus: `ambilDetailKamus()`
- tesaurus: `ambilDetailTesaurus()`
- glosarium: `ModelGlosarium`

Contoh per jenis:

| Jenis | URL contoh | Prefetch | Tujuan SEO |
| --- | --- | --- | --- |
| Kamus detail | `/kamus/detail/angin` | makna, lafal, pemenggalan, sinonim, antonim | deskripsi detail entri dan social preview lebih spesifik |
| Kamus cari | `/kamus/cari/air` | makna ringkas hasil detail | description hasil pencarian tidak generik |
| Tesaurus cari | `/tesaurus/cari/baik` | sinonim dan antonim | meta hasil pencarian tesaurus lebih kaya |
| Glosarium cari | `/glosarium/cari/pajak` | contoh 3 hasil awal | preview hasil pencarian glosarium |
| Glosarium bidang | `/glosarium/bidang/hukum` | nama bidang dan contoh istilah | judul dan deskripsi bidang lebih akurat |
| Glosarium sumber | `/glosarium/sumber/KBBI` | nama sumber dan contoh istilah | metadata per sumber |
| Glosarium detail | `/glosarium/detail/force%20majeure` | exact rows `ambilPersisAsing()` | metadata istilah spesifik tanpa query detail penuh |

Contoh pola head untuk kamus detail:

```html
<title>angin — Kateglo</title>
<meta name="description" content="angin: gerakan udara dari daerah yang bertekanan tinggi ke daerah yang bertekanan rendah ..." />
<link rel="canonical" href="https://kateglo.org/kamus/detail/angin" />
<meta property="og:image" content="https://kateglo.org/og/kamus.png?title=angin&context=Entri+Kamus+Bahasa+Indonesia" />
```

### 3. SSR penuh dengan prefetch markdown statis

Mode ini dipakai untuk konten referensi yang berasal dari file markdown statis di frontend public.

Route:

- `/ejaan`
- `/ejaan/:slug`
- `/gramatika`
- `/gramatika/:slug`

Sumber data:

- `frontend/public/ejaan/**/*.md`
- `frontend/public/gramatika/**/*.md`

Perilaku khusus:

- frontmatter markdown dibaca bila ada;
- deskripsi SEO bisa diambil dari `frontmatter.description`;
- jika tidak ada, runtime mengekstrak ringkasan dari isi markdown;
- jika slug tidak ditemukan, SSR tetap mengembalikan halaman dengan status `404`.

Contoh per jenis:

| Jenis | URL contoh | Sumber deskripsi |
| --- | --- | --- |
| Indeks ejaan | `/ejaan` | deskripsi default dari renderer |
| Detail ejaan | `/ejaan/huruf-kapital` | frontmatter markdown atau ringkasan isi |
| Indeks gramatika | `/gramatika` | deskripsi default dari renderer |
| Detail gramatika | `/gramatika/preposisi` | frontmatter markdown atau ringkasan isi |

Contoh head untuk detail gramatika:

```html
<title>Preposisi — Kateglo</title>
<meta name="description" content="Penjelasan tentang Preposisi pada bab Kata Tugas dalam panduan tata bahasa Indonesia di Kateglo." />
<link rel="canonical" href="https://kateglo.org/gramatika/preposisi" />
<meta property="og:image" content="https://kateglo.org/og/gramatika/preposisi.png?title=Preposisi&context=Kata+Tugas" />
```

### 4. Head-only SSR untuk area redaksi

Route `/redaksi` dan seluruh turunannya tidak merender body React di server. Fungsi `shouldSkipSsr()` di frontend SSR mengembalikan `true` untuk area ini.

Karakteristik:

- `appHtml` dikosongkan;
- `headTags` tetap dibentuk agar dokumen HTML tidak kehilangan title/canonical/meta dasar;
- autentikasi dan hidrasi dibiarkan sepenuhnya dikelola client.

Contoh:

- `/redaksi`
- `/redaksi/login`
- `/redaksi/kamus`

Contoh hasil:

```html
<div id="root"></div>
<title>Kateglo</title>
<link rel="canonical" href="https://kateglo.org/redaksi/login" />
```

### 5. Fallback ke template statis

Mode fallback dipakai jika:

- artefak `frontend/dist/index.html` ada tetapi bundle server SSR belum ada; atau
- renderer SSR gagal saat runtime.

Karakteristik:

- backend tetap melayani shell HTML frontend;
- request publik tidak putus total;
- metadata dinamis tidak sebaik mode SSR normal.

Ini adalah mekanisme ketersediaan layanan, bukan mode yang diharapkan untuk produksi stabil.

## Jenis SEO yang Sudah Didukung

### 1. SEO head tags pada HTML

Untuk halaman SSR, frontend saat ini membentuk elemen berikut:

- `<title>`
- `<meta name="description">`
- `<link rel="canonical">`
- `og:type`
- `og:site_name`
- `og:locale`
- `og:url`
- `og:title`
- `og:description`
- `og:image`
- `og:image:type`
- `og:image:width`
- `og:image:height`
- `og:image:alt`
- `twitter:card`
- `twitter:title`
- `twitter:description`
- `twitter:image`
- `twitter:image:alt`

Contoh generik:

```html
<title>Susun Kata Harian — Kateglo</title>
<meta name="description" content="Mainkan gim susun kata harian seperti Wordle untuk menyusun kata bahasa Indonesia dalam enam percobaan." />
<link rel="canonical" href="https://kateglo.org/gim/susun-kata/harian" />
<meta property="og:title" content="Susun Kata Harian | Kateglo" />
<meta name="twitter:card" content="summary_large_image" />
```

### 2. Canonical URL khusus

Sebagian route punya canonical spesifik, misalnya `Susun Kata`:

- `/gim/susun-kata` diarahkan canonical ke `/gim/susun-kata/harian`
- route turunan lain di bawah `/gim/susun-kata/*` yang tidak eksplisit juga diarahkan ke canonical harian

Contoh:

```html
<link rel="canonical" href="https://kateglo.org/gim/susun-kata/harian" />
```

### 3. robots.txt dinamis

Endpoint:

- `GET /robots.txt`

Isi saat ini:

```txt
User-agent: *
Allow: /
Disallow: /redaksi/
Disallow: /api/
Disallow: /auth/
Sitemap: https://kateglo.org/sitemap.xml
```

Tujuan:

- halaman publik boleh diindeks;
- panel redaksi, API, dan auth tidak diindeks;
- crawler diberi rujukan sitemap.

### 4. sitemap.xml dinamis

Endpoint:

- `GET /sitemap.xml`

Sumber path sitemap saat ini:

- path statis publik seperti `/`, `/kamus`, `/glosarium`, `/alat`, `/gim`, `/makna`, `/rima`, `/ejaan`, `/gramatika`;
- path ejaan dari file markdown di `frontend/public/ejaan`;
- path gramatika dari file markdown di `frontend/public/gramatika`;
- path kategori kamus dari label master;
- path kategori glosarium dari daftar bidang dan sumber.

Contoh fragmen XML:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://kateglo.org/</loc>
    <lastmod>2026-03-22</lastmod>
  </url>
  <url>
    <loc>https://kateglo.org/ejaan/huruf-kapital</loc>
    <lastmod>2026-03-22</lastmod>
  </url>
</urlset>
```

Catatan:

- sitemap saat ini tidak memasukkan semua long-tail detail kamus, hasil pencarian, atau detail glosarium satu per satu;
- fokusnya pada landing page, kategori, dan konten referensi yang stabil.

### 5. OG image dinamis

Endpoint:

- `GET /og/default.png`
- `GET /og/:section.png`
- `GET /og/:section/:slug.png`

Jenis yang dipakai saat ini:

| Jenis | Contoh URL | Pemakaian |
| --- | --- | --- |
| Default | `/og/default.png?title=Kateglo&context=Kamus%2C+Tesaurus%2C+dan+Glosarium+Bahasa+Indonesia` | fallback umum |
| Section-level | `/og/kamus.png?title=angin&context=Entri+Kamus+Bahasa+Indonesia` | kamus, tesaurus, glosarium, makna, rima, alat, gim |
| Slug-level | `/og/ejaan/huruf-kapital.png?title=Huruf+Kapital&context=Huruf` | ejaan detail |
| Slug-level | `/og/gramatika/preposisi.png?title=Preposisi&context=Kata+Tugas` | gramatika detail |

Detail implementasi lebih spesifik untuk OG image ada di `docs/202603/202603212130_penerapan-og-image-dinamis.md`.

## Matriks Route dan Contoh per Jenis

Tabel berikut merangkum jenis halaman publik yang saat ini punya perlakuan SSR/SEO berbeda.

| Kelompok | URL contoh | Mode SSR | Sumber data/meta | Contoh OG |
| --- | --- | --- | --- | --- |
| Beranda | `/` | SSR penuh | default meta renderer | `/og/default.png?...` |
| Kamus browse | `/kamus` | SSR penuh | `buildMetaBrowseKamus()` | `/og/kamus.png?...` |
| Kamus cari | `/kamus/cari/air` | SSR + prefetch DB | `ambilDetailKamus()` | `/og/kamus.png?title=air...` |
| Kamus detail | `/kamus/detail/angin` | SSR + prefetch DB | `ambilDetailKamus()` | `/og/kamus.png?title=angin...` |
| Kamus kategori | `/kamus/kelas/verba` | SSR penuh | `buildMetaKategoriKamus()` | `/og/kamus.png?...` |
| Kamus tagar | `/kamus/tagar/me-` | SSR penuh | `buildMetaTagarKamus()` | `/og/kamus.png?...` |
| Tesaurus | `/tesaurus` | SSR penuh | `buildMetaBrowseTesaurus()` | `/og/tesaurus.png?...` |
| Tesaurus cari | `/tesaurus/cari/baik` | SSR + prefetch DB | `ambilDetailTesaurus()` | `/og/tesaurus.png?title=baik...` |
| Glosarium browse | `/glosarium` | SSR penuh | `buildMetaBrowseGlosarium()` | `/og/glosarium.png?...` |
| Glosarium cari | `/glosarium/cari/pajak` | SSR + prefetch DB | `ModelGlosarium.cari()` | `/og/glosarium.png?title=pajak...` |
| Glosarium bidang | `/glosarium/bidang/hukum` | SSR + prefetch DB | `ModelGlosarium.resolveSlugBidang()` | `/og/glosarium.png?...` |
| Glosarium sumber | `/glosarium/sumber/KBBI` | SSR + prefetch DB | `ModelGlosarium.cari()` | `/og/glosarium.png?...` |
| Glosarium detail | `/glosarium/detail/force%20majeure` | SSR + prefetch DB | `ModelGlosarium.ambilPersisAsing()` | `/og/glosarium.png?...` |
| Makna | `/makna` | SSR penuh | builder lokal renderer | `/og/makna.png?...` |
| Makna cari | `/makna/cari/air` | SSR penuh | builder lokal renderer | `/og/makna.png?...` |
| Rima | `/rima` | SSR penuh | builder lokal renderer | `/og/rima.png?...` |
| Rima cari | `/rima/cari/angin` | SSR penuh | builder lokal renderer | `/og/rima.png?...` |
| Ejaan indeks | `/ejaan` | SSR penuh | deskripsi default | `/og/ejaan.png?...` |
| Ejaan detail | `/ejaan/huruf-kapital` | SSR + prefetch markdown | markdown + frontmatter | `/og/ejaan/huruf-kapital.png?...` |
| Gramatika indeks | `/gramatika` | SSR penuh | deskripsi default | `/og/gramatika.png?...` |
| Gramatika detail | `/gramatika/preposisi` | SSR + prefetch markdown | markdown + frontmatter | `/og/gramatika/preposisi.png?...` |
| Alat | `/alat` | SSR penuh | builder lokal renderer | `/og/alat.png?...` |
| Penganalisis Teks | `/alat/penganalisis-teks` | SSR penuh | builder lokal renderer | `/og/alat.png?...` |
| Penghitung Huruf | `/alat/penghitung-huruf` | SSR penuh | builder lokal renderer | `/og/alat.png?...` |
| Gim | `/gim` | SSR penuh | builder lokal renderer | `/og/gim.png?...` |
| Kuis Kata | `/gim/kuis-kata` | SSR penuh | builder lokal renderer | `/og/gim.png?...` |
| Susun Kata harian | `/gim/susun-kata/harian` | SSR penuh | builder lokal renderer | `/og/gim.png?...` |
| Susun Kata bebas | `/gim/susun-kata/bebas` | SSR penuh | builder lokal renderer | `/og/gim.png?...` |
| Kebijakan privasi | `/kebijakan-privasi` | SSR penuh | meta khusus | `/og/default.png?...` |
| Redaksi | `/redaksi/login` | head-only SSR | tanpa body SSR | `/og/default.png?...` |

## Cache-Control yang Berlaku

Header cache penting saat ini:

- asset frontend statis dari `express.static`: `max-age=1h`
- `robots.txt`: `public, max-age=3600`
- `sitemap.xml`: `public, max-age=3600`
- OG image: `public, max-age=86400`
- halaman `/ejaan` dan `/gramatika` beserta detailnya: `public, max-age=<CACHE_TTL_SECONDS atau 1800 default>`

Catatan penting:

- cache halaman khusus saat ini hanya diberlakukan eksplisit untuk ejaan dan gramatika;
- route publik lain tetap SSR, tetapi tidak diberi header cache halaman khusus dari runtime ini.

## Status dan Keterbatasan Saat Ini

Status saat ini sudah cukup baik untuk SEO publik inti, tetapi ada beberapa batasan yang perlu diketahui:

1. Dokumentasi implementasi sebelumnya tersebar dan bercampur dengan dokumen rencana.
2. Sitemap belum memuat semua halaman long-tail seperti semua detail kamus atau semua hasil pencarian.
3. Route redaksi sengaja tidak merender body SSR untuk menghindari konflik auth client.
4. Jika SSR bundle gagal, sistem fallback ke shell statis sehingga kualitas SEO turun sementara, tetapi situs tetap hidup.
5. OG image dinamis masih mengandalkan cache HTTP dan belum memakai cache internal proses Node.

## Rekomendasi Pemakaian Dokumen Ini

Gunakan dokumen ini sebagai referensi utama bila perlu:

- mengecek apakah suatu route sudah punya SSR atau belum;
- mengetahui dari mana metadata SEO dibentuk;
- memahami apakah halaman memakai prefetch DB, markdown, atau hanya meta builder lokal;
- menambah route publik baru yang butuh title, canonical, sitemap, atau OG image;
- membedakan dokumen rencana lama versus implementasi aktual.

## Referensi Terkait

- `README.md`
- `backend/services/sistem/layananSsrRuntime.js`
- `frontend/src/entry-server.jsx`
- `backend/routes/sistem/seoPublik.js`
- `backend/services/publik/layananSeoPublik.js`
- `docs/202603/202603212130_penerapan-og-image-dinamis.md`
- `docs/202602/202602180019_rencana-ssr-efisien.md`
- `docs/202602/202602180024_ssr-penuh-struktur-folder.md`