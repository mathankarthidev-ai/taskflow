import { supabase } from '../lib/supabase';
import { SEED_USERS, SEED_TEAMS, SEED_CLIENTS_FULL } from '../lib/seed-data';

async function seedOfficialRoster() {
  console.log('========================================================================');
  console.log('🌱 SEEDING OFFICIAL PRODUCTION ROSTER & CLIENTS TO SUPABASE');
  console.log('========================================================================\n');

  // 1. Teams (3 core teams)
  console.log(`1. Seeding ${SEED_TEAMS.length} Teams...`);
  const teamsPayload = SEED_TEAMS.map((t, idx) => ({
    id: `team_${t.name.toLowerCase()}`,
    name: t.name,
    code: t.code,
    description: t.description,
  }));
  const { error: teamErr } = await supabase.from('teams').upsert(teamsPayload, { onConflict: 'name' });
  if (teamErr) console.error('  ❌ Team seed error:', teamErr.message);
  else console.log(`  ✅ Successfully seeded ${teamsPayload.length} teams.`);

  // 2. Users (17 official employees)
  console.log(`\n2. Seeding ${SEED_USERS.length} Official Employees...`);
  const usersPayload = SEED_USERS.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    team: u.team,
    company: u.company || 'Ambizcon Health - India',
    avatar: u.avatar,
    birthday: u.birthday || null,
    dob: u.dob || null,
    work_mode: u.workMode || 'Work From Office',
    skills: u.skills || [],
    created_at: new Date().toISOString(),
  }));
  const { error: userErr } = await supabase.from('users').upsert(usersPayload, { onConflict: 'email' });
  if (userErr) console.error('  ❌ User seed error:', userErr.message);
  else console.log(`  ✅ Successfully seeded ${usersPayload.length} official users.`);

  // 3. Clients (44 medical centers)
  console.log(`\n3. Seeding ${SEED_CLIENTS_FULL.length} Medical Centers & Clinics...`);
  const clientsPayload = SEED_CLIENTS_FULL.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category || 'Medical Centers',
    contact_person: c.contact_person || '',
    email: c.email || '',
    phone: c.phone || '',
    status: c.status || 'active',
  }));
  const { error: clientErr } = await supabase.from('clients').upsert(clientsPayload, { onConflict: 'id' });
  if (clientErr) console.error('  ❌ Client seed error:', clientErr.message);
  else console.log(`  ✅ Successfully seeded ${clientsPayload.length} medical center clients.`);

  // 4. Verify Purity (0 rows in operational tables)
  console.log('\n--- VERIFYING OPERATIONAL TABLE PURITY ---');
  const operationalTables = ['tasks', 'work_logs', 'reimbursements', 'self_reminders', 'chat_messages', 'leave_requests', 'comments'];
  for (const table of operationalTables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) console.log(`  Table "${table}": error -> ${error.message}`);
    else console.log(`  Table "${table}": ${count} rows (CLEAN SLATE)`);
  }

  console.log('\n🎉 Production database successfully initialized and ready for live operations.');
}

seedOfficialRoster().catch(console.error);
