-- Create festival_leaves table for Common Festival Leaves (India & Australia)
CREATE TABLE IF NOT EXISTS public.festival_leaves (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  day_name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Festival Leave',
  company TEXT NOT NULL DEFAULT 'Ambizcon Health - India',
  description TEXT DEFAULT '',
  is_paid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create employee_leave_balances table for Admin Leave Quota & Taken Leave Updates
CREATE TABLE IF NOT EXISTS public.employee_leave_balances (
  user_email TEXT PRIMARY KEY,
  user_name TEXT NOT NULL DEFAULT '',
  team TEXT NOT NULL DEFAULT 'Development',
  company TEXT NOT NULL DEFAULT 'Ambizcon Health - India',
  casual_total INTEGER NOT NULL DEFAULT 12,
  casual_used NUMERIC(4,1) NOT NULL DEFAULT 0,
  sick_total INTEGER NOT NULL DEFAULT 10,
  sick_used NUMERIC(4,1) NOT NULL DEFAULT 0,
  earned_total INTEGER NOT NULL DEFAULT 15,
  earned_used NUMERIC(4,1) NOT NULL DEFAULT 0,
  permissions_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.festival_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access on festival_leaves" ON public.festival_leaves;
CREATE POLICY "Allow public full access on festival_leaves" ON public.festival_leaves FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on employee_leave_balances" ON public.employee_leave_balances;
CREATE POLICY "Allow public full access on employee_leave_balances" ON public.employee_leave_balances FOR ALL USING (true) WITH CHECK (true);
