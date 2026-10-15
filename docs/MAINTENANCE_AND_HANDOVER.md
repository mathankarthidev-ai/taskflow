# 🔧 TaskFlow SaaS — Maintenance, Operations & Project Handover Guide

> **Document Version:** 2.0.0  
> **Status:** Production Verified  
> **Author:** Mathan P (Super Admin / AI PM)  
> **Last Updated:** October 15, 2026

---

## 1. Project Handover Checklist

This document facilitates seamless engineering handover and operational continuity for incoming developers, tech leads, and IT administrators.

- [x] **Source Code Repository:** Maintained in clean state on `main` branch with 34 verified commits.
- [x] **Zero TypeScript Errors:** Verified via `npx tsc --noEmit`.
- [x] **Clean Production Build:** Tested via Next.js 15 production build (34/34 routes prerendered).
- [x] **Production Deployment:** Live on Vercel at [https://taskflow-saas-app-five.vercel.app](https://taskflow-saas-app-five.vercel.app).
- [x] **Clean Database Slate:** All mock demo tasks, simulated work logs, and auto-generated bills purged from Supabase.
- [x] **Environment Variables Documented:** `.env.example` verified with required keys.
- [x] **Database Schema Migrated:** 4 version-controlled idempotent migrations in `supabase/migrations/`.

---

## 2. Routine Maintenance Procedures

### 2.1. Weekly Database Hygiene
- **Supabase Cloud Dashboard:** Inspect database storage consumption (Free Tier allows 500MB; currently using < 15MB).
- **Orphan Attendance Sessions:** Verify that the automated midnight routine (`/api/attendance/auto-clockout`) is executing at 23:59:59 IST to close unclosed punch sessions.

### 2.2. Package & Dependency Upgrades
- Before upgrading dependencies, run `npm outdated`.
- Test builds locally using `node dev-runner.js dev` before deploying to Vercel to verify that React 19 and Next.js App Router boundaries remain unbroken.

---

## 3. Account Migration Guide: Moving to New Antigravity Email

If transferring project maintenance to a new Google Antigravity account or email:

1. **Antigravity IDE Login:**
   - In Antigravity IDE, click the profile icon -> Sign out.
   - Sign in using the new email.
   - Open this workspace folder (`c:\Users\NTC\AntiGravity\Ambizcon_Project`). All local code, `.env.local`, and git repositories remain intact.
2. **Supabase Cloud Project Transfer:**
   - Log into Supabase Dashboard -> **Project Settings** -> **Members**.
   - Click **Invite Member**, enter the new email address, and assign **Owner** or **Administrator** role.
   - Accept the invitation from the new email inbox.
3. **Vercel Team & Project Transfer:**
   - In Vercel Dashboard -> **Settings** -> **Members** -> Invite the new email.
   - On the local terminal, execute `vercel logout` followed by `vercel login` using the new email so subsequent deployments link correctly.
4. **GitHub / Git Repository Access:**
   - In repository settings -> **Collaborators** -> Invite the new GitHub username/email with Admin permissions.

---

## 4. Troubleshooting Common Production Issues

| Symptom | Diagnostic Command / Check | Resolution |
|---|---|---|
| **Build failure on Windows path** | Path error mentioning junction or symlink. | Ensure local server runs via `dev-runner.js`; if deploying via Vercel CLI, execute from `F:\Ambizcon\AntiGravity\Ambizcon_Project`. |
| **Notification audio silent** | Check user role and task assignment. | Expected behavior: Task completion notifications are silenced for all members except Admin, TL, and the specific completing member. |
| **Reimbursement edit disabled** | Check claim status badge. | Expected behavior: Claims marked `Approved`, `Rejected`, or `Paid` are locked for audit compliance. |
| **Attendance QR Token Expired** | Camera scan returns "Token expired". | Refresh reception kiosk screen; tokens rotate strictly every 15 seconds. |

---

## 5. Engineering Contact & Ownership Directory

- **Lead Engineer & AI PM:** Mathan P (`mathan@ambizcon.com`) — Super Admin
- **Development Team Lead:** Anirudh (`anirudh@ambizcon.com`) — Team Lead
- **Full-Stack Developer:** Mathan MK (`mathanmk@ambizcon.com`) — Team Member
- **Repository Path:** `c:\Users\NTC\AntiGravity\Ambizcon_Project`
- **Hosting URL:** `https://taskflow-saas-app-five.vercel.app`
