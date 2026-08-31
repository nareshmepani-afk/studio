import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';
import { getStripe, PRICING_TIERS_CONFIG } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userSession = await getSession();

    if (!userSession?.uid) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to verify payment.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    // Security verify: ensure session belongs to authenticated user
    const targetUid = stripeSession.client_reference_id || stripeSession.metadata?.uid;
    if (targetUid && targetUid !== userSession.uid) {
      return NextResponse.json(
        { error: 'Security mismatch: checkout session does not match user account.' },
        { status: 403 }
      );
    }

    const uid = userSession.uid;
    const isPaid = stripeSession.payment_status === 'paid';
    const isGift = stripeSession.metadata?.isGift === 'true';
    const tier = (stripeSession.metadata?.tier || 'director') as 'director' | 'generational_vault';
    const isLifetime = tier === 'generational_vault';
    const now = new Date();

    // ── Gift Purchase Fork ──────────────────────────────────────────
    if (isGift && adminDb) {
      // Find voucher created for this session
      const voucherQuery = await adminDb
        .collection('gift_vouchers')
        .where('stripeSessionId', '==', stripeSession.id)
        .limit(1)
        .get();

      let voucherCode = '';
      let giftDocData: any = null;
      if (!voucherQuery.empty) {
        voucherCode = voucherQuery.docs[0].id;
        giftDocData = voucherQuery.docs[0].data();
      }

      return NextResponse.json({
        success: true,
        verified: isPaid,
        isGift: true,
        tier,
        voucherCode: voucherCode || null,
        recipientName: giftDocData?.recipientName || stripeSession.metadata?.recipientName || 'Honoured Storyteller',
        giverName: giftDocData?.giverName || stripeSession.metadata?.giverName || 'Family Producer',
        giftMessage: giftDocData?.giftMessage || stripeSession.metadata?.giftMessage || '',
        deliveryMode: giftDocData?.deliveryMode || stripeSession.metadata?.deliveryMode || 'instant_link',
      });
    }

    if (isPaid && adminDb) {
      const userRef = adminDb.collection('users').doc(uid);
      const paymentRef = userRef.collection('payments').doc(stripeSession.id);

      const userDoc = await userRef.get();
      const userData = userDoc.data();

      const currentStorageUsed = userData?.storageQuota?.used ?? userData?.storageUsedBytes ?? 0;
      const tierConfig = PRICING_TIERS_CONFIG[tier] || PRICING_TIERS_CONFIG.director;
      const newTotalQuotaBytes = tierConfig.storageQuotaBytes;

      let newExpiryDate: string | null = null;
      if (!isLifetime) {
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
        stripeCustomerId: stripeSession.customer ? String(stripeSession.customer) : (userData?.stripeCustomerId || null),
        stripeSessionId: stripeSession.id,
        lastPaymentDate: now.toISOString(),
        paidDirectorPassExpiryDate: newExpiryDate,
      };

      if (stripeSession.subscription) {
        updates.stripeSubscriptionId = String(stripeSession.subscription);
      }

      const batch = adminDb.batch();
      batch.set(userRef, updates, { merge: true });
      batch.set(paymentRef, {
        sessionId: stripeSession.id,
        stripeCustomerId: stripeSession.customer || null,
        stripeSubscriptionId: stripeSession.subscription || null,
        tier,
        amountTotal: stripeSession.amount_total,
        currency: stripeSession.currency,
        paymentStatus: stripeSession.payment_status,
        createdAt: new Date().toISOString(),
        customerEmail: stripeSession.customer_details?.email || stripeSession.metadata?.userEmail || null,
      }, { merge: true });

      await batch.commit();
      console.log(`[verify-session] Verified & activated ${tier} for UID ${uid}`);

      return NextResponse.json({
        success: true,
        verified: true,
        tier,
        membershipTier: updates.membershipTier,
        vaultQuotaGb: updates.vaultQuotaGb,
        directorPassStatus: updates.directorPassStatus,
        hasStripeCustomer: Boolean(updates.stripeCustomerId),
        paidDirectorPassExpiryDate: newExpiryDate,
      });
    }

    return NextResponse.json({
      success: true,
      verified: isPaid,
      tier,
    });
  } catch (error: any) {
    console.error('Error verifying Stripe checkout session:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to verify checkout session.' },
      { status: 500 }
    );
  }
}
