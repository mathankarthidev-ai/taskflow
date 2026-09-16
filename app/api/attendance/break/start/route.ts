import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || 'user_anirudh_01';
    const breakType = body.breakType || 'Lunch';

    const active = attendanceDb.getActiveByUser(userId);
    if (!active) {
      return NextResponse.json(
        { success: false, code: 'NO_ACTIVE_ATTENDANCE', message: 'You must clock in before starting a break!' },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const breakRec = attendanceDb.addBreak({
      id: `BRK-${Date.now()}`,
      attendanceId: active.id,
      userId,
      breakType,
      breakStart: nowIso,
      breakEnd: null,
      durationSeconds: 0,
      createdAt: nowIso,
    });

    return NextResponse.json({
      success: true,
      message: `Started ${breakType} break!`,
      break: breakRec,
    });
  } catch (error) {
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Internal Server Error' }, { status: 500 });
  }
}
