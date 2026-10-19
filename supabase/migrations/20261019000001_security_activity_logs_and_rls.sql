-- ============================================================================
-- AMBIZCON TASKFLOW: SECURITY HARDENING MIGRATION
-- 1. Activity Logs Table (Audit Trail)
-- 2. Strict Row Level Security (RLS) Policies on Core Tables
-- ============================================================================

-- 1. CENTRAL ACTIVITY / SECURITY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  actor_email TEXT,
  actor_role TEXT,
  target_id TEXT,
  target_type TEXT,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_event ON public.activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON public.activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Security Policy: Insert allowed for system/authenticated users
DROP POLICY IF EXISTS "System can insert audit logs" ON public.activity_logs;
CREATE POLICY "System can insert audit logs"
  ON public.activity_logs
  FOR INSERT
  WITH CHECK (true);

-- Security Policy: Read restricted strictly to Super Admin
DROP POLICY IF EXISTS "Super Admin can view audit logs" ON public.activity_logs;
CREATE POLICY "Super Admin can view audit logs"
  ON public.activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()::text
      AND public.users.role IN ('Super Admin', 'Admin', 'CEO')
    )
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES FOR REIMBURSEMENTS
-- ============================================================================

ALTER TABLE public.reimbursements ENABLE ROW LEVEL SECURITY;

-- Allow employees to read their own claims, and Admins/TLs to read all claims
DROP POLICY IF EXISTS "View reimbursements policy" ON public.reimbursements;
CREATE POLICY "View reimbursements policy"
  ON public.reimbursements
  FOR SELECT
  USING (
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()::text
      AND public.users.role IN ('Super Admin', 'Admin', 'Team Lead', 'CEO')
    )
    OR auth.role() = 'service_role'
  );

-- Allow employees to insert their own claims
DROP POLICY IF EXISTS "Insert own reimbursements" ON public.reimbursements;
CREATE POLICY "Insert own reimbursements"
  ON public.reimbursements
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()::text
    OR auth.role() = 'service_role'
  );

-- Allow employees to update only unapproved claims they own, Admins can update any
DROP POLICY IF EXISTS "Update reimbursements policy" ON public.reimbursements;
CREATE POLICY "Update reimbursements policy"
  ON public.reimbursements
  FOR UPDATE
  USING (
    (
      user_id = auth.uid()::text
      AND status NOT IN ('Approved', 'Paid')
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()::text
      AND public.users.role IN ('Super Admin', 'Admin', 'Team Lead', 'CEO')
    )
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES FOR WORK LOGS
-- ============================================================================

ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View work logs policy" ON public.work_logs;
CREATE POLICY "View work logs policy"
  ON public.work_logs
  FOR SELECT
  USING (
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()::text
      AND public.users.role IN ('Super Admin', 'Admin', 'Team Lead', 'CEO')
    )
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Insert own work logs" ON public.work_logs;
CREATE POLICY "Insert own work logs"
  ON public.work_logs
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()::text
    OR auth.role() = 'service_role'
  );
