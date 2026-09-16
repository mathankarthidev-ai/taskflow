import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || 'user_anirudh_01';

    // 1. Verify active session exists
    const active = attendanceDb.getActiveByUser(userId);
    if (!active) {
      return NextResponse.json(
        {
          success: false,
          code: 'NO_ACTIVE_ATTENDANCE',
          message: 'No active clock-in session found.',
        },
        { status: 400 }
      );
    }

    // 2. Server-side timestamp for clock out
    const nowIso = new Date().toISOString();
    const clockInMs = new Date(active.clockIn).getTime();
    const clockOutMs = new Date(nowIso).getTime();
    const totalSeconds = Math.max(0, Math.floor((clockOutMs - clockInMs) / 1000));
    const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;

    const updated = attendanceDb.update(active.id, {
      clockOut: nowIso,
      status: 'completed',
      totalSeconds,
      totalHours,
    });

    if (updated) {
      attendanceDb.addAudit({
        id: `AUD-${Date.now()}`,
        attendanceId: updated.id,
        action: 'CLOCK_OUT',
        oldValue: active,
        newValue: updated,
        changedBy: userId,
        createdAt: nowIso,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Clocked out successfully',
      attendance: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
