import React from 'react';
import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  isInstallShareBarEligibleHost,
  isAppleSafariUserAgent,
  buildCanonicalShareLinks,
} from '@/hooks/usePwaInstallAndShare';
import { ProductionInstallShareBar } from '@/components/landing/ProductionInstallShareBar';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MW-436 (Option 1B): Production-Only Install & Share Bar + PWA Manifest', () => {
  const originalLocation = window.location;
  const originalMatchMedia = window.matchMedia;

  function setWindowUrl(hostname: string, search = '') {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ...originalLocation,
        hostname,
        search,
        origin: `https://${hostname}`,
        href: `https://${hostname}/${search}`,
      },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    window.matchMedia = originalMatchMedia;
  });

  it('1. enforces strict memoryweaver.studio host check while supporting Option 1B ?preview_install_bar=1 on Staging only', () => {
    expect(isInstallShareBarEligibleHost({ hostname: 'memoryweaver.studio' })).toBe(true);
    expect(isInstallShareBarEligibleHost({ hostname: 'www.memoryweaver.studio' })).toBe(true);

    // Blocked on Staging by default, admin.*, localhost, and 127.0.0.1
    expect(isInstallShareBarEligibleHost({ hostname: 'dev.memoryweaver.studio' })).toBe(false);
    expect(isInstallShareBarEligibleHost({ hostname: 'admin.memoryweaver.studio' })).toBe(false);
    expect(isInstallShareBarEligibleHost({ hostname: 'localhost', search: '?preview_install_bar=1' })).toBe(false);
    expect(isInstallShareBarEligibleHost({ hostname: '127.0.0.1', search: '?preview_install_bar=1' })).toBe(false);

    // Option 1B: Staging visual preview enabled strictly via ?preview_install_bar=1
    expect(
      isInstallShareBarEligibleHost({
        hostname: 'dev.memoryweaver.studio',
        search: '?preview_install_bar=1',
      })
    ).toBe(true);
  });

  it('2. renders nothing on normal Staging or localhost, and renders both Hero and Footer variants on memoryweaver.studio', async () => {
    setWindowUrl('dev.memoryweaver.studio', '');
    const { unmount: uStage } = render(<ProductionInstallShareBar variant="hero" />);
    expect(screen.queryByTestId('PRODUCTION_INSTALL_SHARE_HERO')).toBeNull();
    uStage();

    setWindowUrl('memoryweaver.studio', '');
    render(
      <>
        <ProductionInstallShareBar variant="hero" />
        <ProductionInstallShareBar variant="footer" />
      </>
    );

    await waitFor(() => {
      expect(screen.getByTestId('PRODUCTION_INSTALL_SHARE_HERO')).toBeInTheDocument();
      expect(screen.getByTestId('PRODUCTION_INSTALL_SHARE_FOOTER')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Keep Memory Weaver on Your Home Screen & Share with Family')
    ).toBeInTheDocument();

    const links = buildCanonicalShareLinks();
    expect(links.canonicalUrl).toBe('https://memoryweaver.studio/');
    expect(screen.getByTestId('PWA_HERO_WHATSAPP_LINK').getAttribute('href')).toContain(
      encodeURIComponent('https://memoryweaver.studio/')
    );
    expect(screen.getByTestId('PWA_FOOTER_EMAIL_LINK').getAttribute('href')).toContain(
      encodeURIComponent('https://memoryweaver.studio/')
    );
  });

  it('3. invokes native beforeinstallprompt.prompt() when captured, and falls back to the 2-step Safari guide modal otherwise', async () => {
    setWindowUrl('dev.memoryweaver.studio', '?preview_install_bar=1');
    expect(
      isAppleSafariUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
      )
    ).toBe(true);

    render(<ProductionInstallShareBar variant="hero" />);
    await waitFor(() => {
      expect(screen.getByTestId('PWA_HERO_INSTALL_BTN')).toBeInTheDocument();
    });

    // Without beforeinstallprompt -> opens 2-step install guide modal
    fireEvent.click(screen.getByTestId('PWA_HERO_INSTALL_BTN'));
    await waitFor(() => {
      expect(screen.getByTestId('PWA_INSTALL_GUIDE_MODAL')).toBeInTheDocument();
    });
    expect(screen.getByTestId('PWA_INSTALL_GUIDE_MODAL').textContent).toContain('Add to Home Screen');
    fireEvent.click(screen.getByTestId('PWA_INSTALL_GUIDE_CLOSE_BTN'));

    // Dispatch synthetic beforeinstallprompt -> clicking Install calls native prompt()
    const promptSpy = vi.fn().mockResolvedValue(undefined);
    const bipEvent = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: promptSpy,
      userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
    });
    window.dispatchEvent(bipEvent);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('PWA_HERO_INSTALL_BTN'));
      expect(promptSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('4. hides Install button when already running in standalone mode and ships valid manifest.webmanifest + 192/512 PNG icons', async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    setWindowUrl('memoryweaver.studio', '');
    render(<ProductionInstallShareBar variant="footer" />);

    await waitFor(() => {
      expect(screen.getByTestId('PRODUCTION_INSTALL_SHARE_FOOTER')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('PWA_FOOTER_INSTALL_BTN')).toBeNull();
    expect(screen.getByTestId('PWA_FOOTER_WHATSAPP_LINK')).toBeInTheDocument();

    const manifestPath = path.join(process.cwd(), 'public', 'manifest.webmanifest');
    const icon192Path = path.join(process.cwd(), 'public', 'icon-192.png');
    const icon512Path = path.join(process.cwd(), 'public', 'icon-512.png');

    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(icon192Path)).toBe(true);
    expect(fs.existsSync(icon512Path)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(['192x192', '512x512']);
  });
});
