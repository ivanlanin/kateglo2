# Kateglo 2.0

Kamus, Tesaurus, dan Glosarium Bahasa Indonesia - Versi Modern

## Arsitektur

Monorepo dengan 3 aplikasi terpisah:

- **backend/** - API Server (Express.js + PostgreSQL)
- **frontend-public/** - Situs Publik (React + Vite)
- **frontend-admin/** - Panel Admin (React + Vite)
- **shared/** - Utilities & Types bersama

## Tech Stack

### Backend
- Node.js 18+
- Express.js
- PostgreSQL (Native driver)
- Redis (caching)
- JWT Authentication

### Frontend
- React 19
- Vite
- TailwindCSS
- React Router
- React Query

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
npm install --prefix frontend-public
npm install --prefix frontend-admin
```

### Running Development

```bash
# Jalankan semua services sekaligus
npm run dev

# Atau jalankan terpisah
npm run dev:backend       # Backend di http://localhost:3000
npm run dev:public        # Public di http://localhost:5173
npm run dev:admin         # Admin di http://localhost:5174
```

### Building for Production

```bash
# Build semua
npm run build

# Build terpisah
npm run build:backend
npm run build:public
npm run build:admin
```

## Deployment (Render)

Project ini di-deploy sebagai 3 services terpisah di Render:

1. **kateglo-api** - Backend API (Web Service)
   - Build: `npm install --prefix backend`
   - Start: `npm start --prefix backend`

2. **kateglo-public** - Frontend Public (Static Site)
   - Build: `npm run build --prefix frontend-public`
   - Publish: `frontend-public/dist`

3. **kateglo-admin** - Frontend Admin (Static Site)
   - Build: `npm run build --prefix frontend-admin`
   - Publish: `frontend-admin/dist`

## Project Structure

```
kateglo2/
├── backend/              # Express.js API
│   ├── routes/
│   │   ├── api/public/   # Public routes
│   │   └── api/admin/    # Admin routes (protected)
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, validation, etc
│   └── db/               # Database connection
│
├── frontend-public/      # Public website
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   └── api/          # API client
│   └── public/
│
├── frontend-admin/       # Admin dashboard
│   ├── src/
│   │   ├── pages/        # Admin pages
│   │   ├── components/   # Admin components
│   │   └── api/          # API client
│   └── public/
│
├── shared/               # Shared code
│   ├── constants.js      # Constants
│   ├── types.ts          # TypeScript types
│   └── utils.js          # Utilities
│
├── _docs/                # Documentation
├── _sql/                 # Database schemas & migrations
└── _kode/                # Reference code (not committed)
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/kateglo
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000/api
```

## License

GPL-3.0 - Kode sumber aplikasi

CC-BY-NC-SA - Konten kamus, tesaurus, glosarium

## Credits

- Ivan Lanin - Creator & Lead Developer
- Romi Hardiyanto
- Arthur Purnama
- Pusat Bahasa Kemdikbud
- Komunitas Bahtera

## Links

- Website: https://kateglo.com
- API Docs: https://api.kateglo.com/docs
- Admin: https://admin.kateglo.com
- GitHub: https://github.com/ivanlanin/kateglo
