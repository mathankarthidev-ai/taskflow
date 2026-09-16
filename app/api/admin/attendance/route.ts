import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase();
  const status = searchParams.get('status');
  const team = searchParams.get('team');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  let records = attendanceDb.getAll();

  if (team && team !== 'All') {
    records = records.filter((r) => r.userTeam === team);
  }

  if (status) {
    records = records.filter((r) => r.status === status);
  }

  if (search) {
    records = records.filter(
      (r) => r.userName.toLowerCase().includes(search) || r.userTeam.toLowerCase().includes(search)
    );
  }

  const total = records.length;
  const startIndex = (page - 1) * limit;
  const paginated = records.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    success: true,
    records: paginated,
    pagination: { page, limit, total },
  });
}
