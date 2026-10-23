import { supabase } from '../lib/supabase';

function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  const match = (timeStr || '').match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toLowerCase();
  if (period === 'pm' && h < 12) h += 12;
  if (period === 'am' && h === 12) h = 0;
  return { hours: h, minutes: m };
}

async function fixAttendanceRecords() {
  console.log('🔄 Accurately correcting all attendance durations...');

  const { data: rows, error } = await supabase
    .from('attendance')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !rows) {
    console.error('Failed to fetch attendance records:', error);
    return;
  }

  let fixedCount = 0;

  for (const r of rows) {
    if (r.status !== 'completed' || !r.clock_out || r.clock_out === '—' || r.clock_out === '-') continue;

    const isAus = (r.company || '').includes('Australia');
    const isAuto = r.clock_out.includes('Auto-Closed') || (r.worked_hours || '').includes('Auto-Closed');

    let realSeconds = 0;
    let workedHoursStr = '';

    if (isAuto) {
      // Auto-Closed at 8:00 PM on the shift date
      const inDate = new Date(r.created_at);
      const tz = isAus ? 'Australia/Brisbane' : 'Asia/Kolkata';
      const punchDayStr = inDate.toLocaleDateString('en-CA', { timeZone: tz });
      const [pYear, pMonth, pDay] = punchDayStr.split('-').map(Number);
      const eightPMUtc = isAus
        ? Date.UTC(pYear, pMonth - 1, pDay, 10, 0, 0)
        : Date.UTC(pYear, pMonth - 1, pDay, 14, 30, 0);

      realSeconds = Math.max(60, Math.floor((eightPMUtc - inDate.getTime()) / 1000));
      const hours = Math.floor(realSeconds / 3600);
      const mins = Math.floor((realSeconds % 3600) / 60);
      workedHoursStr = `${hours}h ${String(mins).padStart(2, '0')}m (Auto-Closed @ 8 PM)`;
    } else {
      // Manual Clock-Out: Calculate from exact Clock In vs Clock Out times
      const parsedIn = parseTimeString(r.clock_in);
      const parsedOut = parseTimeString(r.clock_out);

      if (parsedIn && parsedOut) {
        let diffMinutes = (parsedOut.hours * 60 + parsedOut.minutes) - (parsedIn.hours * 60 + parsedIn.minutes);
        if (diffMinutes < 0) diffMinutes += 24 * 60; // Cross midnight
        realSeconds = Math.max(60, diffMinutes * 60);
        const hours = Math.floor(realSeconds / 3600);
        const mins = Math.floor((realSeconds % 3600) / 60);
        workedHoursStr = `${hours}h ${String(mins).padStart(2, '0')}m`;
      } else {
        const inMs = new Date(r.created_at).getTime();
        const outMs = new Date(r.updated_at || r.clock_out).getTime();
        if (outMs > inMs) {
          realSeconds = Math.max(60, Math.floor((outMs - inMs) / 1000));
          const hours = Math.floor(realSeconds / 3600);
          const mins = Math.floor((realSeconds % 3600) / 60);
          workedHoursStr = `${hours}h ${String(mins).padStart(2, '0')}m`;
        }
      }
    }

    if (realSeconds > 0 && (r.worked_seconds !== realSeconds || r.worked_hours !== workedHoursStr)) {
      console.log(`Updated [${r.id}] ${r.user_name} (${r.clock_in} -> ${r.clock_out}): ${r.worked_hours} (${r.worked_seconds}s) -> ${workedHoursStr} (${realSeconds}s)`);
      await supabase
        .from('attendance')
        .update({
          worked_seconds: realSeconds,
          worked_hours: workedHoursStr,
        })
        .eq('id', r.id);
      fixedCount++;
    }
  }

  console.log(`✅ Finished. Fixed ${fixedCount} record(s).`);
}

fixAttendanceRecords().catch(console.error);
