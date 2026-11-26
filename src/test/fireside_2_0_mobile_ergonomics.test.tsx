import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import {
  isScenePremium,
  hasFullCurriculumEntitlement,
  evaluateSceneAccess,
} from '@/lib/curriculum/entitlements';
import { computeVaultProgressMetrics } from '@/lib/curriculum/vaultProgressMetrics';
import { useCurriculumVault } from '@/hooks/useCurriculumVault';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { FiresideMobileTopBar } from '@/components/fireside/FiresideMobileTopBar';
import { FiresideCinemaView, FiresideBottomBar } from '@/components/fireside/FiresideCinemaView';
import { FiresideCinemaLightbox } from '@/components/fireside/FiresideCinemaLightbox';
import { PromptCard } from '@/components/prompts/PromptCard';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/studio',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/firebase', () => ({
  db: null,
}));

describe('Fireside 2.0 Mobile Ergonomics, 5-Act Swipe, In-App Cinema & Entitlement Parity', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('1. Entitlement Parity (StudioDashboard.tsx:374) & Rule 7 Grandfathering Shield', () => {
    it('unlocks all 4 Part I scenes for Free Forever / Guest while marking Part II–VI & Anthology as premium', () => {
      expect(isScenePremium('p1')).toBe(false);
      expect(isScenePremium('p2')).toBe(false);
      expect(isScenePremium('p3')).toBe(false);
      expect(isScenePremium('p3_b')).toBe(false);
      expect(isScenePremium('part-1-scene-1')).toBe(false);
      expect(isScenePremium('part-1-scene-4')).toBe(false);

      expect(isScenePremium('p4')).toBe(true);
      expect(isScenePremium('part-2-scene-1')).toBe(true);
      expect(isScenePremium('part-5-scene-2')).toBe(true);
      expect(isScenePremium('fs1_1')).toBe(true);
    });

    it('enforces paid_host_pass_active, generational_vault, or Super Admin for Part II–VI writes while grandfathering already-recorded memories', () => {
      expect(hasFullCurriculumEntitlement(null)).toBe(false);
      expect(hasFullCurriculumEntitlement({ directorPassStatus: 'free_host_pass_active' })).toBe(false);
      expect(hasFullCurriculumEntitlement({ directorPassStatus: 'no_pass_initiated' })).toBe(false);
      expect(hasFullCurriculumEntitlement({ directorPassStatus: 'paid_host_pass_active' })).toBe(true);
      expect(hasFullCurriculumEntitlement({ membershipTier: 'generational_vault' })).toBe(true);
      expect(hasFullCurriculumEntitlement({ role: 'Super Admin' })).toBe(true);

      // Unrecorded Part II scene for Free Forever user -> ghosted preview, cannot write
      const lockedEval = evaluateSceneAccess({
        sceneId: 'part-2-scene-1',
        user: { directorPassStatus: 'free_host_pass_active' },
        existingMemory: undefined,
      });
      expect(lockedEval.isLockedPreview).toBe(true);
      expect(lockedEval.canWrite).toBe(false);

      // Grandfathered Part II scene with an existing take -> unghosted read/playback (Rule 7), writes still gated
      const grandfatheredEval = evaluateSceneAccess({
        sceneId: 'part-2-scene-1',
        user: { directorPassStatus: 'free_host_pass_active' },
        existingMemory: {
          sceneId: 'part-2-scene-1',
          takes: [
            {
              id: 't_existing',
              takeNumber: 1,
              source: 'fireside_mobile',
              mediaMode: 'video',
              label: 'Take 1',
              isPreferred: true,
              mediaUrl: 'https://storage.googleapis.com/test/existing.webm',
              durationSeconds: 42,
              createdAt: '2026-11-20T10:00:00Z',
            },
          ],
        },
      });
      expect(grandfatheredEval.isGrandfathered).toBe(true);
      expect(grandfatheredEval.canReadUnrestricted).toBe(true);
      expect(grandfatheredEval.isLockedPreview).toBe(false);
      expect(grandfatheredEval.canWrite).toBe(false);
    });

    it('useCurriculumVault blocks unentitled Part II writes via onLockedSceneWrite while allowing Part I writes & non-destructive Act V publishSceneToCinema', async () => {
      const onLockedSpy = vi.fn();
      const { result } = renderHook(() =>
        useCurriculumVault({
          userId: 'guest_tester',
          entitlementUser: { directorPassStatus: 'free_host_pass_active' },
          enforcePartEntitlement: true,
          onLockedSceneWrite: onLockedSpy,
        })
      );

      // Attempt write to Part II Scene 1 -> blocked & triggers upgrade callback
      await act(async () => {
        await result.current.updateSceneProse('part-2-scene-1', 'Blocked Part II prose');
      });
      expect(onLockedSpy).toHaveBeenCalledWith('part-2-scene-1');
      expect(result.current.getSceneMemory('part-2-scene-1').prose).not.toBe('Blocked Part II prose');

      // Part I Scene 1 write + take + Act V publish -> allowed & preserves desktop_locked media URLs
      const masterUrl = 'https://storage.googleapis.com/test/master_final.webm';
      await act(async () => {
        await result.current.saveSceneTake(
          'part-1-scene-1',
          {
            id: 'take_master_1',
            takeNumber: 1,
            source: 'soundstage_desktop',
            mediaMode: 'video',
            label: 'Studio Master',
            isPreferred: true,
            mediaUrl: masterUrl,
            durationSeconds: 60,
            createdAt: '2026-11-25T10:00:00Z',
          },
          { editingAuthority: 'desktop_locked', prose: 'Roots in Nairobi.' }
        );
      });

      let publishedOk = false;
      await act(async () => {
        publishedOk = await result.current.publishSceneToCinema('part-1-scene-1');
      });
      expect(publishedOk).toBe(true);
      const publishedMem = result.current.getSceneMemory('part-1-scene-1');
      expect(publishedMem.status).toBe('published');
      expect(publishedMem.videoUrl).toBe(masterUrl);
    });
  });

  describe('2. 5-Act Horizontal Swipe Pager & Swipe-vs-Scroll Guardrails', () => {
    it('glides across Acts I -> V on horizontal touch swipe and ignores vertical scroll gestures', () => {
      const onSelectStageSpy = vi.fn();
      render(<SingleCardPromptCarousel onSelectActStage={onSelectStageSpy} fireside2MobileMode={true} />);

      const card = screen.getByTestId('HS_FIRESIDE_PROMPT_CAROUSEL_CARD');
      expect(screen.getByTestId('HS_FIRESIDE_ACT_TAB_1')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('HS_FIRESIDE_ACT_TAB_5')).toHaveAttribute('aria-pressed', 'false');

      // Vertical scroll gesture (dy = 120, dx = -25) MUST NOT change Act
      fireEvent.touchStart(card, { touches: [{ clientX: 200, clientY: 300 }] });
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 175, clientY: 180 }] });
      expect(screen.getByTestId('HS_FIRESIDE_ACT_TAB_1')).toHaveAttribute('aria-pressed', 'true');

      // Horizontal left swipe (dx = -120, dy = 10) -> advances Act I -> Act II
      fireEvent.touchStart(card, { touches: [{ clientX: 300, clientY: 300 }] });
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 180, clientY: 310 }] });
      expect(screen.getByTestId('HS_FIRESIDE_ACT_TAB_2')).toHaveAttribute('aria-pressed', 'true');
      expect(onSelectStageSpy).toHaveBeenLastCalledWith(2);

      // Swipe left 3 more times -> Act III -> Act IV -> Act V (Premiere)
      for (const expectedStage of [3, 4, 5]) {
        fireEvent.touchStart(card, { touches: [{ clientX: 300, clientY: 300 }] });
        fireEvent.touchEnd(card, { changedTouches: [{ clientX: 170, clientY: 305 }] });
        expect(onSelectStageSpy).toHaveBeenLastCalledWith(expectedStage);
      }
      expect(screen.getByTestId('HS_FIRESIDE_ACT_TAB_5')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('fireside-act5-premiere-panel')).toBeInTheDocument();

      // Horizontal right swipe (dx = +130, dy = 5) -> steps back Act V -> Act IV
      fireEvent.touchStart(card, { touches: [{ clientX: 120, clientY: 300 }] });
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 250, clientY: 305 }] });
      expect(screen.getByTestId('HS_FIRESIDE_ACT_TAB_4')).toHaveAttribute('aria-pressed', 'true');
    });

    it('disables horizontal Act swipe when recording is active', () => {
      render(<SingleCardPromptCarousel isRecordingActive={true} fireside2MobileMode={true} />);
      const card = screen.getByTestId('HS_FIRESIDE_PROMPT_CAROUSEL_CARD');

      fireEvent.touchStart(card, { touches: [{ clientX: 300, clientY: 300 }] });
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 120, clientY: 302 }] });
      expect(screen.getByTestId('HS_FIRESIDE_ACT_TAB_1')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('3. 52px Mobile Top Bar, Sticky Bottom Bar, In-App Fireside Cinema & Lightbox Poster', () => {
    it('renders 52px FiresideMobileTopBar, sticky FiresideBottomBar, and in-app FiresideCinemaView with shared Woven/Premiered metrics', () => {
      const metrics = computeVaultProgressMetrics({ wovenCount: 6, premieredCount: 1, denominator: 31 });
      expect(metrics.wovenPercentage).toBe(19);
      expect(metrics.premieredPercentage).toBe(3);

      const onOpenChapter = vi.fn();
      const onSelectView = vi.fn();

      const { unmount } = render(
        <>
          <FiresideMobileTopBar
            partRoman="Part I"
            sceneNumberInPart={1}
            totalScenesInPart={4}
            activeLanguage="en"
            isHybrid={false}
            onOpenChapterSheet={onOpenChapter}
            onOpenLangSheet={vi.fn()}
            onOpenMenuSheet={vi.fn()}
          />
          <FiresideCinemaView
            directorName="Naresh Mepani"
            wovenCount={6}
            totalScenes={31}
            wovenPercent={19}
            premieredCount={1}
            getSceneMemory={(sceneId) =>
              sceneId === 'part-1-scene-1'
                ? ({
                    id: 'ey96djU6qR1BrDGnvZwp',
                    sceneId: 'part-1-scene-1',
                    sceneTitle: 'A Child of Two Worlds',
                    status: 'published',
                    currentStatus: 'mastered',
                    location: 'Nairobi',
                    year: 1965,
                    takes: [
                      {
                        id: 't1',
                        takeNumber: 1,
                        source: 'soundstage_desktop',
                        mediaMode: 'video',
                        label: 'Master',
                        isPreferred: true,
                        mediaUrl: 'https://storage.googleapis.com/test/final.webm',
                        durationSeconds: 60,
                        createdAt: '2026-06-29T10:00:00Z',
                      },
                    ],
                  } as any)
                : undefined
            }
            resolveDocIdForScene={() => 'ey96djU6qR1BrDGnvZwp'}
            onWatchSceneReel={vi.fn()}
            onOpenSceneInStudio={vi.fn()}
          />
          <FiresideBottomBar
            activeView="cinema"
            recordedCount={6}
            onSelectView={onSelectView}
          />
        </>
      );

      fireEvent.click(screen.getByTestId('HS_FIRESIDE_MOBILE_CHAPTER_TRIGGER'));
      expect(onOpenChapter).toHaveBeenCalledTimes(1);

      expect(screen.getByTestId('fireside-cinema-progress-pill')).toHaveTextContent(
        '6 of 31 Woven (19%) · 1 Premiered'
      );
      expect(screen.getByTestId('fireside-cinema-card-part-1-scene-1')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('HS_FIRESIDE_TAB_STUDIO'));
      expect(onSelectView).toHaveBeenCalledWith('studio');
      unmount();
    });

    it('binds poster attribute and renders unbracketed Discard Take in FiresideCinemaLightbox', () => {
      const { container, unmount } = render(
        <FiresideCinemaLightbox
          isOpen={true}
          onClose={vi.fn()}
          sceneTitle="A Child of Two Worlds"
          mediaUrl="https://storage.googleapis.com/test/final.webm"
          mediaMode="video"
          posterUrl="https://storage.googleapis.com/test/poster.jpg"
        />
      );

      const video = container.querySelector('video');
      expect(video?.getAttribute('poster')).toBe('https://storage.googleapis.com/test/poster.jpg');
      expect(screen.getByTestId('HS_FIRESIDE_LIGHTBOX_DISCARD_BTN').textContent).toBe('Discard Take');
      unmount();
    });
  });

  describe('4. Mobile (< 768px) /studio PromptCard Routing into Fireside Studio & Fireside Cinema', () => {
    it('routes < 768px Action, Edit, and Watch in Cinema taps to /studio/fireside without hitting clipped Desktop Soundstage', () => {
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 412 });

      try {
        // 1. Unrecorded Part I Scene 4 card (p3_b) -> /studio/fireside?id=p3_b
        const { unmount: u1, container: c1 } = render(
          <PromptCard
            promptId="p3_b"
            promptText="Traditions, Feasts & Sacred Days"
            storyScript="Festive memories."
            isCompleted={false}
            isFlaggedForReuse={false}
            onStartChapter={vi.fn()}
            onToggleFlagPrompt={vi.fn()}
            canAccess={true}
          />
        );
        const link1 = c1.querySelector('a.absolute.inset-0') as HTMLElement;
        fireEvent.click(link1);
        expect(mockPush).toHaveBeenCalledWith('/studio/fireside?id=p3_b');
        u1();

        mockPush.mockClear();

        // 2. Published IN CINEMA card (p1) -> Watch in Cinema routes to /studio/fireside?view=cinema&id=p1,
        //    and secondary Edit pill routes to /studio/fireside?id=p1&edit=true
        const { unmount: u2, container: c2 } = render(
          <PromptCard
            promptId="p1"
            memoryId="ey96djU6qR1BrDGnvZwp"
            promptText="A Child of Two Worlds"
            storyScript="Nairobi roots."
            isCompleted={true}
            status="published"
            isFlaggedForReuse={false}
            onStartChapter={vi.fn()}
            onToggleFlagPrompt={vi.fn()}
            canAccess={true}
          />
        );
        const watchLink = c2.querySelector('a.absolute.inset-0') as HTMLElement;
        fireEvent.click(watchLink);
        expect(mockPush).toHaveBeenCalledWith('/studio/fireside?view=cinema&id=p1');

        mockPush.mockClear();
        const editPill = screen.getByTestId('prompt-card-edit-secondary-p1');
        fireEvent.click(editPill);
        expect(mockPush).toHaveBeenCalledWith('/studio/fireside?id=p1&edit=true');
        u2();
      } finally {
        Object.defineProperty(window, 'innerWidth', {
          configurable: true,
          writable: true,
          value: originalInnerWidth,
        });
      }
    });
  });
});
