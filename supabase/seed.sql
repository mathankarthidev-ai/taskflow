-- ============================================================================
-- AMBIZCON TASKFLOW: 100% UNIFIED SUPABASE POSTGRESQL SCHEMA & SEED SCRIPT
-- Project URL: https://ekdrfcopnnuaargnusav.supabase.co
-- Single Database Architecture: Users, Teams, Clients, Tasks, Comments,
-- Leave Requests, Reimbursements, Chat Messages, and Attendance
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Team Member',
  team TEXT NOT NULL DEFAULT 'Development',
  company TEXT DEFAULT 'Ambizcon Health - India',
  avatar TEXT,
  birthday TEXT,
  dob TEXT,
  work_mode TEXT DEFAULT 'Work From Office',
  skills TEXT[] DEFAULT '{}',
  permission_count INTEGER DEFAULT 0,
  has_reset_password BOOLEAN DEFAULT FALSE,
  phone TEXT,
  emergency_contact TEXT,
  address TEXT,
  bank_account TEXT,
  tax_id TEXT,
  blood_group TEXT,
  education JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  lead_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Medical Centers',
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  assets_url TEXT,
  status TEXT DEFAULT 'active',
  added_by TEXT,
  added_by_role TEXT,
  sites JSONB DEFAULT '[]'::jsonb,
  services JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Todo',
  priority TEXT NOT NULL DEFAULT 'Medium',
  team TEXT NOT NULL DEFAULT 'Development',
  client_name TEXT,
  client_id TEXT,
  doctor_name TEXT,
  specialist TEXT,
  project_id TEXT,
  project_name TEXT,
  task_type_id TEXT,
  task_type_name TEXT,
  client_approved BOOLEAN DEFAULT TRUE,
  approval_token TEXT,
  approval_expires_at TIMESTAMPTZ,
  assigned_to TEXT,
  created_by TEXT,
  raised_by TEXT,
  incoming BOOLEAN DEFAULT FALSE,
  approval_status TEXT DEFAULT 'approved',
  approved_by TEXT,
  assigned_reviewer_id TEXT,
  assigned_reviewer_name TEXT,
  review_status TEXT DEFAULT 'none',
  review_note TEXT,
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  time_entries JSONB DEFAULT '[]'::jsonb,
  progress_pct INTEGER DEFAULT 0,
  subtasks JSONB DEFAULT '[]'::jsonb,
  dependencies TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT,
  reminder_settings JSONB,
  labels TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]'::jsonb,
  comments_count INTEGER DEFAULT 0,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id TEXT PRIMARY KEY,
  emp_id TEXT NOT NULL,
  emp_name TEXT,
  emp_team TEXT,
  type TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  days NUMERIC NOT NULL DEFAULT 1,
  half BOOLEAN DEFAULT FALSE,
  session TEXT,
  reason TEXT,
  tl_status TEXT,
  ceo_status TEXT,
  raised_date TEXT,
  chat JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REIMBURSEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.reimbursements (
  id TEXT PRIMARY KEY,
  claim_no TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_team TEXT NOT NULL,
  user_avatar TEXT,
  company TEXT DEFAULT 'Ambizcon Health - India',
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  description TEXT,
  receipt_name TEXT,
  receipt_url TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  rejection_reason TEXT,
  draft_saved_at TEXT,
  admin_status TEXT,
  tl_status TEXT,
  ceo_status TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Pending Approval',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  sender_avatar TEXT,
  sender_team TEXT,
  text TEXT NOT NULL DEFAULT '',
  file_attachment JSONB,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_team TEXT,
  company TEXT,
  session_date TEXT,
  clock_in TEXT,
  clock_in_aest TEXT,
  clock_out TEXT,
  clock_out_aest TEXT,
  status TEXT DEFAULT 'working',
  work_mode TEXT DEFAULT 'Work From Office',
  ip_address TEXT,
  location TEXT,
  geofence_verified BOOLEAN DEFAULT TRUE,
  worked_seconds INTEGER DEFAULT 0,
  worked_hours TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
