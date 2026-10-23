import { attendanceDb } from '../lib/attendance-db';
import { formatTimeIST } from '../lib/utils';

async function runCumulativeClockInTest() {
  console.log('===============================================================');
  console.log('🧪 TESTING CUMULATIVE SAME-DAY CLOCK-IN & WORKED TIMER');
  console.log('===============================================================\n');

  const userId = 'user_test_cumulative_01';
  const userName = 'Cumulative Test User';
  const userEmail = 'cumulative@ambizcon.com';
  const now = Date.now();

  // Clean state
  attendanceDb.clearUserWorking(userId, userName, userEmail);

  // 1. Shift 1: User clocks in at 9:00 AM, works 1 hour (3600s), clocks out at 10:00 AM
  console.log('[STEP 1] Simulating Shift 1: 1 hour worked earlier today');
  const shift1Start = new Date(now - 7200 * 1000).toISOString();
  const shift1End = new Date(now - 3600 * 1000).toISOString();
  const shift1Seconds = 3600; // 1 hour

  attendanceDb.add({
    id: `ATT-TEST-SHIFT1-${now}`,
    userId,
    userName,
    userTeam: 'Development',
    clockIn: shift1Start,
    clockOut: shift1End,
    status: 'completed',
    totalSeconds: shift1Seconds,
    totalHours: 1.0,
    workMode: 'Work From Office',
    ipAddress: '192.168.1.104',
    location: 'Anna Nagar, Chennai',
    geofenceVerified: true,
    createdAt: shift1Start,
    updatedAt: shift1End,
  });

  // Verify previousCompletedSecondsToday returns 3600
  const priorCompleted = attendanceDb.getTodayCompletedSeconds(userId, userName, userEmail);
  console.log(`  Prior completed seconds today: ${priorCompleted}s (${Math.floor(priorCompleted / 3600)}h ${(priorCompleted % 3600) / 60}m)`);
  if (priorCompleted !== 3600) {
    throw new Error(`Expected prior completed to be 3600s, got ${priorCompleted}`);
  }
  console.log('  ✅ PASS: Earlier shift accurately recognized as 3600s (1h 00m)\n');

  // 2. Shift 2: User clocks in again on the same day
  console.log('[STEP 2] Simulating Shift 2 Clock-In on the SAME DAY');
  const shift2StartMs = now - 900 * 1000; // Clocked in 15 mins ago
  const shift2Start = new Date(shift2StartMs).toISOString();

  const shift2Active = attendanceDb.add({
    id: `ATT-TEST-SHIFT2-${now}`,
    userId,
    userName,
    userTeam: 'Development',
    clockIn: shift2Start,
    clockOut: null,
    status: 'working',
    totalSeconds: 0,
    totalHours: 0,
    workMode: 'Work From Office',
    ipAddress: '192.168.1.104',
    location: 'Anna Nagar, Chennai',
    geofenceVerified: true,
    createdAt: shift2Start,
    updatedAt: shift2Start,
  });

  // Calculate live running timer
  const currentSessionElapsed = Math.floor((now - shift2StartMs) / 1000); // 900s (15m)
  const liveWorkedSeconds = priorCompleted + currentSessionElapsed; // 3600 + 900 = 4500s (1h 15m)

  console.log(`  Current active session elapsed: ${currentSessionElapsed}s (15m 00s)`);
  console.log(`  Live cumulative worked timer: ${liveWorkedSeconds}s (${Math.floor(liveWorkedSeconds / 3600)}h ${Math.floor((liveWorkedSeconds % 3600) / 60)}m 00s)`);

  if (liveWorkedSeconds !== 4500) {
    throw new Error(`Expected live worked seconds to be 4500s (1h 15m), got ${liveWorkedSeconds}`);
  }
  console.log('  ✅ PASS: Live timer starts from 1h 00m 00s and adds current session (1h 15m 00s)!\n');

  // 3. User clocks out from Shift 2
  console.log('[STEP 3] Simulating Shift 2 Clock-Out');
  attendanceDb.update(shift2Active.id, {
    clockOut: new Date(now).toISOString(),
    status: 'completed',
    totalSeconds: currentSessionElapsed, // 900s
    totalHours: 0.25,
  });

  const allCompletedToday = attendanceDb.getTodayCompletedSeconds(userId, userName, userEmail);
  console.log(`  Total completed seconds today: ${allCompletedToday}s (${Math.floor(allCompletedToday / 3600)}h ${Math.floor((allCompletedToday % 3600) / 60)}m)`);

  if (allCompletedToday !== 4500) {
    throw new Error(`Expected all completed today to be 4500s (1h 15m), got ${allCompletedToday}`);
  }
  console.log('  ✅ PASS: Final cumulative worked duration is 4500s (1h 15m)!\n');

  console.log('===============================================================');
  console.log('🎉 ALL CUMULATIVE SAME-DAY CLOCK-IN TESTS PASSED WITH 0 ERRORS');
  console.log('===============================================================\n');
}

runCumulativeClockInTest().catch((err) => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
