# Penerapan OG Image Dinamis

## Ringkasan

Pada Maret 2026, preview sosial Kateglo diubah dari pendekatan gambar statis per halaman menjadi gambar Open Graph dinamis yang dirender saat request.

Tujuan utama perubahan ini:

- menghindari pembuatan dan penyimpanan ratusan file PNG statis;
- menjaga preview sosial selalu konsisten dengan metadata SSR/SEO halaman;
- memungkinkan perluasan ke banyak kelompok route tanpa workflow generate aset;
- mempertahankan kualitas gambar `1200x630` untuk `og:image` dan `twitter:image`.

## Alur Arsitektur

### 1. SSR menentukan metadata sosial

SSR frontend di [frontend/src/entry-server.jsx](frontend/src/entry-server.jsx) membentuk:

- `og:title`
- `og:description`
- `twitter:title`
- `twitter:description`
- `og:image`
- `twitter:image`

Alih-alih menunjuk ke file statis, `og:image` sekarang menunjuk ke endpoint backend seperti:

- `/og/default.png?title=Kateglo&context=...`
- `/og/kamus.png?title=sara&context=Entri+Kamus+Bahasa+Indonesia`
- `/og/gramatika/preposisi.png?title=Preposisi&context=Kata+Tugas`

### 2. Backend merender PNG saat diminta

Backend menyediakan endpoint publik di [backend/routes/sistem/seoPublik.js](backend/routes/sistem/seoPublik.js):

- `GET /og/default.png`
- `GET /og/:section.png`
- `GET /og/:section/:slug.png`

Handler route memanggil `renderOgImagePng()` dari [backend/services/publik/layananSeoPublik.js](backend/services/publik/layananSeoPublik.js).

### 3. Service membangun SVG lalu mengubahnya menjadi PNG

Service SEO publik kini memuat renderer `@resvg/resvg-js`.

Pipeline render:

1. normalisasi `section`, `title`, dan `context`
2. pilih palet warna sesuai kelompok halaman
3. bangun SVG branded
4. render menjadi buffer PNG
5. kirim respons `image/png`

## Cakupan Route

Saat ini gambar dinamis dipakai untuk kelompok halaman utama berikut:

- `default`
- `kamus`
- `tesaurus`
- `glosarium`
- `makna`
- `rima`
- `alat`
- `gim`
- `ejaan`
- `gramatika`

Catatan:

- `ejaan` dan `gramatika` sudah memakai mode yang lebih spesifik, termasuk varian `:slug.png` per halaman.
- kelompok lain umumnya memakai section-level image dengan `title` dan `context` dinamis dari SSR.

## File yang Terdampak

### Backend

- [backend/routes/sistem/seoPublik.js](backend/routes/sistem/seoPublik.js)
- [backend/services/publik/layananSeoPublik.js](backend/services/publik/layananSeoPublik.js)
- [backend/__tests__/routes/sistem/seoPublik.test.js](backend/__tests__/routes/sistem/seoPublik.test.js)
- [backend/__tests__/services/publik/layananSeoPublik.test.js](backend/__tests__/services/publik/layananSeoPublik.test.js)
- [backend/package.json](backend/package.json)

### Frontend

- [frontend/src/entry-server.jsx](frontend/src/entry-server.jsx)
- [frontend/__tests__/entry-server.test.jsx](frontend/__tests__/entry-server.test.jsx)

## Dependency Tambahan

Backend memakai:

- `@resvg/resvg-js`

Alasan pemilihan:

- ringan untuk kebutuhan render SVG ke PNG;
- tidak perlu membawa Chromium/headless browser;
- cukup cocok untuk kartu preview sosial sederhana.

## Header Cache Saat Ini

Endpoint gambar OG mengembalikan:

- `Content-Type: image/png`
- `Cache-Control: public, max-age=86400`

Artinya:

- browser, crawler, dan CDN boleh menyimpan hasil selama 24 jam;
- server tetap merender ulang pada cache miss;
- belum ada memoization internal di proses Node.

## Hasil Benchmark Lokal

Benchmark lokal dilakukan langsung pada `renderOgImagePng()` dari backend untuk 30 iterasi per tipe.

Hasil kasar:

- `gramatika`: rata-rata sekitar `137.83 ms`, ukuran sekitar `56.7 KB`
- `kamus`: rata-rata sekitar `143.18 ms`, ukuran sekitar `66.3 KB`
- `default`: rata-rata sekitar `134.98 ms`, ukuran sekitar `69.7 KB`

Sampel 10 kali render untuk `gramatika/preposisi` berada di kisaran sekitar `127 ms` sampai `144 ms`.

Interpretasi:

- beban utamanya adalah CPU;
- tidak ada query DB tambahan untuk merender gambar;
- untuk trafik share normal, biaya ini masih masuk akal;
- untuk burst crawler atau validator, cache akan sangat membantu.

## Risiko dan Tradeoff

### Kelebihan

- tidak perlu generate aset PNG satu per satu;
- perubahan metadata langsung tercermin pada preview sosial;
- lebih mudah diperluas ke route baru;
- desain bisa dikelola dari satu service.

### Kekurangan

- render PNG dilakukan saat request, sehingga ada biaya CPU per cache miss;
- implementasi saat ini sinkron, sehingga burst request OG dapat menambah latency proses Node;
- belum ada cache internal di proses backend.

## Saran Pengembangan

Urutan pengembangan yang direkomendasikan:

1. Tambahkan memory cache kecil di backend untuk key berbasis URL lengkap request OG.
2. Jika deployment memakai CDN atau reverse proxy, cache-kan `/og/*` di edge.
3. Tambahkan `stale-while-revalidate` bila perilaku cache upstream mendukung.
4. Pertimbangkan invalidasi cache jika metadata sosial suatu halaman berubah sangat sering.
5. Untuk desain yang lebih kaya, bedakan layout antar subjenis route, misalnya:
   - kamus detail vs kamus kategori
   - glosarium bidang vs glosarium sumber
   - kuis kata vs susun kata
6. Jika suatu saat volume request OG tinggi, pertimbangkan hybrid strategy:
   - route dinamis untuk halaman long-tail
   - pre-render untuk halaman paling populer

## Catatan Operasional

- Implementasi ini cocok untuk kebutuhan saat ini karena request `og:image` biasanya datang dari crawler sosial, bukan dari semua user biasa.
- Jika ada laporan lonjakan CPU setelah share besar atau setelah divalidasi banyak tool preview, prioritas pertama bukan mematikan fitur, tetapi menambah cache.
- Jika preview sosial tampak usang setelah perubahan judul/konteks, penyebab paling mungkin adalah cache crawler atau CDN, bukan SSR frontend.

## Validasi yang Sudah Dilakukan

- lint backend lulus
- lint frontend lulus
- test terkait route/service SEO backend lulus
- test SSR metadata frontend lulus
- benchmark lokal render PNG berhasil dijalankan

## Kesimpulan

Pendekatan gambar OG dinamis memberikan tradeoff yang baik untuk Kateglo saat ini:

- fleksibel;
- mudah dipelihara;
- tidak menambah kompleksitas build aset;
- masih aman untuk trafik normal.

Optimasi berikutnya yang paling bernilai adalah cache internal atau cache edge untuk endpoint `/og/*`.