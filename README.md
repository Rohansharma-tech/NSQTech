# MPloyChek — NSQTech Code Challenge

> **Candidate:** Rohan Sharma P · **Position:** Software Intern · **Deadline:** 10 Oct 2026

A full-stack employee record management platform built for the NSQTech code challenge.

---

## 🚀 Quick Start

### Prerequisites
| Tool | Version |
|------|---------|
| Node.js | v18+ |
| npm | v9+ |
| Docker + Docker Compose | Latest |
| Angular CLI | `npm i -g @angular/cli@19` |

### 1 — Start MongoDB (Docker)

```bash
docker-compose up -d mongodb
```

This starts MongoDB on `localhost:27017`. Data is persisted in a Docker volume.

### 2 — Backend

```bash
cd server
cp .env.example .env          # Edit JWT_SECRET in production
npm install
npm run seed                   # Seed demo users and records
npm run dev                    # Starts on http://localhost:3000
```

### 3 — Frontend

```bash
cd client
npm install
npm start                      # Starts on http://localhost:4200
```

The Angular dev server proxies `/api` → `http://localhost:3000` automatically.

---

## 🔐 Seed Credentials

| Role | User ID | Password |
|------|---------|----------|
| **Admin** | `admin01` | `Admin@123` |
| Admin 2 | `admin02` | `Admin@456` |
| General User | `user01` | `User@123` |
| General User | `user02` | `User@123` |
| Inactive User | `user03` | `User@123` |

> ⚠ Passwords are **bcrypt-hashed** (rounds=12). Never stored in plain text.

---

## ✨ Feature Walkthrough

### FR1 — Login Page
- Role dropdown: **General User** / **Admin**
- The backend validates that the submitted role **matches the stored role** — a mismatch returns the same generic `401` as a wrong password (no field leakage)
- Rate-limited to **10 attempts / 15 min** per IP
- API delay slider (0 → 10 s) for live async demonstration
- Quick-fill buttons for reviewer convenience

### FR2 — Dashboard (Logged-in Page)
- **User details card**: name, ID, role, last login, access level
- **Records table** filtered by role:
  - General Users → `accessLevel ≤ 2` records, **Read** access label
  - Admins → all records, **Read / Write / Delete** access label
- Table features: column sort, search (debounced 400 ms), category / status / priority filters, pagination
- All **three async states** — skeleton loaders, empty state, error state with retry

### FR3 — Admin User Management (`/admin`)
- List, create, edit, delete, activate/deactivate users, change roles
- Frontend: `adminGuard` blocks route; backend: `requireRole('admin')` middleware enforces it
- Business rules enforced on **both** sides:
  - Cannot delete yourself
  - Cannot remove / deactivate the last active admin
  - User IDs must be unique

### FR4 — Async Showcase
| Feature | Implementation |
|---------|----------------|
| Parallel profile + records load | `forkJoin` in `DashboardComponent.ngOnInit` |
| Independent loading states | Separate `profileLoading` and `recordsLoading` signals |
| Skeleton loaders | CSS shimmer animation, shown per-section |
| Global progress bar | `LoadingService` signal + `errorInterceptor` |
| Cancel stale requests | `switchMap` in `filterChange$` stream |
| Timeout + retry | `timeout(15000)` operator + **Retry** button |
| Search debounce | `debounceTime(400) + distinctUntilChanged` |
| API delay control | `?delay=<ms>` query param, capped at 10 s |

### FR5 — App Architecture
- `APP_INITIALIZER` validates token with `/api/auth/me` before first render
- `UserStateService` holds current user as **Angular signals**
- Lazy-loaded routes: `auth`, `dashboard`, `admin`
- HTTP interceptors: `authInterceptor` (attaches JWT) + `errorInterceptor` (401 → auto-logout)

---

## 🏗 Architecture

