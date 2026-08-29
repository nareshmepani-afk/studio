import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession, verifyAdminWhitelist } from '@/lib/session';
import { generateVoucherCode, validateVanityCode, checkCodeExists } from '@/lib/voucherTokens';
import { GiftVoucherDocument, GiftTier, DeliveryMode, UnboxingLanguage } from '@/types/gift';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/gift/create',
    method: 'POST (Admin / Internal)',
    description: 'Memory Weaver Internal Gift Voucher Creation API',
    version: '1.1.0-beta',
  });
}

export async function POST(req: NextRequest) {
  try {
    const internalKey = req.headers.get('x-internal-key');
    let isAuthorized = false;

    if (internalKey && internalKey === process.env.INTERNAL_API_KEY) {
      isAuthorized = true;
    } else {
      const session = await getSession();
      if (session?.email) {
        const adminCheck = await verifyAdminWhitelist(session.email);
        if (adminCheck.isValid) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      tier,
      giverUid,
      giverName,
      giverEmail,
      giftMessage,
      recipientName,
      recipientEmail,
      deliveryMode,
      scheduledDeliveryDate,
      unboxingLanguage,
      stripeSessionId,
      stripePaymentIntentId,
      amountPaid,
      currency,
      vanityCode
    } = body;

    if (!tier || !['director', 'generational_vault'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    let code = '';
    if (vanityCode) {
      const validation = validateVanityCode(vanityCode);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.reason }, { status: 400 });
      }
      const exists = await checkCodeExists(vanityCode.toUpperCase());
      if (exists) {
        return NextResponse.json({ error: 'Vanity code already exists' }, { status: 409 });
      }
      code = vanityCode.toUpperCase();
    } else {
      code = await generateVoucherCode(tier as GiftTier);
    }

    const isFounderMint = !stripeSessionId;
    const durationDays = tier === 'director' ? 31 : null;
    const vaultQuotaGb = tier === 'director' ? 15 : 100;

    const voucherDoc: GiftVoucherDocument = {
      code,
      tier: tier as GiftTier,
      vaultQuotaGb,
      durationDays,
      status: 'unredeemed',
      giverUid,
      giverName,
      giverEmail,
      giftMessage,
      recipientName,
      recipientEmail: recipientEmail || null,
      deliveryMode: deliveryMode as DeliveryMode,
      scheduledDeliveryDate: scheduledDeliveryDate || null,
      unboxingLanguage: (unboxingLanguage as UnboxingLanguage) || 'en',
      isFounderMint,
      stripeSessionId: stripeSessionId || null,
      stripePaymentIntentId: stripePaymentIntentId || null,
      amountPaid: amountPaid || 0,
      currency: currency || 'gbp',
      purchasedAt: new Date().toISOString(),
      failedAttempts: 0,
      expiresAt: null,
    };

    if (!adminDb) {
      throw new Error('Firebase Admin DB not initialized');
    }

    await adminDb.collection('gift_vouchers').doc(code).set(voucherDoc);

    return NextResponse.json({ code, tier });
  } catch (error: any) {
    console.error('Error creating gift voucher:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
