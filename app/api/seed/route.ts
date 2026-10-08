import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { User as UserModel } from '@/models/User';
import { Team as TeamModel } from '@/models/Team';
import { Task as TaskModel } from '@/models/Task';
import { Comment as CommentModel } from '@/models/Comment';
import { SEED_USERS, SEED_TEAMS, SEED_TASKS_INITIAL, SEED_CLIENTS_FULL } from '@/lib/seed-data';
import { mockStore } from '@/lib/mock-store';

export async function GET() {
  return POST();
}

export async function POST() {
  // Always reset in-memory mock store
  mockStore.reset();

  const results: Record<string, any> = {
    mockStore: {
      users: mockStore.users.length,
      teams: mockStore.teams.length,
      tasks: mockStore.tasks.length,
      clients: mockStore.clients.length,
      leaveRequests: mockStore.leaveRequests.length,
      reimbursements: mockStore.reimbursements.length,
    },
  };

  // 1. Sync & Seed Supabase Database Tables
  try {
    const supabaseUsers = mockStore.users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      team: u.team,
      company: u.company,
      avatar: u.avatar,
      work_mode: u.workMode,
      skills: u.skills,
      created_at: u.createdAt || new Date().toISOString(),
    }));
    const { error: userErr } = await supabase.from('users').upsert(supabaseUsers, { onConflict: 'email' });

    const supabaseTeams = mockStore.teams.map((t) => ({
      id: t._id,
      name: t.name,
      code: t.code,
      description: t.description,
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
      assigned_to: t.assignedTo,
      created_by: t.createdBy,
      due_date: t.dueDate,
      labels: t.labels,
      reminder_settings: t.reminderSettings,
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
      reason: l.reason,
      tl_status: l.tl,
      ceo_status: l.ceo,
      raised_date: l.raised,
    }));
    const { error: leaveErr } = await supabase.from('leave_requests').upsert(supabaseLeave, { onConflict: 'id' });

    const supabaseReimbursement = mockStore.reimbursements.map((r) => ({
      id: r._id,
      claim_no: r.claimNo,
      user_id: r.userId,
      user_name: r.userName,
      user_team: r.userTeam,
      category: r.category,
      amount: r.amount,
      date: r.date,
      description: r.description,
      status: r.status,
      is_paid: r.isPaid,
      created_at: r.createdAt,
    }));
    const { error: claimErr } = await supabase.from('reimbursements').upsert(supabaseReimbursement, { onConflict: 'id' });

    results.supabase = {
      status: 'synced',
      syncedTables: ['users', 'teams', 'tasks', 'clients', 'leave_requests', 'reimbursements'],
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

  // 2. Sync MongoDB Atlas if connected
  const db = await connectDB();
  if (db) {
    try {
      await UserModel.deleteMany({});
      await TeamModel.deleteMany({});
      await TaskModel.deleteMany({});
      await CommentModel.deleteMany({});

      const createdUsers = await UserModel.insertMany(SEED_USERS);
      const createdTeams = await TeamModel.insertMany(SEED_TEAMS);

      const userMap: Record<string, string> = {};
      createdUsers.forEach((u) => {
        userMap[u.email] = u._id.toString();
      });
      const defaultAdminId = createdUsers[0]?._id.toString();

      const taskDocs = SEED_TASKS_INITIAL.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        team: t.team,
        assignedTo: t.userEmail ? userMap[t.userEmail] : undefined,
        createdBy: userMap[t.creatorEmail] || defaultAdminId,
        incoming: t.incoming,
        dueDate: new Date(t.dueDate),
        labels: t.labels,
        attachments: t.attachments || [],
      }));

      const createdTasks = await TaskModel.insertMany(taskDocs);

      if (createdTasks.length > 0 && createdUsers.length >= 2) {
        await CommentModel.create({
          taskId: createdTasks[0]._id,
          userId: createdUsers[0]._id,
          message: 'Please ensure WP 6.7 compatibility tests pass on staging before pushing live.',
        });
        await CommentModel.create({
          taskId: createdTasks[0]._id,
          userId: createdUsers[1]._id,
          message: 'Staging environment backup verified, proceeding with update checklist! 🚀',
        });
      }

      results.mongoDB = {
        users: createdUsers.length,
        teams: createdTeams.length,
        tasks: createdTasks.length,
      };
    } catch (e) {
      results.mongoDB = { error: String(e) };
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Workspace database synced cleanly across databases.',
    results,
  });
}

export async function DELETE() {
  // 1. Wipe in-memory mock store
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
    await supabase.from('leave_requests').delete().neq('id', '___none___');
    await supabase.from('reimbursements').delete().neq('id', '___none___');
  } catch (e) {
    console.error('Supabase delete error:', e);
  }

  // 3. Wipe MongoDB dynamic tables
  const db = await connectDB();
  if (db) {
    try {
      await TaskModel.deleteMany({});
      await CommentModel.deleteMany({});
    } catch (e) {
      console.error('MongoDB delete error:', e);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'All demo and test tasks, leave requests, reimbursement claims, and time entries have been permanently removed.',
  });
}
