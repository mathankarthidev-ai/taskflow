import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || 'user_anirudh_01';
    const userName = body.userName || userId;
    const userTeam = body.userTeam || 'General';

    const nowIso = new Date().toISOString();
    const d = new Date();
    const formattedIst = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST';
    const aestDate = new Date(d.getTime() + 4.5 * 3600 * 1000);
    const formattedAest = aestDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' AEST';

    // 1. In-memory update
    let active = attendanceDb.getActiveByUser(userId);
    if (!active) {
      const fallbackIn = new Date(Date.now() - 3600 * 1000).toISOString();
      active = attendanceDb.add({
        id: `ATT-${Date.now()}-${String(userId).replace(/[^a-zA-Z0-9]/g, '')}`,
        userId,
        userName,
        userTeam,
        sessionName: 'Current Shift',
        clockIn: fallbackIn,
        clockOut: null,
        status: 'working',
        totalSeconds: 0,
        totalHours: 0,
        workMode: 'Work From Office',
        ipAddress: '192.168.1.104',
        location: 'Anna Nagar, Chennai',
        geofenceVerified: true,
        createdAt: fallbackIn,
        updatedAt: fallbackIn,
      });
    }

    const clockInMs = new Date(active.clockIn).getTime();
    const clockOutMs = new Date(nowIso).getTime();
    const totalSeconds = Math.max(0, Math.floor((clockOutMs - clockInMs) / 1000));
    const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;
    const workedHoursStr = `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`;

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

    // 2. Supabase Cloud update
    try {
      // Find latest working record in Supabase
      const { data: latestRecords } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'working')
        .order('created_at', { ascending: false })
        .limit(1);

      if (latestRecords && latestRecords.length > 0) {
        const recordId = latestRecords[0].id;
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
          .eq('id', recordId);
      }
    } catch (dbErr) {
      console.warn('Supabase clock-out exception:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Clocked out successfully',
      attendance: updated,
      clockOutTime: formattedIst,
      clockOutAest: formattedAest,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
