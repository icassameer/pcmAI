# InventoPro — Multi-Tenant GST Billing & Inventory SaaS

A full-stack, multi-tenant SaaS for GST billing and inventory management for Indian businesses. Built as a pnpm monorepo — each agency/business gets a fully isolated data environment under a single deployment.

**🌐 Live:** https://pms.icaweb.in

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| Node.js | v24 |
| Language | TypeScript 5.9 |
| Backend | Express 5 |
| Database | PostgreSQL 16 + Drizzle ORM 0.45 |
| Frontend | React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui |
| Validation | Zod v3, drizzle-zod |
| API Codegen | Orval (from OpenAPI spec) |
| Build | esbuild (ESM bundle) |
| Auth | JWT (access + refresh tokens, bcrypt) |
| PDF | pdfkit (invoice generation) |
| AI | OpenAI (dashboard insights) |
| Payments | Razorpay (subscriptions + webhooks) |
| Process Mgr | PM2 (ecosystem.config.js) |

---

## Project Structure

```
inventopro/
├── artifacts/
│   ├── api-server/           # Express API server (port 8080)
│   │   ├── src/
│   │   │   ├── lib/          # auth.ts, logger.ts
│   │   │   ├── middleware/   # tenantGuard.ts (plan enforcement)
│   │   │   └── routes/       # auth, users, products, sales, purchases,
│   │   │                     # reports, dashboard, business, categories,
│   │   │                     # suppliers, customers, tenants, billing, platform
│   │   └── dist/             # esbuild output (not committed)
│   └── inventory-app/        # React + Vite frontend
│       └── src/
│           ├── pages/        # login, signup, dashboard, products, sales,
│           │                 # purchases, reports, settings, users,
│           │                 # upgrade, platform-admin, ...
│           ├── components/   # layout.tsx + shadcn/ui
│           └── hooks/        # use-auth.tsx
├── lib/
│   ├── api-spec/             # OpenAPI 3.1 spec + Orval codegen config
│   ├── api-client-react/     # Generated React Query hooks
│   ├── api-zod/              # Generated Zod schemas from OpenAPI
│   ├── db/                   # Drizzle ORM schema + DB connection
│   │   └── src/schema/       # tenants, plans, users, products, sales, ...
│   └── integrations-openai-ai-server/
├── scripts/
│   └── src/seed.ts           # Database seed script
├── ecosystem.config.js       # PM2 config (production only — never commit)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── readme.md
└── SOP-InventoPro.md
```

---

## Multi-Tenant Architecture

InventoPro uses **row-level tenant isolation** — a single deployment serves all tenants, with every database table filtered by `tenant_id`.

```
Single URL (pms.icaweb.in)
        │
        ├── /signup          ← new agency registers, gets 30-day trial
        ├── /login           ← all tenants log in here
        ├── /upgrade         ← Razorpay payment to activate plan
        └── /platform        ← platform_admin only (all tenants view)

JWT token carries tenantId → every API query adds WHERE tenant_id = ?
platform_admin → tenantId = null → sees all tenants (no WHERE clause)
```

### Tenant Lifecycle

```
signup → [trial 30 days] → payment → [active]
                                 ↓ payment fails
                          [grace 7 days] → [suspended]
```

---

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| `platform_admin` | SaaS operator | All tenants, no data isolation |
| `super_admin` | Agency owner | Full access to their tenant |
| `admin` | Manager | Full access except user deactivation |
| `store_keeper` | Inventory staff | Products, purchases, stock |
| `accountant` | Finance staff | Sales, purchases, reports |
| `viewer` | Read-only | View only |

---

## Plans

| Plan | Price | Users | Products |
|------|-------|-------|----------|
| Free Trial | ₹0 / 30 days | 1 | 100 |
| Starter | ₹499/mo · ₹4,990/yr | 3 | 500 |
| Pro | ₹999/mo · ₹9,990/yr | Unlimited | Unlimited |

---

## Prerequisites

- **Node.js** v24+ — https://nodejs.org
- **pnpm** v10+ — `npm install -g pnpm`
- **PostgreSQL** v16+

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/icassameer/pcmAI.git
cd pcmAI
pnpm install
```

> If you see a bcrypt warning: `pnpm approve-builds`

### 2. Create environment file

`artifacts/api-server/.env`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/inventopro
JWT_SECRET=your-long-random-secret
JWT_REFRESH_SECRET=your-long-random-refresh-secret
PORT=8080

# Optional — AI dashboard insights
OPENAI_API_KEY=sk-your-openai-key

# Razorpay — get from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx
```

