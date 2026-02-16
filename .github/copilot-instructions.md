# Pedoman Pengembangan Kateglo 2.0

<!-- MACHINE-METADATA
{
  "title": "Pedoman Pengembangan Kateglo 2.0",
  "version": "1.0",
  "lastUpdated": "2026-02-14",
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
- Admin: Terintegrasi dalam frontend di `/admin/*` (route terproteksi, hanya role admin)

## Project Infrastructure

### Root Project Structure
```
kateglo2/
├── .github/              # GitHub workflows & copilot-instructions
├── backend/              # Express.js API (Port 3000)
│   ├── config/           # Logger configuration
│   ├── db/               # PostgreSQL connection & query builder
│   ├── middleware/        # Auth, validation, error handler
│   ├── models/           # Database models (Fat Model pattern)
│   ├── routes/api/       # API routes
│   │   ├── public/       # Public routes (no auth)
│   │   └── admin/        # Admin routes (auth required)
│   ├── scripts/          # Utility scripts (db-schema.js, etc.)
│   └── services/         # Business logic layer
│
├── frontend/             # Website publik + admin (Port 5173)
│   └── src/
│       ├── api/          # API client (axios + publicApi + apiAdmin)
│       ├── context/      # Auth context (authContext)
│       ├── komponen/     # Reusable components
│       ├── halaman/      # Page components (publik)
│       │   └── admin/    # Admin pages (terproteksi)
│       └── styles/       # TailwindCSS styles
│
├── _kode/                # Reference code (NOT committed)
│   ├── kateglo/          # Old PHP codebase (reference)
│   └── narakita/         # Modern reference project (patterns)
│
├── _data/                # Data migration scripts
├── _docs/                # Documentation + SQL migrations + struktur data
│
└── package.json          # Root workspace configuration
```

### Key Files for AI Reference
- **Database Schema**: `_docs/struktur-data.sql` — MANDATORY reference before any DB work
- **Backend DB**: `backend/db/index.js` — PostgreSQL pool + query builder
- **Backend Models**: `backend/models/` — Fat model layer (all DB queries here)
- **API Routes**: `backend/routes/api/public/` — Public endpoints
- **Frontend API**: `frontend/src/api/apiPublik.js` — API call functions (publik)
- **Admin API**: `frontend/src/api/apiAdmin.js` — API call functions (admin)
- **Frontend Pages**: `frontend/src/halaman/` — React page components
- **Admin Pages**: `frontend/src/halaman/admin/` — Admin page components

## Shell & CLI Conventions

- **Shell**: PowerShell 7 (Windows)
- **Navigation**: Gunakan `Set-Location` atau `cd`, hindari `cd /d` (CMD-only)
- **Chaining**: Gunakan `;` untuk chaining commands
- **File Search**: `Select-String -Path "pattern" -Pattern "search"` (PowerShell equivalent of grep)

### JSON Escape Safety (Wajib untuk Agent/Tool Payload)
- Hindari path Windows mentah dengan backslash tunggal di payload JSON (contoh rawan: `C:\Kode\...` jika tidak di-escape benar).
- Untuk mencegah `Bad Unicode escape in JSON`, gunakan salah satu pola aman:
  - Ganti ke slash (`C:/Kode/Kateglo/kateglo2/...`), atau
  - Escape backslash ganda secara konsisten (`C:\\Kode\\Kateglo\\kateglo2\\...`).
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
$py = "C:/Kode/Kateglo/kateglo2/.venv/Scripts/python.exe"
```

### Diagnostik Cepat (Wajib sebelum analisis/migrasi SQLite)

```powershell
Set-Location "C:/Kode/Kateglo/kateglo2"
$py = "C:/Kode/Kateglo/kateglo2/.venv/Scripts/python.exe"

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
const { data } = await db.from('phrase')
  .select('*')
  .eq('lex_class', 'n')
  .order('phrase', true)
  .limit(20)
  .execute();

// ✅ ALSO CORRECT - Raw SQL for complex queries
const result = await db.query(
  'SELECT * FROM phrase WHERE phrase ILIKE $1 LIMIT $2',
  [`%${search}%`, 20]
);
```

### Database Schema Reference (MANDATORY)
- **ALWAYS CHECK SCHEMA FIRST**: Sebelum membuat migration, query, atau mengubah model, WAJIB check `_docs/struktur-data.sql`
- **Generate/Update Schema**: `Set-Location backend; node scripts/db-schema.js`
- **Quick Search**: `Select-String -Path "_docs/struktur-data.sql" -Pattern "create table phrase"`

### Core Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `phrase` | Entri kamus utama | phrase, lex_class, phrase_type, actual_phrase, info |
| `definition` | Definisi kata | phrase, def_num, def_text, lex_class, discipline |
| `relation` | Sinonim, antonim, tesaurus | root_phrase, related_phrase, rel_type |
| `glossary` | Istilah teknis bilingual | phrase, original, discipline, ref_source |
| `proverb` | Peribahasa | phrase, proverb, meaning, prv_type |
| `abbr_entry` | Singkatan/akronim | abbr_key, abbr_id, abbr_en, abbr_type |
| `lexical_class` | Kelas kata (n, v, adj, dll) | lex_class, lex_class_name |
| `discipline` | Bidang ilmu | discipline, discipline_name |
| `ref_source` | Sumber referensi | ref_source, ref_source_name |
| `relation_type` | Tipe relasi (s/c/etc) | rel_type, rel_type_name |
| `searched_phrase` | Statistik pencarian | phrase, search_count |

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
  const phrases = await PhraseModel.searchDictionary(query, limit);
  res.json(phrases);
});
```

**Layer Responsibilities:**
1. **Router (Thin)**: HTTP request/response handling, parameter extraction, validation
2. **Service (Optional)**: Business logic, data transformation, orchestration
3. **Model (Fat)**: ALL database queries, data aggregation, SQL construction
4. **Database**: PostgreSQL pool with retry logic

### Model Pattern Example
```javascript
// backend/models/modelFrasa.js
const db = require('../db');

class ModelFrasa {
  static async searchDictionary(query, limit = 20) {
    // Prefix search first, then contains fallback
    const prefixResult = await db.query(
      'SELECT phrase, lex_class FROM phrase WHERE phrase ILIKE $1 ORDER BY phrase LIMIT $2',
      [`${query}%`, limit]
    );
    return prefixResult.rows;
  }

  static async getPhraseBySlug(slug) {
    const result = await db.query(
      'SELECT * FROM phrase WHERE LOWER(phrase) = LOWER($1)',
      [slug]
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
import { searchDictionary } from '../api/publicApi';

function SearchResults({ query }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dictionary-search', query],
    queryFn: () => searchDictionary(query),
    enabled: Boolean(query),
  });

  if (isLoading) return <div>Mencari...</div>;
  if (error) return <div>Gagal mengambil data.</div>;

  return <ul>{data?.data?.map(item => <li key={item.phrase}>{item.phrase}</li>)}</ul>;
}
```

### Routing (React Router 7)
```jsx
// frontend/src/App.jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/kamus/:slug" element={<Dictionary />} />
  <Route path="/glosarium" element={<Glossary />} />
  <Route path="/peribahasa" element={<Proverb />} />
  <Route path="/singkatan" element={<Abbreviation />} />
</Routes>
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

### Public Routes (no auth)
```
GET  /api/public/search?q=kata&type=dictionary&limit=20
GET  /api/public/dictionary/:slug
GET  /api/public/glossary?q=&discipline=&source=&limit=20
GET  /api/public/proverb?q=&limit=20
GET  /api/public/abbreviation?q=&limit=20
GET  /api/public/stats        (homepage statistics)
GET  /api/public/health
```

### Admin Routes (auth required)
```
POST   /api/admin/auth/login
GET    /api/admin/phrases
POST   /api/admin/phrases
PUT    /api/admin/phrases/:id
DELETE /api/admin/phrases/:id
GET    /api/admin/analytics
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
  type: Joi.string().valid('dictionary', 'glossary', 'proverb').default('dictionary'),
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
- **Tidak perlu menjalankan build** sebagai langkah default validasi perubahan.
- Prioritaskan validasi terarah dulu (misalnya per package yang terdampak), baru meluas jika diperlukan.

Contoh per package:
```bash
Set-Location backend; npm run lint; npm run test
Set-Location frontend; npm run lint; npm run test
```

### Database Work
1. **Check schema first**: `Select-String -Path "_docs/struktur-data.sql" -Pattern "table_name"`
2. **Create migration**: Add SQL file to `_docs/YYYYMM/` with format `YYYYMMDD_nama-migrasi.sql`
3. **Run migration**: Use temp script in `backend/`
4. **Regenerate schema**: `Set-Location backend; node scripts/db-schema.js`
5. **Update models**: Update relevant model files

### Temporary Scripts & Database Checks
- **Location**: Skrip temporer HARUS di `backend/`
- **Naming**: Prefix `temp_` atau `check_` (e.g., `temp_check_data.js`)
- **Structure**:
  ```javascript
  require('dotenv').config({ path: '.env' });
  const db = require('./db');
  
  db.query("SELECT * FROM phrase LIMIT 5")
    .then(r => { console.log(JSON.stringify(r.rows, null, 2)); db.close(); })
    .catch(e => { console.error(e.message); db.close(); });
  ```
- **Cleanup**: WAJIB hapus setelah selesai (jangan commit ke git)

## Changelog

- Catatan perubahan user-facing disimpan di `frontend/public/changelog.md`.
- Daftar pekerjaan aktif disimpan di `frontend/public/todo.md`.
- Untuk perubahan teknis detail, tetap buat dokumen periodik di `_docs/YYYYMM/`.

## Changelog Manual Edit Policy

- Abaikan perubahan tak terduga pada `frontend/public/changelog.md` karena user dapat mengubahnya secara manual.

## Cheat-sheet (Quick Commands)

```powershell
# Project root
Set-Location "C:\Kode\Kateglo\kateglo2"

# Run development
npm run dev

# Generate database schema
Set-Location backend; node scripts/db-schema.js

# Check schema for a table
Select-String -Path "_docs/struktur-data.sql" -Pattern "create table phrase"

# Kill port conflicts
npx kill-port 3000; npx kill-port 5173

# Run backend tests
Set-Location backend; npx jest --no-watch

# Run lint + tests (recommended after changes)
Set-Location frontend; npm run lint; npm run test
Set-Location backend; npm run lint; npm run test

# Python diagnostics (SQLite source)
Set-Location "C:/Kode/Kateglo/kateglo2"
$py = "C:/Kode/Kateglo/kateglo2/.venv/Scripts/python.exe"
& $py --version
& $py -c "import sqlite3; print(sqlite3.sqlite_version)"
```

## Reference Code

Gunakan `_kode/` sebagai referensi:

- **Kateglo Lama** (`_kode/kateglo/`): Database schema, business logic, UI patterns dari PHP codebase
- **Narakita** (`_kode/narakita/`): Modern React patterns, testing strategies, clean architecture

## Important Conventions

### Naming
- **Files**: camelCase untuk JS files (e.g., `modelFrasa.js`, `apiPublik.js`)
- **Components**: PascalCase (e.g., `SearchBar.jsx`, `DictionaryDetail.jsx`)
- **Constants**: camelCase (NOT SCREAMING_SNAKE_CASE)
- **Database**: snake_case (matching PostgreSQL convention)
- **Changelog docs**: `YYYYMMDD_nama-topik.md` (di `_docs/YYYYMM/`)
- **SQL migration files**: `YYYYMMDD_nama-migrasi.sql` (di `_docs/YYYYMM/`)

### Language
- **Code**: English (variable names, functions, comments in code)
- **UI Text**: Bahasa Indonesia (labels, messages, content)
- **Documentation**: Bahasa Indonesia untuk deskripsi, English untuk code snippets

### JSDoc Standards
- File header: `@fileoverview` dengan deskripsi lengkap
- Functions: `@param`, `@returns`, `@example`
- Keep documentation proportional to code complexity

### Deployment
Deploy ke Render dengan 2 services:
- `kateglo-api` — Backend (Web Service)
- `kateglo-public` — Frontend Public + Admin (Static Site)
