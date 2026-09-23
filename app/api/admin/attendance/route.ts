import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';
import { supabase } from '@/lib/supabase';
import { formatTimeIST, formatTimeAEST } from '@/lib/utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase();
  const team = searchParams.get('team');

  try {
    let query = supabase.from('attendance').select('*').order('created_at', { ascending: false });

    if (team && team !== 'All') {
      query = query.eq('user_team', team);
    }

    const { data: supaRecords, error } = await query;
    if (!error && supaRecords) {
      let filtered = supaRecords.map((r: any) => ({
        ...r,
        clock_in: r.created_at ? formatTimeIST(r.created_at) : r.clock_in,
        clock_in_aest: r.created_at ? formatTimeAEST(r.created_at) : r.clock_in_aest,
        clock_out: r.clock_out && r.clock_out !== '—' && r.updated_at && r.status === 'completed' ? formatTimeIST(r.updated_at) : (r.clock_out || '—'),
        clock_out_aest: r.clock_out && r.clock_out !== '—' && r.updated_at && r.status === 'completed' ? formatTimeAEST(r.updated_at) : (r.clock_out_aest || '—'),
      }));
      if (search) {
        filtered = filtered.filter(
          (r: any) =>
            r.user_name.toLowerCase().includes(search) ||
            r.user_team.toLowerCase().includes(search) ||
            r.user_email?.toLowerCase().includes(search)
        );
      }
      return NextResponse.json({
        success: true,
        source: 'supabase',
        records: filtered,
        total: filtered.length,
      });
    }
  } catch (e) {
    console.warn('Supabase admin fetch warning:', e);
  }

  let records = attendanceDb.getAll();
  if (team && team !== 'All') {
    records = records.filter((r) => r.userTeam === team);
  }
  return NextResponse.json({
    success: true,
    source: 'memory',
    records,
    total: records.length,
  });
}
