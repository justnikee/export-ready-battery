# ExportReady Deployment Guide

**Date:** 2026-05-20  
**Status:** Ready for production deployment  
**Platforms:** Render (backend) + Vercel (frontend)  
**Domains:** Free subdomains only (`.onrender.com`, `.vercel.app`)

---

## What You're Deploying

| Service | Technology | Hosted On | Free URL Example |
|---------|-----------|-----------|------------------|
| `platform-core` | Go 1.24 | Render | `platform-core-xxx.onrender.com` |
| `battery-api` | Go 1.24 | Render | `battery-api-xxx.onrender.com` |
| `textile-api` | Go 1.24 | Render | `textile-api-xxx.onrender.com` |
| `marketing-web` | Next.js 15 | Vercel | `exportready-marketing.vercel.app` |
| `battery-web` | Next.js 16 | Vercel | `exportready-battery.vercel.app` |
| `textile-web` | Next.js 16 | Vercel | `exportready-textile.vercel.app` |
| `admin-web` | Next.js 15 | Vercel | `exportready-admin.vercel.app` |

**3 separate Supabase projects** — strict data isolation:
- **Platform** → `platform-core` (users, teams, billing, auth)
- **Battery** → `battery-api` (batches, passports, compliance)
- **Textile** → `textile-api` (batches, passports, compliance)

---

## Prerequisites

Before you start, you need:

