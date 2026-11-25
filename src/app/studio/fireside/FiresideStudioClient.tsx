'use client';

/**
 * 🎙️ Fireside Voice & Video Studio Client
 *
 * Armchair-first mobile storytelling surface unifying Voice & Photos and
 * FaceTime/WhatsApp-style Video Memos into the 6-Part Master Story Curriculum.
 *
 * Milestone: MW-87 (Ticket #249 / MW-248)
 * Target Route: /studio/fireside
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English, Rule 26 Elder Ergonomics, Rule 8 Mobile Viewport)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useJourneyLogger } from '@/hooks/telemetry/useJourneyLogger';
import { useFiresideSync } from '@/hooks/useFiresideSync';
import { useFoldableCanvas } from '@/hooks/useFoldableCanvas';
import { useCurriculumVault, StoryMoodTag, isSceneCompleted, isSceneMasterProtected, resolveEditingAuthority, EditingAuthority } from '@/hooks/useCurriculumVault';
import { FiresideAuthHeader, isProductionHostname } from '@/components/fireside/FiresideAuthHeader';
import { isProductionProject, isStagingProject, resolveProjectId } from '@/config/environment';
import { MASTER_STORY_STRUCTURE, getSceneById, getPartForScene, resolveSceneFromPromptId } from '@/lib/curriculum/masterStoryStructure';
import { FiresideMobileTopBar } from '@/components/fireside/FiresideMobileTopBar';
import {
  FiresideChapterSheet,
  FiresideLangSheet,
  FiresideStudioMenuSheet,
  FiresideUpgradeSheet,
  FiresideWelcomeSheet,
  FIRESIDE_WELCOME_DISMISSED_KEY,
} from '@/components/fireside/FiresideMobileSheets';
import { FiresideCinemaView, FiresideBottomBar } from '@/components/fireside/FiresideCinemaView';
import { FiresideWarmupModal } from '@/components/fireside/FiresideWarmupModal';
import {
  FiresideModeSwitch,
  FIRESIDE_MODE_STORAGE_KEY,
  FIRESIDE_PREFERRED_MODE_STORAGE_KEY,
} from '@/components/fireside/FiresideModeSwitch';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { OrientationSoundcheckDock } from '@/components/fireside/OrientationSoundcheckDock';
import { StudioSurfaceSwitcher } from '@/components/studio/StudioSurfaceSwitcher';
import { TactileVoiceRecorder, TactileVoiceRecorderRef } from '@/components/fireside/TactileVoiceRecorder';
import { FiresideVideoRecorder, FiresideVideoRecorderRef } from '@/components/fireside/FiresideVideoRecorder';
import { AlbumPhotoCaptureTray, AlbumPhotoCaptureTrayRef } from '@/components/fireside/AlbumPhotoCaptureTray';
import { FiresideCompletedReelCard } from '@/components/fireside/FiresideCompletedReelCard';
import { FiresideCinemaLightbox } from '@/components/fireside/FiresideCinemaLightbox';
import { BonusMemoryDrawer } from '@/components/fireside/BonusMemoryDrawer';
import { BonusMemoryNote, DEFAULT_MEMORY_LOCATION, DEFAULT_MEMORY_COUNTRY, DEFAULT_MEMORY_YEAR, DEFAULT_MEMORY_AGE, stripHtmlWrapper, resolveSceneDefaultScriptText } from '@/types/curriculum';
export { DEFAULT_MEMORY_LOCATION, DEFAULT_MEMORY_COUNTRY, DEFAULT_MEMORY_YEAR, DEFAULT_MEMORY_AGE, resolveSceneDefaultScriptText };
import {
  FiresideLanguage,
  FiresidePromptSpark,
  HeirloomPhotoAttachment,
  FiresideMediaMode,
} from '@/types/fireside';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';
import {
  HeartHandshake,
  CheckCircle2,
  Loader2,
  CloudOff,
  AlertCircle,
  Monitor,
  Sparkles,
  RotateCcw,
  Cloud,
  Wind,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { applyTheatricalSlashes, renderPrompterCadenceHtml } from '@/utils/scriptFormatter';
import { uploadAudioWithResiliency, uploadVideoWithResiliency } from '@/lib/media/chunkedAudioUpload';
import {
  SpokenSlatePrompterCue,
  type RawCinemaSlateInput,
} from '@/components/cinema/CinemaTitleOverlays';
import {
  readPrompterSlateFromStorage,
  writePrompterSlateToStorage,
} from '@/hooks/studio/useMemorySlateMetadata';

function resolveInitialSpark(targetParam?: string): FiresidePromptSpark {
  if (targetParam) {
    // 1. Direct match on spark id (e.g. "spark_roots_two_worlds")
    const bySparkId = FIRESIDE_PROMPT_SPARKS.find((p) => p.id === targetParam);
    if (bySparkId) return bySparkId;

    // 2. Direct match on linkedSceneId (e.g. "part-1-scene-1")
    const bySceneId = FIRESIDE_PROMPT_SPARKS.find((p) => p.linkedSceneId === targetParam);
    if (bySceneId) return bySceneId;

    // 3. Resolve canonical scene from desktop promptId (e.g. "p1", "p4", "p4_1", "p3_b")
    const resolvedScene = resolveSceneFromPromptId(targetParam);
    if (resolvedScene) {
      const byCanonicalScene = FIRESIDE_PROMPT_SPARKS.find((p) => p.linkedSceneId === resolvedScene.id);
      if (byCanonicalScene) return byCanonicalScene;
    }
  }
  return FIRESIDE_PROMPT_SPARKS[0];
}

interface FiresidePrompterBannerProps {
  prose?: string;
  pinnedQuestion?: string | null;
  slateMeta?: RawCinemaSlateInput;
  testId?: string;
}

const FiresidePrompterBanner: React.FC<FiresidePrompterBannerProps> = ({
  prose,
  pinnedQuestion,
  slateMeta,
  testId = 'fireside-recording-script-banner',
}) => {
  const [autoBreath, setAutoBreath] = useState(false);
  const [showSpokenSlate, setShowSpokenSlate] = useState<boolean>(() => {
    const stored = readPrompterSlateFromStorage(null);
    return stored ? stored.showSpokenSlate : true;
  });

  const handleToggleSpokenSlate = (next: boolean) => {
    setShowSpokenSlate(next);
    writePrompterSlateToStorage(null, {
      showSpokenSlate: next,
      slateMetadata: slateMeta || {},
    });
  };

  if (!prose && !pinnedQuestion && !slateMeta) return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-2 space-y-2 text-left">
      {slateMeta && (
        <SpokenSlatePrompterCue
          meta={slateMeta}
          enabled={showSpokenSlate}
          onToggle={handleToggleSpokenSlate}
          compact={true}
        />
      )}

      {(prose || pinnedQuestion) && (
        <div
          data-testid={testId}
          className="w-full max-w-xl mx-auto mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left shadow-lg"
        >
      <div className="flex items-center justify-between gap-1.5 text-amber-400 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Active Teleprompter Script (Act I)</span>
        </div>
        {prose && (
          <button
            type="button"
            data-testid="fireside-auto-breath-toggle"
            onClick={() => setAutoBreath((prev) => !prev)}
            title={
              autoBreath
                ? 'Theatrical Auto-Breath active: converting punctuation into spoken pause beacons. Click to disable.'
                : 'Theatrical Auto-Breath disabled: displaying raw text. Click to enable.'
            }
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer',
              autoBreath
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-300'
            )}
          >
            <Wind className="w-2.5 h-2.5" />
            <span>🌬️ Auto-Breath: {autoBreath ? 'ON' : 'OFF'}</span>
          </button>
        )}
      </div>

      {prose && (
        <div
          data-testid="fireside-prompter-prose-container"
          className="max-h-56 overflow-y-auto pr-1 text-lg font-serif text-stone-200 leading-relaxed scrollbar-thin scrollbar-thumb-stone-700 [&_[data-sensory-cue]]:!text-lg [&_[data-slash-cue]]:!text-sm md:[&_[data-slash-cue]]:!text-base [&_[data-slash-cue]]:!leading-none [&_[data-slash-cue]]:!align-middle"
        >
          <span
            dangerouslySetInnerHTML={{
              __html: `&ldquo;${renderPrompterCadenceHtml(prose, { autoBreath, highlightSensory: true })}&rdquo;`,
            }}
          />
        </div>
      )}

      {pinnedQuestion && (
        <div
          data-testid="fireside-pinned-prompter-footnote"
          className="mt-2 pt-2 border-t border-amber-500/20 flex items-start gap-2"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 shrink-0 mt-0.5">
            📌 Follow-Up:
          </span>
          <p className="text-xs font-serif italic text-amber-100 leading-snug">
            {pinnedQuestion}
          </p>
        </div>
      )}
        </div>
      )}
    </div>
  );
};

export default function FiresideStudioClient() {
  const searchParams = useSearchParams();
  const { user, logout } = useAuth() as any;
  const { logEvent, traceInteraction } = useJourneyLogger(user?.uid || null);

  // Global Capturing Click Listener for Hotspot Telemetry (Rule 8: Zero-Footprint Telemetry)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleGlobalClick = (e: MouseEvent) => {
      traceInteraction(e as any);
    };
    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [traceInteraction]);

  // Resolve URL parameters
  const initialLangParam = searchParams.get('lang') as FiresideLanguage | null;
  const initialPromptParam = searchParams.get('prompt') || undefined;
  const initialIdParam = searchParams.get('id') || undefined;
  const isDirectRecordRequested = searchParams?.get('record') === 'true' || searchParams?.get('retake') === 'true' || searchParams?.get('act') === '3';

  const validLangs: FiresideLanguage[] = ['en', 'gu', 'pa', 'hi'];
  const resolvedLang: FiresideLanguage = initialLangParam && validLangs.includes(initialLangParam)
    ? initialLangParam
    : 'en';

  const [activeLanguage, setActiveLanguage] = useState<FiresideLanguage>(resolvedLang);
  const [mediaMode, setMediaMode] = useState<FiresideMediaMode>('video');
  const [activePromptSpark, setActivePromptSpark] = useState<FiresidePromptSpark>(() =>
    resolveInitialSpark(initialIdParam || initialPromptParam)
  );
  const [selectedSpark, setSelectedSpark] = useState<FiresidePromptSpark | null>(null);
  const [photos, setPhotos] = useState<HeirloomPhotoAttachment[]>([]);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState<number>(0);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoDuration, setRecordedVideoDuration] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [showDesktopBanner, setShowDesktopBanner] = useState<boolean>(false);
  const [isFiresideRecording, setIsFiresideRecording] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [isBonusDrawerOpen, setIsBonusDrawerOpen] = useState<boolean>(false);
  const [forceRecordMode, setForceRecordMode] = useState<boolean>(Boolean(isDirectRecordRequested));
  const [isReviewingTake, setIsReviewingTake] = useState<boolean>(false);
  const [isSecuringToVault, setIsSecuringToVault] = useState<boolean>(false);
  const [securingProgress, setSecuringProgress] = useState<number>(0);
  const [isHybrid, setIsHybrid] = useState<boolean>(false);
  const [pinnedPrompterQuestion, setPinnedPrompterQuestion] = useState<string | null>(null);
  const [bonusDrawerSeedPrompt, setBonusDrawerSeedPrompt] = useState<string | null>(null);
  const [editingBonusNote, setEditingBonusNote] = useState<BonusMemoryNote | null>(null);
  const [selectedActStage, setSelectedActStage] = useState<1 | 2 | 3 | 4 | 5 | undefined>(
    isDirectRecordRequested ? 3 : undefined
  );
  const [activeView, setActiveView] = useState<'studio' | 'cinema'>(() =>
    searchParams?.get('view') === 'cinema' ? 'cinema' : 'studio'
  );
  const [isChapterSheetOpen, setIsChapterSheetOpen] = useState<boolean>(false);
  const [isLangSheetOpen, setIsLangSheetOpen] = useState<boolean>(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState<boolean>(false);
  const [isUpgradeSheetOpen, setIsUpgradeSheetOpen] = useState<boolean>(false);
  const [isWelcomeSheetOpen, setIsWelcomeSheetOpen] = useState<boolean>(false);
  const [isMobileWarmupOpen, setIsMobileWarmupOpen] = useState<boolean>(() =>
    searchParams?.get('soundcheck') === 'true'
  );

  const photoTrayRef = useRef<AlbumPhotoCaptureTrayRef>(null);
  const recorderRef = useRef<TactileVoiceRecorderRef>(null);
  const videoRecorderRef = useRef<FiresideVideoRecorderRef>(null);

  // MW-88-T9: Act-aware hardware teardown — release active camera & mic tracks when leaving Act III (Soundstage)
  useEffect(() => {
    if (selectedActStage !== undefined && selectedActStage !== 3) {
      if (
        videoRecorderRef.current &&
        videoRecorderRef.current.status !== 'recording' &&
        videoRecorderRef.current.status !== 'paused'
      ) {
        videoRecorderRef.current.releaseHardwareStream?.();
      }
      if (
        recorderRef.current &&
        recorderRef.current.status !== 'recording' &&
        recorderRef.current.status !== 'paused'
      ) {
        recorderRef.current.releaseHardwareStream?.();
      }
    }
  }, [selectedActStage]);

  // Smart Viewport & Foldable Device Detection (Canonical standard aligned with ProductionDeckContainer.tsx)
  const { isLargeScreen, isFoldableOrTabletCanvas, width } = useFoldableCanvas();
  const prevIsLargeRef = useRef(isLargeScreen);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // When unfolding (transitioning into foldable canvas or large screen), reset dismissal so banner dynamically surfaces
    if (!prevIsLargeRef.current && isLargeScreen) {
      try {
        sessionStorage.removeItem('mw_dismiss_desktop_stage_banner');
      } catch {}
    }
    prevIsLargeRef.current = isLargeScreen;

    try {
      const isDismissed = sessionStorage.getItem('mw_dismiss_desktop_stage_banner') === 'true';
      setShowDesktopBanner(isLargeScreen && !isDismissed);
    } catch {}
  }, [isLargeScreen]);

  const handleDismissDesktopBanner = () => {
    setShowDesktopBanner(false);
    try {
      sessionStorage.setItem('mw_dismiss_desktop_stage_banner', 'true');
    } catch {}
  };

  // Restore persisted media mode on mount (MW-111: default to video, check preferred then legacy key)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const preferred = localStorage.getItem(FIRESIDE_PREFERRED_MODE_STORAGE_KEY) as FiresideMediaMode | null;
        const legacy = localStorage.getItem(FIRESIDE_MODE_STORAGE_KEY) as FiresideMediaMode | null;
        const stored = preferred || legacy;
        if (stored === 'audio' || stored === 'video') {
          setMediaMode(stored);
        } else {
          setMediaMode('video');
        }
      } catch {}
    }
  }, []);

  const activeTakeIdRef = useRef<string | null>(null);
  const activeTakeNumberRef = useRef<number>(1);
  const lastSavedBlobRef = useRef<Blob | null>(null);
  const takeIsPreferredRef = useRef<boolean>(true);

  const effectiveSceneId = selectedSpark?.linkedSceneId || activePromptSpark?.linkedSceneId || 'part-1-scene-1';

  // Unified Curriculum Vault Hook (MW-88-T1, MW-88-T2 & MW-88-T5: Bi-Directional Bridge + Fireside 2.0 Entitlement Shield)
  const {
    scenes,
    isLoading: isVaultLoading,
    getSceneMemory,
    saveSceneTake,
    discardSceneTake,
    updateSceneProse,
    updateSceneCoordinates,
    resolveDocIdForScene,
    setStoryMoodTag,
    addBonusMemoryNote,
    updateBonusMemoryNote,
    deleteBonusMemoryNote,
    completedScenes,
    totalScenes,
    vaultProgressPercent,
    nextPendingSceneId,
    promotePreferredTake,
    reorderSceneTakes,
    safeDiscardTake,
    restoreOuttakeTake,
    publishSceneToCinema,
    getSceneAccess,
  } = useCurriculumVault({
    userId: user?.uid,
    initialSceneId: effectiveSceneId,
    entitlementUser: user as any,
    directorPassStatus: (user as any)?.directorPassStatus ?? null,
    enforcePartEntitlement: true,
    onLockedSceneWrite: () => setIsUpgradeSheetOpen(true),
  });

  const isCleanSlateParam = searchParams.get('clean_slate') === 'true';

  const getSceneMemoryWithDefaults = useCallback(
    (sceneId: string) => {
      const mem = getSceneMemory(sceneId);
      if (isCleanSlateParam) {
        return {
          ...(mem || {}),
          id: mem?.id || `memoir_${sceneId}`,
          prose: '',
          description: '',
          originalHook: '',
          location: '',
          narratorLocationAtEvent: '',
          country: '',
          year: undefined,
          dateComponents: { day: 'none', month: 'none', year: 'none' },
          narratorAgeAtTime: 0,
          age: 0,
        };
      }
      if (!mem) return mem;
      const cleanProse =
        stripHtmlWrapper(mem.prose) ||
        stripHtmlWrapper(mem.originalHook) ||
        stripHtmlWrapper(mem.description) ||
        resolveSceneDefaultScriptText(sceneId);
      const loc = mem.narratorLocationAtEvent || mem.location || DEFAULT_MEMORY_LOCATION;
      const country = mem.country && mem.country !== 'none' ? mem.country : DEFAULT_MEMORY_COUNTRY;
      const yr =
        mem.dateComponents?.year && mem.dateComponents.year !== 'none'
          ? mem.dateComponents.year
          : mem.year && String(mem.year) !== 'none'
          ? mem.year
          : DEFAULT_MEMORY_YEAR;
      const age = mem.narratorAgeAtTime ?? mem.age ?? DEFAULT_MEMORY_AGE;
      return {
        ...mem,
        prose: cleanProse,
        description: stripHtmlWrapper(mem.description) || cleanProse,
        originalHook: stripHtmlWrapper(mem.originalHook) || cleanProse,
        location: loc,
        narratorLocationAtEvent: loc,
        country,
        year: yr,
        dateComponents: mem.dateComponents || (yr ? { year: String(yr) } : { day: 'none', month: 'none', year: 'none' }),
        narratorAgeAtTime: age,
        age,
      };
    },
    [getSceneMemory, isCleanSlateParam]
  );

  const activeSceneMemory = getSceneMemoryWithDefaults(effectiveSceneId);
  const activeMood = activeSceneMemory?.moodTag;
  const activeEditingAuthority: EditingAuthority = resolveEditingAuthority(activeSceneMemory);
  const isActiveMasterProtected = isSceneMasterProtected(activeSceneMemory);
  const hasCompletedReel = isSceneCompleted(activeSceneMemory);
  const isCompleted = hasCompletedReel && !forceRecordMode && !isReviewingTake;

  const resolveSceneAuthority = useCallback(
    (sceneId?: string): EditingAuthority => {
      if (!sceneId) return 'fireside_flexible';
      return resolveEditingAuthority(getSceneMemory(sceneId));
    },
    [getSceneMemory]
  );

  // Background Offline-First Synchronisation Hook (MW-247 & MW-248)
  const {
    syncState,
    isSaving,
    isSynced,
    isOffline,
    progressPercent,
    triggerManualSync,
  } = useFiresideSync({
    userId: user?.uid,
    promptSpark: selectedSpark || activePromptSpark,
    activeLanguage,
    audioBlob: recordedAudioBlob,
    audioDurationSeconds: recordedAudioDuration,
    videoBlob: recordedVideoBlob,
    videoDurationSeconds: recordedVideoDuration,
    mediaMode,
    sceneId: effectiveSceneId,
    photos,
    onSyncSuccess: async (_syncedDraftId, cloudUrls) => {
      const cloudMediaUrl =
        (mediaMode === 'video' ? cloudUrls?.videoUrl : cloudUrls?.audioUrl) ||
        cloudUrls?.videoUrl ||
        cloudUrls?.audioUrl;
      if (cloudMediaUrl && activeTakeIdRef.current) {
        const takeId = activeTakeIdRef.current;
        const takeNumber = activeTakeNumberRef.current || activeSceneMemory?.takes?.length || 1;
        const isPref = isActiveMasterProtected ? false : takeIsPreferredRef.current;
        await saveSceneTake(
          effectiveSceneId,
          {
            id: takeId,
            takeNumber,
            source: 'fireside_mobile',
            mediaMode,
            mediaUrl: cloudMediaUrl,
            durationSeconds: mediaMode === 'video' ? recordedVideoDuration : recordedAudioDuration,
            createdAt: new Date().toISOString(),
            label: `Take ${takeNumber} (${mediaMode === 'video' ? (isPref ? 'Fireside Video' : 'Fireside Audition Take') : (isPref ? 'Fireside Voice' : 'Fireside Voice Audition')})`,
            isPreferred: isPref,
            role: isPref ? 'master_cut' : 'alternate',
          },
          { photos }
        );
      }
    },
  });

  const preferredTake = useMemo(() => {
    if (!activeSceneMemory?.takes || activeSceneMemory.takes.length === 0) return null;
    return (
      activeSceneMemory.takes.find((t) => t.isPreferred) ||
      activeSceneMemory.takes[activeSceneMemory.takes.length - 1] ||
      activeSceneMemory.takes[0]
    );
  }, [activeSceneMemory]);

  const autoSparkId = useMemo(() => {
    const targetParam = initialIdParam || initialPromptParam;
    if (targetParam) {
      // 1. Direct match on spark id (e.g. "spark_roots_two_worlds")
      const bySparkId = FIRESIDE_PROMPT_SPARKS.find((p) => p.id === targetParam);
      if (bySparkId) return bySparkId.id;

      // 2. Direct match on linkedSceneId (e.g. "part-1-scene-1")
      const bySceneId = FIRESIDE_PROMPT_SPARKS.find((p) => p.linkedSceneId === targetParam);
      if (bySceneId) return bySceneId.id;

      // 3. Resolve canonical scene from desktop promptId (e.g. "p1", "p4", "p3_b")
      const resolvedScene = resolveSceneFromPromptId(targetParam);
      if (resolvedScene) {
        const byCanonicalScene = FIRESIDE_PROMPT_SPARKS.find((p) => p.linkedSceneId === resolvedScene.id);
        if (byCanonicalScene) return byCanonicalScene.id;
      }

      // 4. If targetParam matches activeSceneMemory id or sceneId
      // 4. If targetParam matches a Firestore memory document ID or sceneId
      const targetMem = getSceneMemory(targetParam);
      if (targetMem && targetMem.sceneId && targetMem.sceneId !== targetParam) {
        const byTargetMemScene = FIRESIDE_PROMPT_SPARKS.find((p) => p.linkedSceneId === targetMem.sceneId);
        if (byTargetMemScene) return byTargetMemScene.id;
      }
      if (activeSceneMemory && (activeSceneMemory.id === targetParam || (activeSceneMemory as any).sceneId === targetParam)) {
        const sceneId = activeSceneMemory.sceneId;
        if (sceneId) {
          const byMemScene = FIRESIDE_PROMPT_SPARKS.find((p) => p.linkedSceneId === sceneId);
          if (byMemScene) return byMemScene.id;
        }
      }
    }
    if (nextPendingSceneId) {
      const matched = FIRESIDE_PROMPT_SPARKS.find((p) => p.linkedSceneId === nextPendingSceneId);
      if (matched) return matched.id;
    }
    return undefined;
  }, [initialIdParam, initialPromptParam, nextPendingSceneId, activeSceneMemory, scenes, getSceneMemory]);

  // Synchronise activePromptSpark when autoSparkId resolves (e.g. via deep-link or next pending scene)
  useEffect(() => {
    if (autoSparkId && !selectedSpark) {
      const targetSpark = FIRESIDE_PROMPT_SPARKS.find(
        (p) => p.id === autoSparkId || p.linkedSceneId === autoSparkId
      );
      if (targetSpark && targetSpark.id !== activePromptSpark.id) {
        setActivePromptSpark(targetSpark);
      }
    }
  }, [autoSparkId, selectedSpark, activePromptSpark.id]);

  const handleMoodChange = useCallback(
    (mood: StoryMoodTag) => {
      setStoryMoodTag(effectiveSceneId, mood);
      logEvent('FIRESIDE_MOOD_TAGGED', {
        sceneId: effectiveSceneId,
        mood,
      });
      const moodLabel = mood.charAt(0).toUpperCase() + mood.slice(1);
      setNotification(`Resonance mood tagged: ${moodLabel}`);
      setTimeout(() => setNotification(null), 3000);
    },
    [effectiveSceneId, setStoryMoodTag, logEvent]
  );

  // Pageview lifecycle telemetry
  useEffect(() => {
    logEvent('FIRESIDE_STAGE_VIEWED', {
      path: '/studio/fireside',
      mediaMode,
      activeLanguage,
      hasUser: !!user,
    });
  }, [logEvent]);

  // Sync state if URL searchParams change
  useEffect(() => {
    if (initialLangParam && validLangs.includes(initialLangParam)) {
      setActiveLanguage(initialLangParam);
    }
    if (searchParams?.get('record') === 'true' || searchParams?.get('retake') === 'true' || searchParams?.get('act') === '3') {
      setForceRecordMode(true);
      setSelectedActStage(3);
    }
    if (searchParams?.get('view') === 'cinema') {
      setActiveView('cinema');
    } else if (searchParams?.get('view') === 'studio') {
      setActiveView('studio');
    }
    if (searchParams?.get('soundcheck') === 'true') {
      setIsMobileWarmupOpen(true);
    }
  }, [initialLangParam, searchParams]);

  const handleSelectFiresideView = useCallback((nextView: 'studio' | 'cinema') => {
    setActiveView(nextView);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (nextView === 'cinema') {
          url.searchParams.set('view', 'cinema');
        } else {
          url.searchParams.delete('view');
        }
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  }, []);

  // First-visit mobile welcome sheet (only on < 768px when user has 0 woven scenes and hasn't dismissed it)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 768) return;
    if (completedScenes > 0) return;
    if (searchParams?.get('view') === 'cinema' || searchParams?.get('soundcheck') === 'true') return;
    try {
      const dismissed = window.localStorage.getItem(FIRESIDE_WELCOME_DISMISSED_KEY) === 'true';
      if (!dismissed) {
        setIsWelcomeSheetOpen(true);
      }
    } catch {}
  }, [completedScenes, searchParams]);

  const handleDismissWelcomeSheet = useCallback(() => {
    setIsWelcomeSheetOpen(false);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(FIRESIDE_WELCOME_DISMISSED_KEY, 'true');
      } catch {}
    }
  }, []);

  // Auto-dismiss toast when viewport reaches active studio / Heirloom Photo Digitisation hyperlink position
  useEffect(() => {
    if (!notification || typeof window === 'undefined') return;

    const isStudioAtTargetPosition = () => {
      const targetId = mediaMode === 'audio' ? 'album-photo-capture-tray' : 'fireside-active-studio';
      const studioEl = document.getElementById(targetId) || document.getElementById('fireside-active-studio');
      if (!studioEl) return false;
      const rect = studioEl.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      return rect.height > 0 && rect.top <= vh * 0.65 && rect.bottom >= vh * 0.2;
    };

    let canDismissOnScroll = false;
    const scrollArmTimer = setTimeout(() => {
      canDismissOnScroll = true;
    }, 250);

    // If target studio anchor is already at the target position after smooth scroll settles, auto-dismiss
    const settledPositionTimer = setTimeout(() => {
      if (isStudioAtTargetPosition()) {
        setNotification(null);
      }
    }, 1500);

    const fallbackTimer = setTimeout(() => {
      setNotification(null);
    }, 4000);

    const handleScroll = () => {
      if (canDismissOnScroll && isStudioAtTargetPosition()) {
        setNotification(null);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollArmTimer);
      clearTimeout(settledPositionTimer);
      clearTimeout(fallbackTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [notification, mediaMode]);

  const handleActivePromptChange = useCallback((spark: FiresidePromptSpark) => {
    setSelectedSpark(spark);
    setForceRecordMode(false);
    setPinnedPrompterQuestion(null);
    setSelectedActStage(undefined);
    setActivePromptSpark(spark);
  }, []);

  const handlePinQuestionToPrompter = useCallback((question: string) => {
    setPinnedPrompterQuestion((prev) => {
      const next = prev === question ? null : question;
      setNotification(
        next
          ? 'Follow-up prompt pinned beneath your active teleprompter script below.'
          : 'Follow-up prompt unpinned from teleprompter.'
      );
      setTimeout(() => setNotification(null), 3500);
      return next;
    });
  }, []);

  const handleOpenBonusDrawer = useCallback(() => {
    setBonusDrawerSeedPrompt(null);
    setEditingBonusNote(null);
    setIsBonusDrawerOpen(true);
  }, []);

  const handleAnswerFollowUpNote = useCallback((question: string) => {
    setEditingBonusNote(null);
    setBonusDrawerSeedPrompt(question);
    setIsBonusDrawerOpen(true);
  }, []);

  const handleSaveProse = useCallback(
    async (targetSceneId: string, updatedProseText: string) => {
      await updateSceneProse(targetSceneId, updatedProseText);
      logEvent('FIRESIDE_PROSE_EDITED' as any, {
        sceneId: targetSceneId,
        proseLength: updatedProseText.length,
      });
      setNotification('Script saved and synchronised with Desktop Studio.');
      setTimeout(() => {
        setNotification(null);
      }, 4000);
    },
    [updateSceneProse, logEvent]
  );

  const handleSaveCoordinates = useCallback(
    async (
      targetSceneId: string,
      coords: {
        location?: string;
        country?: string;
        day?: string;
        month?: string;
        year?: string | number;
        narratorAgeAtTime?: number;
      }
    ) => {
      await updateSceneCoordinates(targetSceneId, coords);
      logEvent('FIRESIDE_COORDINATES_EDITED' as any, {
        sceneId: targetSceneId,
        location: coords.location,
        country: coords.country,
        year: coords.year,
        narratorAgeAtTime: coords.narratorAgeAtTime,
      });
      setNotification('Coordinates updated and synchronised with Desktop Studio.');
      setTimeout(() => {
        setNotification(null);
      }, 4000);
    },
    [updateSceneCoordinates, logEvent]
  );

  const handleSelectPrompt = (spark: FiresidePromptSpark, _language: FiresideLanguage) => {
    setSelectedSpark(spark);
    setSelectedActStage(3);
    setForceRecordMode(true);
    const targetMode: FiresideMediaMode = mediaMode || spark.suggestedMediaMode || 'audio';
    logEvent('FIRESIDE_PROMPT_SELECTED', {
      promptId: spark.id,
      sceneId: spark.linkedSceneId,
      mediaMode: targetMode,
    });
    setNotification(
      targetMode === 'video'
        ? `Camera ready for "${spark.title}" — frame yourself and tap Record when ready.`
        : `Voice booth ready for "${spark.title}" — tap the amber button when you are ready to speak.`
    );

    // Direction C Surgical Rescue: NEVER auto-start recording on prompt selection.
    // Open live camera preview synchronously if mounted (preserving iOS Safari user gesture)
    // and scroll smoothly to the recorder so the narrator records intentionally.
    if (targetMode === 'video') {
      if (videoRecorderRef.current) {
        videoRecorderRef.current.scrollIntoView();
        if (videoRecorderRef.current.status !== 'recording') {
          void videoRecorderRef.current.enableCameraPreview();
        }
      } else {
        setTimeout(() => {
          document.getElementById('fireside-active-studio')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
      }
    } else {
      if (recorderRef.current) {
        recorderRef.current.scrollIntoView();
      } else {
        setTimeout(() => {
          document.getElementById('fireside-active-studio')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
      }
    }
  };

  const scrollToActiveStudio = useCallback(
    (targetMode?: FiresideMediaMode, dismissNotification = true) => {
      const mode = targetMode || mediaMode;
      setForceRecordMode(true);
      setIsReviewingTake(false);
      if (dismissNotification) {
        setNotification(null);
      }

      const attemptScroll = (retryCount = 0) => {
        let targetEl: HTMLElement | null = null;
        if (mode === 'audio') {
          targetEl =
            document.getElementById('album-photo-capture-tray') ||
            document.getElementById('fireside-active-studio');
        } else {
          targetEl =
            document.getElementById('fireside-active-studio') ||
            document.getElementById('album-photo-capture-tray');
        }

        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (retryCount < 6) {
          setTimeout(() => attemptScroll(retryCount + 1), 50 * (retryCount + 1));
        }
      };

      setTimeout(() => attemptScroll(0), 40);
    },
    [mediaMode]
  );

  const handleModeChange = (newMode: FiresideMediaMode) => {
    setMediaMode(newMode);
    setForceRecordMode(true);
    setIsReviewingTake(false);
    if (!selectedSpark && activePromptSpark) {
      setSelectedSpark(activePromptSpark);
    }
    logEvent('FIRESIDE_MODE_SWITCHED', { mode: newMode });
    setNotification(
      newMode === 'video'
        ? 'WhatsApp / FaceTime Video Memo Studio ready below.'
        : 'Heirloom Photo Digitisation & Voice Studio ready below.'
    );
    scrollToActiveStudio(newMode, false);
  };

  const handleResetAudioRecording = useCallback(() => {
    setRecordedAudioBlob(null);
    setRecordedAudioDuration(0);
    setIsReviewingTake(false);
    lastSavedBlobRef.current = null;
  }, []);

  const handleResetVideoRecording = useCallback(() => {
    setRecordedVideoBlob(null);
    setRecordedVideoDuration(0);
    setIsReviewingTake(false);
    lastSavedBlobRef.current = null;
  }, []);

  const handleKeepRecording = useCallback(() => {
    setIsReviewingTake(false);
    setForceRecordMode(false);
    setTimeout(() => {
      document
        .getElementById('fireside-completed-reel-card')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  }, []);

  const handleLanguageChange = (lang: FiresideLanguage) => {
    setActiveLanguage(lang);
    logEvent('FIRESIDE_LANGUAGE_CHANGED', { language: lang });
  };

  const handlePhotoPromptClick = (photoText: string) => {
    if (mediaMode === 'video') {
      setMediaMode('audio');
    }
    setForceRecordMode(true);
    setIsReviewingTake(false);
    setNotification(`Physical photo cue: "${photoText}". Opening heirloom photo digitiser...`);
    const triggerCameraWithRetry = (retryCount = 0) => {
      const tray = document.getElementById('album-photo-capture-tray');
      if (tray) {
        tray.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (photoTrayRef.current) {
        setTimeout(() => {
          photoTrayRef.current?.triggerCamera();
        }, 150);
      } else if (retryCount < 5) {
        setTimeout(() => triggerCameraWithRetry(retryCount + 1), 60 * (retryCount + 1));
      }
    };
    setTimeout(() => triggerCameraWithRetry(0), 50);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleAudioRecordingComplete = async (_audioBlob: Blob, durationSeconds: number) => {
    // RC1.1 Master-Reel Safety: NEVER upload or mutate Firestore automatically on Stop.
    // Stage locally for review; cloud persistence runs ONLY on explicit Keep tap.
    setIsReviewingTake(true);
    logEvent('FIRESIDE_AUDIO_RECORDING_COMPLETED', {
      durationSeconds,
      sceneId: effectiveSceneId,
    });
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    setNotification(
      isActiveMasterProtected
        ? `Audition voice take ready (${mins}m ${secs}s). Listen below and tap "Save as Alternate Take" to keep it.`
        : `Voice recording ready (${mins}m ${secs}s). Listen below, then tap "Keep This Memoir" to save.`
    );
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleKeepAudioRecording = async (audioBlob: Blob, durationSeconds: number) => {
    setRecordedAudioBlob(audioBlob);
    setRecordedAudioDuration(durationSeconds);

    // Guardrail 2 (MW-106 / RC1.1): Protected Soundstage / published / completed masters are NEVER demoted by Fireside
    const isAlreadyCompleted = isSceneCompleted(activeSceneMemory);
    const shouldBePreferred = !isAlreadyCompleted && !isActiveMasterProtected;
    takeIsPreferredRef.current = shouldBePreferred;

    const isSameBlob = lastSavedBlobRef.current === audioBlob && !!activeTakeIdRef.current;
    const takeId = isSameBlob ? activeTakeIdRef.current! : `take_${Date.now()}`;
    const takeNumber = isSameBlob
      ? activeTakeNumberRef.current
      : (activeSceneMemory?.takes?.length || 0) + 1;
    activeTakeIdRef.current = takeId;
    activeTakeNumberRef.current = takeNumber;
    lastSavedBlobRef.current = audioBlob;

    let permanentStorageUrl: string | null = null;
    if (user?.uid && !user.uid.startsWith('guest')) {
      setIsSecuringToVault(true);
      setSecuringProgress(0);
      try {
        const uploadResult = await uploadAudioWithResiliency(
          user.uid,
          effectiveSceneId,
          audioBlob,
          (progress) => setSecuringProgress(progress)
        );
        permanentStorageUrl = uploadResult.storageUrl;
      } catch (uploadErr) {
        console.error('[FiresideStudioClient] Failed to secure audio to vault:', uploadErr);
        setNotification('Notice: Cloud sync failed. Local audio preserved in current session.');
      } finally {
        setIsSecuringToVault(false);
      }
    }

    await saveSceneTake(effectiveSceneId, {
      id: takeId,
      takeNumber,
      source: 'fireside_mobile',
      mediaMode: 'audio',
      mediaUrl: permanentStorageUrl || '',
      durationSeconds,
      createdAt: new Date().toISOString(),
      label: `Take ${takeNumber} (${shouldBePreferred ? 'Fireside Voice' : 'Fireside Voice Audition'})`,
      isPreferred: shouldBePreferred,
      status: shouldBePreferred ? 'master' : 'alternate',
      role: shouldBePreferred ? 'master_cut' : 'alternate',
    }, { photos });

    handleKeepRecording();
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const photoCount = photos.length;
    const photoSuffix = photoCount > 0
      ? ` with ${photoCount} attached heirloom photo${photoCount === 1 ? '' : 's'}`
      : '';
    setNotification(
      shouldBePreferred
        ? `Memoir voice recording secured in vault (${mins}m ${secs}s)${photoSuffix}.`
        : `Saved as alternate take (${mins}m ${secs}s). Your Master Reel stays untouched.`
    );
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleVideoRecordingComplete = async (_videoBlob: Blob, durationSeconds: number) => {
    // RC1.1 Master-Reel Safety: NEVER upload or mutate Firestore automatically on Stop.
    // Stage locally for review; cloud persistence runs ONLY on explicit Keep tap.
    setIsReviewingTake(true);
    logEvent('FIRESIDE_VIDEO_RECORDING_COMPLETED', {
      durationSeconds,
      sceneId: effectiveSceneId,
    });
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    setNotification(
      isActiveMasterProtected
        ? `Audition video ready (${mins}m ${secs}s). Review below and tap "Save as Alternate Take" to keep it.`
        : `Video memo ready (${mins}m ${secs}s). Review below, then tap "Keep This Video Memo" to save.`
    );
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleKeepVideoRecording = async (videoBlob: Blob, durationSeconds: number) => {
    setRecordedVideoBlob(videoBlob);
    setRecordedVideoDuration(durationSeconds);

    // Guardrail 2 (MW-106 / RC1.1): Protected Soundstage / published / completed masters are NEVER demoted by Fireside
    const isAlreadyCompleted = isSceneCompleted(activeSceneMemory);
    const shouldBePreferred = !isAlreadyCompleted && !isActiveMasterProtected;
    takeIsPreferredRef.current = shouldBePreferred;

    const isSameBlob = lastSavedBlobRef.current === videoBlob && !!activeTakeIdRef.current;
    const takeId = isSameBlob ? activeTakeIdRef.current! : `take_${Date.now()}`;
    const takeNumber = isSameBlob
      ? activeTakeNumberRef.current
      : (activeSceneMemory?.takes?.length || 0) + 1;
    activeTakeIdRef.current = takeId;
    activeTakeNumberRef.current = takeNumber;
    lastSavedBlobRef.current = videoBlob;

    let permanentStorageUrl: string | null = null;
    if (user?.uid && !user.uid.startsWith('guest')) {
      setIsSecuringToVault(true);
      setSecuringProgress(0);
      try {
        const uploadResult = await uploadVideoWithResiliency(
          user.uid,
          effectiveSceneId,
          videoBlob,
          (progress) => setSecuringProgress(progress)
        );
        permanentStorageUrl = uploadResult.storageUrl;
      } catch (uploadErr) {
        console.error('[FiresideStudioClient] Failed to secure video to vault:', uploadErr);
        setNotification('Notice: Cloud sync failed. Local video preserved in current session.');
      } finally {
        setIsSecuringToVault(false);
      }
    }

    await saveSceneTake(effectiveSceneId, {
      id: takeId,
      takeNumber,
      source: 'fireside_mobile',
      mediaMode: 'video',
      mediaUrl: permanentStorageUrl || '',
      durationSeconds,
      createdAt: new Date().toISOString(),
      label: `Take ${takeNumber} (${shouldBePreferred ? 'Fireside Video' : 'Fireside Audition Take'})`,
      isPreferred: shouldBePreferred,
      status: shouldBePreferred ? 'master' : 'alternate',
      role: shouldBePreferred ? 'master_cut' : 'alternate',
    }, { photos });

    handleKeepRecording();
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const photoCount = photos.length;
    const photoSuffix = photoCount > 0
      ? ` with ${photoCount} attached heirloom photo${photoCount === 1 ? '' : 's'}`
      : '';
    setNotification(
      shouldBePreferred
        ? `Video memo secured in vault (${mins}m ${secs}s)${photoSuffix}.`
        : `Saved as alternate take (${mins}m ${secs}s). Your Master Reel stays untouched.`
    );
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Multi-Take Discard Handler (MW-88-T5 / MW-88-T7 — Rule 12 Optimistic UI & Rule 14 Prose Preservation)
  const handleDiscardActiveTake = useCallback(async () => {
    const targetTakeId =
      preferredTake?.id ||
      activeSceneMemory?.activeTakeId ||
      activeTakeIdRef.current ||
      undefined;

    const targetTake = activeSceneMemory?.takes?.find((t) => t.id === targetTakeId);
    const isProtectedMasterTake =
      isActiveMasterProtected &&
      (!targetTake ||
        targetTake.isPreferred ||
        targetTake.status === 'master' ||
        targetTake.source === 'soundstage_desktop' ||
        targetTake.source === 'desktop_soundstage');

    if (isProtectedMasterTake) {
      setIsLightboxOpen(false);
      setNotification(
        'Protected Soundstage / Published Master Reel cannot be discarded from Fireside mobile. Manage Master Reels in Desktop Studio.'
      );
      setTimeout(() => {
        setNotification(null);
      }, 5000);
      return;
    }

    const remainingCount = Math.max(0, (activeSceneMemory?.takes?.length || 0) - 1);
    if (remainingCount === 0) {
      setRecordedAudioBlob(null);
      setRecordedAudioDuration(0);
      setRecordedVideoBlob(null);
      setRecordedVideoDuration(0);
      setIsReviewingTake(false);
      setForceRecordMode(false);
      activeTakeIdRef.current = null;
      lastSavedBlobRef.current = null;
    }

    setIsLightboxOpen(false);
    await discardSceneTake(effectiveSceneId, targetTakeId);

    setNotification(
      remainingCount === 0
        ? 'Take discarded. Returned to capture slate with your woven script preserved.'
        : 'Take discarded. Previous take promoted to active reel.'
    );
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, [
    preferredTake,
    activeSceneMemory,
    isActiveMasterProtected,
    discardSceneTake,
    effectiveSceneId,
  ]);

  // Active Curriculum Part Context & Golden Thread Bilingual Hierarchy (MW-249 / MW-88-T3 / MW-100-C)
  const activeSparkIdx = useMemo(() => {
    const currentId = (selectedSpark || activePromptSpark)?.id || autoSparkId;
    if (!currentId) return 0;
    const found = FIRESIDE_PROMPT_SPARKS.findIndex(
      (p) => p.id === currentId || p.linkedSceneId === currentId
    );
    return found !== -1 ? found : 0;
  }, [selectedSpark, activePromptSpark, autoSparkId]);

  const resolvedActiveSpark = FIRESIDE_PROMPT_SPARKS[activeSparkIdx] || FIRESIDE_PROMPT_SPARKS[0];

  const activePart = useMemo(
    () => getPartForScene((selectedSpark || activePromptSpark || resolvedActiveSpark)?.linkedSceneId),
    [selectedSpark, activePromptSpark, resolvedActiveSpark]
  );

  // Compute distinct Part start indices so PRODUCTION STAGE header < / > buttons jump to Scene 1 of the next/previous Part
  const partFirstSceneIndices = useMemo(() => {
    const seen = new Set<number>();
    const result: { partNumber: number; firstIdx: number }[] = [];
    FIRESIDE_PROMPT_SPARKS.forEach((spark, idx) => {
      const part = getPartForScene(spark.linkedSceneId);
      if (!seen.has(part.partNumber)) {
        seen.add(part.partNumber);
        result.push({ partNumber: part.partNumber, firstIdx: idx });
      }
    });
    return result;
  }, []);

  const handleHeaderPrevScene = useCallback(() => {
    if (partFirstSceneIndices.length <= 1) {
      const prevIdx = (activeSparkIdx - 1 + FIRESIDE_PROMPT_SPARKS.length) % FIRESIDE_PROMPT_SPARKS.length;
      const targetSpark = FIRESIDE_PROMPT_SPARKS[prevIdx];
      if (targetSpark) handleActivePromptChange(targetSpark);
      return;
    }
    const currentGroupIdx = partFirstSceneIndices.findIndex(
      (g) => g.partNumber === activePart.partNumber
    );
    const prevGroupIdx =
      currentGroupIdx !== -1
        ? (currentGroupIdx - 1 + partFirstSceneIndices.length) % partFirstSceneIndices.length
        : partFirstSceneIndices.length - 1;
    const targetSpark = FIRESIDE_PROMPT_SPARKS[partFirstSceneIndices[prevGroupIdx].firstIdx];
    if (targetSpark) {
      handleActivePromptChange(targetSpark);
    }
  }, [activeSparkIdx, activePart.partNumber, partFirstSceneIndices, handleActivePromptChange]);

  const handleHeaderNextScene = useCallback(() => {
    if (partFirstSceneIndices.length <= 1) {
      const nextIdx = (activeSparkIdx + 1) % FIRESIDE_PROMPT_SPARKS.length;
      const targetSpark = FIRESIDE_PROMPT_SPARKS[nextIdx];
      if (targetSpark) handleActivePromptChange(targetSpark);
      return;
    }
    const currentGroupIdx = partFirstSceneIndices.findIndex(
      (g) => g.partNumber === activePart.partNumber
    );
    const nextGroupIdx =
      currentGroupIdx !== -1 ? (currentGroupIdx + 1) % partFirstSceneIndices.length : 0;
    const targetSpark = FIRESIDE_PROMPT_SPARKS[partFirstSceneIndices[nextGroupIdx].firstIdx];
    if (targetSpark) {
      handleActivePromptChange(targetSpark);
    }
  }, [activeSparkIdx, activePart.partNumber, partFirstSceneIndices, handleActivePromptChange]);

  const activePartTitle = activePart.title;
  const activePartRoman = activePart.title.split(':')[0] || `Part ${activePart.partNumber}`;
  const canonicalScene = useMemo(() => {
    return resolvedActiveSpark.linkedSceneId
      ? getSceneById(resolvedActiveSpark.linkedSceneId)
      : undefined;
  }, [resolvedActiveSpark.linkedSceneId]);

  const canonicalPart = useMemo(() => {
    return getPartForScene(canonicalScene?.id);
  }, [canonicalScene?.id]);

  const activeSceneNumInPart = canonicalScene?.sceneNumber ?? 1;
  const totalScenesInActivePart = canonicalPart?.scenes?.length || 4;

  const englishPartHeading = activePart.localizedTitles?.en || activePart.title;
  const motherTonguePartLang: FiresideLanguage = activeLanguage === 'en' ? 'gu' : activeLanguage;
  const motherTonguePartHeading =
    activePart.localizedTitles?.[motherTonguePartLang] ||
    activePart.localizedTitles?.gu ||
    'ભાગ I: મૂળ અને પાયા';

  const primaryPartHeading =
    activeLanguage === 'en' ? englishPartHeading : motherTonguePartHeading;
  const secondaryPartHeading =
    activeLanguage === 'en' ? motherTonguePartHeading : englishPartHeading;

  const activeSceneTitle =
    activeLanguage === 'en'
      ? resolvedActiveSpark.localizedTitles?.en || resolvedActiveSpark.title
      : resolvedActiveSpark.localizedTitles?.[activeLanguage] || resolvedActiveSpark.title;

  const activeSceneAccess = getSceneAccess(effectiveSceneId);
  const isActiveSceneLockedPreview = Boolean(activeSceneAccess?.isLockedPreview);

  const premieredCount = useMemo(() => {
    return MASTER_STORY_STRUCTURE.filter((p) => !p.isDemo).reduce(
      (acc, p) =>
        acc +
        p.scenes.filter((s) => getSceneMemory(s.id)?.status === 'published').length,
      0
    );
  }, [scenes, getSceneMemory]);

  const projectId = resolveProjectId();
  const showStagingBadge =
    !isProductionProject(projectId) &&
    (typeof window === 'undefined' || !isProductionHostname(window.location?.hostname)) &&
    isStagingProject(projectId);
  const isAuthenticated = Boolean(user && !user.isAnonymous);
  const activeTierLabel =
    (user as any)?.membershipTier === 'generational_vault'
      ? 'Generational Vault'
      : (user as any)?.directorPassStatus === 'paid_host_pass_active' ||
        (user as any)?.role === 'Super Admin'
      ? 'Director Pass'
      : isAuthenticated
      ? 'Sandbox Free Forever'
      : 'Guest Session';

  const effectiveActStage: 1 | 2 | 3 | 4 | 5 =
    selectedActStage ??
    (activeSceneMemory?.status === 'published'
      ? 4
      : hasCompletedReel
      ? 4
      : ((activeSceneMemory?.productionStage as 1 | 2 | 3 | 4 | undefined) || 1));

  const isInlineAct3Active = effectiveActStage === 3 && !isActiveSceneLockedPreview;

  const bottomPrimaryCtaLabel = isActiveSceneLockedPreview
    ? 'Unlock Chapter'
    : effectiveActStage === 1
    ? 'Next: Weave'
    : effectiveActStage === 2
    ? 'Next: Record'
    : effectiveActStage === 3
    ? hasCompletedReel
      ? 'Next: Cut'
      : 'Record Scene'
    : effectiveActStage === 4
    ? 'Next: Premiere'
    : activeSceneMemory?.status === 'published'
    ? 'Open Cinema'
    : 'Premiere';

  const handleBottomPrimaryAction = () => {
    if (isActiveSceneLockedPreview) {
      setIsUpgradeSheetOpen(true);
      return;
    }
    if (effectiveActStage === 1) {
      setSelectedActStage(2);
    } else if (effectiveActStage === 2) {
      setSelectedActStage(3);
    } else if (effectiveActStage === 3) {
      if (hasCompletedReel) {
        setSelectedActStage(4);
      } else if (typeof document !== 'undefined') {
        const el = document.getElementById('fireside-active-studio');
        el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      }
    } else if (effectiveActStage === 4) {
      setSelectedActStage(5);
    } else {
      if (activeSceneMemory?.status === 'published') {
        handleSelectFiresideView('cinema');
      } else {
        void publishSceneToCinema(effectiveSceneId);
      }
    }
  };

  const handleSelectSceneById = useCallback(
    (sceneId: string) => {
      const spark = FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === sceneId);
      if (spark) {
        handleActivePromptChange(spark);
        handleSelectFiresideView('studio');
      }
    },
    [handleActivePromptChange, handleSelectFiresideView]
  );

  const handleWatchSceneFromCinema = useCallback(
    (sceneId: string) => {
      const spark = FIRESIDE_PROMPT_SPARKS.find((s) => s.linkedSceneId === sceneId);
      if (spark) {
        handleActivePromptChange(spark);
      }
      setIsLightboxOpen(true);
    },
    [handleActivePromptChange]
  );

  const activeFiresideSlateMeta: RawCinemaSlateInput = useMemo(
    () => ({
      title:
        selectedSpark?.title ||
        activePromptSpark?.title ||
        activeSceneMemory?.sceneTitle ||
        activeSceneTitle,
      chapterTitle: activePartTitle,
      sceneNumber: activeSceneNumInPart,
      location: activeSceneMemory?.location || null,
      country: activeSceneMemory?.country || null,
      year: activeSceneMemory?.year ?? activeSceneMemory?.dateComponents?.year ?? null,
      age: (activeSceneMemory as any)?.narratorAgeAtTime ?? null,
      narratorName: (user as any)?.displayName || null,
    }),
    [
      selectedSpark?.title,
      activePromptSpark?.title,
      activeSceneMemory,
      activeSceneTitle,
      activePartTitle,
      activeSceneNumInPart,
      user,
    ]
  );

  const recorderStudioBlock = !isActiveSceneLockedPreview ? (
    mediaMode === 'video' ? (
      /* Video Memo Recording Surface */
      <div id="fireside-active-studio" className="w-full pt-3 border-t border-stone-900/80 flex flex-col items-center">
        <div className="w-full max-w-xl flex justify-end mb-2 px-1">
          <button
            type="button"
            data-testid="HS_ACT3_VIEWFINDER_SWITCH_MODE"
            onClick={() => handleModeChange('audio')}
            className="px-3 py-1.5 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 hover:border-amber-500/50 text-stone-300 hover:text-amber-200 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Switch to Voice & Photos recording mode"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch to Voice & Photos</span>
          </button>
        </div>
        <div className="text-center mb-3 w-full max-w-xl">
          <p className="text-xs uppercase tracking-widest text-amber-500/90 font-semibold mb-1">
            WhatsApp / FaceTime Video Memo
          </p>
          <h2 className="text-lg sm:text-xl font-serif text-stone-200">
            {selectedSpark ? `Record: ${selectedSpark.title}` : `Record: ${activeSceneTitle}`}
          </h2>
          <FiresidePrompterBanner
            prose={activeSceneMemory?.prose}
            pinnedQuestion={pinnedPrompterQuestion}
            slateMeta={activeFiresideSlateMeta}
          />
        </div>

        <FiresideVideoRecorder
          ref={videoRecorderRef}
          promptSpark={selectedSpark || activePromptSpark}
          activeLanguage={activeLanguage}
          activeMood={activeMood}
          activeActStage={selectedActStage as any}
          hasExternalScriptBanner={true}
          isMasterProtected={isActiveMasterProtected}
          takeNumber={activeTakeNumberRef.current || (activeSceneMemory?.takes?.length || 1)}
          onMoodChange={handleMoodChange}
          onRecordingComplete={handleVideoRecordingComplete}
          onKeepRecording={handleKeepVideoRecording}
          onReset={handleResetVideoRecording}
          onRecordingChange={setIsFiresideRecording}
          className="w-full"
        />
      </div>
    ) : (
      /* Voice Recording & Heirloom Photo Tray Surface */
      <>
        {/* Physical Album Photo Capture Tray (MW-247) */}
        <div className="w-full max-w-xl mx-auto">
          <AlbumPhotoCaptureTray
            ref={photoTrayRef}
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={6}
            suggestedPhotoPrompt={selectedSpark ? selectedSpark.recommendedPhotoPrompt[activeLanguage] : null}
            className="w-full"
          />
        </div>

        {/* Tactile Web Audio Voice Recorder (MW-246) */}
        <div id="fireside-active-studio" className="w-full pt-3 border-t border-stone-900/80 flex flex-col items-center">
          <div className="w-full max-w-xl flex justify-end mb-2 px-1">
            <button
              type="button"
              data-testid="HS_ACT3_VIEWFINDER_SWITCH_MODE"
              onClick={() => handleModeChange('video')}
              className="px-3 py-1.5 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 hover:border-amber-500/50 text-stone-300 hover:text-amber-200 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Switch to Video Memo recording mode"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Switch to Video Memo</span>
            </button>
          </div>
          <div className="text-center mb-3 w-full max-w-xl">
            <p className="text-xs uppercase tracking-widest text-amber-500/90 font-semibold mb-1">
              Fireside Voice Recording
            </p>
            <h2 className="text-lg sm:text-xl font-serif text-stone-200">
              {selectedSpark ? `Speak: ${selectedSpark.title}` : `Speak: ${activeSceneTitle}`}
            </h2>
            <FiresidePrompterBanner
              prose={activeSceneMemory?.prose}
              pinnedQuestion={pinnedPrompterQuestion}
              slateMeta={activeFiresideSlateMeta}
            />
          </div>

          <TactileVoiceRecorder
            ref={recorderRef}
            promptSpark={selectedSpark || activePromptSpark}
            activeLanguage={activeLanguage}
            activeMood={activeMood}
            activeActStage={selectedActStage as any}
            photos={photos.length > 0 ? photos : activeSceneMemory?.photos || []}
            isMasterProtected={isActiveMasterProtected}
            takeNumber={activeTakeNumberRef.current || (activeSceneMemory?.takes?.length || 1)}
            onMoodChange={handleMoodChange}
            onRecordingComplete={handleAudioRecordingComplete}
            onKeepRecording={handleKeepAudioRecording}
            onReset={handleResetAudioRecording}
            onRecordingChange={setIsFiresideRecording}
            className="w-full"
          />
        </div>
      </>
    )
  ) : null;

  const firstPhotoForPoster = (
    photos.length > 0
      ? photos
      : activeSceneMemory?.photos && activeSceneMemory.photos.length > 0
      ? activeSceneMemory.photos
      : []
  )[0];
  const resolvedPosterUrl =
    (activeSceneMemory as any)?.posterUrl ||
    (activeSceneMemory as any)?.thumbnailUrl ||
    (firstPhotoForPoster
      ? typeof firstPhotoForPoster === 'string'
        ? firstPhotoForPoster
        : (firstPhotoForPoster as any).storageUrl ||
          (firstPhotoForPoster as any).localUri ||
          (firstPhotoForPoster as any).url ||
          null
      : null);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-stone-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Fireside 2.0 Single 52px Mobile Top Bar (< 768px) */}
      <FiresideMobileTopBar
        partRoman={activePartRoman}
        sceneNumberInPart={activeSceneNumInPart}
        totalScenesInPart={totalScenesInActivePart}
        isLockedPreview={isActiveSceneLockedPreview}
        activeLanguage={activeLanguage}
        isHybrid={isHybrid}
        isSaving={isSaving}
        isSynced={isSynced}
        isOffline={isOffline}
        onOpenChapterSheet={() => setIsChapterSheetOpen(true)}
        onOpenLangSheet={() => setIsLangSheetOpen(true)}
        onOpenMenuSheet={() => setIsMenuSheetOpen(true)}
      />

      {/* 1. Desktop / Unfolded Tablet Navigation & Synchronisation Deck (>= 768px) */}
      <div className="md:sticky md:top-0 z-30 w-full">
        <div className="hidden md:block w-full">
        {/* Discreet Elder Auth Header with Desktop Stage Ingress & Dynamic Stage Badge */}
        <FiresideAuthHeader
          activePartTitle={activePartTitle}
          activeStage={selectedActStage ?? activeSceneMemory?.productionStage}
          activeSceneMemory={activeSceneMemory}
        />

        {/* 2. Reassuring Vault Synchronisation HUD Strip */}
        <div className="w-full bg-stone-950/85 border-b border-stone-800/60 py-2 px-3 sm:px-6 backdrop-blur-md">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between text-xs gap-x-2 gap-y-1.5">
            <span className="hidden sm:flex text-stone-400 font-serif text-xs items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-medium text-stone-300">Fireside Studio</span>
            </span>

            {/* Persistent Top-Bar Segmented Switcher Pill + 1-Tap In-App Fireside Cinema Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <StudioSurfaceSwitcher
                currentSurface="fireside"
                currentSceneId={effectiveSceneId || searchParams?.get('id') || 'part-1-scene-1'}
                actStage={(selectedActStage && selectedActStage <= 4 ? selectedActStage : 1) as any}
                isRecording={isFiresideRecording}
              />
              {!isFiresideRecording && (
                <button
                  type="button"
                  data-testid="HS_FIRESIDE_BAR2_CINEMA_LINK"
                  onClick={() =>
                    handleSelectFiresideView(activeView === 'cinema' ? 'studio' : 'cinema')
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-[11px] font-mono font-bold transition-colors shrink-0 cursor-pointer"
                  title="Toggle in-app Fireside Family Cinema gallery"
                >
                  <span>{activeView === 'cinema' ? '← Fireside Studio' : 'Fireside Cinema'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center shrink-0">
              {isSaving ? (
                <div
                  className="flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-950/50 border border-amber-500/40 px-2.5 py-1 rounded-full animate-pulse"
                  title="Saving spoken tale, video memo, and photographs to cloud vault"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span className="hidden sm:inline">Saving to vault...</span>
                  <span className="sm:hidden">Saving...</span>
                  <span>{progressPercent}%</span>
                </div>
              ) : isSynced ? (
                <div
                  className="flex items-center gap-1.5 text-xs text-emerald-300 font-mono bg-emerald-950/50 border border-emerald-500/40 px-2.5 py-1 rounded-full shadow-sm"
                  title="Your memoir and photographs are safely synchronised"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Saved safely in vault ✓</span>
                  <span className="sm:hidden">Saved ✓</span>
                </div>
              ) : isOffline ? (
                <div
                  className="flex items-center gap-1.5 text-xs text-stone-300 font-mono bg-stone-900 border border-stone-700/80 px-2.5 py-1 rounded-full"
                  title="Your story is safely stored on this phone and will synchronise when reconnected"
                >
                  <CloudOff className="w-3.5 h-3.5 text-stone-400" />
                  <span className="hidden sm:inline">Saved to phone (offline)</span>
                  <span className="sm:hidden">Offline</span>
                </div>
              ) : syncState === 'error' ? (
                <button
                  type="button"
                  onClick={() => triggerManualSync()}
                  data-hotspot-id="HS_FIRESIDE_SYNC_RETRY_BTN"
                  className="flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-950/60 border border-amber-500/60 px-2.5 py-1 rounded-full hover:bg-amber-900/80 transition-colors cursor-pointer"
                  title="Your memoir is safely preserved on this device. Tap to synchronise to cloud vault."
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Saved on phone • Sync cloud ↺</span>
                  <span className="sm:hidden">Sync ↺</span>
                </button>
              ) : (
                <div
                  className="flex items-center gap-1.5 text-xs text-stone-400 font-mono shrink-0"
                  title="Cloud vault connected"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="hidden sm:inline text-stone-400">Vault Connected</span>
                  <span className="sm:hidden text-stone-400">Vault</span>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* 3. Primary Armchair Storytelling Surface */}
      <main className="flex-1 flex flex-col items-center justify-start p-3 sm:p-5 w-full max-w-2xl mx-auto space-y-4">
        {/* Desktop / Unfolded Tablet Orientation & Chapter Header (>= 768px) */}
        <div className="hidden md:flex md:flex-col items-center w-full space-y-4">
          <OrientationSoundcheckDock
            activeLanguage={activeLanguage}
            showDesktopBanner={showDesktopBanner}
            onDismissDesktopBanner={handleDismissDesktopBanner}
            onWarmupComplete={() => {
              logEvent('FIRESIDE_WARMUP_COMPLETED' as any, {
                language: activeLanguage,
              });
              setNotification('Soundcheck complete. Entering Part I: Roots and Foundations.');
              setTimeout(() => {
                setNotification(null);
              }, 5000);
            }}
          />

          {activeView === 'studio' && (
            <div className="text-center w-full max-w-xl" data-testid="fireside-golden-thread-header">
              <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 mb-1">
                <p
                  data-testid="fireside-production-stage-label"
                  className="text-[10px] uppercase tracking-[0.25em] text-sky-400/80 font-black"
                >
                  PRODUCTION STAGE
                </p>
                <span className="text-stone-600 text-[10px]">•</span>
                <span className="text-[11px] font-mono text-amber-300/90 font-medium">
                  {completedScenes} of {totalScenes} Woven ({vaultProgressPercent}%)
                  {premieredCount > 0 ? ` · ${premieredCount} Premiered` : ''}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-full">
                <button
                  type="button"
                  data-testid="HS_FIRESIDE_HEADER_PREV_SCENE"
                  onClick={handleHeaderPrevScene}
                  aria-label="Jump to previous Part Scene 1"
                  title="Jump to previous Part Scene 1"
                  style={{ minHeight: 40, minWidth: 40 }}
                  className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 text-stone-200 hover:text-amber-300 font-mono text-lg font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  ‹
                </button>

                <div className="flex flex-col items-center min-w-0 px-1">
                  <h1
                    data-testid="fireside-chapter-primary-title"
                    className="text-base sm:text-xl font-serif text-white font-normal leading-tight"
                  >
                    {primaryPartHeading}
                  </h1>
                  {(isHybrid || activeLanguage !== 'en') && (
                    <p
                      data-testid="fireside-chapter-secondary-title"
                      className="text-xs sm:text-sm font-serif text-amber-200/85 mt-0.5 leading-tight"
                    >
                      {secondaryPartHeading}
                    </p>
                  )}
                  <p
                    data-testid="HS_FIRESIDE_HEADER_SCENE_SUBTITLE"
                    className="text-[11px] font-mono text-amber-300/90 mt-0.5 leading-snug"
                  >
                    {activePartRoman} • Scene {activeSceneNumInPart} of {totalScenesInActivePart} • {activeSceneTitle}
                  </p>
                </div>

                <button
                  type="button"
                  data-testid="HS_FIRESIDE_HEADER_NEXT_SCENE"
                  onClick={handleHeaderNextScene}
                  aria-label="Jump to next Part Scene 1"
                  title="Jump to next Part Scene 1"
                  style={{ minHeight: 40, minWidth: 40 }}
                  className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 text-stone-200 hover:text-amber-300 font-mono text-lg font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        {activeView === 'cinema' ? (
          <FiresideCinemaView
            directorName={(user as any)?.displayName || null}
            isLoading={isVaultLoading}
            wovenCount={completedScenes}
            totalScenes={totalScenes}
            wovenPercent={vaultProgressPercent}
            premieredCount={premieredCount}
            getSceneMemory={(id: string) => getSceneMemoryWithDefaults(id)}
            resolveDocIdForScene={resolveDocIdForScene}
            onWatchSceneReel={handleWatchSceneFromCinema}
            onOpenSceneInStudio={handleSelectSceneById}
          />
        ) : (
          <>
            {/* The 5-Act Prompt Carousel & Swipe Pager */}
            <div className="w-full">
              <SingleCardPromptCarousel
                prompts={FIRESIDE_PROMPT_SPARKS}
                initialPromptId={autoSparkId}
                activePromptId={(selectedSpark || activePromptSpark || resolvedActiveSpark)?.id}
                hideInlineOrientationDock={true}
                hideInlineHeaderStepper={true}
                hideBottomRibbon={true}
                hideCompletedDuplicateActions={hasCompletedReel}
                fireside2MobileMode={true}
                isRecordingActive={isFiresideRecording}
                sceneAccess={activeSceneAccess}
                resolveSceneAccess={(sceneId?: string) =>
                  sceneId ? getSceneAccess(sceneId) : undefined
                }
                onOpenUpgradeSheet={() => setIsUpgradeSheetOpen(true)}
                onPublishToCinema={(sceneId: string) => publishSceneToCinema(sceneId)}
                onOpenFiresideCinema={() => handleSelectFiresideView('cinema')}
                resolveDocIdForScene={resolveDocIdForScene}
                inlineAct3RecorderNode={isInlineAct3Active ? recorderStudioBlock : undefined}
                activeLanguage={activeLanguage}
                isHybrid={isHybrid}
                onToggleHybrid={setIsHybrid}
                mediaMode={mediaMode}
                onMediaModeChange={handleModeChange}
                editingAuthority={activeEditingAuthority}
                resolveSceneAuthority={resolveSceneAuthority}
                activeSceneMemory={activeSceneMemory}
                getSceneMemory={(sceneId?: string) => sceneId ? getSceneMemoryWithDefaults(sceneId) : undefined}
                onSaveProse={handleSaveProse}
                onSaveCoordinates={handleSaveCoordinates}
                pinnedPrompterQuestion={pinnedPrompterQuestion}
                onPinQuestionToPrompter={handlePinQuestionToPrompter}
                onAnswerFollowUpNote={handleAnswerFollowUpNote}
                onSelectPrompt={handleSelectPrompt}
                onActivePromptChange={handleActivePromptChange}
                onLanguageChange={handleLanguageChange}
                onPhotoPromptClick={handlePhotoPromptClick}
                selectedActStage={selectedActStage}
                onSelectActStage={setSelectedActStage}
                onOpenScreeningRoom={() => setIsLightboxOpen(true)}
                onWarmupComplete={() => {
                  logEvent('FIRESIDE_WARMUP_COMPLETED' as any, {
                    language: activeLanguage,
                  });
                  setNotification('Soundcheck complete. Entering Part I: Roots and Foundations.');
                  setTimeout(() => {
                    setNotification(null);
                  }, 5000);
                }}
              />
            </div>

            {/* Active Recording Surface below card (rendered when NOT already mounted inline inside Act III) */}
            {!isCompleted && !isInlineAct3Active && recorderStudioBlock}

            {/* Top-Level Bonus Memory Drawer Trigger for In-Progress / Unrecorded Unlocked Scenes */}
            {!hasCompletedReel && !isActiveSceneLockedPreview && (
              <div className="w-full max-w-xl mx-auto pt-4 pb-2 border-t border-stone-900/80 flex flex-col items-center">
                <button
                  type="button"
                  data-testid="HS_FIRESIDE_OPEN_BONUS_DRAWER_BTN"
                  data-hotspot-id="HS_FIRESIDE_OPEN_BONUS_DRAWER_BTN"
                  onClick={handleOpenBonusDrawer}
                  className="w-full min-h-[52px] px-6 py-3 rounded-2xl bg-stone-900/90 hover:bg-stone-800/90 border border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98 select-none shadow-lg shadow-black/40"
                >
                  <PlusCircle className="w-5 h-5 text-amber-400" />
                  <span>Open Bonus Memory Drawer</span>
                </button>
                <p className="mt-1.5 text-[11px] font-mono text-stone-500 text-center">
                  Add handwritten archival notes, family reflections, or heirloom photos
                </p>
              </div>
            )}

            {/* Celebratory Completed Reel Card (Visible whenever scene has a recorded take) */}
            {hasCompletedReel && (
              <div
                id={isCompleted ? 'fireside-active-studio' : 'fireside-completed-reel-section'}
                className="w-full max-w-xl mx-auto pt-3 border-t border-stone-900/80 flex flex-col items-center"
              >
                <FiresideCompletedReelCard
                  sceneId={effectiveSceneId}
                  sceneTitle={selectedSpark?.title || activePromptSpark?.title || activeSceneMemory?.sceneTitle || 'Story Scene'}
                  sceneMemory={activeSceneMemory}
                  editingAuthority={activeEditingAuthority}
                  sessionPhotos={photos}
                  overrideDurationSeconds={
                    mediaMode === 'video' && recordedVideoDuration > 0
                      ? recordedVideoDuration
                      : recordedAudioDuration > 0
                      ? recordedAudioDuration
                      : undefined
                  }
                  activeLanguage={activeLanguage}
                  onWatchTheatricalReel={() => setIsLightboxOpen(true)}
                  onAddBonusNote={() => {
                    setBonusDrawerSeedPrompt(null);
                    setEditingBonusNote(null);
                    setIsBonusDrawerOpen(true);
                  }}
                  onEditBonusNote={(note) => {
                    setBonusDrawerSeedPrompt(null);
                    setEditingBonusNote(note);
                    setIsBonusDrawerOpen(true);
                  }}
                  onDeleteBonusNote={async (noteId) => {
                    await deleteBonusMemoryNote(effectiveSceneId, noteId);
                    setNotification('Bonus recollection removed from vault.');
                    setTimeout(() => setNotification(null), 3000);
                  }}
                  onDiscardTake={handleDiscardActiveTake}
                  onPromoteMasterTake={(takeId) => promotePreferredTake(effectiveSceneId, takeId)}
                  onReorderTakes={(orderedIds) => reorderSceneTakes(effectiveSceneId, orderedIds)}
                  onSafeDiscardTake={(discardId, fallbackId) => safeDiscardTake(effectiveSceneId, discardId, fallbackId)}
                  onRestoreTake={(takeId) => restoreOuttakeTake(effectiveSceneId, takeId)}
                  onReRecordRequest={() => {
                    setIsReviewingTake(false);
                    setForceRecordMode(true);
                    setSelectedActStage(3);
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Selected Spark / Recording Confirmation Toast */}
        {notification && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-stone-900/95 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">
                {notification}
              </p>
            </div>

            <Link
              href={`/studio/production/${resolveDocIdForScene(effectiveSceneId) || activeSceneMemory?.id || effectiveSceneId}?act=1`}
              data-testid="toast-studio-jump-link"
              className="hidden md:inline-flex shrink-0 text-xs font-bold text-amber-300 hover:text-amber-100 underline underline-offset-2 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 transition-all cursor-pointer"
            >
              Open Studio ↓
            </Link>
          </div>
        )}

        {/* High-Contrast Archival Vault Uploading Indicator (AUDIT-MW-147) */}
        {isSecuringToVault && (
          <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="bg-stone-900 border-2 border-amber-500/80 text-amber-100 p-8 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin flex items-center justify-center">
                <Cloud className="w-6 h-6 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-bold text-amber-200 tracking-wide">
                  ☁️ Securing to Generational Vault...
                </h3>
                <p className="text-xs text-stone-400">
                  {securingProgress > 0 ? `${securingProgress}% uploaded` : 'Preserving media reel with archival durability'}
                </p>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden border border-stone-700">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${Math.max(5, securingProgress)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fireside 2.0 Sticky Thumb-Zone Bottom Bar (🔥 Studio | Primary CTA | 🎞️ Cinema) */}
      <FiresideBottomBar
        activeView={activeView}
        recordedCount={completedScenes}
        primaryCtaLabel={bottomPrimaryCtaLabel}
        isLockedPreview={isActiveSceneLockedPreview}
        isRecording={isFiresideRecording}
        onSelectView={handleSelectFiresideView}
        onPrimaryAction={handleBottomPrimaryAction}
      />

      {/* Fireside 2.0 Mobile Slide-Up Bottom Sheets */}
      <FiresideChapterSheet
        open={isChapterSheetOpen}
        onOpenChange={setIsChapterSheetOpen}
        activeSceneId={effectiveSceneId}
        activeLanguage={activeLanguage}
        wovenCount={completedScenes}
        totalScenes={totalScenes}
        wovenPercent={vaultProgressPercent}
        premieredCount={premieredCount}
        getSceneMemory={(id: string) => getSceneMemoryWithDefaults(id)}
        getSceneAccess={getSceneAccess}
        onSelectScene={handleSelectSceneById}
        onOpenUpgradeSheet={() => setIsUpgradeSheetOpen(true)}
      />

      <FiresideLangSheet
        open={isLangSheetOpen}
        onOpenChange={setIsLangSheetOpen}
        activeLanguage={activeLanguage}
        isHybrid={isHybrid}
        onSelectLanguage={handleLanguageChange}
        onToggleHybrid={setIsHybrid}
      />

      <FiresideStudioMenuSheet
        open={isMenuSheetOpen}
        onOpenChange={setIsMenuSheetOpen}
        isAuthenticated={isAuthenticated}
        userEmail={user?.email || null}
        tierLabel={activeTierLabel}
        showStagingBadge={showStagingBadge}
        commitSha={process.env.NEXT_PUBLIC_COMMIT_SHA || ''}
        onLaunchSoundcheck={() => setIsMobileWarmupOpen(true)}
        onSignOut={() => void logout?.(false)}
      />

      <FiresideUpgradeSheet
        open={isUpgradeSheetOpen}
        onOpenChange={setIsUpgradeSheetOpen}
        partTitle={activePartTitle}
      />

      <FiresideWelcomeSheet
        open={isWelcomeSheetOpen}
        onDismiss={handleDismissWelcomeSheet}
        onStartSoundcheck={() => setIsMobileWarmupOpen(true)}
      />

      <FiresideWarmupModal
        isOpen={isMobileWarmupOpen}
        activeLanguage={activeLanguage}
        onClose={() => setIsMobileWarmupOpen(false)}
        onComplete={(exitMsg) => {
          setIsMobileWarmupOpen(false);
          logEvent('FIRESIDE_WARMUP_COMPLETED' as any, {
            language: activeLanguage,
          });
          setNotification(exitMsg || 'Soundcheck complete. Ready to speak your story!');
          setTimeout(() => setNotification(null), 5000);
        }}
      />

      {/* 2.39:1 Cinema Master Reel Lightbox Player (Ticket #259 & MW-88-T5) */}
      <FiresideCinemaLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onOpenBonusDrawer={() => {
          setBonusDrawerSeedPrompt(null);
          setEditingBonusNote(null);
          setIsBonusDrawerOpen(true);
        }}
        onDiscardTake={handleDiscardActiveTake}
        editingAuthority={activeEditingAuthority}
        sceneTitle={selectedSpark?.title || activePromptSpark?.title || activeSceneMemory?.sceneTitle || 'Story Scene'}
        chapterTitle={activePartTitle}
        sceneNumber={activeSceneNumInPart}
        location={activeSceneMemory?.location || null}
        year={activeSceneMemory?.year ?? activeSceneMemory?.dateComponents?.year ?? null}
        age={(activeSceneMemory as any)?.narratorAgeAtTime ?? null}
        narratorName={(user as any)?.displayName || null}
        hasBurnedInTitleSlate={Boolean((activeSceneMemory as any)?.hasBurnedInTitleSlate)}
        mediaUrl={
          preferredTake?.mediaUrl ||
          activeSceneMemory?.videoUrl ||
          activeSceneMemory?.audioUrl ||
          (mediaMode === 'video' && recordedVideoBlob
            ? URL.createObjectURL(recordedVideoBlob)
            : recordedAudioBlob
            ? URL.createObjectURL(recordedAudioBlob)
            : null)
        }
        mediaMode={preferredTake?.mediaMode || mediaMode}
        photos={
          photos.length > 0
            ? photos
            : activeSceneMemory?.photos && activeSceneMemory.photos.length > 0
            ? activeSceneMemory.photos
            : []
        }
        posterUrl={resolvedPosterUrl}
        durationSeconds={preferredTake?.durationSeconds || recordedVideoDuration || recordedAudioDuration}
        moodTag={activeMood}
      />

      {/* Additive Bonus Memory Recollection Drawer (Ticket #259 & MW-88-T6 / MW-110) */}
      <BonusMemoryDrawer
        isOpen={isBonusDrawerOpen}
        onClose={() => {
          setIsBonusDrawerOpen(false);
          setBonusDrawerSeedPrompt(null);
          setEditingBonusNote(null);
        }}
        sceneId={effectiveSceneId}
        sceneTitle={selectedSpark?.title || activePromptSpark?.title || activeSceneMemory?.sceneTitle || 'Story Scene'}
        initialPrompt={bonusDrawerSeedPrompt}
        editingNote={editingBonusNote}
        activeLanguage={activeLanguage}
        onSaveBonusNote={async (note) => {
          await addBonusMemoryNote(effectiveSceneId, note);
          setNotification('Bonus recollection secured in vault!');
          setTimeout(() => setNotification(null), 3000);
        }}
        onUpdateBonusNote={async (noteId, updated) => {
          await updateBonusMemoryNote(effectiveSceneId, noteId, updated);
          setNotification('Bonus recollection updated in vault!');
          setTimeout(() => setNotification(null), 3000);
        }}
        onDeleteBonusNote={async (noteId) => {
          await deleteBonusMemoryNote(effectiveSceneId, noteId);
          setNotification('Bonus recollection removed from vault.');
          setTimeout(() => setNotification(null), 3000);
        }}
      />

      {/* Subtle Footer (Desktop) */}
      <footer className="hidden md:flex w-full py-4 border-t border-stone-900 text-center text-[11px] text-stone-500 items-center justify-center gap-1.5">
        <HeartHandshake className="w-3.5 h-3.5 text-stone-600" />
        <span>Designed for multi-generational storytelling & elder ergonomics</span>
      </footer>
    </div>
  );
}
