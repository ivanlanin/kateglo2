# Kateglo 2.0

Kamus, Tesaurus, dan Glosarium Bahasa Indonesia — versi modern.

## Arsitektur

Monorepo dengan 2 aplikasi utama:

- **backend/** — API Server (Express.js + PostgreSQL)
- **frontend/** — Aplikasi React untuk situs publik + panel redaksi (`/redaksi/*`)

Pada mode production, backend juga melayani runtime frontend SSR dan aset hasil build.

Dokumentasi teknis terkait SSR/SEO:

- `docs/202603/202603221100_dokumentasi-ssr-seo-aktual.md` — referensi implementasi SSR/SEO yang aktif saat ini.
- `docs/202603/202603212130_penerapan-og-image-dinamis.md` — detail khusus Open Graph image dinamis.

## Tech Stack

### Backend
- Node.js 18+
- Express.js
- PostgreSQL (Native driver)
- JWT Authentication
- Winston logging

### Frontend
- React 19
- Vite 6
- TailwindCSS
- React Router 7
- React Query 5

### Testing
- Vitest (Frontend)
- Jest (Backend)

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, untuk caching)

### Installation

```bash
# Install dependencies untuk semua workspace
npm install

# Install dependencies per workspace
npm install --prefix backend
npm install --prefix frontend
```

### Running Development

```bash
# Jalankan semua services sekaligus
npm run dev

# Atau jalankan terpisah
npm run dev:backend       # Backend di http://localhost:3000
npm run dev:public        # Public di http://localhost:5173
```

### Simulasi Production (SSR + API dalam 1 server)

```bash
# Cara paling sederhana (seperti target di Render single-service)
npm install
npm start

# Build frontend SSR lalu jalankan backend dalam mode production
npm run sim:production

# Atau pisahkan langkah build dan start
npm run sim:production:build
npm run sim:production:start
```

`npm start` akan mengecek artefak SSR frontend (`frontend/dist`). Jika belum ada, build SSR dijalankan otomatis sebelum server backend mode production dinyalakan.

### Building for Production

```bash
# Frontend static build
npm run build:public

# Backend tidak memerlukan langkah build terpisah
# (langsung dijalankan dengan Node.js)
```

### SEO (Robots & Sitemap)

SEO publik digenerate otomatis oleh backend (bukan file statis di `frontend/public`):

- `GET /robots.txt`
- `GET /sitemap.xml`

Generator sitemap mengambil path statis + path dinamis kategori kamus/glosarium. Path statis mencakup halaman utama termasuk `gim/susun-kata/harian`, `gim/susun-kata/bebas`, dan `sumber`.

## Fitur yang Tersedia

Daftar ini disusun dari rute frontend dan endpoint backend yang ada saat ini. Jika sebuah kemampuan belum terlihat jelas dari route atau handler yang terpasang, fitur itu tidak saya klaim di sini.

### Area Publik

- **Beranda** (`/`) dengan kotak pencarian utama dan widget pencarian populer untuk domain `kamus`, `tesaurus`, `glosarium`, `makna`, dan `rima`.
- **Kamus** di `/kamus` dengan varian route untuk pencarian kata, filter kelas kata, filter tagar, kategori, dan detail entri di `/kamus/detail/:indeks`.
- **Interaksi kamus** melalui endpoint komentar publik: komentar dapat diambil dari `/api/publik/kamus/komentar/:indeks`, dan pengiriman komentar tersedia untuk pengguna terautentikasi.
- **Tesaurus** dengan route publik untuk contoh, autocomplete, pencarian, dan detail kata.
- **Glosarium** dengan pencarian, autocomplete, detail istilah, serta jelajah berdasarkan bidang dan sumber.
- **Makna** dengan halaman publik dan endpoint pencarian berdasarkan isi makna.
- **Rima** dengan halaman publik, contoh, autocomplete, dan pencarian.
- **Ejaan** tersedia sebagai halaman publik di `/ejaan` dan `/ejaan/:slug`.
- **Alat bahasa** di `/alat`, dengan halaman khusus untuk penghitung huruf dan penganalisis teks.
- **Gim kata** di `/gim`, terdiri dari `Kuis Kata` dan `Susun Kata`; backend publik menyediakan endpoint ronde, submit, puzzle, progres, validasi, dan klasemen.
- **Halaman informasi** untuk kebijakan privasi dan sumber.
- **Autentikasi pengguna** melalui Google OAuth, callback frontend `/auth/callback`, dan endpoint sesi `/api/pengguna/me`.

### Area Redaksi

- **Dasbor redaksi** di `/redaksi`.
- **Kamus**: daftar/detail entri, tambah, ubah, hapus, serta pengelolaan makna, contoh, dan tagar per entri.
- **Tesaurus**: daftar/detail dan operasi tambah, ubah, hapus.
- **Etimologi**: daftar/detail dan operasi tambah, ubah, hapus.
- **Glosarium**: daftar/detail dan operasi tambah, ubah, hapus.
- **Moderasi komentar** melalui modul komentar redaksi.
- **Audit** untuk makna dan tagar.
- **Master data** untuk bidang, bahasa, sumber, label, dan tagar.
- **Manajemen akses** untuk pengguna, peran, dan izin.
- **Pemantauan pencarian** melalui statistik pencarian dan daftar pencarian hitam.
- **Gim redaksi** untuk pengelolaan Susun Kata harian, Susun Kata bebas, dan Kuis Kata.
- **KADI** (`kandidat kata`) dengan statistik, detail, pembaruan data, perubahan status, penghapusan, atestasi, dan riwayat.

Semua route redaksi diproteksi oleh autentikasi dan pemeriksaan izin per endpoint. Artinya, tidak semua modul otomatis tersedia untuk setiap akun redaksi.

### Permukaan API yang Terlihat

- **Publik**: `health`, rumpun `kamus`, `makna`, `rima`, `tesaurus`, `glosarium`, interaksi pencarian populer, dan endpoint gim.
- **Sistem**: Google OAuth (`/auth/google`, `/auth/google/callback`), profil pengguna (`/api/pengguna/me`), `robots.txt`, `sitemap.xml`, dan `health`.
- **Redaksi**: `statistik`, `kamus`, `tesaurus`, `etimologi`, `glosarium`, `komentar`, `audit-makna`, `audit-tagar`, `bidang`, `bahasa`, `sumber`, `label`, `tagar`, `pengguna`, `peran`, `izin`, `pencarianHitam`, `susun-kata`, `kuis-kata`, dan `kandidat-kata`.

## Deployment (Render)

Project ini siap di-deploy sebagai **1 Web Service** (SSR + API) dari root repo.

- Gunakan blueprint [render.yaml](render.yaml)
- Build: `npm ci --include=dev && npm run sim:production:build`
- Start: `npm run sim:production:start`
- Health check: `/health`

Jika sebelumnya masih memakai pola 2 service (`kateglo-api` + static frontend), migrasikan domain utama ke service tunggal ini.

## Quality Checks

```bash
# Validasi lint + test per workspace
Set-Location backend; npm run lint; npm run test
Set-Location frontend; npm run lint; npm run test
```

## Project Structure

```
kateglo/
├── .github/              # Workflow dan panduan agent/Copilot
├── backend/              # Express.js API + SSR runtime (Port 3000)
│   ├── config/           # Logger dan konfigurasi backend
│   ├── db/               # PostgreSQL pool + query helper
│   ├── frontend/         # Artefak frontend untuk runtime production
│   │   └── dist/
│   ├── jobs/             # Job/background worker backend
│   ├── middleware/       # Auth, validation, limiter, error handler
│   ├── models/           # Fat model per domain
│   ├── routes/
│   │   ├── publik/       # Route API publik
│   │   ├── redaksi/      # Route API redaksi (protected)
│   │   └── sistem/       # Auth, cron, SEO, route sistem
│   ├── scripts/          # Utility scripts backend
│   ├── services/         # Service layer publik dan sistem
│   └── utils/            # Utility backend
├── frontend/             # App React publik + redaksi (Port 5173)
│   ├── public/           # Static public assets
│   ├── scripts/          # Build helpers, termasuk SSR build
│   └── src/
│       ├── api/          # API client (`apiPublik`, `apiAdmin`, `apiAuth`)
│       ├── components/   # Komponen reusable UI
│       ├── context/      # Auth context dan provider
│       ├── hooks/        # Custom hooks frontend
│       ├── pages/        # Halaman publik, auth, dan redaksi
│       ├── styles/       # Tailwind entry + stylesheet semantik
│       └── utils/        # Utility frontend
├── docs/                # Dokumentasi + SQL migrations + struktur data
└── _kode/                # Kode referensi (tidak untuk deployment)
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/kateglo
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
POPULAR_SEARCH_CACHE_TTL_SECONDS=300
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

## License

GPL-3.0 - Kode sumber aplikasi

## Credits

- Ivan Lanin - Creator & Lead Developer
- Romi Hardiyanto
- Arthur Purnama
- Pusat Bahasa Kemdikbud
- Komunitas Bahtera

## Links

- Website: https://kateglo.org
- GitHub: https://github.com/ivanlanin/kateglo2
