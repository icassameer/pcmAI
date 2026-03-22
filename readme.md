# InventoPro — Inventory Management System

A full-stack GST billing and inventory management system for Indian businesses, built as a pnpm monorepo.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| Node.js | v24 |
| Language | TypeScript 5.9 |
| Backend | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Frontend | React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui |
| Validation | Zod v3, drizzle-zod |
| API Codegen | Orval (from OpenAPI spec) |
| Build | esbuild (CJS bundle) |
| Auth | JWT (access + refresh tokens, bcrypt) |
| PDF | pdfkit (invoice generation) |
| AI | OpenAI (dashboard insights) |

---

## Project Structure

```
inventopro-source-code/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   └── inventory-app/      # React + Vite frontend (port 5173)
├── lib/
│   ├── api-spec/           # OpenAPI 3.1 spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/  # OpenAI server-side helpers
├── scripts/
│   └── src/seed.ts         # Database seed script
├── pnpm-workspace.yaml     # Workspace + catalog version config
├── tsconfig.base.json      # Shared TS config (composite: true)
├── tsconfig.json           # Root TS project references
└── package.json            # Root scripts
```

---

## Prerequisites

- **Node.js** v24+ — https://nodejs.org
- **pnpm** v10+ — `npm install -g pnpm`
- **PostgreSQL** v14+ — local install or Docker

---

## Local Setup (Windows / Linux / Mac)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment file

Create `.env` inside `artifacts/api-server/`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/inventopro
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
PORT=8080

# Optional — only needed for AI dashboard insights
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-key-here
```

> ⚠️ If JWT secrets are not set, they fall back to `crypto.randomBytes()` — tokens won't survive server restarts.

### 3. Set up the database

```bash
# Create the database in PostgreSQL first
psql -U postgres -c "CREATE DATABASE inventopro;"

# Run migrations (Drizzle push)
pnpm --filter @workspace/db run push

# Seed with demo data
pnpm --filter @workspace/scripts run seed
```

### 4. Run the app

Open two terminals:

```bash
# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/inventory-app run dev
```

Open http://localhost:5173 in your browser.

**Default login:** `admin@demo.com` / `Admin@123`

---

## Root Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm run typecheck` | TypeScript check across all packages |
| `pnpm run build` | Typecheck + build all packages |

> Always typecheck from the root — never from inside individual packages.

---

## User Roles

| Role | Access |
|------|--------|
| `super_admin` | Full access + user management |
| `admin` | Full access except user deactivation |
| `store_keeper` | Products, purchases, stock |
| `accountant` | Sales, purchases, reports |
| `viewer` | Read-only access |

---

## Application Features

- **Authentication** — JWT with access + refresh tokens, account locking after failed attempts
- **Products** — CRUD with categories, HSN codes, GST rates, SKU, units, stock tracking
- **Purchases** — Supplier purchases with automatic stock updates, GST calculations, payment tracking
- **Sales** — Customer sales with auto-generated invoice numbers, PDF invoice download
- **GST** — Auto CGST/SGST (intra-state) and IGST (inter-state) computation
- **Dashboard** — KPIs, AI business insights (OpenAI, 5-min cache), charts (revenue, inventory health, category performance, top products)
- **Reports** — Sales summary, purchase summary, inventory (low-stock, dead-stock, valuation), GST summary
- **Business Settings** — Company profile, GSTIN, bank details, invoice prefix
- **User Management** — CRUD with role assignment (super_admin only)

---

## API Routes

All routes prefixed with `/api`:

```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

CRUD   /users
CRUD   /categories
CRUD   /products          (search, filter, sort, pagination)
CRUD   /suppliers         (search, pagination)
CRUD   /customers         (search, pagination)
CRUD   /purchases         (GST calc, payment tracking)
CRUD   /sales             (GST calc, PDF invoice at /sales/:id/invoice)

GET    /dashboard/stats
GET    /dashboard/sales-trend
GET    /dashboard/top-products
GET    /dashboard/recent-transactions
GET    /dashboard/category-sales
GET    /dashboard/inventory-health
GET    /dashboard/ai-insights        (?force=true to bypass 5-min cache)

GET    /reports/sales-summary
GET    /reports/purchase-summary
GET    /reports/inventory
GET    /reports/gst-summary

GET    /business
PUT    /business
```

---

## Database Schema

