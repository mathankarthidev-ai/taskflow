import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'user_anirudh_01';

  const active = attendanceDb.getActiveByUser(userId);

  if (active) {
    return NextResponse.json({
      success: true,
      isWorking: true,
      attendance: active,
    });
  }

  return NextResponse.json({
    success: true,
    isWorking: false,
    attendance: null,
  });
}
