# TaskFlow SaaS - Production Deployment Guide

This guide provides step-by-step instructions for deploying your **TaskFlow** application to **Vercel**, **Netlify**, and **MongoDB Atlas** (Free Tiers Supported).

---

## 🚀 Option 1: Deploying to Vercel (Recommended)

Vercel provides native first-class support for Next.js 15 App Router and Server Actions.

### Step 1: Push Code to GitHub / GitLab / Bitbucket
```bash
git init
git add .
git commit -m "Initial commit - TaskFlow SaaS Production App"
git branch -M main
git remote add origin https://github.com/your-username/taskflow.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New** $\rightarrow$ **Project**.
3. Select your `taskflow` repository.

### Step 3: Configure Environment Variables
Under **Environment Variables**, add the following:

| Key | Example Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/taskflow?retryWrites=true&w=majority` | MongoDB Atlas URI (Optional for local memory fallback) |
| `NEXTAUTH_SECRET` | `taskflow_production_secret_key_2026_xyz` | App Session Secret Key |
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` | Production App Domain |

### Step 4: Deploy
Click **Deploy**. Vercel will automatically run `npm run build` and deploy your app in under 60 seconds!

---

## 🌐 Option 2: Deploying to Netlify

### Step 1: Connect Repository
1. Log in to [Netlify Dashboard](https://netlify.com).
2. Click **Add new site** $\rightarrow$ **Import an existing project**.
3. Connect your GitHub repository.

### Step 2: Build & Environment Settings
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- Add environment variables under **Site settings** $\rightarrow$ **Environment variables**:
  - `MONGODB_URI`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`

---

## 🍃 Option 3: Setting Up Free MongoDB Atlas Database

1. Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Shared Cluster**.
3. Under **Database Access**, create a database user and password.
4. Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere).
5. Click **Connect** $\rightarrow$ **Drivers** to copy your connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/taskflow?retryWrites=true&w=majority
   ```

---

## ⚡ Zero-Config Preview Mode
If `MONGODB_URI` is not set when deploying, TaskFlow automatically uses its **in-memory seed data store fallback**, making the app 100% functional out-of-the-box for instant live demonstration!
