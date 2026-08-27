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

  describe('Distraction-Free Production Suite & Popout Suppression', () => {
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

    it('returns null on /studio/production/[id] to prevent double toolbar overlap', () => {
      mockUsePathname.mockReturnValue('/studio/production/p_einstein');
      const { container } = render(<Navbar />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null on /studio/chapter/[promptId]', () => {
      mockUsePathname.mockReturnValue('/studio/chapter/p_einstein_1');
      const { container } = render(<Navbar />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null on /cinema/tv dedicated theatre view', () => {
      mockUsePathname.mockReturnValue('/cinema/tv');
      const { container } = render(<Navbar />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Public & Studio Route Rendering', () => {
    it('renders navigation links on homepage (/) without LanguageToggle', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navbar />);
      expect(screen.getByText('Memory Weaver')).toBeInTheDocument();
      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Current language mode/i)).not.toBeInTheDocument();
    });

    it('renders navigation links on consumer login (/login) without LanguageToggle', () => {
      mockUsePathname.mockReturnValue('/login');
      render(<Navbar />);
      expect(screen.getByText('Memory Weaver')).toBeInTheDocument();
      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Current language mode/i)).not.toBeInTheDocument();
    });

    it('renders navigation links on /pricing without LanguageToggle', () => {
      mockUsePathname.mockReturnValue('/pricing');
      render(<Navbar />);
      expect(screen.getByText('Memory Weaver')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Current language mode/i)).not.toBeInTheDocument();
    });

    it('renders LanguageToggle on /studio workspace', () => {
      mockUsePathname.mockReturnValue('/studio');
      render(<Navbar />);
      expect(screen.getByLabelText(/Current language mode/i)).toBeInTheDocument();
    });

    it('renders LanguageToggle on /dashboard workspace', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<Navbar />);
      expect(screen.getByLabelText(/Current language mode/i)).toBeInTheDocument();
    });

    it('renders LanguageToggle on /create workspace', () => {
      mockUsePathname.mockReturnValue('/create');
      render(<Navbar />);
      expect(screen.getByLabelText(/Current language mode/i)).toBeInTheDocument();
    });
  });
});
