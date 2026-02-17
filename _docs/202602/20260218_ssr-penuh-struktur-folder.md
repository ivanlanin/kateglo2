# Rencana SSR Penuh — Struktur Folder & Pemetaan Render

Tanggal: 2026-02-18

## Jawaban Singkat

Ya, untuk SSR penuh paling sederhana Anda cukup **1 service Web Service** di Render yang checkout **1 folder repo utama** (`kateglo2/`) dari GitHub.

Artinya:
- Bukan lagi Static Site sebagai pintu utama produksi.
- Domain utama (`kateglo.org`) diarahkan ke service Web Service SSR.
- API dan HTML SSR bisa dilayani dari proses Node yang sama (atau tetap dipisah internal modular di folder berbeda).

---

## Prinsip Arsitektur yang Disarankan

- Tetap pakai monorepo saat ini (`backend/` + `frontend/`), supaya migrasi minim.
- Tambahkan lapisan SSR app (server rendering) di dalam repo yang sama.
- Backend model/service/database tetap dipertahankan (tidak dibongkar).
- UI React tetap sumber komponen utama, tapi entry point rendering ditambah server-side.

---

## Struktur Folder (Target SSR Penuh, Efisien)

```text
kateglo2/
├── backend/
│   ├── db/                    # koneksi PostgreSQL + query builder
│   ├── models/                # fat model
│   ├── services/              # business logic + cache
│   ├── middleware/            # auth, limiter, security
│   ├── routes/                # endpoint API (json)
│   └── index.js               # bootstrap app server (gabung API + SSR handlers)
│
├── frontend/
│   ├── src/
│   │   ├── app/               # komponen route-level (SSR-aware)
│   │   ├── komponen/          # reusable components
│   │   ├── halaman/           # halaman publik/redaksi
│   │   ├── entry-client.jsx   # hydrate di browser
│   │   ├── entry-server.jsx   # renderToString/renderToPipeableStream
│   │   └── router.js          # route config tunggal (shared client+server)
│   ├── public/                # static assets (logo, favicon, changelog)
│   └── dist/                  # output build client (generated)
│
├── shared/                    # util shared (opsional)
├── _docs/
└── package.json               # workspace root
```

Catatan:
- Ini bukan berarti harus ganti nama semua folder sekarang.
- Pemetaan di atas adalah bentuk target; migrasi bisa bertahap.

---

## Pemetaan Folder → Tanggung Jawab

## 1) `backend/`
- Tetap sebagai sumber kebenaran data (DB, model, service).
- Menyediakan endpoint API (`/api/*`).
- Menyediakan SSR route handler untuk URL publik (`/kamus/*`, `/tesaurus/*`, `/glosarium/*`).
- Menyajikan aset static hasil build frontend.

## 2) `frontend/src/entry-server.jsx`
- Menerima URL request.
- Menjalankan prefetch data server-side.
- Menghasilkan HTML final + meta (`title`, `description`, `og:*`, `twitter:*`).

## 3) `frontend/src/entry-client.jsx`
- Melakukan hydration di browser setelah HTML SSR diterima.
- React Query cache di-hydrate agar tidak refetch berlebihan.

## 4) `frontend/public/`
- Tetap untuk aset statis global (`Logo Kateglo.png`, favicon, dsb).

---

## Konfigurasi Render (1 Service Utama)

## Service Type
- Web Service (Node)

## Source / Root
- Repo: `ivanlanin/kateglo2`
- Root Directory: kosong (root repo) atau tetap root monorepo

## Build Command (contoh)
```bash
npm install
npm run build --prefix frontend
```

## Start Command (contoh)
```bash
npm start --prefix backend
```

> Nanti di `backend/index.js`, server melayani:
> - `/api/*` (JSON API)
> - route SSR publik
> - static file client build (`frontend/dist`)

---

## Apakah perlu service frontend gratis tetap ada?

Pilihan praktis:
1. **Ya (sementara):** jadikan sebagai staging/rollback cepat.
2. **Tidak (setelah stabil):** domain utama cukup diarahkan ke service SSR backend.

Rekomendasi:
- Simpan dulu service static site 1-2 minggu pasca cutover sebagai rollback.

---

## Dampak ke SEO dan Share Preview

Dengan SSR penuh di URL asli:
- `/kamus/detail/:indeks` langsung membawa meta dinamis.
- Crawler tidak perlu jalur `/share/...` khusus.
- Ranking SEO dan snippet sosial lebih konsisten.

Route `/share/...` tetap boleh dipertahankan sebagai fallback/debug.

---

## Dampak ke Beban Database

Ya, bisa menurunkan beban DB jika pola cache benar:
- HTML SSR + data route dipasangkan cache Redis TTL.
- Repeated crawler hit tidak selalu menyentuh DB.
- Invalidasi saat redaksi update data menjaga freshness.

---

## Urutan Migrasi Paling Aman

1. Tambah SSR entry (`entry-server`, `entry-client`) di frontend.
2. Backend serve `frontend/dist` + SSR route handler.
3. Uji di domain sementara `kateglo-api.onrender.com`.
4. Aktifkan cache Redis + fallback memory.
5. Cutover domain `kateglo.org` ke Web Service SSR.
6. Monitor 24–48 jam (latensi, error, cache hit).

---

## Checklist “Done”

- [ ] Satu service Render checkout repo root
- [ ] Build frontend client berhasil
- [ ] Backend serve static + SSR route
- [ ] URL asli punya meta dinamis
- [ ] API tetap normal
- [ ] Cache aktif di produksi
- [ ] Domain utama sudah cutover

---

## FAQ Singkat

## Apakah tetap satu folder checkout?
Ya. Cukup repo root `kateglo2/` agar backend+frontend dapat dibuild bersama.

## Apakah harus digabung jadi satu folder fisik?
Tidak. Tetap monorepo `backend/` dan `frontend/` sudah ideal.

## Apakah static site gratis masih berguna?
Ya, sebagai fallback sementara atau preview/staging selama migrasi.