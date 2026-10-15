# 📋 TaskFlow SaaS — Product Requirements Document (PRD)

> **Document ID:** PRD-TASKFLOW-2026-V2  
> **Status:** Production Verified  
> **Author:** Mathan P (Super Admin / AI PM)  
> **Last Updated:** October 15, 2026

---

## 1. Product Overview

**TaskFlow** is an integrated SaaS productivity, task orchestration, and workforce operations suite developed specifically for multi-departmental corporate teams (Creative, Marketing, Development). It bridges project execution with HR operations—delivering Kanban task tracking, two-tiered review approvals, cross-team request routing, dynamic QR attendance, expense reimbursement management, team presence monitoring, and internal team chat.

---

## 2. Background & Problem Statement

Prior to TaskFlow, internal agency operations suffered from fragmentation:
- **Task Tracking:** Team members managed tasks on personal notebooks, ad-hoc spreadsheets, or scattered Trello boards, preventing Team Leads from having unified sprint visibility.
- **Cross-Team Hand-offs:** Creative design requests from Marketing routinely fell through the cracks without an audit trail or designated reviewer.
- **Attendance & Presence:** Traditional biometric machines lacked mobile integration, while honor-system clock-ins led to buddy-punching and inaccurate work hours.
- **Reimbursement Bottlenecks:** Physical receipts were misplaced, and employees had no visibility into whether their expense claims had been reviewed by Admin or paid.
- **Notification Noise:** System alerts were blasted indiscriminately to all employees, leading to alert fatigue where urgent task reviews were ignored.

---

## 3. Vision & Core Objectives

1. **Unified Operational Hub:** Provide a single source of truth for all day-to-day work, client projects, and internal requests.
2. **Accountability via Footprints:** Ensure every status transition, review submission, and manager feedback note is logged with an immutable audit footprint.
3. **Frictionless Workforce Operations:** Streamline office attendance with rotating QR codes and transparent hourly work logging.
4. **Intelligent Information Flow:** Enforce role-based visibility and scoped notification delivery so employees only see what is relevant to their job.

---

## 4. User Personas

| Persona | Role | Primary Goals | Daily Pain Points |
|---|---|---|---|
| **Mathan P** | Super Admin / AI PM | Company velocity, SLA compliance, cross-entity visibility (India & Australia), user management, payroll oversight. | Managing disparate systems, lacking real-time headcount visibility. |
| **Anirudh** | Team Lead (Development) | Sprint planning, code review approvals, unblocking team members, reviewing incoming requests. | Reviewing tasks without clear footprints; managing interruptions. |
| **Mathan MK** | Team Member (Developer) | Clear daily task checklists, logging standard & overtime hours, tracking reimbursement claims, clocking in/out easily. | Unclear acceptance criteria, noisy notifications, delayed bill approvals. |
| **Preethi** | Team Member (Creative) | Creating repetitive marketing collateral, receiving design briefs, uploading assets for review. | Manually creating repetitive tasks from scratch; tracking client revisions. |
| **Sneha** | Reception Staff | Fast employee clock-in processing, monitoring live office presence. | Manual paper sign-in sheets, unverified attendance disputes. |

---

## 5. Functional Requirements (FR)

### 5.1. Task & Kanban Management
- **FR-TASK-001 (Kanban Columns):** System shall support 5 standard workflow columns: `To Do`, `In Progress`, `Review`, `Support`, and `Done`.
- **FR-TASK-002 (Quick Start Templates):** System shall provide 11 pre-configured repetitive task templates with auto-populated checklists, estimated hours, and department assignment:
  1. *Blogs drafting*
  2. *Content Creation*
  3. *Mailer*
  4. *SEO & Keywords*
  5. *Website Content Creation & Drafting*
  6. *Daily & User Log*
  7. *Blog*
  8. *Page creation*
  9. *Monthly tasks page speed*
  10. *Website task backup*
  11. *SEO revamp*
- **FR-TASK-003 (Custom Template Creation):** Team Leads and Admins shall be able to save custom task templates directly to local storage and the team registry.
- **FR-TASK-004 (Standardized Action):** Every task creation button across the top navbar, Kanban board, and dashboard shall uniformly read **"Create Task"**.
- **FR-TASK-005 (Alternative Views):** System shall support 1-click switching between **Board View**, **List View**, and **Calendar View**.
- **FR-TASK-006 (Checklist Tracking):** Task modal shall support interactive `[ ]` checklist toggles with automatic progress percentage calculation.
- **FR-TASK-007 (Time Logging):** Users shall be able to log work hours against tasks, with a dedicated toggle for **"Worked Extra Hr (Overtime)"**.

### 5.2. Review & Approval Workflow
- **FR-REV-001 (Completion Restriction):** Only Team Leads and Super Admins shall have authority to move a task to `Done` (Completed).
- **FR-REV-002 (Review Submission):** When a Team Member attempts to complete a task, the system shall prompt them to select a Team Lead reviewer and submit a submission note.
- **FR-REV-003 (Review Footprint):** Every review transition shall append an immutable footprint record containing performer name, role, timestamp, reviewer, and optional note.
- **FR-REV-004 (Changes Requested):** Team Leads shall be able to send tasks back to `In Progress` with a specific review feedback message.

### 5.3. Cross-Team Request Pipeline
- **FR-CROSS-001 (Incoming Task Flag):** Users creating tasks for a department other than their own shall flag them as `incoming: true`.
- **FR-CROSS-002 (Triage Queue):** Incoming tasks shall appear in the target team's **Incoming Queue** and remain hidden from active sprint boards until triaged and assigned by the target Team Lead.

