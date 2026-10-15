# 🚀 TaskFlow SaaS — Deployment, DevOps & Infrastructure Guide

> **Document Version:** 2.0.0  
> **Production URL:** [https://taskflow-saas-app-five.vercel.app](https://taskflow-saas-app-five.vercel.app)  
> **Hosting Provider:** Vercel Edge Serverless Platform  
> **Database Host:** Supabase Cloud (PostgreSQL 15+)  
> **Last Updated:** October 15, 2026

---

## 1. Prerequisites

Before setting up or deploying TaskFlow, ensure you have:
1. **Node.js:** `v20.x` or `v24.x` (LTS recommended)
2. **Package Manager:** `npm` (v10+)
3. **Version Control:** `git` (v2.40+)
4. **Supabase Cloud Account:** Active project with database access
5. **Vercel CLI:** Installed globally (`npm i -g vercel`) or run via `npx vercel`

---

## 2. Environment Variables Configuration

Create a `.env.local` file in the project root with the following keys (do not commit real secrets to Git):

```ini
# Base Application URL
NEXTAUTH_URL=https://taskflow-saas-app-five.vercel.app
NEXTAUTH_SECRET=your_nextauth_secure_random_secret_32_bytes

# Supabase Cloud Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://ekdrfcopnnuaargnusav.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_anon_key

# Vercel Production Tokens (Injected automatically by Vercel environment)
# VERCEL_OIDC_TOKEN=...
```

---

## 3. Database Setup & SQL Migrations

Connect to your Supabase project dashboard -> **SQL Editor** -> Execute the migration scripts in sequential order:

1. [`supabase/migrations/20261012000001_taskflow_unified_supabase_schema.sql`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/supabase/migrations/20261012000001_taskflow_unified_supabase_schema.sql):
   - Creates `users`, `teams`, `clients`, `tasks`, `comments`, `leave_requests`, `reimbursements`, `chat_messages`, `attendance`.
2. [`supabase/migrations/20261012000002_festival_leaves_and_balances.sql`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/supabase/migrations/20261012000002_festival_leaves_and_balances.sql):
   - Creates `festival_leaves` and `employee_leave_balances`.
3. [`supabase/migrations/20261012000003_self_reminders.sql`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/supabase/migrations/20261012000003_self_reminders.sql):
   - Creates `self_reminders` with email index.
4. [`supabase/migrations/20261012000004_work_logs.sql`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/supabase/migrations/20261012000004_work_logs.sql):
   - Creates `work_logs` with composite date/email index.

---

## 4. Local Development Setup

To run the application locally on Windows without path junction errors:

```bash
# 1. Install dependencies
npm install

# 2. Type-check verification
npx tsc --noEmit

# 3. Start development server using custom supervisor
npm run dev
# (Under the hood runs: node dev-runner.js dev)
```

The application will be live at `http://localhost:3000`.

---

## 5. Production Build & Deployment to Vercel

### Step 1: Verify TypeScript & Build Locally
```bash
npx tsc --noEmit
npm run build
```
Verify that all 34 routes compile with `✓ Compiled successfully`.

### Step 2: Deploy to Vercel Production
> **Important Windows Note:** If deploying on Windows where the project folder is located inside an NTFS junction (e.g. `c:\Users\NTC\AntiGravity\Ambizcon_Project`), run Vercel CLI from the physical target directory:

```bash
cd F:\Ambizcon\AntiGravity\Ambizcon_Project
npx vercel --prod --yes
```

Vercel will:
1. Upload deployment files.
2. Build optimized Next.js production serverless bundles.
3. Automatically alias the deployment to [https://taskflow-saas-app-five.vercel.app](https://taskflow-saas-app-five.vercel.app).

---

## 6. Production Troubleshooting & Rollbacks

| Issue | Root Cause | Solution |
|---|---|---|
| **Vercel CLI Hanging** | Git push waiting for interactive SSH password in background. | Kill the background task and deploy directly using `npx vercel --prod --yes`. |
| **Windows Junction Error** | Next.js build failing on Windows junction symlinks. | Use `dev-runner.js` locally; deploy from physical drive target `F:\Ambizcon\...`. |
| **Instant Rollback** | Faulty deployment in production. | Run `vercel rollback` or open Vercel Dashboard -> Deployments -> Click previous deployment -> "Promote to Production". |
| **Empty Reimbursements** | Expected behavior: mock bill generators were disabled for clean data hygiene. | Submit an authentic claim via the "Add Claim" modal to verify ledger. |

---

## 7. Infrastructure Cost Summary

- **Vercel:** Hobby Tier ($0/mo) / Pro Tier ($20/seat/mo).
- **Supabase:** Free Tier ($0/mo) with 500MB database, 50,000 monthly active users.
- Total monthly infrastructure expenditure: **$0.00 (within free tiers)**.
*(See `docs/AI_TOOLS_AND_PROJECT_COSTS.md` for complete cost audit).*
