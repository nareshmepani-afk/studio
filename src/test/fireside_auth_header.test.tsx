import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FiresideAuthHeader } from '@/components/fireside/FiresideAuthHeader';

let mockUser: { uid: string; email: string | null; isAnonymous: boolean } | null = null;
const mockLogout = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    logout: mockLogout,
  }),
}));

describe('MW-249: FiresideAuthHeader & Desktop Soundstage Ingress Suite', () => {
  beforeEach(() => {
    mockUser = null;
    mockLogout.mockClear();
  });

  it('renders high-visibility Desktop Soundstage (Acts I–IV) ingress link', () => {
    render(<FiresideAuthHeader />);

    const desktopLink = screen.getByRole('link', { name: /switch to desktop theatrical soundstage/i });
    expect(desktopLink).toBeInTheDocument();
    expect(desktopLink).toHaveAttribute('href', '/studio');
    expect(desktopLink).toHaveTextContent(/Desktop Soundstage \(Acts I–IV\)/i);
  });

  it('renders unambiguous "Dev Staging" environment badge to avoid confusion with production stages', () => {
    render(<FiresideAuthHeader />);

    const devStagingBadge = screen.getByTitle(/Deployment Environment: Dev Staging/i);
    expect(devStagingBadge).toBeInTheDocument();
    expect(devStagingBadge).toHaveTextContent(/Dev Staging/i);
  });

  it('renders commit SHA in Dev Staging badge when NEXT_PUBLIC_COMMIT_SHA is present', () => {
    const originalSha = process.env.NEXT_PUBLIC_COMMIT_SHA;
    process.env.NEXT_PUBLIC_COMMIT_SHA = 'acc26b20';

    try {
      render(<FiresideAuthHeader />);
      const devStagingBadge = screen.getByTitle(/Deployment Environment: Dev Staging \(acc26b2\)/i);
      expect(devStagingBadge).toBeInTheDocument();
      expect(devStagingBadge).toHaveTextContent(/Dev Staging • acc26b2/i);
    } finally {
      process.env.NEXT_PUBLIC_COMMIT_SHA = originalSha;
    }
  });

  it('renders "Act II: Story Capture" production stage context pill', () => {
    render(<FiresideAuthHeader />);

    const stageContextPill = screen.getByTitle('Production Context: Act II Equivalent Armchair Story Capture');
    expect(stageContextPill).toBeInTheDocument();
    expect(stageContextPill).toHaveTextContent(/Act II: Story Capture/i);
  });

  it('renders curriculum part title when activePartTitle is provided', () => {
    render(<FiresideAuthHeader activePartTitle="Part 1: Roots & Early Childhood" />);

    const partBadge = screen.getByTitle('Curriculum Alignment: Part 1: Roots & Early Childhood');
    expect(partBadge).toBeInTheDocument();
    expect(partBadge).toHaveTextContent('Part 1');
  });

  it('displays guest session status with link to sign in when unauthenticated', () => {
    mockUser = null;
    render(<FiresideAuthHeader />);

    expect(screen.getByText(/Guest Session/i)).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('displays authenticated user email, Generational Vault status, and discreet Sign Out button when signed in', () => {
    mockUser = {
      uid: 'user_12345',
      email: 'storyteller@family.org',
      isAnonymous: false,
    };
    render(<FiresideAuthHeader />);

    expect(screen.getByText('storyteller@family.org')).toBeInTheDocument();
    expect(screen.getByText(/Generational Vault/i)).toBeInTheDocument();

    const signOutBtn = screen.getByRole('button', { name: /sign out/i });
    expect(signOutBtn).toBeInTheDocument();

    fireEvent.click(signOutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledWith(false);
  });
});
