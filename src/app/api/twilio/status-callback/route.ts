import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Twilio-Signature, x-forwarded-for',
};

/**
 * Rule 33: Universal File Origin CORS Preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Rule 32: Dual-Method API Diagnostic Architecture Standard (Self-Documenting GET)
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'online',
      endpoint: '/api/twilio/status-callback',
      method: 'POST',
      description: 'Twilio Message Delivery Status Webhook Receiver (SMS & WhatsApp)',
      usage: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': '<twilio-hmac-sha1-signature>',
        },
        payload: {
          MessageSid: 'SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          MessageStatus: 'delivered | undelivered | failed | sent',
          To: '+447...',
          From: '+447...',
        },
      },
      edgeUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://dev.memoryweaver.studio',
      version: '1.1.0-beta',
    },
    { headers: CORS_HEADERS }
  );
}

/**
 * POST Webhook Handler for Twilio Delivery Status Callbacks
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const searchParams = new URLSearchParams(rawBody);
    const params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const signature = req.headers.get('x-twilio-signature') || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';

    // Reconstruct edge URL with strict Zero-Localhost invariant
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://dev.memoryweaver.studio').trim().replace(/\/$/, '');
    const webhookUrl = `${appUrl}/api/twilio/status-callback`;

    // Signature verification (bypassed only when test bypass flag is active)
    const isTestBypass = process.env.NODE_ENV === 'test' && process.env.SKIP_TWILIO_SIGNATURE_VERIFY === 'true';

    if (!isTestBypass) {
      if (!signature || !authToken) {
        console.warn('[Twilio Webhook] Rejected: Missing signature or TWILIO_AUTH_TOKEN not configured.');
        return NextResponse.json(
          { error: 'Missing Twilio signature or authentication token' },
          { status: 403, headers: CORS_HEADERS }
        );
      }

      const isValid = twilio.validateRequest(authToken, signature, webhookUrl, params);

      if (!isValid) {
        console.warn(`[Twilio Webhook] Signature verification failed for URL: ${webhookUrl}`);
        return NextResponse.json(
          { error: 'Invalid Twilio signature' },
          { status: 403, headers: CORS_HEADERS }
        );
      }
    }

    const messageSid = params.MessageSid || params.SmsSid || 'unknown-sid';
    const messageStatus = params.MessageStatus || params.SmsStatus || 'unknown-status';
    const to = params.To || '';
    const from = params.From || '';
    const errorCode = params.ErrorCode || null;
    const errorMessage = params.ErrorMessage || null;

    // Terminal carrier delivery state logging
    const terminalStates = ['delivered', 'undelivered', 'failed'];
    const isTerminal = terminalStates.includes(messageStatus.toLowerCase());

    if (isTerminal) {
      console.log(`[Twilio Status] Terminal carrier state [${messageStatus.toUpperCase()}] for SID: ${messageSid}`, {
        to,
        from,
        errorCode,
        errorMessage,
      });
    } else {
      console.log(`[Twilio Status] Interim state [${messageStatus}] for SID: ${messageSid}`);
    }

    return NextResponse.json(
      {
        received: true,
        messageSid,
        status: messageStatus,
        isTerminal,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('[Twilio Webhook] Processing error:', error);
    return NextResponse.json(
      { error: 'Internal status callback processing failure', details: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
