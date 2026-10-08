-- ============================================================================
-- TASKFLOW SAAS APP - SUPABASE POSTGRESQL SCHEMA & 10-AREA DEMO SEED SCRIPT
-- Project URL: https://ekdrfcopnnuaargnusav.supabase.co
-- ============================================================================

-- 1. CREATE TABLES (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Team Member',
  team TEXT NOT NULL,
  company TEXT,
  avatar TEXT,
  work_mode TEXT DEFAULT 'Work From Office',
  skills TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Todo',
  priority TEXT NOT NULL DEFAULT 'Medium',
  team TEXT NOT NULL,
  client_name TEXT,
  assigned_to TEXT,
  created_by TEXT,
  due_date TIMESTAMPTZ,
  labels TEXT[],
  reminder_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id TEXT PRIMARY KEY,
  emp_id TEXT NOT NULL,
  emp_name TEXT,
  emp_team TEXT,
  type TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days NUMERIC NOT NULL,
  reason TEXT,
  tl_status TEXT DEFAULT 'approved',
  ceo_status TEXT DEFAULT 'approved',
  raised_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.reimbursements (
  id TEXT PRIMARY KEY,
  claim_no TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_team TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Approved',
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SEED DEMO TEAMS
INSERT INTO public.teams (id, name, code, description) VALUES
  ('team_1', 'Development', 'DEV', 'Software Engineering, AI Systems, Cloud Infrastructure & Database Architecture'),
  ('team_2', 'Marketing', 'MKT', 'Operations, Patient Outreach, Brand Growth, Media & Healthcare Campaigns'),
  ('team_3', 'Creative', 'CRT', 'UI/UX Design, Figma Wireframes, Brand Systems & Visual Media Assets')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 3. SEED DEMO USERS (15 USERS ACROSS DEPARTMENTS & ROLES)
INSERT INTO public.users (id, name, email, role, team, company, avatar, work_mode, skills) VALUES
  ('usr_1', 'Anirudh', 'anirudh@ambizcon.com', 'Super Admin', 'Development', 'India & Australia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anirudh', 'Work From Office', ARRAY['Next.js', 'React', 'Node.js', 'PostgreSQL', 'MongoDB']),
  ('usr_2', 'Mathan P', 'mathan@ambizcon.com', 'Super Admin', 'Development', 'India & Australia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathan', 'Work From Office', ARRAY['System Architecture', 'Supabase', 'DevOps', 'TypeScript']),
  ('usr_3', 'Aravind Kalaivanan', 'aravind@ambizcon.com', 'Team Lead', 'Development', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aravind', 'Work From Office', ARRAY['WordPress', 'PHP', 'React', 'WooCommerce', 'MySQL', 'APIs']),
  ('usr_4', 'Kennath Franklin J', 'kenneth@ambizcon.com', 'Team Lead', 'Marketing', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kenneth', 'Work From Office', ARRAY['Google Ads', 'SEO', 'GSC', 'GA4', 'Meta Ads', 'Copywriting']),
  ('usr_5', 'Deva Priya D A', 'deva@ambizcon.com', 'Team Lead', 'Creative', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deva', 'Work From Office', ARRAY['UI/UX', 'Figma', 'Branding', 'Tailwind', 'Photoshop']),
  ('usr_6', 'Thanikaivel Arumugam', 'thanikaivel@ambizcon.com', 'Team Member', 'Development', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thanikaivel', 'Work From Home', ARRAY['WordPress', 'PHP', 'MySQL']),
  ('usr_7', 'Naraine R', 'naraine@ambizcon.com', 'Team Member', 'Development', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Naraine', 'Work From Office', ARRAY['React', 'Next.js', 'APIs']),
  ('usr_8', 'Mathanmk', 'mathanmk@ambizcon.com', 'Team Member', 'Development', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathanmk', 'Work From Office', ARRAY['Backend', 'Node.js', 'SQL']),
  ('usr_9', 'Mathi Pandian', 'mathi.p@ambizcon.com', 'Team Member', 'Marketing', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathi', 'Work From Office', ARRAY['Google Ads', 'SEO']),
  ('usr_10', 'Kiruthikashri M', 'kiruthikashri@ambizcon.com', 'Team Member', 'Marketing', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kiruthikashri', 'Work From Office', ARRAY['SEO', 'Content']),
  ('usr_11', 'B. Siddesh', 'siddesh@ambizcon.com', 'Team Member', 'Marketing', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siddesh', 'Work From Home', ARRAY['Outreach', 'Marketing']),
  ('usr_12', 'V. Sathish Kumar', 'sathish@ambizcon.com', 'Team Member', 'Creative', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sathish', 'Work From Office', ARRAY['UI/UX', 'Figma']),
  ('usr_13', 'Kavish TG', 'kavish@ambizcon.com', 'Team Member', 'Creative', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavish', 'Work From Office', ARRAY['Wireframes', 'Prototypes']),
  ('usr_14', 'Kasthuri M', 'kasthuri@ambizcon.com', 'Team Member', 'Creative', 'Ambizcon Health - India', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kasthuri', 'Work From Office', ARRAY['Branding', 'Graphics']),
  ('usr_15', 'Adriana Ruju', 'adriana@ambizcon.com', 'Team Member', 'Marketing', 'Ambizcon', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adriana', 'Work From Office', ARRAY['Social Media', 'Outreach'])
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- 4. SEED 10 DEMO REIMBURSEMENTS
INSERT INTO public.reimbursements (id, claim_no, user_id, user_name, user_team, category, amount, date, description, status, is_paid) VALUES
  ('clm_1', 'CLM-2026-001', 'usr_6', 'Thanikaivel Arumugam', 'Development', 'Software Subscriptions', 149.00, '2026-10-01', 'Vercel Pro & JetBrains IDE License', 'Paid', TRUE),
  ('clm_2', 'CLM-2026-002', 'usr_7', 'Naraine R', 'Development', 'Travel & Conveyance', 85.50, '2026-10-02', 'Client site travel taxi fare to Coomera Central', 'Paid', TRUE),
  ('clm_3', 'CLM-2026-003', 'usr_9', 'Mathi Pandian', 'Marketing', 'Advertising Expenses', 450.00, '2026-10-03', 'Google Ads local GP search campaign ad budget advance', 'Paid', TRUE),
  ('clm_4', 'CLM-2026-004', 'usr_10', 'Kiruthikashri M', 'Marketing', 'Software Subscriptions', 99.00, '2026-10-03', 'Screaming Frog SEO Spider annual license renewal', 'Approved', FALSE),
  ('clm_5', 'CLM-2026-005', 'usr_12', 'V. Sathish Kumar', 'Creative', 'Design Assets', 120.00, '2026-10-04', 'Figma UI kit & medical vector icon pack download', 'Approved', FALSE),
  ('clm_6', 'CLM-2026-006', 'usr_13', 'Kavish TG', 'Creative', 'Equipment & Hardware', 230.00, '2026-10-04', 'Wacom drawing tablet pen replacement', 'Pending Approval', FALSE),
  ('clm_7', 'CLM-2026-007', 'usr_14', 'Kasthuri M', 'Creative', 'Office Supplies', 65.00, '2026-10-05', 'Print proofing paper & CMYK color swatch book', 'Pending Approval', FALSE),
  ('clm_8', 'CLM-2026-008', 'usr_8', 'Mathanmk', 'Development', 'Internet & Telecom', 75.00, '2026-10-05', 'Monthly high-speed fiber internet reimbursement for WFH', 'Approved', FALSE),
  ('clm_9', 'CLM-2026-009', 'usr_11', 'B. Siddesh', 'Marketing', 'Client Entertainment', 180.00, '2026-10-05', 'Clinic practice manager lunch meeting expense', 'Pending Approval', FALSE),
  ('clm_10', 'CLM-2026-010', 'usr_15', 'Adriana Ruju', 'Marketing', 'Training & Certifications', 299.00, '2026-10-05', 'Healthcare Digital Marketing Certification course fee', 'Approved', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED 10 DEMO LEAVE REQUESTS
INSERT INTO public.leave_requests (id, emp_id, emp_name, emp_team, type, from_date, to_date, days, reason, tl_status, ceo_status, raised_date) VALUES
  ('leave_1', 'usr_6', 'Thanikaivel Arumugam', 'Development', 'Casual', '2026-10-10', '2026-10-11', 2, 'Family function in hometown', 'approved', 'approved', '2026-10-01'),
  ('leave_2', 'usr_7', 'Naraine R', 'Development', 'Sick', '2026-10-05', '2026-10-05', 1, 'Dental appointment & viral fever recovery', 'approved', 'approved', '2026-10-05'),
  ('leave_3', 'usr_9', 'Mathi Pandian', 'Marketing', 'Earned', '2026-10-15', '2026-10-18', 4, 'Annual vacation trip', 'approved', 'approved', '2026-09-28'),
  ('leave_4', 'usr_10', 'Kiruthikashri M', 'Marketing', 'Casual', '2026-10-12', '2026-10-12', 1, 'Personal work at bank', 'approved', 'approved', '2026-10-02'),
  ('leave_5', 'usr_12', 'V. Sathish Kumar', 'Creative', 'Sick', '2026-10-06', '2026-10-07', 2, 'Medical consultation & blood test', 'approved', 'approved', '2026-10-05'),
  ('leave_6', 'usr_13', 'Kavish TG', 'Creative', 'Casual', '2026-10-20', '2026-10-21', 2, 'Attending design conference', 'approved', 'approved', '2026-10-03'),
  ('leave_7', 'usr_14', 'Kasthuri M', 'Creative', 'Loss of Pay', '2026-10-25', '2026-10-26', 2, 'Urgent family emergency', 'approved', 'approved', '2026-10-04'),
  ('leave_8', 'usr_8', 'Mathanmk', 'Development', 'Sick', '2026-10-08', '2026-10-08', 1, 'Migraine headache', 'approved', 'approved', '2026-10-05'),
  ('leave_9', 'usr_11', 'B. Siddesh', 'Marketing', 'Casual', '2026-10-14', '2026-10-14', 1, 'Vehicle service & registration', 'approved', 'approved', '2026-10-04'),
  ('leave_10', 'usr_15', 'Adriana Ruju', 'Marketing', 'Earned', '2026-10-28', '2026-10-30', 3, 'Brisbane healthcare marketing workshop', 'approved', 'approved', '2026-10-02')
ON CONFLICT (id) DO NOTHING;
