import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PRICING_TIERS_CONFIG, CheckoutTier } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';
import { generateVoucherCode } from '@/lib/voucherTokens';
import type { GiftVoucherDocument, GiftTier, DeliveryMode, UnboxingLanguage } from '@/types/gift';

export const dynamic = 'force-dynamic';

async function createGiftVoucherFromSession(
  session: Stripe.Checkout.Session,
  giverUid: string,
  eventId: string
): Promise<void> {
  if (!adminDb) throw new Error('Database unavailable');

  const metadata = session.metadata || {};
  const tier = (metadata.tier as GiftTier) || 'director';

  // Generate unique Crockford Base32 voucher code
  const code = await generateVoucherCode(tier);

  const now = new Date().toISOString();

  const voucherDoc: GiftVoucherDocument = {
    code,
    tier,
    vaultQuotaGb: tier === 'generational_vault' ? 100 : 15,
    durationDays: tier === 'generational_vault' ? null : 31,
    status: 'unredeemed',
    giverUid,
    giverName: metadata.giverName || 'Anonymous',
    giverEmail: metadata.giverEmail || session.customer_details?.email || '',
    giftMessage: metadata.giftMessage || '',
    giverMediaUrl: null,
    recipientName: metadata.recipientName || '',
    recipientEmail: metadata.recipientEmail || null,
    deliveryMode: (metadata.deliveryMode as DeliveryMode) || 'instant_link',
    scheduledDeliveryDate: metadata.scheduledDeliveryDate || null,
    unboxingLanguage: (metadata.unboxingLanguage as UnboxingLanguage) || 'en',
    isFounderMint: false,
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent ? String(session.payment_intent) : null,
    amountPaid: session.amount_total || 0,
    currency: (session.currency as 'gbp' | 'usd') || 'gbp',
    purchasedAt: now,
    redeemedByUid: null,
    redeemedByEmail: null,
    redeemedAt: null,
    failedAttempts: 0,
    lastAttemptAt: null,
    expiresAt: null,
  };

  // Atomic write: voucher document + giver payment audit ledger
  const batch = adminDb.batch();

  // Create the gift voucher document
  const voucherRef = adminDb.collection('gift_vouchers').doc(code);
  batch.set(voucherRef, voucherDoc);

  // Record payment under giver's audit ledger
  const giverRef = adminDb.collection('users').doc(giverUid);
  const paymentRef = giverRef.collection('payments').doc(session.id);
  batch.set(paymentRef, {
    sessionId: session.id,
    stripeCustomerId: session.customer || null,
    tier,
    amountTotal: session.amount_total,
    currency: session.currency,
    paymentStatus: session.payment_status,
    createdAt: now,
    customerEmail: session.customer_details?.email || metadata.giverEmail || null,
    eventId,
    type: 'gift_purchase',
    giftVoucherCode: code,
    recipientName: metadata.recipientName || '',
  });

  await batch.commit();
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // 1. App Router Raw Body Parsing as plain text string to prevent signature mismatch
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    // If webhook secret is not configured yet (e.g. initial dev setup), log and acknowledge or return 400
    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  if (!adminDb) {
    console.error('Database connection unavailable for processing Stripe webhook');
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.client_reference_id || session.metadata?.uid;
        const tier = (session.metadata?.tier as CheckoutTier) || 'director';

        if (!uid) {
          console.warn('Checkout session completed without UID reference:', session.id);
          break;
        }

        const userRef = adminDb.collection('users').doc(uid);
        const paymentRef = userRef.collection('payments').doc(session.id);

        // 2. Webhook Idempotency & Duplicate Event Protection
        const existingPayment = await paymentRef.get();
        if (existingPayment.exists) {
          console.log(`Duplicate event detected: session ${session.id} already processed for UID ${uid}`);
          return NextResponse.json({ received: true, duplicate: true });
        }

        // ── Gift Purchase Detection & Fork ──────────────────────────────────
        const isGift = session.metadata?.isGift === 'true';

        if (isGift) {
          await createGiftVoucherFromSession(session, uid, event.id);
          console.log(`🎁 Gift voucher created for session ${session.id} by giver UID ${uid}`);
          break;
        }

        const userDoc = await userRef.get();
        const userData = userDoc.data();

        // 4. Preserving Active Storage Usage on Tier Upgrade
        const currentStorageUsed = userData?.storageQuota?.used ?? userData?.storageUsedBytes ?? 0;
        const tierConfig = PRICING_TIERS_CONFIG[tier] || PRICING_TIERS_CONFIG.director;
        const newTotalQuotaBytes = tierConfig.storageQuotaBytes;

        const isLifetime = tier === 'generational_vault';
        const now = new Date();

        let newExpiryDate: string | null = null;
        if (!isLifetime) {
          // Cumulative 31-day pass extension calculation
          const existingExpiryStr = userData?.paidDirectorPassExpiryDate;
          const existingExpiry = existingExpiryStr ? new Date(existingExpiryStr) : null;
          const baseDate = (existingExpiry && existingExpiry.getTime() > now.getTime()) ? existingExpiry : now;
          const extendedDate = new Date(baseDate.getTime() + 31 * 24 * 60 * 60 * 1000);
          newExpiryDate = extendedDate.toISOString();
        }

        const updates: Record<string, any> = {
          directorPassStatus: 'paid_host_pass_active',
          membershipTier: isLifetime ? 'generational_vault' : 'director_pass',
          vaultQuotaGb: isLifetime ? 100 : 15,
          storageQuota: {
            total: newTotalQuotaBytes,
            used: currentStorageUsed,
          },
          stripeCustomerId: session.customer ? String(session.customer) : (userData?.stripeCustomerId || null),
          stripeSessionId: session.id,
          lastPaymentDate: now.toISOString(),
          paidDirectorPassExpiryDate: newExpiryDate,
        };

        if (session.subscription) {
          updates.stripeSubscriptionId = String(session.subscription);
        }

        const batch = adminDb.batch();
        batch.set(userRef, updates, { merge: true });

        // Record payment audit ledger document
        batch.set(paymentRef, {
          sessionId: session.id,
          stripeCustomerId: session.customer || null,
          stripeSubscriptionId: session.subscription || null,
          tier,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentStatus: session.payment_status,
          createdAt: new Date().toISOString(),
          customerEmail: session.customer_details?.email || session.metadata?.userEmail || null,
          eventId: event.id,
        });

        await batch.commit();
        console.log(`✅ Successfully activated ${tier} pass for UID ${uid} via session ${session.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = String(subscription.customer);

        // Find user by stripeCustomerId or metadata.uid
        const usersSnapshot = await adminDb
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const userData = userDoc.data();

          // Only expire if not on a lifetime generational vault
          if (userData.membershipTier !== 'generational_vault') {
            await userDoc.ref.update({
              directorPassStatus: 'paid_host_pass_expired',
              membershipTier: 'director_monthly',
            });
            console.log(`Subscribed pass expired for user ${userDoc.id} due to subscription cancellation.`);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = String(invoice.customer);
        const subscriptionId = (invoice as any).subscription || (invoice as any).parent?.subscription_details?.subscription;

        if (subscriptionId) {
          const usersSnapshot = await adminDb
            .collection('users')
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            const now = new Date();
            const thirtyOneDaysLater = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

            await userDoc.ref.update({
              directorPassStatus: 'paid_host_pass_active',
              lastPaymentDate: now.toISOString(),
              paidDirectorPassExpiryDate: thirtyOneDaysLater.toISOString(),
            });
          }
        }
        break;
      }

      default:
        // Acknowledge receipt of other Stripe event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing Stripe webhook event:', error);
    return NextResponse.json(
      { error: 'Webhook processing error', details: error.message },
      { status: 500 }
    );
  }
}
