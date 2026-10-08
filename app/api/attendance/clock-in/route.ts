import { NextResponse } from 'next/server';
import { attendanceDb, AttendanceRecord } from '@/lib/attendance-db';
import { supabase } from '@/lib/supabase';
import { formatTimeIST, formatTimeAEST, formatSessionDateIST } from '@/lib/utils';
import { SEED_USERS } from '@/lib/seed-data';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || 'user_anirudh_01';
    const userName = body.userName || 'Anirudh K.';
    const userTeam = body.userTeam || 'Development';
    const userEmail = body.userEmail || '';
    const companyInput = body.company || 'Ambizcon Health - India';
    const workMode = body.workMode || 'Work From Office';
    const ipAddress = body.ipAddress || '192.168.1.104';
    const location = body.location || 'Anna Nagar, Chennai';

    const normEmail = (userEmail || '').toLowerCase().trim();
    const seedUser = SEED_USERS.find(
      (u) =>
        (normEmail && u.email.toLowerCase() === normEmail) ||
        u.name.toLowerCase() === userName.toLowerCase()
    );
    const isSuperAdminUser = seedUser?.role === 'Super Admin' || seedUser?.role === 'Admin';
    const registeredCompany = seedUser?.company;

    let company = companyInput;
    if (!isSuperAdminUser && registeredCompany && registeredCompany !== 'India & Australia') {
      company = registeredCompany;
    }

    // 1. Prevent duplicate active session: Check Supabase Cloud as Single Source of Truth
    let supaActiveRecord: any = null;
    try {
      const { data: supaActive } = await supabase
        .from('attendance')
        .select('*')
        .or(`user_id.eq.${userId},user_name.ilike.%${userName}%,user_email.eq.${userEmail || 'none'}`)
        .eq('status', 'working')
        .order('created_at', { ascending: false });

      if (supaActive && supaActive.length > 0) {
        supaActiveRecord = supaActive[0];
      }
    } catch (checkErr) {
      console.warn('Supabase active check warning:', checkErr);
    }

    if (supaActiveRecord) {
      return NextResponse.json(
        {
          success: false,
          code: 'ATTENDANCE_ALREADY_ACTIVE',
          message: `${userName} already has an active shift in progress (${supaActiveRecord.clock_in || supaActiveRecord.created_at}). Please clock out before starting a new shift.`,
          attendance: supaActiveRecord,
        },
        { status: 409 }
      );
    }

    // Supabase confirms NO active shift exists: Clear any stale in-memory working shift residue
    attendanceDb.clearUserWorking(userId, userName, userEmail);

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
