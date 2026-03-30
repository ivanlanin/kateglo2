# Pedoman Pengembangan Kateglo 2.0

<!-- MACHINE-METADATA
{
  "title": "Pedoman Pengembangan Kateglo 2.0",
  "version": "1.2",
  "lastUpdated": "2026-03-27",
  "shell": "powershell",
  "primary_audience": ["developers", "ai-agents"]
}
-->

## Table of Contents

- Architecture Overview
- Project Infrastructure
- Shell & CLI Conventions
- Python Runtime & Diagnostics
- Database Connection & Schema
- Backend Architecture Pattern
- Frontend Guidelines
- API Routes Structure
- Error Handling & Security
- Development Workflow
- Changelog
- Cheat-sheet (Quick Commands)

## Architecture Overview

**Kateglo** adalah kamus, tesaurus, dan glosarium bahasa Indonesia. Versi 2.0 adalah full rewrite dengan arsitektur modern.

**Stack:**
- Frontend: React 19 + Vite 6 + TailwindCSS 3 + React Router 7 + React Query 5 (Port 5173)
- Backend: Express.js 4 + PostgreSQL (Native PG) + Winston Logging (Port 3000)
- Database: PostgreSQL (hosted on Render, remote access via SSL)
- Authentication: JWT-based dengan role-based access control
- Redaksi: Terintegrasi dalam frontend di `/redaksi/*` (route terproteksi, akses redaksi + izin per endpoint)

## Project Infrastructure

### Root Project Structure
```
kateglo/
├── .github/              # GitHub workflows & copilot-instructions
├── backend/              # Express.js API + SSR runtime (Port 3000)
│   ├── config/           # Logger configuration
│   ├── db/               # PostgreSQL connection & query builder
│   ├── frontend/         # Frontend SSR build artifacts for production runtime
│   ├── jobs/             # Background jobs / scheduled tasks
│   ├── middleware/       # Auth, validation, limiter, error handler
│   ├── models/           # Database models (Fat Model pattern)
│   │   ├── akses/        # Pengguna, peran, izin
│   │   ├── audit/        # Audit makna
│   │   ├── gim/          # Susun Kata, Kuis Kata
│   │   ├── interaksi/    # Pencarian, komentar, pencarian hitam
│   │   ├── kadi/         # Kandidat entri (KADI)
│   │   ├── leksikon/     # Entri, glosarium, tesaurus, etimologi
│   │   ├── master/       # Label, tagar, opsi
│   │   └── wordnet/      # Sinset
│   ├── routes/           # API and system routes
│   │   ├── publik/       # Public routes (no auth)
│   │   │   ├── leksikon/ # Kamus, makna, rima, tesaurus, glosarium, ejaan
│   │   │   ├── interaksi/ # Pencarian, komentar
│   │   │   └── gim/      # Susun Kata, Kuis Kata
│   │   ├── redaksi/      # Redaksi routes (auth + authorization)
│   │   └── sistem/       # Auth, cron, SEO, and support routes
│   ├── scripts/          # Utility scripts (db-schema.js, start-production.js, etc.)
│   ├── services/         # Business logic layer
│   │   ├── publik/       # layananKamusPublik, layananGlosariumPublik, etc.
│   │   └── sistem/       # layananAuthGoogle, layananCache, layananSsrRuntime
│   └── utils/            # Shared backend utilities
│
├── frontend/             # Website publik + redaksi (Port 5173)
│   ├── public/           # Static assets + markdown content
│   │   ├── docs/         # changelog.md, todo.md
│   │   ├── ejaan/        # Panduan ejaan (markdown)
│   │   ├── gramatika/    # Tata bahasa TBBBI (markdown)
│   │   └── halaman/      # Halaman statis (alat, gim, info)
│   ├── scripts/          # Frontend build helpers (SSR/mobile)
│   └── src/
│       ├── api/          # API client (apiPublik, apiAdmin, apiAuth, apiKadi)
│       ├── components/   # Reusable components (data, formulir, gim, navigasi, panel, status, tampilan, tombol)
│       ├── context/      # Auth context (authContext), SSR prefetch (ssrPrefetchContext)
│       ├── hooks/        # Custom hooks (useCursorPagination, useNavigasiMemuat, etc.)
│       ├── pages/        # Public, auth, and redaksi pages
│       └── styles/       # TailwindCSS styles
│
├── _kode/                # Reference code (NOT committed)
│   ├── kateglo/          # Old PHP codebase (reference)
│   └── narakita/         # Modern reference project (patterns)
│
├── _data/                # Data migration scripts
├── docs/                # Documentation + SQL migrations + struktur data
│
└── package.json          # Root workspace configuration
```

