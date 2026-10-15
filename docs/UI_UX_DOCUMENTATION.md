# 🎨 TaskFlow SaaS — UI/UX, Page & Component Documentation

> **Document Version:** 2.0.0  
> **Status:** Production Verified  
> **Design Language:** Modern Glassmorphism, Dark/Light Hybrid, Neon Glow Tokens  
> **Last Updated:** October 15, 2026

---

## 1. Design System & Theming Architecture

TaskFlow utilizes a tailored design system powered by Tailwind CSS tokens:
- **Primary Brand Gradient:** `ambizcon-gradient` (`linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%)`).
- **Glow Shadow:** `shadow-glow` (`0 0 20px rgba(99, 102, 241, 0.35)`).
- **Glassmorphism Panels:** `.glass-panel` backdrop-filter blur (`backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80`).
- **Color Palettes:**
  - `Creative`: Purple / Violet accents (`#a855f7`)
  - `Marketing`: Rose / Amber accents (`#f43f5e`, `#f59e0b`)
  - `Development`: Cyan / Indigo accents (`#06b6d4`, `#6366f1`)

---

## 2. Navigation Architecture

### 2.1. Top Navigation Bar ([`components/layout/Header.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/layout/Header.tsx))
- **Elements:**
  1. **Logo & Company Brand:** TaskFlow branding with live company entity indicator.
  2. **Multi-Entity Switcher:** Dropdown toggle for `Ambizcon Health - India` vs. `Ambizcon Australia` (Super Admin & TL only).
  3. **Global Search Button:** Trigger for Command Palette (`⌘K`).
  4. **"Create Task" Button:** Gradient action button uniformly opening task creation modal.
  5. **Notification Bell Dropdown:** Displays unread count badge; opens smooth dropdown list with read/unread toggles.
  6. **Profile Menu Dropdown:** Contains active user avatar, role badge, Birthday ("BD") indicator, dark/light theme switcher, and Logout.
- **Role Scoping:** "Ambizcon Health" and AU options are visible only to Super Admin and Team Leads; hidden from Team Members. Profile section is centralized exclusively in the navbar.

### 2.2. Left Sidebar ([`components/layout/Sidebar.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/layout/Sidebar.tsx))
- **Navigation Links:**
  - 📊 **Dashboard** (`/dashboard`)
  - 📋 **Bizzy Board (Kanban)** (`/kanban`)
  - 📥 **Incoming Requests** (`/incoming`)
  - 💬 **Team Chat** (`/chat` - displays unread badge)
  - ⏰ **Attendance & Kiosk** (`/attendance`)
  - 💰 **Reimbursements** (`/reimbursements`)
  - 🔔 **Reminders** (`/reminders`)
  - 📝 **Self Reminders** (`/self-reminders`)
  - 📈 **Analytics** (`/analytics`)
  - 📑 **Reports** (`/reports`)
  - 👥 **Team Members** (`/users` - Super Admin only)
  - ⚙️ **Settings** (`/settings`)
- **Responsive Behavior:** Collapses into a responsive hamburger slide-out drawer on mobile screens (`< 1024px`).

---

## 3. Page Inventory & UX Breakdown

### 3.1. Dashboard Overview (`/dashboard`)
- **Purpose:** Executive and daily operational cockpit.
- **Key Widgets:**
  - **KPI Banner:** Total active tasks, tasks in review, completed today, velocity score.
  - **Team Presence Muster Panel:** Live employee clock-in status, punch time, working hours, break indicators, and country entity toggle.
  - **Hourly Work Tracker Panel:** Daily work log slot timeline allowing members to log tasks against specific hours.

### 3.2. Core Kanban Board (`/kanban`)
- **Purpose:** Primary task management board.
- **Controls:**
  - View switcher: **Board**, **List**, and **Calendar**.
  - Quick filter bar: `Assigned to Me`, `#Figma`, `#UI/UX`, `#Mobile`, `#SEO`, `#API`.
  - Search bar with instant string debounce.
  - Inline Quick Task input: `[New task...] [Add]`.
- **Card Elements:** Priority pill, client tag, estimated hours, checklist progress bar, assignee avatar, and approval badge (`✅ Approved`).

### 3.3. Reimbursements & Claims Ledger (`/reimbursements`)
- **Purpose:** Expense claim submission, bill attachments, and managerial signoff.
- **Ledger Table:** Columns for Claim No, Submitter, Category, Amount (₹), Date, Status, Receipt Thumbnail, and Actions.
- **Actions:**
  - **"Edit Claim"**: Visible only when status is `Pending Approval`. Allows full editing.
  - **"View Receipt"**: Triggers inline Receipt Inspector with zoom (+/-), rotation (90°), and pan.
  - **"Approve / Reject"**: Modal for Admin review notes and status updates.

### 3.4. Attendance & Reception Kiosk (`/attendance`)
- **Purpose:** Clock-in/out hub and live office attendance.
- **Components:**
  - **Punch Clock Card:** Live digital clock, current punch status, elapsed timer, break triggers (`Tea Break`, `Lunch Break`).
  - **Kiosk Trigger:** Opens full-screen rotating QR code kiosk (Admin/Reception only).
  - **Scanner Trigger:** Opens device camera modal for scanning kiosk QR code.
  - **Festival Leaves & Balances:** Table displaying common national holidays and leave quotas.

---

## 4. Key Modals Breakdown

| Modal Component | Trigger | Purpose |
|---|---|---|
| [`TaskCreateModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/features/tasks/TaskCreateModal.tsx) | "Create Task" button | Task creation with 11 Quick Start repetitive templates, file attachments (< 5MB), and cross-team toggling. |
| [`TaskDetailModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/features/tasks/TaskDetailModal.tsx) | Task card click | Detailed brief, interactive checklist, time logging, review footprint history, and TL approval controls. |
| [`ReviewerSelectModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/tasks/ReviewerSelectModal.tsx) | Member dragging to Done | Forces selection of Team Lead reviewer and submission note before marking review status. |
| [`DynamicQrKioskModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/attendance/DynamicQrKioskModal.tsx) | "Launch Kiosk" button | Full-screen reception terminal with 15-second rotating cryptographic QR token. |
| [`GlobalSearchModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/layout/GlobalSearchModal.tsx) | `⌘K` or search bar | Keyboard-driven omni-search for tasks, team members, and client records. |
| [`KeyboardShortcutsModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/layout/KeyboardShortcutsModal.tsx) | `?` key | Hotkey guide (`N` for Create Task, `B` for Board, `L` for List, `C` for Calendar). |
