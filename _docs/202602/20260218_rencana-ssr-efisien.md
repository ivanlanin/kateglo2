# Rencana SSR Paling Efisien untuk Kateglo

Tanggal: 2026-02-18

## Ringkasan Eksekutif

Kondisi saat ini:
- Backend: `kateglo-api.onrender.com` (Web Service, berbayar)
- Frontend: `kateglo.onrender.com` + `kateglo.org` (Static Site, gratis)

Target:
- URL asli (mis. `/kamus/detail/angin`) memiliki metadata dinamis untuk SEO/social preview.
- Tetap sederhana, biaya rendah, dan risiko migrasi minimal.

Rekomendasi paling efisien:
1. **Jangka pendek (sudah jalan):** gunakan URL `/share/...` untuk preview dinamis.
2. **Jangka menengah (disarankan):** **gabungkan delivery layer ke backend Web Service** untuk domain utama (`kateglo.org`), sehingga URL asli bisa dilayani HTML dinamis.
3. **Jangan langsung full SSR React** jika belum perlu. Mulai dari SSR-lite untuk route SEO penting terlebih dahulu.

---

## Apakah SSR harus digabung?

Tidak wajib menggabungkan repository, tapi untuk hasil SEO dinamis yang konsisten di URL asli, **jalur request domain utama sebaiknya melewati service yang bisa render HTML dinamis**.

Secara praktik di Render, opsi paling sederhana adalah:
- Tetap 1 repo
- Backend Web Service menjadi pintu utama domain produksi
- Frontend tetap dibuild (Vite), lalu hasil build (`frontend/dist`) disajikan oleh backend

Dengan begitu, tidak perlu membuat service frontend SSR terpisah sejak awal.

---

## Opsi Arsitektur

## Opsi A — Tetap Static Site + /share (status sekarang)
Kelebihan:
- Paling cepat, biaya rendah
- Sudah bekerja untuk WhatsApp/Telegram saat link `/share/...` dipakai

Kekurangan:
- URL asli tetap metadata statis (SEO dinamis belum tercapai)

Cocok jika:
- Fokus utama social preview saat share manual

## Opsi B — Backend jadi gateway utama domain (rekomendasi)
Kelebihan:
- URL asli bisa dinamis
- Tidak perlu menambah service berbayar baru khusus frontend SSR
- Kontrol penuh routing SEO + caching di satu tempat

Kekurangan:
- Ada pekerjaan migrasi routing/domain
- Perlu menyiapkan static asset serving di backend

Cocok jika:
- Ingin SEO URL asli meningkat dengan kompleksitas minimal

## Opsi C — Full SSR frontend terpisah (service baru)
Kelebihan:
- Arsitektur SSR standar modern

Kekurangan:
- Biaya dan kompleksitas tertinggi
- Operasional lebih berat (2-3 service runtime aktif)

Cocok jika:
- Tim siap investasi infrastruktur dan observability lebih matang

---

## Rencana Implementasi (Paling Efisien)

## Fase 0 — Stabilkan yang sudah ada (1 hari)
- Pertahankan route `/share/...` yang sudah aktif.
- Pastikan env cache produksi aktif.
- Pastikan rule rewrite static tidak mengganggu `/share/*`.

Output:
- Social preview dinamis tetap aman sebagai fallback.

## Fase 1 — Backend melayani aset frontend statis (1-2 hari)
- Tambahkan static serving `frontend/dist` di backend.
- Route non-API (`/`, `/kamus`, `/tesaurus`, `/glosarium`, dll.) fallback ke `index.html` dari backend.
- Tetap pertahankan `/api/*` dan `/share/*` di backend.

Output:
- Satu service (backend) bisa melayani situs + API.

## Fase 2 — Aktifkan dynamic rendering untuk URL SEO prioritas (2-4 hari)
Prioritas route:
1. `/kamus/detail/:indeks`
2. `/kamus/:kategori/:kode`
3. `/tesaurus/:kata`

Strategi:
- Untuk route prioritas, backend hasilkan HTML dengan meta dinamis.
- Untuk route lain, fallback ke SPA normal.
- Gunakan cache Redis + fallback memory (sudah tersedia) agar query DB tidak berulang.

Output:
- URL asli prioritas sudah ramah crawler.

## Fase 3 — Cutover domain (0.5-1 hari)
- Pindahkan `kateglo.org` ke backend Web Service.
- Static Site tetap dipakai untuk preview/staging sementara.
- Monitor error rate, latency, dan cache hit ratio 24-48 jam.

Output:
- URL asli domain utama mendukung metadata dinamis.

---

## Setting Server/Render yang Dibutuhkan

## Environment Variables (Backend)
- `PUBLIC_SITE_URL=https://kateglo.org`
- `REDIS_URL=redis://...`
- `CACHE_ENABLED=true`
- `CACHE_TTL_SECONDS=900`
- `CACHE_FALLBACK_MEMORY=true`

## Service Mapping
- Domain produksi `kateglo.org` diarahkan ke service backend (Web Service).
- Jika belum cutover penuh, tetap gunakan `/share/...` sebagai jalur share resmi.

## Redirect/Rewrite
- Saat masih memakai Static Site sebagai domain utama:
  - `/share/*` harus diarahkan ke backend
  - Catch-all `/* -> /index.html` tetap paling bawah
- Setelah cutover ke backend:
  - rewrite static di Static Site tidak lagi kritikal untuk produksi

---

## Dampak ke Beban Database

Ya, rencana ini **mengurangi beban database** jika caching diaktifkan benar:
- Request berulang untuk URL populer dilayani dari Redis/memory cache.
- Query detail kamus dan metadata tidak perlu hit DB setiap kali crawler datang.
- Invalidasi cache saat data berubah menjaga konsistensi konten.

Perkiraan dampak:
- Endpoint populer bisa turun signifikan jumlah query read.
- Latensi respons share/SEO route ikut turun.

---

## Risiko dan Mitigasi

1. Risiko: URL route bentrok antara SPA dan renderer SEO.
   - Mitigasi: whitelist route SEO prioritas, route lain fallback SPA.

2. Risiko: cache stale setelah edit redaksi.
   - Mitigasi: invalidasi cache pada operasi tulis (sudah disiapkan untuk kamus).

3. Risiko: cutover domain memicu downtime singkat.
   - Mitigasi: turunkan TTL DNS sebelum cutover, siapkan rollback cepat.

---

## Rollback Plan

Jika setelah cutover terjadi isu:
1. Kembalikan domain ke Static Site lama.
2. Pertahankan `/share/...` untuk preview dinamis sementara.
3. Perbaiki backend route/serving, lalu cutover ulang.

---

## Checklist Eksekusi Singkat

- [ ] Env cache backend terpasang di production
- [ ] Route `/share/...` tervalidasi dari WhatsApp/Telegram
- [ ] Backend dapat serve `frontend/dist`
- [ ] Route SEO prioritas menghasilkan meta dinamis
- [ ] Domain `kateglo.org` dialihkan ke backend
- [ ] Monitoring 24-48 jam pasca cutover

---

## Keputusan yang Disarankan

Untuk kondisi Anda sekarang, jalur paling mudah dan efisien adalah:
- **Tetap gunakan arsitektur split saat ini untuk jangka sangat pendek**
- **Lalu migrasi domain utama ke backend Web Service secara bertahap**
- **Bangun SSR-lite untuk route prioritas, bukan full SSR sekaligus**

Ini memberi hasil SEO nyata dengan biaya dan kompleksitas paling rendah dibanding langsung membangun stack SSR penuh.