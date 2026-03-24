# SOP — InventoPro Development & Setup
**Standard Operating Procedure**  
**Project:** InventoPro — Inventory Management System  
**Version:** 2.0  
**Last Updated:** March 2026  

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
11. [Server Deployment (VPS)](#11-server-deployment-vps) ← 🔜 Next Session
12. [Troubleshooting](#12-troubleshooting)
13. [Environment Variables Reference](#13-environment-variables-reference)

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
JWT_ACCESS_SECRET=your-long-random-access-secret
JWT_REFRESH_SECRET=your-long-random-refresh-secret
PORT=8080

# Optional — only needed for AI dashboard insights
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-openai-key-here
```

> ⚠️ **Never commit `.env` to GitHub.** It is already in `.gitignore`.

> 💡 Generate strong secrets:
> ```powershell
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```
> Run twice — once for ACCESS_SECRET, once for REFRESH_SECRET.

### Step 4 — Run database migrations

> ⚠️ Must set `DATABASE_URL` in PowerShell session first:

```powershell
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/inventopro"
pnpm --filter @workspace/db run push
```

### Step 5 — Seed demo data
```powershell
pnpm --filter @workspace/scripts run seed
```

This creates:
- Default admin: `admin@demo.com` / `Admin@123`
- 5 categories, 2 suppliers, 10 sample products
- Business profile

---

## 5. Running the Application

Always open **two PowerShell terminals:**

### Terminal 1 — API Server
```powershell
cd C:\path\to\pcmAI

# Set environment variables (required every session)
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/inventopro"
$env:JWT_ACCESS_SECRET="your-access-secret"
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

### Login
- URL: http://localhost:5173
- Email: `admin@demo.com`
- Password: `Admin@123`

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
$env:JWT_ACCESS_SECRET="your-access-secret"
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

---

## 8. Adding New Features

### New API route
1. Add handler in `artifacts/api-server/src/routes/`
2. Register in `artifacts/api-server/src/routes/index.ts`
3. Add to OpenAPI spec in `lib/api-spec/openapi.yaml`
4. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
5. Use generated hook in frontend
6. Run `pnpm run typecheck`

### New database table
1. Add schema in `lib/db/src/schema/`
2. Export from `lib/db/src/schema/index.ts`
3. `$env:DATABASE_URL="..."` then `pnpm --filter @workspace/db run push`
4. Update seed if needed

### New frontend page
1. Create in `artifacts/inventory-app/src/pages/`
2. Add route in `artifacts/inventory-app/src/App.tsx`
3. Add sidebar link in layout component

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

---

## 11. Server Deployment (VPS)

> 🔜 **Planned for next session — Session 3**

### Planned deployment stack
| Component | Tool |
|-----------|------|
| Server OS | Ubuntu 22.04 LTS |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| SSL Certificate | Let's Encrypt (Certbot) |
| Database | PostgreSQL (on server) |

### Planned steps (next session)

**Part A — Server Provisioning**
1. Provision VPS (DigitalOcean / AWS / Hetzner / any provider)
2. SSH into server
3. Install Node.js 24, pnpm, Git
4. Install PostgreSQL 16
5. Install Nginx
6. Install PM2: `npm install -g pm2`

**Part B — App Deployment**
1. Clone repo: `git clone https://github.com/icassameer/pcmAI.git`
2. `cd pcmAI && pnpm install`
3. Create `.env` at `artifacts/api-server/.env` with production values
4. Set DATABASE_URL and run migrations
5. Seed database (first time only)
6. Build API: `pnpm --filter @workspace/api-server run build`
7. Build frontend: `pnpm --filter @workspace/inventory-app run build`

**Part C — Process Management (PM2)**
1. Create `ecosystem.config.js` for PM2
2. Start API: `pm2 start ecosystem.config.js`
3. Save PM2 config: `pm2 save`
4. Enable PM2 on startup: `pm2 startup`

**Part D — Nginx Configuration**
1. Configure Nginx to serve frontend `dist/` as static files
2. Proxy `/api` requests to `http://localhost:8080`
3. Test config: `nginx -t`
4. Reload: `systemctl reload nginx`

**Part E — SSL Setup**
1. Point domain DNS to server IP
2. Install Certbot
3. Run: `certbot --nginx -d yourdomain.com`
4. Auto-renewal is configured by Certbot

**Part F — Security**
1. Configure UFW firewall — only allow ports 22, 80, 443
2. Change PostgreSQL default password
3. Set strong JWT secrets in production `.env`
4. Set `NODE_ENV=production`

### Notes for deployment
- Frontend `dist/` is in `.gitignore` — must build on server
- Never use the same JWT secrets as local development
- Set up database backups (pg_dump cron job)
- Monitor logs with `pm2 logs`

---

## 12. Troubleshooting

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

### JWT tokens not persisting
Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` env vars before starting server.

### CRLF line ending warnings
Already fixed via `.gitattributes`. If reappears:
```powershell
git rm -r --cached .
git add .
git commit -m "chore: normalize line endings"
```

### `mockup-sandbox` typecheck error
Expected — excluded from typecheck in root `package.json`. Do not add it back.

---

## 13. Environment Variables Reference

### `artifacts/api-server/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | ✅ Yes | Secret for signing refresh tokens |
| `PORT` | ✅ Yes | API server port (use `8080`) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | ❌ Optional | OpenAI base URL |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | ❌ Optional | OpenAI API key |

> ⚠️ On Windows, `DATABASE_URL` must also be set as `$env:DATABASE_URL` in PowerShell before running `db push`.

---

## Quick Reference Card

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIRST TIME SETUP:
  git clone https://github.com/icassameer/pcmAI.git && cd pcmAI
  pnpm install
  psql -U postgres -c "CREATE DATABASE inventopro;"
  # create artifacts/api-server/.env
  $env:DATABASE_URL="postgresql://postgres:pass@localhost:5432/inventopro"
  pnpm --filter @workspace/db run push
  pnpm --filter @workspace/scripts run seed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DAILY (Terminal 1 — API):
  $env:DATABASE_URL="postgresql://postgres:pass@localhost:5432/inventopro"
  $env:JWT_ACCESS_SECRET="your-secret"
  $env:JWT_REFRESH_SECRET="your-secret"
  $env:PORT="8080"
  pnpm --filter @workspace/api-server run dev

DAILY (Terminal 2 — Frontend):
  pnpm --filter @workspace/inventory-app run dev
  → http://localhost:5173  (admin@demo.com / Admin@123)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEFORE COMMITTING:
  pnpm run typecheck
  git add .
  git commit -m "feat/fix/chore: description"
  git push origin main

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT SESSION — SERVER DEPLOYMENT:
  → Provision VPS (Ubuntu 22.04)
  → Install Node 24, pnpm, PostgreSQL, Nginx, PM2
  → Clone repo, .env, migrations, build
  → Nginx reverse proxy + PM2 process manager
  → SSL with Certbot + domain DNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Session Log

| Date | Session | What Was Done |
|------|---------|---------------|
| March 2026 | Session 1 | Removed Replit deps, fixed TypeScript errors, added README, pushed to GitHub |
| March 2026 | Session 2 | PostgreSQL setup, DB migrations, seed data, fixed dotenv/vite proxy/cross-env, app running locally, normalized line endings, pushed to GitHub |
| Next Session | Session 3 | 🔜 VPS deployment, Nginx, PM2, SSL, domain setup |

---

*This SOP is a living document — update it after every session.*