| Table | Key Fields |
|-------|-----------|
| `users` | id, name, email, passwordHash, role, active, failedLoginAttempts, lockedUntil |
| `categories` | id, name, description |
| `products` | id, name, categoryId, hsnCode, unit, purchasePrice, sellingPrice, mrp, gstRate, currentStock, minStockAlert, sku |
| `suppliers` | id, name, contactPerson, phone, email, gstin, state |
| `customers` | id, name, phone, email, gstin, state |
| `purchases` | id, invoiceNo, invoiceDate, supplierId, subtotal, taxAmount, grandTotal, paidAmount, balanceDue, paymentStatus, cgst, sgst, igst |
| `purchase_items` | id, purchaseId, productId, quantity, unitPrice, gstRate, cgst, sgst, igst, total |
| `sales` | id, invoiceNo, saleDate, customerId, customerName, subtotal, taxAmount, grandTotal, paidAmount, balanceDue, paymentStatus, cgst, sgst, igst |
| `sale_items` | id, saleId, productId, productName, quantity, unitPrice, gstRate, cgst, sgst, igst, total |
| `business_profile` | id, name, address, gstin, state, phone, email, bankName, bankAccount, bankIfsc, invoicePrefix, nextInvoiceNum |
| `refresh_tokens` | id, token, userId, expiresAt |
| `token_blacklist` | id, token, expiresAt |
| `audit_log` | id, userId, action, entity, entityId, details |

---

## Important Developer Notes

### TypeScript
- Always run `pnpm run typecheck` from the **root** — never inside individual packages
- `emitDeclarationOnly` — only `.d.ts` files are emitted; bundling is done by esbuild/vite/tsx
- Every package extends `tsconfig.base.json` which sets `composite: true`

### Database
- Drizzle `numeric` fields are returned as **strings** — always wrap with `Number()` before using
- Do NOT use `Response.parse()` on route responses — Zod `date()` won't accept ISO strings
- Purchase/sale creation uses DB transactions with atomic stock updates to prevent oversell

### Auth
- JWT secrets use `crypto.randomBytes()` fallback if env vars not set — tokens won't persist across restarts
- Auth token injection uses `setAuthTokenGetter` from `@workspace/api-client-react` — no global fetch monkeypatch

### Build
- `pdfkit`, `fontkit`, and `bcrypt` are **externalized** from esbuild (not bundled)
- `bcrypt` requires native build — run `pnpm approve-builds` and select bcrypt after install

### API Codegen
- After changing the OpenAPI spec, regenerate client code:
```bash
pnpm --filter @workspace/api-spec run codegen
```

### AI Insights
- Uses OpenAI via env vars: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`
- Cached for 5 minutes; use `?force=true` query param to bypass cache

---

## Windows-Specific Notes

This project was originally developed on Replit (Linux). The following changes were made for local Windows/VPS development:

- Removed `@replit/vite-plugin-*` from `package.json` and `vite.config.ts` in both `inventory-app` and `mockup-sandbox`
- Removed all platform-specific binary overrides from `pnpm-workspace.yaml`
- Removed `preinstall` shell script from root `package.json` (used `sh` which is Linux-only)
- Hardcoded Vite ports (`5173` for inventory-app, `5174` for mockup-sandbox) instead of requiring `PORT` env var
- `mockup-sandbox` is excluded from typecheck — it is a Replit-only UI canvas tool and requires a runtime-generated file (`.generated/mockup-components.ts`) that does not exist locally

---

## Package Overview

| Package | Name | Description |
|---------|------|-------------|
| `artifacts/api-server` | `@workspace/api-server` | Express 5 API with JWT auth, GST logic, PDF invoices |
| `artifacts/inventory-app` | `@workspace/inventory-app` | React + Vite frontend |
| `lib/db` | `@workspace/db` | Drizzle ORM schema + PostgreSQL connection |
| `lib/api-spec` | `@workspace/api-spec` | OpenAPI 3.1 spec + Orval codegen config |
| `lib/api-zod` | `@workspace/api-zod` | Generated Zod schemas |
| `lib/api-client-react` | `@workspace/api-client-react` | Generated React Query hooks |
| `lib/integrations-openai-ai-server` | `@workspace/integrations-openai-ai-server` | OpenAI server helpers (batch, image, audio) |
| `scripts` | `@workspace/scripts` | Utility scripts (seed, etc.) |