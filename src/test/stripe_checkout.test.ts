import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PRICING_TIERS_CONFIG, getOrCreateStripeCustomer, createStripeCheckoutSession, createStripeBillingPortalSession } from '@/lib/stripe';
import { POST as webhookPost } from '@/app/api/webhooks/stripe/route';
import { NextRequest } from 'next/server';

describe('MW-85: Stripe Payment & Generational Vault Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pricing Tiers Configuration Matrix', () => {
    it('configures Director Pass with monthly subscription and 15GB vault quota', () => {
      const director = PRICING_TIERS_CONFIG.director;
      expect(director).toBeDefined();
      expect(director.mode).toBe('subscription');
      expect(director.interval).toBe('month');
      expect(director.amount.gbp).toBe(1299); // £12.99
      expect(director.amount.usd).toBe(1499); // $14.99
      expect(director.storageQuotaBytes).toBe(15 * 1024 * 1024 * 1024);
    });

    it('configures Generational Vault with one-time payment and 100GB perpetual vault quota', () => {
      const vault = PRICING_TIERS_CONFIG.generational_vault;
      expect(vault).toBeDefined();
      expect(vault.mode).toBe('payment');
      expect(vault.interval).toBeUndefined();
      expect(vault.amount.gbp).toBe(19500); // £195.00
      expect(vault.amount.usd).toBe(24900); // $249.00
      expect(vault.storageQuotaBytes).toBe(100 * 1024 * 1024 * 1024);
    });
  });

  describe('Customer Deduplication (Watchout 3)', () => {
    it('returns existing stripeCustomerId from user record without creating duplicate Stripe customer', async () => {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        vi.spyOn(adminDb, 'collection').mockReturnValueOnce({
          doc: vi.fn().mockReturnValueOnce({
            get: vi.fn().mockResolvedValueOnce({
              exists: true,
              data: () => ({ stripeCustomerId: 'cus_existing_123' }),
            }),
          }),
        } as any);
      }

      const customerId = await getOrCreateStripeCustomer({
        uid: 'user_test_uid',
        email: 'director@memoryweaver.studio',
      });

      expect(customerId).toBe('cus_existing_123');
    });
  });

  describe('Stripe Webhook Route Verification (Watchouts 1, 2, 4)', () => {
    it('returns 400 when stripe-signature header or secret is missing', async () => {
      const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      });

      const res = await webhookPost(req);
      expect(res.status).toBe(400);
    });

    it('handles duplicate webhook events idempotently by returning 200 without throwing', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

      const { getStripe } = await import('@/lib/stripe');
      const stripe = getStripe();
      vi.spyOn(stripe.webhooks, 'constructEvent').mockReturnValueOnce({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_duplicate',
            client_reference_id: 'user_dup_123',
            customer: 'cus_test_123',
            metadata: { uid: 'user_dup_123', tier: 'generational_vault' },
          } as any,
        },
      } as any);

      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        vi.spyOn(adminDb, 'collection').mockReturnValueOnce({
          doc: vi.fn().mockReturnValueOnce({
            collection: vi.fn().mockReturnValueOnce({
              doc: vi.fn().mockReturnValueOnce({
                get: vi.fn().mockResolvedValueOnce({
                  exists: true, // Already recorded in ledger
                  data: () => ({ sessionId: 'cs_test_duplicate' }),
                }),
              }),
            }),
          }),
        } as any);
      }

      const req = new NextRequest('https://dev.memoryweaver.studio/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'sig_valid_123',
        },
        body: '{"id":"evt_test_123"}',
      });

      const res = await webhookPost(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.duplicate).toBe(true);
    });
  });
});
