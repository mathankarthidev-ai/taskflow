# 🔌 TaskFlow SaaS — API & Server Actions Reference

> **API Architecture:** Dual Paradigm — Next.js 15 Server Actions RPC (`actions/`) + RESTful Route Handlers (`app/api/`)  
> **Status:** Production Verified  
> **Last Updated:** October 15, 2026

---

## 1. Architecture Overview

TaskFlow utilizes a dual API architecture:
1. **Next.js Server Actions (RPC):** Direct, type-safe server mutations executing over HTTP POST with automatic CSRF protection and Next.js cache revalidation (`revalidatePath`).
2. **RESTful Route Handlers:** Standard HTTP endpoints located in `app/api/` for cross-platform integrations, dynamic QR scanning, and automated cron jobs.

---

## 2. Server Actions Reference

### 2.1. Task Actions (`actions/taskActions.ts`)

#### `fetchTasksAction(options: TaskFilterOptions)`
- **Purpose:** Fetches filtered tasks based on team, status, priority, or assignee.
- **Parameters:** `options: { team?, status?, priority?, assignedTo?, createdBy?, incoming?, search? }`
- **Returns:** `Promise<Task[]>`
- **Access:** All authenticated users.

#### `createTaskAction(data: CreateTaskDTO)`
- **Purpose:** Creates a new task in Supabase and triggers cache revalidation.
- **Parameters:**
  ```typescript
  {
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Todo' | 'In Progress' | 'Review' | 'Support' | 'Done';
    team: 'Creative' | 'Marketing' | 'Development';
    assignedTo?: string;
    createdBy: string;
    dueDate: string;
    labels: string[];
    clientName?: string;
    attachments?: { name: string; url: string; type: string }[];
  }
  ```
- **Returns:** `Promise<Task>`
- **Revalidates:** `/dashboard`, `/kanban`, `/incoming`, `/reminders`.

#### `updateTaskStatusAction(taskId: string, status: TaskStatus)`
- **Purpose:** Transitions task column status.
- **Parameters:** `taskId: string`, `status: TaskStatus`
- **Returns:** `Promise<Task>`

#### `updateTaskReviewWorkflowAction(taskId: string, workflowData: ReviewWorkflowDTO)`
- **Purpose:** Records review submission, TL feedback notes, or final approval.
- **Parameters:**
  ```typescript
  {
    status?: TaskStatus;
    reviewStatus?: 'none' | 'pending_review' | 'approved' | 'changes_requested';
    reviewNote?: string;
    assignedReviewerId?: string;
    assignedReviewerName?: string;
    approvedBy?: string;
    history?: any[];
  }
  ```
- **Returns:** `Promise<Task>`
- **Access:** Team Lead / Super Admin for approvals; Team Member for review submission.

---

### 2.2. Reimbursement Actions (`actions/reimbursementActions.ts`)

#### `submitReimbursementAction(claimData: ClaimDTO)`
- **Purpose:** Submits an employee expense claim for administrative review.
- **Parameters:** `claimData: { claimNo, userId, userName, userTeam, category, amount, date, description, receiptUrl }`
- **Returns:** `Promise<ReimbursementClaim>`

#### `updateReimbursementAction(claimId: string, updates: Partial<ReimbursementClaim>)`
- **Purpose:** Allows employees to edit pending claims prior to admin signoff.
- **Validation:** Enforces `status === 'Pending Approval'`. Rejects if already approved/rejected.
- **Returns:** `Promise<ReimbursementClaim>`

---

### 2.3. User & Session Actions (`actions/userActions.ts`)

#### `getUserByEmailAction(email: string)`
- **Purpose:** Queries Supabase `users` table to authenticate employee or persona.
- **Parameters:** `email: string` (e.g., `mathanmk@ambizcon.com`)
- **Returns:** `Promise<User | null>`

#### `createUserAction(userData: NewUserDTO)`
- **Purpose:** Creates a new corporate employee profile in Supabase.
- **Access:** Super Admin exclusive.
- **Returns:** `Promise<User>`

---

## 3. RESTful Route Handlers Reference (`app/api/`)

### 3.1. Dynamic QR Attendance APIs

#### `GET /api/attendance/qr/token`
- **Purpose:** Generates a short-lived cryptographic token for the reception kiosk display.
- **Response Example (200 OK):**
  ```json
  {
    "token": "tok_9f81a7b2c0194e8a_1728981240",
    "expiresIn": 15,
    "timestamp": 1728981240000
  }
  ```

#### `POST /api/attendance/qr/scan`
- **Purpose:** Receives camera scan from employee device and logs clock-in/out punch.
- **Request Body:**
  ```json
  {
    "token": "tok_9f81a7b2c0194e8a_1728981240",
    "employeeId": "usr_8",
    "action": "clock_in"
  }
  ```
- **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "message": "Clocked in successfully at 09:30 AM",
    "punchTime": "2026-10-15T09:30:00.000Z"
  }
  ```

#### `POST /api/attendance/break/start` & `POST /api/attendance/break/end`
- **Purpose:** Toggles active break state (`Tea Break` or `Lunch Break`) and tracks cumulative break minutes.

#### `POST /api/attendance/auto-clockout`
- **Purpose:** System cron routine invoked at 23:59:59 IST to auto-close orphan attendance sessions.

---

### 3.2. Chat Messaging APIs

#### `POST /api/chat`
- **Purpose:** Transmits group channel or direct messages.
- **Request Body:**
  ```json
  {
    "channelId": "general",
    "senderId": "usr_8",
    "senderName": "Mathanmk",
    "senderRole": "Team Member",
    "text": "Drafted blog meta descriptions for SPOT calendar."
  }
  ```
- **Response Example (201 Created):**
  ```json
  {
    "id": "msg_1728981452102",
    "channelId": "general",
    "text": "Drafted blog meta descriptions for SPOT calendar.",
    "createdAt": "2026-10-15T09:32:00.000Z"
  }
  ```

---

### 3.3. Database Seed & Hygiene API

#### `POST /api/seed`
- **Purpose:** Seeds the database with standard teams, clients, and personas.
- **Access:** Super Admin exclusive.
- **Safety Rule:** Demo tasks and sample reimbursement bills are permanently disabled to maintain clean data hygiene.
