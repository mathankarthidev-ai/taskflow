# 🏛️ TaskFlow SaaS — System Architecture & Data Flow

> **Document Version:** 2.0.0  
> **Status:** Production Verified  
> **Last Updated:** October 15, 2026

---

## 1. High-Level Architecture Overview

TaskFlow utilizes a modern serverless three-tier architecture built around the Next.js 15 App Router paradigm. Rather than traditional heavyweight REST API layers, the application leverages **React Server Actions** for direct, type-safe Remote Procedure Call (RPC) data mutations, coupled with **Supabase PostgreSQL** for persistent relational storage.

```mermaid
graph TD
    subgraph UserInterface ["Client Layer (Browser)"]
        UI_Kanban["Kanban Board\n(Board, List, Calendar)"]
        UI_Attendance["Attendance Kiosk &\nMobile QR Scanner"]
        UI_Claims["Reimbursements Ledger &\nReceipt Zoom Modal"]
        UI_Chat["Real-time Team &\nDirect Chat"]
        UI_Store["Zustand Client Stores\n(Auth, Tasks, Notifs, Company)"]
    end

    subgraph ServerLayer ["Server Action & API Boundary (Vercel Serverless)"]
        SA_Tasks["taskActions.ts\n(CRUD, Status, Reviews)"]
        SA_Attendance["attendanceActions.ts\n(Punches, QR Tokens, Breaks)"]
        SA_Reimb["reimbursementActions.ts\n(Claims, Approvals)"]
        SA_Users["userActions.ts\n(Auth Sessions, Profiles)"]
        RouteHandlers["Route Handlers (app/api/)\n(/api/attendance, /api/chat, /api/seed)"]
    end

    subgraph ServiceLayer ["Core Service & Business Logic Layer"]
        Svc_Task["taskService.ts"]
        Svc_Auth["authService.ts"]
        Svc_Analytics["analyticsService.ts"]
        Filter_Notif["notification-filter.ts\n(Strict Scoped Targeting)"]
        Filter_Comp["company-filter.ts\n(India vs. Australia Isolation)"]
    end

    subgraph DatabaseLayer ["Database & Storage Layer (Supabase PostgreSQL)"]
        DB_Users[("users")]
        DB_Tasks[("tasks")]
        DB_Attendance[("attendance")]
        DB_Claims[("reimbursements")]
        DB_Chat[("chat_messages")]
        DB_Leaves[("festival_leaves &\nemployee_leave_balances")]
        DB_WorkLogs[("work_logs &\nself_reminders")]
    end

    UI_Kanban -->|RPC Mutation| SA_Tasks
    UI_Attendance -->|Camera Scan / Token| RouteHandlers
    UI_Claims -->|Submit / Edit Claim| SA_Reimb
    UI_Chat -->|Send Message| RouteHandlers
    UI_Store -.->|Hydration / Cache| UI_Kanban

    SA_Tasks --> Svc_Task
    SA_Attendance --> Svc_Auth
    SA_Reimb --> Svc_Task
    RouteHandlers --> Svc_Auth

    Svc_Task --> Filter_Notif
    Svc_Task --> Filter_Comp
    Filter_Notif --> UI_Store

    Svc_Task --> DB_Tasks
    Svc_Auth --> DB_Users
    Svc_Auth --> DB_Attendance
    SA_Reimb --> DB_Claims
    RouteHandlers --> DB_Chat
    Svc_Auth --> DB_Leaves
    Svc_Auth --> DB_WorkLogs
```

---

## 2. Authentication & Persona Switching Flow

The authentication system supports standard credentials alongside a 1-click **Persona Switcher** for technical evaluation and management audits:

```mermaid
sequenceDiagram
    autonumber
    actor User as Employee / Evaluator
    participant LoginUI as Login Page (app/login)
    participant AuthStore as useAuthStore (Zustand)
    participant UserAction as userActions.ts
    participant DB as Supabase users table

    User->>LoginUI: Selects Persona (e.g., Mathan MK - Team Member)
    LoginUI->>AuthStore: login("mathanmk@ambizcon.com")
    AuthStore->>UserAction: getUserByEmailAction("mathanmk@ambizcon.com")
    UserAction->>DB: SELECT * FROM users WHERE email = ...
    DB-->>UserAction: Returns User Record
    UserAction-->>AuthStore: Hydrates User Profile & Permissions
    AuthStore->>AuthStore: Set Cookie & LocalStorage ("taskflow_user")
    AuthStore-->>LoginUI: Redirect to /dashboard
    LoginUI-->>User: Displays customized role-scoped dashboard
```

---

## 3. Two-Tiered Task Review & Approval Workflow

TaskFlow implements an audit footprint workflow preventing Team Members from self-approving tasks to completed:

