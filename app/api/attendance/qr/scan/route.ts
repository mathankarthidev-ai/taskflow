import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';
import { supabase } from '@/lib/supabase';
import { formatTimeIST, formatTimeAEST, formatSessionDateIST } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { tokenId, userId, userName, userTeam, branch, expiresAt } = body;

    if (!userId || !userName) {
      return NextResponse.json(
        { success: false, message: 'Missing employee identification details' },
        { status: 400 }
      );
    }

    // Validate token expiration if provided
    if (expiresAt && Date.now() > expiresAt + 3000) {
      // 3 second grace period for network latency
      return NextResponse.json(
        { success: false, message: 'QR Code expired. Please scan the refreshed QR code.' },
        { status: 400 }
      );
    }

    const isAus = branch?.includes('Australia');
    const ip = isAus ? '103.246.40.112' : '192.168.1.104';
    const location = isAus ? 'Queen Street, Brisbane CBD, Australia' : 'Anna Nagar, Chennai';
    const nowIso = new Date().toISOString();

    const active = attendanceDb.getActiveByUser(userId);

    if (active) {
      // Punch Out / Close Shift
      const clockInMs = new Date(active.clockIn).getTime();
      const clockOutMs = new Date(nowIso).getTime();
      const totalSeconds = Math.max(0, Math.floor((clockOutMs - clockInMs) / 1000));
      const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;
      const formattedIst = formatTimeIST(nowIso);
      const formattedAest = formatTimeAEST(nowIso);
      const workedHoursStr = `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`;

      const updated = attendanceDb.update(active.id, {
        clockOut: nowIso,
        status: 'completed',
        totalSeconds,
        totalHours,
      });

      attendanceDb.addAudit({
        id: `AUD-QR-${Date.now()}`,
        attendanceId: active.id,
        action: 'CLOCK_OUT',
        oldValue: active,
        newValue: updated,
        changedBy: `QR_KIOSK_${userName}`,
        createdAt: nowIso,
      });

      // Update in Supabase
      try {
        const { data: supaActive } = await supabase
          .from('attendance')
          .select('*')
          .or(`user_id.eq.${userId},user_name.ilike.%${userName}%`)
          .eq('status', 'working')
          .order('created_at', { ascending: false })
          .limit(1);

        if (supaActive && supaActive.length > 0) {
          await supabase.from('attendance').update({
            clock_out: isAus ? formattedAest : formattedIst,
            clock_out_aest: formattedAest,
            status: 'completed',
            worked_seconds: totalSeconds,
            worked_hours: workedHoursStr,
            updated_at: nowIso,
          }).eq('id', supaActive[0].id);
        }
      } catch (dbErr) {
        console.warn('QR clock-out sync warning:', dbErr);
      }

      return NextResponse.json({
        success: true,
        action: 'PUNCH_OUT',
        message: `${userName} clocked out successfully via QR Kiosk!`,
        punch: {
          userName,
          userTeam: userTeam || active.userTeam,
          type: 'Clock Out',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
          totalHours,
          location,
          ip,
        },
      });
    } else {
      // Punch In / Start Shift
      const formattedIst = formatTimeIST(nowIso);
      const formattedAest = formatTimeAEST(nowIso);
      const sessionDate = formatSessionDateIST(nowIso);
      const recordId = `ATT-QR-${Date.now()}-${String(userId).replace(/[^a-zA-Z0-9]/g, '')}`;

      const newAttendance = attendanceDb.add({
        id: recordId,
        userId,
        userName,
        userTeam: userTeam || 'General',
        company: isAus ? 'Ambizcon - Australia' : 'Ambizcon Health - India',
        sessionName: 'QR Kiosk Shift',
        clockIn: nowIso,
        clockOut: null,
        status: 'working',
        totalSeconds: 0,
        totalHours: 0,
        workMode: 'Work From Office',
        ipAddress: ip,
        location,
        geofenceVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      attendanceDb.addAudit({
        id: `AUD-QR-${Date.now()}`,
        attendanceId: newAttendance.id,
        action: 'CLOCK_IN',
        oldValue: null,
        newValue: newAttendance,
        changedBy: `QR_KIOSK_${userName}`,
        createdAt: nowIso,
      });

      // Insert into Supabase
      try {
        await supabase.from('attendance').upsert({
          id: recordId,
          user_id: userId,
          user_name: userName,
          user_email: body.userEmail || (String(userId).includes('@') ? userId : undefined),
          user_team: userTeam || 'General',
          company: isAus ? 'Ambizcon - Australia' : 'Ambizcon Health - India',
          session_date: sessionDate,
          clock_in: isAus ? formattedAest : formattedIst,
          clock_in_aest: formattedAest,
          clock_out: '—',
          clock_out_aest: '—',
          status: 'working',
          work_mode: 'Work From Office',
          ip_address: ip,
          location,
          geofence_verified: true,
          worked_seconds: 0,
          worked_hours: '0h 00m',
          created_at: nowIso,
          updated_at: nowIso,
        });
      } catch (dbErr) {
        console.warn('QR clock-in sync warning:', dbErr);
      }

      return NextResponse.json({
        success: true,
        action: 'PUNCH_IN',
        message: `${userName} marked present and clocked in via QR Kiosk!`,
        punch: {
          userName,
          userTeam: userTeam || newAttendance.userTeam,
          type: 'Clock In',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
          location,
          ip,
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error processing QR punch' },
      { status: 500 }
    );
  }
}
