# 📘 Bizy Hub — Complete Codebase Architecture, Logic & Constraints Reference

This document provides a comprehensive audit and reference of all application code across **Bizy Hub** (formerly TaskFlow). For each file, it documents:
1. **Purpose & Responsibility**: Architectural role in the system.
2. **Constraints & Invariants**: Enforced security rules, role guards, data boundaries, validation limits, and operational assumptions.
3. **Functions & Methods**: Detailed breakdown of every function, parameter, return value, and the underlying business logic.

---

## Table of Contents
1. [Architecture Overview & System Principles](#1-architecture-overview--system-principles)
2. [Server Actions (`actions/`)](#2-server-actions-actions)
3. [API Route Handlers (`app/api/`)](#3-api-route-handlers-appapi)
4. [Application Routing & Pages (`app/`)](#4-application-routing--pages-app)
5. [Feature Modules (`features/`)](#5-feature-modules-features)
6. [Shared Components (`components/`)](#6-shared-components-components)
7. [Business Logic, Security & Stores (`lib/`)](#7-business-logic-security--stores-lib)
8. [Zustand Global State Stores (`store/`)](#8-zustand-global-state-stores-store)
9. [Service Layer & Context Providers (`services/`, `providers/`)](#9-service-layer--context-providers-services-providers)
10. [Type Definitions & Test Suites (`types/`, `scripts/`)](#10-type-definitions--test-suites-types-scripts)

---

## 1. Architecture Overview & System Principles

Bizy Hub is built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Zustand**, backed by **Supabase PostgreSQL** with an in-memory/localStorage seed store fallback.

### Core Architectural Constraints:
- **Two-Tier Task Workflow**: Tasks transition from `Todo` -> `In Progress` -> `Review` -> `Done`. Only designated Reviewers or Super Admins can transition a task from `Review` to `Done`.
- **Dual Company Multi-Tenancy**: Strict scoping between **Ambizcon (Brisbane HQ)** and **Ambizcon Health (Chennai HQ)**. Super Admins can toggle between branches; regular employees are scoped strictly to their assigned company.
- **Strict Role-Based Access Control (RBAC)**:
  - `Super Admin`: Unrestricted system access, user CRUD, group management, financial ledgers, company reports.
  - `Team Lead (TL)`: Team task assignments, reminder creation, review approvals, team attendance.
  - `Team Member`: Self task updates, time tracking, personal self-reminders, reimbursements.
- **Zero-Demo Real Data Invariant**: All counts and records reflect genuine operational data; if no records exist, values strictly display `0` / empty state.
- **5MB File Security Constraint**: Receipts and chat attachments are validated against a 5MB size ceiling and checked against safe MIME/extension allowlists. Executable extensions (`.exe`, `.bat`, `.cmd`, `.sh`, `.js`, etc.) are blocked.
- **Anti-Replay Dynamic QR Attendance**: Attendance kiosk QR tokens cycle every 15 seconds using HMAC-SHA256 signatures; used tokens are cached and immediately rejected on replay.

---

## 2. Server Actions (`actions/`)

### [`actions/taskActions.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/actions/taskActions.ts)
- **Role**: Server-side mutations and queries for task items.
- **Constraints**:
  - Enforces `TaskStatus` transitions (`Todo` -> `In Progress` -> `Review` -> `Done`).
  - Calls `revalidatePath('/dashboard')` and `revalidatePath('/kanban')` to keep Next.js server cache fresh.
- **Functions**:
  - `fetchTasksAction()`: Fetches all tasks via `taskService.getTasks()`.
  - `fetchTaskByIdAction(id: string)`: Retrieves single task by unique ID.
  - `createTaskAction(data: Partial<Task>)`: Creates a new task record.
  - `updateTaskAction(id: string, updates: Partial<Task>)`: Updates task metadata (title, due date, priority, assignee).
  - `updateTaskStatusAction(id: string, status: TaskStatus)`: Updates task status and appends timestamped audit log.
  - `updateTaskReviewWorkflowAction(id: string, reviewStatus, reviewNote, reviewerId, reviewerName)`: Records reviewer decisions (`approved`, `changes_requested`).
  - `deleteTaskAction(id: string)`: Permanently deletes a task.

### [`actions/userActions.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/actions/userActions.ts)
- **Role**: Server-side user profile, role, and roster management.
- **Constraints**:
  - Strictly Super Admin guarded for mutations.
  - Email addresses are normalized to lowercase.
- **Functions**:
  - `fetchAllUsersAction()`: Retrieves list of all registered employees.
  - `updateUserRoleAction(id: string, role: UserRole)`: Updates user authority tier.
  - `updateUserAction(id: string, updates: Partial<User>)`: Updates user team, work mode, company branch, or birthday.
  - `createUserAction(userData)`: Generates a new employee record and syncs default preferences.
  - `deleteUserAction(id: string)`: Removes an employee record.

### [`actions/attendanceActions.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/actions/attendanceActions.ts)
- **Role**: Server action wrappers for clock-in, clock-out, break toggles, and attendance ledgering.
- **Constraints**:
  - Validates employee session and active clock status.
  - Prevents starting break while already clocked out.
- **Functions**:
  - `clockInAction(userId, company)`: Records clock-in punch time and geo/network stamp.
  - `clockOutAction(userId)`: Calculates total shift duration, net active hours, and overtime.
  - `startBreakAction(userId)`: Marks active break session start.
  - `endBreakAction(userId)`: Closes active break session and tallies accumulated break minutes.

### [`actions/reimbursementActions.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/actions/reimbursementActions.ts)
- **Role**: Claim submission, manager approval workflow, and settlement payout processing.
- **Constraints**:
  - Mandatory receipt attachment required for any claim exceeding ₹200.
  - Settlements (`Paid`) auto-generate matching operational expense lines in Company Financials.
- **Functions**:
  - `submitReimbursementAction(claimData)`: Validates file payload, size limit (< 5MB), and creates pending claim.
  - `approveReimbursementAction(id, adminEmail)`: Sets claim status to `Approved`.
  - `settleReimbursementAction(id, adminEmail)`: Marks claim `Paid` and posts ledger debit to company financials.
  - `rejectReimbursementAction(id, adminEmail, reason)`: Rejects claim and logs decision note.

### [`actions/analyticsActions.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/actions/analyticsActions.ts)
- **Role**: Aggregates team productivity, completion velocity, and priority breakdowns.
- **Functions**:
  - `fetchAnalyticsAction(team?: TeamName | 'All')`: Returns KPI metrics (`completedTasks`, `overdueTasks`, `productivityRate`).

### [`actions/commentActions.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/actions/commentActions.ts)
- **Role**: Threaded task discussions and client comment audit trails.
- **Functions**:
  - `fetchTaskCommentsAction(taskId: string)`: Retrieves discussion thread.
  - `addCommentAction(taskId: string, text: string, authorId: string)`: Appends new comment and triggers notification.

---

## 3. API Route Handlers (`app/api/`)

### [`app/api/auth/me/route.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/api/auth/me/route.ts)
- **Constraint**: Reads secure HTTP cookie `taskflow_user` or bearer authorization header.
- **Logic**: Decodes current user session; returns 401 Unauthorized if missing or expired.

### [`app/api/attendance/qr/token/route.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/api/attendance/qr/token/route.ts)
- **Constraint**: Rate limited (max 60 calls/min). Valid for strictly 15 seconds.
- **Logic**: Issues cryptographic dynamic QR token HMAC-signed with server secret.

### [`app/api/attendance/qr/scan/route.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/api/attendance/qr/scan/route.ts)
- **Constraint**: Anti-replay validation. Rejects expired tokens (> 15s) and duplicate tokens.
- **Logic**: Validates signature, verifies user existence, punches clock-in/out, and invalidates token.

### [`app/api/attendance/clock-in/route.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/api/attendance/clock-in/route.ts) & [`clock-out/route.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/api/attendance/clock-out/route.ts)
- **Logic**: Handles manual web punch. Validates current status; writes punch record to `attendance-db`.

### [`app/api/attendance/auto-clockout/route.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/api/attendance/auto-clockout/route.ts)
- **Constraint**: Can be triggered by cron or midnight rollover.
- **Logic**: Identifies open shifts exceeding maximum shift duration (14 hours) and auto-closes them with an audit flag.

### [`app/api/reimbursements/submit/route.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/api/reimbursements/submit/route.ts)
- **Constraint**: 5MB payload limit. Rejects base64 strings larger than 5,242,880 bytes.
- **Logic**: Validates Zod payload schema, parses merchant info, saves receipt, and dispatches notification to TL/Admin.

### [`app/api/chat/route.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/api/chat/route.ts)
- **Logic**: Syncs chat messages between server store and client memory; resolves channel messages by channel ID.

### [`app/api/seed/route.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/api/seed/route.ts)
- **Constraint**: Super Admin authorization required.
- **Logic**: Resets database to standard initial mock state for testing and demonstration.

---

## 4. Application Routing & Pages (`app/`)

### [`app/layout.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/layout.tsx)
- **Role**: Root HTML shell, font declarations (`Geist`, `Geist_Mono`), global theme provider, Sonner toast toaster.
- **Metadata**: Branded as `Bizy Hub | Production Task & Operations SaaS`.

### [`app/(auth)/login/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/(auth)/login/page.tsx)
- **Role**: Authentication screen with Google Workspace sign-in and branch switcher (`Brisbane HQ` vs `Chennai HQ`).
- **Constraints**:
  - Restricts sign-in to `@ambizcon.com` authorized corporate emails.
  - Automatically initializes session in `useAuthStore` and sets secure cookie.

### [`app/(dashboard)/dashboard/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/(dashboard)/dashboard/page.tsx)
- **Role**: Executive dashboard overview displaying active tasks, team presence, hourly trackers, and upcoming deadlines.

### [`app/(dashboard)/kanban/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/(dashboard)/kanban/page.tsx)
- **Role**: Interactive Kanban board with columns (`Todo`, `In Progress`, `Review`, `Done`), List view, and Calendar view.
- **Export**: Includes one-click **Export CSV** for all active cards.

### [`app/(dashboard)/attendance/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/(dashboard)/attendance/page.tsx)
- **Role**: Comprehensive attendance terminal, punch card, daily muster ledger, and leave tracker.
- **Exports**:
  - **Export Daily Attendance** (All, Present-only, Absent-only).
  - **Export Monthly Muster CSV**.
  - **Export Leave Ledger CSV**.

### [`app/(dashboard)/finance/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/(dashboard)/finance/page.tsx)
- **Role**: Executive financial ledger tracking Revenues, Retainers, Payroll, and Reimbursements.
- **Constraints**: Super Admin only. Auto-syncs paid reimbursement expense lines.
- **Export**: Full Financial Statement CSV with interval selector (Daily, Weekly, Monthly, All-time).

### [`app/(dashboard)/reimbursements/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/(dashboard)/reimbursements/page.tsx)
- **Role**: Expense claim filing, manager approvals, receipts review, and settlement queue.
- **Exports**: Quick Download CSV and Custom Date Range + Status + Category CSV modal.

### [`app/(dashboard)/reminders/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/(dashboard)/reminders/page.tsx)
- **Role**: Recurrent task schedule viewer (`Daily`, `Weekly`, `Monthly`, `Yearly`, `Custom`).
- **Export**: **Export Reminders CSV** downloading all active task recurrence schedules.

### [`app/(dashboard)/self-reminders/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/(dashboard)/self-reminders/page.tsx)
- **Role**: Personal task notes and repetitive reminder alarms (`Once`, `Daily`, `Weekly`, `Monthly`, `Custom Days`).
- **Export**: **Export CSV** downloading personal checklists and alarm schedules.

### [`app/(dashboard)/reports/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/(dashboard)/reports/page.tsx)
- **Role**: Centralized audit center for task completion, reviewer footprints, and productivity exports.
- **Export**: Filterable task export to CSV and Excel (`BizyHub_<TYPE>_<PERIOD>_Report.csv`).

### [`app/(dashboard)/users/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/(dashboard)/users/page.tsx)
- **Role**: Super Admin employee directory, role promotions, team assignments, and festival leaves.
- **Export**: **Export Roster CSV** with employee names, emails, roles, teams, work modes, and birthdays.

### [`app/chat/page.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/app/chat/page.tsx)
- **Role**: Enterprise team chat workspace with All-in-One company channels, team channels, and direct messages.
- **Key Features**:
  - Auto-expanding `<textarea>` supporting **`Shift + Enter`** (new line) and **`Enter`** (send).
  - File attachments (< 5MB limit).
  - Member `@mentions` and threaded message replies.
  - **Export Chat CSV** exporting complete conversation history.

---

## 5. Feature Modules (`features/`)

### [`features/kanban/KanbanBoard.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/features/kanban/KanbanBoard.tsx)
- **Role**: Drag-and-drop task workflow orchestrator.
- **Methods**:
  - `handleStatusChange(taskId, newStatus)`: Validates permission; transitions task.
  - `handleQuickAdd(e)`: Creates task directly from inline top input bar.
  - `handleExportTasksCSV()`: Exports active scoped tasks to CSV.

### [`features/reports/ReportsView.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/features/reports/ReportsView.tsx)
- **Role**: Auditing engine for task completion records.
- **Constraints**: Restricted to Super Admin for company-wide reports.
- **Methods**:
  - `handleExportCSV()`: Formats task metadata into RFC-4180 compliant CSV file.

### [`features/users/UserManagementTable.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/features/users/UserManagementTable.tsx)
- **Role**: Member roster management table.
- **Methods**:
  - `handleCreateUser(e)`: Adds new employee with role, team, branch, work mode.
  - `handleUpdateRole(userId, newRole)`: Modifies role permissions with immediate toast feedback.
  - `handleExportRosterCSV()`: Generates and downloads employee directory CSV.

### [`features/tasks/TaskDetailModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/features/tasks/TaskDetailModal.tsx)
- **Role**: Comprehensive task modal with description, subtasks, audit logs, comments, and reviewer sign-off actions.

---

## 6. Shared Components (`components/`)

### [`components/layout/Header.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/layout/Header.tsx)
- **Role**: Global application top bar with search modal trigger, notification bell, branch badge, and user menu.
- **Audio Chimes**: Plays distinct sound notifications for Chat, Reminders, and Task assignments.

### [`components/layout/Sidebar.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/layout/Sidebar.tsx)
- **Role**: Main navigation rail with dynamic branch branding (**Bizy Hub** Brisbane HQ / **Bizy Hub Health** Chennai HQ).
- **Badges**: Shows live unread counts for Chat, Incoming queue, and Reminders.

### [`components/attendance/DynamicQrKioskModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/attendance/DynamicQrKioskModal.tsx)
- **Role**: Fullscreen office lobby QR kiosk for contactless attendance.
- **Constraints**: Cycles dynamic token every 15 seconds; displays remaining countdown progress ring.

### [`components/attendance/QrScannerModal.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/components/attendance/QrScannerModal.tsx)
- **Role**: Mobile camera scanner modal allowing employees to scan the lobby kiosk QR.

---

## 7. Business Logic, Security & Stores (`lib/`)

### [`lib/utils.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/lib/utils.ts)
- **Universal Functions**:
  - `cn(...inputs)`: Merges Tailwind CSS classes with `clsx` and `twMerge`.
  - `formatDate(date)`: Formats dates to clean standard display (`12 Oct 2026`).
  - `exportToCSV(filename, rows)`: Converts array of objects to CSV, handles quoting/escaping, and triggers instant browser download.

### [`lib/file-security.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/lib/file-security.ts)
- **Constraints & Logic**:
  - `MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024` (Strict 5MB ceiling).
  - `BLOCKED_EXTENSIONS`: Blocks `.exe`, `.bat`, `.cmd`, `.sh`, `.js`, `.vbs`, `.msi`.
  - `validateFileUpload(file)`: Returns `{ valid: boolean, error?: string }`.

### [`lib/session-security.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/lib/session-security.ts)
- **Constraints & Logic**:
  - Generates HMAC-SHA256 signed session tokens.
  - Verifies token validity and expires stale tokens after TTL.

### [`lib/rate-limiter.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/lib/rate-limiter.ts)
- **Constraints & Logic**:
  - Sliding-window rate limiter per client IP / User ID.
  - Blocks automated brute-force attacks on punch APIs (60 requests / minute max).

### [`lib/company-filter.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/lib/company-filter.ts)
- **Logic**:
  - `isTaskInCompany(task, company)`: Filters tasks based on active company branch context.
  - `isUserInCompany(user, company)`: Ensures employee directory strictly reflects selected branch.

### [`lib/chat-db.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/lib/chat-db.ts)
- **Storage Keys**: `taskflow_chat_messages_v3`, `taskflow_chat_channels_v3`.
- **Logic**:
  - Manages client-side IndexedDB/localStorage storage for real-time messaging.
  - Dispatches `CustomEvent` events (`taskflow_chat_message_sent`, `taskflow_chat_unread_updated`) to sync unread badges across the UI.

### [`lib/attendance-db.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/lib/attendance-db.ts)
- **Logic**:
  - Computes daily attendance metrics: `workHours`, `breakMinutes`, `overtimeMinutes`.
  - Normalizes punch records and manages offline fallbacks when database connection drops.

---

## 8. Zustand Global State Stores (`store/`)

| Store File | Responsibilities | Key State Variables |
| :--- | :--- | :--- |
| [`store/useAuthStore.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/store/useAuthStore.ts) | Session state, active persona, login/logout | `currentUser`, `isAuthenticated`, `setCurrentUser()`, `logout()` |
| [`store/useTaskStore.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/store/useTaskStore.ts) | Tasks list, active task modal, filter queries | `tasks`, `selectedTask`, `isDetailModalOpen`, `setTasks()` |
| [`store/useCompanyStore.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/store/useCompanyStore.ts) | Multi-tenant company context | `selectedCompany` (`'Ambizcon'` \| `'Ambizcon Health - India'`) |
| [`store/useNotificationStore.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/store/useNotificationStore.ts) | In-app alerts, unread counts, audio triggers | `notifications`, `unreadCount`, `addNotification()`, `markAsRead()` |
| [`store/useSearchStore.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/store/useSearchStore.ts) | Global search modal trigger and query | `isOpen`, `query`, `setIsOpen()`, `setQuery()` |

---

## 9. Service Layer & Context Providers (`services/`, `providers/`)

- [`services/taskService.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/services/taskService.ts): Connects directly to Supabase `tasks` table with in-memory mock store fallback.
- [`services/authService.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/services/authService.ts): Handles user verification and Google OAuth callback normalization.
- [`providers/AuthProvider.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/providers/AuthProvider.tsx): Hydrates user session on mount from `localStorage` / cookie.
- [`providers/ThemeProvider.tsx`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/providers/ThemeProvider.tsx): Manages light/dark mode preference via Tailwind CSS `dark` class.

---

## 10. Type Definitions & Test Suites (`types/`, `scripts/`)

- [`types/index.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/types/index.ts): Central TypeScript definitions (`User`, `Task`, `TaskStatus`, `TaskPriority`, `TeamName`, `CompanyBranch`, `ChatMessage`, `ReminderSettings`, `SelfReminder`, `ReimbursementClaim`).
- [`scripts/verify-all-securities.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/scripts/verify-all-securities.ts): 14 automated security regression tests (File upload ceilings, anti-replay tokens, IDOR ownership checks, rate limiters, session signatures).
- [`scripts/test-all-options.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/scripts/test-all-options.ts): 10-module comprehensive feature audit verifying roster sizes, punch transitions, notification dispatch targets, and private storage expiring URLs.