### 5.4. Attendance & QR Kiosk
- **FR-ATT-001 (Dynamic Rotating QR):** The Kiosk display shall generate a cryptographically signed QR code token that auto-rotates every 15 seconds.
- **FR-ATT-002 (Mobile Camera Scanner):** Employees shall scan the kiosk QR using their device camera to securely clock in or clock out.
- **FR-ATT-003 (Break Management):** System shall support `Tea Break` and `Lunch Break` states, tracking elapsed break time against working hours.
- **FR-ATT-004 (Automated Midnight Clockout):** Any unclosed clock-in sessions at 23:59:59 IST shall be automatically closed to prevent artificial overnight hour accumulation.

### 5.5. Reimbursements & Claims
- **FR-REIMB-001 (Claim Submission):** Employees shall submit expense claims specifying category, title, description, amount, date, payment mode, vendor, and bill attachments.
- **FR-REIMB-002 (Pre-Approval Editing):** Employees shall be permitted to edit any field of their submitted claim while its status is `Pending Approval`.
- **FR-REIMB-003 (Immutable Lock):** Once approved or rejected by Admin, claims shall become strictly read-only.
- **FR-REIMB-004 (Receipt Zoom Inspection):** Admins and users shall inspect attached receipts with inline zoom, rotation, and pan controls.
- **FR-REIMB-005 (Empty-by-Default Ledger):** Mock/demo bills shall never be auto-generated; ledger shows only authentic user claims.

### 5.6. Scoped Notification System
- **FR-NOTIF-001 (Task Completion Targeting):** When a task is marked `Done` or approved:
  - **Super Admin & Admin:** SHALL receive the notification.
  - **Team Lead:** SHALL receive the notification.
  - **Assigned/Completing Member (e.g., Mathan MK):** SHALL receive the notification.
  - **Other Team Members:** SHALL NOT receive notifications, popups, or audio chimes.
- **FR-NOTIF-002 (Dropdown Architecture):** Notification bell in the navbar shall open in a smooth, non-disruptive dropdown panel.
- **FR-NOTIF-003 (Synthesized Audio Chime):** Distinct audio sounds shall play for task updates, self-reminders, and chat messages using Web Audio API synthesis without external audio file dependencies.

### 5.7. Multi-Entity Management
- **FR-COMP-001 (Entity Switcher):** Top navbar shall provide a 1-click company switcher between **Ambizcon Health - India** and **Ambizcon Australia**.
- **FR-COMP-002 (Data Isolation):** Team presence, leave quotas, and employee lists shall filter dynamically based on the active company entity.

---

## 6. Non-Functional Requirements (NFR)

- **NFR-PERF-001 (Page Load):** Initial First Contentful Paint (FCP) shall be `< 1.2s` on 4G networks; First Load JS shared by all routes shall remain `< 110 kB`.
- **NFR-PERF-002 (Compilation):** Next.js production build shall compile all static and dynamic pages with 0 TypeScript or linting errors.
- **NFR-SEC-001 (Data Integrity):** Passwords and private API secrets shall never be logged to client consoles, committed to Git, or exposed in client bundles.
- **NFR-SEC-002 (File Upload Guard):** All file uploads (task documents, receipt attachments) shall strictly enforce a client and server file size limit of `5 MB`.
- **NFR-AVAIL-001 (Uptime):** Hosted on Vercel Edge Serverless infrastructure with an availability target of `99.9%`.
- **NFR-RESP-001 (Device Compatibility):** Full responsive layout supporting mobile screens (`375px+`), tablets (`768px+`), and desktop displays (`1280px+`).

---

## 7. User Stories & Acceptance Criteria

### User Story 1: Quick Task Creation
> *As a Team Member (e.g., Preethi in Creative), I want to pick a repetitive task template like "Blogs drafting" so that I do not waste time typing standard checklists every morning.*

**Acceptance Criteria:**
1. Clicking **"Create Task"** opens modal with Quick Start dropdown.
2. Selecting `Blogs drafting` immediately populates:
   - Title: `Blogs drafting`
   - Description with `[ ] Title & Meta Decriptions`, `[ ] Hyperlinking of internal & external links`, `[ ] CTA/Author`
   - Estimated Hours: `4h`
   - Target Team: `Marketing`
3. Submitting the task saves it directly to Supabase and inserts it into the `To Do` column.

### User Story 2: Task Completion Approval
> *As a Developer (e.g., Mathan MK), when I finish a task, I want to submit it to Anirudh (TL) for review so that there is an official footprint record of my completion.*

**Acceptance Criteria:**
1. Member dragging task to `Done` receives a friendly notice that TL approval is required.
2. System opens reviewer selection modal with TL pre-selected.
3. Member enters optional submission note and clicks "Submit for Review".
4. Status moves to `Review`; audit log records `[Footprint: Mathanmk → Anirudh] Moved to Review`.
5. When Anirudh clicks "Approve", status moves to `Done`, approval badge is displayed on card, and notifications are sent **only** to Admin, Anirudh, and Mathan MK.

---

## 8. Success Metrics & KPIs

| Metric | Target | Current Status |
|---|---|---|
| Production Build Status | 0 Errors, 0 Type Failures | **Pass (Verified 15 Oct 2026)** |
| Static Page Generation | 100% of 34 App Routes | **Pass (34/34 generated)** |
| Quick Start Template Time Saved | > 75% reduction in task setup time | **Verified (Instant auto-population)** |
| False Positive Notifications | 0 alerts to unrelated members | **Verified (Strict filter active)** |
| Kiosk QR Rotation Interval | 15s cryptographic cycle | **Verified (Active in production)** |
