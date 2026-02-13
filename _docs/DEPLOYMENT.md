# Deployment Guide - Render

Panduan deploy Kateglo 2.0 ke Render dengan 3 services terpisah.

## Prerequisites

1. Akun Render (https://render.com)
2. Repository GitHub yang terhubung
3. Database PostgreSQL di Render

## Deployment Options

### Option A: Blueprint (Recommended)

Render Blueprint memungkinkan deploy semua services sekaligus dari file `render.yaml`.

1. Push code ke GitHub
2. Buka Render Dashboard
3. New → Blueprint
4. Connect repository
5. Render akan otomatis membuat:
   - `kateglo-api` (Web Service)
   - `kateglo-public` (Static Site)
   - `kateglo-admin` (Static Site)
   - `kateglo-db` (PostgreSQL)

### Option B: Manual Setup

#### 1. Setup Database

1. New → PostgreSQL
2. Name: `kateglo-db`
3. Database: `kateglo`
4. Region: Singapore
5. Plan: Starter (Free)
6. Create Database
7. Copy connection string

#### 2. Deploy Backend API

1. New → Web Service
2. Connect GitHub repository
3. Name: `kateglo-api`
4. Region: Singapore
5. Branch: `main`
6. Root Directory: (leave empty)
7. Build Command: `npm install --prefix backend`
8. Start Command: `npm start --prefix backend`
9. Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<your-postgres-connection-string>
   JWT_SECRET=<generate-random-string>
   CORS_ORIGIN=https://kateglo-public.onrender.com,https://kateglo-admin.onrender.com
   ```
10. Plan: Starter (Free)
11. Create Web Service

#### 3. Deploy Frontend Public

1. New → Static Site
2. Connect GitHub repository
3. Name: `kateglo-public`
4. Region: Singapore
5. Branch: `main`
6. Build Command: `npm install --prefix frontend && npm run build --prefix frontend`
7. Publish Directory: `frontend/dist`
8. Environment Variables:
   ```
   VITE_API_URL=https://kateglo-api.onrender.com
   ```
9. Auto-Deploy: Yes
10. Create Static Site

#### 4. Deploy Frontend Admin

1. New → Static Site
2. Connect GitHub repository
3. Name: `kateglo-admin`
4. Region: Singapore
5. Branch: `main`
6. Build Command: `npm install --prefix admin && npm run build --prefix admin`
7. Publish Directory: `admin/dist`
8. Environment Variables:
   ```
   VITE_API_URL=https://kateglo-api.onrender.com
   ```
9. Auto-Deploy: Yes
10. Create Static Site

## URLs

Setelah deploy, Anda akan mendapatkan 3 URLs:

```
Backend API:      https://kateglo-api.onrender.com
Frontend Public:  https://kateglo-public.onrender.com
Frontend Admin:   https://kateglo-admin.onrender.com
```

## Custom Domains (Optional)

### Backend API
1. Buka service `kateglo-api`
2. Settings → Custom Domains
3. Add domain: `api.kateglo.com`
4. Update DNS records (CNAME)

### Frontend Public
1. Buka service `kateglo-public`
2. Settings → Custom Domains
3. Add domain: `kateglo.com` dan `www.kateglo.com`
4. Update DNS records (A + CNAME)

### Frontend Admin
1. Buka service `kateglo-admin`
2. Settings → Custom Domains
3. Add domain: `admin.kateglo.com`
4. Update DNS records (CNAME)

## Database Migration

Setelah database ready, run migration:

```bash
# Connect ke database via psql
psql <your-postgres-connection-string>

# Import schema
\i _sql/schema.sql

# Import initial data (if any)
\i _sql/seed.sql
```

Atau gunakan script migration dari backend:

```bash
cd backend
node scripts/migrate.js
```

## Environment Variables Update

Setelah semua service deploy, update CORS_ORIGIN di backend:

```
CORS_ORIGIN=https://kateglo.com,https://admin.kateglo.com
```

Dan update VITE_API_URL di frontend (jika pakai custom domain):

```
VITE_API_URL=https://api.kateglo.com
```

## Monitoring

Render menyediakan:
- Logs real-time
- Metrics (CPU, Memory, Network)
- Health checks
- Auto-deploy on push

Dashboard: https://dashboard.render.com/

## Free Tier Limitations

Render Free Tier:
- ✅ 750 hours/month (Web Service)
- ✅ Unlimited Static Sites
- ✅ 90 days retention (PostgreSQL)
- ⚠️ Spin down after 15 minutes idle
- ⚠️ 512 MB RAM

**Spin Down Note**: Free tier web services spin down after inactivity. First request after idle akan butuh 30-60 detik untuk cold start.

Upgrade ke Paid Plan untuk:
- No spin down
- More RAM/CPU
- Background workers
- Redis support

## Troubleshooting

### Build Error: "Cannot find module"

Check package.json dependencies:
```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix admin
```

### CORS Error

Update CORS_ORIGIN di backend dengan URL yang benar:
```
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

### Database Connection Error

Check DATABASE_URL format:
```
postgresql://user:password@host:5432/database
```

### Frontend Tidak Load

Check VITE_API_URL di environment variables:
```
VITE_API_URL=https://your-api-url.onrender.com
```

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Status Page: https://status.render.com
