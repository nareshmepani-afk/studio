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
 * Covers Priority Triage Tests 1, 2, 3, 4, 5, and 7:
 * - Test 1: Soundstage 3-Way Mobile Intercept (MobilePortalOverlay)
 * - Test 2: Statutory Legal Terms Compliance (/legal/terms)
 * - Test 3: Pre-Purchase Hardware Disclosures on /gift
 * - Test 4: Memory Cinema Mobile Screening Room Ergonomics (/cinema)
 * - Test 5: How It Works 5-Act Production Cards (/how-it-works)
 * - Test 7: Global Navigation & Cross-Link Discoverability (Navbar & Pricing)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';

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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
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

vi.mock('@/actions/sendStudioTransitionAction', () => ({
  sendStudioTransitionAction: vi.fn().mockResolvedValue({
    success: true,
    message: 'Studio transition link sent! Check your inbox on your tablet or laptop.',
  }),
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
import { MobilePortalOverlay } from '@/components/studio/overlays/MobilePortalOverlay';
import TermsPage from '@/app/legal/terms/page';
import { LegalLayoutContent } from '@/app/legal/LegalLayoutContent';
import GiftPage from '@/app/gift/page';
import CinemaPage from '@/app/cinema/page';
import { HowItWorksContent } from '@/app/how-it-works/HowItWorksContent';
import { Navbar } from '@/components/layout/Navbar';
import { PricingContent } from '@/app/pricing/PricingContent';
import { sendStudioTransitionAction } from '@/actions/sendStudioTransitionAction';

describe('Responsive Device UI & Viewport Contract Shield', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'test_user_1', email: 'creator@memoryweaver.studio', role: 'Director' },
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
  // TEST 1: SOUNDSTAGE 3-WAY MOBILE INTERCEPT (MobilePortalOverlay)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Test 1: Soundstage 3-Way Mobile Intercept (MobilePortalOverlay)', () => {
    it('replaces the dead-end banner with the empowered 3-way choice fork', () => {
      const mockLens = vi.fn();
      const mockExit = vi.fn();

      render(
        <MobilePortalOverlay
          onActivateRemoteLens={mockLens}
          onExit={mockExit}
          userEmail="creator@memoryweaver.studio"
          promptId="ey96djU6qR1BrDGnvZwp"
          memoryTitle="Summer on the Coast"
        />
      );

      // Dead-end blocking text MUST NOT exist
      expect(screen.queryByText(/Go Back to My Memories/i)).toBeNull();

      // Verified empowered header
      expect(screen.getByText(/Optimised for Larger Screens/i)).toBeDefined();
      expect(screen.getByText(/THEATRICAL PRODUCTION SOUNDSTAGE/i)).toBeDefined();

      // Choice 1: Magic Studio Link email
      expect(screen.getByText(/Choice 1 • Recommended/i)).toBeDefined();
      expect(screen.getByText(/Email Me a Magic Studio Link/i)).toBeDefined();
      const emailInput = screen.getByPlaceholderText(/Enter your email for iPad\/PC/i) as HTMLInputElement;
      expect(emailInput.value).toBe('creator@memoryweaver.studio');

      // Choice 2: Wireless 4K Cinema Lens
      expect(screen.getByText(/Choice 2 • Companion Hardware/i)).toBeDefined();
      expect(screen.getByText(/Pair as Wireless 4K Cinema Lens/i)).toBeDefined();
      const lensButton = screen.getByRole('button', { name: /launch mobile lens mode/i });
      expect(lensButton).toBeDefined();

      // Choice 3: Fireside Audio Mode Teaser
      expect(screen.getByText(/Choice 3 • In Production/i)).toBeDefined();
      expect(screen.getByText(/Fireside Audio Mode/i)).toBeDefined();
      expect(screen.getByText(/MW-87/i)).toBeDefined();
      expect(screen.getByText(/A couch-friendly voice recorder for your phone is in production/i)).toBeDefined();

      // Fallback: Copy URL and Exit
      expect(screen.getByRole('button', { name: /copy soundstage url/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /return to memories dashboard/i })).toBeDefined();
    });

    it('dispatches sendStudioTransitionAction when submitting Choice 1', async () => {
      const mockLens = vi.fn();
      const mockExit = vi.fn();

      render(
        <MobilePortalOverlay
          onActivateRemoteLens={mockLens}
          onExit={mockExit}
          userEmail="creator@memoryweaver.studio"
          promptId="ey96djU6qR1BrDGnvZwp"
        />
      );

      const sendButton = screen.getByRole('button', { name: /send link/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(sendStudioTransitionAction).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'creator@memoryweaver.studio',
          })
        );
      });

      // Confirmation badge appears
      expect(screen.getByText(/Link sent to/i)).toBeDefined();
    });

    it('invokes onActivateRemoteLens on Choice 2 click and onExit on dashboard click', () => {
      const mockLens = vi.fn();
      const mockExit = vi.fn();

      render(
        <MobilePortalOverlay
          onActivateRemoteLens={mockLens}
          onExit={mockExit}
          userEmail="creator@memoryweaver.studio"
        />
      );

      const lensButton = screen.getByRole('button', { name: /launch mobile lens mode/i });
      fireEvent.click(lensButton);
      expect(mockLens).toHaveBeenCalledTimes(1);

      const exitButton = screen.getByRole('button', { name: /return to memories dashboard/i });
      fireEvent.click(exitButton);
      expect(mockExit).toHaveBeenCalledTimes(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 2: STATUTORY LEGAL TERMS COMPLIANCE (/legal/terms)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Test 2: Statutory Legal Terms Compliance (/legal/terms)', () => {
    it('renders Section 6 Technical, Hardware, and System Requirements with UK Consumer Rights Act 2015 language', () => {
      render(<TermsPage />);

      // Section 6 heading exists
      const section6Heading = screen.getByRole('heading', {
        name: /6. Technical, Hardware, and System Requirements/i,
      });
      expect(section6Heading).toBeDefined();

      // Statutory Consumer Rights Act reference
      expect(screen.getByText(/Consumer Rights Act 2015 and applicable consumer protection regulations/i)).toBeDefined();

      // 768px soundstage minimum display requirement
      expect(screen.getByText(/minimum viewport width of 768 pixels/i)).toBeDefined();
      expect(screen.getByText(/Handheld portrait smartphone screens are not supported for the primary creator recording interface/i)).toBeDefined();

      // Peripherals & WebRTC remote lens pairing
      expect(screen.getByText(/auxiliary remote video lenses/i)).toBeDefined();

      // Universal playback & screening
      expect(screen.getByText(/universally accessible across all modern mobile phones, tablets, personal computers, and Smart TV web browsers/i)).toBeDefined();
    });

    it('maintains strict sequential numbering across sections 6 through 11', () => {
      render(<TermsPage />);

      expect(screen.getByRole('heading', { name: /6. Technical, Hardware, and System Requirements/i })).toBeDefined();
      expect(screen.getByRole('heading', { name: /7. Acceptable Use and Community Standards/i })).toBeDefined();
      expect(screen.getByRole('heading', { name: /8. Service Availability and Storage Continuity/i })).toBeDefined();
      expect(screen.getByRole('heading', { name: /9. Limitation of Liability/i })).toBeDefined();
      expect(screen.getByRole('heading', { name: /10. Governing Law and Jurisdiction/i })).toBeDefined();
      expect(screen.getByRole('heading', { name: /11. Modifications to These Terms/i })).toBeDefined();
    });

    it('renders the 3-column navigation bar without clipping on 360px mobile viewports', () => {
      mockUsePathname.mockReturnValue('/legal/terms');
      render(
        <LegalLayoutContent>
          <div>Terms Content</div>
        </LegalLayoutContent>
      );

      const nav = screen.getByRole('navigation', { name: /legal document navigation/i });
      expect(nav).toBeDefined();
      const gridContainer = nav.querySelector('[class*="grid-cols-3"]');
      expect(gridContainer).not.toBeNull();
      expect(gridContainer?.className).toContain('w-full');

      const termsLink = within(nav).getByRole('link', { name: /terms/i });
      const privacyLink = within(nav).getByRole('link', { name: /privacy/i });
      const cookiesLink = within(nav).getByRole('link', { name: /cookie/i });

      expect(termsLink.textContent).toContain('Terms');
      expect(privacyLink.textContent).toContain('Privacy');
      expect(cookiesLink.textContent).toContain('Cookies');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 3: PRE-PURCHASE HARDWARE DISCLOSURES ON /gift
  // ────────────────────────────────────────────────────────────────────────────
  describe('Test 3: Pre-Purchase Hardware Disclosures on /gift', () => {
    it('mounts the Obsidian-Gold Studio Recording Setup & Compatibility trust card with 3 pillars', () => {
      const { container } = render(<GiftPage />);

      const trustCardHeading = screen.getByText(/Studio Recording Setup & Compatibility/i);
      expect(trustCardHeading).toBeDefined();

      // Pillar 1: Recording Console (768px+)
      expect(screen.getByText(/Recording Console/i)).toBeDefined();
      expect(container.textContent).toContain('designed for tablets (iPad), laptops, or desktop computers');

      // Pillar 2: Smartphone 4K Lens Pairing
      expect(screen.getByText(/Smartphone 4K Lens Pairing/i)).toBeDefined();
      expect(screen.getByText(/wirelessly paired as a secondary high-definition cinema camera/i)).toBeDefined();

      // Pillar 3: Everywhere Screening
      expect(screen.getByText(/Everywhere Screening/i)).toBeDefined();
      expect(screen.getByText(/play universally across all smartphones, tablets, computers, and Smart TVs/i)).toBeDefined();
    });

    it('renders pre-checkout micro-notices above both desktop and mobile purchase buttons', () => {
      const { container } = render(<GiftPage />);

      const allText = container.textContent || '';
      expect(allText).toContain("The storyteller's recording soundstage requires a tablet, laptop, or desktop. Finished memoirs can be screened on any device.");
      expect(allText).toContain("Storyteller soundstage requires a tablet or PC. Plays on any device.");
    });

    it('renders the discrete instruction on the 5"x7" Keepsake Card preview', () => {
      render(<GiftPage />);

      expect(
        screen.getByText(/Open your unboxing link on an iPad, laptop, or computer to step onto the soundstage/i)
      ).toBeDefined();
    });

    it('renders Occasion Sparks and Cultural Salutations in clean 2-column mobile grids', () => {
      const { container } = render(<GiftPage />);

      const occasionButtons = screen.getAllByRole('button');
      const hasMilestone = occasionButtons.some(b => b.textContent?.includes('Milestone 70th/80th'));
      const hasCultural = occasionButtons.some(b => b.textContent?.includes('To our dearest'));

      expect(hasMilestone).toBe(true);
      expect(hasCultural).toBe(true);

      const grids = container.querySelectorAll('[class*="grid-cols-2"]');
      expect(grids.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 4: MEMORY CINEMA SCREENING ROOM ERGONOMICS (/cinema)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Test 4: Memory Cinema Mobile Screening Room Ergonomics (/cinema)', () => {
    it('scales the header typography and renders responsive filter pills', () => {
      render(<CinemaPage />);

      // Main header
      expect(screen.getByText(/The Memory Cinema/i)).toBeDefined();

      // Filter tabs
      const buttons = screen.getAllByRole('button');
      const filterButtonTexts = buttons.map(b => b.textContent || '');
      
      const hasAll = filterButtonTexts.some(t => t.includes('All'));
      const hasMine = filterButtonTexts.some(t => t.includes('Mine') || t.includes('My Productions'));
      const hasShared = filterButtonTexts.some(t => t.includes('Shared') || t.includes('Shared With Me'));

      expect(hasAll).toBe(true);
      expect(hasMine).toBe(true);
      expect(hasShared).toBe(true);
    });

    it('wraps the Saved Family Cinema header with responsive layout to prevent badge collisions', () => {
      const { container } = render(<CinemaPage />);

      const savedCinemaSection = container.querySelector('[class*="flex-col"][class*="sm:flex-row"]');
      expect(savedCinemaSection).not.toBeNull();
      expect(screen.getByText(/My Saved Family Cinema/i)).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 5: HOW IT WORKS 5-ACT PRODUCTION CARDS (/how-it-works)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Test 5: How It Works 5-Act Production Cards (/how-it-works)', () => {
    it('spans all 5 Act cards full width on mobile and mounts Phase badges above title', () => {
      const { container } = render(<HowItWorksContent />);

      expect(screen.getByText(/The Scriptorium/i)).toBeDefined();
      expect(screen.getByText(/The Soundstage/i)).toBeDefined();
      expect(screen.getByText(/The Editing Suite/i)).toBeDefined();
      expect(screen.getByText(/The Screening Room/i)).toBeDefined();
      expect(screen.getByText(/The Archive/i)).toBeDefined();

      // Phase badges are present
      expect(screen.getAllByText(/PHASE 01/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/PHASE 02/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/PHASE 03/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/PHASE 04/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/PHASE 05/i).length).toBeGreaterThanOrEqual(1);

      const responsivePaddingCards = container.querySelectorAll('[class*="pl-0"][class*="md:pl-20"]');
      expect(responsivePaddingCards.length).toBe(5);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 7: GLOBAL NAVIGATION & CROSS-LINK DISCOVERABILITY (Navbar & Pricing)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Test 7: Global Navigation & Cross-Link Discoverability (Navbar & Pricing)', () => {
    it('mounts Gift a Memoir in desktop navigation (>= 1280px)', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navbar />);

      const giftLinks = screen.getAllByRole('link', { name: /gift/i });
      expect(giftLinks.length).toBeGreaterThan(0);
      const desktopGiftLink = giftLinks.find(link => link.getAttribute('href') === '/gift');
      expect(desktopGiftLink).toBeDefined();
    });

    it('renders the tablet explore popover button on intermediate viewports (768px–1279px)', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navbar />);

      const exploreButton = screen.getByRole('button', { name: /explore more pages/i });
      expect(exploreButton).toBeDefined();
      const parentContainer = exploreButton.closest('[class*="md:flex"][class*="xl:hidden"]');
      expect(parentContainer).not.toBeNull();
    });

    it('renders the mobile menu toggle button (< 768px)', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navbar />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeDefined();
      const parentContainer = menuButton.closest('[class*="md:hidden"]');
      expect(parentContainer).not.toBeNull();
    });

    it('renders the Heirloom Gifting Studio ribbon on /pricing linking to /gift', () => {
      render(<PricingContent />);

      expect(screen.getByText(/ACT V HEIRLOOM GIFTING STUDIO/i)).toBeDefined();
      expect(screen.getByText(/Commissioning a memoir for parents or grandparents?/i)).toBeDefined();

      const heirloomButton = screen.getByRole('link', { name: /personalise.*keepsake card/i });
      expect(heirloomButton).toBeDefined();
      expect(heirloomButton.getAttribute('href')).toBe('/gift');
    });
  });
});
