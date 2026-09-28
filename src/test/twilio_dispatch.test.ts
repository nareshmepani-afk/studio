import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitiseE164Number,
  formatWhatsAppHandle,
  resolveStatusCallbackUrl,
  sendTwilioMessage,
} from '@/lib/twilio/messaging';
import { GET as statusGet, POST as statusPost, OPTIONS as statusOptions } from '@/app/api/twilio/status-callback/route';
import { NextRequest } from 'next/server';
import twilio from 'twilio';

// Mock Twilio SDK client
const mockCreateMessage = vi.fn();
const mockTwilioInstance = {
  messages: {
    create: mockCreateMessage,
  },
};

vi.mock('@/lib/twilio/client', () => ({
  getTwilioClient: vi.fn(() => mockTwilioInstance),
}));

describe('MW-90: Twilio Messaging Subsystem (Zero Localhost Invariant)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TWILIO_ACCOUNT_SID = 'AC_test_account_sid';
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token_secret';
    process.env.TWILIO_PHONE_NUMBER = '+447000000001';
    process.env.TWILIO_WHATSAPP_NUMBER = '+447000000002';
    process.env.NEXT_PUBLIC_APP_URL = 'https://dev.memoryweaver.studio';
  });

  describe('1. E.164 Number Sanitisation & Formatting', () => {
    it('preserves clean international E.164 numbers', () => {
      expect(sanitiseE164Number('+447123456789')).toBe('+447123456789');
      expect(sanitiseE164Number('+14155552671')).toBe('+14155552671');
    });

    it('cleans whitespace, hyphens, and brackets from phone numbers', () => {
      expect(sanitiseE164Number('+44 (0) 7123-456 789')).toBe('+4407123456789');
      expect(sanitiseE164Number('+1 (555) 234-5678')).toBe('+15552345678');
    });

    it('automatically converts domestic UK mobile numbers (07...) to +447 format', () => {
      expect(sanitiseE164Number('07123 456789')).toBe('+447123456789');
      expect(sanitiseE164Number('07987-654321')).toBe('+447987654321');
    });

    it('strips leading whatsapp: handle when sanitising the underlying phone digits', () => {
      expect(sanitiseE164Number('whatsapp:+447123456789')).toBe('+447123456789');
    });

    it('throws descriptive error on malformed or empty inputs', () => {
      expect(() => sanitiseE164Number('')).toThrow('Phone number must be a non-empty string.');
      expect(() => sanitiseE164Number('invalid-phone')).toThrow('Invalid E.164 phone number format');
      expect(() => sanitiseE164Number('+012345')).toThrow('Invalid E.164 phone number format');
      expect(() => sanitiseE164Number('12345')).toThrow('Invalid E.164 phone number format');
    });
  });

  describe('2. WhatsApp Handle Assembly (whatsapp: prefix)', () => {
    it('prepends whatsapp: prefix to standard E.164 number', () => {
      expect(formatWhatsAppHandle('+447123456789')).toBe('whatsapp:+447123456789');
      expect(formatWhatsAppHandle('07123456789')).toBe('whatsapp:+447123456789');
    });

    it('is idempotent and does not duplicate whatsapp: prefix', () => {
      expect(formatWhatsAppHandle('whatsapp:+447123456789')).toBe('whatsapp:+447123456789');
    });
  });

  describe('3. Zero-Localhost Status Callback Resolution', () => {
    it('resolves default status callback to dev.memoryweaver.studio staging edge', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      const callbackUrl = resolveStatusCallbackUrl();
      expect(callbackUrl).toBe('https://dev.memoryweaver.studio/api/twilio/status-callback');
      expect(callbackUrl).not.toContain('localhost');
      expect(callbackUrl).not.toContain('127.0.0.1');
    });

    it('respects configured NEXT_PUBLIC_APP_URL without trailing slash artifacts', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://dev.memoryweaver.studio/';
      const callbackUrl = resolveStatusCallbackUrl();
      expect(callbackUrl).toBe('https://dev.memoryweaver.studio/api/twilio/status-callback');
    });
  });

  describe('4. SMS Message Dispatch Assembly', () => {
    it('dispatches standard SMS with E.164 sender and edge callback', async () => {
      mockCreateMessage.mockResolvedValueOnce({
        sid: 'SM_test_sms_12345',
        status: 'queued',
      });

      const result = await sendTwilioMessage({
        to: '07123 456789',
        body: 'Your Memory Weaver Studio pass is ready.',
        channel: 'sms',
      });

      expect(result.success).toBe(true);
      expect(result.messageSid).toBe('SM_test_sms_12345');
      expect(result.to).toBe('+447123456789');
      expect(result.from).toBe('+447000000001');

      expect(mockCreateMessage).toHaveBeenCalledWith({
        to: '+447123456789',
        from: '+447000000001',
        body: 'Your Memory Weaver Studio pass is ready.',
        statusCallback: 'https://dev.memoryweaver.studio/api/twilio/status-callback',
      });
    });
  });

  describe('5. WhatsApp Message Dispatch Assembly (Templates & Body)', () => {
    it('dispatches WhatsApp message with whatsapp: prefixes on sender and recipient', async () => {
      mockCreateMessage.mockResolvedValueOnce({
        sid: 'SM_test_wa_12345',
        status: 'queued',
      });

      const result = await sendTwilioMessage({
        to: '+447123456789',
        body: 'Hello from Memory Weaver!',
        channel: 'whatsapp',
      });

      expect(result.success).toBe(true);
      expect(result.to).toBe('whatsapp:+447123456789');
      expect(result.from).toBe('whatsapp:+447000000002');

      expect(mockCreateMessage).toHaveBeenCalledWith({
        to: 'whatsapp:+447123456789',
        from: 'whatsapp:+447000000002',
        body: 'Hello from Memory Weaver!',
        statusCallback: 'https://dev.memoryweaver.studio/api/twilio/status-callback',
      });
    });

    it('assembles Content Template payload with stringified contentVariables', async () => {
      mockCreateMessage.mockResolvedValueOnce({
        sid: 'SM_test_content_sid_123',
        status: 'queued',
      });

      const result = await sendTwilioMessage({
        to: '+447123456789',
        contentSid: 'HX_template_voucher_redeem',
        contentVariables: {
          '1': 'Granddad Arthur',
          '2': 'MW-VAULT-2026',
        },
        channel: 'whatsapp',
      });

      expect(result.success).toBe(true);
      expect(mockCreateMessage).toHaveBeenCalledWith({
        to: 'whatsapp:+447123456789',
        from: 'whatsapp:+447000000002',
        contentSid: 'HX_template_voucher_redeem',
        contentVariables: JSON.stringify({
          '1': 'Granddad Arthur',
          '2': 'MW-VAULT-2026',
        }),
        statusCallback: 'https://dev.memoryweaver.studio/api/twilio/status-callback',
      });
    });
  });

  describe('6. Twilio REST API Error Handling', () => {
    it('catches and unpacks structured Twilio error metadata on failure', async () => {
      const twilioError = new Error('The number is not a valid WhatsApp user.');
      (twilioError as any).code = 63003;
      (twilioError as any).status = 400;
      (twilioError as any).moreInfo = 'https://www.twilio.com/docs/errors/63003';

      mockCreateMessage.mockRejectedValueOnce(twilioError);

      const result = await sendTwilioMessage({
        to: '+447123456789',
        body: 'Test failure',
        channel: 'whatsapp',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(63003);
      expect(result.error?.status).toBe(400);
      expect(result.error?.message).toContain('valid WhatsApp user');
      expect(result.error?.moreInfo).toBe('https://www.twilio.com/docs/errors/63003');
    });
  });

  describe('7. Edge Webhook Status Receiver Route (/api/twilio/status-callback)', () => {
    it('satisfies Rule 32 with a self-documenting GET diagnostic handler', async () => {
      const res = await statusGet();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('online');
      expect(json.endpoint).toBe('/api/twilio/status-callback');
      expect(json.edgeUrl).toBe('https://dev.memoryweaver.studio');
    });

    it('satisfies Rule 33 with an OPTIONS CORS preflight handler', async () => {
      const res = await statusOptions();
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('rejects POST with 403 when signature or auth token is missing', async () => {
      const req = new NextRequest('https://dev.memoryweaver.studio/api/twilio/status-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'MessageSid=SM123&MessageStatus=delivered',
      });

      const res = await statusPost(req);
      expect(res.status).toBe(403);
    });

    it('rejects POST with 403 when Twilio signature verification fails', async () => {
      vi.spyOn(twilio, 'validateRequest').mockReturnValueOnce(false);

      const req = new NextRequest('https://dev.memoryweaver.studio/api/twilio/status-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'invalid_signature_hash',
        },
        body: 'MessageSid=SM123&MessageStatus=delivered',
      });

      const res = await statusPost(req);
      expect(res.status).toBe(403);
    });

    it('accepts POST and identifies terminal delivery state (delivered)', async () => {
      vi.spyOn(twilio, 'validateRequest').mockReturnValueOnce(true);

      const req = new NextRequest('https://dev.memoryweaver.studio/api/twilio/status-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid_signature_hash',
        },
        body: 'MessageSid=SM_carrier_delivery_999&MessageStatus=delivered&To=%2B447123456789&From=%2B447000000001',
      });

      const res = await statusPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.messageSid).toBe('SM_carrier_delivery_999');
      expect(json.status).toBe('delivered');
      expect(json.isTerminal).toBe(true);
    });

    it('accepts POST and identifies non-terminal interim state (sent/queued)', async () => {
      vi.spyOn(twilio, 'validateRequest').mockReturnValueOnce(true);

      const req = new NextRequest('https://dev.memoryweaver.studio/api/twilio/status-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid_signature_hash',
        },
        body: 'MessageSid=SM_carrier_delivery_888&MessageStatus=sent&To=%2B447123456789&From=%2B447000000001',
      });

      const res = await statusPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.messageSid).toBe('SM_carrier_delivery_888');
      expect(json.status).toBe('sent');
      expect(json.isTerminal).toBe(false);
    });
  });
});
