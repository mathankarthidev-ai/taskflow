import { NextResponse } from 'next/server';
import { attendanceDb, AttendanceRecord } from '@/lib/attendance-db';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || 'user_anirudh_01';
    const userName = body.userName || 'Anirudh K.';
    const userTeam = body.userTeam || 'Development';
    const workMode = body.workMode || 'Work From Office';

    // 1. Prevent duplicate clock-in
    const active = attendanceDb.getActiveByUser(userId);
    if (active) {
      return NextResponse.json(
        {
          success: false,
          code: 'ATTENDANCE_ALREADY_ACTIVE',
          message: 'You are already clocked in.',
        },
        { status: 409 }
      );
    }

    // 2. Use server timestamp
    const nowIso = new Date().toISOString();
    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      userId,
      userName,
      userTeam,
      clockIn: nowIso,
      clockOut: null,
      status: 'working',
      totalSeconds: 0,
      totalHours: 0,
      workMode,
      ipAddress: '192.168.1.104',
      location: 'Anna Nagar, Chennai',
      geofenceVerified: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    attendanceDb.add(newRecord);
    attendanceDb.addAudit({
      id: `AUD-${Date.now()}`,
      attendanceId: newRecord.id,
      action: 'CLOCK_IN',
      oldValue: null,
      newValue: newRecord,
      changedBy: userId,
      createdAt: nowIso,
    });

    return NextResponse.json({
      success: true,
      message: 'Clocked in successfully',
      attendance: newRecord,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
