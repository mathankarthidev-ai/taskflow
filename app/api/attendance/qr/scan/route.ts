import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';
import { supabase } from '@/lib/supabase';
import { formatTimeIST, formatTimeAEST, formatSessionDateIST } from '@/lib/utils';
import { SEED_USERS } from '@/lib/seed-data';

import { logSecurityEvent } from '@/lib/audit-logger';

// Anti-Replay Token Cache: Stores consumed dynamic QR tokens with timestamp
const consumedTokens = new Map<string, number>();

// Periodic cleanup of consumed tokens older than 60 seconds
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, timestamp] of consumedTokens.entries()) {
    if (now - timestamp > 60000) {
      consumedTokens.delete(token);
    }
  }
}

export async function POST(req: Request) {
  try {
    cleanupExpiredTokens();
    const body = await req.json().catch(() => ({}));
    const { tokenId, userId, userName, userTeam, branch, expiresAt } = body;

    if (!userId || !userName) {
      return NextResponse.json(
        { success: false, message: 'Missing employee identification details' },
        { status: 400 }
      );
    }

    // Security Check: One-Time Token Invalidation (Anti-Replay Protection)
    if (tokenId) {
      if (consumedTokens.has(tokenId)) {
        await logSecurityEvent({
          eventType: 'QR_REPLAY_ATTEMPT',
          actorId: userId,
          actorEmail: body.userEmail,
          status: 'BLOCKED',
          details: { tokenId, userName, branch },
        });

        return NextResponse.json(
          {
            success: false,
            message: 'Security Alert: This QR code has already been scanned. Please wait for the dynamic QR code to refresh.',
          },
          { status: 400 }
        );
      }
      // Register token as consumed immediately
      consumedTokens.set(tokenId, Date.now());
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

    const normEmail = (body.userEmail || userId || '').toLowerCase().trim();
    const seedUser = SEED_USERS.find(
      (u) =>
        (normEmail && u.email.toLowerCase() === normEmail) ||
        u.name.toLowerCase() === userName.toLowerCase()
    );
    const isSuperAdminUser = seedUser?.role === 'Super Admin' || seedUser?.role === 'Admin';
    const registeredCompany = seedUser?.company;

    let company = isAus ? 'Ambizcon' : 'Ambizcon Health - India';
    if (!isSuperAdminUser && registeredCompany && registeredCompany !== 'India & Australia') {
      company = registeredCompany;
    }

    const active = attendanceDb.getActiveByUser(userId, userName, body.userEmail);

    // Query Supabase Cloud to see if employee is currently clocked in
    let supaActiveRecord: any = null;
    try {
      const { data: supaActive } = await supabase
        .from('attendance')
        .select('*')
        .or(`user_id.eq.${userId},user_name.ilike.%${userName}%,user_email.eq.${body.userEmail || userId}`)
        .eq('status', 'working')
        .order('created_at', { ascending: false });

      if (supaActive && supaActive.length > 0) {
        supaActiveRecord = supaActive[0];
      }
    } catch (checkErr) {
      console.warn('QR scan active check warning:', checkErr);
    }

    // Only treat as working if Supabase Cloud confirms an active shift is in progress
    const isAlreadyWorking = !!supaActiveRecord;

    if (!isAlreadyWorking) {
      // If Supabase confirms shift is completed, clear any stale in-memory residue
      attendanceDb.clearUserWorking(userId, userName, body.userEmail);
    }

    if (isAlreadyWorking) {
      // Punch Out / Close Shift
      const activeIn = supaActiveRecord?.created_at || active?.clockIn || nowIso;
      const clockInMs = new Date(activeIn).getTime();
      const clockOutMs = new Date(nowIso).getTime();
      const totalSeconds = Math.max(0, Math.floor((clockOutMs - clockInMs) / 1000));
      const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;
      const formattedIst = formatTimeIST(nowIso);
      const formattedAest = formatTimeAEST(nowIso);
      const workedHoursStr = `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`;

      if (active) {
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
      }

      // Update in Supabase - Close ALL working shifts for this user to prevent any duplicate active shifts
      try {
        await supabase
          .from('attendance')
          .update({
            clock_out: isAus ? formattedAest : formattedIst,
            clock_out_aest: formattedAest,
            status: 'completed',
            worked_seconds: totalSeconds,
            worked_hours: workedHoursStr,
            updated_at: nowIso,
          })
          .or(`user_id.eq.${userId},user_name.ilike.%${userName}%,user_email.eq.${body.userEmail || userId}`)
          .eq('status', 'working');
      } catch (dbErr) {
        console.warn('QR clock-out sync warning:', dbErr);
      }

      return NextResponse.json({
        success: true,
        action: 'PUNCH_OUT',
        message: `${userName} clocked out successfully via QR Kiosk! Shift completed.`,
        punch: {
          userName,
          userTeam: userTeam || supaActiveRecord?.user_team || active?.userTeam || 'General',
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
      const recordId = `ATT-QR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newAttendance = attendanceDb.add({
        id: recordId,
        userId,
        userName,
        userTeam: userTeam || 'General',
        company,
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
          company,
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
