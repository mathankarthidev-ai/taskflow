-- Create self_reminders table for personal Simple Self Reminders
CREATE TABLE IF NOT EXISTS public.self_reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  note TEXT DEFAULT '',
  reminder_date TEXT NOT NULL,
  day_name TEXT NOT NULL DEFAULT 'Monday',
  reminder_time TEXT NOT NULL DEFAULT '09:30 AM',
  repeat_type TEXT NOT NULL DEFAULT 'Daily',
  custom_days TEXT DEFAULT '',
  is_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_self_reminders_user_email ON public.self_reminders(user_email);

ALTER TABLE public.self_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access on self_reminders" ON public.self_reminders;
CREATE POLICY "Allow public full access on self_reminders" ON public.self_reminders FOR ALL USING (true) WITH CHECK (true);
