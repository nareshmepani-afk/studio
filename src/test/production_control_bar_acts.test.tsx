import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductionControlBar } from '@/components/studio/ProductionControlBar';
import { StudioProvider } from '@/hooks/studio/useStudioState';
import { toast } from 'sonner';

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  }
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/studio/production/test',
  useSearchParams: () => new URLSearchParams(),
}));

describe('ProductionControlBar: Act-Specific Guidance & UK English Invariants', () => {
  const defaultProps = {
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onRetake: vi.fn(),
    onPublish: vi.fn(),
    onSelectRoom: vi.fn(),
  };

  const renderWithStudio = (ui: React.ReactElement, initialStage = 0) => {
    return render(
      <StudioProvider initialState={{ currentStage: initialStage, isCleanView: false }}>
        {ui}
      </StudioProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Act III Stage Door Lobby vs Inside Recording Booth', () => {
    it('renders STEP INTO SOLO BOOTH in ready state when at Stage Door (isLobbyConfirmed: false)', () => {
      const onSelectRoomMock = vi.fn();
      renderWithStudio(
        <ProductionControlBar
          {...defaultProps}
          currentStage={2}
          isComplete={false}
          isLobbyConfirmed={false}
          activeRoom="solo"
          onSelectRoom={onSelectRoomMock}
          missingRequirements={['Recorded Video Take']}
        />,
        2
      );

      const btn = screen.getByRole('button', { name: /STEP INTO SOLO BOOTH/i });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain('bg-emerald-500');

      // Clicking directly triggers onSelectRoom to unlatch the booth door
      fireEvent.click(btn);
      expect(onSelectRoomMock).toHaveBeenCalledWith('solo');
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('renders STEP INTO COLLAB SUITE when activeRoom is collaborative at Stage Door', () => {
      const onSelectRoomMock = vi.fn();
      renderWithStudio(
        <ProductionControlBar
          {...defaultProps}
          currentStage={2}
          isComplete={false}
          isLobbyConfirmed={false}
          activeRoom="collaborative"
          onSelectRoom={onSelectRoomMock}
          missingRequirements={['Recorded Video Take']}
        />,
        2
      );

      const btn = screen.getByRole('button', { name: /STEP INTO COLLAB SUITE/i });
      expect(btn).toBeInTheDocument();

      fireEvent.click(btn);
      expect(onSelectRoomMock).toHaveBeenCalledWith('collaborative');
    });

    it('renders FINALISE FOOTAGE (UK English) in disabled state once inside booth (isLobbyConfirmed: true) without take', () => {
      renderWithStudio(
        <ProductionControlBar
          {...defaultProps}
          currentStage={2}
          isComplete={false}
          isLobbyConfirmed={true}
          activeRoom="solo"
          missingRequirements={['Recorded Video Take']}
        />,
        2
      );

      const btn = screen.getByRole('button', { name: /FINALISE FOOTAGE/i });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain('border-rose-500/30');

      // Clicking triggers actionable VIDEO TAKE REQUIRED toast with Record Take CTA
      fireEvent.click(btn);
      expect(toast.warning).toHaveBeenCalledWith(
        'VIDEO TAKE REQUIRED',
        expect.objectContaining({
          description: 'Please record a video take of your performance before finalising footage.',
          action: expect.objectContaining({
            label: 'Record Take ↗'
          })
        })
      );
    });

    it('renders FINALISE FOOTAGE in ready emerald state once video take is complete', () => {
      const onNextMock = vi.fn();
      renderWithStudio(
        <ProductionControlBar
          {...defaultProps}
          currentStage={2}
          isComplete={true}
          isLobbyConfirmed={true}
          onNext={onNextMock}
          missingRequirements={[]}
        />,
        2
      );

      const btn = screen.getByRole('button', { name: /FINALISE FOOTAGE/i });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain('bg-emerald-500');

      fireEvent.click(btn);
      expect(onNextMock).toHaveBeenCalled();
    });
  });

  describe('2. Act I (Scriptorium) & Act II (Weave) Guidance', () => {
    it('Act I triggers CATALYSTS REQUIRED with Take Me There CTA on incomplete catalysts', () => {
      renderWithStudio(
        <ProductionControlBar
          {...defaultProps}
          currentStage={0}
          isComplete={false}
          missingRequirements={['Theatrical Title', 'City / Venue']}
        />,
        0
      );

      const btn = screen.getByRole('button', { name: /ENTER THE WEAVE/i });
      fireEvent.click(btn);

      expect(toast.error).toHaveBeenCalledWith(
        'CATALYSTS REQUIRED',
        expect.objectContaining({
          description: expect.stringContaining('Theatrical Title, City / Venue'),
          action: expect.objectContaining({
            label: 'Take Me There ↗'
          })
        })
      );
    });

    it('Act II triggers WEAVE SELECTION REQUIRED with Select Weave CTA when treatment unselected', () => {
      renderWithStudio(
        <ProductionControlBar
          {...defaultProps}
          currentStage={1}
          isComplete={false}
          missingRequirements={['Sensory Weave Selection']}
        />,
        1
      );

      const btn = screen.getByRole('button', { name: /ENTER RECORDING STUDIO/i });
      fireEvent.click(btn);

      expect(toast.warning).toHaveBeenCalledWith(
        'WEAVE SELECTION REQUIRED',
        expect.objectContaining({
          description: expect.stringContaining('select a cinematic weave treatment card'),
          action: expect.objectContaining({
            label: 'Select Weave ↗'
          })
        })
      );
    });
  });

  describe('3. Act IV (Director\'s Cut) Guidance', () => {
    it('Act IV triggers DIRECTOR\'S CUT REQUIRED with Review Reel CTA when requirements incomplete', () => {
      renderWithStudio(
        <ProductionControlBar
          {...defaultProps}
          currentStage={3}
          isComplete={false}
          missingRequirements={['Anchored Movie Key Art Poster']}
        />,
        3
      );

      const btn = screen.getByRole('button', { name: /PREPARE PREMIERE/i });
      fireEvent.click(btn);

      expect(toast.warning).toHaveBeenCalledWith(
        'DIRECTOR\'S CUT REQUIRED',
        expect.objectContaining({
          description: expect.stringContaining('review your master reel and anchor a movie key art poster'),
          action: expect.objectContaining({
            label: 'Review Reel ↗'
          })
        })
      );
    });
  });

  describe('4. Rule 20 Mandatory British English Orthography Invariants', () => {
    it('uses British English spelling for FINALISE, SYNTHESISING, and Stage 2 Mentorship hotspot', () => {
      // Act III: FINALISE FOOTAGE
      const { unmount } = renderWithStudio(
        <ProductionControlBar
          {...defaultProps}
          currentStage={2}
          isComplete={true}
          isLobbyConfirmed={true}
          mentorActive={true}
        />,
        2
      );
      expect(screen.getByText('FINALISE FOOTAGE')).toBeInTheDocument();
      expect(screen.queryByText('FINALIZE FOOTAGE')).not.toBeInTheDocument();
      unmount();

      // Act I: SYNTHESISING... when pending
      renderWithStudio(
        <ProductionControlBar
          {...defaultProps}
          currentStage={0}
          isComplete={true}
        />,
        0
      );
      expect(screen.queryByText('SYNTHESIZING...')).not.toBeInTheDocument();
    });
  });
});