```
NSQTech/
├── client/                        # Angular 19 SPA
│   └── src/app/
│       ├── core/
│       │   ├── guards/            # authGuard, adminGuard, guestGuard
│       │   ├── interceptors/      # authInterceptor, errorInterceptor
│       │   ├── initializers/      # APP_INITIALIZER (session restore)
│       │   └── services/          # UserStateService, AuthApiService, ...
│       ├── shared/
│       │   └── models/            # TypeScript interfaces (User, Record, ...)
│       └── features/
│           ├── auth/login/        # LoginComponent
│           ├── dashboard/         # DashboardComponent (forkJoin, switchMap)
│           └── admin/             # AdminComponent (full CRUD)
│
├── server/                        # Node.js + Express + TypeScript
│   └── src/
│       ├── config/                # MongoDB connection
│       ├── controllers/           # auth, record, user
│       ├── middleware/            # auth (JWT), delay, validation (Zod)
│       ├── models/                # Mongoose schemas (User, Record)
│       ├── repositories/          # DB abstraction layer
│       ├── routes/                # Express routers
│       ├── services/              # Business logic
│       └── scripts/seed.ts        # Demo data seeder
│
└── docker-compose.yml             # MongoDB service
```

### Backend Request Flow

```
HTTP Request
  → Rate Limiter (express-rate-limit)
  → CORS + Helmet
  → delayMiddleware (?delay=ms)
  → authMiddleware (JWT verify)
  → requireRole ('admin' | 'general')
  → Controller → Service → Repository → MongoDB
  → JSON Response
```

---

## 🛡 Security

| Area | Implementation |
|------|---------------|
| Password storage | bcrypt (12 rounds) |
| Token auth | JWT (HS256, 24h expiry) |
| Role enforcement | Backend middleware (`requireRole`) — frontend guards are UX only |
| Input validation | Zod schemas on all write endpoints |
| Rate limiting | 10 login attempts / 15 min per IP |
| CORS | Restricted to Angular dev origin |
| Helmet | Security headers |
| Secrets | `.env` only (gitignored); `.env.example` provided |
| Token expiry | 401 → auto-logout + redirect via HTTP interceptor |

---

## ☁ Cloud Deployment Notes

This maps directly to a production cloud setup:

| Layer | Local | Cloud |
|-------|-------|-------|
| Database | MongoDB (Docker) | **MongoDB Atlas** or **AWS DynamoDB** (repository pattern makes it swappable) |
| API Server | `ts-node-dev` | **AWS ECS / Fargate** or **AWS Lambda + API Gateway** |
| Frontend | Angular dev server | **AWS S3 + CloudFront** (static hosting) |
| Auth | JWT in `.env` | **AWS Secrets Manager** for `JWT_SECRET` |
| Environment | `.env` file | **AWS Systems Manager Parameter Store** |

The `UserRepository` / `RecordRepository` abstraction means swapping MongoDB for DynamoDB requires only a new repository implementation — no service or controller changes.

---

## 🧪 Tests

```bash
# Backend unit tests (Jest + Supertest)
cd server && npm test

# Angular unit tests (Karma)
cd client && npm test
```

Tests cover: auth controller (login, /me), JWT middleware, and service business rules.

---

## 📦 Scripts Reference

| Command | Description |
|---------|-------------|
| `docker-compose up -d mongodb` | Start MongoDB |
| `cd server && npm run dev` | Start API (dev) |
| `cd server && npm run seed` | Seed demo data |
| `cd server && npm run build` | Build for production |
| `cd client && npm start` | Start Angular (dev) |
| `cd client && npm run build` | Build Angular (prod) |

---

## 📋 Edge Cases Handled

- ✅ Wrong password vs wrong role → same generic `401` (no field leakage)
- ✅ Expired / tampered token → auto-logout + redirect
- ✅ Page refresh → session restored via `APP_INITIALIZER`
- ✅ General User typing `/admin` → redirected to `/dashboard`
- ✅ Direct API call to admin endpoint → `403`
- ✅ Rapid filter changes → `switchMap` cancels stale requests
- ✅ Long delay → `timeout(15000)` + retry button
- ✅ Inactive account → `403` on login
- ✅ Last admin protection → cannot delete or deactivate
- ✅ Duplicate User ID → `409` with clear error
- ✅ Empty DB / no records → empty state UI

---

*Built with ❤ for NSQTech · Angular 19 + Node.js + Express + MongoDB*
