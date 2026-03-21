# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full-stack Inventory Management System with GST billing for Indian businesses.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (access + refresh tokens, bcrypt password hashing)
- **PDF**: pdfkit (invoice generation)

## Application Features

- **Authentication**: JWT-based with role-based access control (super_admin, admin, store_keeper, accountant, viewer)
- **Default login**: admin@demo.com / Admin@123
- **Product Management**: CRUD with categories, HSN codes, GST rates, stock tracking, SKU, units (gm, kg, ltr, ml, pcs, tonne, meter, feet, box, dozen, pack)
- **Purchase Management**: Supplier purchases with automatic stock updates, GST calculations, payment tracking
- **Sales Management**: Customer sales with auto-generated invoice numbers, GST (CGST/SGST for intra-state, IGST for inter-state), PDF invoice generation
- **GST Calculations**: Automatic CGST/SGST (intra-state) and IGST (inter-state) computation
- **Dashboard**: Enhanced KPIs with growth indicators (Monthly Revenue, Gross Profit, Today's Sales, Stock Valuation, Low Stock, Pending Dues), AI Business Insights panel (OpenAI-powered with 5-min cache, force refresh support), Inventory Health donut chart, Category Performance bar chart, animated Top Products list, 30-day Revenue vs Expenses area chart, framer-motion animations
- **Reports**: Sales summary (daily/weekly/monthly/annual), purchase summary, inventory reports (current/low-stock/out-of-stock/dead-stock/valuation), GST summary with tax breakdowns
- **Business Settings**: Company profile, GSTIN, bank details, invoice prefix configuration
- **User Management**: CRUD with role assignment, account activation/deactivation (super_admin only)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   └── inventory-app/      # React + Vite frontend (serves at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Database seed script
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **users**: id, name, email, passwordHash, role, active, failedLoginAttempts, lockedUntil
- **categories**: id, name, description
- **products**: id, name, categoryId, brand, hsnCode, unit, purchasePrice, sellingPrice, mrp, gstRate, currentStock, minStockAlert, location, sku, supplierId, expiryDate, active
- **suppliers**: id, name, contactPerson, phone, email, address, gstin, state
- **customers**: id, name, phone, email, address, gstin, state
- **purchases**: id, invoiceNo, invoiceDate, supplierId, subtotal, taxAmount, discount, grandTotal, paidAmount, balanceDue, paymentStatus, isInterState, cgst, sgst, igst
- **purchase_items**: id, purchaseId, productId, quantity, unitPrice, discount, gstRate, cgst, sgst, igst, total
- **sales**: id, invoiceNo, saleDate, customerId, customerName, subtotal, taxAmount, discount, grandTotal, paidAmount, balanceDue, paymentStatus, isInterState, cgst, sgst, igst
- **sale_items**: id, saleId, productId, productName, quantity, unitPrice, discount, gstRate, cgst, sgst, igst, total
- **business_profile**: id, name, address, gstin, state, phone, email, bankName, bankAccount, bankIfsc, invoicePrefix, nextInvoiceNum, logo
- **refresh_tokens**: id, token, userId, expiresAt
- **token_blacklist**: id, token, expiresAt
- **audit_log**: id, userId, action, entity, entityId, details

## API Routes

All routes prefixed with `/api`:
- `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
- `/users` (CRUD, super_admin/admin only)
- `/categories` (CRUD)
- `/products` (CRUD with search, filter, sort)
- `/suppliers` (CRUD with search)
- `/customers` (CRUD with search)
- `/purchases` (CRUD with GST calculations)
- `/sales` (CRUD with GST calculations, PDF invoice at `/sales/:id/invoice`)
- `/dashboard/stats`, `/dashboard/sales-trend`, `/dashboard/top-products`, `/dashboard/recent-transactions`, `/dashboard/category-sales`, `/dashboard/inventory-health`, `/dashboard/ai-insights` (supports `?force=true` to bypass cache)
- `/reports/sales-summary`, `/reports/purchase-summary`, `/reports/inventory`, `/reports/gst-summary`
- `/business` (GET/PUT business profile)

## Important Notes

- Numeric fields in DB are stored as Drizzle `numeric` (strings) — always convert with `Number()` before responding
- pdfkit and fontkit are externalized in esbuild config (not bundled)
- bcrypt is externalized in esbuild config
- Seed script: `pnpm --filter @workspace/scripts run seed`
- JWT secrets use `crypto.randomBytes()` fallback if env vars not set (tokens won't persist across restarts)
- Purchase/sale creation routes use DB transactions with atomic stock updates (conditional WHERE clause prevents oversell)
- Auth token injection uses `setAuthTokenGetter` from `@workspace/api-client-react` (no global fetch monkeypatch)
- Do NOT use `Response.parse()` on route responses — Zod `date()` won't accept ISO strings
- AI insights uses OpenAI via Replit AI Integrations proxy (lazy init, env vars: AI_INTEGRATIONS_OPENAI_BASE_URL, AI_INTEGRATIONS_OPENAI_API_KEY)
- AI insights cached 5 minutes; Refresh button sends `?force=true` to bypass cache
- `openai` package is a direct dependency of api-server (also available via @workspace/integrations-openai-ai-server)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with JWT auth, role-based access, GST calculations, and PDF invoice generation.

### `artifacts/inventory-app` (`@workspace/inventory-app`)

React + Vite frontend with shadcn/ui components, Tailwind CSS, dark mode toggle, responsive sidebar layout.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports Drizzle client instance and all schema tables.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval codegen config. Run: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from OpenAPI spec for request validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts. Run: `pnpm --filter @workspace/scripts run seed`
