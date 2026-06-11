import { describe, it, expect } from 'vitest';
import { BUSINESS_MANIFEST } from '../businessRules';

describe('Business Manifest Operational Shield', () => {
  it('should freeze director prices to match exact fiscal targets', () => {
    expect(BUSINESS_MANIFEST.tiers.director.priceMonthlyGbp).toBe(12.99);
    expect(BUSINESS_MANIFEST.tiers.director.priceMonthlyUsd).toBe(14.99);
  });

  it('should freeze sandbox configuration and features locked', () => {
    expect(BUSINESS_MANIFEST.tiers.sandbox.demoScript).toBe('p_einstein');
    expect(BUSINESS_MANIFEST.tiers.sandbox.featuresLocked).toEqual([
      'CLOUD_STORAGE',
      'FIREBASE_WRITE',
      'CLOUD_STITCHING'
    ]);
  });

  it('should freeze support playbook step counts precisely', () => {
    const playbook = BUSINESS_MANIFEST.supportPlaybooks.MW_66_GUEST_INTERCEPT;
    expect(playbook.resolutionSteps).toHaveLength(3);
    expect(playbook.resolutionSteps).toEqual([
      "Instruct user to keep current browser tab open to preserve local WebM Blobs in IndexedDB.",
      "Direct user to execute the account creation flow inside the Radix container.",
      "Pipeline will automatically migrate localforage cache to active Firestore collection post-auth."
    ]);
  });

  it('should enforce that expired pass states allow data visibility but strictly block database write loops', () => {
    expect(BUSINESS_MANIFEST.userLifecycles.paid_host_pass_expired.allowDataVisibility).toBe(true);
    expect(BUSINESS_MANIFEST.userLifecycles.paid_host_pass_expired.blockWriteActions).toBe(true);
    expect(BUSINESS_MANIFEST.userLifecycles.paid_host_pass_expired.ctaMapping.primary).toBe('Renew / Upgrade Pass');
    expect(BUSINESS_MANIFEST.userLifecycles.paid_host_pass_expired.blockedVectors).toContain('CREATE_NEW_CHAPTER');
    expect(BUSINESS_MANIFEST.userLifecycles.paid_host_pass_expired.blockedVectors).toContain('ENTER_RECORDING_PIPELINE');
  });
});
