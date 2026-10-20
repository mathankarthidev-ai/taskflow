-- ============================================================================
-- AMBIZCON TASKFLOW: 100% UNIFIED SUPABASE POSTGRESQL SCHEMA & SEED MIGRATION
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

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_team ON public.users(team);
CREATE INDEX IF NOT EXISTS idx_users_company ON public.users(company);

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

CREATE INDEX IF NOT EXISTS idx_tasks_team ON public.tasks(team);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);

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

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);

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

CREATE INDEX IF NOT EXISTS idx_leave_requests_emp_id ON public.leave_requests(emp_id);

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

CREATE INDEX IF NOT EXISTS idx_reimbursements_user_id ON public.reimbursements(user_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON public.reimbursements(status);

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

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON public.chat_messages(channel_id);

-- 9. ATTENDANCE TABLE (Ensure exists)
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

-- 10. ENABLE RLS & PERMISSIVE POLICIES FOR APPLICATION CLIENT/SERVER ACCESS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users', 'teams', 'clients', 'tasks', 'comments', 'leave_requests', 'reimbursements', 'chat_messages', 'attendance']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow full access on %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow full access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role;', tbl);
  END LOOP;
END $$;

-- 11. SEED TEAMS
INSERT INTO public.teams (id, name, code, description, lead_id) VALUES
  ('team_1', 'Development', 'DEV', 'Software Engineering, AI Systems, Cloud Infrastructure & Database Architecture', 'usr_3'),
  ('team_2', 'Marketing', 'MKT', 'Operations, Patient Outreach, Brand Growth, Media & Healthcare Campaigns', 'usr_4'),
  ('team_3', 'Creative', 'CRT', 'UI/UX Design, Figma Wireframes, Brand Systems & Visual Media Assets', 'usr_5')
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  lead_id = EXCLUDED.lead_id;

-- 12. SEED ALL 15 USERS
INSERT INTO public.users (id, name, email, role, team, company, avatar, birthday, dob, work_mode, skills) VALUES
  ('usr_1', 'Anirudh', 'anirudh@ambizcon.com', 'Super Admin', 'Development', 'India & Australia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anirudh', '14 Oct', '14/10/1995', 'Work From Office', ARRAY['WordPress', 'PHP', 'React', 'WooCommerce', 'MySQL', 'APIs']),
  ('usr_2', 'Mathan P', 'mathan@ambizcon.com', 'Super Admin', 'Development', 'India & Australia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathan', '17 Aug', '17/08/2001', 'Work From Office', ARRAY['WordPress', 'PHP', 'React', 'WooCommerce', 'MySQL', 'APIs']),
  ('usr_3', 'Aravind Kalaivanan', 'aravind@ambizcon.com', 'Team Lead', 'Development', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aravind', '27 Sep', '27/09/1996', 'Work From Office', ARRAY['WordPress', 'PHP', 'React', 'WooCommerce', 'MySQL', 'APIs']),
  ('usr_4', 'Kennath Franklin J', 'kenneth@ambizcon.com', 'Team Lead', 'Marketing', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kenneth', '19 Nov', '19/11/1997', 'Work From Office', ARRAY['Google Ads', 'SEO', 'GSC', 'GA4', 'Meta Ads', 'Copywriting']),
  ('usr_5', 'Deva Priya D A', 'deva@ambizcon.com', 'Team Lead', 'Creative', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deva', '21 May', '21/05/1998', 'Work From Office', ARRAY['UI/UX', 'Figma', 'Branding', 'Tailwind', 'Photoshop']),
  ('usr_6', 'Thanikaivel Arumugam', 'thanikaivel@ambizcon.com', 'Team Member', 'Development', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thanikaivel', '13 Mar', '13/03/1999', 'Work From Office', ARRAY['WordPress', 'PHP', 'React', 'WooCommerce', 'MySQL', 'APIs']),
  ('usr_7', 'Naraine R', 'naraine@ambizcon.com', 'Team Member', 'Development', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Naraine', '26 May', '26/05/2000', 'Work From Office', ARRAY['WordPress', 'PHP', 'React', 'WooCommerce', 'MySQL', 'APIs']),
  ('usr_8', 'Mathanmk', 'mathanmk@ambizcon.com', 'Team Member', 'Development', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathanmk', '13 Oct', '13/10/2000', 'Work From Office', ARRAY['WordPress', 'PHP', 'React', 'WooCommerce', 'MySQL', 'APIs']),
  ('usr_9', 'Mathi Pandian', 'mathi.p@ambizcon.com', 'Team Member', 'Marketing', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathi', '25 May', '25/05/1999', 'Work From Office', ARRAY['Google Ads', 'SEO', 'GSC', 'GA4', 'Meta Ads', 'Copywriting']),
  ('usr_10', 'Kiruthikashri M', 'kiruthikashri@ambizcon.com', 'Team Member', 'Marketing', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Krithika', '23 Oct', '23/10/2001', 'Work From Office', ARRAY['Google Ads', 'SEO', 'GSC', 'GA4', 'Meta Ads', 'Copywriting']),
  ('usr_11', 'B. Siddesh', 'siddesh@ambizcon.com', 'Team Member', 'Marketing', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siddesh', '12 Aug', '12/08/2000', 'Work From Office', ARRAY['Google Ads', 'SEO', 'GSC', 'GA4', 'Meta Ads', 'Copywriting']),
  ('usr_12', 'V. Sathish Kumar', 'sathish@ambizcon.com', 'Team Member', 'Creative', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sathish', '29 Oct', '29/10/1998', 'Work From Office', ARRAY['UI/UX', 'Figma', 'Branding', 'Tailwind', 'Photoshop']),
  ('usr_13', 'Kavish TG', 'kavish@ambizcon.com', 'Team Member', 'Creative', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavish', '01 Sep', '01/09/2000', 'Work From Office', ARRAY['UI/UX', 'Figma', 'Branding', 'Tailwind', 'Photoshop']),
  ('usr_14', 'Kasthuri M', 'kasthuri@ambizcon.com', 'Team Member', 'Creative', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kasthuri', '31 Aug', '31/08/2000', 'Work From Office', ARRAY['UI/UX', 'Figma', 'Branding', 'Tailwind', 'Photoshop']),
  ('usr_15', 'Adriana Ruju', 'adriana@ambizcon.com', 'Team Member', 'Marketing', 'Ambizcon', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adriana', '14 Feb', '14/02/1998', 'Work From Office', ARRAY['Google Ads', 'SEO', 'GSC', 'GA4', 'Meta Ads', 'Copywriting']),
  ('usr_16', 'Ahamed', 'ahamed@ambizcon.com', 'Team Member', 'Creative', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahamed', '15 Nov', '15/11/2000', 'Work From Home', ARRAY['UI/UX', 'Figma', 'Branding', 'Tailwind', 'Photoshop']),
  ('usr_17', 'A. Abdul kani', 'abdul@ambizcon.com', 'Team Member', 'Creative', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=AbdulKani', '22 Jun', '22/06/2005', 'Work From Office', ARRAY['UI/UX', 'Figma', 'Branding', 'Tailwind', 'Photoshop'])
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  team = EXCLUDED.team,
  company = EXCLUDED.company,
  birthday = COALESCE(public.users.birthday, EXCLUDED.birthday),
  dob = COALESCE(public.users.dob, EXCLUDED.dob);
