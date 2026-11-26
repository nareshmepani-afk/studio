import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { FiresideCinemaView } from '@/components/fireside/FiresideCinemaView';
import { ChapterSpineRail } from '@/components/navigation/ChapterSpineRail';

describe('Fireside Watch-First Movie Stage, Origin-Aware Continuity Shield & Scene/Act Signposting', () => {
  const publishedSoundstageScene = {
    id: 'ey96djU6qR1BrDGnvZwp',
    sceneId: 'part-1-scene-1',
    status: 'published' as const,
    currentStatus: 'mastered' as const,
    editingAuthority: 'desktop_locked' as const,
    activeVisionLabel: 'The Flow',
    prose: 'Held close in my parents arms, I was only a one-year-old child crossing the skies toward London.',
    location: 'Nairobi',
    country: 'Kenya',
    year: 1965,
    narratorAgeAtTime: 1,
    photos: [],
    takes: [
      {
        id: 'take-master-1',
        takeNumber: 1,
        source: 'soundstage_desktop' as const,
        mediaMode: 'video' as const,
        label: 'Take 1 (Soundstage Master)',
        isPreferred: true,
        status: 'master' as const,
        mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/final.mp4',
        durationSeconds: 60,
        createdAt: '2026-11-25T12:00:00Z',
      },
    ],
  };

  it('1. renders enlarged 16:9 Movie Screening Hero Stage with #t=0.5 video fallback, PART I • SCENE 1 OF 4 badge, spotlighted ACT V, and zero click-to-type on published Soundstage scenes', () => {
    const onWatchSpy = vi.fn();
    const { container } = render(
      <SingleCardPromptCarousel
        fireside2MobileMode={true}
        hideInlineHeaderStepper={true}
        activeSceneMemory={publishedSoundstageScene}
        getSceneMemory={(id) => (id === 'part-1-scene-1' ? publishedSoundstageScene : undefined)}
        editingAuthority="desktop_locked"
        onOpenScreeningRoom={onWatchSpy}
      />
    );

    // Hero Showcase Card + #t=0.5 video frame fallback when posterUrl is null
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_CARD')).toBeInTheDocument();
    const videoThumb = screen.getByTestId('HS_FIRESIDE_SHOWCASE_VIDEO_FRAME') as HTMLVideoElement;
    expect(videoThumb.getAttribute('src')).toBe(
      'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/final.mp4#t=0.5'
    );

    // Dateline & Provenance inside poster; click-to-type container suppressed
    expect(screen.getByTestId('HS_FIRESIDE_SHOWCASE_DATELINE').textContent).toContain('Nairobi');
    expect(screen.getByTestId('HS_FIRESIDE_SHOWCASE_DATELINE').textContent).toContain('1965');
    expect(screen.getByTestId('HS_FIRESIDE_SHOWCASE_ORIGIN_BADGE').textContent).toContain(
      'Soundstage · THE FLOW'
    );
    expect(screen.queryByTestId('fireside-click-to-type-container')).toBeNull();

    // Gold PART I • SCENE 1 OF 4 badge + sr-only Scene 1 of 4 progress pill preserved
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SCENE_BADGE').textContent).toBe(
      'PART I • SCENE 1 OF 4'
    );
    expect(screen.getByTestId('carousel-story-progress-pill').textContent).toBe('Scene 1 of 4');

    // Single-spotlight ACT V + muted slate I–IV + exact 5 mobile/desktop spans
    const tab5 = screen.getByTestId('HS_FIRESIDE_ACT_TAB_5');
    const tab2 = screen.getByTestId('HS_FIRESIDE_ACT_TAB_2');
    expect(tab5).toHaveAttribute('aria-pressed', 'true');
    expect(tab2).toHaveAttribute('aria-pressed', 'false');
    expect(tab2.className).toContain('bg-stone-950/70');
    expect(screen.getByTestId('HS_FIRESIDE_ACTIVE_ACT_CAPTION').textContent).toContain(
      'Viewing Act V of V · Premiered in Family Cinema'
    );
    expect(
      container.querySelectorAll('[data-testid^="HS_FIRESIDE_ACT_TAB_"] span.sm\\:hidden').length
    ).toBe(5);
    expect(
      container.querySelectorAll('[data-testid^="HS_FIRESIDE_ACT_TAB_"] span.hidden').length
    ).toBe(5);

    // Horizontal swipe locked in Showcase Mode
    const card = screen.getByTestId('HS_FIRESIDE_PROMPT_CAROUSEL_CARD');
    fireEvent.touchStart(card, { touches: [{ clientX: 300, clientY: 300 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 120, clientY: 302 }] });
    expect(screen.getByTestId('HS_FIRESIDE_ACT_TAB_5')).toHaveAttribute('aria-pressed', 'true');

    // Instant Play Watch in Cinema CTA
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_WATCH_BTN'));
    expect(onWatchSpy).toHaveBeenCalledTimes(1);
  });

  it('2. intercepts Edit & &edit=true on published Soundstage scenes with Origin-Aware Continuity Warning Modal, saves non-empty prose on Done Editing, and guards against empty-string wipes', () => {
    const onSaveProseSpy = vi.fn();
    const onBonusSpy = vi.fn();
    const onDoneEditingSpy = vi.fn();

    const { container } = render(
      <SingleCardPromptCarousel
        fireside2MobileMode={true}
        activeSceneMemory={publishedSoundstageScene}
        getSceneMemory={(id) => (id === 'part-1-scene-1' ? publishedSoundstageScene : undefined)}
        editingAuthority="desktop_locked"
        onSaveProse={onSaveProseSpy}
        onOpenBonusDrawer={onBonusSpy}
        onDoneEditing={onDoneEditingSpy}
      />
    );

    // 1. Tap 🔒 Edit -> Continuity Warning Modal opens; Showcase stays safely behind it; zero /studio/production links
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_EDIT_BTN'));
    const modal = screen.getByTestId('HS_FIRESIDE_MODAL_CONTINUITY_WARN');
    expect(modal).toBeInTheDocument();
    expect(modal.textContent).toContain('Desktop Soundstage');
    expect(modal.textContent).toContain('THE FLOW');
    expect(modal.textContent).toContain('will not change the spoken words already recorded');
    expect(container.querySelectorAll('a[href*="/studio/production"]').length).toBe(0);

    // 2. Keep Safe -> closes modal and stays on Showcase Stage
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_MODAL_CONTINUITY_KEEP_SAFE_BTN'));
    expect(screen.queryByTestId('HS_FIRESIDE_MODAL_CONTINUITY_WARN')).toBeNull();
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_CARD')).toBeInTheDocument();

    // 3. Re-open modal -> Add Bonus Note Instead -> opens Bonus Drawer
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_EDIT_BTN'));
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_MODAL_CONTINUITY_BONUS_BTN'));
    expect(onBonusSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_CARD')).toBeInTheDocument();

    // 4. Re-open modal -> Unlock Script & Coordinates Anyway -> expands Act I Workbench + Done Editing pill
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_EDIT_BTN'));
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_MODAL_CONTINUITY_UNLOCK_BTN'));
    expect(screen.queryByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_CARD')).toBeNull();
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_DONE_EDIT_BTN')).toBeInTheDocument();

    // 5. Open textarea, clear to empty whitespace, click Done Editing -> empty-wipe shield cancels & preserves prose!
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN'));
    const textarea = screen.getByTestId('HS_FIRESIDE_SCRIPT_TEXTAREA') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_DONE_EDIT_BTN'));
    expect(onSaveProseSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_CARD')).toBeInTheDocument();

    // 6. Continuity Gate re-locked! Unlock again, type valid prose update, click Done Editing -> saves in 0ms!
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_EDIT_BTN'));
    expect(screen.getByTestId('HS_FIRESIDE_MODAL_CONTINUITY_WARN')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_MODAL_CONTINUITY_UNLOCK_BTN'));
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN'));
    fireEvent.change(screen.getByTestId('HS_FIRESIDE_SCRIPT_TEXTAREA'), {
      target: { value: 'Held close in my parents arms, flying from Nairobi to London in 1965.' },
    });
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_DONE_EDIT_BTN'));
    expect(onSaveProseSpy).toHaveBeenCalledWith(
      'part-1-scene-1',
      'Held close in my parents arms, flying from Nairobi to London in 1965.'
    );
    expect(onDoneEditingSpy).toHaveBeenCalled();
  });

  it('3. mounts inlineAct3RecorderNode on completed scenes when forceRecordMode={true} (&record=true / Retake) and avoids <video> #t=0.5 on audio-only takes', () => {
    const audioOnlyCapturedScene = {
      id: 'mem-voice-2',
      sceneId: 'part-1-scene-1',
      currentStatus: 'captured' as const,
      editingAuthority: 'fireside_flexible' as const,
      prose: 'Warm voice recollection around the brass spice tin.',
      photos: [],
      takes: [
        {
          id: 'take-voice-1',
          takeNumber: 1,
          source: 'fireside_mobile' as const,
          mediaMode: 'audio' as const,
          label: 'Voice Take 1',
          isPreferred: true,
          mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/voice.webm',
          durationSeconds: 42,
          createdAt: '2026-11-25T13:00:00Z',
        },
      ],
    };

    const onPublishSpy = vi.fn();
    const { rerender } = render(
      <SingleCardPromptCarousel
        fireside2MobileMode={true}
        activeSceneMemory={audioOnlyCapturedScene}
        getSceneMemory={(id) => (id === 'part-1-scene-1' ? audioOnlyCapturedScene : undefined)}
        editingAuthority="fireside_flexible"
        onPublishToCinema={onPublishSpy}
      />
    );

    // Audio-only take uses Obsidian & Gold fallback (zero <video> #t=0.5 tag) and shows CAPTURED + Publish to Cinema
    expect(screen.queryByTestId('HS_FIRESIDE_SHOWCASE_VIDEO_FRAME')).toBeNull();
    expect(screen.getByTestId('HS_FIRESIDE_SHOWCASE_STATUS_BADGE').textContent).toContain('Captured');
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_PUBLISH_BTN'));
    expect(onPublishSpy).toHaveBeenCalledWith('part-1-scene-1');

    // Rerender with forceRecordMode={true} + selectedActStage={3} -> mounts inlineAct3RecorderNode in-place!
    rerender(
      <SingleCardPromptCarousel
        fireside2MobileMode={true}
        forceRecordMode={true}
        selectedActStage={3}
        activeSceneMemory={publishedSoundstageScene}
        getSceneMemory={(id) => (id === 'part-1-scene-1' ? publishedSoundstageScene : undefined)}
        inlineAct3RecorderNode={<div data-testid="mock-live-inline-recorder">Live Camera Floor</div>}
      />
    );
    expect(screen.queryByTestId('HS_FIRESIDE_ACT3_RECORDED_VIEW')).toBeNull();
    expect(screen.getByTestId('HS_FIRESIDE_INLINE_ACT3_RECORDER')).toBeInTheDocument();
    expect(screen.getByTestId('mock-live-inline-recorder')).toBeInTheDocument();
  });

  it('4. preserves CheckCircle2 + Scene prefix on completed active scene in ChapterSpineRail and renders #t=0.5 video thumb in FiresideCinemaView', () => {
    render(
      <>
        <ChapterSpineRail
          scenes={[
            {
              id: 'part-1-scene-1',
              index: 0,
              sceneNumber: 1,
              title: 'A Child of Two Worlds',
              partNumber: 1,
              partTitle: 'Part I: Roots and Foundations',
              hasCompletedReel: true,
              hasDraftProse: true,
              takesCount: 1,
            },
          ]}
          activeSceneId="part-1-scene-1"
          onSelectScene={vi.fn()}
          orientation="horizontal"
        />
        <FiresideCinemaView
          directorName="Naresh Mepani"
          wovenCount={1}
          totalScenes={31}
          wovenPercent={3}
          premieredCount={1}
          getSceneMemory={(id) => (id === 'part-1-scene-1' ? (publishedSoundstageScene as any) : undefined)}
          resolveDocIdForScene={() => 'ey96djU6qR1BrDGnvZwp'}
          onWatchSceneReel={vi.fn()}
          onOpenSceneInStudio={vi.fn()}
        />
      </>
    );

    expect(screen.getByTestId('HS_SPINE_ACTIVE_SCENE').textContent).toBe(
      'Scene 1 · A Child of Two Worlds'
    );
    const cinemaVideoThumb = screen.getByTestId(
      'fireside-cinema-video-thumb-part-1-scene-1'
    ) as HTMLVideoElement;
    expect(cinemaVideoThumb.getAttribute('src')).toContain('#t=0.5');
  });
});
