import { 
  hasMinimumRole, 
  isAdmin, 
  isModerator, 
  isSalesUser, 
  canManageBusiness, 
  ROLE_HIERARCHY 
} from '../lib/auth/roles';
import * as fs from 'fs';
import * as path from 'path';

function runPhase1Tests() {
  console.log('--- Running Phase 1 Foundation Verification Tests ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Role Hierarchy Tests
  assert(ROLE_HIERARCHY.superadmin > ROLE_HIERARCHY.admin, 'Superadmin rank must exceed admin rank');
  assert(ROLE_HIERARCHY.admin > ROLE_HIERARCHY.moderator, 'Admin rank must exceed moderator rank');
  assert(ROLE_HIERARCHY.moderator > ROLE_HIERARCHY.sales_agent, 'Moderator rank must exceed sales agent rank');
  assert(ROLE_HIERARCHY.business_owner > ROLE_HIERARCHY.customer, 'Business owner rank must exceed customer rank');
  assert(ROLE_HIERARCHY.customer > ROLE_HIERARCHY.guest, 'Customer rank must exceed guest rank');

  // 2. Permission Helper Tests
  assert(isAdmin('admin') && isAdmin('superadmin') && !isAdmin('customer') && !isAdmin('business_owner'), 'isAdmin correctly identifies admin & superadmin only');
  assert(isModerator('moderator') && isModerator('admin') && !isModerator('customer'), 'isModerator grants access to moderators and admins');
  assert(isSalesUser('sales_agent') && isSalesUser('sales_manager') && isSalesUser('admin') && !isSalesUser('customer'), 'isSalesUser validates sales team and admins');

  // 3. Business Management Authorization
  const mockOwnerContext = {
    userId: 'user-owner-1',
    email: 'owner@example.com',
    role: 'business_owner' as const,
    managedBusinessIds: ['biz-123'],
  };
  assert(canManageBusiness(mockOwnerContext, 'biz-123'), 'Owner can manage authorized business');
  assert(!canManageBusiness(mockOwnerContext, 'biz-456'), 'Owner cannot manage unauthorized business');

  const mockAdminContext = {
    userId: 'user-admin-1',
    email: 'admin@example.com',
    role: 'admin' as const,
    managedBusinessIds: [],
  };
  assert(canManageBusiness(mockAdminContext, 'biz-456'), 'Admin can manage any business');

  // 4. Schema Migration Files Existence
  const migrationDir = path.join(__dirname, '../supabase/migrations');
  assert(fs.existsSync(path.join(migrationDir, '20261010_001_initial_schema.sql')), 'Migration 001_initial_schema.sql exists on disk');
  assert(fs.existsSync(path.join(migrationDir, '20261010_002_rls_policies.sql')), 'Migration 002_rls_policies.sql exists on disk');
  assert(fs.existsSync(path.join(migrationDir, '20261010_003_seed_data.sql')), 'Migration 003_seed_data.sql exists on disk');

  // 5. Documentation Files Existence
  const docsDir = path.join(__dirname, '../docs');
  assert(fs.existsSync(path.join(docsDir, 'DECISIONS.md')), 'docs/DECISIONS.md exists on disk');
  assert(fs.existsSync(path.join(__dirname, '../PROGRESS.md')), 'PROGRESS.md exists on disk');

  // 6. SQL Content Verification
  const schemaSql = fs.readFileSync(path.join(migrationDir, '20261010_001_initial_schema.sql'), 'utf-8');
  assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.businesses'), 'businesses table defined in schema');
  assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.subscription_plans'), 'subscription_plans table defined in schema');
  assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.enquiries'), 'enquiries table defined in schema');
  assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.locations'), 'locations table defined in schema');

  const rlsSql = fs.readFileSync(path.join(migrationDir, '20261010_002_rls_policies.sql'), 'utf-8');
  assert(rlsSql.includes('ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on businesses');
  assert(rlsSql.includes('ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on enquiries');

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPhase1Tests();