> Generate strong JWT secrets:
> ```bash
> node -e "const c=require('crypto'); console.log('JWT_SECRET='+c.randomBytes(64).toString('hex')); console.log('JWT_REFRESH_SECRET='+c.randomBytes(64).toString('hex'));"
> ```

### 3. Database setup

```bash
# Create DB
psql -U postgres -c "CREATE DATABASE inventopro;"
# Linux:
sudo -u postgres psql -c "CREATE DATABASE inventopro;"

# Push schema (set DATABASE_URL first)
export DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/inventopro"
pnpm --filter @workspace/db run push

# Seed initial data (demo tenant + plans)
pnpm --filter @workspace/scripts run seed

# Apply SaaS migration (adds tenant isolation to all tables)
sudo -u postgres psql -d inventopro -f lib/db/src/migrate-phase1.sql

# Seed plans + demo tenant
sudo -u postgres psql -d inventopro -f lib/db/src/seed-tenant.sql
```

### 4. Run locally

**Terminal 1 — API:**
```bash
export DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/inventopro"
export JWT_SECRET="your-secret"
export JWT_REFRESH_SECRET="your-refresh-secret"
export PORT=8080
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/inventory-app run dev
```

Open http://localhost:5173

---

## Login Credentials

| Account | Email | Password | Notes |
|---------|-------|----------|-------|
| Demo Super Admin | `admin@demo.com` | `Admin@123` | Full tenant access |
| Platform Admin | `platform@inventopro.com` | `PlatformAdmin@123` | Sees all tenants |

---

## Production Deployment

**Live URL:** https://pms.icaweb.in  
**Server:** Hostbet VPS — Ubuntu 24.04 LTS (203.174.22.119)  
**App directory:** `/var/www/inventopro`

### Redeploy after pushing changes

```bash
cd /var/www/inventopro
git pull origin main
pnpm install
pnpm --filter @workspace/db exec tsc -p tsconfig.json   # rebuild db types if schema changed
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/inventory-app run build
pm2 startOrRestart ecosystem.config.js --update-env
pm2 status
```

> ⚠️ Always use `pm2 startOrRestart ecosystem.config.js --update-env` — never `pm2 restart inventopro-api`.  
> PM2 caches environment variables; using `--update-env` with the ecosystem file ensures the correct `DATABASE_URL` is loaded.

See `SOP-InventoPro.md` for full deployment documentation.

---

## API Routes

All routes prefixed with `/api`:

### Auth
```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
```

### Tenant Onboarding (public)
```
POST   /tenants/signup          ← register new agency, starts 30-day trial
GET    /billing/plans           ← list available plans (public)
```

### Billing (authenticated)
```
GET    /billing/status          ← current tenant trial/plan status
GET    /billing/razorpay-key    ← get publishable Razorpay key
POST   /billing/subscribe       ← create Razorpay payment order
POST   /billing/verify-payment  ← verify payment, activate plan
POST   /billing/webhook         ← Razorpay webhook (payment events)
```

### Core (all tenant-scoped)
```
CRUD   /users
CRUD   /categories
CRUD   /products          (search, filter, sort, pagination; enforces plan maxProducts)
CRUD   /suppliers
CRUD   /customers
CRUD   /purchases         (GST calc, stock update, payment tracking)
CRUD   /sales             (GST calc, PDF invoice at /sales/:id/invoice)
GET    /business
PATCH  /business
```

### Dashboard
```
GET    /dashboard/stats
GET    /dashboard/sales-trend
GET    /dashboard/top-products
GET    /dashboard/recent-transactions
GET    /dashboard/category-sales
GET    /dashboard/inventory-health
GET    /dashboard/ai-insights        (?force=true to bypass 5-min cache)
```

### Reports
```
GET    /reports/sales-summary
GET    /reports/purchase-summary
GET    /reports/inventory
GET    /reports/gst-summary
```

