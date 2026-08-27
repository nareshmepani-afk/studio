import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { BUSINESS_MANIFEST } from '@/config/businessRules';
import einsteinFixture from '@/fixtures/einstein.json';

// Mock framer-motion and nav router
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/studio',
}));

describe('Einstein Demo Quick-Start & Sandbox Shield', () => {
  it('should verify business manifest binds sandbox tier to p_einstein with write locks', () => {
    expect(BUSINESS_MANIFEST.tiers.sandbox.demoScript).toBe('p_einstein');
    expect(BUSINESS_MANIFEST.tiers.sandbox.featuresLocked).toContain('CLOUD_STORAGE');
    expect(BUSINESS_MANIFEST.tiers.sandbox.featuresLocked).toContain('FIREBASE_WRITE');
    expect(BUSINESS_MANIFEST.tiers.sandbox.featuresLocked).toContain('CLOUD_STITCHING');
  });

  it('should confirm static fixture einstein.json contains required 3-act historical structure and sensory anchors', () => {
    expect(einsteinFixture.templateId).toBe('p_einstein');
    expect(einsteinFixture.isTemplate).toBe(true);
    expect(einsteinFixture.isPublic).toBe(true);
    expect(einsteinFixture.title).toContain('Albert Einstein');
    expect(einsteinFixture.sensoryConfig.length).toBeGreaterThanOrEqual(2);
    expect(einsteinFixture.acts.act1).toBeDefined();
    expect(einsteinFixture.acts.act2).toBeDefined();
    expect(einsteinFixture.acts.act3).toBeDefined();
  });
});