### Key Files for AI Reference
- **Database Schema**: `docs/data/skema.sql` — MANDATORY reference before any DB work
- **Backend DB**: `backend/db/index.js` — PostgreSQL pool + query builder
- **Backend Models**: `backend/models/` — Fat model layer (all DB queries here)
- **API Router Entry**: `backend/routes/index.js` — mounts `publik`, `redaksi`, dan `pengguna`
- **Public Routes**: `backend/routes/publik/` — public endpoints
- **Redaksi Routes**: `backend/routes/redaksi/` — protected editorial endpoints
- **System Routes**: `backend/routes/sistem/` — auth, cron, SEO, route sistem
- **Frontend API**: `frontend/src/api/apiPublik.js` — API call functions (publik)
- **Admin API**: `frontend/src/api/apiAdmin.js` — API call functions (admin)
- **Frontend Auth API**: `frontend/src/api/apiAuth.js` — auth/session API client
- **KADI API**: `frontend/src/api/apiKadi.js` — KADI API client
- **Frontend Pages**: `frontend/src/pages/` — React page components
- **Public Page Routes**: `frontend/src/pages/publik/rutePublik.js`
- **Redaksi Page Routes**: `frontend/src/pages/redaksi/ruteRedaksi.js`
- **Frontend Layout Components**: `frontend/src/components/tampilan/`
- **Changelog**: `frontend/public/docs/changelog.md`
- **Todo**: `frontend/public/docs/todo.md`

## Shell & CLI Conventions

- **Shell**: PowerShell 7 (Windows)
- **Navigation**: Gunakan `Set-Location` atau `cd`, hindari `cd /d` (CMD-only)
- **Chaining**: Gunakan `;` untuk chaining commands
- **File Search**: `Select-String -Path "pattern" -Pattern "search"` (PowerShell equivalent of grep)

### JSON Escape Safety (Wajib untuk Agent/Tool Payload)
- Hindari path Windows mentah dengan backslash tunggal di payload JSON (contoh rawan: `C:\Kode\...` jika tidak di-escape benar).
- Untuk mencegah `Bad Unicode escape in JSON`, gunakan salah satu pola aman:
  - Ganti ke slash (`C:/Kode/Kateglo/kateglo/...`), atau
  - Escape backslash ganda secara konsisten (`C:\\Kode\\Kateglo\\kateglo\\...`).
- Jangan menulis sequence escape parsial seperti `\u`, `\x`, `\U` di string JSON kecuali memang escape valid lengkap.
- Saat menulis patch/tool input besar, pecah perubahan per blok kecil agar error encoding/escape mudah dilokalisasi.
- Setelah setiap patch signifikan, validasi cepat dengan lint/test terarah sebelum lanjut perubahan berikutnya.

## Python Runtime & Diagnostics

### Prinsip Umum
- Selalu gunakan interpreter dari virtual environment workspace.
- Hindari one-liner Python yang terlalu panjang di PowerShell (rawan gagal quoting).
- Untuk pemeriksaan data SQLite, utamakan snippet kecil (1-2 query per eksekusi).

### Interpreter Standar Workspace

