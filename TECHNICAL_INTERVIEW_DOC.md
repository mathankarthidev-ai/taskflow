# 🚀 TaskFlow SaaS — Comprehensive Engineering & Architecture Documentation
> **Interview-Level Technical Architecture, Concepts, Engineering Challenges, and Roadmap Notes**  
> **Author:** Mathan P  
> **Target Application:** TaskFlow Production SaaS Internal Task Platform  

---

## 📋 Table of Contents
1. [Executive Summary & High-Level Architecture](#1-executive-summary--high-level-architecture)
2. [Technology Stack & System Design Choices](#2-technology-stack--system-design-choices)
3. [Core Features & Technical Concepts Implemented](#3-core-features--technical-concepts-implemented)
4. [Role-Based Access Control (RBAC) & Permission Matrix](#4-role-based-access-control-rbac--permission-matrix)
5. [Data Schemas & Database Modeling](#5-data-schemas--database-modeling)
6. [Engineering Challenges, Runtime Failures & Technical Solutions](#6-engineering-challenges-runtime-failures--technical-solutions)
7. [Performance & Bundle Size Optimizations](#7-performance--bundle-size-optimizations)
8. [Production Deployment Architecture](#8-production-deployment-architecture)
9. [Future Enhancements & Production Roadmap](#9-future-enhancements--production-roadmap)

---

## 1. Executive Summary & High-Level Architecture

**TaskFlow** is an enterprise-grade, internal task management platform designed for multi-departmental SaaS operations. It models real-world corporate task workflows across **Creative**, **Marketing**, and **Development** teams with multi-tiered authority levels (**Team Member**, **Team Lead**, and **Super Admin**).

### High-Level System Architecture Diagram

```
 +-----------------------------------------------------------------------+
 |                            CLIENT LAYER                               |
 |   Next.js 15 App Router | React 19 | Tailwind CSS | Framer Motion    |
 |   Zustand (Global State) | TanStack Query | Sonner Toast | Recharts   |
 +----------------------------------+------------------------------------+
                                    |
                        Server Actions RPC Boundary
                       ('use server' Actions / Pure Data)
                                    |
 +----------------------------------v------------------------------------+
 |                            SERVER LAYER                               |
 |   actions/taskActions.ts   | actions/userActions.ts                   |
 |   actions/commentActions.ts| actions/analyticsActions.ts              |
 +----------------------------------+------------------------------------+
                                    |
                   Dual Store Abstraction Adapter (lib/db.ts)
                                    |
        +---------------------------+---------------------------+
        |                                                       |
        v                                                       v
+---------------+                                       +---------------+
| MONGODB ATLAS | (When MONGODB_URI is set)             | IN-MEMORY     | (Zero-Config
| CLOUD DB      | Mongoose Schema Hydration             | SEED STORE    |  Vercel
| (Production)  | Persistent Storage                    | (lib/mock)    |  Fallback)
+---------------+                                       +---------------+
```

---

## 2. Technology Stack & System Design Choices

| Layer | Technology | Architectural Rationale |
|---|---|---|
| **Core Framework** | **Next.js 15 (App Router)** | Hybrid rendering (SSR + SSG + Server Actions). Offers low latency, automatic route prefetching, and seamless API boundaries. |
| **UI Library** | **React 19** | Modern concurrent rendering features, instant client state transitions, and server-client boundary optimization. |
| **Language** | **TypeScript 5.x** | End-to-end type safety spanning DB models, Server Actions, Zustand stores, and component prop definitions. |
| **Styling & Aesthetics** | **Tailwind CSS + Vanilla CSS** | Custom glassmorphism variables, dark mode tokens, neon glow micro-interactions, and responsive utility layouts without heavy CSS runtime overhead. |
| **State Management** | **Zustand** | Lightweight atomic state management for active task selection, search queries, persona sessions, and modal open states. |
| **Data Fetching** | **TanStack Query (React Query v5)** | Declarative client-side query caching, optimistic UI updates, and background refetching. |
| **Database & ORM** | **MongoDB Atlas + Mongoose** | Document database offering dynamic schema flexibility for nested comments, labels, and audit logs. |
| **Animations** | **Framer Motion** | Spring-based drag animations for Kanban cards, glass modal entrances, and particle login backdrops. |
| **Hosting Platform** | **Vercel** | Edge network deployment with zero-config serverless function scaling and global CDN caching. |

---

## 3. Core Features & Technical Concepts Implemented

### 3.1. Futuristic AI-Themed Authentication & Persona Switcher
- **Neural Mesh Backdrop**: Custom CSS radial gradient mesh with glowing particle nodes.
- **Domain Guard**: Restricts sign-in strictly to `@taskflow.company` corporate emails.
- **1-Click Evaluation Switcher**: Pre-configured switcher cards for all 7 seeded personas allowing instant authorization switching without credentials.

### 3.2. Scoped Kanban Board & Drag-and-Drop Workflow
- **5 Workflow Status Columns**: `To Do`, `In Progress`, `Review`, `Support`, `Done`.
- **Card-Face Label Tags**: Displays tags directly on Kanban cards (`Figma`, `Wireframes`, `Mobile`, `UI/UX`, `SEO`, `API`) with color-coded badge styling.
- **1-Click Quick Filter Bar**: Instant filter chips for `Assigned to Me`, `#Figma`, `#UI/UX`, `#Mobile`, `#Wireframes`, `#SEO`, and `#API`.
- **Role-Gated Drag and Drop**: Drag-and-drop moves evaluate permission rules (`isSuperAdmin`, `isTeamLead`, `isAssignee`) before applying status mutations.

### 3.3. Cross-Team Incoming Queue Routing
- **Decoupled Request Flow**: When a member of Team A (e.g. Marketing) needs work from Team B (e.g. Creative), the task is submitted as an `incoming` request.
- **Lead Triage Console**: Incoming tasks bypass normal Kanban columns and route directly to Team B's **Incoming Queue**. The Team Lead reviews the scope, assigns an internal team member, and moves it to `To Do`.

### 3.4. Role-Scoped Reports & Native Exporter
- **Three Scoped Perspectives**:
  - **My Report**: Individual member task performance.
  - **Team Report**: Scoped strictly to the user's active team (`Creative`, `Marketing`, `Development`).
  - **Company Report**: Executive-level overview accessible **exclusively to Super Admin**.
- **Multi-Format Export**: Native client-side CSV and Excel generation parsing task IDs, titles, assignees, priorities, status, and due dates.

### 3.5. Super Admin Executive Portfolio & Member CRUD Console
- **Executive Console**: Global company SLA pass rate, team velocity metrics, active backlog counts, and department output charts.
- **Full User CRUD**: Super Admin interface to **Create New Members** (`@taskflow.company`), **Update Roles** via inline dropdowns, and **Delete Members** with confirmation dialogs.
- **1-Click Seed Trigger**: Endpoint `/api/seed` allowing 1-click re-initialization of 30+ tasks and 7 personas.

### 3.6. Power-User Navigation Tools
- **Global Command Palette (`⌘ K` / `Ctrl K`)**: Keyboard-driven modal search querying tasks, user profiles, and labels in real time.
- **Keyboard Shortcuts Cheatsheet (`?`)**: Interactive hotkeys guide for power users.

---

## 4. Role-Based Access Control (RBAC) & Permission Matrix

TaskFlow enforces strict server-checked and client-sanitized authorization boundaries:

```
+-----------------------------------------------------------------------------------------------+
| FUNCTIONALITY                    | TEAM MEMBER       | TEAM LEAD         | SUPER ADMIN        |
+-----------------------------------------------------------------------------------------------+
| View Team Board & Tasks          |  YES (Own Team)   |  YES (Own Team)   |  YES (All Teams)   |
| Create New Tasks                 |  YES              |  YES              |  YES               |
| Post Comments & Discuss          |  YES              |  YES              |  YES               |
| Raise Cross-Team Request         |  YES              |  YES              |  YES               |
| Move Status of Own Task          |  YES              |  YES              |  YES               |
| Move Status of Others' Tasks     |  NO (Restricted)  |  YES (Own Team)   |  YES (All Teams)   |
| Access Incoming Queue Console    |  NO               |  YES (Own Team)   |  YES (All Teams)   |
| Assign / Reassign Members        |  NO               |  YES (Own Team)   |  YES (All Teams)   |
| View Team Reports                |  YES (Own Team)   |  YES (Own Team)   |  YES (All Teams)   |
| View & Export Company Report     |  NO               |  NO               |  YES (Exclusive)   |
| Access Member CRUD Console       |  NO               |  NO               |  YES (Exclusive)   |
| View Executive Portfolio & KPIs  |  NO               |  NO               |  YES (Exclusive)   |
+-----------------------------------------------------------------------------------------------+
```

---

## 5. Data Schemas & Database Modeling

```typescript
// Mongoose / TypeScript User Schema Definition
interface IUser {
  _id: string;
  name: string;
  email: string; // Strictly @taskflow.company
  role: 'Team Member' | 'Team Lead' | 'Super Admin';
  team: 'Creative' | 'Marketing' | 'Development';
  avatar: string;
  createdAt: string;
}

// Task Schema Definition
interface ITask {
  _id: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Support' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  team: 'Creative' | 'Marketing' | 'Development';
  assignedTo: string; // User ID reference
  createdBy: string;  // User ID reference
  raisedBy?: string;  // For cross-team incoming requests
  incoming?: boolean;
  dueDate: string;
  labels: string[];   // e.g. ["Figma", "Wireframes", "Mobile"]
  attachments?: string[];
  commentsCount?: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 6. Engineering Challenges, Runtime Failures & Technical Solutions

During development, several critical full-stack engineering challenges were encountered and resolved systematically:

### ⚠️ Challenge 1: Client-Side Mongoose Eval Exception
- **Symptom / Error**:
  ```text
  Runtime TypeError: Cannot read properties of undefined (reading 'User')
  models/User.ts (33:19) @ eval
  ```
- **Root Cause Analysis**:
  When Mongoose model definitions (`models/User.ts`) or DB connection logic (`lib/db.ts`) were directly imported into React Client Components (`'use client'`), Webpack attempted to bundle Node.js database drivers into browser chunks where `mongoose.models` is `undefined`.
- **Engineering Solution**:
  1. Created a strict **Server Actions RPC Boundary Layer** (`actions/taskActions.ts`, `actions/userActions.ts`, `actions/analyticsActions.ts`) annotated with `'use server'`.
  2. Moved all Mongoose operations into backend Server Actions and service files (`services/*`).
  3. Added optional chaining guards to all Mongoose model instantiations:
     ```typescript
     export const User: Model<IUserDocument> =
       (mongoose?.models?.User as Model<IUserDocument>) ||
       (mongoose?.model ? mongoose.model<IUserDocument>('User', UserSchema) : ({} as Model<IUserDocument>));
     ```
  4. Refactored Client Components (`AuthProvider.tsx`, `useAuthStore.ts`) to call RPC actions (`getUserByEmailAction`) instead of importing DB models directly.

---

### ⚠️ Challenge 2: Next.js 15 Static Page Generation Missing `/_not-found` Route
- **Symptom / Error**:
  ```text
  Error [PageNotFoundError]: Cannot find module for page: /_not-found
  > Build error occurred: Failed to collect page data for /_not-found
  ```
- **Root Cause Analysis**:
  Next.js 15 App Router strict static page collection requires an explicit `app/not-found.tsx` component to generate fallback static error pages during `next build`.
- **Engineering Solution**:
  Created `app/not-found.tsx` returning a styled glassmorphic 404 page with navigation back to `/dashboard`.

---

### ⚠️ Challenge 3: Vercel CLI Project Naming Rejection
- **Symptom / Error**:
  ```text
  Error: Project names can be up to 100 characters long and must be lowercase. 
  They can include letters, digits, and characters like '.' and '-'.
  ```
- **Root Cause Analysis**:
  Vercel CLI defaulted to using the local directory name (`Ambizcon_Project`), which contained uppercase letters.
- **Engineering Solution**:
  Passed explicit project name flag `--name taskflow-saas-app` during deployment:
  ```bash
  npx -y vercel --name taskflow-saas-app --yes
  ```

---

### ⚠️ Challenge 4: Granular Task Level Edit Permissions
- **Requirement**:
  Allow Team Members to view peer tasks and post comments, while restricting status level edits (`Todo` $\rightarrow$ `Done`) strictly to Team Leads, Super Admins, or task Assignees.
- **Engineering Solution**:
  Enforced dual-layer permission checks:
  1. **UI Layer (`TaskDetailModal.tsx`)**: Computed `canChangeStatus` flag. If false, status dropdown is replaced with a locked badge: `Status Edit Restricted (Lead/Assignee Only)`.
  2. **Kanban Drag-and-Drop (`KanbanBoard.tsx`)**: Added `canMove` verification inside `handleDrop`. Unauthorized drag attempts trigger toast notices and revert state.

---

## 7. Performance & Bundle Size Optimizations

By decoupling database logic from client components and leveraging Next.js 15 Server Actions, significant bundle optimizations were achieved:

- **First Load JS Payload**: Reduced from **271 kB** down to **102 – 126 kB** (a **53.5% reduction** in client JS overhead).
- **Build Output Summary**:
  ```text
  Route (app)                                 Size  First Load JS
  ┌ ○ /                                      492 B         106 kB
  ├ ○ /_not-found                            128 B         102 kB
  ├ ○ /analytics                            113 kB         224 kB
  ├ ƒ /api/seed                              128 B         102 kB
  ├ ○ /dashboard                           6.19 kB         127 kB
  ├ ○ /incoming                            5.07 kB         132 kB
  ├ ○ /kanban                              6.91 kB         173 kB
  ├ ○ /login                               3.34 kB         133 kB
  ├ ○ /profile                             3.72 kB         121 kB
  ├ ○ /reports                             5.56 kB         127 kB
  ├ ○ /settings                            5.43 kB         126 kB
  └ ○ /users                               6.13 kB         175 kB
  + First Load JS shared by all             102 kB
  ```

---

## 8. Production Deployment Architecture

- **GitHub Repository**: [https://github.com/mathankarthidev-ai/taskflow](https://github.com/mathankarthidev-ai/taskflow)
- **Live Production Application (Vercel)**: [https://taskflow-saas-app-nine.vercel.app](https://taskflow-saas-app-nine.vercel.app)
- **Dual Data Store Operation**:
  - **With `MONGODB_URI`**: Connects to MongoDB Atlas Cloud Cluster.
  - **Without `MONGODB_URI`**: Uses in-memory seed data repository (`lib/mock-store.ts`), ensuring 100% functionality out-of-the-box on Vercel preview environments.

---

## 9. Future Enhancements & Production Roadmap

1. **Google OAuth 2.0 & SAML SSO Integration**: Upgrade mock authentication to enterprise NextAuth.js OAuth providers.
2. **Real-Time Task Synchronization**: Implement WebSockets or Server-Sent Events (SSE) for live collaborative Kanban updates across active users.
3. **Database Row Level Security (RLS)**: Enforce database-level tenant isolation rules.
4. **Figma Canvas Embedding**: Allow native embedding of live Figma wireframes directly inside task attachment modals.
5. **CI/CD Pipeline**: Automated GitHub Actions testing workflow for pull requests and main branch deployments.

---
*Documentation compiled and generated for TaskFlow Technical Take-Home Submission.*
