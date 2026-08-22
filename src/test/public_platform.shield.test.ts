import { describe, it, expect, vi } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { sendContactAction } from '@/actions/sendContactAction';

describe('Public Platform & Compliance Shield (MW-84)', () => {
  describe('robots.ts configuration', () => {
    it('allows public marketing, legal, and cinema index routes', () => {
      const robotsConfig = robots();
      const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
      expect(rules).toBeDefined();

      const allowList = Array.isArray(rules?.allow) ? rules.allow : [rules?.allow];
      expect(allowList).toContain('/');
      expect(allowList).toContain('/how-it-works');
      expect(allowList).toContain('/pricing');
      expect(allowList).toContain('/contact');
      expect(allowList).toContain('/legal/');
      expect(allowList).toContain('/cinema');
      expect(allowList).toContain('/login');
      expect(allowList).toContain('/register');
    });

    it('strictly disallows private studio and backend routes from search engine crawlers', () => {
      const robotsConfig = robots();
      const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
      const disallowList = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];

      expect(disallowList).toContain('/dashboard');
      expect(disallowList).toContain('/studio');
      expect(disallowList).toContain('/admin');
      expect(disallowList).toContain('/settings');
      expect(disallowList).toContain('/create');
      expect(disallowList).toContain('/review');
      expect(disallowList).toContain('/requests');
      expect(disallowList).toContain('/api/');
    });
  });

  describe('sitemap.ts sanitisation', () => {
    it('contains only hardcoded static public routes without leaking dynamic memory IDs', () => {
      const map = sitemap();
      expect(Array.isArray(map)).toBe(true);

      const urls = map.map((entry) => entry.url);
      expect(urls).toContain('https://memoryweaver.studio');
      expect(urls).toContain('https://memoryweaver.studio/how-it-works');
      expect(urls).toContain('https://memoryweaver.studio/pricing');
      expect(urls).toContain('https://memoryweaver.studio/contact');
      expect(urls).toContain('https://memoryweaver.studio/cinema');
      expect(urls).toContain('https://memoryweaver.studio/legal/terms');
      expect(urls).toContain('https://memoryweaver.studio/legal/privacy');
      expect(urls).toContain('https://memoryweaver.studio/legal/cookies');

      // Verify zero dynamic or parameterized routes exist in the sitemap
      map.forEach((entry) => {
        expect(entry.url).not.toMatch(/[?&]id=/);
        expect(entry.url).not.toMatch(/\/studio\//);
        expect(entry.url).not.toMatch(/\/dashboard/);
      });
    });
  });

  describe('sendContactAction validation', () => {
    it('rejects submissions with missing fields', async () => {
      const result = await sendContactAction({
        name: '',
        email: 'test@example.com',
        category: 'General Enquiry',
        message: 'Hello',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('All fields are required.');
    });

    it('rejects invalid email formats', async () => {
      const result = await sendContactAction({
        name: 'Jane Doe',
        email: 'not-an-email',
        category: 'General Enquiry',
        message: 'Hello team',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('valid email');
    });

    it('rejects excessively long messages over 5000 characters', async () => {
      const longMessage = 'a'.repeat(5001);
      const result = await sendContactAction({
        name: 'Jane Doe',
        email: 'jane@example.com',
        category: 'General Enquiry',
        message: longMessage,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('under 5,000 characters');
    });
  });
});
