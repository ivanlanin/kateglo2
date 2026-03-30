# Sistem SEO Fitur Interaktif

## Ringkasan

Mulai 2026-03-26, SEO untuk fitur interaktif publik Kateglo (alat dan gim) dipusatkan pada data frontend, lalu dipakai ulang oleh frontend SSR dan backend sitemap.

Tujuan utamanya:

- mengurangi duplikasi daftar alat dan gim,
- mengurangi risiko lupa memperbarui metadata SEO saat fitur baru ditambah,
- menyiapkan alat internal agar SEO-nya sudah bisa disiapkan sebelum dibuka untuk publik.

## Source of Truth

Source of truth saat ini adalah:

- `frontend/src/constants/katalogFiturData.json`

Berkas ini menyimpan dua kelompok fitur interaktif:

- `alat`
- `gim`

Masing-masing kelompok memiliki:

- `index`: metadata halaman indeks
- `items`: daftar fitur individual

## Konsumen Data

### Frontend UI

Frontend tetap menggunakan helper katalog di:

- `frontend/src/constants/katalogFitur.js`

File ini sekarang berfungsi sebagai adaptor yang:

- mengekspor `katalogAlat` dan `katalogGim` untuk UI,
- menyediakan filter publik/internal seperti sebelumnya,
- menyediakan helper SEO untuk frontend SSR,
- menyediakan helper path sitemap untuk sinkronisasi backend.

### Frontend SSR

Frontend SSR membaca metadata fitur interaktif melalui:

- `frontend/src/entry-server.jsx`

SSR tidak lagi perlu menulis metadata alat/gim satu per satu untuk kasus umum. Metadata diambil dari helper katalog.

### Backend SEO

Backend sitemap membaca manifest frontend melalui:

- `backend/services/publik/layananSeoPublik.js`

Saat ini backend masih membaca file frontend secara langsung dari repo yang sama. Ini aman untuk kondisi satu repo dan satu filesystem saat ini, tetapi harus dianggap sebagai solusi transisional.

## Struktur Data Penting

Setiap kelompok (`alat` atau `gim`) dapat memiliki data indeks seperti ini:

- `judul`
- `deskripsi`
- `href`
- `canonicalPath`
- `sitemap`
- `tampilPublik`

Setiap item fitur dapat memiliki field seperti ini:

- `slug`
- `judul`
- `deskripsi`
- `href`
- `routePath`
- `tampilPublik`
- `seoJudul`
- `seoDeskripsi`
- `canonicalPath`
- `sitemapPaths`

Untuk route yang tidak sederhana satu banding satu, item juga bisa memakai:

- `seoVariants`
- `seoAliases`
- `seoFallback`

### Makna Field SEO

- `seoJudul`: judul SEO spesifik, jika berbeda dari judul UI
- `seoDeskripsi`: deskripsi SEO spesifik, jika berbeda dari deskripsi kartu/UI
- `canonicalPath`: canonical utama untuk route tersebut
- `sitemapPaths`: daftar path yang harus masuk sitemap
- `seoVariants`: metadata untuk varian route yang eksplisit
- `seoAliases`: metadata untuk route alias yang perlu canonical tertentu
- `seoFallback`: metadata fallback untuk prefix route tertentu

## Contoh Pemakaian

### Kasus Sederhana

Fitur seperti:

- `Penganalisis Teks`
- `Penghitung Huruf`
- `Kuis Kata`

bisa ditangani langsung dari item utama karena route publiknya sederhana.

### Kasus Khusus

`Susun Kata` memakai beberapa bentuk route:

- `/gim/susun-kata`
- `/gim/susun-kata/harian`
- `/gim/susun-kata/bebas`

Karena itu `Susun Kata` memakai kombinasi:

- `seoVariants`
- `seoAliases`
- `seoFallback`

agar title, description, dan canonical tetap benar untuk semua jalur route.

## Status Alat Internal

Alat internal dapat disiapkan SEO-nya lebih awal walaupun belum masuk sitemap.

Contoh saat ini:

- `Pohon Kalimat`

Saat ini:

- metadata SEO-nya sudah tersedia,
- route-nya sudah bisa menghasilkan title dan description yang benar,
- tetapi `sitemapPaths` masih kosong sehingga belum dimasukkan ke sitemap publik.

Dengan pola ini, saat alat internal dibuka untuk publik nanti, perubahan yang biasanya cukup dilakukan adalah:

- ubah `tampilPublik` sesuai kebutuhan,
- isi `sitemapPaths` atau aktifkan path canonical yang perlu diindeks.

## Workflow Saat Menambah Fitur Baru

Jika menambah alat atau gim baru:

1. Tambahkan item baru di `frontend/src/constants/katalogFiturData.json`.
2. Isi metadata UI dan metadata SEO pada item tersebut.
3. Jika route sederhana, biasanya tidak perlu menambah logika SEO baru di SSR.
4. Jika route punya varian atau alias, tambahkan `seoVariants`, `seoAliases`, atau `seoFallback`.
5. Jalankan validasi frontend dan backend yang relevan.

## Workflow Saat Membuka Fitur Internal ke Publik

Jika alat internal dibuka ke publik:

1. Periksa `tampilPublik`.
2. Pastikan `canonicalPath` benar.
3. Isi `sitemapPaths` untuk path yang ingin diindeks.
4. Jalankan validasi frontend SSR.
5. Jalankan validasi backend sitemap.

## Batasan Arsitektur Saat Ini

Saat ini backend masih membaca file frontend ini secara langsung:

- `frontend/src/constants/katalogFiturData.json`

Ini berarti backend secara teknis bisa membaca frontend karena:

- repo masih satu,
- filesystem masih satu,
- backend dan frontend masih berada dalam workspace yang sama.

Namun, jika nanti frontend dan backend dipisah server atau dipisah repo, pola ini tidak boleh dianggap final.

## Arah Perbaikan Jika Deployment Dipisah

Jika frontend dan backend dipisah deployment, target yang lebih aman adalah:

1. frontend tetap memegang source of truth,
2. frontend menghasilkan artefak manifest SEO yang netral,
3. backend membaca artefak itu, bukan membaca `frontend/src` langsung.

Dengan demikian, kontraknya menjadi lebih stabil:

- frontend menentukan data,
- backend mengonsumsi artefak,
- tidak ada asumsi bahwa source tree frontend tersedia di filesystem backend.

## Catatan Operasional

Jika di masa depan muncul kebutuhan cepat dari user seperti:

- "Sinkronkan SEO backend"

maka yang perlu diperiksa terlebih dahulu adalah:

- apakah `frontend/src/constants/katalogFiturData.json` sudah memuat kondisi terbaru,
- apakah route baru punya metadata SEO yang cukup,
- apakah `sitemapPaths` sudah sesuai dengan status publik/internal yang diinginkan.

Dengan kata lain, perubahan dimulai dari frontend manifest, lalu backend cukup diselaraskan terhadap manifest itu.