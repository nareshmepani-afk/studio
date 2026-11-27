import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { FiresideCinemaView } from '@/components/fireside/FiresideCinemaView';
import { FiresideCinemaLightbox } from '@/components/fireside/FiresideCinemaLightbox';
import { FiresideCompletedReelCard } from '@/components/fireside/FiresideCompletedReelCard';
import { ChapterSpineRail } from '@/components/navigation/ChapterSpineRail';
import FiresideStudioClient from '@/app/studio/fireside/FiresideStudioClient';

let mockNextPendingSceneId = 'part-2-scene-3';
let mockSceneMap: Record<string, any> = {};

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('id=part-1-scene-1'),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/studio/fireside',
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
    logout: vi.fn(),
  }),
}));

vi.mock('@/hooks/telemetry/useJourneyLogger', () => ({
  useJourneyLogger: () => ({
    logEvent: vi.fn(),
    traceInteraction: vi.fn(),
  }),
}));

vi.mock('@/hooks/useFiresideSync', () => ({
  useFiresideSync: () => ({
    syncState: 'synced',
    isSaving: false,
    isSynced: true,
    isOffline: false,
    progressPercent: 100,
    triggerManualSync: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCurriculumVault', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useCurriculumVault')>();
  return {
    ...actual,
    useCurriculumVault: () => ({
      scenes: mockSceneMap,
      isLoading: false,
      getSceneMemory: (id: string) => mockSceneMap[id],
      saveSceneTake: vi.fn(),
      discardSceneTake: vi.fn(),
      updateSceneProse: vi.fn(),
      updateSceneCoordinates: vi.fn(),
      resolveDocIdForScene: (id: string) => mockSceneMap[id]?.id || id,
      setStoryMoodTag: vi.fn(),
      addBonusMemoryNote: vi.fn(),
      updateBonusMemoryNote: vi.fn(),
      deleteBonusMemoryNote: vi.fn(),
      completedScenes: 6,
      totalScenes: 31,
      vaultProgressPercent: 19,
      nextPendingSceneId: mockNextPendingSceneId,
      promotePreferredTake: vi.fn(),
      reorderSceneTakes: vi.fn(),
      safeDiscardTake: vi.fn(),
      restoreOuttakeTake: vi.fn(),
      publishSceneToCinema: vi.fn(),
      getSceneAccess: (sceneId: string) => ({
        sceneId,
        partNumber: sceneId.startsWith('part-1') ? 1 : 2,
        canViewPrompt: true,
        canWriteScript: true,
        canRecordMedia: true,
        isLockedPreview: false,
        reason: 'entitled',
      }),
    }),
  };
});

describe('Fireside Watch-First Movie Stage, Origin-Aware Continuity Shield & Phase 2 Chapter-Boundary Polish (MW-429 / MW-430)', () => {
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

  beforeEach(() => {
    window.scrollTo = vi.fn() as any;
    mockNextPendingSceneId = 'part-2-scene-3';
    mockSceneMap = {
      'part-1-scene-1': publishedSoundstageScene,
      'part-1-scene-2': {
        ...publishedSoundstageScene,
        id: 'mem-p1s2',
        sceneId: 'part-1-scene-2',
      },
      'part-1-scene-3': {
        ...publishedSoundstageScene,
        id: 'mem-p1s3',
        sceneId: 'part-1-scene-3',
      },
      'part-1-scene-4': {
        ...publishedSoundstageScene,
        id: 'mem-p1s4',
        sceneId: 'part-1-scene-4',
      },
    };
  });

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

    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_CARD')).toBeInTheDocument();
    const videoThumb = screen.getByTestId('HS_FIRESIDE_SHOWCASE_VIDEO_FRAME') as HTMLVideoElement;
    expect(videoThumb.getAttribute('src')).toBe(
      'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/final.mp4#t=0.5'
    );

    expect(screen.getByTestId('HS_FIRESIDE_SHOWCASE_DATELINE').textContent).toContain('Nairobi');
    expect(screen.getByTestId('HS_FIRESIDE_SHOWCASE_DATELINE').textContent).toContain('1965');
    expect(screen.getByTestId('HS_FIRESIDE_SHOWCASE_ORIGIN_BADGE').textContent).toContain(
      'Soundstage · THE FLOW'
    );
    expect(screen.queryByTestId('fireside-click-to-type-container')).toBeNull();

    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SCENE_BADGE').textContent).toBe(
      'PART I • SCENE 1 OF 4'
    );
    expect(screen.getByTestId('carousel-story-progress-pill').textContent).toBe('Scene 1 of 4');

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

    const card = screen.getByTestId('HS_FIRESIDE_PROMPT_CAROUSEL_CARD');
    fireEvent.touchStart(card, { touches: [{ clientX: 300, clientY: 300 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 120, clientY: 302 }] });
    expect(screen.getByTestId('HS_FIRESIDE_ACT_TAB_5')).toHaveAttribute('aria-pressed', 'true');

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

    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_EDIT_BTN'));
    const modal = screen.getByTestId('HS_FIRESIDE_MODAL_CONTINUITY_WARN');
    expect(modal).toBeInTheDocument();
    expect(modal.textContent).toContain('Desktop Soundstage');
    expect(modal.textContent).toContain('THE FLOW');
    expect(modal.textContent).toContain('will not change the spoken words already recorded');
    expect(container.querySelectorAll('a[href*="/studio/production"]').length).toBe(0);

    fireEvent.click(screen.getByTestId('HS_FIRESIDE_MODAL_CONTINUITY_KEEP_SAFE_BTN'));
    expect(screen.queryByTestId('HS_FIRESIDE_MODAL_CONTINUITY_WARN')).toBeNull();
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_CARD')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_EDIT_BTN'));
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_MODAL_CONTINUITY_BONUS_BTN'));
    expect(onBonusSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_CARD')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_EDIT_BTN'));
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_MODAL_CONTINUITY_UNLOCK_BTN'));
    expect(screen.queryByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_CARD')).toBeNull();
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_DONE_EDIT_BTN')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN'));
    const textarea = screen.getByTestId('HS_FIRESIDE_SCRIPT_TEXTAREA') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_DONE_EDIT_BTN'));
    expect(onSaveProseSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_CARD')).toBeInTheDocument();

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

    expect(screen.queryByTestId('HS_FIRESIDE_SHOWCASE_VIDEO_FRAME')).toBeNull();
    expect(screen.getByTestId('HS_FIRESIDE_SHOWCASE_STATUS_BADGE').textContent).toContain('Captured');
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_PUBLISH_BTN'));
    expect(onPublishSpy).toHaveBeenCalledWith('part-1-scene-1');

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

  it('5. MW-430 (3A): opens root Full-Card Protected Master Modal on Discard Take in FiresideCinemaLightbox (Esc dismisses modal first; never discards) and Outtake Safety Modal on unpublished takes', () => {
    const onCloseSpy = vi.fn();
    const onDiscardSpy = vi.fn();
    const onAltTakeSpy = vi.fn();
    const onBonusSpy = vi.fn();

    const { rerender, container } = render(
      <FiresideCinemaLightbox
        isOpen={true}
        onClose={onCloseSpy}
        onDiscardTake={onDiscardSpy}
        onRecordAlternateTake={onAltTakeSpy}
        onOpenBonusDrawer={onBonusSpy}
        isProtectedMasterReel={true}
        isPublishedInCinema={true}
        activeWeaveLabel="The Flow"
        editingAuthority="desktop_locked"
        sceneTitle="A Child of Two Worlds"
        mediaUrl="https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/final.mp4"
        mediaMode="video"
      />
    );

    expect(screen.getByTestId('HS_FIRESIDE_LIGHTBOX_DISCARD_BTN').textContent).toBe('Discard Take');
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_LIGHTBOX_DISCARD_BTN'));

    const protectedModal = screen.getByTestId('HS_FIRESIDE_LIGHTBOX_PROTECTED_MASTER_MODAL');
    expect(protectedModal.textContent).toContain('Soundstage Master · Live in Cinema');
    expect(protectedModal.textContent).toContain('THE FLOW');
    expect(protectedModal.textContent).toContain('Desktop Soundstage');
    expect(container.querySelectorAll('a[href*="/studio/production"]').length).toBe(0);
    expect(screen.queryByTestId('HS_FIRESIDE_DISCARD_CONFIRM_BTN')).toBeNull();

    // Esc dismisses the modal first without closing the Lightbox
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('HS_FIRESIDE_LIGHTBOX_PROTECTED_MASTER_MODAL')).toBeNull();
    expect(onCloseSpy).not.toHaveBeenCalled();

    // Re-open -> Record Alternate Take Instead
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_LIGHTBOX_DISCARD_BTN'));
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_LIGHTBOX_ALT_TAKE_BTN'));
    expect(onAltTakeSpy).toHaveBeenCalledTimes(1);
    expect(onDiscardSpy).not.toHaveBeenCalled();

    // Re-open -> Add Bonus Note or Photo Instead
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_LIGHTBOX_DISCARD_BTN'));
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_LIGHTBOX_MODAL_BONUS_BTN'));
    expect(onBonusSpy).toHaveBeenCalledTimes(1);
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    expect(onDiscardSpy).not.toHaveBeenCalled();

    // Unpublished Fireside take -> Outtake Safety Modal preserving Cancel & Confirm Discard
    rerender(
      <FiresideCinemaLightbox
        isOpen={true}
        onClose={onCloseSpy}
        onDiscardTake={onDiscardSpy}
        isProtectedMasterReel={false}
        editingAuthority="fireside_flexible"
        sceneTitle="Voices Around the Table"
        mediaUrl="https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/take2.webm"
        mediaMode="video"
      />
    );
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_LIGHTBOX_DISCARD_BTN'));
    const outtakeModal = screen.getByTestId('HS_FIRESIDE_LIGHTBOX_OUTTAKE_MODAL');
    expect(outtakeModal.textContent).toContain('Move Take to Outtakes?');
    expect(outtakeModal.textContent).toContain('stay 100% untouched');
    expect(screen.getByTestId('HS_FIRESIDE_DISCARD_CANCEL_BTN').textContent).toContain('Cancel');
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_DISCARD_CONFIRM_BTN'));
    expect(onDiscardSpy).toHaveBeenCalledTimes(1);
  });

  it('6. MW-430 (3A / 1i): guards 1-take protected Masters in FiresideCompletedReelCard and locks Master swaps while supporting <audio> audition in VideoSelectionRoomDrawer', () => {
    const onSafeDiscardSpy = vi.fn();
    const { rerender } = render(
      <FiresideCompletedReelCard
        sceneId="part-1-scene-1"
        sceneTitle="A Child of Two Worlds"
        sceneMemory={publishedSoundstageScene as any}
        editingAuthority="desktop_locked"
        isProtectedMasterReel={true}
        isPublishedInCinema={true}
        activeWeaveLabel="The Flow"
        onWatchTheatricalReel={vi.fn()}
        onAddBonusNote={vi.fn()}
        onSafeDiscardTake={onSafeDiscardSpy}
      />
    );

    // 1-take protected Master -> opens HS_FIRESIDE_CARD_PROTECTED_MASTER_MODAL instead of destructive clear
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CARD_DISCARD_BTN'));
    expect(screen.getByTestId('HS_FIRESIDE_CARD_PROTECTED_MASTER_MODAL')).toBeInTheDocument();
    expect(screen.queryByTestId('HS_FIRESIDE_DISCARD_CONFIRM_BTN')).toBeNull();
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CARD_KEEP_MASTER_BTN'));
    expect(onSafeDiscardSpy).not.toHaveBeenCalled();

    // 2-take protected Master (video Master + spoken-voice alternate) -> "Audition & Manage Takes (2)" + 1i drawer lock
    const twoTakeProtectedScene = {
      ...publishedSoundstageScene,
      takes: [
        ...publishedSoundstageScene.takes,
        {
          id: 'take-voice-alt-2',
          takeNumber: 2,
          source: 'fireside_mobile' as const,
          mediaMode: 'audio' as const,
          label: 'Take 2 (Fireside Voice Audition)',
          isPreferred: false,
          status: 'alternate' as const,
          mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev/o/alt.webm',
          durationSeconds: 35,
          createdAt: '2026-11-26T10:00:00Z',
        },
      ],
    };

    rerender(
      <FiresideCompletedReelCard
        sceneId="part-1-scene-1"
        sceneTitle="A Child of Two Worlds"
        sceneMemory={twoTakeProtectedScene as any}
        editingAuthority="desktop_locked"
        isProtectedMasterReel={true}
        isPublishedInCinema={true}
        activeWeaveLabel="The Flow"
        onWatchTheatricalReel={vi.fn()}
        onAddBonusNote={vi.fn()}
        onSafeDiscardTake={onSafeDiscardSpy}
      />
    );

    const manageBtn = screen.getByTestId('HS_FIRESIDE_CARD_DISCARD_BTN');
    expect(manageBtn.textContent).toContain('Audition & Manage Takes (2)');
    fireEvent.click(manageBtn);

    expect(screen.getByTestId('fireside-master-locked-pill')).toBeInTheDocument();
    expect(screen.queryByTestId('fireside-discard-btn-take-master-1')).toBeNull();
    expect(screen.getByTestId('fireside-desktop-swap-lock-take-voice-alt-2')).toBeInTheDocument();
    expect(screen.queryByTestId('fireside-promote-btn-take-voice-alt-2')).toBeNull();

    // Spoken-voice alternate renders dedicated <audio> audition strip and remains movable to Outtakes
    fireEvent.click(screen.getByTestId('fireside-audition-btn-take-voice-alt-2'));
    expect(screen.getByTestId('fireside-audio-audition-take-voice-alt-2')).toBeInTheDocument();
    expect(screen.getByTestId('fireside-discard-btn-take-voice-alt-2')).toBeInTheDocument();
  });

  it('7. MW-430 (1A + 2A + 3B): places Next in Part I + Indigo Leaving-Part-I panel below Takes/Notes, supports 1-tap Switch + Return-to-Part-I undo banner, deduplicates same-Part next, and renders Watch Film in mobile bottom bar', () => {
    const { unmount } = render(<FiresideStudioClient />);

    // 3B: Mobile bottom bar uses concise "Watch Film" while main Showcase Card keeps "Watch in Cinema ▶"
    expect(screen.getByTestId('HS_FIRESIDE_BOTTOM_PRIMARY_CTA').textContent).toBe('Watch Film');
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SHOWCASE_WATCH_BTN').textContent).toContain(
      'Watch in Cinema'
    );

    // 1A DOM Order: Vault Tools Panel MUST appear BEFORE Next-in-Memoir Panel
    const vaultPanel = screen.getByTestId('HS_FIRESIDE_VAULT_TOOLS_PANEL');
    const nextMemoirPanel = screen.getByTestId('HS_FIRESIDE_NEXT_MEMOIR_PANEL');
    expect(
      Boolean(vaultPanel.compareDocumentPosition(nextMemoirPanel) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true);

    // Tier 1 stays inside Part I; Tier 2 signals Leaving Part I -> Part II
    expect(screen.getByTestId('HS_FIRESIDE_SAME_PART_NEXT_CARD').textContent).toContain(
      'Next in Part I · Scene 2 of 4 · ✓ Woven'
    );
    const crossPartCard = screen.getByTestId('HS_FIRESIDE_SPINE_UP_NEXT_CARD');
    expect(crossPartCard.textContent).toContain('✓ Part I Complete (4 of 4 Woven)');
    expect(crossPartCard.textContent).toContain('Move Away from Part I');
    expect(screen.getByTestId('HS_FIRESIDE_UP_NEXT_CONTINUE_BTN').textContent).toBe(
      'Switch to Part II · Scene 3 →'
    );

    // 2A: 1-tap Switch to Part II · Scene 3 -> mounts Top-of-Stage Undo Banner; Return to Part I restores Scene 1
    fireEvent.click(screen.getByTestId('HS_FIRESIDE_UP_NEXT_CONTINUE_BTN'));
    const undoBanner = screen.getByTestId('HS_FIRESIDE_CHAPTER_SWITCH_UNDO_BANNER');
    expect(undoBanner.textContent).toContain('Switched from Part I · Scene 1 to Part II · Scene 3');

    fireEvent.click(screen.getByTestId('HS_FIRESIDE_CHAPTER_SWITCH_UNDO_BTN'));
    expect(screen.queryByTestId('HS_FIRESIDE_CHAPTER_SWITCH_UNDO_BANNER')).toBeNull();
    expect(screen.getByTestId('HS_FIRESIDE_CAROUSEL_SCENE_BADGE').textContent).toBe(
      'PART I • SCENE 1 OF 4'
    );
    unmount();

    // 1A Deduplication: when nextPendingSceneId is already in Part I (part-1-scene-2), Indigo cross-Part card is omitted
    mockNextPendingSceneId = 'part-1-scene-2';
    delete mockSceneMap['part-1-scene-2'];
    render(<FiresideStudioClient />);
    expect(screen.getByTestId('HS_FIRESIDE_SAME_PART_NEXT_CARD')).toBeInTheDocument();
    expect(screen.queryByTestId('HS_FIRESIDE_SPINE_UP_NEXT_CARD')).toBeNull();
  });
});
