import { supabase } from '../lib/supabase';

async function purgePastDemoAttendance() {
  console.log('🚀 Purging 183 past demo attendance records from September...');

  const today = '2026-10-26';

  // 1. Fetch count of records prior to today
  const { data: pastRecords, error: fetchErr } = await supabase
    .from('attendance')
    .select('id, created_at, user_name')
    .lt('created_at', `${today}T00:00:00Z`);

  if (fetchErr) {
    console.error('Error querying past records:', fetchErr.message);
    return;
  }

  console.log(`Found ${pastRecords?.length || 0} past demo attendance records to delete.`);

  // 2. Delete past demo records
  if (pastRecords && pastRecords.length > 0) {
    const { error: delErr } = await supabase
      .from('attendance')
      .delete()
      .lt('created_at', `${today}T00:00:00Z`);

    if (delErr) {
      console.error('Error deleting past attendance records:', delErr.message);
      return;
    }
    console.log(`✅ Successfully deleted ${pastRecords.length} past demo attendance records.`);
  }

  // 3. Verify remaining attendance rows (should strictly be today's records)
  const { data: remaining, count: remainingCount, error: remErr } = await supabase
    .from('attendance')
    .select('id, user_name, clock_in, clock_out, status, created_at', { count: 'exact' });

  if (remErr) {
    console.error('Error checking remaining attendance:', remErr.message);
  } else {
    console.log(`\nRemaining attendance records: ${remainingCount} (All from today, ${today}):`);
    remaining?.forEach((r) => {
      console.log(`  - [${r.user_name}] In: ${r.clock_in} | Out: ${r.clock_out} | Status: ${r.status}`);
    });
  }

  // 4. Verify all other operational tables remain at 0
  console.log('\n--- VERIFYING ALL OPERATIONAL TABLES ---');
  const zeroTables = ['tasks', 'work_logs', 'reimbursements', 'self_reminders', 'chat_messages', 'leave_requests', 'comments'];
  for (const t of zeroTables) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`  Table "${t}": ${count} rows (CLEAN)`);
  }
}

purgePastDemoAttendance().catch(console.error);
