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

    // ── Status & Authorisation Gate ─────────────────────────────────────────
    if (voucher.status === 'revoked') {
      return NextResponse.json(
        { error: 'This heirloom voucher has been revoked.' },
        { status: 403 }
      );
    }

    // The unguessable 16-character Crockford Base32 voucher token acts as a bearer
    // capability key (mirroring the public unboxing stage at /unboxing/[code]).
    // Active session details (giver, recipient, or admin) are audited when present.
    let isAuthorised = true;
    const session = await getSession().catch(() => null);
    if (session?.email) {
      const userEmail = session.email.toLowerCase();
      const adminCheck = await verifyAdminWhitelist(userEmail).catch(() => ({ isValid: false }));
      const role = (adminCheck.isValid || (session as any).isAdmin)
        ? 'admin'
        : (session.uid === voucher.giverUid || userEmail === voucher.giverEmail?.toLowerCase())
        ? 'giver'
        : (userEmail === voucher.recipientEmail?.toLowerCase())
        ? 'recipient'
        : 'authenticated_viewer';
      
      console.log(`[Keepsake PDF] Generating PDF for voucher ${voucher.code}, requested by ${role} (${userEmail})`);
    } else {
      console.log(`[Keepsake PDF] Generating PDF for voucher ${voucher.code}, bearer token presented`);
    }

    // ── Generate 5"×7" Luxury Vector PDF ──────────────────────────────────
    const pdfBytes = await generateVoucherPdf(voucher);
    const isDownload = searchParams.get('download') === 'true';
    const disposition = isDownload ? 'attachment' : 'inline';

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="MemoryWeaver-Keepsake-${voucher.code}.pdf"`,
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
