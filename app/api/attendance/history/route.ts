import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const team = searchParams.get('team');
  const scope = searchParams.get('scope'); // 'all' | 'team' | 'user'

  try {
    let query = supabase.from('attendance').select('*').order('created_at', { ascending: false });

    if (scope === 'team' && team && team !== 'All') {
      query = query.eq('user_team', team);
    } else if (scope === 'user' && userId) {
      query = query.eq('user_id', userId);
    } else if (!scope && userId) {
      query = query.eq('user_id', userId);
    }

    const { data: supaRecords, error } = await query;

    if (!error && supaRecords && supaRecords.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'supabase',
        records: supaRecords.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          userName: r.user_name,
          userEmail: r.user_email,
          userTeam: r.user_team,
          company: r.company,
          date: r.session_date,
          clockIn: r.clock_in,
          clockInAest: r.clock_in_aest,
          clockOut: r.clock_out || '—',
          clockOutAest: r.clock_out_aest || '—',
          status: r.status === 'working' ? 'Active Shift' : 'Completed',
          workMode: r.work_mode,
          ipAddress: r.ip_address,
          location: r.location,
          hoursWorked: r.worked_hours || 'In Progress (Live)',
          workedSeconds: r.worked_seconds,
          geofenceVerified: r.geofence_verified,
        })),
      });
    }
  } catch (err) {
    console.warn('Supabase fetch failed, falling back to memory:', err);
  }

  // Fallback to in-memory store if Supabase fails or is empty
  let userRecords = userId ? attendanceDb.getByUser(userId) : attendanceDb.getAll();
  return NextResponse.json({
    success: true,
    source: 'memory',
    records: userRecords,
  });
}
