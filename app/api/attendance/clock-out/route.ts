import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';
import { supabase } from '@/lib/supabase';
import { formatTimeIST, formatTimeAEST } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || 'user_anirudh_01';
    const userName = body.userName || body.name || userId;
    const userTeam = body.userTeam || body.team || 'General';
    const userEmail = (body.userEmail || body.email || '').toLowerCase().trim();

    const nowIso = new Date().toISOString();
    const formattedIst = formatTimeIST(nowIso);
    const formattedAest = formatTimeAEST(nowIso);
    const clockOutMs = new Date(nowIso).getTime();

    // 1. Supabase Cloud lookup for active working shift (Single Source of Truth)
    const orClauses = [`user_id.eq.${userId}`, `user_name.ilike.%${userName}%`];
    if (userEmail) {
      orClauses.push(`user_email.eq.${userEmail}`);
    }

    let supaActive: any = null;
    try {
      const { data: supaList } = await supabase
        .from('attendance')
        .select('*')
        .or(orClauses.join(','))
        .eq('status', 'working')
        .order('created_at', { ascending: false })
        .limit(1);

      if (supaList && supaList.length > 0) {
        supaActive = supaList[0];
      }
    } catch (supaErr) {
      console.warn('Supabase active shift lookup error:', supaErr);
    }

    // In-memory fallback
    let memActive = attendanceDb.getActiveByUser(userId, userName, userEmail);

    // Determine the true clock-in millisecond timestamp
    let clockInMs: number = 0;
    if (supaActive?.created_at && !isNaN(new Date(supaActive.created_at).getTime())) {
      clockInMs = new Date(supaActive.created_at).getTime();
    } else if (typeof body.clockInTimestamp === 'number' && body.clockInTimestamp > 0) {
      clockInMs = body.clockInTimestamp;
    } else if (memActive?.clockIn && !isNaN(new Date(memActive.clockIn).getTime())) {
      clockInMs = new Date(memActive.clockIn).getTime();
    } else if (supaActive?.clock_in) {
      // Parse e.g. "08:35 am IST"
      const match = supaActive.clock_in.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const ampm = match[3].toLowerCase();
        if (ampm === 'pm' && h < 12) h += 12;
        if (ampm === 'am' && h === 12) h = 0;
        const inDate = new Date(supaActive.created_at || nowIso);
        clockInMs = new Date(inDate.getFullYear(), inDate.getMonth(), inDate.getDate(), h, m, 0).getTime();
      }
    }

    // If clock-in could not be found anywhere, fallback to 1 hour ago
    if (!clockInMs || clockInMs > clockOutMs) {
      clockInMs = clockOutMs - 3600 * 1000;
    }

    const totalSeconds = Math.max(60, Math.floor((clockOutMs - clockInMs) / 1000));
    const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const workedHoursStr = `${hours}h ${String(mins).padStart(2, '0')}m`;

    const activeInIso = new Date(clockInMs).toISOString();

    // 2. In-memory update
    let active = memActive;
    if (!active) {
      active = attendanceDb.add({
        id: supaActive?.id || `ATT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        userId,
        userName,
        userTeam,
        sessionName: 'Current Shift',
        clockIn: activeInIso,
        clockOut: null,
        status: 'working',
        totalSeconds: 0,
        totalHours: 0,
        workMode: supaActive?.work_mode || 'Work From Office',
        ipAddress: '192.168.1.104',
        location: 'Anna Nagar, Chennai',
        geofenceVerified: true,
        createdAt: activeInIso,
        updatedAt: activeInIso,
      });
    }

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

    // Clear any working shift residue for this user in memory
    attendanceDb.clearUserWorking(userId, userName, userEmail);

    // 3. Supabase Cloud update
    let todayTotalSeconds = totalSeconds;
    try {
      if (supaActive?.id) {
        await supabase
          .from('attendance')
          .update({
            clock_out: formattedIst,
            clock_out_aest: formattedAest,
            status: 'completed',
            worked_seconds: totalSeconds,
            worked_hours: workedHoursStr,
            updated_at: nowIso,
          })
          .eq('id', supaActive.id);
      } else {
        await supabase
          .from('attendance')
          .update({
            clock_out: formattedIst,
            clock_out_aest: formattedAest,
            status: 'completed',
            worked_seconds: totalSeconds,
            worked_hours: workedHoursStr,
            updated_at: nowIso,
          })
          .or(orClauses.join(','))
          .eq('status', 'working');
      }

      // Calculate total cumulative worked seconds across all shifts completed today
      const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const { data: allDayRecs } = await supabase
        .from('attendance')
        .select('*')
        .or(orClauses.join(','))
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (allDayRecs && allDayRecs.length > 0) {
        todayTotalSeconds = allDayRecs
          .filter((r) => {
            if (r.created_at) {
              const recIST = new Date(r.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
              return recIST === todayIST;
            }
            return false;
          })
          .reduce((sum, r) => sum + (r.worked_seconds || 0), 0);
      }
    } catch (dbErr) {
      console.warn('Supabase clock-out exception:', dbErr);
    }

    const todayH = Math.floor(todayTotalSeconds / 3600);
    const todayM = Math.floor((todayTotalSeconds % 3600) / 60);
    const todayTotalHoursStr = `${todayH}h ${String(todayM).padStart(2, '0')}m`;

    return NextResponse.json({
      success: true,
      message: 'Clocked out successfully',
      attendance: updated,
      clockOutTime: formattedIst,
      clockOutAest: formattedAest,
      sessionSeconds: totalSeconds,
      sessionHours: workedHoursStr,
      todayTotalSeconds,
      todayTotalHours: todayTotalHoursStr,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