1. **GitHub repo pushed** with all deployment files (`render.yaml`, `vercel.json`s, `.github/workflows/ci.yml`)
2. **3 Supabase projects created**:
   - Go to [supabase.com](https://supabase.com) → New Project (×3)
   - Name them: `exportready-platform`, `exportready-battery`, `exportready-textile`
   - Note down the **Connection strings** (Settings → Database → Connection String)
3. **Vercel account** (free tier is fine)
4. **Render account** (free tier is fine)

---

## Step 1: Set Up Supabase Projects (15 min)

### 1.1 Create 3 Projects
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project** → Create 3 projects:
   - `exportready-platform`
   - `exportready-battery`
   - `exportready-textile`
3. For each project, go to **Project Settings → Database**
4. Copy the **Connection String** (URI format):
   ```
   postgresql://postgres.[ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
   ```
5. Save them — you'll paste these into Render later

### 1.2 Enable Storage (Battery + Textile only)
For `exportready-battery` and `exportready-textile`:
1. Go to **Storage** in the left sidebar
2. Click **New Bucket**
3. Name: `compliance-docs`
4. Set to **Public** (for certificate PDFs)
5. Click **Save**

> Platform Supabase doesn't need Storage.

---

## Step 2: Deploy Backend to Render (20 min)

### 2.1 Push Deployment Files to GitHub

Make sure these files are committed and pushed to `main`:
```
render.yaml
services/battery-api/cmd/migration_runner/main.go      (fixed)
services/textile-api/cmd/migration_runner/main.go      (fixed)
services/textile-api/internal/db/migrations/000031_*   (added)
services/textile-api/internal/db/migrations/000033_*   (added)
...
services/textile-api/internal/db/migrations/000063_*   (added)
```

### 2.2 Create Render Blueprint

1. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. Click **New Blueprint Instance**
3. Connect your GitHub repo
4. Render will read `render.yaml` and show you 3 web services + 3 migration jobs
5. Click **Apply**

### 2.3 Set Secret Environment Variables

After the blueprint creates the services, go to each service dashboard and set secrets:

**platform-core → Settings → Environment:**
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Platform Supabase connection string |
| `JWT_SECRET` | Generate: `openssl rand -base64 48` |
| `RAZORPAY_KEY_ID` | Your Razorpay key |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret |
| `RESEND_API_KEY` | Your Resend API key |
| `EMAIL_FROM` | `noreply@yourdomain.com` |
| `EMAIL_FROM_NAME` | `ExportReady` |

**battery-api → Settings → Environment:**
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Battery Supabase connection string |
| `SUPABASE_URL` | `https://[ref].supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Settings → API |
| `UPSTASH_REDIS_REST_URL` | Your Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash Redis token |

> `JWT_SECRET` auto-copies from platform-core (set in `render.yaml`)

**textile-api → Settings → Environment:**
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Textile Supabase connection string |
| `SUPABASE_URL` | `https://[ref].supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Settings → API |

> `JWT_SECRET` auto-copies from platform-core

### 2.4 Deploy & Copy URLs

1. Click **Deploy** on each service
2. Wait for builds to complete (2-3 min each)
3. Go to each service dashboard and copy the `.onrender.com` URL:
   - `platform-core-xxx.onrender.com`
   - `battery-api-xxx.onrender.com`
   - `textile-api-xxx.onrender.com`
4. **Save these URLs** — you need them for Vercel env vars

### 2.5 Verify Health

Open each URL in browser:
```
https://platform-core-xxx.onrender.com/health
https://battery-api-xxx.onrender.com/health
https://textile-api-xxx.onrender.com/health
```

All should return:
```json
{"status":"healthy","database":"connected"}
```

---

## Step 3: Deploy Frontends to Vercel (20 min)

Create **4 separate Vercel projects** from the same repo.

### 3.1 Marketing Web

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. **Configure:**
   - Framework Preset: `Next.js`
   - Root Directory: `apps/marketing-web`
   - Build Command: `cd ../.. && pnpm install && pnpm turbo run build --filter=@anvayalabs/marketing-web...`
4. **Environment Variables:**
   ```
   NEXT_PUBLIC_BATTERY_API_URL=https://battery-api-xxx.onrender.com
   NEXT_PUBLIC_TEXTILE_API_URL=https://textile-api-xxx.onrender.com
   NEXT_PUBLIC_PLATFORM_CORE_URL=https://platform-core-xxx.onrender.com
   ```
5. Click **Deploy**

### 3.2 Battery Web

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the **same** GitHub repo
3. **Configure:**
   - Framework Preset: `Next.js`
   - Root Directory: `apps/battery-web`
   - Build Command: `cd ../.. && pnpm install && pnpm turbo run build --filter=@anvaya/battery-web...`
4. **Environment Variables:**
   ```
   NEXT_PUBLIC_BATTERY_API_URL=https://battery-api-xxx.onrender.com
   NEXT_PUBLIC_PLATFORM_CORE_URL=https://platform-core-xxx.onrender.com
   NEXT_PUBLIC_SUPABASE_URL=https://[battery-ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[battery-anon-key]
   ```
5. Click **Deploy**

### 3.3 Textile Web

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the **same** GitHub repo
3. **Configure:**
   - Framework Preset: `Next.js`
   - Root Directory: `apps/textile-web`
   - Build Command: `cd ../.. && pnpm install && pnpm turbo run build --filter=@anvaya/textile-web...`
4. **Environment Variables:**
   ```
   NEXT_PUBLIC_TEXTILE_API_URL=https://textile-api-xxx.onrender.com
   NEXT_PUBLIC_PLATFORM_CORE_URL=https://platform-core-xxx.onrender.com
   NEXT_PUBLIC_SUPABASE_URL=https://[textile-ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[textile-anon-key]
   ```
5. Click **Deploy**

### 3.4 Admin Web

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the **same** GitHub repo
3. **Configure:**
   - Framework Preset: `Next.js`
   - Root Directory: `apps/admin-web`
   - Build Command: `cd ../.. && pnpm install && pnpm turbo run build --filter=@anvayalabs/admin-web...`
4. **Environment Variables:**
   ```
   NEXT_PUBLIC_PLATFORM_CORE_URL=https://platform-core-xxx.onrender.com
   NEXT_PUBLIC_BATTERY_API_URL=https://battery-api-xxx.onrender.com
   NEXT_PUBLIC_TEXTILE_API_URL=https://textile-api-xxx.onrender.com
   ADMIN_API_KEY=your-internal-admin-secret-key
   ```
5. Click **Deploy**

---

## Step 4: Set Up GitHub Auto-Deploy (10 min)

Go to your GitHub repo → **Settings → Secrets and variables → Actions** → **New repository secret**

Add these secrets:

| Secret Name | Where to Get It |
|-------------|----------------|
| `PLATFORM_DATABASE_URL` | Platform Supabase connection string |
| `BATTERY_DATABASE_URL` | Battery Supabase connection string |
| `TEXTILE_DATABASE_URL` | Textile Supabase connection string |
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token |
| `RENDER_DEPLOY_HOOK_URL` | Render Dashboard → your Blueprint → Deploy Hook |

> You don't need Vercel project IDs — the CI uses `vercel pull` + `vercel deploy` CLI.

Once secrets are set, pushing to `main` will:
1. Build & test everything
2. Run DB migrations on all 3 databases
3. Deploy all 4 frontends to Vercel
4. Trigger Render deploy hook

---

## Step 5: Test Everything (15 min)

### 5.1 Backend Health Checks
```bash
curl https://platform-core-xxx.onrender.com/health
curl https://battery-api-xxx.onrender.com/health
curl https://textile-api-xxx.onrender.com/health
```

### 5.2 Frontend Smoke Test
1. Open `https://exportready-marketing.vercel.app` → should show landing page
2. Click **Sign Up** → should hit platform-core auth
3. Open `https://exportready-battery.vercel.app` → login page
4. Login → should redirect to dashboard
5. Create a batch → should hit battery-api

### 5.3 Admin Dashboard
1. Open `https://exportready-admin.vercel.app`
2. Should show the admin placeholder page

### 5.4 QR Code / Public Passport
1. Create a batch with passports in battery-web
2. Generate QR codes
3. Scan QR code → should open public passport page
4. Verify `https://battery-api-xxx.onrender.com/api/v1/passports/{uuid}` returns 200

---

## Admin Dashboard (`admin-web`)

The `admin-web` app is a placeholder right now. Build it out when you're ready:

| Module | Description | API Endpoint |
|--------|-------------|--------------|
| **Platform Stats** | Total tenants, active users, MRR | `GET /api/v1/admin/stats` |
| **Tenant Management** | List, suspend, impersonate | `GET /api/v1/tenants` |
| **Growth Metrics** | Daily signups, batch creation | `GET /api/v1/admin/growth` |
| **System Alerts** | Health checks, cert expiries | `GET /api/v1/alerts` |
| **Billing Overview** | Subscriptions, MRR by product | Razorpay dashboard |
| **Broadcast** | Email announcements | `POST /api/v1/admin/broadcast` |

**Security:**
- Only users with `admin` role in `platform-core` can access
- `ADMIN_API_KEY` header required for sensitive endpoints
- Consider IP allowlisting in Vercel for extra security

---

## Troubleshooting

### Migration runner says "No pending migrations" but DB is empty
**Cause:** `godotenv.Overload()` overwrites shell `DATABASE_URL` with `.env` value.  
**Fix:** Already fixed — migration runners now use `godotenv.Load()` which respects shell env vars.

### Vercel build fails with "Cannot find module @anvaya/ui"
**Cause:** Vercel is building from the app subdirectory, not the workspace root.  
**Fix:** The `vercel.json` build command (`cd ../.. && pnpm install && ...`) handles this. Make sure it's configured.

### Render health check fails
**Cause:** Service crashed or DB connection failed.  
**Fix:** Check Render logs. Verify `DATABASE_URL` is correct. Make sure migrations ran.

### "CORS error" in browser
**Cause:** Frontend domain not allowed by backend.  
**Fix:** Backend CORS middleware needs to allow `*.vercel.app` origins. Update each Go service's CORS config.

---

## Rollback

If something breaks:

1. **Database:** Supabase has automatic daily backups + Point-in-Time Recovery (7 days on free tier)
2. **Backend:** Revert commit → push to `main` → Render auto-deploys
3. **Frontend:** Revert commit → push → Vercel auto-deploys
4. **Emergency:** Use Render dashboard → Manual Deploy → pick previous commit

---

## Cost Estimate (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Render (3 services) | Starter | **$21** |
| Vercel (4 apps) | Free (no custom domains) | **$0** |
| Supabase (3 projects) | Free tier | **$0** |
| Upstash Redis | Free tier | **$0** |
| Resend | Free tier (3k emails/mo) | **$0** |
| **Total** | | **~$21/mo** |

> When you add custom domains later, upgrade Vercel to Pro ($20/project). Until then, free tier handles everything.

---

## Quick Commands

```bash
# ── Local dev ──
make dev              # Start all Next.js apps
make test             # Run all tests
make migrate-up       # Run battery-api migrations

# ── Migrations ──
cd services/platform-core && DATABASE_URL="<url>" go run ./cmd/migration_runner up
cd services/battery-api   && DATABASE_URL="<url>" go run ./cmd/migration_runner up
cd services/textile-api   && DATABASE_URL="<url>" go run ./cmd/migration_runner up

# ── Deploy single frontend ──
npm i -g vercel
vercel --cwd apps/admin-web --prod
```

---

*Need help with a specific step? Ask me to walk through it in detail.*
