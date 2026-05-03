# Bohra Market 🌙

AI-powered community marketplace for the Dawoodi Bohra Muslim community — split into **3 independent apps**.

## Architecture

```
bohra-market/
├── apps/
│   ├── admin/              ← Admin panel
│   │   ├── backend/        FastAPI  — port 8001
│   │   └── frontend/       Next.js  — port 3001
│   ├── vendor/             ← Merchant/seller portal
│   │   ├── backend/        FastAPI  — port 8002
│   │   └── frontend/       Next.js  — port 3002
│   └── user/               ← Shopper storefront
│       ├── backend/        FastAPI  — port 8000
│       └── frontend/       Next.js  — port 3000
└── supabase/
    └── migrations/         SQL schema + seed data
```

All three apps share the **same Supabase database** but each has its own backend process and frontend, with only the routes and pages relevant to that role.

---

## Quick Start

### 1. Supabase Setup (once)
1. Create a project at [supabase.com](https://supabase.com)
2. Run in the SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`
3. Create a Storage bucket named `product-images` (public)

---

### 2. User App (Shopper Storefront) — port 3000 / 8000

```bash
# Backend
cd apps/user/backend
cp .env.example .env        # fill in your keys
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd apps/user/frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

---

### 3. Vendor App (Merchant Portal) — port 3002 / 8002

```bash
# Backend
cd apps/vendor/backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002

# Frontend
cd apps/vendor/frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3002
```

---

### 4. Admin App (Admin Panel) — port 3001 / 8001

```bash
# Backend
cd apps/admin/backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Frontend
cd apps/admin/frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3001
```

---

## What Each App Contains

### User App
| Layer | Contents |
|-------|---------|
| Backend | `/auth`, `/products`, `/orders`, `/ai/search`, `/ai/recommend`, `/ai/chat`, `/reviews`, `/wishlist` |
| Frontend | Home, Shop, Product detail, Cart, Checkout, Orders, Profile, Wishlist |

### Vendor App
| Layer | Contents |
|-------|---------|
| Backend | `/auth`, `/vendor/*`, `/products` (read), `/ai/vendor/description`, `/ai/product/tags` |
| Frontend | Login, Register, Dashboard, Products CRUD, Orders, Analytics, Membership |

### Admin App
| Layer | Contents |
|-------|---------|
| Backend | `/auth`, `/admin/*` (stats, vendors, users, products, membership plans) |
| Frontend | Login, Dashboard (charts), Vendors, Users, Products, Membership Plans |

---

## Ports at a Glance

| App | Frontend | Backend |
|-----|----------|---------|
| User | :3000 | :8000 |
| Admin | :3001 | :8001 |
| Vendor | :3002 | :8002 |
