import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type Stripe from 'stripe';

const mockStore = {
  gift_vouchers: new Map<string, any>(),
  payments: new Map<string, any>(),
};

const makeDocRef = (col: string, id: string) => ({
  _collection: col,
  _id: id,
  get: vi.fn(async () => ({
    exists: col === 'gift_vouchers' ? mockStore.gift_vouchers.has(id) : mockStore.payments.has(id),
    data: () => (col === 'gift_vouchers' ? mockStore.gift_vouchers.get(id) : mockStore.payments.get(id)),
  })),
  collection: vi.fn((subCol: string) => ({
    doc: vi.fn((subId: string) => makeDocRef(subCol, subId)),
  })),
});

const mockAdminDb = {
  collection: vi.fn((colName: string) => ({
    doc: vi.fn((id: string) => makeDocRef(colName, id)),
    where: vi.fn((_field: string, _op: string, val: string) => ({
      limit: vi.fn(() => ({
        get: vi.fn(async () => {
          const matches: Array<{ id: string; data: () => any }> = [];
          for (const [k, v] of Array.from(mockStore.gift_vouchers.entries())) {
            if (v.stripeSessionId === val) {
              matches.push({ id: k, data: () => v });
            }
          }
          return { empty: matches.length === 0, docs: matches };
        }),
      })),
    })),
  })),
  runTransaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
    const tx = {
      get: async (ref: any) => ref.get(),
      set: (ref: any, data: any) => {
        if (ref._collection === 'gift_vouchers') {
          mockStore.gift_vouchers.set(ref._id, data);
        } else if (ref._collection === 'payments') {
          mockStore.payments.set(ref._id, data);
        }
      },
    };
    return cb(tx);
  }),
};

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: mockAdminDb,
}));

describe('P0 Gift Voucher Self-Healing & Keepsake Confirmation Shield', () => {
  beforeEach(() => {
    mockStore.gift_vouchers.clear();
    mockStore.payments.clear();
    vi.clearAllMocks();
  });

  it('idempotently mints one real Crockford voucher when verify-session beats the Stripe webhook', async () => {
    const { ensureGiftVoucherForPaidSession } = await import('@/lib/giftVoucherMinting');

    const paidSession = {
      id: 'cs_test_selfheal_999',
      payment_status: 'paid',
      amount_total: 19500,
      currency: 'gbp',
      customer: 'cus_test_1',
      payment_intent: 'pi_test_1',
      customer_details: { email: 'naresh@example.com' },
      metadata: {
        isGift: 'true',
        tier: 'generational_vault',
        recipientName: 'Dad',
        giverName: 'Naresh',
        giftMessage: 'Dear Dad, your stories deserve centre stage.',
        deliveryMode: 'instant_link',
        unboxingLanguage: 'en',
      },
    } as unknown as Stripe.Checkout.Session;

    // 1. Browser redirect hits /api/checkout/verify-session before webhook arrives
    const first = await ensureGiftVoucherForPaidSession({
      session: paidSession,
      giverUid: 'uid_naresh',
      eventId: 'verify-session',
    });

    expect(first.created).toBe(true);
    expect(first.voucherCode).toMatch(/^MW-VAULT-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(first.voucherCode).not.toBe('MW-VAULT-LIVE-PASS');
    expect(mockStore.gift_vouchers.size).toBe(1);
    expect(mockStore.payments.get('cs_test_selfheal_999')?.giftVoucherCode).toBe(first.voucherCode);

    // 2. Stripe webhook arrives 1 second later for the same session -> zero duplicate vouchers
    const second = await ensureGiftVoucherForPaidSession({
      session: paidSession,
      giverUid: 'uid_naresh',
      eventId: 'evt_stripe_123',
    });

    expect(second.created).toBe(false);
    expect(second.voucherCode).toBe(first.voucherCode);
    expect(mockStore.gift_vouchers.size).toBe(1);
  });

  it('removes hardcoded MW-VAULT-LIVE-PASS fallback and wires Keepsake PDF download on confirmation page', () => {
    const confirmationSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/gift/confirmation/page.tsx'),
      'utf8'
    );
    expect(confirmationSrc).not.toContain('MW-VAULT-LIVE-PASS');
    expect(confirmationSrc).toContain('/api/gift/pdf?code=');
    expect(confirmationSrc).not.toContain('window.print()');
  });
});
