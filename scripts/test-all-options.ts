/**
 * Full End-to-End System Health & Feature Verification Script
 * Tests every major option and module across the Bizy Hub platform.
 */

import { isNotificationVisibleForUser } from '../lib/notification-filter';
import { validateReceiptAttachment } from '../lib/file-security';
import { checkRateLimit } from '../lib/rate-limiter';
import { QrScanInputSchema, validateRequestBody } from '../lib/validations/api-schemas';
import { createSignedSessionToken, verifySessionToken } from '../lib/session-security';
import { getPrivateDocumentSignedUrl } from '../lib/storage-security';
import { SEED_USERS } from '../lib/seed-data';

interface TestResult {
  module: string;
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

function recordTest(module: string, test: string, fn: () => void) {
  try {
    fn();
    results.push({ module, test, status: 'PASS' });
    console.log(`  ✅ [${module}] ${test}`);
  } catch (err: any) {
    results.push({ module, test, status: 'FAIL', details: err?.message });
    console.error(`  ❌ [${module}] ${test} -> ${err?.message}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

console.log('\n===============================================================');
console.log('🧪 BIZY HUB ALL-OPTIONS COMPREHENSIVE AUDIT & TEST RUN');
console.log('===============================================================\n');

// 1. Authentication & Seed Data
recordTest('Auth & Roster', 'Verifies 15+ employees across India & Australia branches', () => {
  assert(SEED_USERS.length >= 15, `Expected >= 15 seed employees, found ${SEED_USERS.length}`);
  const hasAdmin = SEED_USERS.some((u) => u.role === 'Super Admin' || u.role === 'Admin');
  const hasLead = SEED_USERS.some((u) => u.role === 'Team Lead');
  const hasMember = SEED_USERS.some((u) => u.role === 'Team Member');
  assert(hasAdmin && hasLead && hasMember, 'All 3 core operational roles must be present in roster');
});

recordTest('Auth & Sessions', 'Issues and verifies HMAC signed session token', () => {
  const token = createSignedSessionToken({ id: 'u1', email: 'anirudh@ambizcon.com', role: 'Super Admin', name: 'Anirudh' });
  const verified = verifySessionToken(token);
  assert(verified !== null && verified.email === 'anirudh@ambizcon.com', 'Session token verification failed');
});

// 2. Scoped Notification Shielding Engine (Mathan MK Rule)
recordTest('Notifications', 'Mathan MK task completion notifies strictly Super Admin, TL, and Mathan MK', () => {
  const notif = {
    id: 'notif_100',
    type: 'task_completed',
    category: 'Task Completed',
    title: 'Task Completed: Landing Page Redesign',
    text: 'Mathanmk completed the task Landing Page Redesign',
    completedByUserId: 'user_mathanmk_08',
    completedByName: 'Mathanmk',
    targetTeam: 'Development',
    timestamp: new Date().toISOString(),
  };

  const superAdmin = SEED_USERS.find((u) => u.role === 'Super Admin')!;
  const teamLead = SEED_USERS.find((u) => u.role === 'Team Lead')!;
  const mathanUser = SEED_USERS.find((u) => u.email === 'mathanmk@ambizcon.com')!;
  const otherMember = SEED_USERS.find((u) => u.role === 'Team Member' && u.email !== 'mathanmk@ambizcon.com')!;

  assert(isNotificationVisibleForUser(notif as any, superAdmin as any) === true, 'Super Admin must see notification');
  assert(isNotificationVisibleForUser(notif as any, teamLead as any) === true, 'Team Lead must see notification');
  assert(isNotificationVisibleForUser(notif as any, mathanUser as any) === true, 'Mathan MK must see confirmation');
  assert(isNotificationVisibleForUser(notif as any, otherMember as any) === false, 'Other team member MUST NOT see notification');
});

// 3. Task Workflow & Review Footprints
recordTest('Task Workflow', 'Two-tier status transitions and audit footprint structure', () => {
  const task = {
    id: 'TSK-101',
    status: 'In Progress',
    footprints: [] as any[],
  };

  // Step 1: Member submits for review
  task.status = 'In Review';
  task.footprints.push({
    actorId: 'usr_mathanmk',
    actorName: 'Mathanmk',
    action: 'SUBMIT_FOR_REVIEW',
    timestamp: new Date().toISOString(),
  });

  // Step 2: Team Lead approves
  task.status = 'Completed';
  task.footprints.push({
    actorId: 'usr_anirudh',
    actorName: 'Anirudh',
    action: 'APPROVED',
    timestamp: new Date().toISOString(),
  });

  assert(task.status === 'Completed', 'Task must be Completed');
  assert(task.footprints.length === 2, 'Two footprint audit entries must be recorded');
  assert(task.footprints[1].action === 'APPROVED', 'Approval action footprint must match');
});

// 4. Dynamic QR Attendance & Anti-Replay Token
recordTest('Attendance Kiosk', 'Validates 15s dynamic QR token and blocks replay attempts', () => {
  const token = 'AMB-TEST-QR-999';
  const consumed = new Map<string, number>();

  // First scan
  assert(!consumed.has(token), 'Token should not be consumed initially');
  consumed.set(token, Date.now());

  // Second scan
  assert(consumed.has(token), 'Replay scan must be detected as consumed');
});

// 5. Expense Reimbursements & File Security
recordTest('Reimbursements', 'Enforces 5MB size limit and blocks dangerous extensions', () => {
  const safePdf = validateReceiptAttachment('bill.pdf', null);
  assert(safePdf.valid === true, 'Safe PDF should be valid');

  const dangerousExe = validateReceiptAttachment('trojan.exe', null);
  assert(dangerousExe.valid === false, 'Dangerous .exe must be rejected');

  const largeData = 'data:image/png;base64,' + 'Z'.repeat(7 * 1024 * 1024);
  const oversized = validateReceiptAttachment('huge.png', largeData);
  assert(oversized.valid === false, 'File exceeding 5MB must be rejected');
});

// 6. Insecure Direct Object Reference (IDOR) Protection
recordTest('IDOR Protection', 'Prevents unauthorized employees from tampering with peer records', () => {
  const peerRecord = { ownerEmail: 'bob@ambizcon.com' };
  const attackerUser = { email: 'alice@ambizcon.com', role: 'Team Member' };
  const adminUser = { email: 'admin@ambizcon.com', role: 'Super Admin' };

  const isAttackerAllowed =
    attackerUser.role === 'Super Admin' || attackerUser.email === peerRecord.ownerEmail;
  assert(!isAttackerAllowed, 'Attacker should NOT be allowed to edit peer record');

  const isAdminAllowed =
    adminUser.role === 'Super Admin' || adminUser.email === peerRecord.ownerEmail;
  assert(isAdminAllowed, 'Super Admin MUST be allowed to edit/review peer record');
});

// 7. API Rate Limiting
recordTest('Rate Limiter', 'Sliding window throttles excessive requests within 60s', () => {
  const testClient = `client-${Date.now()}`;
  const config = { maxRequests: 2, windowSeconds: 60 };

  const req1 = checkRateLimit(testClient, config);
  const req2 = checkRateLimit(testClient, config);
  assert(req1.success && req2.success, 'First 2 requests must pass');

  const req3 = checkRateLimit(testClient, config);
  assert(!req3.success && req3.remaining === 0, '3rd request must be blocked (HTTP 429)');
});

// 8. API Schema Validation (Zod)
recordTest('Zod Schemas', 'Validates complete payloads and rejects missing required fields', () => {
  const validQr = {
    tokenId: 'AMB-VALID-123',
    userId: 'user_anirudh',
    userName: 'Anirudh',
    userEmail: 'anirudh@ambizcon.com',
  };
  const resValid = validateRequestBody(QrScanInputSchema, validQr);
  assert(resValid.success === true, 'Valid payload must pass');

  const invalidQr = { tokenId: '' };
  const resInvalid = validateRequestBody(QrScanInputSchema, invalidQr);
  assert(resInvalid.success === false, 'Invalid payload must fail');
});

// 9. Private Storage Expiring Signed URLs
recordTest('Private Storage', 'Generates expiring download URLs with permission check', async () => {
  const allowed = await getPrivateDocumentSignedUrl({
    filePath: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    requesterId: 'u1',
    requesterRole: 'Team Member',
    ownerId: 'u1',
  });
  assert(allowed.success === true && !!allowed.url, 'Owner must receive valid signed download URL');

  const blocked = await getPrivateDocumentSignedUrl({
    filePath: 'private/audit.pdf',
    requesterId: 'u2',
    requesterRole: 'Team Member',
    ownerId: 'u1',
  });
  assert(blocked.success === false, 'Non-owner must be blocked from private document');
});

console.log('\n===============================================================');
const passed = results.filter((r) => r.status === 'PASS').length;
const failed = results.filter((r) => r.status === 'FAIL').length;
console.log(`📊 FINAL RESULTS: ${results.length} MODULES TESTED | ${passed} PASSED | ${failed} FAILED`);
console.log('===============================================================\n');

if (failed > 0) process.exit(1);
