import { NextResponse } from 'next/server';
import { attendanceDb, AttendanceRecord } from '@/lib/attendance-db';
import { supabase } from '@/lib/supabase';
import { formatTimeIST, formatTimeAEST, formatSessionDateIST } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || 'user_anirudh_01';
    const userName = body.userName || 'Anirudh K.';
    const userTeam = body.userTeam || 'Development';
    const userEmail = body.userEmail || '';
    const company = body.company || 'Ambizcon Health - India';
    const workMode = body.workMode || 'Work From Office';
    const ipAddress = body.ipAddress || '192.168.1.104';
    const location = body.location || 'Anna Nagar, Chennai';

    // 1. Prevent duplicate active session in in-memory store
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

    // 2. Format Server Timestamps accurately with IST and AEST timezones
    const nowIso = new Date().toISOString();
    const formattedIst = formatTimeIST(nowIso);
    const formattedAest = formatTimeAEST(nowIso);
    const sessionDate = formatSessionDateIST(nowIso);

    const recordId = `ATT-${Date.now()}`;
    const newRecord: AttendanceRecord = {
      id: recordId,
      userId,
      userName,
      userTeam,
      clockIn: nowIso,
      clockOut: null,
      status: 'working',
      totalSeconds: 0,
      totalHours: 0,
      workMode,
      ipAddress,
      location,
      geofenceVerified: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // In-memory fallback
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

    // Save directly to Supabase
    try {
      const { error } = await supabase.from('attendance').upsert({
        id: recordId,
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        user_team: userTeam,
        company,
        session_date: sessionDate,
        clock_in: formattedIst,
        clock_in_aest: formattedAest,
        clock_out: '—',
        clock_out_aest: '—',
        status: 'working',
        work_mode: workMode,
        ip_address: ipAddress,
        location,
        geofence_verified: true,
        worked_seconds: 0,
        worked_hours: '0h 00m',
        created_at: nowIso,
        updated_at: nowIso,
      });
      if (error) console.error('Supabase clock-in error:', error);
    } catch (dbErr) {
      console.warn('Supabase clock-in exception:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Clocked in successfully',
      attendance: newRecord,
      sessionDate,
      clockInTime: formattedIst,
      clockInAest: formattedAest,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
