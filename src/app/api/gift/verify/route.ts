import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { normaliseVoucherCode } from '@/lib/voucherTokens';
import { GiftVoucherDocument, VoucherVerifyResult } from '@/types/gift';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter
const ipRequests = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_IP = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequests.get(ip);

  if (!record || now > record.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_IP) {
    return false;
  }

  record.count += 1;
  return true;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-forwarded-for',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/gift/verify',
    method: 'POST',
    description: 'Memory Weaver Gift Voucher Verification API',
    usage: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { code: 'MW-VAULT-XXXX-XXXX' },
    },
    version: '1.1.0-beta',
  }, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: CORS_HEADERS });
    }

    const body = await req.json().catch(() => ({}));
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false }, { headers: CORS_HEADERS });
    }

    const normalisedCode = normaliseVoucherCode(code);

    if (!adminDb) {
      throw new Error('Firebase Admin DB not initialized');
    }

    const voucherRef = adminDb.collection('gift_vouchers').doc(normalisedCode);
    const voucherSnap = await voucherRef.get();

    if (!voucherSnap.exists) {
      // Track failed attempt on the IP's rate limit only (no doc to update)
      return NextResponse.json({ valid: false }, { headers: CORS_HEADERS });
    }

    const voucher = voucherSnap.data() as GiftVoucherDocument;

    const result: VoucherVerifyResult = {
      valid: true,
      tier: voucher.tier,
      giverName: voucher.giverName,
      recipientName: voucher.recipientName,
      giftMessage: voucher.giftMessage,
      status: voucher.status,
      unboxingLanguage: voucher.unboxingLanguage,
    };

    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('Error verifying gift voucher:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}
