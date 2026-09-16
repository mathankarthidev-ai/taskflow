import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const changedBy = body.updatedBy || 'Super Admin';

    const existing = attendanceDb.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, code: 'ATTENDANCE_NOT_FOUND', message: 'Attendance record not found.' },
        { status: 404 }
      );
    }

    const updates: any = {};
    if (body.clockIn) updates.clockIn = body.clockIn;
    if (body.clockOut) updates.clockOut = body.clockOut;
    if (body.status) updates.status = body.status;

    if (body.clockIn && body.clockOut) {
      const inMs = new Date(body.clockIn).getTime();
      const outMs = new Date(body.clockOut).getTime();
      if (outMs < inMs) {
        return NextResponse.json(
          { success: false, code: 'VALIDATION_ERROR', message: 'clock_in must be before clock_out' },
          { status: 400 }
        );
      }
      updates.totalSeconds = Math.max(0, Math.floor((outMs - inMs) / 1000));
      updates.totalHours = Math.round((updates.totalSeconds / 3600) * 100) / 100;
    }

    const updated = attendanceDb.update(id, updates);

    // Record audit log
    attendanceDb.addAudit({
      id: `AUD-${Date.now()}`,
      attendanceId: id,
      action: 'ADMIN_EDIT',
      oldValue: existing,
      newValue: updated,
      changedBy,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance record updated successfully by Admin',
      attendance: updated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Internal Server Error' }, { status: 500 });
  }
}
