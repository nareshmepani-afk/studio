/**
 * Automated Vitest Integration Suite: Stripe Webhooks Engine (/api/webhooks/stripe)
 * 
 * Simulates CLI triggers and tests all webhook handling contracts:
 * 1. stripe trigger checkout.session.completed (Director 31-Day Pass)
 * 2. stripe trigger checkout.session.completed (Generational Vault Lifetime)
 * 3. stripe trigger checkout.session.completed (Heirloom Gifting Fork)
 * 4. stripe trigger customer.subscription.deleted (Pass Expiration & Lifetime Shield)
 * 5. stripe trigger invoice.payment_succeeded (Recurring Pass Extension)
 * 6. Idempotency & Replay Protection (Duplicate webhook event handling)
 * 7. Cryptographic Signature Verification & Error Handling (400 responses)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

interface UserStoreData {
  id: string;
  email?: string;
  directorPassStatus?: string;
  membershipTier?: string;
  vaultQuotaGb?: number;
  storageQuota?: { total: number; used: number };
  paidDirectorPassExpiryDate?: string | null;
  stripeCustomerId?: string | null;
  stripeSessionId?: string | null;
  stripeSubscriptionId?: string | null;
  lastPaymentDate?: string;
}

const { mockStore, mockBatch, mockAdminDb, mockStripeState } = vi.hoisted(() => {
  const mockStore = {
    users: new Map<string, any>(),
    gift_vouchers: new Map<string, any>(),
    payments: new Map<string, any>(),
  };

  const mockBatch = {
    set: vi.fn((docRef: any, data: any, options?: { merge?: boolean }) => {
      if (docRef._collection === 'users') {
        const existing = mockStore.users.get(docRef._id) || { id: docRef._id };
        mockStore.users.set(docRef._id, options?.merge ? { ...existing, ...data } : data);
      } else if (docRef._collection === 'gift_vouchers') {
        mockStore.gift_vouchers.set(docRef._id, data);
      } else if (docRef._collection === 'payments') {
        mockStore.payments.set(docRef._id, data);
      }
    }),
    commit: vi.fn(async () => Promise.resolve()),
  };

  const mockAdminDb = {
    batch: vi.fn(() => mockBatch),
    collection: vi.fn((colName: string) => ({
      _collection: colName,
      doc: vi.fn((docId: string) => ({
        _collection: colName,
        _id: docId,
        get: vi.fn(async () => ({
          exists: colName === 'users'
            ? mockStore.users.has(docId)
            : colName === 'gift_vouchers'
            ? mockStore.gift_vouchers.has(docId)
            : mockStore.payments.has(docId),
          data: () => colName === 'users'
            ? mockStore.users.get(docId)
            : colName === 'gift_vouchers'
            ? mockStore.gift_vouchers.get(docId)
            : mockStore.payments.get(docId),
        })),
        collection: vi.fn((subColName: string) => ({
          _collection: subColName,
          doc: vi.fn((subDocId: string) => ({
            _collection: subColName,
            _id: subDocId,
            get: vi.fn(async () => ({
              exists: mockStore.payments.has(subDocId),
              data: () => mockStore.payments.get(subDocId),
            })),
          })),
        })),
      })),
      where: vi.fn((field: string, op: string, value: any) => ({
        limit: vi.fn((n: number) => ({
          get: vi.fn(async () => {
            const matchingUsers = Array.from(mockStore.users.values()).filter(u => {
              if (field === 'stripeCustomerId') return u.stripeCustomerId === value;
              return false;
            });
            return {
              empty: matchingUsers.length === 0,
              docs: matchingUsers.map(u => ({
                id: u.id,
                data: () => u,
                ref: {
                  update: vi.fn(async (updates: any) => {
                    const current = mockStore.users.get(u.id) || u;
                    mockStore.users.set(u.id, { ...current, ...updates });
                  }),
                },
              })),
            };
          }),
        })),
      })),
    })),
  };

  const mockStripeState = {
    mockConstructEventError: null as Error | null,
    mockConstructEventEvent: null as any,
  };

  return { mockStore, mockBatch, mockAdminDb, mockStripeState };
});

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: mockAdminDb,
}));

const mockStripe = {
  webhooks: {
    constructEvent: vi.fn((body: string, sig: string, secret: string) => {
      if (mockStripeState.mockConstructEventError) {
        throw mockStripeState.mockConstructEventError;
      }
      if (mockStripeState.mockConstructEventEvent) {
        return mockStripeState.mockConstructEventEvent;
      }
      return JSON.parse(body);
    }),
  },
};

vi.mock('@/lib/stripe', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getStripe: () => mockStripe,
  };
});

import { POST } from '@/app/api/webhooks/stripe/route';

describe('Stripe Webhook Engine Automated Integration Suite (/api/webhooks/stripe)', () => {
  const TEST_WEBHOOK_SECRET = 'whsec_test_mock_secret_key_12345';

  beforeEach(() => {
    mockStore.users.clear();
    mockStore.gift_vouchers.clear();
    mockStore.payments.clear();
    mockStripeState.mockConstructEventError = null;
    mockStripeState.mockConstructEventEvent = null;
    process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    vi.clearAllMocks();
  });

  // ── 1. CHECKOUT.SESSION.COMPLETED (DIRECTOR PASS) ───────────────────────────
  it('handles "stripe trigger checkout.session.completed" for Director 31-Day Pass upgrade', async () => {
    mockStore.users.set('usr_director_test', {
      id: 'usr_director_test',
      email: 'director@example.com',
      directorPassStatus: 'free_trial',
      membershipTier: 'free',
      storageQuota: { total: 5 * 1024 * 1024 * 1024, used: 1024 * 1024 },
    });

    const sessionPayload = {
      id: 'evt_checkout_director_001',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_director_session_001',
          client_reference_id: 'usr_director_test',
          customer: 'cus_test_director_001',
          amount_total: 1299,
          currency: 'gbp',
          payment_status: 'paid',
          metadata: {
            uid: 'usr_director_test',
            tier: 'director',
            isGift: 'false',
          },
        },
      },
    };

    mockStripeState.mockConstructEventEvent = sessionPayload;

    const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=12345,v1=mock_signature',
        'content-type': 'application/json',
      },
      body: JSON.stringify(sessionPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.received).toBe(true);

    const updatedUser = mockStore.users.get('usr_director_test');
    expect(updatedUser?.directorPassStatus).toBe('paid_host_pass_active');
    expect(updatedUser?.membershipTier).toBe('director_pass');
    expect(updatedUser?.vaultQuotaGb).toBe(15);
    expect(updatedUser?.storageQuota?.used).toBe(1024 * 1024);
    expect(updatedUser?.paidDirectorPassExpiryDate).toBeDefined();
    expect(updatedUser?.stripeCustomerId).toBe('cus_test_director_001');

    expect(mockStore.payments.has('cs_test_director_session_001')).toBe(true);
    const payment = mockStore.payments.get('cs_test_director_session_001');
    expect(payment?.amountTotal).toBe(1299);
    expect(payment?.currency).toBe('gbp');
  });

  // ── 2. CHECKOUT.SESSION.COMPLETED (GENERATIONAL VAULT LIFETIME) ─────────────
  it('handles "stripe trigger checkout.session.completed" for Generational Vault Lifetime purchase', async () => {
    mockStore.users.set('usr_vault_holder', {
      id: 'usr_vault_holder',
      email: 'vault@example.com',
      directorPassStatus: 'free_trial',
      membershipTier: 'free',
    });

    const sessionPayload = {
      id: 'evt_checkout_vault_002',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_vault_session_002',
          client_reference_id: 'usr_vault_holder',
          customer: 'cus_test_vault_002',
          amount_total: 19500,
          currency: 'gbp',
          payment_status: 'paid',
          metadata: {
            uid: 'usr_vault_holder',
            tier: 'generational_vault',
            isGift: 'false',
          },
        },
      },
    };

    mockStripeState.mockConstructEventEvent = sessionPayload;

    const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=12345,v1=mock_signature',
        'content-type': 'application/json',
      },
      body: JSON.stringify(sessionPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const updatedUser = mockStore.users.get('usr_vault_holder');
    expect(updatedUser?.membershipTier).toBe('generational_vault');
    expect(updatedUser?.vaultQuotaGb).toBe(100);
    expect(updatedUser?.paidDirectorPassExpiryDate).toBeNull();
  });

  // ── 3. CHECKOUT.SESSION.COMPLETED (HEIRLOOM GIFT PURCHASE) ───────────────────
  it('handles "stripe trigger checkout.session.completed" with isGift: true and creates voucher', async () => {
    mockStore.users.set('usr_giver_003', {
      id: 'usr_giver_003',
      email: 'giver@example.com',
    });

    const giftSessionPayload = {
      id: 'evt_checkout_gift_003',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_gift_session_003',
          client_reference_id: 'usr_giver_003',
          amount_total: 19500,
          currency: 'gbp',
          payment_status: 'paid',
          customer_details: { email: 'giver@example.com' },
          payment_intent: 'pi_test_gift_intent_003',
          metadata: {
            isGift: 'true',
            tier: 'generational_vault',
            giverName: 'Sarah Jenkins',
            giverEmail: 'giver@example.com',
            giftMessage: 'Dear Mum, preserving your stories forever.',
            recipientName: 'Mum',
            deliveryMode: 'printable_pdf',
            unboxingLanguage: 'gu',
          },
        },
      },
    };

    mockStripeState.mockConstructEventEvent = giftSessionPayload;

    const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=12345,v1=mock_signature',
        'content-type': 'application/json',
      },
      body: JSON.stringify(giftSessionPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockStore.gift_vouchers.size).toBe(1);
    const [voucherCode, voucherData] = Array.from(mockStore.gift_vouchers.entries())[0];
    expect(voucherCode).toMatch(/^MW-(VAULT|GIFT)-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(voucherData.status).toBe('unredeemed');
    expect(voucherData.tier).toBe('generational_vault');
    expect(voucherData.vaultQuotaGb).toBe(100);
    expect(voucherData.recipientName).toBe('Mum');
    expect(voucherData.unboxingLanguage).toBe('gu');
    expect(voucherData.giverUid).toBe('usr_giver_003');

    expect(mockStore.payments.has('cs_test_gift_session_003')).toBe(true);
    const payment = mockStore.payments.get('cs_test_gift_session_003');
    expect(payment.type).toBe('gift_purchase');
    expect(payment.giftVoucherCode).toBe(voucherCode);
  });

  // ── 4. WEBHOOK IDEMPOTENCY & DUPLICATE PROTECTION ───────────────────────────
  it('guarantees webhook idempotency and returns duplicate: true on replayed events', async () => {
    const sessionId = 'cs_test_already_processed';
    mockStore.payments.set(sessionId, {
      sessionId,
      amountTotal: 1299,
      paymentStatus: 'paid',
    });

    const duplicatePayload = {
      id: 'evt_duplicate_004',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          client_reference_id: 'usr_director_test',
          metadata: { tier: 'director' },
        },
      },
    };

    mockStripeState.mockConstructEventEvent = duplicatePayload;

    const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=12345,v1=mock_signature',
        'content-type': 'application/json',
      },
      body: JSON.stringify(duplicatePayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.duplicate).toBe(true);
  });

  // ── 5. CUSTOMER.SUBSCRIPTION.DELETED ────────────────────────────────────────
  it('handles "stripe trigger customer.subscription.deleted" and expires pass for non-lifetime users', async () => {
    mockStore.users.set('usr_subscribed_005', {
      id: 'usr_subscribed_005',
      stripeCustomerId: 'cus_subscribed_005',
      directorPassStatus: 'paid_host_pass_active',
      membershipTier: 'director_pass',
    });

    const subDeletedPayload = {
      id: 'evt_sub_deleted_005',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_subscribed_005',
        },
      },
    };

    mockStripeState.mockConstructEventEvent = subDeletedPayload;

    const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=12345,v1=mock_signature',
        'content-type': 'application/json',
      },
      body: JSON.stringify(subDeletedPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const user = mockStore.users.get('usr_subscribed_005');
    expect(user?.directorPassStatus).toBe('paid_host_pass_expired');
  });

  it('preserves lifetime Generational Vault holders when a secondary subscription is deleted', async () => {
    mockStore.users.set('usr_lifetime_006', {
      id: 'usr_lifetime_006',
      stripeCustomerId: 'cus_lifetime_006',
      directorPassStatus: 'paid_host_pass_active',
      membershipTier: 'generational_vault',
    });

    const subDeletedPayload = {
      id: 'evt_sub_deleted_006',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_lifetime_006',
        },
      },
    };

    mockStripeState.mockConstructEventEvent = subDeletedPayload;

    const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=12345,v1=mock_signature',
        'content-type': 'application/json',
      },
      body: JSON.stringify(subDeletedPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const user = mockStore.users.get('usr_lifetime_006');
    expect(user?.directorPassStatus).toBe('paid_host_pass_active');
    expect(user?.membershipTier).toBe('generational_vault');
  });

  // ── 6. INVOICE.PAYMENT_SUCCEEDED ────────────────────────────────────────────
  it('handles "stripe trigger invoice.payment_succeeded" and extends pass expiry', async () => {
    mockStore.users.set('usr_recurring_007', {
      id: 'usr_recurring_007',
      stripeCustomerId: 'cus_recurring_007',
      directorPassStatus: 'paid_host_pass_active',
    });

    const invoicePayload = {
      id: 'evt_invoice_007',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          customer: 'cus_recurring_007',
          subscription: 'sub_test_123',
        },
      },
    };

    mockStripeState.mockConstructEventEvent = invoicePayload;

    const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=12345,v1=mock_signature',
        'content-type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const user = mockStore.users.get('usr_recurring_007');
    expect(user?.directorPassStatus).toBe('paid_host_pass_active');
    expect(user?.paidDirectorPassExpiryDate).toBeDefined();
  });

  // ── 7. UNHANDLED STRIPE EVENT ACKNOWLEDGEMENT ───────────────────────────────
  it('returns HTTP 200 { received: true } for unhandled Stripe events to keep delivery healthy', async () => {
    const unhandledPayload = {
      id: 'evt_charge_succeeded_008',
      type: 'charge.succeeded',
      data: {
        object: { id: 'ch_test_123' },
      },
    };

    mockStripeState.mockConstructEventEvent = unhandledPayload;

    const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=12345,v1=mock_signature',
        'content-type': 'application/json',
      },
      body: JSON.stringify(unhandledPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.received).toBe(true);
  });

  // ── 8. SIGNATURE & CONFIGURATION ERROR GUARDS ────────────────────────────────
  it('returns HTTP 400 when stripe-signature header is missing', async () => {
    const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/missing stripe-signature/i);
  });

  it('returns HTTP 400 when STRIPE_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=12345,v1=mock_signature',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/webhook secret is not configured/i);
  });

  it('returns HTTP 400 when signature verification fails', async () => {
    mockStripeState.mockConstructEventError = new Error('No signatures found matching the expected signature for payload');

    const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=12345,v1=invalid_signature',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/signature verification failed/i);
  });
});
