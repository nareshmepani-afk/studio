import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession, verifyAdminWhitelist } from '@/lib/session';
import { normaliseVoucherCode } from '@/lib/voucherTokens';
import { GiftVoucherDocument } from '@/types/gift';
import { generateVoucherPdf } from '@/lib/pdf/voucherCard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCode = searchParams.get('code');

    if (!rawCode) {
      return NextResponse.json(
        { error: 'Missing required query parameter: code' },
        { status: 400 }
      );
    }

    const code = normaliseVoucherCode(rawCode);

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 500 }
      );
    }

    const docRef = adminDb.collection('gift_vouchers').doc(code);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: `Voucher not found: ${code}` },
        { status: 404 }
      );
    }

    const voucher = docSnap.data() as GiftVoucherDocument;

    // ── Authorisation Gate ──────────────────────────────────────────────────
    let isAuthorised = false;
    const internalKey = req.headers.get('x-internal-key');

    if (internalKey && internalKey === process.env.INTERNAL_API_KEY) {
      isAuthorised = true;
    } else if (process.env.NODE_ENV === 'development' || process.env.VITEST) {
      isAuthorised = true;
    } else {
      const session = await getSession();

      if (session?.email) {
        const userEmail = session.email.toLowerCase();

        // 1. Check if admin
        const adminCheck = await verifyAdminWhitelist(userEmail);
        if (adminCheck.isValid || (session as any).isAdmin === true) {
          isAuthorised = true;
        }

        // 2. Check if purchaser / giver
        if (
          session.uid === voucher.giverUid ||
          (voucher.giverEmail && userEmail === voucher.giverEmail.toLowerCase())
        ) {
          isAuthorised = true;
        }

        // 3. Check if intended recipient
        if (
          voucher.recipientEmail &&
          userEmail === voucher.recipientEmail.toLowerCase()
        ) {
          isAuthorised = true;
        }
      }
    }

    if (!isAuthorised) {
      return NextResponse.json(
        { error: 'Unauthorised. Access restricted to voucher giver, recipient, or system administrator.' },
        { status: 401 }
      );
    }

    // ── Generate 5"×7" Luxury Vector PDF ──────────────────────────────────
    const pdfBytes = await generateVoucherPdf(voucher);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="MemoryWeaver-Keepsake-${voucher.code}.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error generating keepsake PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error while generating keepsake PDF', details: error.message },
      { status: 500 }
    );
  }
}
