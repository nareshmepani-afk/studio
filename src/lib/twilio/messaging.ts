import { getTwilioClient } from './client';

/**
 * 📨 Twilio Unified Messaging Abstraction (SMS & WhatsApp)
 *
 * Milestone: MW-90 Twilio Resilient Messaging Subsystem
 * Constitutional Invariants:
 *  - Rule 5: Zero Localhost Testing (Edge fallback strictly https://dev.memoryweaver.studio)
 *  - Rule 20: British English Orthography (sanitisation, initialised, prioritised)
 */

export interface SendMessageOptions {
  to: string;
  body?: string;
  contentSid?: string;
  contentVariables?: Record<string, string>;
  channel: 'sms' | 'whatsapp';
  statusCallback?: string;
}

export interface DispatchResult {
  success: boolean;
  messageSid?: string;
  channel: 'sms' | 'whatsapp';
  to: string;
  from: string;
  status?: string;
  error?: {
    code?: number;
    status?: number;
    message: string;
    moreInfo?: string;
  };
}

export class TwilioDispatchError extends Error {
  code?: number;
  status?: number;
  moreInfo?: string;

  constructor(message: string, code?: number, status?: number, moreInfo?: string) {
    super(message);
    this.name = 'TwilioDispatchError';
    this.code = code;
    this.status = status;
    this.moreInfo = moreInfo;
  }
}

/**
 * Sanitises phone numbers into strict E.164 format (+[country_code][national_number]).
 * Automatically converts domestic UK mobile numbers (07...) into international +447 format.
 */
export function sanitiseE164Number(rawNumber: string): string {
  if (!rawNumber || typeof rawNumber !== 'string') {
    throw new Error('Phone number must be a non-empty string.');
  }

  // Strip whitespace, hyphens, parentheses, and dots
  let cleaned = rawNumber.trim().replace(/[\s\-\(\)\.]/g, '');

  // Strip leading whatsapp: if present to sanitise the underlying phone digits
  const isWhatsApp = cleaned.toLowerCase().startsWith('whatsapp:');
  if (isWhatsApp) {
    cleaned = cleaned.slice(9);
  }

  // Handle domestic UK numbers: e.g. 07123456789 -> +447123456789
  if (/^0[1-9]\d{8,13}$/.test(cleaned)) {
    cleaned = `+44${cleaned.slice(1)}`;
  } else if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }

  // Validate E.164 format: + followed by 7 to 15 digits, non-zero first digit
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  if (!e164Regex.test(cleaned)) {
    throw new Error(`Invalid E.164 phone number format: "${rawNumber}". Must be +[country_code][number] with 7-15 digits.`);
  }

  return cleaned;
}

/**
 * Ensures a phone number or WhatsApp handle is prefixed with 'whatsapp:'.
 * Idempotent operation: does not duplicate 'whatsapp:' if already prefixed.
 */
export function formatWhatsAppHandle(phoneNumber: string): string {
  const sanitised = sanitiseE164Number(phoneNumber);
  return `whatsapp:${sanitised}`;
}

/**
 * Resolves the edge status callback URL with strict Zero-Localhost invariant.
 */
export function resolveStatusCallbackUrl(customCallback?: string): string {
  if (customCallback) {
    return customCallback;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://dev.memoryweaver.studio').trim();
  const cleanAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;

  return `${cleanAppUrl}/api/twilio/status-callback`;
}

/**
 * Unified dispatch entry point for SMS and WhatsApp messages.
 */
export async function sendTwilioMessage(options: SendMessageOptions): Promise<DispatchResult> {
  const client = getTwilioClient();

  if (!client) {
    const errorMsg = 'Twilio client not initialised: Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN.';
    return {
      success: false,
      channel: options.channel,
      to: options.to,
      from: '',
      error: { message: errorMsg },
    };
  }

  const isWhatsApp = options.channel === 'whatsapp';

  // Sanitise recipient number
  let to: string;
  try {
    to = isWhatsApp ? formatWhatsAppHandle(options.to) : sanitiseE164Number(options.to);
  } catch (err: any) {
    return {
      success: false,
      channel: options.channel,
      to: options.to,
      from: '',
      error: { message: err.message },
    };
  }

  // Resolve sender number from environment
  const rawSender = isWhatsApp
    ? (process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER)
    : process.env.TWILIO_PHONE_NUMBER;

  if (!rawSender) {
    const missingVar = isWhatsApp ? 'TWILIO_WHATSAPP_NUMBER or TWILIO_PHONE_NUMBER' : 'TWILIO_PHONE_NUMBER';
    return {
      success: false,
      channel: options.channel,
      to,
      from: '',
      error: { message: `Sender number not configured: Set ${missingVar} in environment.` },
    };
  }

  let from: string;
  try {
    from = isWhatsApp ? formatWhatsAppHandle(rawSender) : sanitiseE164Number(rawSender);
  } catch (err: any) {
    return {
      success: false,
      channel: options.channel,
      to,
      from: rawSender,
      error: { message: `Invalid configured sender number: ${err.message}` },
    };
  }

  const statusCallback = resolveStatusCallbackUrl(options.statusCallback);

  // Construct payload per Twilio Messaging API specs
  const payload: Record<string, any> = {
    to,
    from,
    statusCallback,
  };

  if (options.contentSid) {
    payload.contentSid = options.contentSid;
    if (options.contentVariables) {
      payload.contentVariables = JSON.stringify(options.contentVariables);
    }
  } else if (options.body) {
    payload.body = options.body;
  } else {
    return {
      success: false,
      channel: options.channel,
      to,
      from,
      error: { message: 'Either body or contentSid must be provided for message dispatch.' },
    };
  }

  try {
    const response = await client.messages.create(payload as any);

    return {
      success: true,
      messageSid: response.sid,
      channel: options.channel,
      to,
      from,
      status: response.status,
    };
  } catch (err: any) {
    // Unpack Twilio REST API exception fields
    const code = err.code || err.status || undefined;
    const status = err.status || undefined;
    const message = err.message || 'Unknown Twilio API dispatch failure';
    const moreInfo = err.moreInfo || undefined;

    console.error(`[Twilio] Dispatch failed to ${to} (${options.channel}):`, {
      code,
      status,
      message,
      moreInfo,
    });

    return {
      success: false,
      channel: options.channel,
      to,
      from,
      error: {
        code,
        status,
        message,
        moreInfo,
      },
    };
  }
}
