import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from '@/components/layout/Navbar';

// Mock next/navigation
const mockUsePathname = vi.fn();
const mockUseRouter = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
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
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    logout: vi.fn(),
  }),
}));

describe('Navbar Route Isolation & Admin Masking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Administrative Route Suppression', () => {
    it('returns null on /admin/login', () => {
      mockUsePathname.mockReturnValue('/admin/login');
      const { container } = render(<Navbar />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null on /admin/mfa-setup', () => {
      mockUsePathname.mockReturnValue('/admin/mfa-setup');
      const { container } = render(<Navbar />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null on /admin root', () => {
      mockUsePathname.mockReturnValue('/admin');
      const { container } = render(<Navbar />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null on nested /admin sub-suites', () => {
      mockUsePathname.mockReturnValue('/admin/operations');
      const { container } = render(<Navbar />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Distraction-Free Popout Suppression', () => {
    it('returns null on /studio/teleprompter-popout', () => {
      mockUsePathname.mockReturnValue('/studio/teleprompter-popout');
      const { container } = render(<Navbar />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null on /studio/remote-camera', () => {
      mockUsePathname.mockReturnValue('/studio/remote-camera');
      const { container } = render(<Navbar />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Public & Studio Route Rendering', () => {
    it('renders navigation links on homepage (/)', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navbar />);
      expect(screen.getByText('Memory Weaver')).toBeInTheDocument();
      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('renders navigation links on consumer login (/login)', () => {
      mockUsePathname.mockReturnValue('/login');
      render(<Navbar />);
      expect(screen.getByText('Memory Weaver')).toBeInTheDocument();
      expect(screen.getByText('How It Works')).toBeInTheDocument();
    });

    it('renders navigation links on /pricing', () => {
      mockUsePathname.mockReturnValue('/pricing');
      render(<Navbar />);
      expect(screen.getByText('Memory Weaver')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
    });
  });
});
