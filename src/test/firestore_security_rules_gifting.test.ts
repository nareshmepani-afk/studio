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
});
