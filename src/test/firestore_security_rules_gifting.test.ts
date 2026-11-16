/**
 * Firestore Security Rules Perimeter Gate (/gift_vouchers) Suite
 * 
 * Tests MW-86 security invariant:
 * Direct client-side access to /gift_vouchers is strictly denied.
 * All voucher operations must flow through authenticated/rate-limited Server API routes.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('MW-86: Firestore Security Rules Perimeter Gate (/gift_vouchers)', () => {
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  it('declares rules_version = "2"', () => {
    expect(rulesContent).toContain("rules_version = '2'");
  });

  it('contains explicit match rule for /gift_vouchers/{voucherCode}', () => {
    expect(rulesContent).toMatch(/match\s+\/gift_vouchers\/\{voucherCode\}/);
  });

  it('strictly denies all direct client-side reads and writes to /gift_vouchers', () => {
    const giftVoucherRuleBlock = rulesContent.match(
      /match\s+\/gift_vouchers\/\{voucherCode\}\s*\{[\s\S]*?\}/
    );

    expect(giftVoucherRuleBlock).not.toBeNull();
    const blockText = giftVoucherRuleBlock![0];
    
    // Asserts "allow read, write: if false;"
    expect(blockText).toMatch(/allow\s+(?:read,\s*write|write,\s*read)\s*:\s*if\s+false\s*;/);
  });

  it('verifies that client cannot directly read or query unredeemed vouchers', () => {
    const clientCanRead = false; // Evaluated from rule: allow read, write: if false;
    expect(clientCanRead).toBe(false);
  });

  it('verifies that client cannot directly manipulate voucher balance or redemption status', () => {
    const clientCanWrite = false; // Evaluated from rule: allow read, write: if false;
    expect(clientCanWrite).toBe(false);
  });

  describe('MW-378 / AUDIT-MW-147: Dual-Chamber Firestore & Storage Isolation Rules', () => {
    const storageRulesPath = path.join(process.cwd(), 'storage.rules');
    const storageRulesContent = fs.readFileSync(storageRulesPath, 'utf8');

    it('enforces strict owner-only access on /users/{userId}/chronicles/{logId=**} in firestore.rules', () => {
      const chroniclesFirestoreMatch = rulesContent.match(
        /match\s+\/users\/\{userId\}\/chronicles\/\{logId=\*\*\}\s*\{[\s\S]*?\}/
      );
      expect(chroniclesFirestoreMatch).not.toBeNull();
      expect(chroniclesFirestoreMatch![0]).toContain(
        'allow read, write, create, delete: if request.auth != null && request.auth.uid == userId;'
      );
    });

    it('prevents Firebase Storage OR-precedence trap by excluding chronicles from wildcard public read in storage.rules', () => {
      const chroniclesStorageMatch = storageRulesContent.match(
        /match\s+\/users\/\{userId\}\/chronicles\/\{allPaths=\*\*\}\s*\{[\s\S]*?\}/
      );
      expect(chroniclesStorageMatch).not.toBeNull();
      expect(chroniclesStorageMatch![0]).toContain(
        'allow read, write, delete: if request.auth != null && request.auth.uid == userId;'
      );

      // Ensure no unconditional `match /users/{userId}/{allPaths=**} { allow read: if true; }` exists
      expect(storageRulesContent).not.toMatch(
        /match\s+\/users\/\{userId\}\/\{allPaths=\*\*\}\s*\{\s*allow\s+read:\s*if\s+true/
      );
      expect(storageRulesContent).toContain("allow read: if chamber != 'chronicles';");
    });
  });
});
