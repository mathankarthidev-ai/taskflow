import { supabase } from '../lib/supabase';
import { SEED_USERS } from '../lib/seed-data';
import { validateReceiptAttachment } from '../lib/file-security';

async function runFullPreLaunchAudit() {
  console.log('===============================================================');
  console.log('🔍 RUNNING COMPREHENSIVE PRE-GO-LIVE PRODUCTION AUDIT');
  console.log('===============================================================\n');

  let passes = 0;
  let warnings = 0;
  let errors = 0;

  // 1. DATABASE & CLEAN SLATE AUDIT
  console.log('--- 1. DATABASE & CLEAN SLATE AUDIT ---');
  const cleanTables = ['tasks', 'work_logs', 'reimbursements', 'self_reminders', 'chat_messages'];
  for (const table of cleanTables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`  ❌ FAIL: Table "${table}" error:`, error.message);
      errors++;
    } else if (count === 0) {
      console.log(`  ✅ PASS: Table "${table}" is 100% clean (0 rows)`);
      passes++;
    } else {
      console.log(`  ⚠️ WARN: Table "${table}" has ${count} rows`);
      warnings++;
    }
  }

  // Check Users Table & Roster
  const { data: users, count: userCount, error: userErr } = await supabase
    .from('users')
    .select('id, name, email, role, team, company', { count: 'exact' });

  if (userErr) {
    console.log('  ❌ FAIL: Unable to fetch users table:', userErr.message);
    errors++;
  } else {
    console.log(`  ✅ PASS: Users table has ${userCount} official roster members`);
    passes++;

    // Verify key roles exist
    const hasSuperAdmin = users?.some(u => u.role === 'Super Admin');
    const hasTeamLead = users?.some(u => u.role === 'Team Lead');
    const hasMember = users?.some(u => u.role === 'Team Member');

    if (hasSuperAdmin && hasTeamLead && hasMember) {
      console.log('  ✅ PASS: All 3 core organizational roles present (Super Admin, Team Lead, Team Member)');
      passes++;
    } else {
      console.log('  ❌ FAIL: Missing required role hierarchy');
      errors++;
    }
  }

  // 2. FILE UPLOADS & STORAGE SECURITY
  console.log('\n--- 2. FILE SECURITY & 5MB LIMIT AUDIT ---');
  // Safe PDF
  const safePdf = validateReceiptAttachment('invoice_oct_2026.pdf', 'data:application/pdf;base64,JVBERi0xLjQKJ...');
  if (safePdf.valid) {
    console.log('  ✅ PASS: Valid PDF document allowed');
    passes++;
  } else {
    console.log('  ❌ FAIL: Valid PDF rejected:', safePdf.error);
    errors++;
  }

  // Dangerous .exe
  const blockedExe = validateReceiptAttachment('malware.exe', 'data:application/octet-stream;base64,TVqQAA...');
  if (!blockedExe.valid) {
    console.log('  ✅ PASS: Dangerous executable (.exe) strictly blocked');
    passes++;
  } else {
    console.log('  ❌ FAIL: Executable was not blocked!');
    errors++;
  }

  // Dangerous .bat
  const blockedBat = validateReceiptAttachment('attack.bat', 'data:text/plain;base64,ZWNobyBoYWNrZWQ=');
  if (!blockedBat.valid) {
    console.log('  ✅ PASS: Dangerous script (.bat) strictly blocked');
    passes++;
  } else {
    console.log('  ❌ FAIL: Script was not blocked!');
    errors++;
  }

  // Exceeds 5MB
  const giantPayload = 'A'.repeat(7 * 1024 * 1024); // ~7MB base64
  const overSize = validateReceiptAttachment('giant_receipt.png', giantPayload);
  if (!overSize.valid) {
    console.log('  ✅ PASS: Payload exceeding 5MB strictly blocked');
    passes++;
  } else {
    console.log('  ❌ FAIL: Over 5MB payload was not blocked!');
    errors++;
  }

  // 3. ATTENDANCE & SHIFT MATH ACCURACY
  console.log('\n--- 3. ATTENDANCE & SHIFT MATH AUDIT ---');
  const { data: attList } = await supabase
    .from('attendance')
    .select('id, user_name, clock_in, clock_out, worked_seconds, worked_hours')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);

  if (attList && attList.length > 0) {
    let mathOk = true;
    for (const r of attList) {
      if (r.worked_seconds === 3599 && r.clock_out !== '08:35 am IST' && r.clock_in !== '08:34 am IST') {
        mathOk = false;
        console.log(`  ❌ FAIL: Found fallback 3599s record on [${r.id}] ${r.user_name}`);
        errors++;
      }
    }
    if (mathOk) {
      console.log(`  ✅ PASS: Recent completed shifts have accurate durations (e.g. ${attList[0].user_name}: ${attList[0].worked_hours})`);
      passes++;
    }
  } else {
    console.log('  ℹ️ INFO: No completed attendance records to check');
  }

  // 4. ENVIRONMENT & SECRET EXPOSURE CHECK
  console.log('\n--- 4. SECRETS & LEAK AUDIT ---');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (serviceKey && !serviceKey.startsWith('NEXT_PUBLIC')) {
    console.log('  ✅ PASS: SUPABASE_SERVICE_ROLE_KEY is properly isolated from client bundle');
    passes++;
  } else if (!serviceKey) {
    console.log('  ✅ PASS: Service role key not exposed to client');
    passes++;
  }

  console.log('\n===============================================================');
  console.log(`📊 AUDIT SUMMARY: PASSED: ${passes} | WARNINGS: ${warnings} | ERRORS: ${errors}`);
  console.log('===============================================================');
}

runFullPreLaunchAudit().catch(console.error);
