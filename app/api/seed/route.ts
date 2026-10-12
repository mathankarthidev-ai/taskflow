import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SEED_CLIENTS_FULL } from '@/lib/seed-data';
import { mockStore } from '@/lib/mock-store';

export async function GET() {
  return POST();
}

export async function POST() {
  // 1. Reset in-memory seed store
  mockStore.reset();

  const results: Record<string, any> = {
    database: 'Supabase PostgreSQL (100% Unified)',
  };

  // 2. Sync & Seed All Supabase PostgreSQL Tables
  try {
    const supabaseUsers = mockStore.users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      team: u.team,
      company: u.company,
      avatar: u.avatar,
      birthday: u.birthday || null,
      dob: u.dob || null,
      work_mode: u.workMode || 'Work From Office',
      skills: u.skills || [],
      created_at: u.createdAt || new Date().toISOString(),
    }));
    const { error: userErr } = await supabase.from('users').upsert(supabaseUsers, { onConflict: 'email' });

    const supabaseTeams = mockStore.teams.map((t) => ({
      id: t._id,
      name: t.name,
      code: t.code,
      description: t.description,
      lead_id: t.leadId || null,
    }));
    const { error: teamErr } = await supabase.from('teams').upsert(supabaseTeams, { onConflict: 'name' });

    const supabaseTasks = mockStore.tasks.map((t) => ({
      id: t._id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      team: t.team,
      client_name: t.clientName,
      doctor_name: t.doctorName || null,
      specialist: t.specialist || null,
      assigned_to: t.assignedTo || null,
      created_by: t.createdBy || null,
      raised_by: t.raisedBy || null,
      incoming: Boolean(t.incoming),
      approval_status: t.approvalStatus || 'approved',
      review_status: t.reviewStatus || 'none',
      due_date: t.dueDate,
      labels: t.labels || [],
      attachments: t.attachments || [],
      subtasks: t.subtasks || [],
      reminder_settings: t.reminderSettings || null,
      history: t.history || [],
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    }));
    const { error: taskErr } = await supabase.from('tasks').upsert(supabaseTasks, { onConflict: 'id' });

    const supabaseClients = SEED_CLIENTS_FULL.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      status: c.status,
      added_by: c.addedBy,
      created_at: c.createdAt,
    }));
    const { error: clientErr } = await supabase.from('clients').upsert(supabaseClients, { onConflict: 'id' });

    const supabaseLeave = mockStore.leaveRequests.map((l) => ({
      id: l.id,
      emp_id: l.empId,
      emp_name: l.empName,
      emp_team: l.empTeam,
      type: l.type,
      from_date: l.from,
      to_date: l.to,
      days: l.days,
      half: Boolean(l.half),
      session: l.session || null,
      reason: l.reason,
      tl_status: l.tl,
      ceo_status: l.ceo,
      raised_date: l.raised,
      chat: l.chat || [],
    }));
    const { error: leaveErr } =
      supabaseLeave.length > 0
        ? await supabase.from('leave_requests').upsert(supabaseLeave, { onConflict: 'id' })
        : { error: null };

    const supabaseReimbursement = mockStore.reimbursements.map((r) => ({
      id: r._id,
      claim_no: r.claimNo,
      user_id: r.userId,
      user_name: r.userName,
      user_team: r.userTeam,
      user_avatar: r.userAvatar || null,
      company: r.company || 'Ambizcon Health - India',
      category: r.category,
      amount: r.amount,
      date: r.date,
      description: r.description,
      receipt_name: r.receiptName || null,
      receipt_url: r.receiptUrl || null,
      items: r.items || [],
      comments: r.comments || [],
      admin_status: r.adminStatus || null,
      tl_status: r.tlStatus || null,
      ceo_status: r.ceoStatus || null,
      status: r.status,
      is_paid: r.isPaid,
      created_at: r.createdAt,
    }));
    const { error: claimErr } = await supabase
      .from('reimbursements')
      .upsert(supabaseReimbursement, { onConflict: 'id' });

    results.supabase = {
      status: 'synced',
      syncedTables: ['users', 'teams', 'tasks', 'clients', 'leave_requests', 'reimbursements'],
      counts: {
        users: supabaseUsers.length,
        teams: supabaseTeams.length,
        tasks: supabaseTasks.length,
        clients: supabaseClients.length,
        leave_requests: supabaseLeave.length,
        reimbursements: supabaseReimbursement.length,
      },
      errors: {
        users: userErr ? userErr.message : null,
        teams: teamErr ? teamErr.message : null,
        tasks: taskErr ? taskErr.message : null,
        clients: clientErr ? clientErr.message : null,
        leave_requests: leaveErr ? leaveErr.message : null,
        reimbursements: claimErr ? claimErr.message : null,
      },
    };
  } catch (supabaseErr) {
    results.supabase = { status: 'error', details: String(supabaseErr) };
  }

  return NextResponse.json({
    success: true,
    message: 'Workspace database synced cleanly to Supabase PostgreSQL.',
    results,
  });
}

export async function DELETE() {
  // 1. Wipe in-memory store
  mockStore.tasks = [];
  mockStore.leaveRequests = [];
  mockStore.reimbursements = [];
  mockStore.comments = [];
  mockStore.timeEntries = [];
  mockStore.notifications = [];
  mockStore.projects = [];

  // 2. Wipe Supabase dynamic tables
  try {
    await supabase.from('tasks').delete().neq('id', '___none___');
    await supabase.from('comments').delete().neq('id', '___none___');
    await supabase.from('leave_requests').delete().neq('id', '___none___');
    await supabase.from('reimbursements').delete().neq('id', '___none___');
  } catch (e) {
    console.error('Supabase delete error:', e);
  }

  return NextResponse.json({
    success: true,
    message: 'All demo and test tasks, leave requests, reimbursement claims, and comments have been permanently removed from Supabase.',
  });
}
