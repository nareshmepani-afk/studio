import type Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';
import { generateVoucherCode } from '@/lib/voucherTokens';
import type {
  GiftVoucherDocument,
  GiftTier,
  DeliveryMode,
  UnboxingLanguage,
} from '@/types/gift';

export interface EnsureGiftVoucherResult {
  voucherCode: string;
  voucherDoc: GiftVoucherDocument;
  created: boolean;
}

/**
 * Idempotently mints (or retrieves) the Heirloom Gift voucher for a paid Stripe
 * Checkout session. Shared between `/api/checkout/verify-session` (self-healing
 * on immediate post-payment redirect) and `/api/webhooks/stripe` so a redirect
 * arriving before the webhook never produces a missing voucher or duplicates.
 */
export async function ensureGiftVoucherForPaidSession(params: {
  session: Stripe.Checkout.Session;
  giverUid: string;
  eventId?: string;
}): Promise<EnsureGiftVoucherResult> {
  const { session, giverUid, eventId = 'verify-session' } = params;

  if (!adminDb) {
    throw new Error('Database unavailable');
  }

  const db = adminDb;
  const metadata = session.metadata || {};
  const tier: GiftTier =
    metadata.tier === 'generational_vault' ? 'generational_vault' : 'director';

  const giverRef = db.collection('users').doc(giverUid);
  const paymentRef = giverRef.collection('payments').doc(session.id);

  // Fast path 1: payment audit doc already minted a voucher code for this session
  const existingPaymentSnap = await paymentRef.get();
  const existingPaymentCode = existingPaymentSnap.exists
    ? (existingPaymentSnap.data()?.giftVoucherCode as string | undefined)
    : undefined;

  if (existingPaymentCode) {
    const existingVoucherSnap = await db
      .collection('gift_vouchers')
      .doc(existingPaymentCode)
      .get();
    if (existingVoucherSnap.exists) {
      return {
        voucherCode: existingPaymentCode,
        voucherDoc: existingVoucherSnap.data() as GiftVoucherDocument,
        created: false,
      };
    }
  }

  // Fast path 2: existing voucher found by stripeSessionId (legacy/webhook path)
  const voucherQuery = await db
    .collection('gift_vouchers')
    .where('stripeSessionId', '==', session.id)
    .limit(1)
    .get();

  if (!voucherQuery.empty) {
    const docSnap = voucherQuery.docs[0];
    return {
      voucherCode: docSnap.id,
      voucherDoc: docSnap.data() as GiftVoucherDocument,
      created: false,
    };
  }

  // Generate candidate unique Crockford Base32 voucher code prior to atomic commit
  const candidateCode = await generateVoucherCode(tier);
  const now = new Date().toISOString();

  const candidateVoucherDoc: GiftVoucherDocument = {
    code: candidateCode,
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
    stripePaymentIntentId: session.payment_intent
      ? String(session.payment_intent)
      : null,
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

  const paymentAuditDoc = {
    sessionId: session.id,
    stripeCustomerId: session.customer || null,
    tier,
    amountTotal: session.amount_total,
    currency: session.currency,
    paymentStatus: session.payment_status,
    createdAt: now,
    customerEmail:
      session.customer_details?.email || metadata.giverEmail || null,
    eventId,
    type: 'gift_purchase',
    giftVoucherCode: candidateCode,
    recipientName: metadata.recipientName || '',
  };

  // Race-safe atomic commit via Firestore transaction when available
  if (typeof db.runTransaction === 'function') {
    const txResult = await db.runTransaction(async (tx) => {
      const txPaymentSnap = await tx.get(paymentRef);
      const txExistingCode = txPaymentSnap.exists
        ? (txPaymentSnap.data()?.giftVoucherCode as string | undefined)
        : undefined;

      if (txExistingCode) {
        const txVoucherSnap = await tx.get(
          db.collection('gift_vouchers').doc(txExistingCode)
        );
        if (txVoucherSnap.exists) {
          return {
            voucherCode: txExistingCode,
            voucherDoc: txVoucherSnap.data() as GiftVoucherDocument,
            created: false,
          };
        }
      }

      const voucherRef = db.collection('gift_vouchers').doc(candidateCode);
      tx.set(voucherRef, candidateVoucherDoc);
      tx.set(paymentRef, paymentAuditDoc, { merge: true });

      return {
        voucherCode: candidateCode,
        voucherDoc: candidateVoucherDoc,
        created: true,
      };
    });

    return txResult;
  }

  // Fallback atomic batch (used in lightweight test mocks without runTransaction)
  const batch = db.batch();
  const voucherRef = db.collection('gift_vouchers').doc(candidateCode);
  batch.set(voucherRef, candidateVoucherDoc);
  batch.set(paymentRef, paymentAuditDoc);
  await batch.commit();

  return {
    voucherCode: candidateCode,
    voucherDoc: candidateVoucherDoc,
    created: true,
  };
}
