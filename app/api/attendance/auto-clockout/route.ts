import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { attendanceDb } from '@/lib/attendance-db';

export async function GET() {
  return handleAutoClockOut();
}

export async function POST() {
  return handleAutoClockOut();
}

async function handleAutoClockOut() {
  try {
    const { data: records, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('status', 'working');

    if (error || !records) {
      return NextResponse.json({ success: true, count: 0, message: 'No working records found' });
    }

    const now = new Date();
    const autoClockedOutIds: string[] = [];

    for (const rec of records) {
      const isAus = (rec.company || '').includes('Australia');
      const tz = isAus ? 'Australia/Brisbane' : 'Asia/Kolkata';

      const punchDate = new Date(rec.created_at || Date.now());
      const punchDayStr = punchDate.toLocaleDateString('en-CA', { timeZone: tz });
      const currentDayStr = now.toLocaleDateString('en-CA', { timeZone: tz });

      const currentHour = parseInt(
        now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }),
        10
      );

      const isPast8PMToday = punchDayStr === currentDayStr && currentHour >= 20;
      const isPreviousDay = punchDayStr < currentDayStr;

      if (isPast8PMToday || isPreviousDay) {
        const clockOutStr = isAus ? '08:00 pm AEST (Auto-Closed)' : '08:00 pm IST (Auto-Closed)';
        const clockOutAestStr = '08:00 pm AEST (Auto-Closed)';

        const punchInMs = punchDate.getTime();
        const eightPMMs = punchInMs + 8 * 3600 * 1000;
        const workedSeconds = Math.max(3600, Math.floor((eightPMMs - punchInMs) / 1000));
        const hours = Math.floor(workedSeconds / 3600);
        const mins = Math.floor((workedSeconds % 3600) / 60);
        const workedHoursStr = `${hours}h ${mins}m (Auto-Closed @ 8 PM)`;

        await supabase
          .from('attendance')
          .update({
            clock_out: clockOutStr,
            clock_out_aest: clockOutAestStr,
            status: 'completed',
            worked_seconds: workedSeconds,
            worked_hours: workedHoursStr,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rec.id);

        attendanceDb.clearUserWorking(rec.user_id, rec.user_name, rec.user_email);
        autoClockedOutIds.push(rec.id);
      }
    }

    // Clean up any remaining duplicate active shifts for the same user on the same day
    const { data: currentWorking } = await supabase
      .from('attendance')
      .select('*')
      .eq('status', 'working');

    if (currentWorking && currentWorking.length > 0) {
      const userMap = new Map<string, typeof currentWorking>();
      for (const r of currentWorking) {
        const uKey = (r.user_name || '').toLowerCase().trim();
        if (!userMap.has(uKey)) userMap.set(uKey, []);
        userMap.get(uKey)!.push(r);
      }

      for (const [, recs] of userMap.entries()) {
        if (recs.length > 1) {
          recs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          for (let i = 1; i < recs.length; i++) {
            await supabase
              .from('attendance')
              .update({
                clock_out: recs[i].clock_in,
                status: 'completed',
                worked_hours: '0h 01m',
                updated_at: new Date().toISOString(),
              })
              .eq('id', recs[i].id);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: autoClockedOutIds.length,
      autoClockedOutIds,
    });
  } catch (err) {
    console.error('Auto clock-out error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
