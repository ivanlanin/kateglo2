# Kateglo 2.0

Kamus, Tesaurus, dan Glosarium Bahasa Indonesia — versi modern.

## Arsitektur

Monorepo dengan 2 aplikasi utama:

- **backend/** — API Server (Express.js + PostgreSQL)
- **frontend/** — Situs publik + panel redaksi terintegrasi (`/redaksi/*`)

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

## Fitur Utama

- Pencarian kamus (prefix-first + fallback contains)
- Detail entri: makna, contoh, subentri, tesaurus, glosarium
- Login Google + RBAC untuk redaksi
- Panel redaksi terintegrasi di frontend (`/redaksi/*`)
- Sidebar komentar pada halaman detail kamus per `indeks`:
   - pengguna login dapat melihat komentar terbaca dan mengirim komentar
   - pengguna belum login melihat teaser jumlah komentar aktif
   - moderasi komentar dilakukan dari halaman redaksi `Komentar`

## Deployment (Render)

Project ini siap di-deploy sebagai **1 Web Service** (SSR + API) dari root repo.

- Gunakan blueprint [render.yaml](render.yaml)
- Build: `npm ci && npm run sim:production:build`
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
kateglo2/
├── backend/              # Express.js API (Port 3000)
│   ├── routes/
│   │   ├── publik/       # Public routes
│   │   └── redaksi/      # Admin routes (protected)
│   ├── models/           # Database models (fat model)
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, validation, limiter
│   └── db/               # PostgreSQL connection
│
├── frontend/             # Public website + redaksi (Port 5173)
│   ├── src/
│   │   ├── halaman/      # Halaman publik + redaksi
│   │   ├── komponen/     # Reusable components
│   │   ├── api/          # API client
│   │   └── utils/        # Utilities frontend
│   └── public/
│
├── _docs/                # Documentation + SQL migrations + struktur data
└── _kode/                # Reference code (not committed)
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/kateglo
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
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
