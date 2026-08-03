import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User as UserModel } from '@/models/User';
import { Team as TeamModel } from '@/models/Team';
import { Task as TaskModel } from '@/models/Task';
import { Comment as CommentModel } from '@/models/Comment';
import { SEED_USERS, SEED_TEAMS, SEED_TASKS_INITIAL } from '@/lib/seed-data';
import { mockStore } from '@/lib/mock-store';

export async function POST() {
  const db = await connectDB();

  if (db) {
    try {
      // Clear existing collections
      await UserModel.deleteMany({});
      await TeamModel.deleteMany({});
      await TaskModel.deleteMany({});
      await CommentModel.deleteMany({});

      // Insert Users
      const createdUsers = await UserModel.insertMany(SEED_USERS);
      
      // Insert Teams
      const createdTeams = await TeamModel.insertMany(SEED_TEAMS);

      // Map Users for Task assignments
      const alex = createdUsers.find((u) => u.email === 'alex@taskflow.company');
      const maya = createdUsers.find((u) => u.email === 'maya@taskflow.company');
      const ethan = createdUsers.find((u) => u.email === 'ethan@taskflow.company');
      const liam = createdUsers.find((u) => u.email === 'liam@taskflow.company');
      const oliver = createdUsers.find((u) => u.email === 'oliver@taskflow.company');
      const ava = createdUsers.find((u) => u.email === 'ava@taskflow.company');
      const noah = createdUsers.find((u) => u.email === 'noah@taskflow.company');

      const userMap: Record<string, string> = {
        'alex@taskflow.company': alex?._id.toString() || '',
        'maya@taskflow.company': maya?._id.toString() || '',
        'ethan@taskflow.company': ethan?._id.toString() || '',
        'liam@taskflow.company': liam?._id.toString() || '',
        'oliver@taskflow.company': oliver?._id.toString() || '',
        'ava@taskflow.company': ava?._id.toString() || '',
        'noah@taskflow.company': noah?._id.toString() || '',
      };

      // Create Seed Tasks in MongoDB
      const taskDocs = SEED_TASKS_INITIAL.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        team: t.team,
        assignedTo: t.userEmail ? userMap[t.userEmail] : undefined,
        createdBy: userMap[t.creatorEmail] || alex?._id,
        raisedBy: t.raisedByEmail ? userMap[t.raisedByEmail] : undefined,
        incoming: t.incoming,
        dueDate: new Date(t.dueDate),
        labels: t.labels,
        attachments: t.attachments || [],
      }));

      const createdTasks = await TaskModel.insertMany(taskDocs);

      // Add sample comment
      if (createdTasks.length > 0 && maya && oliver) {
        await CommentModel.create({
          taskId: createdTasks[0]._id,
          userId: maya._id,
          message: 'Looking great Oliver! Make sure dark mode contrast meets WCAG AA standards.',
        });
        await CommentModel.create({
          taskId: createdTasks[0]._id,
          userId: oliver._id,
          message: '@Maya tested with accessibility contrast analyzer, all checks passing! 🚀',
        });
      }

      mockStore.reset();

      return NextResponse.json({
        success: true,
        message: 'Successfully seeded MongoDB Atlas and initialized TaskFlow database!',
        counts: {
          users: createdUsers.length,
          teams: createdTeams.length,
          tasks: createdTasks.length,
        },
      });
    } catch (e) {
      console.error('Database seeding failed:', e);
      return NextResponse.json(
        { success: false, error: 'Database seeding failed', details: String(e) },
        { status: 500 }
      );
    }
  }

  // Fallback reset in-memory mock store
  mockStore.reset();
  return NextResponse.json({
    success: true,
    message: 'Reset in-memory seed data store successfully!',
    counts: {
      users: mockStore.users.length,
      teams: mockStore.teams.length,
      tasks: mockStore.tasks.length,
    },
  });
}