```powershell
$py = "C:/Kode/Kateglo/kateglo/.venv/Scripts/python.exe"
```

### Diagnostik Cepat (Wajib sebelum analisis/migrasi SQLite)

```powershell
Set-Location "C:/Kode/Kateglo/kateglo"
$py = "C:/Kode/Kateglo/kateglo/.venv/Scripts/python.exe"

# 1) Cek runtime
& $py --version

# 2) Cek sqlite module + versi sqlite
& $py -c "import sqlite3; print(sqlite3.sqlite_version)"

# 3) Cek akses file db + query dasar
$code = @"
import sqlite3
conn = sqlite3.connect('_data/kbbi4.db')
cur = conn.cursor()
print('tables', cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'").fetchone()[0])
print('entri', cur.execute("SELECT COUNT(*) FROM entri").fetchone()[0])
conn.close()
print('diagnostic=OK')
"@
& $py -c $code
```

### Jika Eksekusi Sering "request cancelled"
- Pecah query besar menjadi beberapa query kecil.
- Gunakan file script sementara di `backend/` (prefix `check_`/`temp_`) daripada one-liner.
- Saat memakai PowerShell, pakai here-string (`@" ... "@`) untuk kode multi-baris.
- Setelah selesai, hapus script sementara (jangan commit).

## Database Connection & Schema

### Connection Architecture
- **Development**: Direct connection ke PostgreSQL eksternal via Render (DATABASE_URL)
- **SSL**: Auto-detected berdasarkan `render.com` dalam DATABASE_URL atau `DATABASE_SSL=true`
- **Pooling**: max 8 connections, 15s timeout, keepAlive enabled
- **Retry Logic**: Auto-retry 1x untuk transient connection errors

### Environment Variables (backend/.env)
```bash
DATABASE_URL=postgresql://user:password@host:port/kateglo
DATABASE_SSL=true  # Atau otomatis dari render.com URL
DB_POOL_MAX=8
DB_IDLE_TIMEOUT_MS=15000
DB_CONNECTION_TIMEOUT_MS=15000
```

### Database Query Pattern (MANDATORY)
```javascript
// ✅ CORRECT - Use query builder (chaining syntax)
const db = require('../db');
const { data } = await db.from('entri')
  .select('*')
  .eq('jenis', 'dasar')
  .order('indeks', true)
  .limit(20)
  .execute();

// ✅ ALSO CORRECT - Raw SQL for complex queries
const result = await db.query(
  'SELECT * FROM entri WHERE indeks ILIKE $1 LIMIT $2',
  [`%${search}%`, 20]
);
```

### Database Schema Reference (MANDATORY)
- **ALWAYS CHECK SCHEMA FIRST**: Sebelum membuat migration, query, atau mengubah model, WAJIB check `docs/data/skema.sql`
- **Generate/Update Schema**: `Set-Location backend; node scripts/sistem/db-schema.js`
- **Quick Search**: `Select-String -Path "docs/data/skema.sql" -Pattern "create table phrase"`

### Core Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `entri` | Entri kamus utama | indeks, aktif, jenis, jenis_rujuk |
| `makna` | Definisi/makna kata | entri_id, def_text, lex_class, discipline |
| `contoh` | Contoh penggunaan | makna_id, contoh_text |
| `etimologi` | Asal-usul kata | entri_id, bahasa, kata_asal |
| `tesaurus` | Sinonim, antonim | root_phrase, related_phrase, rel_type |
| `glosarium` | Istilah teknis bilingual | asing, makna, bahasa, bidang |
| `atestasi` | Kutipan/sitasi | entri_id, sumber, konteks |
| `bahasa` | Daftar bahasa | kode, nama |
| `bidang` | Bidang ilmu | kode, nama |
| `sumber` | Sumber referensi | kode, nama |
| `label` | Label/metadata | kategori, kode, nama |
| `tagar` | Tag entri (afiks, dll) | kode, kategori, subtipe |
| `entri_tagar` | Relasi entri-tagar | entri_id, tagar_id |
| `tipe_relasi` | Tipe relasi tesaurus | rel_type, rel_type_name |
| `pencarian` | Statistik pencarian (partisi bulanan) | kata, created_at |
| `pencarian_hitam` | Daftar hitam pencarian | kata, alasan |

