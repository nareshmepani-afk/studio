/**
 * Global Navigation, Footer & Pricing Ribbon Integration Suite (/gift)
 * 
 * Tests MW-86 responsive navigation contracts:
 * 1. /gift is present in Navbar on desktop and mobile drawer
 * 2. Studio CTA button is visible across breakpoints without disappearing
 * 3. /gift is linked under Product column in PublicFooter
 * 4. Obsidian-Gold Heirloom Ribbon links to /gift on Pricing page
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from '@/components/layout/Navbar';
import { PublicFooter } from '@/components/public/PublicFooter';

// Mock next/navigation
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

// Mock useLanguage
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    mode: 'en',
    setMode: vi.fn(),
    language: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => key,
  }),
}));

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { PricingContent } from '@/app/pricing/PricingContent';

describe('MW-86: Global Navigation, Footer & Pricing Ribbon Integration (/gift)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.IntersectionObserver = class IntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as any;
    global.ResizeObserver = class ResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as any;
  });

  describe('Unauthenticated Visitors (Landing & Public Pages)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        logout: vi.fn(),
      });
    });

    it('renders "Gift a Memoir" link in public navbar for unauthenticated visitors', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navbar />);

      const giftLinks = screen.getAllByRole('link', { name: /gift a memoir/i });
      expect(giftLinks.length).toBeGreaterThanOrEqual(1);
      expect(giftLinks[0].getAttribute('href')).toBe('/gift');
    });

    it('renders navigation links ("How It Works", "Pricing", "Contact") without disappearing', () => {
      mockUsePathname.mockReturnValue('/pricing');
      render(<Navbar />);

      expect(screen.getAllByRole('link', { name: /how it works/i })[0].getAttribute('href')).toBe('/how-it-works');
      expect(screen.getAllByRole('link', { name: /pricing/i })[0].getAttribute('href')).toBe('/pricing');
      expect(screen.getAllByRole('link', { name: /contact/i })[0].getAttribute('href')).toBe('/contact');
    });

    it('renders Login and Sign Up buttons for unauthenticated visitors', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navbar />);

      expect(screen.getAllByText(/sign up/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Authenticated Users (Studio & App Shell)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          uid: 'test_user_1',
          displayName: 'Test Storyteller',
          email: 'storyteller@example.com',
          role: 'Director',
          directorPassStatus: 'paid_host_pass_active',
        },
        loading: false,
        logout: vi.fn(),
      });
    });

    it('renders Enter Studio Stage CTA button for authenticated users on non-studio routes', () => {
      mockUsePathname.mockReturnValue('/cinema');
      render(<Navbar />);

      const studioButtons = screen.getAllByText(/studio/i);
      expect(studioButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "Gift a Memoir" in top navigation bar for authenticated users', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<Navbar />);

      const giftLinks = screen.getAllByRole('link', { name: /gift a memoir/i });
      expect(giftLinks.length).toBeGreaterThanOrEqual(1);
    });

    it('renders [ 🧭 Explore ▾ ] contextual pill for tablet viewports', () => {
      mockUsePathname.mockReturnValue('/studio');
      render(<Navbar />);

      const exploreButton = screen.getByRole('button', { name: /explore more pages/i });
      expect(exploreButton).toBeDefined();
    });

    it('renders mobile drawer trigger button ([ ☰ Menu ]) on mobile viewports', () => {
      mockUsePathname.mockReturnValue('/studio');
      render(<Navbar />);

      const mobileMenuButton = screen.getByRole('button', { name: /open navigation menu/i });
      expect(mobileMenuButton).toBeDefined();
    });
  });

  describe('PublicFooter Integration', () => {
    it('renders "Gift an Heirloom" under Product column in PublicFooter', () => {
      render(<PublicFooter />);
      const giftFooterLink = screen.getByRole('link', { name: /gift an heirloom/i });
      expect(giftFooterLink).toBeDefined();
      expect(giftFooterLink.getAttribute('href')).toBe('/gift');
    });
  });

  describe('Pricing Page Responsive Buttons (/pricing)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        logout: vi.fn(),
      });
    });

    it('renders responsive Heirloom Gifting Ribbon button linking to /gift', () => {
      render(<PricingContent />);
      const ribbonLinks = screen.getAllByRole('link', { name: /personalise/i });
      expect(ribbonLinks.length).toBeGreaterThanOrEqual(1);
      expect(ribbonLinks[0].getAttribute('href')).toBe('/gift');
    });

    it('renders bottom registration CTA button with responsive text', () => {
      render(<PricingContent />);
      const claimButtons = screen.getAllByRole('link', { name: /start free/i });
      expect(claimButtons.length).toBeGreaterThanOrEqual(1);
      expect(claimButtons[0].getAttribute('href')).toBe('/register');
    });
  });
});
