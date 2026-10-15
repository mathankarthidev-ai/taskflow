# 📦 TaskFlow SaaS — Complete Feature Inventory & Functional Audit

> **Document Version:** 2.0.0  
> **Status:** Production Verified  
> **Last Updated:** October 15, 2026

---

## 1. Feature Matrix Summary

| ID | Feature Name | Core Category | Access Roles | Implementation Status |
|---|---|---|---|---|
| **FEAT-01** | **Multi-Column Drag-and-Drop Kanban Board** | Task Operations | Super Admin, Admin, TL, Team Member | **Completed & Verified** |
| **FEAT-02** | **11 Repetitive Quick Start Task Templates** | Task Operations | Super Admin, Admin, TL, Team Member | **Completed & Verified** |
| **FEAT-03** | **Board, List, and Calendar View Switcher** | Task Operations | All Roles | **Completed & Verified** |
| **FEAT-04** | **Two-Tiered Review Approval with Footprints** | Workflow Governance | Super Admin, Admin, TL, Team Member | **Completed & Verified** |
| **FEAT-05** | **Cross-Team Incoming Queue Triage** | Department Routing | Super Admin, Admin, TL | **Completed & Verified** |
| **FEAT-06** | **Pre-Approval Reimbursement Claim Editing** | Finance & Expenses | All Roles (Submitter + Approver) | **Completed & Verified** |
| **FEAT-07** | **Receipt Inspector with Zoom, Rotation & Pan** | Finance & Expenses | All Roles | **Completed & Verified** |
| **FEAT-08** | **Dynamic 15-Second Rotating QR Kiosk** | Attendance & Kiosk | Super Admin, Admin, Reception Staff | **Completed & Verified** |
| **FEAT-09** | **Mobile Camera QR Scanner & Break Timer** | Attendance & Kiosk | All Roles | **Completed & Verified** |
| **FEAT-10** | **Nightly Midnight Auto-Clockout Routine** | Attendance & Kiosk | System Automated | **Completed & Verified** |
| **FEAT-11** | **Team Presence Muster & Hourly Work Tracker** | Management & Oversight | Super Admin, Admin, TL | **Completed & Verified** |
| **FEAT-12** | **Festival Leaves & Admin Balance Adjuster** | HR & Leaves | Super Admin, Admin, TL | **Completed & Verified** |
| **FEAT-13** | **Scoped Notification Targeting (Noise Shield)** | Notifications & Alerts | Super Admin, Admin, TL, Target Member | **Completed & Verified** |
| **FEAT-14** | **Web Audio API Synthesized Chime Engine** | Audio & Feedback | All Roles | **Completed & Verified** |
| **FEAT-15** | **Multi-Entity Switcher (India vs. Australia)** | Multi-Tenancy | Super Admin, Admin, TL | **Completed & Verified** |
| **FEAT-16** | **Real-Time Group Channels & Direct Chat** | Communications | All Roles | **Completed & Verified** |
| **FEAT-17** | **Multi-Perspective Reports & CSV/XLSX Export**| Business Intelligence | Super Admin (Company), TL (Team), Member (My) | **Completed & Verified** |
| **FEAT-18** | **Global Command Palette (`⌘K`) & Hotkeys** | Power-User UX | All Roles | **Completed & Verified** |
| **FEAT-19** | **Super Admin User Management CRUD Console** | Administration | Super Admin Exclusive | **Completed & Verified** |
| **FEAT-20** | **Clean Database Slate (Zero Mock Data)** | Data Hygiene | System Wide | **Completed & Verified** |

---

## 2. In-Depth Feature Breakdown

### FEAT-01: Multi-Column Drag-and-Drop Kanban Board
1. **Business Purpose:** Visual pipeline management showing task status from inception to delivery.
2. **Accessible Roles:** Super Admin, Admin, Team Lead, Team Member.
3. **User Workflow:** User opens `/kanban`, views cards categorized under `To Do`, `In Progress`, `Review`, `Support`, `Done`. Dragging cards triggers status transition.
4. **Frontend Modules:** [`features/kanban/KanbanBoard.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/features/kanban/KanbanBoard.tsx), [`features/tasks/TaskCard.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/features/tasks/TaskCard.tsx).
5. **Backend Logic:** `updateTaskStatusAction()` in [`actions/taskActions.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/actions/taskActions.ts).
6. **Database Table:** `public.tasks`.
7. **Validation & Permissions:** Members can only drag their own tasks; dragging to `Done` is intercepted if the user is not a TL/Admin.
8. **Testing Status:** Verified in production across desktop and tablet viewports.

---

### FEAT-02: 11 Repetitive Quick Start Task Templates
1. **Business Purpose:** Eliminates repetitive typing of daily agency tasks; guarantees standardized checklists across marketing, content, SEO, and dev operations.
2. **Accessible Roles:** All authenticated users.
3. **User Workflow:** Click "Create Task" -> Select template from Quick Start dropdown -> Title, checklist, estimated hours, and department auto-fill -> Click Create.
4. **Implemented Templates:**
   - **Marketing, Content & SEO:** *Blogs drafting*, *Content Creation*, *Mailer*, *SEO & Keywords*, *Website Content Creation & Drafting*, *Blog*, *SEO revamp*, *SEO audit*, *Google ads*, *Monthly social planning*, *Awareness day content*.
   - **Development, Website & Logs:** *Daily & User Log (user log, daily log, website performance, plugin update)*, *Page creation*, *Monthly tasks page speed*, *Website task backup*, *WP build*, *WP maintenance*, *Speed optimization*.
   - **Creative & Media:** *Weekly social media*, *Video production & editing*, *Meta ads creatives*, *Client design collateral*, *Client revisions & delivery*.
5. **Frontend Modules:** [`features/tasks/TaskCreateModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/features/tasks/TaskCreateModal.tsx), [`lib/seed-data.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/lib/seed-data.ts).
6. **Backend Logic:** `createTaskAction()` in [`actions/taskActions.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/actions/taskActions.ts).

