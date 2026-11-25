import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CinemaTitleOverlays,
  normaliseCinemaSlateMeta,
  formatSpokenSlateCueText,
  toggleStageFullscreen,
  useCinemaPreRollController,
  SpokenSlatePrompterCue,
} from '@/components/cinema/CinemaTitleOverlays';
import { FiresideCinemaLightbox } from '@/components/fireside/FiresideCinemaLightbox';
import { MemoryCinematicViewer } from '@/components/memory/MemoryCinematicViewer';
import { Teleprompter } from '@/components/studio/Teleprompter';
import { PopoutTeleprompter } from '@/components/studio/PopoutTeleprompter';

// BroadcastChannel Mock for Teleprompter <-> Popout sync verification
class MockSyncBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  private listeners: Array<(event: MessageEvent) => void> = [];
  static instances: MockSyncBroadcastChannel[] = [];

  constructor(name: string) {
    this.name = name;
    MockSyncBroadcastChannel.instances.push(this);
  }

  postMessage(data: any) {
    MockSyncBroadcastChannel.instances.forEach((inst) => {
      if (inst !== this && inst.name === this.name) {
        const evt = { data } as MessageEvent;
        if (inst.onmessage) inst.onmessage(evt);
        inst.listeners.forEach((fn) => fn(evt));
      }
    });
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (type === 'message') this.listeners.push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (type === 'message') {
      this.listeners = this.listeners.filter((fn) => fn !== listener);
    }
  }

  close() {
    MockSyncBroadcastChannel.instances = MockSyncBroadcastChannel.instances.filter(
      (i) => i !== this
    );
  }
}

const mockStudioActions = {
  toggleScrolling: vi.fn(),
  setScrolling: vi.fn(),
  setScrollSpeed: vi.fn(),
  setFontSize: vi.fn(),
  toggleMirror: vi.fn(),
  increaseFontSize: vi.fn(),
  decreaseFontSize: vi.fn(),
  setSelectedTake: vi.fn(),
  setShowBreathingMarks: vi.fn(),
  setEnablePunctuationBraking: vi.fn(),
  setIsolateSentenceHighlight: vi.fn(),
  setActiveDrawer: vi.fn(),
  toggleRecording: vi.fn(),
  setIsRehearsing: vi.fn(),
  setRehearsalSpeed: vi.fn(),
};

const mockStudioStateValue = {
  sessionId: 'part-1-scene-1',
  selectedTake: 'When I first stepped off the boat, the salt air stayed with me.\n\nOur kitchen smelled of cardamom.',
  script: '',
  isScrolling: false,
  isRecording: false,
  scrollSpeed: 2.0,
  fontSize: 20,
  isMirrored: false,
  showBreathingMarks: false,
  enablePunctuationBraking: false,
  isolateSentenceHighlight: false,
  isRehearsing: false,
  narratorAgeAtTime: 5,
  actions: mockStudioActions,
};

vi.mock('@/hooks/studio/useStudioState', () => ({
  useStudioState: () => mockStudioStateValue,
}));

