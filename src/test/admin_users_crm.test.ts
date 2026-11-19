import { describe, it, expect } from 'vitest';
import {
  assertCanMutateUserAccount,
  classifyUserSegment,
  computeAdminUserCounts,
  filterAdminUsers,
  formatAdminUsersCsv,
  getExpectedDeleteConfirmationToken,
  isLikelyTestOrAliasEmail,
  matchesDeleteConfirmation,
  type AdminUserDirectoryEntry,
} from '@/lib/adminUsers';

describe('Admin User Directory / Basic CRM Invariants', () => {
  it('accurately detects test, QA, synthetic, plus-alias, and timestamped handles', () => {
    expect(isLikelyTestOrAliasEmail('nareshmepani+202601201541@hotmail.com')).toBe(true);
    expect(isLikelyTestOrAliasEmail('nareshmepani202601201725@hotmail.com')).toBe(true);
    expect(isLikelyTestOrAliasEmail('testpro@studio.com')).toBe(true);
    expect(isLikelyTestOrAliasEmail('audit@studio.com')).toBe(true);
    expect(isLikelyTestOrAliasEmail('tester@example.com')).toBe(true);
    expect(isLikelyTestOrAliasEmail('newtester@example.com')).toBe(true);
    expect(isLikelyTestOrAliasEmail('den@cvbc.cum')).toBe(true);

    // Real personal / customer emails must NOT be flagged as test aliases
    expect(isLikelyTestOrAliasEmail('nareshmepani@googlemail.com')).toBe(false);
    expect(isLikelyTestOrAliasEmail('nareshmepani@yahoo.com')).toBe(false);
    expect(isLikelyTestOrAliasEmail('nareshmepani@hotmail.com')).toBe(false);
    expect(isLikelyTestOrAliasEmail('denis@bindology.com')).toBe(false);
  });

  it('classifies ADMIN, CUSTOMER, TEST_ALIAS, and ANONYMOUS segments cleanly', () => {
    expect(
      classifyUserSegment({ email: 'nareshmepani@googlemail.com', isAdminClaim: true })
    ).toBe('ADMIN');
    expect(
      classifyUserSegment({ email: 'nareshmepani@gmail.com', isWhitelistedAdmin: true })
    ).toBe('ADMIN');
    expect(
      classifyUserSegment({ email: 'nareshmepani@yahoo.com' })
    ).toBe('CUSTOMER');
    expect(
      classifyUserSegment({ email: 'nareshmepani202601201725@hotmail.com' })
    ).toBe('TEST_ALIAS');
    expect(
      classifyUserSegment({ email: null })
    ).toBe('ANONYMOUS');
  });

  it('hard-blocks self-mutation and any protected admin account mutation', () => {
    // Self UID lock
    expect(
      assertCanMutateUserAccount({
        actorUid: 'admin-uid-1',
        actorEmail: 'nareshmepani@googlemail.com',
        target: { uid: 'admin-uid-1', email: 'other@example.com' },
      })
    ).toMatchObject({ allowed: false, status: 403 });

    // Self email lock
    expect(
      assertCanMutateUserAccount({
        actorUid: 'admin-uid-1',
        actorEmail: 'NareshMepani@googlemail.com',
        target: { uid: 'other-uid', email: 'nareshmepani@googlemail.com' },
      })
    ).toMatchObject({ allowed: false, status: 403 });

    // isAdmin custom claim lock
    expect(
      assertCanMutateUserAccount({
        actorUid: 'admin-uid-1',
        actorEmail: 'nareshmepani@googlemail.com',
        target: { uid: 'other-admin', email: 'co-admin@gmail.com', isAdminClaim: true },
      })
    ).toMatchObject({ allowed: false, status: 403 });

    // admin_users whitelist lock
    expect(
      assertCanMutateUserAccount({
        actorUid: 'admin-uid-1',
        actorEmail: 'nareshmepani@googlemail.com',
        target: { uid: 'backup-admin', email: 'nareshmepani@gmail.com', isWhitelistedAdmin: true },
      })
    ).toMatchObject({ allowed: false, status: 403 });

    // Non-admin customer / test / anonymous is permitted
    expect(
      assertCanMutateUserAccount({
        actorUid: 'admin-uid-1',
        actorEmail: 'nareshmepani@googlemail.com',
        target: { uid: 'test-uid-99', email: 'testpro@studio.com' },
      })
    ).toEqual({ allowed: true });
  });

  it('enforces exact email or DELETE <UID> typed confirmation before permanent deletion', () => {
    const emailUser = { uid: 'u123', email: 'TestPro@Studio.com' };
    expect(getExpectedDeleteConfirmationToken(emailUser)).toBe('testpro@studio.com');
    expect(matchesDeleteConfirmation(emailUser, 'testpro@studio.com')).toBe(true);
    expect(matchesDeleteConfirmation(emailUser, '  TestPro@Studio.com  ')).toBe(true);
    expect(matchesDeleteConfirmation(emailUser, 'DELETE u123')).toBe(false);
    expect(matchesDeleteConfirmation(emailUser, '')).toBe(false);

    const anonUser = { uid: 'anon_98765', email: null };
    expect(getExpectedDeleteConfirmationToken(anonUser)).toBe('DELETE anon_98765');
    expect(matchesDeleteConfirmation(anonUser, 'DELETE anon_98765')).toBe(true);
    expect(matchesDeleteConfirmation(anonUser, 'delete anon_98765')).toBe(false);
    expect(matchesDeleteConfirmation(anonUser, 'anon_98765')).toBe(false);
  });

  it('computes counts, filters segments/queries, and exports RFC-4180 escaped CSV', () => {
    const sample: AdminUserDirectoryEntry[] = [
      {
        uid: 'adm1',
        email: 'nareshmepani@googlemail.com',
        displayName: 'Naresh, Founder',
        providers: ['google.com'],
        emailVerified: true,
        disabled: false,
        isAdminClaim: true,
        mfaVerifiedClaim: true,
        isWhitelistedAdmin: true,
        adminMfaSetupComplete: true,
        segment: 'ADMIN',
        createdAt: '2026-06-19T08:08:09Z',
        lastSignInAt: '2026-08-23T08:04:42Z',
        firestoreUserDocExists: false,
        memoriesCount: 0,
        chroniclesCount: 0,
        subscriptionTier: null,
        isProtectedAdmin: true,
      },
      {
        uid: 'tst1',
        email: 'testpro@studio.com',
        displayName: 'Test Pro',
        providers: ['password'],
        emailVerified: false,
        disabled: true,
        isAdminClaim: false,
        mfaVerifiedClaim: false,
        isWhitelistedAdmin: false,
        adminMfaSetupComplete: false,
        segment: 'TEST_ALIAS',
        createdAt: '2026-01-10T10:00:00Z',
        lastSignInAt: '2026-02-01T10:00:00Z',
        firestoreUserDocExists: true,
        memoriesCount: 1562,
        chroniclesCount: 0,
        subscriptionTier: 'Pro',
        isProtectedAdmin: false,
      },
    ];

    const counts = computeAdminUserCounts(sample);
    expect(counts).toEqual({
      total: 2,
      admins: 1,
      customers: 0,
      testAliases: 1,
      anonymous: 0,
      disabled: 1,
      totalMemories: 1562,
    });

    expect(filterAdminUsers(sample, { segment: 'DISABLED' })).toHaveLength(1);
    expect(filterAdminUsers(sample, { segment: 'ALL', query: 'founder' })).toHaveLength(1);

    const csv = formatAdminUsersCsv(sample);
    expect(csv.split('\n')).toHaveLength(3);
    expect(csv).toContain('"Naresh, Founder"');
    expect(csv).toContain('testpro@studio.com');
  });
});
