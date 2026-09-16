import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'user_anirudh_01';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const status = searchParams.get('status');

  let userRecords = attendanceDb.getByUser(userId);

  if (status) {
    userRecords = userRecords.filter((r) => r.status === status);
  }

  if (startDate) {
    userRecords = userRecords.filter((r) => new Date(r.clockIn) >= new Date(startDate));
  }

  if (endDate) {
    userRecords = userRecords.filter((r) => new Date(r.clockIn) <= new Date(endDate + 'T23:59:59Z'));
  }

  const total = userRecords.length;
  const startIndex = (page - 1) * limit;
  const paginated = userRecords.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    success: true,
    records: paginated,
    pagination: {
      page,
      limit,
      total,
    },
  });
}
