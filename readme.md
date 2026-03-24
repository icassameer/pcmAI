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
| Database | PostgreSQL 16 + Drizzle ORM |
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
├── .gitignore              # Ignores node_modules, dist, .env, tsbuildinfo
├── .gitattributes          # Normalizes line endings (LF) across OS
├── pnpm-workspace.yaml     # Workspace + catalog version config
├── tsconfig.base.json      # Shared TS config (composite: true)
├── tsconfig.json           # Root TS project references
├── readme.md               # This file
├── SOP-InventoPro.md       # Standard Operating Procedure
└── package.json            # Root scripts
```

---

## Prerequisites

- **Node.js** v24+ — https://nodejs.org
- **pnpm** v10+ — `npm install -g pnpm`
- **PostgreSQL** v16+ — https://www.postgresql.org/download/windows

---

## Local Setup (Windows / Linux / Mac)

### 1. Clone the repository

```bash
git clone https://github.com/icassameer/pcmAI.git
cd pcmAI
```

### 2. Install dependencies

```bash
pnpm install
```

> If you see a bcrypt warning, run: `pnpm approve-builds`

### 3. Create environment file

Create `.env` inside `artifacts/api-server/`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/inventopro
JWT_ACCESS_SECRET=your-long-random-access-secret
JWT_REFRESH_SECRET=your-long-random-refresh-secret
PORT=8080

# Optional — only needed for AI dashboard insights
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-openai-key-here
```

> ⚠️ Never commit `.env` to GitHub — it is already in `.gitignore`.

> 💡 Generate strong secrets:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Set up the database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE inventopro;"

# Set DATABASE_URL in your shell (Windows PowerShell)
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/inventopro"

# Run migrations
pnpm --filter @workspace/db run push

# Seed demo data
pnpm --filter @workspace/scripts run seed
```

### 5. Run the app

**Terminal 1 — API Server:**
```powershell
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/inventopro"
$env:JWT_ACCESS_SECRET="your-access-secret"
$env:JWT_REFRESH_SECRET="your-refresh-secret"
$env:PORT="8080"
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/inventory-app run dev
```

Open http://localhost:5173

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
- `DATABASE_URL` must be set as environment variable before running `pnpm --filter @workspace/db run push`

### Auth
- JWT secrets use `crypto.randomBytes()` fallback if env vars not set — tokens won't persist across restarts
- Auth token injection uses `setAuthTokenGetter` from `@workspace/api-client-react`

### Build
- `pdfkit`, `fontkit`, `bcrypt`, and `dotenv` are **externalized** from esbuild (not bundled)
- `bcrypt` requires native build — run `pnpm approve-builds` after install
- `dotenv` is loaded at server startup via `import dotenv from "dotenv"` in `src/index.ts`

### Vite Proxy
- The frontend proxies all `/api` requests to `http://localhost:8080`
- Configured in `artifacts/inventory-app/vite.config.ts` under `server.proxy`

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

- Removed `@replit/vite-plugin-*` from `package.json` and `vite.config.ts`
- Removed all platform-specific binary overrides from `pnpm-workspace.yaml`
- Removed `preinstall` shell script from root `package.json` (used `sh` — Linux only)
- Removed `mockupPreviewPlugin` from `inventory-app/vite.config.ts` (Replit-only)
- Hardcoded Vite port `5173` instead of requiring `PORT` env var
- Added `cross-env` to `api-server` dev script for Windows-compatible env vars
- Added `dotenv` package to `api-server` for loading `.env` file
- Added Vite proxy config (`/api` → `http://localhost:8080`)
- Fixed `drizzle.config.ts` — replaced `path.join(__dirname, ...)` with relative path
- Added `.gitattributes` to normalize line endings (LF) across Windows/Linux
- `mockup-sandbox` excluded from typecheck — Replit-only canvas tool

---

## Git History

| Commit | Description |
|--------|-------------|
| `cf2f8c8` | chore: normalize line endings via gitattributes |
| `cf93f3c` | chore: add gitattributes to normalize line endings |
| `46d9dbb` | chore: add dist and map files to gitignore |
| `00d84d0` | fix: Windows local setup - dotenv, vite proxy, cross-env, remove mockupPreviewPlugin |
| `fc3b28f` | chore: remove Replit deps, fix TypeScript errors, add README |
| `7881b6a` | Update products page and opengraph image |
| `4f614e6` | Initial commit |

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

---

## Next Steps

- [ ] Create startup script to auto-load env vars (avoid manual `$env:` every session)
- [ ] Deploy to VPS/cloud server
- [ ] Configure Nginx reverse proxy
- [ ] Set up PM2 for process management
- [ ] Configure SSL certificate