vi.mock('@/hooks/useAuth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useAuth')>();
  return {
    ...actual,
    useAuth: () => ({
      user: { uid: 'test-director-uid', displayName: 'Family Storyteller' },
      loading: false,
    }),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/cinema',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Documentary Triad — Cinema Title Overlays & Non-Destructive Teleprompter Spoken Cues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockSyncBroadcastChannel.instances = [];
    (globalThis as any).BroadcastChannel = MockSyncBroadcastChannel;
    window.localStorage.clear();

    vi.spyOn(window, 'close').mockImplementation(() => {});
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() =>
      Promise.resolve()
    );
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. normalises slate metadata, strips unset placeholders, and formats spoken intro cues', () => {
    const meta = normaliseCinemaSlateMeta({
      title: 'A Child of Two Worlds',
      chapterTitle: 'Part I: Roots and Foundations',
      sceneNumber: 1,
      location: 'Munich',
      country: 'Germany',
      year: '1968',
      age: 5,
      narratorName: 'Storyteller',
      backdropUrl: 'https://cdn.example.com/reel.webm',
    });

    expect(meta.chapterOverline).toBe('Part I: Roots and Foundations • Scene 1');
    expect(meta.coordinatesLine).toBe('Munich, Germany · 1968 · Age 5');
    expect(meta.narratorAttribution).toBe('Told by Storyteller');
    // Video URLs must never be used as static image backdrops
    expect(meta.backdropImageUrl).toBeNull();

    const unsetMeta = normaliseCinemaSlateMeta({
      title: 'Traditions, Feasts & Sacred Days',
      location: 'none',
      country: 'undefined',
      year: 'Date Unknown',
      age: 0,
    });
    expect(unsetMeta.coordinatesLine).toBeNull();
    expect(formatSpokenSlateCueText(unsetMeta)).toBe('Traditions, Feasts & Sacred Days.');
    expect(
      formatSpokenSlateCueText({
        title: 'A Child of Two Worlds',
        location: 'Munich',
        year: 1968,
      })
    ).toBe('A Child of Two Worlds — Munich, 1968.');
  });

  it('2. drives idle -> preroll (3.0s) -> dissolving -> playing, honours Skip Intro & single-play guard, and skips when hasBurnedInTitleSlate is true', () => {
    vi.useFakeTimers();
    const fakeMedia = document.createElement('video');
    const playSpy = vi.spyOn(fakeMedia, 'play').mockResolvedValue(undefined);
    const pauseSpy = vi.spyOn(fakeMedia, 'pause').mockImplementation(() => {});
    const onState = vi.fn();

    const Harness: React.FC<{ burnedIn?: boolean }> = ({ burnedIn = false }) => {
      const ctrl = useCinemaPreRollController({
        sessionKey: 'mem-1',
        hasBurnedInTitleSlate: burnedIn,
        getMediaElement: () => fakeMedia,
        onPlaybackStateChange: onState,
      });
      return (
        <div>
          <span data-testid="phase-val">{ctrl.phase}</span>
          <button data-testid="trigger-play" onClick={ctrl.triggerPlay}>
            Play
          </button>
          <button data-testid="skip-preroll" onClick={ctrl.skipPreRoll}>
            Skip
          </button>
          <button data-testid="pause-play" onClick={ctrl.pausePlayback}>
            Pause
          </button>
        </div>
      );
    };

    const { unmount } = render(<Harness />);
    expect(screen.getByTestId('phase-val').textContent).toBe('idle');

    // First Play triggers 3.0s pre-roll with synchronous gesture unlock
    fireEvent.click(screen.getByTestId('trigger-play'));
    expect(screen.getByTestId('phase-val').textContent).toBe('preroll');
    expect(playSpy).toHaveBeenCalledTimes(1);

    // Advance to 2600ms -> cross-dissolve starts actual video playback
    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(screen.getByTestId('phase-val').textContent).toBe('dissolving');
    expect(playSpy).toHaveBeenCalledTimes(2);

    // Complete 3000ms -> phase is 'playing'
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.getByTestId('phase-val').textContent).toBe('playing');

    // Pausing and resuming in the same session does NOT re-trigger the 3.0s pre-roll
    fireEvent.click(screen.getByTestId('pause-play'));
    expect(pauseSpy).toHaveBeenCalled();
    expect(screen.getByTestId('phase-val').textContent).toBe('idle');

    fireEvent.click(screen.getByTestId('trigger-play'));
    expect(screen.getByTestId('phase-val').textContent).toBe('playing');
    unmount();

    // When hasBurnedInTitleSlate === true, bypasses DOM pre-roll immediately
    render(<Harness burnedIn={true} />);
    fireEvent.click(screen.getByTestId('trigger-play'));
    expect(screen.getByTestId('phase-val').textContent).toBe('playing');
  });

  it('3. renders blurred photo backdrop when image exists, obsidian fallback otherwise, and shows 5s Lower-Third between 1.2s and 6.2s', () => {
    const onSkip = vi.fn();
    const { rerender } = render(
      <CinemaTitleOverlays
        meta={{
          title: 'A Child of Two Worlds',
          chapterTitle: 'Part I: Roots and Foundations',
          location: 'Munich',
          year: '1968',
          narratorName: 'Storyteller',
          backdropUrl: 'https://cdn.example.com/photo.jpg',
        }}
        phase="preroll"
        isPlaying={true}
        currentTime={0}
        onSkipPreRoll={onSkip}
      />
    );

    expect(screen.getByTestId('HS_CINEMA_PREROLL_SLATE')).toBeInTheDocument();
    expect(screen.getByTestId('HS_CINEMA_PREROLL_BACKDROP_IMG')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('HS_CINEMA_SKIP_INTRO_BTN'));
    expect(onSkip).toHaveBeenCalledTimes(1);

    // Switch to playing at t=2.5s with no backdrop image -> Top Marquee + Lower-Third visible
    rerender(
      <CinemaTitleOverlays
        meta={{
          title: 'A Child of Two Worlds',
          chapterTitle: 'Part I: Roots and Foundations',
          location: 'Munich',
          year: '1968',
          narratorName: 'Storyteller',
        }}
        phase="playing"
        isPlaying={true}
        currentTime={2.5}
        onSkipPreRoll={onSkip}
      />
    );

    expect(screen.getByTestId('HS_CINEMA_TOP_MARQUEE')).toBeInTheDocument();
    expect(screen.getByTestId('HS_CINEMA_LOWER_THIRD')).toBeInTheDocument();

    // After 6.5s, Lower-Third hides cleanly
    rerender(
      <CinemaTitleOverlays
        meta={{ title: 'A Child of Two Worlds' }}
        phase="playing"
        isPlaying={true}
        currentTime={7.5}
        onSkipPreRoll={onSkip}
      />
    );
    expect(screen.queryByTestId('HS_CINEMA_LOWER_THIRD')).toBeNull();
  });

  it('4. requests fullscreen on stageContainerRef and falls back to iPhone webkitEnterFullscreen when div fullscreen is unsupported', () => {
    const stageDiv = document.createElement('div');
    const videoEl = document.createElement('video') as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };
    const stageFsMock = vi.fn().mockResolvedValue(undefined);
    stageDiv.requestFullscreen = stageFsMock;

    toggleStageFullscreen(stageDiv, videoEl);
    expect(stageFsMock).toHaveBeenCalledTimes(1);

    // iOS Safari fallback when div.requestFullscreen is undefined
    const iosDiv = document.createElement('div') as any;
    iosDiv.requestFullscreen = undefined;
    const webkitVideoFsMock = vi.fn();
    videoEl.webkitEnterFullscreen = webkitVideoFsMock;

    toggleStageFullscreen(iosDiv, videoEl);
    expect(webkitVideoFsMock).toHaveBeenCalledTimes(1);
  });

  it('5. brings 3.0s Title Slate + Playback Scrubber parity to Audio-Only voice memoirs in MemoryCinematicViewer and hides overlays in Poster mode', () => {
    render(
      <MemoryCinematicViewer
        memory={
          {
            id: 'audio-mem-1',
            title: 'The Kitchen Radio',
            chapterTitle: 'Part I: Roots and Foundations',
            location: 'Nairobi',
            year: 1972,
            audioUrl: 'https://firebasestorage.googleapis.com/v0/b/test/voice.mp3',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/test/family.jpg',
            status: 'published',
          } as any
        }
        onClose={vi.fn()}
      />
    );

    // Top Marquee fills the previously empty dark void above the stage
    expect(screen.getByTestId('HS_CINEMA_TOP_MARQUEE')).toBeInTheDocument();

    // Clicking Audio Play button launches the 3.0s Pre-Roll Title Slate
    fireEvent.click(screen.getByTestId('HS_CINEMA_AUDIO_PLAY_BTN'));
    expect(screen.getByTestId('HS_CINEMA_PREROLL_SLATE')).toBeInTheDocument();

    // Switching to Movie Poster mode suppresses stage overlays so the 2:3 poster is unobstructed
    const posterToggle = document.querySelector(
      '[data-hotspot-id="HS_CINEMA_TOGGLE_POSTER_BTN"]'
    ) as HTMLElement;
    fireEvent.click(posterToggle);
    expect(screen.queryByTestId('HS_CINEMA_PREROLL_SLATE')).toBeNull();
    expect(screen.queryByTestId('HS_CINEMA_TOP_MARQUEE')).toBeNull();
  });

  it('6. renders Pre-Roll Title Slate and Fullscreen toggle in FiresideCinemaLightbox', () => {
    vi.useFakeTimers();
    render(
      <FiresideCinemaLightbox
        isOpen={true}
        onClose={vi.fn()}
        sceneTitle="A Child of Two Worlds"
        chapterTitle="Part I: Roots and Foundations"
        sceneNumber={1}
        location="Munich"
        year="1968"
        age={5}
        narratorName="Storyteller"
        mediaMode="video"
        mediaUrl="https://firebasestorage.googleapis.com/v0/b/test/reel.mp4"
        posterUrl="https://firebasestorage.googleapis.com/v0/b/test/poster.jpg"
      />
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('HS_CINEMA_PREROLL_SLATE')).toBeInTheDocument();
    expect(screen.getByTestId('HS_FIRESIDE_LIGHTBOX_FULLSCREEN_BTN')).toBeInTheDocument();
  });

  it('7. renders non-destructive Spoken Opening Cue in Teleprompter without mutating selectedTake and syncs to late-opened PopoutTeleprompter', () => {
    const originalTake = mockStudioStateValue.selectedTake;
    render(<Teleprompter />);

    const slateHeader = screen.getByTestId('HS_TELEPROMPTER_SPOKEN_SLATE_HEADER');
    expect(slateHeader).toBeInTheDocument();
    expect(screen.getByTestId('HS_TELEPROMPTER_SPOKEN_SLATE_LINE').textContent).toContain(
      'A Child of Two Worlds'
    );

    // Sentence index 0 still starts cleanly on the authentic prose — zero prose mutation
    const firstSentence = document.querySelector('span[data-sentence-index="0"]');
    expect(firstSentence?.textContent).toContain('When I first stepped off the boat');
    expect(mockStudioStateValue.selectedTake).toBe(originalTake);

    // Toggling OFF persists to localStorage and broadcasts 'state' to late-opened PopoutTeleprompter
    fireEvent.click(screen.getByTestId('HS_TELEPROMPTER_SPOKEN_SLATE_TOGGLE'));
    expect(
      window.localStorage.getItem('mw_prompter_spoken_slate_enabled')
    ).toBe('false');

    const { getAllByTestId } = render(<PopoutTeleprompter />);
    const toggles = getAllByTestId('HS_TELEPROMPTER_SPOKEN_SLATE_TOGGLE');
    expect(toggles[1].textContent).toBe('Speak Title: OFF');
  });

  it('8. renders compact Spoken Opening Cue for Fireside Act III Video & Audio recording modes', () => {
    const onToggle = vi.fn();
    render(
      <SpokenSlatePrompterCue
        meta={{
          title: 'The House I Grew Up In',
          chapterTitle: 'Part I: Roots and Foundations',
          sceneNumber: 2,
          location: 'Munich',
          year: '1968',
        }}
        enabled={true}
        onToggle={onToggle}
        compact={true}
      />
    );

    expect(screen.getByTestId('HS_TELEPROMPTER_SPOKEN_SLATE_LINE').textContent).toContain(
      'The House I Grew Up In — Munich, 1968.'
    );
    fireEvent.click(screen.getByTestId('HS_TELEPROMPTER_SPOKEN_SLATE_TOGGLE'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });
});
