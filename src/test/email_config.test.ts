import { describe, it, expect } from 'vitest';
import {
  STUDIO_EMAILS,
  STUDIO_EMAIL_SENDERS,
  STUDIO_EMAIL_DIRECTORY,
  getEmailConfigByAddress,
  getPublicFacingEmails,
} from '@/config/emailConfig';

describe('Centralized Email Configuration & Domain Routing Directory', () => {
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
    expect(STUDIO_EMAIL_SENDERS.STUDIO).toContain(STUDIO_EMAILS.STUDIO);
    expect(STUDIO_EMAIL_SENDERS.SUPPORT).toContain(STUDIO_EMAILS.SUPPORT);
    expect(STUDIO_EMAIL_SENDERS.DIRECTOR).toContain(STUDIO_EMAILS.DIRECTOR);
    expect(STUDIO_EMAIL_SENDERS.NOREPLY).toContain(STUDIO_EMAILS.NOREPLY);
    expect(STUDIO_EMAIL_SENDERS.CONTACT).toContain(STUDIO_EMAILS.NOREPLY);
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
