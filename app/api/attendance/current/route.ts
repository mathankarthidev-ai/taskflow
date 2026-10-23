import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';
import { supabase } from '@/lib/supabase';
import { formatTimeIST, formatTimeAEST, sanitizeClockOutTime, formatSessionDateIST } from '@/lib/utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const userEmail = searchParams.get('email');
  const userName = searchParams.get('name');

  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const todaySession = formatSessionDateIST(new Date().toISOString());

  try {
    if (userId || userEmail || userName) {
      let query = supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const conditions: string[] = [];
      if (userId) conditions.push(`user_id.eq.${userId}`);
      if (userEmail) conditions.push(`user_email.eq.${userEmail}`);
      if (userName) conditions.push(`user_name.ilike.%${userName}%`);

      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // 1. Check for active working shift
        const activeRecord = data.find(
          (r) => r.status === 'working' && (!r.clock_out || r.clock_out === '—' || r.clock_out === '-')
        );
        const latest = activeRecord || data[0];
        const isWorking = Boolean(activeRecord);

        // 2. Identify all completed shifts for TODAY
        const todayRecords = data.filter((r) => {
          if (r.session_date && r.session_date === todaySession) return true;
          if (r.created_at) {
            const recIST = new Date(r.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            return recIST === todayIST;
          }
          return false;
        });

        // 3. Calculate sum of completed shifts earlier today
        const completedShiftsToday = todayRecords.filter(
          (r) => r.status === 'completed' && (!activeRecord || r.id !== activeRecord.id)
        );

        const previousCompletedSecondsToday = completedShiftsToday.reduce((sum, r) => {
          if (typeof r.worked_seconds === 'number' && r.worked_seconds > 0) {
            return sum + r.worked_seconds;
          }
          if (r.worked_hours) {
            const m = r.worked_hours.match(/(\d+)\s*h(?:ours?)?(?:\s*(\d+)\s*m)?/i);
            if (m) {
              return sum + parseInt(m[1] || '0', 10) * 3600 + parseInt(m[2] || '0', 10) * 60;
            }
          }
          return sum;
        }, 0);

        // 4. Calculate today total seconds
        let currentSessionSeconds = 0;
        if (isWorking && activeRecord) {
          const startMs = new Date(activeRecord.created_at || Date.now()).getTime();
          currentSessionSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        }

        const todayTotalSeconds = isWorking
          ? previousCompletedSecondsToday + currentSessionSeconds
          : previousCompletedSecondsToday;

        const totalH = Math.floor(todayTotalSeconds / 3600);
        const totalM = Math.floor((todayTotalSeconds % 3600) / 60);
        const todayCumulativeWorkedHours = `${totalH}h ${String(totalM).padStart(2, '0')}m`;

        const isAuto =
          Boolean(latest.clock_out && latest.clock_out.toLowerCase().includes('auto')) ||
          Boolean(latest.worked_hours && latest.worked_hours.toLowerCase().includes('auto'));

        return NextResponse.json({
          success: true,
          source: 'supabase',
          isWorking,
          status: isWorking ? 'working' : 'completed',
          clockIn: latest.created_at ? formatTimeIST(latest.created_at) : latest.clock_in,
          clockInAest: latest.created_at ? formatTimeAEST(latest.created_at) : latest.clock_in_aest,
          clockOut: sanitizeClockOutTime(latest.clock_out, false, isAuto),
          clockOutAest: sanitizeClockOutTime(latest.clock_out_aest || latest.clock_out, true, isAuto),
          workedHours: todayTotalSeconds > 0 ? todayCumulativeWorkedHours : (latest.worked_hours || '0h 00m'),
          sessionDate: latest.session_date || todaySession,
          previousCompletedSecondsToday,
          todayTotalSeconds,
          attendance: latest,
        });
      }
    }
  } catch (err) {
    console.warn('Supabase current attendance check warning:', err);
  }

  const active = userId ? attendanceDb.getActiveByUser(userId, userName || undefined, userEmail || undefined) : null;
  const previousCompletedSecondsToday = userId
    ? attendanceDb.getTodayCompletedSeconds(userId, userName || undefined, userEmail || undefined)
    : 0;
  const isWorking = !!active;

  let currentSessionSeconds = 0;
  if (active && active.clockIn) {
    const startMs = new Date(active.clockIn).getTime();
    currentSessionSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  }
  const todayTotalSeconds = isWorking
    ? previousCompletedSecondsToday + currentSessionSeconds
    : previousCompletedSecondsToday;

  const totalH = Math.floor(todayTotalSeconds / 3600);
  const totalM = Math.floor((todayTotalSeconds % 3600) / 60);
  const todayCumulativeWorkedHours = `${totalH}h ${String(totalM).padStart(2, '0')}m`;

  return NextResponse.json({
    success: true,
    source: 'memory',
    isWorking,
    status: isWorking ? 'working' : 'completed',
    clockIn: active ? formatTimeIST(active.clockIn) : '—',
    clockOut: active?.clockOut ? formatTimeIST(active.clockOut) : '—',
    workedHours: todayTotalSeconds > 0 ? todayCumulativeWorkedHours : '0h 00m',
    previousCompletedSecondsToday,
    todayTotalSeconds,
    attendance: active,
  });
}

