import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StudioUpgradeBadge } from '@/components/layout/StudioUpgradeBadge';
import { useStudioUpgradeCheck } from '@/hooks/useStudioUpgradeCheck';
import * as useStudioUpgradeCheckModule from '@/hooks/useStudioUpgradeCheck';
import { renderHook } from '@testing-library/react';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('Studio Upgrade Detection & Badge Suite', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('useStudioUpgradeCheck: detects version mismatch when commitSha differs', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        version: 'v1.2.0-beta',
        commitSha: 'sha_new_123',
        buildTimestamp: new Date().toISOString()
      })
    } as any);

    const { result } = renderHook(() => useStudioUpgradeCheck(60000));

    await act(async () => {
      await result.current.checkNow();
    });

    expect(result.current.latestVersion).toBe('v1.2.0-beta');
    expect(result.current.latestSha).toBe('sha_new_123');
  });

  it('useStudioUpgradeCheck: triggers check on visibilitychange when tab becomes visible', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        version: 'v1.2.0-beta',
        commitSha: 'sha_new_456',
        buildTimestamp: new Date().toISOString()
      })
    } as any);
    global.fetch = fetchMock;

    renderHook(() => useStudioUpgradeCheck(60000));

    expect(fetchMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible'
    });

    await act(async () => {
      fireEvent(document, new Event('visibilitychange'));
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('StudioUpgradeBadge: renders button with HS_NAV_UPGRADE_BADGE_BTN hotspot tag when upgrade is available', () => {
    vi.spyOn(useStudioUpgradeCheckModule, 'useStudioUpgradeCheck').mockReturnValue({
      hasUpgrade: true,
      latestVersion: 'v1.2.0-beta-MW-114',
      activeSha: 'sha_old',
      latestSha: 'sha_new',
      checkNow: vi.fn(),
      triggerUpgrade: vi.fn()
    });

    render(<StudioUpgradeBadge />);

    const badgeBtn = screen.getByRole('button');
    expect(badgeBtn).toBeInTheDocument();
    expect(badgeBtn.getAttribute('data-hotspot-id')).toBe('HS_NAV_UPGRADE_BADGE_BTN');
    expect(badgeBtn.textContent).toContain('STUDIO UPGRADE');
  });

  it('StudioUpgradeBadge: invokes onBeforeUpgrade callback and opens toast on click', async () => {
    const { toast } = await import('sonner');
    const mockOnBeforeUpgrade = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(useStudioUpgradeCheckModule, 'useStudioUpgradeCheck').mockReturnValue({
      hasUpgrade: true,
      latestVersion: 'v1.2.0-beta-MW-114',
      activeSha: 'sha_old',
      latestSha: 'sha_new',
      checkNow: vi.fn(),
      triggerUpgrade: vi.fn()
    });

    render(<StudioUpgradeBadge onBeforeUpgrade={mockOnBeforeUpgrade} />);

    const badgeBtn = screen.getByRole('button');
    fireEvent.click(badgeBtn);

    expect(toast.info).toHaveBeenCalledWith(
      '🚀 Studio Upgrade Available',
      expect.objectContaining({
        duration: 12000,
        action: expect.objectContaining({
          label: 'Upgrade Studio'
        })
      })
    );
  });
});