---

### FEAT-04: Two-Tiered Review Approval with Footprints
1. **Business Purpose:** Enforces quality control and managerial signoff before tasks are marked complete.
2. **Accessible Roles:** Team Members submit for review; Team Leads / Super Admins approve or request changes.
3. **User Workflow:**
   - Member moves task to `Review` -> Selects Reviewer (TL) -> Enters submission note.
   - Task displays amber `⏳ In Review (TL Name)` badge.
   - TL reviews submission in `TaskDetailModal`:
     - **Option A (Approve):** Clicks "Approve Review to Completed (Done)" -> Task moves to `Done` -> Logs `[Footprint: Approved → Completed]`.
     - **Option B (Request Changes):** Clicks "Request Changes" -> Types review message -> Task reverts to `In Progress` with amber footprint.
4. **Frontend Modules:** [`features/tasks/TaskDetailModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/features/tasks/TaskDetailModal.tsx), [`components/tasks/ReviewerSelectModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/tasks/ReviewerSelectModal.tsx).
5. **Database Table:** `public.tasks` (`review_status`, `assigned_reviewer_id`, `review_note`, `history` JSONB).

---

### FEAT-06: Pre-Approval Reimbursement Claim Editing
1. **Business Purpose:** Allows employees to correct typos, attach missing receipts, or adjust amounts on expenses before management reviews them.
2. **Accessible Roles:** Any employee who submitted the claim.
3. **User Workflow:** User navigates to `/reimbursements` -> Clicks "Edit" icon on any claim with status `Pending Approval` -> Modal opens pre-populated -> User updates fields or re-uploads receipt -> Clicks "Save Changes".
4. **Security Lock:** Once an Admin marks the claim `Approved`, `Rejected`, or `Paid`, the edit button disappears, locking the record for financial auditing.
5. **Frontend Modules:** [`app/(dashboard)/reimbursements/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/%28dashboard%29/reimbursements/page.tsx).
6. **Database Table:** `public.reimbursements`.

---

### FEAT-08: Dynamic 15-Second Rotating QR Kiosk
1. **Business Purpose:** Completely eliminates buddy punching by requiring physical presence at the office kiosk terminal.
2. **Accessible Roles:** Super Admin, Admin, Reception Staff.
3. **User Workflow:** Kiosk runs on tablet at reception -> Fetches new cryptographic token every 15s via `/api/attendance/qr/token` -> Renders dynamic canvas QR code with countdown timer.
4. **Frontend Modules:** [`components/attendance/DynamicQrKioskModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/attendance/DynamicQrKioskModal.tsx).
5. **Backend Endpoints:** `app/api/attendance/qr/token/route.ts`, `app/api/attendance/qr/scan/route.ts`.

---

### FEAT-13: Scoped Notification Targeting (Noise Shield)
1. **Business Purpose:** Eliminates alert fatigue by delivering task updates strictly to stakeholders.
2. **Rule:** *"When a task is completed, notify Super Admin, Team Lead, and that specific member (e.g. Mathan MK); do not notify other team members."*
3. **Frontend Modules:** [`lib/notification-filter.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/lib/notification-filter.ts), [`store/useNotificationStore.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/store/useNotificationStore.ts), [`components/layout/Header.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/layout/Header.tsx).
4. **Testing Status:** Verified in production. Unrelated team members receive 0 popups, 0 badge increments, and 0 audio chimes.

---

### FEAT-15: Multi-Entity Switcher (India vs. Australia)
1. **Business Purpose:** Supports multi-national operations across Ambizcon India and Ambizcon Australia.
2. **Accessible Roles:** Super Admin and Team Leads.
3. **User Workflow:** Click country flag switcher in header -> Select "Ambizcon Health - India" or "Ambizcon Australia" -> Entire dashboard, presence muster, and leave balances filter immediately.
4. **Frontend Modules:** [`store/useCompanyStore.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/store/useCompanyStore.ts), [`lib/company-filter.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/lib/company-filter.ts).