### Game & Module Tables
| Table | Purpose |
|-------|---------||
| `kuis_kata` | Skor harian Kuis Kata per pengguna |
| `susun_kata` | Puzzle harian Susun Kata |
| `susun_kata_bebas` | Rekaman Susun Kata mode bebas |
| `susun_kata_skor` | Skor Susun Kata harian per pengguna |
| `kandidat_entri` | Kandidat kata KADI |
| `sinset` | Synset WordNet |
| `sinset_lema` | Relasi synset-lema |
| `relasi_sinset` | Relasi antar-synset |

### Access & Interaction Tables
| Table | Purpose |
|-------|---------||
| `pengguna` | Pengguna (OAuth, nama, email, peran) |
| `peran` | Daftar peran |
| `peran_izin` | Relasi peran-izin |
| `izin` | Daftar izin (permission codes) |
| `komentar` | Komentar pengguna |
| `riwayat_kurasi` | Riwayat kurasi editorial |

## Backend Architecture Pattern (MANDATORY)

### Router → Service → Model → Database

```javascript
// ❌ WRONG - Direct DB call in router
router.get('/', async (req, res) => {
  const result = await db.query('SELECT * FROM phrase');
  res.json(result.rows);
});

// ✅ CORRECT - Delegate to service/model
router.get('/', async (req, res) => {
  const entries = await ModelEntri.cariKamus(query, limit);
  res.json(entries);
});
```

**Layer Responsibilities:**
1. **Router (Thin)**: HTTP request/response handling, parameter extraction, validation
2. **Service (Optional)**: Business logic, data transformation, orchestration
3. **Model (Fat)**: ALL database queries, data aggregation, SQL construction
4. **Database**: PostgreSQL pool with retry logic

### Model Pattern Example
```javascript
// backend/models/leksikon/modelEntri.js
const db = require('../../db');

class ModelEntri {
  static async cariKamus(query, limit = 20) {
    const result = await db.query(
      'SELECT indeks, aktif, jenis FROM entri WHERE indeks ILIKE $1 ORDER BY indeks LIMIT $2',
      [`${query}%`, limit]
    );
    return result.rows;
  }

  static async ambilEntriByIndeks(indeks) {
    const result = await db.query(
      'SELECT * FROM entri WHERE LOWER(indeks) = LOWER($1)',
      [indeks]
    );
    return result.rows[0] || null;
  }
}
```

## Frontend Guidelines

### Component Structure
```jsx
// ✅ Functional component with hooks
function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button type="submit">Cari</button>
    </form>
  );
}
```

### API Calls with React Query
```jsx
import { useQuery } from '@tanstack/react-query';
import { cariKamus } from '../api/apiPublik';

function SearchResults({ query }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dictionary-search', query],
    queryFn: () => cariKamus(query),
    enabled: Boolean(query),
  });

  if (isLoading) return <div>Mencari...</div>;
  if (error) return <div>Gagal mengambil data.</div>;

  return <ul>{data?.data?.map(item => <li key={item.phrase}>{item.phrase}</li>)}</ul>;
}
```

