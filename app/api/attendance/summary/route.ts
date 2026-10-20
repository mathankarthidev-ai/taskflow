import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function parseSeconds(rec: any): number {
  if (typeof rec?.worked_seconds === 'number' && rec.worked_seconds > 0) return rec.worked_seconds;
  const str = rec?.worked_hours || '';
  const m = str.match(/(\d+)\s*h(?:ours?)?(?:\s*(\d+)\s*m)?/i);
  return m ? parseInt(m[1] || '0', 10) * 3600 + parseInt(m[2] || '0', 10) * 60 : 0;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || '';
  const email = searchParams.get('email') || '';
  const period = searchParams.get('period') || 'week';

  try {
    let query = supabase.from('attendance').select('*').order('created_at', { ascending: false });
    if (email) {
      query = query.eq('user_email', email);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: records, error } = await query;
    const userRecords = (!error && records) ? records : [];

    if (period === 'week') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
      const daySummary: Record<string, string> = {};
      let totalWeekSecs = 0;

      days.forEach((dayName, idx) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + idx);
        const dayKey = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const matching = userRecords.filter((r) => {
          const rKey = r.created_at ? new Date(r.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : '';
          return rKey === dayKey;
        });

        const daySecs = matching.reduce((sum, r) => sum + parseSeconds(r), 0);
        totalWeekSecs += daySecs;
        const hrs = Math.floor(daySecs / 3600);
        const mins = Math.floor((daySecs % 3600) / 60);
        daySummary[dayName] = daySecs > 0 ? `${hrs}h ${mins < 10 ? '0' : ''}${mins}m` : '0h 00m';
      });

      const totHrs = Math.floor(totalWeekSecs / 3600);
      const totMins = Math.floor((totalWeekSecs % 3600) / 60);
      daySummary['totalWorkedHours'] = `${totHrs}h ${totMins < 10 ? '0' : ''}${totMins}m`;

      return NextResponse.json({
        success: true,
        period: 'week',
        summary: daySummary,
      });
    }

    // Monthly summary
    const currentMonthKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7);
    const monthRecords = userRecords.filter((r) => {
      const rKey = r.created_at ? new Date(r.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : '';
      return rKey.startsWith(currentMonthKey);
    });

    const totalSecs = monthRecords.reduce((acc, r) => acc + parseSeconds(r), 0);
    const totalHrs = Math.round((totalSecs / 3600) * 10) / 10;
    const daysWorked = new Set(monthRecords.map((r) => r.created_at ? new Date(r.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : '')).size;

    return NextResponse.json({
      success: true,
      period: 'month',
      totalWorkedSeconds: totalSecs,
      totalWorkedHours: totalHrs,
      daysWorked: daysWorked,
      completedSessions: monthRecords.filter((r) => r.status === 'completed' || (r.clock_out && r.clock_out !== '—')).length,
      averageHoursPerDay: daysWorked > 0 ? (totalHrs / daysWorked).toFixed(2) + 'h' : '0.0h',
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message || 'Failed to compute attendance summary',
    }, { status: 500 });
  }
}
