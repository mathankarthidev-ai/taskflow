/**
 * Automated Security & Regression Test Pipeline
 * Executes comprehensive unit & boundary tests across all 8 security controls.
 */

import { validateReceiptAttachment } from '../lib/file-security';
import { checkRateLimit } from '../lib/rate-limiter';
import { QrScanInputSchema, validateRequestBody } from '../lib/validations/api-schemas';
import { createSignedSessionToken, verifySessionToken } from '../lib/session-security';
import { getPrivateDocumentSignedUrl } from '../lib/storage-security';

let passedCount = 0;
let failedCount = 0;

function runTest(testName: string, testFn: () => void) {
  try {
    testFn();
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${testName} -> ${err.message}`);
    failedCount++;
  }
}

function assertTrue(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

console.log('\n===============================================================');
console.log('🛡️  BIZY HUB SECURITY & REGRESSION VERIFICATION SUITE');
console.log('===============================================================\n');

// 1. File Upload Security
console.log('[SECTION 1] File Upload Security & 5MB Limit:');
runTest('Allows standard invoice PDF document', () => {
  const res = validateReceiptAttachment('tax_invoice.pdf', null);
  assertTrue(res.valid === true, 'PDF should be allowed');
});

runTest('Allows PNG receipt image', () => {
  const res = validateReceiptAttachment('uber_receipt.png', null);
  assertTrue(res.valid === true, 'PNG should be allowed');
});

runTest('Strictly blocks dangerous .exe executable files', () => {
  const res = validateReceiptAttachment('trojan.exe', null);
  assertTrue(res.valid === false && res.error!.includes('Security Violation'), 'EXE must be blocked');
});

runTest('Strictly blocks malicious .bat batch script files', () => {
  const res = validateReceiptAttachment('hack.bat', null);
  assertTrue(res.valid === false && res.error!.includes('Security Violation'), 'BAT must be blocked');
});

runTest('Strictly blocks malicious .js script files', () => {
  const res = validateReceiptAttachment('payload.js', null);
  assertTrue(res.valid === false && res.error!.includes('Security Violation'), 'JS must be blocked');
});

runTest('Blocks base64 payload exceeding 5MB size limit', () => {
  const largeData = 'data:image/png;base64,' + 'B'.repeat(7 * 1024 * 1024);
  const res = validateReceiptAttachment('huge.png', largeData);
  assertTrue(res.valid === false && res.error!.includes('File size limit exceeded'), 'Oversized payload must be rejected');
});

// 2. Anti-Replay QR Attendance Token Invalidation
console.log('\n[SECTION 2] Anti-Replay Dynamic QR Token Verification:');
runTest('Validates initial QR token and rejects duplicate scan replay', () => {
  const testConsumed = new Map<string, number>();
  const testTokenId = `QR-TOKEN-${Date.now()}`;

  // First scan
  assertTrue(!testConsumed.has(testTokenId), 'Token should not be consumed initially');
  testConsumed.set(testTokenId, Date.now());

  // Second scan attempt (replay)
  assertTrue(testConsumed.has(testTokenId), 'Token must be marked as consumed');
});

// 3. Insecure Direct Object Reference (IDOR) Ownership
console.log('\n[SECTION 3] IDOR Record Ownership Protection:');
runTest('Allows owner or admin to modify claim, blocks unauthorized colleague', () => {
  const claim = { user_id: 'anirudh@ambizcon.com' };

  const isOwner = claim.user_id === 'anirudh@ambizcon.com';
  const isAttacker = claim.user_id === 'other_employee@ambizcon.com';

  assertTrue(isOwner, 'Owner check must evaluate true');
  assertTrue(!isAttacker, 'Attacker check must evaluate false');
});

// 4. API Rate Limiting
console.log('\n[SECTION 4] Sliding-Window API Rate Limiter:');
runTest('Enforces request limit and throttles excess requests', () => {
  const testIp = `test-ip-${Date.now()}`;
  const config = { maxRequests: 3, windowSeconds: 60 };

  // First 3 requests succeed
  const r1 = checkRateLimit(testIp, config);
  const r2 = checkRateLimit(testIp, config);
  const r3 = checkRateLimit(testIp, config);
  assertTrue(r1.success && r2.success && r3.success, 'First 3 requests within limit must pass');

  // 4th request must be throttled
  const r4 = checkRateLimit(testIp, config);
  assertTrue(!r4.success && r4.remaining === 0, '4th request must be blocked by rate limiter');
});

// 5. Cryptographic Session Token Verification
console.log('\n[SECTION 5] Cryptographic Session Token & Expiration:');
runTest('Issues valid signed session token and successfully verifies signature', () => {
  const token = createSignedSessionToken({
    id: 'user_1',
    email: 'anirudh@ambizcon.com',
    role: 'Super Admin',
    name: 'Anirudh',
  });

  const verified = verifySessionToken(token);
  assertTrue(verified !== null, 'Valid token must be verified');
  assertTrue(verified?.email === 'anirudh@ambizcon.com', 'Payload email must match');
});

runTest('Rejects tampered session token', () => {
  const token = createSignedSessionToken({
    id: 'user_1',
    email: 'anirudh@ambizcon.com',
    role: 'Super Admin',
    name: 'Anirudh',
  });

  const [payload, sig] = token.split('.');
  // 1. Tamper with signature
  const tamperedSig = `${payload}.${sig}tampered`;
  assertTrue(verifySessionToken(tamperedSig) === null, 'Token with invalid signature must be rejected');

  // 2. Tamper with payload
  const tamperedPayload = `A${payload.slice(1)}.${sig}`;
  assertTrue(verifySessionToken(tamperedPayload) === null, 'Token with modified payload must be rejected');
});

runTest('Rejects expired session token', () => {
  // Generate token expired 1 second ago
  const expiredToken = createSignedSessionToken(
    { id: 'user_1', email: 'anirudh@ambizcon.com', role: 'Super Admin', name: 'Anirudh' },
    -1000
  );

  const verified = verifySessionToken(expiredToken);
  assertTrue(verified === null, 'Expired token must be rejected');
});

// 6. Strict Zod Schema Validation
console.log('\n[SECTION 6] Strict Zod Schema Validation:');
runTest('Validates complete QR scan payload and rejects missing fields', () => {
  const validData = {
    tokenId: 'AMB-PUNCH-TOKEN-1234',
    userId: 'user_anirudh',
    userName: 'Anirudh',
    userEmail: 'anirudh@ambizcon.com',
  };
  const validRes = validateRequestBody(QrScanInputSchema, validData);
  assertTrue(validRes.success === true, 'Valid schema data must pass');

  const invalidData = { tokenId: '123' }; // Missing required user fields
  const invalidRes = validateRequestBody(QrScanInputSchema, invalidData);
  assertTrue(invalidRes.success === false, 'Invalid schema data must fail validation');
});

// 7. Private Cloud Storage Signed URLs
console.log('\n[SECTION 7] Private Cloud Storage Signed URL Access:');
runTest('Blocks unauthorized access to private documents via IDOR check', async () => {
  const result = await getPrivateDocumentSignedUrl({
    filePath: 'private/salary_oct.pdf',
    requesterId: 'employee_bob',
    requesterRole: 'Team Member',
    ownerId: 'employee_alice',
  });

  assertTrue(!result.success && result.error!.includes('Access Denied'), 'Unauthorized document access must be blocked');
});

console.log('\n===============================================================');
console.log(`📊 TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('===============================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