### Routing (React Router 7)
```jsx
// Rute didefinisikan di:
// - frontend/src/pages/publik/rutePublik.js (publik)
// - frontend/src/pages/redaksi/ruteRedaksi.js (admin)
// Contoh rute publik:
//   /, /kamus, /kamus/cari/:kata, /kamus/detail/:indeks
//   /tesaurus, /makna, /rima, /ejaan, /gramatika
//   /glosarium, /glosarium/bidang/:bidang
//   /alat, /alat/penghitung-huruf, /alat/penganalisis-teks, /alat/pohon-kalimat
//   /gim, /gim/susun-kata/harian, /gim/susun-kata/bebas, /gim/kuis-kata
//   /ihwal, /privasi, /sumber
// Contoh rute redaksi:
//   /redaksi, /redaksi/kamus, /redaksi/tesaurus, /redaksi/etimologi
//   /redaksi/glosarium, /redaksi/audit-makna, /redaksi/audit-tagar
//   /redaksi/kuis-kata, /redaksi/susun-kata-harian, /redaksi/susun-kata-bebas
//   /redaksi/pengguna, /redaksi/peran, /redaksi/izin
//   /redaksi/kandidat-kata, /redaksi/sinset
```

### Styling: TailwindCSS
- Gunakan utility classes dari TailwindCSS
- Responsive: `sm:`, `md:`, `lg:` breakpoints
- Warna utama: blue-600/700 untuk actions, gray-50/100 untuk background
- Hindari inline style pada komponen React (`style={...}` tidak digunakan)
- Pusatkan styling komponen di `frontend/src/styles/index.css` (gunakan class semantik via `@layer components`)
- Untuk perubahan UI, tambah/ubah class di `index.css` terlebih dahulu, lalu referensikan class tersebut di JSX
- Hindari styling manual di file JSX/skrip untuk komponen layout utama
- Aktifkan dark mode dengan strategi class (`darkMode: 'class'`) dan sediakan toggle di footer setelah teks `Kateglo <versi>`

## API Routes Structure

### Public Routes (`/api/publik/`)
```
GET  /api/publik/health
# Leksikon
GET  /api/publik/kamus/...
GET  /api/publik/makna/...
GET  /api/publik/rima/...
GET  /api/publik/tesaurus/...
GET  /api/publik/glosarium/...
GET  /api/publik/ejaan/...
# Interaksi
POST /api/publik/pencarian/...
GET  /api/publik/komentar/...
# Gim
GET  /api/publik/gim/susun-kata/harian
GET  /api/publik/gim/susun-kata/bebas
POST /api/publik/gim/susun-kata/harian/submit
GET  /api/publik/gim/kuis-kata/ronde
POST /api/publik/gim/kuis-kata/submit
```

### System Routes
```
GET  /api/pengguna/me
GET  /auth/google
GET  /health
POST /cron/susun-kata/harian      # Cron: prefill puzzle harian
```

### Redaksi Routes (`/api/redaksi/`, auth required)
```
GET    /api/redaksi/health
GET    /api/redaksi/statistik
# Leksikon
GET|POST|PUT|DELETE /api/redaksi/kamus/:id
GET|POST|PUT|DELETE /api/redaksi/tesaurus/:id
GET|POST|PUT|DELETE /api/redaksi/etimologi/:id
GET|POST|PUT|DELETE /api/redaksi/glosarium/:id
# Gim
GET|POST|PUT|DELETE /api/redaksi/susun-kata/:id
GET|POST|PUT|DELETE /api/redaksi/kuis-kata/:id
# Audit
GET    /api/redaksi/audit-makna
GET    /api/redaksi/audit-tagar
# Interaksi
GET    /api/redaksi/komentar
GET    /api/redaksi/pencarianHitam
# Master data
GET    /api/redaksi/bidang|bahasa|sumber|label|tagar
# Akses
GET    /api/redaksi/pengguna|peran|izin
# Module
GET    /api/redaksi/kandidat-kata     # KADI
GET    /api/redaksi/sinset            # WordNet
```

## Error Handling & Security

### Error Handling
- Always use try-catch in async route handlers
- Return proper HTTP status codes (400, 404, 500)
- Log errors with Winston logger
- Return user-friendly error messages (Indonesian)