### Platform Admin (platform_admin role only)
```
GET    /platform/stats
GET    /platform/tenants
GET    /platform/tenants/:id
PUT    /platform/tenants/:id/status
```

---

## Database Schema

### SaaS Tables
| Table | Key Fields |
|-------|-----------|
| `tenants` | id, name, slug, plan, status, trial_ends_at, grace_period_ends_at, razorpay_customer_id, razorpay_subscription_id |
| `plans` | id, name, price_monthly, price_yearly, max_users, max_products, features |

### Core Tables (all have `tenant_id`)
| Table | Key Fields |
|-------|-----------|
| `users` | id, tenant_id, name, email, password_hash, role, active |
| `categories` | id, tenant_id, name — unique per tenant |
| `products` | id, tenant_id, name, sku, hsn_code, gst_rate, current_stock, min_stock_alert |
| `suppliers` | id, tenant_id, name, gstin, state |
| `customers` | id, tenant_id, name, gstin, state |
| `purchases` | id, tenant_id, invoice_no, subtotal, tax_amount, grand_total, payment_status |
| `purchase_items` | id, purchase_id, tenant_id, product_id, quantity, gst_rate, cgst, sgst, igst |
| `sales` | id, tenant_id, invoice_no — unique per tenant, grand_total, payment_status |
| `sale_items` | id, sale_id, tenant_id, product_id, quantity, gst_rate, cgst, sgst, igst |
| `business_profile` | id, tenant_id, name, gstin, bank_details, invoice_prefix |
| `refresh_tokens` | id, tenant_id, user_id, token, expires_at |
| `audit_log` | id, tenant_id, user_id, action, entity |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret |
| `PORT` | ✅ | API port (8080) |
| `OPENAI_API_KEY` | Optional | For AI dashboard insights |
| `RAZORPAY_KEY_ID` | Optional | Razorpay publishable key |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay private key |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | For webhook signature verification |

> Without Razorpay keys, the upgrade flow returns a 503 gracefully — all other features work normally.

---

## Developer Notes

### TypeScript
- Always build `lib/db` first when schema changes: `pnpm --filter @workspace/db exec tsc -p tsconfig.json`
- Always run `pnpm run typecheck` from the **root** before committing
- `emitDeclarationOnly` — only `.d.ts` files emitted; bundling via esbuild/vite

### Multi-Tenancy
- Every DB query must include `WHERE tenant_id = ?` — use the pattern in existing routes
- `platform_admin` has `tenantId: null` in JWT — all `if (tenantId !== null)` guards let them through
- Raw SQL queries use: `const tenantSql = tenantId !== null ? sql\`AND tenant_id = ${tenantId}\` : sql\`\``

### PM2 (Critical)
- **Always restart with:** `pm2 startOrRestart ecosystem.config.js --update-env`
- **Never use:** `pm2 restart inventopro-api` — it uses PM2's cached (potentially stale) env

### Database
- Drizzle `numeric` fields → always wrap with `Number()` before using
- After schema changes, rebuild db declarations: `pnpm --filter @workspace/db exec tsc -p tsconfig.json`

### Razorpay
- Webhook endpoint: `POST /api/billing/webhook` — register this URL in Razorpay dashboard
- Payment flow: subscribe → Razorpay Checkout (frontend) → verify-payment → tenant activated
- Grace period: 7 days after payment failure before suspension

---

## Package Overview

| Package | Name | Description |
|---------|------|-------------|
| `artifacts/api-server` | `@workspace/api-server` | Express 5 API — auth, GST logic, PDF, billing, platform admin |
| `artifacts/inventory-app` | `@workspace/inventory-app` | React + Vite frontend |
| `lib/db` | `@workspace/db` | Drizzle ORM schema + PostgreSQL connection |
| `lib/api-spec` | `@workspace/api-spec` | OpenAPI 3.1 spec + Orval codegen config |
| `lib/api-zod` | `@workspace/api-zod` | Generated Zod schemas |
| `lib/api-client-react` | `@workspace/api-client-react` | Generated React Query hooks |
| `lib/integrations-openai-ai-server` | `@workspace/integrations-openai-ai-server` | OpenAI server helpers |
| `scripts` | `@workspace/scripts` | Seed + utility scripts |

---

## Root Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm run typecheck` | TypeScript check across all packages |
| `pnpm run build` | Build all packages |
