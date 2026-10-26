import { supabase } from '../lib/supabase';

async function checkAttendanceDates() {
  const { data: allAtt } = await supabase.from('attendance').select('id, user_name, clock_in, clock_out, created_at, status');
  if (!allAtt) return;

  const today = '2026-10-26';
  const todayRecords = allAtt.filter(r => r.created_at && r.created_at.startsWith(today));
  const pastRecords = allAtt.filter(r => !r.created_at || !r.created_at.startsWith(today));

  console.log(`Total attendance rows: ${allAtt.length}`);
  console.log(`Today's attendance rows (${today}): ${todayRecords.length}`);
  console.log(`Past attendance rows: ${pastRecords.length}`);
  console.log('\nSample past attendance rows:');
  console.log(pastRecords.slice(0, 3));
  console.log('\nSample today attendance rows:');
  console.log(todayRecords.slice(0, 3));
}

checkAttendanceDates();