### Security
- ✅ Validate all inputs
- ✅ Use parameterized queries (prevent SQL injection)
- ✅ Sanitize output (prevent XSS)
- ✅ Rate limiting for public API
- ✅ CORS configured properly
- ✅ Helmet for HTTP security headers

### Input Validation Pattern
```javascript
const Joi = require('joi');

const searchSchema = Joi.object({
  q: Joi.string().min(1).max(255).required(),
  type: Joi.string().valid('kamus', 'glosarium', 'tesaurus').default('kamus'),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
```

## Development Workflow

### Running Development
```bash
# Run all services (from root)
npm run dev

# Or run individually
npm run dev:backend       # Port 3000
npm run dev:public        # Port 5173
```

### Validation Policy (Wajib Setelah Perubahan)
- Setelah selesai mengubah kode, **WAJIB jalankan lint dan test** untuk area yang diubah.
- Gunakan strategi bertahap: **validasi terarah dulu**, lalu meluas hanya bila perlu.
- Frontend (terarah): jalankan `npm run lint` lalu `npx vitest related --run <daftar-file-berubah>`.
- Backend (terarah): jalankan `npm run lint` lalu `npx jest --findRelatedTests <daftar-file-berubah>`.
- Jalankan full test package (`npm run test`) hanya jika:
  - perubahan lintas banyak modul/fitur,
  - menyentuh shared utilities, auth, routing utama, atau lapisan DB/model,
  - diminta eksplisit oleh user, atau
  - hasil test terarah mengindikasikan potensi regresi lebih luas.
- **Pengecualian**: jika perubahan **hanya data** (misalnya SQL migration, backfill data, dokumentasi `docs/`, tanpa perubahan kode aplikasi di `backend/` atau `frontend/src`), **tidak wajib** menjalankan lint/test.
- **Pengecualian frontend publik**: jika perubahan **hanya konten markdown** di `frontend/public/` (misalnya Gramatika, changelog, todo, atau dokumen publik lain) dan **tidak** mengubah komponen React, utilitas parser/renderer markdown, route, SSR, atau skrip yang membaca/menghasilkan konten tersebut, **tidak wajib** menjalankan lint/test.
- Jika perubahan markdown publik disertai perubahan pada renderer, parser, utilitas, SSR, atau skrip sinkronisasi/audit yang memprosesnya, perlakukan sebagai perubahan kode frontend biasa dan jalankan validasi.
- **Tidak perlu menjalankan build** sebagai langkah default validasi perubahan.
- Jika command `related/findRelatedTests` tidak tersedia atau gagal memetakan dependensi, gunakan test paling sempit yang relevan (folder/file test terkait), baru fallback ke full package.

### Rename File/Folder (Wajib)
- Untuk pengubahan nama file atau folder, **utamakan `git mv`** agar riwayat rename tetap terlacak.
- Setelah rename, **WAJIB** perbarui semua import/path yang terdampak.
- Setelah rename, **WAJIB** cek dan sesuaikan file test terkait (nama file test, import target, dan assertion yang relevan).
- Lanjutkan dengan lint + test pada package terdampak sesuai kebijakan validasi di atas.

Contoh per package:
```bash
Set-Location backend; npm run lint; npm run test
Set-Location frontend; npm run lint; npm run test
```

### Database Work
1. **Check schema first**: `Select-String -Path "docs/data/skema.sql" -Pattern "table_name"`
2. **Create migration**: Add SQL file to `docs/YYYYMM/` with format `YYYYMMDDHHMM_nama-migrasi.sql` (HHMM dari waktu pembuatan file)
3. **Run migration (default wajib)**: Setelah file SQL migration dibuat, **langsung eksekusi SQL tersebut** ke database target (development) pada sesi yang sama, kecuali user secara eksplisit meminta untuk tidak menjalankan.
4. **Run migration**: Use temp script in `backend/` atau `psql` dengan `DATABASE_URL` dari `backend/.env`
5. **Regenerate schema**: `Set-Location backend; node scripts/sistem/db-schema.js`
6. **Update models**: Update relevant model files

