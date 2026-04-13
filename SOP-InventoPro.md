# SOP — InventoPro Development & Setup
**Standard Operating Procedure**  
**Project:** InventoPro — Multi-Tenant GST Billing & Inventory SaaS  
**Version:** 4.0  
**Last Updated:** April 2026  

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [First-Time Machine Setup](#2-first-time-machine-setup)
3. [Project Setup from GitHub](#3-project-setup-from-github)
4. [Database Setup](#4-database-setup)
5. [Running the Application](#5-running-the-application)
6. [Daily Development Workflow](#6-daily-development-workflow)
7. [Git Workflow](#7-git-workflow)
8. [Adding New Features](#8-adding-new-features)
9. [API Codegen Workflow](#9-api-codegen-workflow)
10. [Build & Typecheck](#10-build--typecheck)
11. [Server Deployment (VPS)](#11-server-deployment-vps) ✅ Completed Session 3
12. [Redeployment Workflow](#12-redeployment-workflow)
13. [Troubleshooting](#13-troubleshooting)
14. [Environment Variables Reference](#14-environment-variables-reference)
15. [Multi-Tenant Architecture](#15-multi-tenant-architecture)
16. [Planned Improvements](#16-planned-improvements)

---

## 1. Prerequisites

Before starting, ensure the following are installed on your machine:

| Tool | Version | Install Link |
|------|---------|-------------|
| Node.js | v24+ | https://nodejs.org |
| pnpm | v10+ | `npm install -g pnpm` |
| PostgreSQL | v16+ | https://www.postgresql.org/download/windows |
| Git | Latest | https://git-scm.com |
| VS Code | Latest | https://code.visualstudio.com |

**Verify installations:**
```powershell
node --version       # Should show v24.x.x
pnpm --version       # Should show 10.x.x
git --version        # Should show git version 2.x.x
psql --version       # Should show psql 16.x
```

> ⚠️ After installing PostgreSQL on Windows, add it to PATH:
> ```powershell
> [System.Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Program Files\PostgreSQL\16\bin", [System.EnvironmentVariableTarget]::User)
> ```

---

## 2. First-Time Machine Setup

### Install pnpm
```powershell
npm install -g pnpm
```

### Configure Git
```powershell
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### VS Code Extensions (recommended)
- **ESLint** — code linting
- **Prettier** — code formatting
- **Tailwind CSS IntelliSense** — Tailwind class autocomplete
- **Thunder Client** — API testing inside VS Code

---

## 3. Project Setup from GitHub

### Step 1 — Clone the repository
```powershell
git clone https://github.com/icassameer/pcmAI.git
cd pcmAI
```

### Step 2 — Install all dependencies
```powershell
pnpm install
```

> ⚠️ If you see a bcrypt warning:
> ```powershell
> pnpm approve-builds
> # Press Space to select bcrypt, then Enter
> ```

### Step 3 — Verify typecheck passes
```powershell
pnpm run typecheck
```

All 3 packages should pass:
```
artifacts/api-server     ✓ Done
artifacts/inventory-app  ✓ Done
scripts                  ✓ Done
```

---

## 4. Database Setup

### Step 1 — Start PostgreSQL
PostgreSQL runs as a Windows service and starts automatically after install.

To verify it's running:
```powershell
psql -U postgres -c "SELECT version();"
```

### Step 2 — Create the database
```powershell
psql -U postgres -c "CREATE DATABASE inventopro;"
```

### Step 3 — Create environment file

Create `artifacts/api-server/.env`:
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

> ⚠️ **Never commit `.env` to GitHub.** It is already in `.gitignore`.

> ⚠️ **Important:** The correct variable name is `JWT_SECRET` (not `JWT_ACCESS_SECRET`). Using the wrong name will cause tokens to not persist across server restarts.

> 💡 Generate strong secrets using Node.js (use this method to avoid truncation):
> ```powershell
> node -e "
> const crypto = require('crypto');
> const fs = require('fs');
> const s1 = crypto.randomBytes(64).toString('hex');
> const s2 = crypto.randomBytes(64).toString('hex');
> console.log('JWT_SECRET=' + s1);
> console.log('JWT_REFRESH_SECRET=' + s2);
> "
> ```

### Step 4 — Run Drizzle schema push

> ⚠️ Must set `DATABASE_URL` in PowerShell session first:

```powershell
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/inventopro"
pnpm --filter @workspace/db run push
```

### Step 5 — Apply multi-tenant migration

This adds `tenant_id` to all tables and creates the `tenants` + `plans` tables:

```bash
# Linux/VPS:
sudo -u postgres psql -d inventopro -f lib/db/src/migrate-phase1.sql

# Windows:
psql -U postgres -d inventopro -f lib/db/src/migrate-phase1.sql
```

### Step 6 — Seed plans + demo tenant

```bash
# Linux/VPS:
sudo -u postgres psql -d inventopro -f lib/db/src/seed-tenant.sql

# Windows:
psql -U postgres -d inventopro -f lib/db/src/seed-tenant.sql
```

This creates:
- 3 subscription plans (Free Trial, Starter ₹499/mo, Pro ₹999/mo)
- Demo Agency tenant (id=1, plan=pro, status=active)
- Demo admin user: `admin@demo.com` / `Admin@123`
- Platform admin user: `platform@inventopro.com` / `PlatformAdmin@123`
- 5 categories, 2 suppliers, 10 sample products, business profile

> ⚠️ If you already ran the old seed script (`pnpm --filter @workspace/scripts run seed`) in Step 5 before, you can skip re-running the basic seed. The `seed-tenant.sql` is idempotent for the tenant/plans data.

---

## 5. Running the Application

Always open **two PowerShell terminals:**

### Terminal 1 — API Server
```powershell
cd C:\path\to\pcmAI

# Set environment variables (required every session)
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/inventopro"
$env:JWT_SECRET="your-secret"
$env:JWT_REFRESH_SECRET="your-refresh-secret"
$env:PORT="8080"

pnpm --filter @workspace/api-server run dev
```

You should see:
```
Server listening  port: 8080
```

### Terminal 2 — Frontend
```powershell
cd C:\path\to\pcmAI
pnpm --filter @workspace/inventory-app run dev
```

You should see:
```
VITE ready in xxxx ms
Local: http://localhost:5173/
```

### Login Credentials

| Account | Email | Password | Access |
|---------|-------|----------|--------|
| Demo Super Admin | `admin@demo.com` | `Admin@123` | Full tenant (Demo Agency) |
| Platform Admin | `platform@inventopro.com` | `PlatformAdmin@123` | All tenants, no data isolation |

> 💡 The frontend automatically proxies all `/api` requests to `http://localhost:8080` via Vite proxy config.

---

## 6. Daily Development Workflow

### Start of day
```powershell
# 1. Navigate to project
cd C:\path\to\pcmAI

# 2. Pull latest changes
git pull origin main

# 3. Install any new dependencies
pnpm install

# 4. Terminal 1 — Start API (with env vars)
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/inventopro"
$env:JWT_SECRET="your-secret"
$env:JWT_REFRESH_SECRET="your-refresh-secret"
$env:PORT="8080"
pnpm --filter @workspace/api-server run dev

# 5. Terminal 2 — Start Frontend
pnpm --filter @workspace/inventory-app run dev
```

### End of day
```powershell
pnpm run typecheck
git add .
git commit -m "feat/fix/chore: description"
git push origin main
```

---

## 7. Git Workflow

### Commit Message Format

| Prefix | Use For |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Config, deps, tooling |
| `refactor:` | Code restructuring |
| `docs:` | README, SOP updates |
| `style:` | UI/CSS only changes |

### Branch Strategy (for team)
```powershell
git checkout -b feat/feature-name
git push origin feat/feature-name
# After review:
git checkout main
git merge feat/feature-name
git push origin main
```

### What NOT to commit
- `.env` — secrets
- `node_modules/` — too large
- `dist/` — build output
- `*.tsbuildinfo` — TS cache
- `ecosystem.config.js` — production secrets (already in `.gitignore`)

---

## 8. Adding New Features

### New API route
1. Add handler in `artifacts/api-server/src/routes/`
2. Register in `artifacts/api-server/src/routes/index.ts`
3. Add to OpenAPI spec in `lib/api-spec/openapi.yaml`
4. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
5. Use generated hook in frontend
6. Run `pnpm run typecheck`

> ⚠️ **Multi-tenancy rule:** Every new DB query MUST include `WHERE tenant_id = ?`. Use this pattern from existing routes:
> ```typescript
> const tenantSql = tenantId !== null ? sql`AND tenant_id = ${tenantId}` : sql``
> ```

### New database table
1. Add schema in `lib/db/src/schema/` — always include `tenantId` column
2. Export from `lib/db/src/schema/index.ts`
3. `$env:DATABASE_URL="..."` then `pnpm --filter @workspace/db run push`
4. **Rebuild db declarations:** `pnpm --filter @workspace/db exec tsc -p tsconfig.json`
5. Update seed if needed

### New frontend page
1. Create in `artifacts/inventory-app/src/pages/`
2. Add route in `artifacts/inventory-app/src/App.tsx`
3. Add sidebar link in `artifacts/inventory-app/src/components/layout.tsx`

---

## 9. API Codegen Workflow

```powershell
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
```

Regenerates:
- `lib/api-client-react/src/generated/` — React Query hooks
- `lib/api-zod/src/generated/` — Zod schemas

> ⚠️ Never manually edit files inside `generated/` folders.

---

## 10. Build & Typecheck

```powershell
# Typecheck only (fast)
pnpm run typecheck

# Full build
pnpm run build

# Single package
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/inventory-app run typecheck
```

> ⚠️ If you modified `lib/db/src/schema/`, always rebuild db declarations first:
> ```bash
> pnpm --filter @workspace/db exec tsc -p tsconfig.json
> pnpm run typecheck
> ```

---

## 11. Server Deployment (VPS)

> ✅ **Completed — Session 3 (March 2026)**

### Production Server Details

| Item | Value |
|------|-------|
| Provider | Hostbet |
| OS | Ubuntu 24.04 LTS |
| Server IP | 203.174.22.119 |
| App URL | https://pms.icaweb.in |
| App directory | `/var/www/inventopro` |
| Process Manager | PM2 (ecosystem.config.js) |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt (auto-renews) |
| Database | PostgreSQL 16 (inventopro db) |
| DNS | Cloudflare (DNS only, grey cloud) |

### Deployment Stack

| Component | Tool |
|-----------|------|
| Server OS | Ubuntu 24.04 LTS |
| Node.js | v24.14.0 |
| pnpm | v10.33.0 |
| Process Manager | PM2 v6 (ecosystem.config.js) |
| Reverse Proxy | Nginx 1.24 |
| SSL Certificate | Let's Encrypt (Certbot) |
| Database | PostgreSQL 16 |

### First-Time Deployment Steps (for reference)

**Part A — Server Prep (Ubuntu)**
```bash
# Upgrade Node to v24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Verify
node --version   # v24.x.x
pnpm --version   # 10.x.x
```

**Part B — Database**
```bash
# Create database (use sudo -u postgres if peer auth fails)
sudo -u postgres psql -c "CREATE DATABASE inventopro;"

# Set postgres password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'yourpassword';"
```

**Part C — App Setup**
```bash
cd /var/www
git clone https://github.com/icassameer/pcmAI.git inventopro
cd inventopro
pnpm install

# Push Drizzle schema
export DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/inventopro"
pnpm --filter @workspace/db run push

# Apply multi-tenant migration
sudo -u postgres psql -d inventopro -f lib/db/src/migrate-phase1.sql

# Seed plans + demo tenant + platform admin
sudo -u postgres psql -d inventopro -f lib/db/src/seed-tenant.sql

# Build
pnpm --filter @workspace/db exec tsc -p tsconfig.json
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/inventory-app run build
```

**Part D — Generate ecosystem.config.js**

> ⚠️ Always use this Node.js method to generate secrets — shell `$()` truncates hex strings by 1 character.

```bash
node -e "
const crypto = require('crypto');
const fs = require('fs');
const s1 = crypto.randomBytes(64).toString('hex');
const s2 = crypto.randomBytes(64).toString('hex');
const dbUrl = 'postgresql://postgres:yourpassword@localhost:5432/inventopro';
const config = \`module.exports = {
  apps: [{
    name: 'inventopro-api',
    script: 'artifacts/api-server/dist/index.mjs',
    cwd: '/var/www/inventopro',
    env: {
      DATABASE_URL: '\${dbUrl}',
      JWT_SECRET: '\${s1}',
      JWT_REFRESH_SECRET: '\${s2}',
      PORT: '8080',
      OPENAI_API_KEY: 'sk-your-key',
      RAZORPAY_KEY_ID: 'rzp_live_xxx',
      RAZORPAY_KEY_SECRET: 'xxx',
      RAZORPAY_WEBHOOK_SECRET: 'xxx'
    }
  }]
};\`;
fs.writeFileSync('/var/www/inventopro/ecosystem.config.js', config);
fs.writeFileSync('artifacts/api-server/.env', \`DATABASE_URL=\${dbUrl}\nJWT_SECRET=\${s1}\nJWT_REFRESH_SECRET=\${s2}\nPORT=8080\n\`);
console.log('Done! s1:', s1.length, 's2:', s2.length);
"
```

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Part E — Nginx Configuration**

Create `/etc/nginx/sites-available/inventopro`:
```nginx
server {
    listen 80;
    server_name pms.icaweb.in;

    root /var/www/inventopro/artifacts/inventory-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/inventopro /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

**Part F — SSL**
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d pms.icaweb.in
```

> ⚠️ DNS must be set to **DNS only (grey cloud)** in Cloudflare before running Certbot.

---

## 12. Redeployment Workflow

Use this every time you push new code to GitHub and want to update production:

```bash
cd /var/www/inventopro

# 1. Pull latest code
git pull origin main

# 2. Install any new dependencies
pnpm install

# 3. Rebuild db type declarations (if schema changed)
pnpm --filter @workspace/db exec tsc -p tsconfig.json

# 4. Build API
pnpm --filter @workspace/api-server run build

# 5. Build frontend
pnpm --filter @workspace/inventory-app run build

# 6. Restart API — ALWAYS use this exact command
pm2 startOrRestart ecosystem.config.js --update-env

# 7. Verify
pm2 status
pm2 logs inventopro-api --lines 10 --nostream
```

> ⚠️ **CRITICAL — Always use `pm2 startOrRestart ecosystem.config.js --update-env`**
> 
> **NEVER use:** `pm2 restart inventopro-api`
>
> PM2 caches environment variables from when the process was first created. Using `pm2 restart inventopro-api` causes PM2 to use its stale cached env — which may have the WRONG `DATABASE_URL`. This causes all API calls to silently fail with DB connection errors. Always use `--update-env` with the ecosystem file to force PM2 to reload the correct variables.

> ⚠️ The `ecosystem.config.js` holds all environment variables (JWT secrets, DATABASE_URL, Razorpay keys, PORT). It is NOT in git. If the server is reprovisioned, regenerate it using the Node.js method in Section 11 Part D.

### Check production logs
```bash
pm2 logs inventopro-api          # live tail
pm2 logs inventopro-api --lines 50 --nostream   # last 50 lines
pm2 flush                        # clear all logs
```

### Restart / Stop
```bash
# CORRECT — always use this:
pm2 startOrRestart ecosystem.config.js --update-env

# STOP:
pm2 stop inventopro-api

# Remove from PM2 (use only if reconfiguring):
pm2 delete inventopro-api
```

---

## 13. Troubleshooting

### `pnpm` not recognized
```powershell
npm install -g pnpm
```

### `psql` not recognized
```powershell
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"
```

### `export` not recognized
The dev script uses `cross-env` now. Check `artifacts/api-server/package.json`.

### `PORT environment variable is required`
```powershell
$env:PORT="8080"
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/inventopro"
```

### `DATABASE_URL must be set`
Set `$env:DATABASE_URL` in the terminal session before running any command.

### API returns 500 on all routes in production
**Root cause:** PM2 is using a cached (wrong) `DATABASE_URL` from an earlier process start.

**Diagnosis:**
```bash
pm2 env 0 | grep DATABASE_URL
```

If the URL looks wrong (e.g., wrong password), PM2 has the stale cached value.

**Fix:**
```bash
pm2 startOrRestart ecosystem.config.js --update-env
pm2 env 0 | grep DATABASE_URL   # confirm it's now correct
```

**Prevention:** Never use `pm2 restart inventopro-api`. Always use `pm2 startOrRestart ecosystem.config.js --update-env`.

### TypeScript errors after modifying `lib/db` schema
`lib/db` uses TypeScript project references (`composite: true`, `emitDeclarationOnly`). When you add or change columns in `lib/db/src/schema/`, the compiled `.d.ts` output files become stale. TypeScript still reports the old types.

**Fix:**
```bash
pnpm --filter @workspace/db exec tsc -p tsconfig.json
pnpm run typecheck
```

Run this before every `typecheck` or `build` when the schema has changed.

### `Could not resolve ./mockupPreviewPlugin`
Remove the import from `artifacts/inventory-app/vite.config.ts`.

### Login fails with 404
Add Vite proxy to `artifacts/inventory-app/vite.config.ts`:
```typescript
server: {
  proxy: {
    "/api": { target: "http://localhost:8080", changeOrigin: true }
  }
}
```

### `@replit/*` catalog entry not found
Remove `@replit/*` lines from `package.json` files and `vite.config.ts` files.

### TypeScript error: Cannot find module `pdfkit`
```powershell
pnpm --filter @workspace/api-server add -D @types/pdfkit
```

### bcrypt warning after install
```powershell
pnpm approve-builds
```

### Port already in use
```powershell
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```

### JWT tokens not persisting across server restarts
- Check that `JWT_SECRET` (not `JWT_ACCESS_SECRET`) is set
- On local: set `$env:JWT_SECRET` before starting dev server
- On production: verify `ecosystem.config.js` has `JWT_SECRET` in the `env` block
- Run `pm2 env <id> | grep JWT` to confirm PM2 has the variable

### `dotenv injecting env (0)` on production
This is **normal and expected** when using `ecosystem.config.js` — PM2 injects all env vars before the app starts, so dotenv finds nothing left to load. As long as `pm2 env <id>` shows the correct variables, everything is fine.

### JWT secret truncation on Linux
Never use shell `$()` to generate and assign secrets — it strips the trailing newline, resulting in 127 instead of 128 hex chars. Always use the Node.js `fs.writeFileSync` method documented in Section 11 Part D.

### Razorpay routes return 503
The API gracefully returns 503 when Razorpay keys are not configured. To enable billing:
1. Get keys from https://dashboard.razorpay.com/app/keys
2. Add to `artifacts/api-server/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxx
   RAZORPAY_KEY_SECRET=xxx
   RAZORPAY_WEBHOOK_SECRET=xxx
   ```
3. Add the same to `ecosystem.config.js` env block
4. `pm2 startOrRestart ecosystem.config.js --update-env`

### Tenant signup or billing status returns error
Check the `tenants` and `plans` tables exist and have data:
```bash
sudo -u postgres psql -d inventopro -c "SELECT id, name, status FROM tenants;"
sudo -u postgres psql -d inventopro -c "SELECT id, name, price_monthly FROM plans;"
```

If empty, re-run: `sudo -u postgres psql -d inventopro -f lib/db/src/seed-tenant.sql`

### CRLF line ending warnings
Already fixed via `.gitattributes`. If reappears:
```powershell
git rm -r --cached .
git add .
git commit -m "chore: normalize line endings"
```

### `mockup-sandbox` typecheck error
Expected — excluded from typecheck in root `package.json`. Do not add it back.

### Peer authentication failed for PostgreSQL (Linux)
```bash
sudo -u postgres psql -c "YOUR COMMAND HERE;"
```

### PM2 process not starting after server reboot
```bash
pm2 startup    # generates systemd command — run the output command
pm2 save       # saves current process list
```

---

## 14. Environment Variables Reference

### `artifacts/api-server/.env` (local development)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | ✅ Yes | Secret for signing refresh tokens |
| `PORT` | ✅ Yes | API server port (use `8080`) |
| `OPENAI_API_KEY` | ❌ Optional | OpenAI API key for AI dashboard insights |
| `RAZORPAY_KEY_ID` | ❌ Optional | Razorpay publishable key (billing) |
| `RAZORPAY_KEY_SECRET` | ❌ Optional | Razorpay private key (billing) |
| `RAZORPAY_WEBHOOK_SECRET` | ❌ Optional | Razorpay webhook signature secret |

> ⚠️ Without Razorpay keys (or when using placeholder values), all billing endpoints return 503 gracefully — all other features work normally.

> ⚠️ On Windows, `DATABASE_URL` must also be set as `$env:DATABASE_URL` in PowerShell before running `db push`.

> ⚠️ On production, environment variables are managed via `ecosystem.config.js` — NOT the `.env` file. The `.env` file is kept in sync but PM2 loads from `ecosystem.config.js`.

### Production `ecosystem.config.js` (server only — never commit)

Located at `/var/www/inventopro/ecosystem.config.js`. Contains all production secrets. Regenerate using the Node.js method in Section 11 Part D if lost.

---

## 15. Multi-Tenant Architecture

> ✅ **Completed — Session 4 (April 2026)**

InventoPro is a fully multi-tenant SaaS. All data is isolated by `tenant_id` at the row level — a single deployment serves unlimited tenants.

### Architecture Overview

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

### User Roles

| Role | Description | Access |
|------|-------------|--------|
| `platform_admin` | SaaS operator | All tenants, no data isolation |
| `super_admin` | Agency owner | Full access to their tenant |
| `admin` | Manager | Full access except user deactivation |
| `store_keeper` | Inventory staff | Products, purchases, stock |
| `accountant` | Finance staff | Sales, purchases, reports |
| `viewer` | Read-only | View only |

### Plans

| Plan | Price | Users | Products |
|------|-------|-------|----------|
| Free Trial | ₹0 / 30 days | 1 | 100 |
| Starter | ₹499/mo · ₹4,990/yr | 3 | 500 |
| Pro | ₹999/mo · ₹9,990/yr | Unlimited | Unlimited |

### Key Files

| File | Purpose |
|------|---------|
| `lib/db/src/schema/tenants.ts` | `tenants` + `plans` table definitions |
| `lib/db/src/migrate-phase1.sql` | Adds `tenant_id` to all tables |
| `lib/db/src/seed-tenant.sql` | Seeds plans + demo tenant + platform admin |
| `artifacts/api-server/src/lib/auth.ts` | JWT with `tenantId` in payload |
| `artifacts/api-server/src/middleware/tenantGuard.ts` | `tenantActiveGuard`, `checkUserLimit`, `checkProductLimit` |
| `artifacts/api-server/src/routes/tenants.ts` | Signup + billing status endpoints |
| `artifacts/api-server/src/routes/billing.ts` | Razorpay integration |
| `artifacts/api-server/src/routes/platform.ts` | Platform admin API |
| `artifacts/inventory-app/src/pages/signup.tsx` | New tenant registration UI |
| `artifacts/inventory-app/src/pages/upgrade.tsx` | Razorpay checkout UI |
| `artifacts/inventory-app/src/pages/platform-admin.tsx` | Platform admin dashboard |

### Multi-Tenancy Development Rules

1. **Every new DB query must include tenant filtering:**
   ```typescript
   const tenantSql = tenantId !== null ? sql`AND tenant_id = ${tenantId}` : sql``
   ```

2. **Every new table must have `tenant_id`:**
   ```typescript
   tenantId: integer("tenant_id").references(() => tenantsTable.id)
   ```

3. **platform_admin bypasses all tenant filters** — `tenantId === null` in JWT

4. **Plan enforcement:** New routes that create users/products must include `checkUserLimit` / `checkProductLimit` middleware

5. **Drizzle `numeric` fields:** Always wrap with `Number()` before arithmetic:
   ```typescript
   const price = Number(product.price);
   ```

### Razorpay Payment Flow

```
1. Frontend: GET /api/billing/razorpay-key   → get publishable key
2. Frontend: POST /api/billing/subscribe     → create order (returns orderId)
3. Frontend: Razorpay.open(orderId)          → user pays
4. Frontend: POST /api/billing/verify-payment → verify HMAC, activate tenant
5. Webhook:  POST /api/billing/webhook       → handles subscription events
```

---

## 16. Planned Improvements

### SaaS & Billing
- [ ] Add annual billing discount display on upgrade page
- [ ] Tenant invoice/receipt emails on payment
- [ ] Self-service plan downgrade flow
- [ ] Trial extension (platform admin override)

### UI Improvements
- [ ] Improve dashboard layout and visual design
- [ ] Better mobile responsiveness
- [ ] Dark mode persistence (currently resets on page reload)
- [ ] Improved data tables with better filtering and export options
- [ ] Enhanced invoice PDF design and branding

### AI Features
- [ ] Fix/improve AI dashboard insights (currently requires OpenAI API key)
- [ ] Add AI-powered low stock predictions
- [ ] AI-assisted purchase order suggestions based on sales trends
- [ ] Natural language search for products and transactions

### Feature Additions
- [ ] Customer portal for invoice viewing
- [ ] WhatsApp/email invoice sharing
- [ ] Multi-warehouse support
- [ ] Barcode scanning support
- [ ] Automated database backups (pg_dump cron job)
- [ ] Create startup script to auto-load env vars locally (avoid manual `$env:` every session)

### Completed
- ✅ **Multi-tenant SaaS conversion** (Phases 1–5, April 2026)
  - Row-level tenant isolation (all 12 tables)
  - Tenant signup with 30-day free trial
  - Razorpay billing (Starter ₹499/mo, Pro ₹999/mo)
  - Plan enforcement (user + product limits)
  - 7-day grace period on payment failure
  - Platform admin dashboard (all tenants, revenue, status management)

---

## Quick Reference Card

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCTION:
  URL:  https://pms.icaweb.in
  Dir:  /var/www/inventopro

  Demo Admin:      admin@demo.com / Admin@123
  Platform Admin:  platform@inventopro.com / PlatformAdmin@123

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REDEPLOY (after git push):
  cd /var/www/inventopro
  git pull origin main
  pnpm install
  pnpm --filter @workspace/db exec tsc -p tsconfig.json
  pnpm --filter @workspace/api-server run build
  pnpm --filter @workspace/inventory-app run build
  pm2 startOrRestart ecosystem.config.js --update-env   ← ALWAYS use this
  pm2 status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIRST TIME SETUP (local):
  git clone https://github.com/icassameer/pcmAI.git && cd pcmAI
  pnpm install
  psql -U postgres -c "CREATE DATABASE inventopro;"
  # create artifacts/api-server/.env with JWT_SECRET + Razorpay keys
  $env:DATABASE_URL="postgresql://postgres:pass@localhost:5432/inventopro"
  pnpm --filter @workspace/db run push
  psql -U postgres -d inventopro -f lib/db/src/migrate-phase1.sql
  psql -U postgres -d inventopro -f lib/db/src/seed-tenant.sql

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DAILY LOCAL (Terminal 1 — API):
  $env:DATABASE_URL="postgresql://postgres:pass@localhost:5432/inventopro"
  $env:JWT_SECRET="your-secret"
  $env:JWT_REFRESH_SECRET="your-secret"
  $env:PORT="8080"
  pnpm --filter @workspace/api-server run dev

DAILY LOCAL (Terminal 2 — Frontend):
  pnpm --filter @workspace/inventory-app run dev
  → http://localhost:5173

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AFTER SCHEMA CHANGE (lib/db):
  pnpm --filter @workspace/db exec tsc -p tsconfig.json
  pnpm run typecheck

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEFORE COMMITTING:
  pnpm run typecheck
  git add .
  git commit -m "feat/fix/chore: description"
  git push origin main
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Session Log

| Date | Session | What Was Done |
|------|---------|---------------|
| March 2026 | Session 1 | Removed Replit deps, fixed TypeScript errors, added README, pushed to GitHub |
| March 2026 | Session 2 | PostgreSQL setup, DB migrations, seed data, fixed dotenv/vite proxy/cross-env, app running locally, normalized line endings, pushed to GitHub |
| March 2026 | Session 3 | VPS deployment on Hostbet (Ubuntu 24.04), Node 24 upgrade, pnpm install, DB setup, builds, PM2 ecosystem.config.js, Nginx config, Cloudflare DNS, SSL via Certbot. App live at https://pms.icaweb.in |
| April 2026 | Session 4 | Multi-tenant SaaS conversion (Phases 1–5): row-level tenant isolation on all 12 tables, JWT with tenantId, tenant signup + 30-day trial, Razorpay billing (Starter/Pro plans), plan enforcement middleware (user/product limits), 7-day grace period on payment failure, platform_admin role with full tenant dashboard, platform admin user seeded. README fully rewritten. |

---

*This SOP is a living document — update it after every session.*
