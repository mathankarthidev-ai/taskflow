-- Create work_logs table for Daily Hourly Work Slots (Admin view & My tab user view)
CREATE TABLE IF NOT EXISTS public.work_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  team TEXT NOT NULL DEFAULT 'Development',
  company TEXT NOT NULL DEFAULT 'Ambizcon Health - India',
  work_date TEXT NOT NULL,
  task_id TEXT DEFAULT '',
  task_title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  color TEXT NOT NULL DEFAULT 'blue',
  is_auto_in_progress BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_logs_date_email ON public.work_logs(work_date, user_email);

ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access on work_logs" ON public.work_logs;
CREATE POLICY "Allow public full access on work_logs" ON public.work_logs FOR ALL USING (true) WITH CHECK (true);
