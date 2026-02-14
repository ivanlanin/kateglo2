# Claude Code Guidelines - Kateglo 2.0

## 🎯 Project Overview

**Kateglo** adalah kamus, tesaurus, dan glosarium bahasa Indonesia. Versi 2.0 adalah full rewrite dengan arsitektur modern.

**Stack**: React 19 + Vite (Frontend), Express.js + PostgreSQL (Backend), Monorepo

## 📁 Project Structure

```
kateglo2/
├── backend/              # Express.js API (Port 3000)
│   ├── routes/api/
│   │   ├── public/       # Public routes (no auth)
│   │   └── admin/        # Admin routes (auth required)
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, validation
│   └── db/               # PostgreSQL connection
│
├── frontend/      # Public website (Port 5173)
│   └── src/
│       ├── halaman/      # Page components
│       ├── komponen/     # Reusable components
│       └── api/          # API client
│
├── admin/       # Admin dashboard (Port 5174)
│   └── src/
│       ├── pages/        # Admin pages
│       ├── components/   # Admin components
│       └── api/          # API client
│
├── shared/               # Shared utilities & constants
│   ├── constants.js
│   └── utils.js
│
├── _kode/                # Reference code (NOT committed)
│   ├── kateglo/          # Old PHP codebase
│   └── narakita/         # Modern reference project
│
├── _docs/                # Documentation + SQL migrations + struktur data
└── render.yaml           # Render deployment config
```

## 🏗️ Architecture

### Backend Pattern: Router → Model → Database

```javascript
// ❌ WRONG - Direct DB call in router
router.get('/', async (req, res) => {
  const result = await db.query('SELECT * FROM phrases');
  res.json(result.rows);
});

// ✅ CORRECT - Delegate to model
router.get('/', async (req, res) => {
  const phrases = await Phrase.getAll();
  res.json(phrases);
});
```

### Database: Native PostgreSQL (NO ORM)

```javascript
// ✅ Query builder syntax
const { data } = await db.from('phrases')
  .select('*')
  .eq('lex_class', 'n')
  .order('phrase', true)
  .limit(20);

// ✅ Raw SQL for complex queries
const result = await db.query(
  'SELECT * FROM phrases WHERE phrase ILIKE $1',
  [`%${search}%`]
);
```

## 🔑 Key Conventions

### API Routes Structure

```
Public Routes (no auth):
GET  /api/public/health
GET  /api/public/search?q=kata&type=dictionary
GET  /api/public/dictionary/:slug
GET  /api/public/glossary
GET  /api/public/proverb

Admin Routes (auth required):
GET    /api/admin/phrases
POST   /api/admin/phrases
PUT    /api/admin/phrases/:id
DELETE /api/admin/phrases/:id
GET    /api/admin/analytics
```

### Environment Variables

**Backend (.env)**
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/kateglo
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3000
```

## 🚀 Development Workflow

### Initial Setup

```bash
# Install dependencies
npm install

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp admin/.env.example admin/.env

# Edit .env files with your values
```

### Running Development

```bash
# Run all services
npm run dev

# Or run individually
npm run dev:backend       # Port 3000
npm run dev:public        # Port 5173
npm run dev:admin         # Port 5174
```

### Database Work

1. **Check schema first**: `code _docs/struktur-data.sql`
2. **Create migration**: Add SQL file to `_docs/YYYYMM/` dengan format `YYYYMMDD_nama-migrasi.sql`
3. **Run migration**: `psql $DATABASE_URL < _docs/YYYYMM/YYYYMMDD_nama-migrasi.sql`
4. **Update models**: Update relevant model files

### Testing

```bash
# Run all tests
npm test

# Test specific workspace
npm run test --prefix backend
npm run test --prefix frontend
npm run test --prefix admin
```

## 📚 Reference Code

Gunakan `_kode/` sebagai referensi:

**Kateglo (Lama)** - `_kode/kateglo/`:
- Database schema di `docs/data/kateglo.sql`
- Business logic di `modules/`
- Lihat pola CRUD dan validasi

**Narakita** - `_kode/narakita/`:
- Modern React patterns
- Testing strategies
- Clean architecture examples
- Refer to `CLAUDE.md` untuk best practices

## 🗄️ Database Schema (Legacy)

Lihat `_kode/kateglo/docs/data/kateglo.sql` untuk schema lengkap.

**Core Tables**:
- `phrases` - Entri kamus utama
- `definitions` - Definisi kata
- `relations` - Sinonim, antonim
- `glossary` - Istilah teknis
- `proverbs` - Peribahasa

## 🎨 Frontend Guidelines

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
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Cari</button>
    </form>
  );
}
```

### API Calls with React Query

```jsx
import { useQuery } from '@tanstack/react-query';

function Dictionary({ slug }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dictionary', slug],
    queryFn: () => fetch(`/api/public/dictionary/${slug}`).then(r => r.json())
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.phrase}</div>;
}
```

## 🔧 Linting

**WAJIB**: Jalankan lint setelah setiap perubahan kode.

```bash
# Lint semua workspace
npm run lint

# Lint per workspace
npm run lint --prefix backend
npm run lint --prefix frontend
npm run lint --prefix admin

# Auto-fix
npm run lint:fix --prefix backend
npm run lint:fix --prefix frontend
npm run lint:fix --prefix admin
```

- Semua warning dan error harus diperbaiki sebelum commit
- Variabel yang tidak dipakai harus dihapus (atau diberi prefiks `_` jika memang diperlukan sebagai parameter)
- Konfigurasi ESLint ada di `.eslintrc.json` masing-masing workspace

## 🚨 Important Rules

### Authentication
- Public routes: NO auth required
- Admin routes: JWT auth + role check
- Use middleware for protection

### Error Handling
- Always use try-catch in async functions
- Return proper HTTP status codes
- Log errors with winston

### Security
- ✅ Validate all inputs (Joi)
- ✅ Use parameterized queries (prevent SQL injection)
- ✅ Sanitize output (prevent XSS)
- ✅ Rate limiting for public API
- ✅ CORS configured properly

### Performance
- ✅ Use database indexes
- ✅ Implement caching (Redis)
- ✅ Pagination for large datasets
- ✅ Lazy loading for frontend

## 📦 Deployment

Deploy ke Render dengan 3 services:
- `kateglo-api` - Backend (Web Service)
- `kateglo-public` - Frontend Public (Static Site)
- `kateglo-admin` - Frontend Admin (Static Site)

Lihat `render.yaml` untuk detail.

## 🔍 Troubleshooting

**Port already in use**:
```bash
# Kill process on port
npx kill-port 3000
npx kill-port 5173
npx kill-port 5174
```

**Database connection error**:
```bash
# Test connection
psql $DATABASE_URL
```

**CORS error**:
Check CORS_ORIGIN in backend .env matches frontend URL.

## 📖 Documentation

- README.md - Project overview
- _kode/narakita/CLAUDE.md - Advanced patterns
- _kode/kateglo/README.md - Legacy system reference

---

**Philosophy**: Clean architecture, test-driven, performance-optimized, user-focused.