### Temporary Scripts & Database Checks
- **Location**: Skrip temporer HARUS di `backend/`
- **Naming**: Prefix `temp_` atau `check_` (e.g., `temp_check_data.js`)
- **Structure**:
  ```javascript
  require('dotenv').config({ path: '.env' });
  const db = require('./db');
  
  db.query("SELECT * FROM entri LIMIT 5")
    .then(r => { console.log(JSON.stringify(r.rows, null, 2)); db.close(); })
    .catch(e => { console.error(e.message); db.close(); });
  ```
- **Cleanup**: WAJIB hapus setelah selesai (jangan commit ke git)

## Changelog

- Catatan perubahan user-facing disimpan di `frontend/public/docs/changelog.md`.
- Daftar pekerjaan aktif disimpan di `frontend/public/docs/todo.md`.
- Untuk perubahan teknis detail, tetap buat dokumen periodik di `docs/YYYYMM/`.

## Changelog Manual Edit Policy

- Abaikan perubahan tak terduga pada `frontend/public/docs/changelog.md` karena user dapat mengubahnya secara manual.

## Cheat-sheet (Quick Commands)

```powershell
# Project root
Set-Location "C:\Kode\Kateglo\kateglo"

# Run development
npm run dev

# Generate database schema
Set-Location backend; node scripts/sistem/db-schema.js

# Check schema for a table
Select-String -Path "docs/data/skema.sql" -Pattern "create table entri"

# Kill port conflicts
npx kill-port 3000; npx kill-port 5173

# Run targeted tests first (recommended)
Set-Location frontend; npm run lint; npx vitest related --run src/components/tampilan/TataLetakPublik.jsx
Set-Location backend; npm run lint; npx jest --findRelatedTests models/leksikon/modelEntri.js

# Run full suite only when needed
Set-Location frontend; npm run test
Set-Location backend; npm run test

# Python diagnostics (SQLite source)
Set-Location "C:/Kode/Kateglo/kateglo"
$py = "C:/Kode/Kateglo/kateglo/.venv/Scripts/python.exe"
& $py --version
& $py -c "import sqlite3; print(sqlite3.sqlite_version)"
```

## Reference Code

Gunakan `_kode/` sebagai referensi:

- **Kateglo Lama** (`_kode/kateglo/`): Database schema, business logic, UI patterns dari PHP codebase
- **Narakita** (`_kode/narakita/`): Modern React patterns, testing strategies, clean architecture

## Important Conventions

### Naming
- **Files**: camelCase untuk JS files (e.g., `modelEntri.js`, `apiPublik.js`)
- **Components**: PascalCase (e.g., `SearchBar.jsx`, `DictionaryDetail.jsx`)
- **Constants**: camelCase (NOT SCREAMING_SNAKE_CASE)
- **Database**: snake_case (matching PostgreSQL convention)
- **Changelog docs**: `YYYYMMDDHHMM_nama-topik.md` (di `docs/YYYYMM/`, HHMM wajib untuk menghindari bentrok nama dalam satu hari)
- **SQL migration files**: `YYYYMMDDHHMM_nama-migrasi.sql` (di `docs/YYYYMM/`, HHMM wajib)

### Language
- **Code**: English (variable names, functions, comments in code)
- **UI Text**: Bahasa Indonesia (labels, messages, content)
- **Documentation**: Bahasa Indonesia untuk deskripsi, English untuk code snippets

### JSDoc Standards
- File header: `@fileoverview` dengan deskripsi lengkap
- Functions: `@param`, `@returns`, `@example`
- Keep documentation proportional to code complexity

### Deployment
Default deploy menggunakan single-service SSR + API dari root repo:
- Build: `npm ci --include=dev && npm run sim:production:build`
- Start: `npm run sim:production:start`
- Backend production akan melayani SSR frontend dari `backend/frontend/dist`
