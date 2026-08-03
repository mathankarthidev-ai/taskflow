# TaskFlow - Production-Grade Internal Task Management SaaS

**TaskFlow** is an interview-level, enterprise-grade internal task management application inspired by modern SaaS tools like **Linear**, **Notion**, **Jira**, and **ClickUp**. Built with Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Framer Motion, and MongoDB Atlas / Mongoose.

---

## 🌟 Key Features

* **Linear-Style Premium Aesthetic**: Dark/Light mode, glassmorphism cards, soft shadows, rounded-xl controls, and smooth micro-animations.
* **Mock Google Authentication**: Restricted to `@taskflow.company` emails with 7 pre-seeded persona switchers (Super Admin, Team Leads, Team Members).
* **Granular Role-Based Access Control (RBAC)**:
  * **Team Member**: View assigned tasks, view team board, create tasks, raise tasks cross-team, add comments.
  * **Team Lead**: Everything a member can do + access Team Incoming Queue, assign/reassign tasks, view Team Reports & Analytics.
  * **Super Admin**: Everything a lead can do + access Company Dashboard, User Management, Global Analytics, and Database Seeding.
* **Interactive Drag & Drop Kanban Board**: 5 columns (`To Do`, `In Progress`, `Review`, `Support`, `Done`) with real-time drag-and-drop state, filters, priority tags, search, and sorting.
* **Cross-Team Flow & Incoming Queue**: Members can raise tasks to other teams; tasks enter target team's **Incoming Queue** for review & member assignment by the Team Lead.
* **Threaded Discussion & Comments**: Real-time activity timeline with mentions, timestamps, author details, and emoji support.
* **Recharts Analytics & Insights**: Interactive Bar, Pie, Donut, and Line charts tracking task velocity, team productivity, priority distribution, and overdue items.
* **Reports & Data Export**: Filter by My Report, Team Report, or Company Report across date ranges (Today, Week, Month, All Time) with one-click **CSV** and **Excel** export.
* **Global Search Command Palette (`Cmd+K` / `Ctrl+K`)**: Instant search across tasks, users, and labels.
* **Deployment Ready**: Out-of-the-box support for Vercel, Netlify, and MongoDB Atlas with automated fallback data store.

---

## 🚀 Tech Stack

* **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
* **Styling & UI**: Tailwind CSS v3 + CSS HSL Tokens + Framer Motion + Lucide Icons
* **Database & ORM**: MongoDB Atlas + Mongoose + Automated In-Memory Fallback Store
* **State Management**: TanStack Query (React Query v5) + Zustand
* **Forms & Validation**: React Hook Form + Zod
* **Charts & Visualizations**: Recharts
* **CSV Export**: Custom PapaParse-compatible exporter
* **Theme**: `next-themes` (Dark / Light / System)
* **Toast Notifications**: Sonner

---

## 🛠️ Getting Started Locally

### 1. Prerequisites
* Node.js v18.0.0 or higher
* npm v9+

### 2. Installation
```bash
# Clone the repository and install dependencies
git clone https://github.com/your-org/taskflow.git
cd taskflow
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
# MongoDB Atlas Connection (Optional for local memory store preview)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskflow?retryWrites=true&w=majority

# Secret Configuration
NEXTAUTH_SECRET=taskflow_production_secret_key_2026
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Seed Personas (1-Click Login)

The login page features 1-click persona switchers for instant evaluation:

| Email | Persona | Role | Team |
|---|---|---|---|
| `alex@taskflow.company` | Alex Rivera | Super Admin | Development |
| `maya@taskflow.company` | Maya Lin | Team Lead | Creative |
| `ethan@taskflow.company` | Ethan Vance | Team Lead | Marketing |
| `liam@taskflow.company` | Liam Chen | Team Lead | Development |
| `oliver@taskflow.company` | Oliver Swift | Team Member | Creative |
| `ava@taskflow.company` | Ava Stone | Team Member | Marketing |
| `noah@taskflow.company` | Noah Patel | Team Member | Development |

---

## 📁 Folder Architecture

```
Ambizcon_Project/
├── actions/             # Next.js Server Actions for Tasks, Comments, and Users
├── app/                 # App Router pages, API route handlers, layouts, and globals.css
│   ├── (auth)/login/    # Mock Google Login page
│   ├── (dashboard)/     # Main app layout (Dashboard, Kanban, Incoming Queue, Reports, Analytics, Users, Settings, Profile)
│   ├── api/             # API routes (/api/seed, /api/tasks)
│   ├── layout.tsx       # Root layout with providers
│   └── page.tsx         # Modern SaaS Landing page
├── components/          # Design system components
│   ├── ui/              # Button, Card, Badge, Modal, Avatar, Skeleton
│   └── layout/          # Sidebar, Header, Global Search (Cmd+K)
├── features/            # Domain feature components
│   ├── dashboard/       # Dashboard Overview with 9 widgets
│   ├── kanban/          # Interactive Kanban board
│   ├── incoming/        # Cross-Team Incoming Queue
│   ├── tasks/           # Task create and detail modals, task cards
│   ├── reports/         # Reports table & CSV exporter
│   ├── analytics/       # Recharts charts and KPIs
│   └── users/           # Super Admin user management table
├── hooks/               # Custom React hooks
├── lib/                 # Database connection (Mongoose), seed data, utils, and mock store
├── models/              # Mongoose database schemas (User, Team, Task, Comment, Notification)
├── providers/           # Theme, Query, Auth, and Toast providers
├── services/            # Service layer encapsulating data queries
├── store/               # Zustand global state stores
├── types/               # Shared TypeScript definitions
└── utils/               # CSV exporters and date formatters
```

---

## 🌐 Free Deployment (Vercel / Netlify)

### Deploying to Vercel (Recommended)
1. Push your repository to GitHub.
2. Import project in [Vercel Dashboard](https://vercel.com).
3. Add Environment Variables (`MONGODB_URI`, `NEXTAUTH_SECRET`).
4. Click **Deploy**.

### Deploying to Netlify
1. Connect your repository to Netlify.
2. Set Build Command: `npm run build`
3. Set Publish Directory: `.next`
4. Deploy site.

---

## 📄 License

MIT © 2026 TaskFlow SaaS Inc. Built for high-impact production evaluation.
