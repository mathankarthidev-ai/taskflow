import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';
import { supabase } from '@/lib/supabase';
import { formatTimeIST, formatTimeAEST } from '@/lib/utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const userEmail = searchParams.get('email');
  const userName = searchParams.get('name');

  try {
    if (userId || userEmail || userName) {
      let query = supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      const conditions: string[] = [];
      if (userId) conditions.push(`user_id.eq.${userId}`);
      if (userEmail) conditions.push(`user_email.eq.${userEmail}`);
      if (userName) conditions.push(`user_name.ilike.%${userName}%`);

      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const latest = data[0];
        const isWorking = latest.status === 'working' && (!latest.clock_out || latest.clock_out === '—');
        return NextResponse.json({
          success: true,
          source: 'supabase',
          isWorking,
          status: isWorking ? 'working' : 'completed',
          clockIn: latest.created_at ? formatTimeIST(latest.created_at) : latest.clock_in,
          clockInAest: latest.created_at ? formatTimeAEST(latest.created_at) : latest.clock_in_aest,
          clockOut:
            latest.clock_out && latest.clock_out !== '—' && latest.updated_at && latest.status === 'completed'
              ? formatTimeIST(latest.updated_at)
              : (latest.clock_out || '—'),
          clockOutAest:
            latest.clock_out && latest.clock_out !== '—' && latest.updated_at && latest.status === 'completed'
              ? formatTimeAEST(latest.updated_at)
              : (latest.clock_out_aest || '—'),
          workedHours: latest.worked_hours || '0h 00m',
          sessionDate: latest.session_date,
          attendance: latest,
        });
      }
    }
  } catch (err) {
    console.warn('Supabase current attendance check warning:', err);
  }

  const active = userId ? attendanceDb.getActiveByUser(userId) : null;
  return NextResponse.json({
    success: true,
    source: 'memory',
    isWorking: !!active,
    attendance: active,
  });
}

