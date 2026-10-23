import { supabase } from '../lib/supabase';
import { attendanceDb } from '../lib/attendance-db';
import { mockStore } from '../lib/mock-store';

async function clearAllTemporaryData() {
  console.log('🚀 Starting deep clean of all temporary data...');

  // 1. Clear Supabase work_logs
  try {
    const { error } = await supabase.from('work_logs').delete().neq('id', '__KEEP_NOTHING__');
    if (error) console.error('Error clearing work_logs:', error.message);
    else console.log('✅ Cleared all rows from "work_logs" table.');
  } catch (e: any) {
    console.error('Exception clearing work_logs:', e.message);
  }

  // 2. Clear Supabase tasks
  try {
    const { error } = await supabase.from('tasks').delete().neq('id', '__KEEP_NOTHING__');
    if (error) console.error('Error clearing tasks:', error.message);
    else console.log('✅ Cleared all rows from "tasks" table.');
  } catch (e: any) {
    console.error('Exception clearing tasks:', e.message);
  }

  // 3. Clear Supabase reimbursements
  try {
    const { error } = await supabase.from('reimbursements').delete().neq('id', '__KEEP_NOTHING__');
    if (error) console.error('Error clearing reimbursements:', error.message);
    else console.log('✅ Cleared all rows from "reimbursements" table.');
  } catch (e: any) {
    console.error('Exception clearing reimbursements:', e.message);
  }

  // 4. Clear Supabase self_reminders
  try {
    const { error } = await supabase.from('self_reminders').delete().neq('id', '__KEEP_NOTHING__');
    if (error) console.error('Error clearing self_reminders:', error.message);
    else console.log('✅ Cleared all rows from "self_reminders" table.');
  } catch (e: any) {
    console.error('Exception clearing self_reminders:', e.message);
  }

  // 5. Clear Supabase chat_messages
  try {
    const { error } = await supabase.from('chat_messages').delete().neq('id', '__KEEP_NOTHING__');
    if (error) console.error('Error clearing chat_messages:', error.message);
    else console.log('✅ Cleared all rows from "chat_messages" table.');
  } catch (e: any) {
    console.error('Exception clearing chat_messages:', e.message);
  }

  // 6. Reset in-memory stores
  attendanceDb.resetAll();
  mockStore.reset();
  console.log('✅ Reset in-memory attendanceDb and mockStore.');

  // 7. Verify all Supabase tables are now 0 rows
  const verifyTables = ['work_logs', 'tasks', 'reimbursements', 'self_reminders', 'chat_messages'];
  for (const table of verifyTables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) console.log(`Verify "${table}": error -> ${error.message}`);
    else console.log(`Verify "${table}": ${count} rows (CLEAN)`);
  }

  console.log('🎉 All temporary database records have been successfully wiped to clean scratch state.');
}

clearAllTemporaryData().catch(console.error);
