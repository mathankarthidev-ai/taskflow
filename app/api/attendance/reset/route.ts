import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';

export async function POST() {
  try {
    const records = attendanceDb.resetAll();
    return NextResponse.json({
      success: true,
      message: 'Attendance data reset: 10 days x 3 sessions per roster member restored.',
      totalRecords: records.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR', message: 'Failed to reset attendance data' },
      { status: 500 }
    );
  }
}
