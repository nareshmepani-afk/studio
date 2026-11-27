import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptCard } from '@/components/prompts/PromptCard';
import { StudioDashboard, resolveStudioCardMedia } from '@/components/studio/StudioDashboard';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => '/studio',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'TQdB395kXxaAGPhFxk1LVWuT8cg2',
      email: 'nareshmepani@hotmail.com',
      displayName: 'Naresh Mepani',
      role: 'Super Admin',
      membershipTier: 'generational_vault',
    },
  }),
}));

vi.mock('@/components/studio/FlightSimulatorCard', () => ({
  FlightSimulatorCard: () => <div data-testid="mock-flight-simulator-card" />,
}));

describe('MW-431: Desktop /studio 16:9 Movie Screening Stage, Shared 2.39:1 Lightbox & Continuity Shield', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1280 });
  });

  it('1. resolveStudioCardMedia resolves 5-tier Soundstage & Fireside media, filters outtakes, and builds dateline + provenance', () => {
    const soundstageMem: any = {
      id: 'ey96djU6qR1BrDGnvZwp',
      status: 'published',
      editingAuthority: 'desktop_locked',
      activeVisionLabel: 'The Flow',
      location: 'Nairobi',
      country: 'Kenya',
      year: 1965,
      narratorAgeAtTime: 1,
      videoUrl: 'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/final.mp4',
      videoDuration: 60,
      takes: [
        {
          id: 'outtake-1',
          takeNumber: 1,
          status: 'outtake',
          mediaMode: 'video',
          mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/outtake.mp4',
          durationSeconds: 12,
        },
        {
          id: 'master-1',
          takeNumber: 2,
          status: 'master',
          isPreferred: true,
          source: 'soundstage_desktop',
          mediaMode: 'video',
          mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/final.mp4',
          durationSeconds: 60,
        },
      ],
    };

    const resolved = resolveStudioCardMedia(soundstageMem);
    expect(resolved.hasRecordedMedia).toBe(true);
    expect(resolved.mediaMode).toBe('video');
    expect(resolved.mediaUrl).toBe(
      'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/final.mp4'
    );
    expect(resolved.durationSeconds).toBe(60);
    expect(resolved.dateline).toBe('Nairobi · Kenya · 1965 · Age 1');
    expect(resolved.originBadgeLabel).toBe('Soundstage · THE FLOW');
  });

  it('2. (1A) renders 16:9 #t=0.5 video stage on IN CINEMA & recorded Pre-Release cards, Voice Slate on audio takes, and Script Draft badge on 0-take scripts with zero nested anchors', () => {
    const onPlaySpy = vi.fn();

    // A) Published IN CINEMA video card
    const { container, rerender } = render(
      <PromptCard
        promptId="p1"
        memoryId="ey96djU6qR1BrDGnvZwp"
        promptText="A Child of Two Worlds"
        storyScript=""
        isCompleted={true}
        status="published"
        hasRecordedMedia={true}
        mediaMode="video"
        mediaUrl="https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/final.mp4"
        durationSeconds={60}
        dateline="Nairobi · Kenya · 1965 · Age 1"
        originBadgeLabel="Soundstage · THE FLOW"
        activeVisionLabel="The Flow"
        memoryDescription="Held close in my parents' arms."
        isFlaggedForReuse={false}
        onStartChapter={vi.fn()}
        onToggleFlagPrompt={vi.fn()}
        onPlayReel={onPlaySpy}
        canAccess={true}
      />
    );

    expect(screen.getByTestId('prompt-card-in-cinema-badge-p1').textContent).toContain('In Cinema');
    const videoEl = screen.getByTestId('prompt-card-video-frame-p1') as HTMLVideoElement;
    expect(videoEl.getAttribute('src')).toBe(
      'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/final.mp4#t=0.5'
    );
    expect(screen.getByTestId('prompt-card-play-medallion-p1')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-card-dateline-p1').textContent).toContain('Nairobi');
    expect(screen.getByTestId('prompt-card-duration-p1').textContent).toBe('1m 00s');
    expect(screen.getByTestId('prompt-card-origin-badge-p1').textContent).toBe(
      'Soundstage · THE FLOW'
    );
    expect(container.querySelector('a a')).toBeNull();

    // B) Audio-only recorded Pre-Release take -> Spoken Voice Slate (zero <video> tags) + clickable Preview button
    rerender(
      <PromptCard
        promptId="p2"
        memoryId="mem_voice_2"
        promptText="The House I Grew Up In"
        storyScript=""
        isCompleted={true}
        status="pre-release"
        hasRecordedMedia={true}
        mediaMode="audio"
        mediaUrl="https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/voice.webm"
        durationSeconds={45}
        memoryDescription="Warm afternoon light across the courtyard."
        isFlaggedForReuse={false}
        onStartChapter={vi.fn()}
        onToggleFlagPrompt={vi.fn()}
        onPlayReel={onPlaySpy}
        canAccess={true}
      />
    );
    expect(screen.queryByTestId('prompt-card-video-frame-p2')).toBeNull();
    expect(screen.getByTestId('prompt-card-slate-fallback-p2')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('prompt-card-preview-reel-btn-p2'));
    expect(onPlaySpy).toHaveBeenCalledTimes(1);

    // C) Written prose only (0 recordings) -> Script Draft badge (not misleading Captured)
    rerender(
      <PromptCard
        promptId="p3"
        memoryId="mem_text_3"
        promptText="Innocence and Curiosity"
        storyScript=""
        isCompleted={true}
        status="draft"
        hasRecordedMedia={false}
        memoryDescription="Remember your school days and teachers."
        isFlaggedForReuse={false}
        onStartChapter={vi.fn()}
        onToggleFlagPrompt={vi.fn()}
        canAccess={true}
      />
    );
    expect(screen.getByTestId('prompt-card-script-draft-badge-p3').textContent).toContain(
      'Script Draft'
    );
    expect(screen.queryByTestId('prompt-card-media-stage-p3')).toBeNull();
  });

  it('3. (2A + MW-433) opens single shared read-only 2.39:1 Cinema Lightbox (with TV Room link & hidden Discard) on /studio card click and navigates directly in 1 click on Edit without a card-clipped modal', () => {
    const chapters: any = [
      {
        id: 'part-i',
        title: 'Part I: Roots and Foundations',
        isCompleted: false,
        publishedCount: 1,
        prompts: [
          {
            id: 'p1',
            title: 'A Child of Two Worlds',
            description: 'Roots',
            requests: [],
            memory: {
              id: 'ey96djU6qR1BrDGnvZwp',
              promptId: 'p1',
              title: 'A Child of Two Worlds',
              prose: 'Held close in my parents arms, flying toward London in 1965.',
              status: 'published',
              editingAuthority: 'desktop_locked',
              activeVisionLabel: 'The Flow',
              location: 'Nairobi',
              country: 'Kenya',
              year: 1965,
              narratorAgeAtTime: 1,
              videoUrl: 'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/final.mp4',
              videoDuration: 60,
            },
          },
        ],
      },
    ];

    const { container } = render(
      <StudioDashboard
        chapters={chapters}
        requests={[]}
        stats={{ totalPossible: 30, recordedCount: 1, videoCount: 1, audioCount: 0, textDraftsCount: 0, published: 1 }}
        initialFlaggedPromptIds={new Set()}
        isLoading={false}
        directorPassStatus="paid_host_pass_active"
      />
    );

    // 2A: Click primary card overlay -> opens shared 2.39:1 Lightbox in 0ms with TV Room link & zero Discard Take button
    const cardOverlay = container.querySelector('[data-hotspot-id="HS_PROMPT_CARD_p1"] a.absolute.inset-0') as HTMLElement;
    fireEvent.click(cardOverlay);

    expect(screen.getByTestId('HS_FIRESIDE_LIGHTBOX_STAGE')).toBeInTheDocument();
    expect(screen.queryByTestId('HS_FIRESIDE_LIGHTBOX_DISCARD_BTN')).toBeNull();
    expect(screen.getByTestId('HS_FIRESIDE_LIGHTBOX_TV_ROOM_LINK').getAttribute('href')).toBe(
      '/cinema/tv?id=ey96djU6qR1BrDGnvZwp'
    );

    // Close Lightbox
    fireEvent.click(screen.getByLabelText('Close theatrical preview'));
    expect(screen.queryByTestId('HS_FIRESIDE_LIGHTBOX_STAGE')).toBeNull();

    // MW-433: Clicking secondary Edit link on desktop (>= 768px) does NOT prevent default or open a card-clipped modal;
    // it navigates directly in 1 click via href="/studio/production/ey96djU6qR1BrDGnvZwp?act=1" just like Scene 2's Edit Scene button
    const editLink = screen.getByTestId('prompt-card-edit-secondary-p1') as HTMLAnchorElement;
    expect(editLink.getAttribute('href')).toBe('/studio/production/ey96djU6qR1BrDGnvZwp?act=1');

    const clickAllowed = fireEvent.click(editLink);
    expect(clickAllowed).toBe(true);
    expect(screen.queryByTestId('prompt-card-continuity-modal-p1')).toBeNull();
    expect(screen.queryByTestId('HS_FIRESIDE_LIGHTBOX_STAGE')).toBeNull();
  });

  it('4. (Option 4) defers #t=0.5 video src until IntersectionObserver signals proximity', () => {
    let intersectCallback: ((entries: any[]) => void) | null = null;
    const disconnectSpy = vi.fn();
    const originalIO = (globalThis as any).IntersectionObserver;

    (globalThis as any).IntersectionObserver = class {
      constructor(cb: (entries: any[]) => void) {
        intersectCallback = cb;
      }
      observe() {}
      disconnect() {
        disconnectSpy();
      }
    };

    try {
      render(
        <PromptCard
          promptId="p_lazy"
          memoryId="mem_lazy_1"
          promptText="Lazy Video Card"
          storyScript=""
          isCompleted={true}
          status="published"
          hasRecordedMedia={true}
          mediaMode="video"
          mediaUrl="https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/lazy.mp4"
          isFlaggedForReuse={false}
          onStartChapter={vi.fn()}
          onToggleFlagPrompt={vi.fn()}
          canAccess={true}
        />
      );

      const videoEl = screen.getByTestId('prompt-card-video-frame-p_lazy') as HTMLVideoElement;
      expect(videoEl.getAttribute('preload')).toBe('none');
      expect(videoEl.getAttribute('src')).toBeNull();

      // Trigger viewport intersection
      fireEvent(window, new Event('scroll'));
      React.act(() => {
        intersectCallback?.([{ isIntersecting: true }]);
      });

      expect(videoEl.getAttribute('preload')).toBe('metadata');
      expect(videoEl.getAttribute('src')).toBe(
        'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/lazy.mp4#t=0.5'
      );
      expect(disconnectSpy).toHaveBeenCalled();
    } finally {
      (globalThis as any).IntersectionObserver = originalIO;
    }
  });
});
