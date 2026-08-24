import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  STUDIO_EMAILS,
  STUDIO_EMAIL_SENDERS,
  STUDIO_EMAIL_DIRECTORY,
  getEmailConfigByAddress,
  getPublicFacingEmails,
} from '@/config/emailConfig';
import { sendWelcomeEmailAction } from '@/actions/sendWelcomeEmailAction';
import { sendBugReportAction } from '@/actions/sendBugReportAction';
import { sendContactAction } from '@/actions/sendContactAction';
import { sendAdminTestEmailAction, retriggerClientOnboardingPassAction } from '@/app/admin/emailActions';

// Hoist mock dispatch capture
const mockSend = vi.fn().mockResolvedValue({
  data: { id: 'mock_resend_msg_123' },
  error: null,
});

vi.mock('resend', () => {
  return {
    Resend: class {
      emails = {
        send: mockSend,
      };
    },
  };
});

vi.mock('@/lib/session', () => ({
  getSession: vi.fn().mockResolvedValue({ email: 'nareshmepani@googlemail.com' }),
  verifyAdminWhitelist: vi.fn().mockResolvedValue({ isValid: true }),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: (key: string) => {
      if (key === 'host') return 'dev.memoryweaver.studio';
      return null;
    },
  }),
}));

describe('Centralized Email Configuration & Domain Routing Directory', () => {
  beforeEach(() => {
    mockSend.mockClear();
    process.env.RESEND_API_KEY = 're_test_mock_key_12345';
  });

  describe('SSOT Registry & Metadata Verification', () => {
    it('should define all expected @memoryweaver.studio standard addresses', () => {
      expect(STUDIO_EMAILS.STUDIO).toBe('studio@memoryweaver.studio');
      expect(STUDIO_EMAILS.SUPPORT).toBe('support@memoryweaver.studio');
      expect(STUDIO_EMAILS.DIRECTOR).toBe('director@memoryweaver.studio');
      expect(STUDIO_EMAILS.NOREPLY).toBe('noreply@memoryweaver.studio');
      expect(STUDIO_EMAILS.DMARC).toBe('dmarc@memoryweaver.studio');

      Object.values(STUDIO_EMAILS).forEach((email) => {
        expect(email).toMatch(/^[a-z0-9._%+-]+@memoryweaver\.studio$/);
      });
    });

    it('should format sender headers with matching email addresses', () => {
      expect(STUDIO_EMAIL_SENDERS.STUDIO).toBe('Memory Weaver Studio <studio@memoryweaver.studio>');
      expect(STUDIO_EMAIL_SENDERS.SUPPORT).toBe('Memory Weaver Support <support@memoryweaver.studio>');
      expect(STUDIO_EMAIL_SENDERS.DIRECTOR).toBe('Memory Weaver Director Concierge <director@memoryweaver.studio>');
      expect(STUDIO_EMAIL_SENDERS.NOREPLY).toBe('Memory Weaver <noreply@memoryweaver.studio>');
      expect(STUDIO_EMAIL_SENDERS.CONTACT).toBe('Memory Weaver Contact <noreply@memoryweaver.studio>');
    });

    it('should define complete metadata for all directory entries', () => {
      expect(STUDIO_EMAIL_DIRECTORY).toHaveLength(5);

      STUDIO_EMAIL_DIRECTORY.forEach((item) => {
        expect(item.key).toBeTruthy();
        expect(item.address).toMatch(/@memoryweaver\.studio$/);
        expect(item.displayName).toBeTruthy();
        expect(item.formattedSender).toBeTruthy();
        expect(item.role).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(item.category).toBeTruthy();
        expect(item.inboundRouting.provider).toBeTruthy();
        expect(item.inboundRouting.destination).toBeTruthy();
        expect(item.outboundRouting.provider).toBeTruthy();
      });
    });

    it('should configure studio@ with Cloudflare Email Routing inbound and Resend SMTP outbound', () => {
      const studioConfig = getEmailConfigByAddress('studio@memoryweaver.studio');
      expect(studioConfig).toBeDefined();
      expect(studioConfig?.key).toBe('studio');
      expect(studioConfig?.inboundRouting.provider).toBe('Cloudflare Email Routing');
      expect(studioConfig?.inboundRouting.destination).toContain('Gmail');
      expect(studioConfig?.inboundRouting.isForwardingActive).toBe(true);
      expect(studioConfig?.outboundRouting.provider).toBe('Resend SMTP (Gmail Send-As)');
      expect(studioConfig?.isPublicFacing).toBe(true);
    });

    it('should correctly look up email configs by address or key (case-insensitive)', () => {
      expect(getEmailConfigByAddress('STUDIO@MEMORYWEAVER.STUDIO')?.key).toBe('studio');
      expect(getEmailConfigByAddress('support')?.address).toBe('support@memoryweaver.studio');
      expect(getEmailConfigByAddress('director@memoryweaver.studio')?.displayName).toBe('Memory Weaver Director Concierge');
      expect(getEmailConfigByAddress('nonexistent@domain.com')).toBeUndefined();
    });

    it('should filter public-facing emails accurately', () => {
      const publicEmails = getPublicFacingEmails();
      const publicAddresses = publicEmails.map((e) => e.address);
      expect(publicAddresses).toContain('studio@memoryweaver.studio');
      expect(publicAddresses).toContain('support@memoryweaver.studio');
      expect(publicAddresses).not.toContain('noreply@memoryweaver.studio');
      expect(publicAddresses).not.toContain('dmarc@memoryweaver.studio');
    });
  });

  describe('Server Action Email Dispatcher Verification', () => {
    it('sendWelcomeEmailAction dispatches using STUDIO_EMAIL_SENDERS.STUDIO', async () => {
      const res = await sendWelcomeEmailAction({
        email: 'patron@example.com',
        name: 'Eleanor Vance',
      });

      expect(res.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: STUDIO_EMAIL_SENDERS.STUDIO,
          to: 'patron@example.com',
          subject: expect.stringContaining('Welcome to Memory Weaver Studio'),
        })
      );
    });

    it('sendBugReportAction dispatches using STUDIO_EMAIL_SENDERS.SUPPORT to STUDIO_EMAILS.SUPPORT', async () => {
      const res = await sendBugReportAction({
        description: 'Test fast-track bug report',
        diagnostics: {
          traceId: 'mw_trace_test_999',
          userId: 'user_123',
          userEmail: 'director@example.com',
          userAgent: 'Mozilla/5.0',
          path: '/studio',
          timestamp: new Date().toISOString(),
          version: 'v1.1.0-beta',
        },
      });

      expect(res.success).toBe(true);
      // 1. Support alert
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: STUDIO_EMAIL_SENDERS.SUPPORT,
          to: STUDIO_EMAILS.SUPPORT,
          replyTo: 'director@example.com',
          subject: expect.stringContaining('mw_trace_test_999'),
        })
      );
      // 2. Patron confirmation receipt
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: STUDIO_EMAIL_SENDERS.SUPPORT,
          to: 'director@example.com',
          subject: expect.stringContaining('mw_trace_test_999'),
        })
      );
    });

    it('sendContactAction dispatches using STUDIO_EMAIL_SENDERS.CONTACT to STUDIO_EMAILS.SUPPORT', async () => {
      const res = await sendContactAction({
        name: 'Arthur Pendelton',
        email: 'arthur@example.com',
        category: 'Preservation Inquiry',
        message: 'Looking to preserve our 1964 family archive.',
      });

      expect(res.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: STUDIO_EMAIL_SENDERS.CONTACT,
          to: [STUDIO_EMAILS.SUPPORT],
          replyTo: 'arthur@example.com',
          subject: expect.stringContaining('Arthur Pendelton'),
        })
      );
    });

    it('sendAdminTestEmailAction dispatches test template using STUDIO_EMAIL_SENDERS.STUDIO', async () => {
      const res = await sendAdminTestEmailAction({
        templateId: 'welcome_host_pass',
        targetEmail: 'nareshmepani@googlemail.com',
        customProps: {
          name: 'Director Naresh',
        },
      });

      expect(res.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: STUDIO_EMAIL_SENDERS.STUDIO,
          to: 'nareshmepani@googlemail.com',
          replyTo: STUDIO_EMAILS.SUPPORT,
        })
      );
    });

    it('retriggerClientOnboardingPassAction dispatches host pass using STUDIO_EMAIL_SENDERS.STUDIO', async () => {
      const res = await retriggerClientOnboardingPassAction('client@example.com', 'Storyteller Client');

      expect(res.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: STUDIO_EMAIL_SENDERS.STUDIO,
          to: 'client@example.com',
          replyTo: STUDIO_EMAILS.SUPPORT,
        })
      );
    });
  });
});