```mermaid
sequenceDiagram
    autonumber
    actor TM as Team Member (e.g., Mathan MK)
    participant Kanban as KanbanBoard.tsx
    participant Modal as ReviewerSelectModal.tsx
    participant Detail as TaskDetailModal.tsx
    actor TL as Team Lead (e.g., Anirudh)
    participant NotifStore as useNotificationStore
    participant NotifFilter as notification-filter.ts
    participant DB as Supabase tasks table

    TM->>Kanban: Drags Task to "Done" column
    Kanban->>TM: Intercept: "Only TL or Admin can approve. Submit for review."
    Kanban->>Modal: Opens Reviewer Selection Modal
    TM->>Modal: Selects TL (Anirudh) & inputs submission note
    Modal->>DB: UPDATE tasks SET status='Review', review_status='pending_review'
    Modal->>DB: Appends audit footprint to history JSONB
    Modal->>NotifStore: addNotification(type: 'review_assigned')
    NotifFilter-->>TL: Delivers review alert & plays audio chime to TL
    NotifFilter--x OtherMembers: Blocks notification to unrelated team members

    Note over TL,Detail: Team Lead evaluates submission
    TL->>Detail: Clicks "Approve Review to Completed (Done)"
    Detail->>DB: UPDATE tasks SET status='Done', review_status='approved', approved_by=TL
    Detail->>DB: Appends [Footprint: Approved → Completed]
    Detail->>NotifStore: addNotification(type: 'task_completed')
    NotifFilter-->>TL: Notification Visible
    NotifFilter-->>TM: Notification Visible (Only that member!)
    NotifFilter--x OtherMembers: STRICTLY BLOCKED for other members
```

---

## 4. Attendance QR Kiosk & Rotating Token Architecture

To eliminate proxy clock-ins ("buddy punching"), TaskFlow generates ephemeral cryptographic tokens:

```mermaid
sequenceDiagram
    autonumber
    participant Kiosk as Reception Kiosk Modal
    participant QRRoute as /api/attendance/qr/token
    actor Employee as Employee Mobile Device
    participant ScanRoute as /api/attendance/qr/scan
    participant AttDB as Supabase attendance table

    loop Every 15 Seconds
        Kiosk->>QRRoute: GET /api/attendance/qr/token
        QRRoute->>QRRoute: Generates HMAC token (timestamp + secret)
        QRRoute-->>Kiosk: Returns Token (Valid for 30s window)
        Kiosk->>Kiosk: Renders Dynamic QR Code Canvas
    end

    Employee->>Kiosk: Scans QR code with camera (QrScannerModal)
    Employee->>ScanRoute: POST /api/attendance/qr/scan { token, employeeId }
    ScanRoute->>ScanRoute: Verifies token validity & signature window
    alt Token Valid
        ScanRoute->>AttDB: Logs Punch Record (Clock-In / Clock-Out)
        ScanRoute-->>Employee: Success: "Clocked in at 09:32 AM"
    else Token Expired (> 30s)
        ScanRoute-->>Employee: Error: "QR Code expired. Scan active screen."
    end
```

---

## 5. Scoped Notification Filtering Architecture

TaskFlow ensures notifications are delivered exclusively to authorized parties, solving the "notification fatigue" problem:

```mermaid
flowchart TD
    NewNotif["Incoming Notification Event\n(e.g., Task Completed, Review Assigned)"]
    EvalUser["Evaluate Against Active Logged-in User\nisNotificationVisibleForUser(n, currentUser)"]

    NewNotif --> EvalUser

    EvalUser --> IsAdmin{"Is User Admin or\nSuper Admin?"}
    IsAdmin -- Yes --> Show["Show Notification\n(Bell Dropdown + Popup Alert + Sound Chime)"]

    IsAdmin -- No --> IsTL{"Is User Team Lead\n(TL)?"}
    IsTL -- Yes --> Show

    IsTL -- No --> IsTargetMember{"Is User the Assigned Member\nor Task Completer\n(e.g., Mathan MK)?"}
    IsTargetMember -- Yes --> Show
    IsTargetMember -- No --> Block["STRICTLY BLOCKED\n(No popup, no bell item, no chime audio)"]
```

---

## 6. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o{ tasks : "assigned_to"
    users ||--o{ tasks : "created_by"
    users ||--o{ comments : "authors"
    users ||--o{ reimbursements : "submits"
    users ||--o{ leave_requests : "requests"
    users ||--o{ attendance : "punches"
    users ||--o{ work_logs : "logs"
    users ||--o{ self_reminders : "creates"
    teams ||--o{ users : "belongs_to"
    teams ||--o{ tasks : "assigned_team"
    tasks ||--o{ comments : "has_threads"

    users {
        string id PK
        string name
        string email UK
        string role
        string team
        string company
        string work_mode
        jsonb education
        jsonb experience
    }

    tasks {
        string id PK
        string title
        string status
        string priority
        string team
        string assigned_to FK
        string created_by FK
        string approval_status
        string approved_by
        string review_status
        string review_note
        numeric estimated_hours
        numeric actual_hours
        jsonb subtasks
        jsonb time_entries
        jsonb history
    }

    reimbursements {
        string id PK
        string claim_no UK
        string user_id FK
        string category
        numeric amount
        string date
        string status
        string receipt_url
        string admin_status
    }

    attendance {
        string id PK
        string user_id FK
        string date
        string clock_in
        string clock_out
        numeric work_hours
        numeric break_minutes
        string status
    }
```
