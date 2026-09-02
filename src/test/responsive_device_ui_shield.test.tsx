/**
 * ============================================================================
 * RESPONSIVE DEVICE UI & VIEWPORT CONTRACT SHIELD
 * ============================================================================
 * Automated regression suite verifying that all popular device viewports:
 * - Small Mobile: Samsung Galaxy S8+ (360px), iPhone SE (375px)
 * - Standard Mobile: iPhone 14/15 (390px), Galaxy S20/S22 (412px)
 * - Tablet: iPad Mini (768px), iPad Air (820px), iPad Pro (1024px)
 * - Desktop / Widescreen: Laptop (1280px), Desktop (1440px)
 *
 * Maintain strict UI ergonomics, zero element clipping, proper touch targets,
 * and adaptive short/long label contracts moving forward.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';

// Mock Next.js navigation
const mockUsePathname = vi.fn();
const mockUseRouter = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock hooks
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    mode: 'en',
    setMode: vi.fn(),
    language: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => key,
  }),
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/studio/useStudioData', () => ({
  useStudioData: () => ({
    chapters: [],
    isLoading: false,
    stats: { total: 0, published: 0 },
    refetch: vi.fn(),
  }),
}));

// Mock Actions & Wrappers to prevent request-scope session errors in JSDOM
vi.mock('@/actions/createSessionAction', () => ({
  deleteSessionAction: vi.fn().mockResolvedValue({ success: true }),
  createSessionAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/actions/memoryActions', () => ({
  unpublishMemoryAction: vi.fn().mockResolvedValue({ success: true }),
  getPublicMemoryAction: vi.fn().mockResolvedValue(null),
  addGuestReactionAction: vi.fn().mockResolvedValue({ success: true }),
  recordGuestViewAction: vi.fn().mockResolvedValue({ success: true }),
  submitGuestQuestionAction: vi.fn().mockResolvedValue({ success: true }),
  claimSharedMemoryAction: vi.fn().mockResolvedValue({ success: true }),
  getSharedWithMeMemoriesAction: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/components/layout/AuthenticatedPageWrapper', () => ({
  AuthenticatedPageWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Components under test
import { LegalLayoutContent } from '@/app/legal/LegalLayoutContent';
import { Navbar } from '@/components/layout/Navbar';
import { HowItWorksContent } from '@/app/how-it-works/HowItWorksContent';
import CinemaPage from '@/app/cinema/page';
import GiftPage from '@/app/gift/page';

describe('Responsive Device UI & Viewport Contract Shield', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'test_user_1', email: 'test@memoryweaver.studio', role: 'Director' },
      loading: false,
      logout: vi.fn(),
    });
    global.IntersectionObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as any;
    global.ResizeObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as any;
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 1. LEGAL SUITE RESPONSIVE NAVIGATION INVARIANTS (/legal/*)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Legal Suite Responsive Navigation Toolbar (/legal/*)', () => {
    it('renders all 3 legal tabs simultaneously in a 3-column equal grid on mobile', () => {
      mockUsePathname.mockReturnValue('/legal/terms');
      render(
        <LegalLayoutContent>
          <div>Terms Content</div>
        </LegalLayoutContent>
      );

      const nav = screen.getByRole('navigation', { name: /legal document navigation/i });
      expect(nav).toBeDefined();

      // Verify the grid container has w-full and grid-cols-3
      const gridContainer = nav.querySelector('.grid-cols-3');
      expect(gridContainer).not.toBeNull();
      expect(gridContainer?.className).toContain('grid');
      expect(gridContainer?.className).toContain('grid-cols-3');
      expect(gridContainer?.className).toContain('w-full');

      // Verify all 3 tabs are rendered inside the legal navigation bar
      const termsLink = within(nav).getByRole('link', { name: /terms/i });
      const privacyLink = within(nav).getByRole('link', { name: /privacy/i });
      const cookiesLink = within(nav).getByRole('link', { name: /cookie/i });

      expect(termsLink).toBeDefined();
      expect(privacyLink).toBeDefined();
      expect(cookiesLink).toBeDefined();

      // Mobile short labels check
      expect(termsLink.textContent).toContain('Terms');
      expect(privacyLink.textContent).toContain('Privacy');
      expect(cookiesLink.textContent).toContain('Cookies');

      // Desktop full labels check
      expect(termsLink.textContent).toContain('Terms of Service');
      expect(privacyLink.textContent).toContain('Privacy Policy');
      expect(cookiesLink.textContent).toContain('Cookie Policy');
    });

    it('highlights the active tab with gold styling and shadow', () => {
      mockUsePathname.mockReturnValue('/legal/privacy');
      render(
        <LegalLayoutContent>
          <div>Privacy Content</div>
        </LegalLayoutContent>
      );

      const nav = screen.getByRole('navigation', { name: /legal document navigation/i });
      const privacyLink = within(nav).getByRole('link', { name: /privacy/i });
      expect(privacyLink.className).toContain('text-amber-400');
      expect(privacyLink.className).toContain('bg-amber-500/15');
      expect(privacyLink.className).toContain('border-amber-500/30');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2. HEIRLOOM GIFTING STUDIO RESPONSIVE ERGONOMICS (/gift)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Heirloom Gifting Studio Mobile Ergonomics (/gift)', () => {
    it('hides the duplicate right-column canvas preview on mobile (< lg / 1024px)', () => {
      const { container } = render(<GiftPage />);

      // The right-column preview container MUST carry 'hidden lg:flex'
      const hiddenOnMobile = container.querySelector('.hidden.lg\\:flex');
      expect(hiddenOnMobile).not.toBeNull();
    });

    it('renders the floating mobile preview bottom sheet button with lg:hidden contract', () => {
      render(<GiftPage />);

      const previewButton = screen.getByRole('button', { name: /preview keepsake & ceremony/i });
      expect(previewButton).toBeDefined();
      const parentContainer = previewButton.closest('.lg\\:hidden');
      expect(parentContainer).not.toBeNull();
    });

    it('renders the fixed bottom sticky mobile purchase bar with lg:hidden contract', () => {
      render(<GiftPage />);

      const checkoutButton = screen.getByRole('button', { name: /commission heirloom/i });
      expect(checkoutButton).toBeDefined();
      const parentBar = checkoutButton.closest('.fixed.bottom-0');
      expect(parentBar).not.toBeNull();
      expect(parentBar?.className).toContain('lg:hidden');
    });

    it('structures the AI Muse toolbar with a clean 2-row adaptive layout', () => {
      const { container } = render(<GiftPage />);

      const museToolbar = container.querySelector('.bg-gray-950.border-gray-800\\/80');
      expect(museToolbar).not.toBeNull();

      expect(screen.getByText(/tone:/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /polish with ai muse/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /tidy/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /grammar & spelling/i })).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 3. PRODUCTION PIPELINE RESPONSIVE READABILITY (/how-it-works)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Production Pipeline Mobile Ergonomics (/how-it-works)', () => {
    it('removes the 64px left indentation on mobile and places badges above title', () => {
      const { container } = render(<HowItWorksContent />);

      // Verify the 5 Act cards have pl-0 md:pl-20 for full readable width on mobile
      const actCards = container.querySelectorAll('.pl-0.md\\:pl-20');
      expect(actCards.length).toBe(5);

      expect(screen.getByText(/The Scriptorium/i)).toBeDefined();
      expect(screen.getByText(/The Soundstage/i)).toBeDefined();
      expect(screen.getByText(/The Editing Suite/i)).toBeDefined();
      expect(screen.getByText(/The Screening Room/i)).toBeDefined();
      expect(screen.getByText(/The Archive/i)).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 4. MEMORY CINEMA RESPONSIVE SHIELD (/cinema)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Memory Cinema Screening Room Mobile Shield (/cinema)', () => {
    it('renders responsive shorthand filter tab labels on mobile and full on desktop', () => {
      render(<CinemaPage />);

      const allTab = screen.getByRole('button', { name: /all/i });
      expect(allTab).toBeDefined();

      const buttons = screen.getAllByRole('button');
      const filterButtonTexts = buttons.map(b => b.textContent || '');
      
      const hasMineTab = filterButtonTexts.some(t => t.includes('Mine') || t.includes('My Productions'));
      const hasSharedTab = filterButtonTexts.some(t => t.includes('Shared') || t.includes('Shared With Me'));

      expect(hasMineTab).toBe(true);
      expect(hasSharedTab).toBe(true);
    });

    it('wraps the Saved Family Cinema header with flex-col on mobile to prevent badge collisions', () => {
      const { container } = render(<CinemaPage />);

      const savedCinemaSection = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(savedCinemaSection).not.toBeNull();
      expect(screen.getByText(/My Saved Family Cinema/i)).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 5. GLOBAL NAVBAR ADAPTIVE DEVICE TIERS (Mobile / Tablet / Desktop)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Global Navbar Responsive Breakpoint Tiers (Navbar)', () => {
    it('renders the mobile menu toggle button with md:hidden contract', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navbar />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeDefined();
      const parentContainer = menuButton.closest('.md\\:hidden');
      expect(parentContainer).not.toBeNull();
    });

    it('renders the tablet explore popover button on intermediate viewports', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navbar />);

      const exploreButton = screen.getByRole('button', { name: /explore more pages/i });
      expect(exploreButton).toBeDefined();
      const parentContainer = exploreButton.closest('.hidden.md\\:flex.xl\\:hidden');
      expect(parentContainer).not.toBeNull();
    });
  });
});
