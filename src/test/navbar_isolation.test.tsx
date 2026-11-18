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
let mockAuthUser: any = null;
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: false,
    logout: vi.fn(),
  }),
}));

describe('Navbar Route Isolation & Admin Masking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser = null;
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

    it('returns null on /staging-lock so the staging sandbox header does not clash with consumer Navbar', () => {
      mockUsePathname.mockReturnValue('/staging-lock');
      const { container } = render(<Navbar />);
      expect(container.firstChild).toBeNull();
    });

    it('keeps authenticated center nav links (Memory Studio, Memory Cinema) hidden below md (768px) to avoid mobile right-cluster collision', () => {
      mockAuthUser = {
        uid: 'u-mobile-nav-1',
        email: 'founder@memoryweaver.studio',
        role: 'Director',
      };
      mockUsePathname.mockReturnValue('/studio');
      const { container } = render(<Navbar />);
      const nav = container.querySelector('nav');
      expect(nav).not.toBeNull();
      expect(nav?.className).toContain('hidden');
      expect(nav?.className).toContain('md:flex');
      expect(nav?.className).toContain('min-w-0');
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
