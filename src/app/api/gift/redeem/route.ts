import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import { GiftVoucherDocument, RedemptionResult } from '@/types/gift';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.uid || !session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    if (!adminDb) {
      throw new Error('Firebase Admin DB not initialized');
    }

    const result = await adminDb.runTransaction(async (transaction) => {
      const voucherRef = adminDb!.collection('gift_vouchers').doc(code.toUpperCase());
      const voucherSnap = await transaction.get(voucherRef);

      if (!voucherSnap.exists) {
        throw { status: 404, code: 'VOUCHER_NOT_FOUND', message: 'Voucher not found' };
      }

      const voucher = voucherSnap.data() as GiftVoucherDocument;

      if (voucher.status !== 'unredeemed') {
        throw { status: 409, code: 'VOUCHER_ALREADY_REDEEMED', message: 'Voucher is already redeemed or revoked' };
      }

      const userRef = adminDb!.collection('users').doc(session.uid);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) {
        throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
      }

      const userData = userSnap.data()!;

      if (userData.membershipTier === 'generational_vault' && voucher.tier === 'generational_vault') {
        throw { status: 409, code: 'ALREADY_LIFETIME_HOLDER', message: 'You already have a lifetime Generational Vault' };
      }

      let paidDirectorPassExpiryDate = userData.paidDirectorPassExpiryDate || null;
      if (voucher.tier === 'director') {
        const now = new Date();
        const currentExpiry = paidDirectorPassExpiryDate ? new Date(paidDirectorPassExpiryDate) : now;
        const baseDate = currentExpiry > now ? currentExpiry : now;
        baseDate.setDate(baseDate.getDate() + 31);
        paidDirectorPassExpiryDate = baseDate.toISOString();
      }

      const currentStorageUsed = userData.storageQuota?.used ?? userData.storageUsedBytes ?? 0;
      const targetQuotaGb = Math.max(userData.vaultQuotaGb || 0, voucher.vaultQuotaGb);
      const newStorageTotal = targetQuotaGb * 1024 * 1024 * 1024;

      const nowString = new Date().toISOString();

      transaction.update(userRef, {
        directorPassStatus: 'paid_host_pass_active',
        membershipTier: voucher.tier === 'generational_vault'
          ? 'generational_vault'
          : (userData.membershipTier || 'director_pass'),
        vaultQuotaGb: targetQuotaGb,
        storageQuota: {
          used: currentStorageUsed,
          total: newStorageTotal,
        },
        paidDirectorPassExpiryDate: voucher.tier === 'generational_vault' ? null : paidDirectorPassExpiryDate,
        giftRedeemedCode: voucher.code,
        giftGiverName: voucher.giverName,
        updatedAt: nowString,
      });

      transaction.update(voucherRef, {
        status: 'redeemed',
        redeemedByUid: session.uid,
        redeemedByEmail: session.email,
        redeemedAt: nowString,
      });

      return {
        tier: voucher.tier,
        giverName: voucher.giverName,
        vaultQuotaGb: voucher.vaultQuotaGb,
        giftMessage: voucher.giftMessage,
      } as RedemptionResult;
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error('Error redeeming gift voucher:', error);
    if (error.status && error.code) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
