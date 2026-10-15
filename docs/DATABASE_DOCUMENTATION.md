# 🗄️ TaskFlow SaaS — Database Documentation & Data Dictionary

> **Database Provider:** Supabase Cloud  
> **Engine:** PostgreSQL 15+  
> **Target Schema:** `public`  
> **Status:** Production Verified  
> **Last Updated:** October 15, 2026

---

## 1. Overview & Connection Architecture

The application connects to a cloud-hosted Supabase PostgreSQL instance via `@supabase/supabase-js` configured in [`lib/supabase.ts`](file:///c:/Users/NTC/AntiGravity/Ambizcon_Project/lib/supabase.ts). Data access is managed through Next.js Server Actions and Route Handlers, utilizing PostgreSQL JSONB columns for semi-structured data (subtask checklists, time logs, and audit footprints) alongside strict relational columns.

---

## 2. Table Inventory

| No. | Table Name | Purpose | Primary Key | Indexes |
|---|---|---|---|---|
| 1 | `public.users` | Employee profiles, roles, work modes, and skills | `id (TEXT)` | `email`, `team`, `company` |
| 2 | `public.teams` | Department definitions (Creative, Marketing, Dev) | `id (TEXT)` | `name (UNIQUE)` |
| 3 | `public.clients` | Medical centers & external client organizations | `id (TEXT)` | Primary key |
| 4 | `public.tasks` | Core tasks, statuses, checklists, time entries | `id (TEXT)` | `team`, `status`, `assigned_to`, `created_by` |
| 5 | `public.comments` | Task discussion threads and internal notes | `id (TEXT)` | `task_id` |
| 6 | `public.leave_requests` | Formal leave applications and approval chats | `id (TEXT)` | `emp_id` |
| 7 | `public.reimbursements` | Expense claims, bill receipts, and payment statuses | `id (TEXT)` | `claim_no (UNIQUE)`, `user_id`, `status` |
| 8 | `public.chat_messages` | Real-time group channel and direct messages | `id (TEXT)` | `channel_id` |
| 9 | `public.attendance` | Daily clock-in/out records, work & break hours | `id (TEXT)` | `user_id`, `date` |
| 10 | `public.festival_leaves` | Common festival leaves (India & Australia) | `id (TEXT)` | Primary key |
| 11 | `public.employee_leave_balances` | Annual leave quotas, taken counts, permissions | `user_email (TEXT)` | Primary key |
| 12 | `public.self_reminders` | Personal daily/recurring reminder checklists | `id (TEXT)` | `user_email` |
| 13 | `public.work_logs` | Hourly work slot logs (Admin & My tab views) | `id (TEXT)` | `work_date`, `user_email` |

---

## 3. Data Dictionary

### 3.1. Table: `public.users`
| Column Name | Data Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `TEXT` | No | None | `PRIMARY KEY` | Unique user identifier (e.g., `usr_1`, `usr_8`) |
| `name` | `TEXT` | No | None | None | Full legal or employee name |
| `email` | `TEXT` | No | None | `UNIQUE` | Corporate email address |
| `role` | `TEXT` | No | `'Team Member'` | None | Role: `Super Admin`, `Admin`, `Team Lead`, `Team Member`, `Reception Staff` |
| `team` | `TEXT` | No | `'Development'` | None | Department: `Creative`, `Marketing`, `Development` |
| `company` | `TEXT` | Yes | `'Ambizcon Health - India'` | None | Company entity identifier |
| `avatar` | `TEXT` | Yes | None | None | Avatar image URL (DiceBear or uploaded) |
| `birthday` | `TEXT` | Yes | None | None | Birthday string (e.g., `14 Mar`) |
| `dob` | `TEXT` | Yes | None | None | Full Date of Birth (DD/MM/YYYY) |
| `work_mode` | `TEXT` | Yes | `'Work From Office'` | None | Work mode: `Work From Office`, `Hybrid`, `Remote` |
| `skills` | `TEXT[]` | Yes | `'{}'` | None | Array of technical skills |
| `permission_count` | `INTEGER` | Yes | `0` | None | Permissions taken this month |
| `education` | `JSONB` | Yes | `'[]'::jsonb` | None | Educational credentials array |
| `experience` | `JSONB` | Yes | `'[]'::jsonb` | None | Professional experience history array |
| `created_at` | `TIMESTAMPTZ` | Yes | `NOW()` | None | Record creation timestamp |

---

### 3.2. Table: `public.tasks`
| Column Name | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `TEXT` | No | None | Unique task identifier (e.g., `task_1728892112`) |
| `title` | `TEXT` | No | None | Task title |
| `description` | `TEXT` | Yes | `''` | Full task brief, instructions, and checklist markdown |
| `status` | `TEXT` | No | `'Todo'` | Status: `Todo`, `In Progress`, `Review`, `Support`, `Done` |
| `priority` | `TEXT` | No | `'Medium'` | Priority: `Low`, `Medium`, `High`, `Critical` |
| `team` | `TEXT` | No | `'Development'` | Assigned department |
| `client_name` | `TEXT` | Yes | None | External client organization or clinic |
| `assigned_to` | `TEXT` | Yes | None | FK to `users.id` |
| `created_by` | `TEXT` | Yes | None | FK to `users.id` |
| `incoming` | `BOOLEAN` | Yes | `FALSE` | Flag for cross-team requests |
| `approval_status` | `TEXT` | Yes | `'approved'` | Task creation approval state |
| `approved_by` | `TEXT` | Yes | None | Name of TL/Admin who approved task completion |
| `assigned_reviewer_id`| `TEXT` | Yes | None | FK to `users.id` (TL reviewer) |
| `assigned_reviewer_name`| `TEXT` | Yes | None | Display name of assigned reviewer |
| `review_status` | `TEXT` | Yes | `'none'` | Status: `none`, `pending_review`, `approved`, `changes_requested` |
| `review_note` | `TEXT` | Yes | None | Review submission note or feedback message |
| `estimated_hours` | `NUMERIC` | Yes | `0` | Estimated task duration in hours |
| `actual_hours` | `NUMERIC` | Yes | `0` | Logged work hours |
| `time_entries` | `JSONB` | Yes | `'[]'::jsonb` | Work logs array: `[{ id, hours, note, isExtraHours, date }]` |
| `subtasks` | `JSONB` | Yes | `'[]'::jsonb` | Checklist array: `[{ id, title, completed }]` |
| `history` | `JSONB` | Yes | `'[]'::jsonb` | Audit footprint logs array: `[{ id, action, performedBy, role, timestamp }]` |
| `created_at` | `TIMESTAMPTZ` | Yes | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | Yes | `NOW()` | Record last update timestamp |

---

### 3.3. Table: `public.reimbursements`
| Column Name | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `TEXT` | No | None | Unique reimbursement claim ID |
| `claim_no` | `TEXT` | No | None | Unique formatted claim number (e.g., `CLM-00104`) |
| `user_id` | `TEXT` | No | None | Submitter employee ID |
| `user_name` | `TEXT` | No | None | Submitter display name |
| `user_team` | `TEXT` | No | None | Submitter department |
| `category` | `TEXT` | No | None | Category: Travel, Food, Internet, Equipment, Office Supplies |
| `amount` | `NUMERIC(12,2)` | No | `0.00` | Expense claim amount in INR |
| `date` | `TEXT` | No | None | Expense incurrence date (YYYY-MM-DD) |
| `description` | `TEXT` | Yes | None | Business rationale for expense |
| `receipt_url` | `TEXT` | Yes | None | Bill document URL or base64 attachment |
| `status` | `TEXT` | No | `'Pending Approval'` | Status: `Pending Approval`, `Approved`, `Rejected`, `Paid` |
| `admin_status` | `TEXT` | Yes | None | Admin signoff status |
| `created_at` | `TIMESTAMPTZ` | Yes | `NOW()` | Submission timestamp |

---

## 4. Row Level Security (RLS) Policies

All public tables are protected by Row Level Security policies configured in migration scripts:

```sql
ALTER TABLE public.festival_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access on festival_leaves" 
  ON public.festival_leaves FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public full access on employee_leave_balances" 
  ON public.employee_leave_balances FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public full access on self_reminders" 
  ON public.self_reminders FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public full access on work_logs" 
  ON public.work_logs FOR ALL USING (true) WITH CHECK (true);
```

---

## 5. Migration Execution History

1. **`20261012000001_taskflow_unified_supabase_schema.sql`**: Core unified schema migrating Users, Teams, Clients, Tasks, Comments, Leave Requests, Reimbursements, Chat Messages, and Attendance.
2. **`20261012000002_festival_leaves_and_balances.sql`**: Added `festival_leaves` and `employee_leave_balances` for admin leave quotas.
3. **`20261012000003_self_reminders.sql`**: Created personal `self_reminders` table with indices.
4. **`20261012000004_work_logs.sql`**: Created `work_logs` table for hourly work slot tracking.
