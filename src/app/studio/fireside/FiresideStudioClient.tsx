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
import { useCurriculumVault, StoryMoodTag, isSceneCompleted } from '@/hooks/useCurriculumVault';
import { FiresideAuthHeader } from '@/components/fireside/FiresideAuthHeader';
import { FiresideModeSwitch, FIRESIDE_MODE_STORAGE_KEY } from '@/components/fireside/FiresideModeSwitch';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { TactileVoiceRecorder, TactileVoiceRecorderRef } from '@/components/fireside/TactileVoiceRecorder';
import { FiresideVideoRecorder, FiresideVideoRecorderRef } from '@/components/fireside/FiresideVideoRecorder';
import { AlbumPhotoCaptureTray, AlbumPhotoCaptureTrayRef } from '@/components/fireside/AlbumPhotoCaptureTray';
import { FiresideCompletedReelCard } from '@/components/fireside/FiresideCompletedReelCard';
import { FiresideCinemaLightbox } from '@/components/fireside/FiresideCinemaLightbox';
import { BonusMemoryDrawer } from '@/components/fireside/BonusMemoryDrawer';
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
} from 'lucide-react';
import { getSceneById } from '@/lib/curriculum/masterStoryStructure';

export default function FiresideStudioClient() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
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

  const validLangs: FiresideLanguage[] = ['en', 'gu', 'pa', 'hi'];
  const resolvedLang: FiresideLanguage = initialLangParam && validLangs.includes(initialLangParam)
    ? initialLangParam
    : 'en';

  const [activeLanguage, setActiveLanguage] = useState<FiresideLanguage>(resolvedLang);
  const [mediaMode, setMediaMode] = useState<FiresideMediaMode>('audio');
  const [activePromptSpark, setActivePromptSpark] = useState<FiresidePromptSpark>(FIRESIDE_PROMPT_SPARKS[0]);
  const [selectedSpark, setSelectedSpark] = useState<FiresidePromptSpark | null>(null);
  const [photos, setPhotos] = useState<HeirloomPhotoAttachment[]>([]);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState<number>(0);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoDuration, setRecordedVideoDuration] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [showDesktopBanner, setShowDesktopBanner] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [isBonusDrawerOpen, setIsBonusDrawerOpen] = useState<boolean>(false);
  const [forceRecordMode, setForceRecordMode] = useState<boolean>(false);
  const [isReviewingTake, setIsReviewingTake] = useState<boolean>(false);

  const photoTrayRef = useRef<AlbumPhotoCaptureTrayRef>(null);
  const recorderRef = useRef<TactileVoiceRecorderRef>(null);
  const videoRecorderRef = useRef<FiresideVideoRecorderRef>(null);

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

  // Restore persisted media mode on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(FIRESIDE_MODE_STORAGE_KEY) as FiresideMediaMode | null;
        if (stored === 'audio' || stored === 'video') {
          setMediaMode(stored);
        }
      } catch {}
    }
  }, []);

  const activeTakeIdRef = useRef<string | null>(null);
  const activeTakeNumberRef = useRef<number>(1);
  const lastSavedBlobRef = useRef<Blob | null>(null);

  const effectiveSceneId = selectedSpark?.linkedSceneId || activePromptSpark?.linkedSceneId || 'part-1-scene-1';

  // Unified Curriculum Vault Hook (MW-88-T1 & MW-88-T2: Bi-Directional Bridge)
  const {
    getSceneMemory,
    saveSceneTake,
    setStoryMoodTag,
    addBonusMemoryNote,
    completedScenes,
    totalScenes,
    vaultProgressPercent,
    nextPendingSceneId,
  } = useCurriculumVault({
    userId: user?.uid,
    initialSceneId: effectiveSceneId,
  });

  const activeSceneMemory = getSceneMemory(effectiveSceneId);
  const activeMood = activeSceneMemory?.moodTag;
  const hasCompletedReel = isSceneCompleted(activeSceneMemory);
  const isCompleted = hasCompletedReel && !forceRecordMode && !isReviewingTake;

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
      if (cloudMediaUrl) {
        const takeId = activeTakeIdRef.current || `take_${Date.now()}`;
        const takeNumber = activeTakeNumberRef.current || activeSceneMemory?.takes?.length || 1;
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
            label: `Take ${takeNumber} (${mediaMode === 'video' ? 'Fireside Video' : 'Fireside Voice'})`,
            isPreferred: true,
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
    if (initialPromptParam) return initialPromptParam;
    if (nextPendingSceneId) {
      const matched = FIRESIDE_PROMPT_SPARKS.find((p) => p.linkedSceneId === nextPendingSceneId);
      if (matched) return matched.id;
    }
    return undefined;
  }, [initialPromptParam, nextPendingSceneId]);

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
  }, [initialLangParam]);

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
    setActivePromptSpark((prev) => {
      if (prev && prev.id !== spark.id) {
        setForceRecordMode(false);
      }
      return spark;
    });
  }, []);

  const handleSelectPrompt = (spark: FiresidePromptSpark, _language: FiresideLanguage) => {
    setSelectedSpark(spark);
    setForceRecordMode(true);
    const targetMode: FiresideMediaMode = mediaMode || spark.suggestedMediaMode || 'audio';
    logEvent('FIRESIDE_PROMPT_SELECTED', {
      promptId: spark.id,
      sceneId: spark.linkedSceneId,
      mediaMode: targetMode,
    });
    setNotification(
      targetMode === 'video'
        ? `Recording "${spark.title}" in WhatsApp / FaceTime Video Studio.`
        : `Recording "${spark.title}" in Voice & Photos Studio.`
    );

    const triggerStudio = () => {
      if (targetMode === 'video') {
        if (videoRecorderRef.current) {
          videoRecorderRef.current.scrollIntoView();
          if (videoRecorderRef.current.status !== 'recording') {
            setRecordedVideoBlob(null);
            setRecordedVideoDuration(0);
            videoRecorderRef.current.startRecording();
          }
        } else {
          document.getElementById('fireside-active-studio')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        if (recorderRef.current) {
          recorderRef.current.scrollIntoView();
          if (recorderRef.current.status !== 'recording') {
            setRecordedAudioBlob(null);
            setRecordedAudioDuration(0);
            recorderRef.current.startRecording();
          }
        } else {
          document.getElementById('fireside-active-studio')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    if (
      (targetMode === 'video' && videoRecorderRef.current) ||
      (targetMode === 'audio' && recorderRef.current)
    ) {
      triggerStudio();
    } else {
      setTimeout(triggerStudio, 80);
    }
  };

  const handleModeChange = (newMode: FiresideMediaMode) => {
    setMediaMode(newMode);
    setForceRecordMode(true);
    if (!selectedSpark && activePromptSpark) {
      setSelectedSpark(activePromptSpark);
    }
    logEvent('FIRESIDE_MODE_SWITCHED', { mode: newMode });
    setNotification(
      newMode === 'video'
        ? 'WhatsApp / FaceTime Video Memo Studio ready below.'
        : 'Heirloom Photo Digitisation & Voice Studio ready below.'
    );
    setTimeout(() => {
      if (newMode === 'video' && videoRecorderRef.current) {
        videoRecorderRef.current.scrollIntoView();
      } else if (newMode === 'audio' && photoTrayRef.current) {
        photoTrayRef.current.scrollIntoView();
      } else if (newMode === 'audio') {
        document.getElementById('album-photo-capture-tray')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        document.getElementById('fireside-active-studio')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
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
      handleModeChange('audio');
    }
    setNotification(`Physical photo cue: "${photoText}". Opening heirloom photo digitiser...`);
    photoTrayRef.current?.scrollIntoView();
    setTimeout(() => {
      photoTrayRef.current?.triggerCamera();
    }, 350);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleAudioRecordingComplete = async (audioBlob: Blob, durationSeconds: number) => {
    setRecordedAudioBlob(audioBlob);
    setRecordedAudioDuration(durationSeconds);
    setIsReviewingTake(true);
    logEvent('FIRESIDE_AUDIO_RECORDING_COMPLETED', {
      durationSeconds,
      sceneId: effectiveSceneId,
    });
    const blobUrl = typeof window !== 'undefined' ? URL.createObjectURL(audioBlob) : '';
    const isSameBlob = lastSavedBlobRef.current === audioBlob && !!activeTakeIdRef.current;
    const takeId = isSameBlob ? activeTakeIdRef.current! : `take_${Date.now()}`;
    const takeNumber = isSameBlob
      ? activeTakeNumberRef.current
      : (activeSceneMemory?.takes?.length || 0) + 1;
    activeTakeIdRef.current = takeId;
    activeTakeNumberRef.current = takeNumber;
    lastSavedBlobRef.current = audioBlob;
    await saveSceneTake(effectiveSceneId, {
      id: takeId,
      takeNumber,
      source: 'fireside_mobile',
      mediaMode: 'audio',
      mediaUrl: blobUrl,
      durationSeconds,
      createdAt: new Date().toISOString(),
      label: `Take ${takeNumber} (Fireside Voice)`,
      isPreferred: true,
    }, { photos });
    setForceRecordMode(false);
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const photoCount = photos.length;
    const photoSuffix = photoCount > 0
      ? ` with ${photoCount} attached heirloom photo${photoCount === 1 ? '' : 's'}`
      : '';
    setNotification(`Memoir voice recording complete (${mins}m ${secs}s)${photoSuffix}. Synchronising to vault.`);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleVideoRecordingComplete = async (videoBlob: Blob, durationSeconds: number) => {
    setRecordedVideoBlob(videoBlob);
    setRecordedVideoDuration(durationSeconds);
    setIsReviewingTake(true);
    logEvent('FIRESIDE_VIDEO_RECORDING_COMPLETED', {
      durationSeconds,
      sceneId: effectiveSceneId,
    });
    const blobUrl = typeof window !== 'undefined' ? URL.createObjectURL(videoBlob) : '';
    const isSameBlob = lastSavedBlobRef.current === videoBlob && !!activeTakeIdRef.current;
    const takeId = isSameBlob ? activeTakeIdRef.current! : `take_${Date.now()}`;
    const takeNumber = isSameBlob
      ? activeTakeNumberRef.current
      : (activeSceneMemory?.takes?.length || 0) + 1;
    activeTakeIdRef.current = takeId;
    activeTakeNumberRef.current = takeNumber;
    lastSavedBlobRef.current = videoBlob;
    await saveSceneTake(effectiveSceneId, {
      id: takeId,
      takeNumber,
      source: 'fireside_mobile',
      mediaMode: 'video',
      mediaUrl: blobUrl,
      durationSeconds,
      createdAt: new Date().toISOString(),
      label: `Take ${takeNumber} (Fireside Video)`,
      isPreferred: true,
    }, { photos });
    setForceRecordMode(false);
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const photoCount = photos.length;
    const photoSuffix = photoCount > 0
      ? ` with ${photoCount} attached heirloom photo${photoCount === 1 ? '' : 's'}`
      : '';
    setNotification(`Video memo recorded (${mins}m ${secs}s)${photoSuffix}. Synchronising to vault.`);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Active Curriculum Part Context (MW-249)
  const activePartTitle = selectedSpark?.linkedSceneId
    ? getSceneById(selectedSpark.linkedSceneId)?.partTitle
    : undefined;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-stone-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. Top Sticky Navigation & Synchronisation Deck */}
      <div className="sticky top-0 z-30 w-full">
        {/* Discreet Elder Auth Header with Desktop Stage Ingress */}
        <FiresideAuthHeader activePartTitle={activePartTitle} />

        {/* 2. Reassuring Vault Synchronisation HUD Strip */}
        <div className="w-full bg-stone-950/85 border-b border-stone-800/60 py-2 px-3 sm:px-6 backdrop-blur-md">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-xs">
            <span className="text-stone-400 font-serif text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-medium text-stone-300">Fireside Studio</span>
            </span>

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
                  <span className="sm:hidden">Saved in vault ✓</span>
                </div>
              ) : isOffline ? (
                <div
                  className="flex items-center gap-1.5 text-xs text-stone-300 font-mono bg-stone-900 border border-stone-700/80 px-2.5 py-1 rounded-full"
                  title="Your story is safely stored on this phone and will synchronise when reconnected"
                >
                  <CloudOff className="w-3.5 h-3.5 text-stone-400" />
                  <span className="hidden sm:inline">Saved to phone (offline)</span>
                  <span className="sm:hidden">Offline Vault</span>
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
                  <span className="sm:hidden">Sync cloud ↺</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-stone-400">Vault Connected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Armchair Storytelling Surface */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-8">
        {/* Prominent Desktop Soundstage Recommendation Banner (visible on large screens >= 600px: Unfolded Fold, iPad, Desktop) */}
        {showDesktopBanner && (
          <div
            data-testid="desktop-soundstage-banner"
            className="w-full bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-amber-950/40 backdrop-blur-md relative animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 text-amber-300">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Large Display / Tablet Detected
                    </span>
                    <span className="text-xs text-stone-400">• Theatrical Experience Available</span>
                  </div>
                  <h2 className="text-sm sm:text-base font-serif font-medium text-white mt-1">
                    Recommend Flagship Desktop Theatrical Soundstage
                  </h2>
                  <p className="text-xs text-stone-300 mt-1 max-w-lg leading-relaxed">
                    You are viewing Fireside on a tablet, unfolded foldable, or desktop screen. For the full multi-act theatrical experience with teleprompter controls, live audio visualisation, and multi-track master reel editing, try the Desktop Stage (Acts I–IV).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
                <Link
                  href="/studio"
                  data-hotspot-id="HS_FIRESIDE_BANNER_LAUNCH_STAGE_BTN"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-stone-950 font-sans shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Launch Soundstage</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  onClick={handleDismissDesktopBanner}
                  data-hotspot-id="HS_FIRESIDE_BANNER_DISMISS_BTN"
                  className="p-2 text-stone-400 hover:text-stone-200 hover:bg-white/5 rounded-lg text-xs transition-colors cursor-pointer"
                  title="Dismiss and remain in mobile Fireside Studio"
                  aria-label="Dismiss recommendation"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Intro Subhead & Real-Time Vault Progress Indicator */}
        <div className="text-center max-w-md">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold mb-3 shadow-sm">
            <span>🌟 Vault Progress: {completedScenes} of {totalScenes} Stories Woven</span>
            <span className="text-stone-500">•</span>
            <span>{vaultProgressPercent}%</span>
          </div>
          <p className="text-xs uppercase tracking-widest text-amber-400/80 font-medium mb-1">
            Armchair Storytelling Surface
          </p>
          <h1 className="text-xl sm:text-2xl font-serif text-white font-normal">
            Choose a Memory Spark
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            One memory at a time. Select your mother tongue or swipe to browse.
          </p>
        </div>

        {/* Storytelling Media Mode Switcher (Voice & Photos vs Video Memo) */}
        <div className="w-full">
          <FiresideModeSwitch
            mode={mediaMode}
            onModeChange={handleModeChange}
            suggestedMode={activePromptSpark?.suggestedMediaMode}
          />
        </div>

        {/* The Prompt Carousel */}
        <div className="w-full">
          <SingleCardPromptCarousel
            prompts={FIRESIDE_PROMPT_SPARKS}
            initialPromptId={autoSparkId}
            activeLanguage={activeLanguage}
            mediaMode={mediaMode}
            onSelectPrompt={handleSelectPrompt}
            onActivePromptChange={handleActivePromptChange}
            onLanguageChange={handleLanguageChange}
            onPhotoPromptClick={handlePhotoPromptClick}
          />
        </div>

        {/* Active Recording Surface (Visible when uncompleted, reviewing a take, or recording an additional take) */}
        {!isCompleted && (
          mediaMode === 'video' ? (
            /* Video Memo Recording Surface */
            <div id="fireside-active-studio" className="w-full pt-4 border-t border-stone-900/80 flex flex-col items-center">
              <div className="text-center mb-4">
                <p className="text-xs uppercase tracking-widest text-amber-500/90 font-semibold mb-1">
                  WhatsApp / FaceTime Video Memo
                </p>
                <h2 className="text-lg sm:text-xl font-serif text-stone-200">
                  {selectedSpark ? `Record: ${selectedSpark.title}` : 'Record Your Video Memo'}
                </h2>
              </div>

              <FiresideVideoRecorder
                ref={videoRecorderRef}
                promptSpark={selectedSpark || activePromptSpark}
                activeLanguage={activeLanguage}
                activeMood={activeMood}
                takeNumber={activeTakeNumberRef.current || (activeSceneMemory?.takes?.length || 1)}
                onMoodChange={handleMoodChange}
                onRecordingComplete={handleVideoRecordingComplete}
                onKeepRecording={handleKeepRecording}
                onReset={handleResetVideoRecording}
                className="w-full"
              />
            </div>
          ) : (
            /* Voice Recording & Heirloom Photo Tray Surface */
            <>
              {/* Physical Album Photo Capture Tray (MW-247) */}
              <div className="w-full">
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
              <div id="fireside-active-studio" className="w-full pt-4 border-t border-stone-900/80 flex flex-col items-center">
                <div className="text-center mb-4">
                  <p className="text-xs uppercase tracking-widest text-amber-500/90 font-semibold mb-1">
                    Fireside Voice Recording
                  </p>
                  <h2 className="text-lg sm:text-xl font-serif text-stone-200">
                    {selectedSpark ? `Speak: ${selectedSpark.title}` : 'Speak Your Spoken Memoir'}
                  </h2>
                </div>

                <TactileVoiceRecorder
                  ref={recorderRef}
                  promptSpark={selectedSpark || activePromptSpark}
                  activeLanguage={activeLanguage}
                  activeMood={activeMood}
                  photos={photos.length > 0 ? photos : activeSceneMemory?.photos || []}
                  takeNumber={activeTakeNumberRef.current || (activeSceneMemory?.takes?.length || 1)}
                  onMoodChange={handleMoodChange}
                  onRecordingComplete={handleAudioRecordingComplete}
                  onKeepRecording={handleKeepRecording}
                  onReset={handleResetAudioRecording}
                  className="w-full"
                />
              </div>
            </>
          )
        )}

        {/* Celebratory Completed Reel Card (Always visible whenever scene has a recorded take) */}
        {hasCompletedReel && (
          <div
            id={isCompleted ? 'fireside-active-studio' : 'fireside-completed-reel-section'}
            className="w-full pt-4 border-t border-stone-900/80 flex flex-col items-center"
          >
            <FiresideCompletedReelCard
              sceneId={effectiveSceneId}
              sceneTitle={selectedSpark?.title || activePromptSpark?.title || activeSceneMemory?.sceneTitle || 'Story Scene'}
              sceneMemory={activeSceneMemory}
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
              onAddBonusNote={() => setIsBonusDrawerOpen(true)}
              onReRecordRequest={() => {
                setIsReviewingTake(false);
                setForceRecordMode(true);
              }}
            />
          </div>
        )}

        {/* Selected Spark / Recording Confirmation Toast */}
        {notification && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-stone-900/95 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">
                {notification}
              </p>
            </div>
            <a
              href={mediaMode === 'audio' ? '#album-photo-capture-tray' : '#fireside-active-studio'}
              data-testid="toast-studio-jump-link"
              onClick={(e) => {
                e.preventDefault();
                if (!hasCompletedReel) {
                  setForceRecordMode(true);
                }
                setNotification(null);
                setTimeout(() => {
                  if (hasCompletedReel && !forceRecordMode && !isReviewingTake) {
                    document.getElementById('fireside-completed-reel-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else if (mediaMode === 'video' && videoRecorderRef.current) {
                    videoRecorderRef.current.scrollIntoView();
                  } else if (mediaMode === 'audio' && photoTrayRef.current) {
                    photoTrayRef.current.scrollIntoView();
                  } else if (mediaMode === 'audio') {
                    document.getElementById('album-photo-capture-tray')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    document.getElementById('fireside-active-studio')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 40);
              }}
              className="shrink-0 text-xs font-bold text-amber-300 hover:text-amber-100 underline underline-offset-2 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 transition-all cursor-pointer"
            >
              Open Studio ↓
            </a>
          </div>
        )}
      </main>

      {/* 2.39:1 Cinema Master Reel Lightbox Player (Ticket #259) */}
      <FiresideCinemaLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onOpenBonusDrawer={() => setIsBonusDrawerOpen(true)}
        sceneTitle={selectedSpark?.title || activePromptSpark?.title || activeSceneMemory?.sceneTitle || 'Story Scene'}
        mediaUrl={
          preferredTake?.mediaUrl ||
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
        durationSeconds={preferredTake?.durationSeconds || recordedVideoDuration || recordedAudioDuration}
        moodTag={activeMood}
      />

      {/* Additive Bonus Memory Recollection Drawer (Ticket #259) */}
      <BonusMemoryDrawer
        isOpen={isBonusDrawerOpen}
        onClose={() => setIsBonusDrawerOpen(false)}
        sceneId={effectiveSceneId}
        sceneTitle={selectedSpark?.title || activePromptSpark?.title || activeSceneMemory?.sceneTitle || 'Story Scene'}
        onSaveBonusNote={async (note) => {
          await addBonusMemoryNote(effectiveSceneId, note);
          setNotification('Bonus recollection secured in vault!');
          setTimeout(() => setNotification(null), 3000);
        }}
      />

      {/* Subtle Footer */}
      <footer className="w-full py-4 border-t border-stone-900 text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
        <HeartHandshake className="w-3.5 h-3.5 text-stone-600" />
        <span>Designed for multi-generational storytelling & elder ergonomics</span>
      </footer>
    </div>
  );
}
