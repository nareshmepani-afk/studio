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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useFiresideSync } from '@/hooks/useFiresideSync';
import { FiresideAuthHeader } from '@/components/fireside/FiresideAuthHeader';
import { FiresideModeSwitch, FIRESIDE_MODE_STORAGE_KEY } from '@/components/fireside/FiresideModeSwitch';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { TactileVoiceRecorder, TactileVoiceRecorderRef } from '@/components/fireside/TactileVoiceRecorder';
import { FiresideVideoRecorder, FiresideVideoRecorderRef } from '@/components/fireside/FiresideVideoRecorder';
import { AlbumPhotoCaptureTray, AlbumPhotoCaptureTrayRef } from '@/components/fireside/AlbumPhotoCaptureTray';
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

  // Resolve URL parameters
  const initialLangParam = searchParams.get('lang') as FiresideLanguage | null;
  const initialPromptParam = searchParams.get('prompt') || undefined;

  const validLangs: FiresideLanguage[] = ['en', 'gu', 'pa', 'hi'];
  const resolvedLang: FiresideLanguage = initialLangParam && validLangs.includes(initialLangParam)
    ? initialLangParam
    : 'en';

  const [activeLanguage, setActiveLanguage] = useState<FiresideLanguage>(resolvedLang);
  const [mediaMode, setMediaMode] = useState<FiresideMediaMode>('audio');
  const [selectedSpark, setSelectedSpark] = useState<FiresidePromptSpark | null>(null);
  const [photos, setPhotos] = useState<HeirloomPhotoAttachment[]>([]);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState<number>(0);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoDuration, setRecordedVideoDuration] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [showDesktopBanner, setShowDesktopBanner] = useState<boolean>(false);

  const photoTrayRef = useRef<AlbumPhotoCaptureTrayRef>(null);
  const recorderRef = useRef<TactileVoiceRecorderRef>(null);
  const videoRecorderRef = useRef<FiresideVideoRecorderRef>(null);

  // Detect desktop display (>= 1024px and non-touch pointer) to recommend the flagship Desktop Soundstage.
  // Touch tablets (iPad, iPad Pro), foldable phones (Samsung Fold), and mobile phones remain cleanly as-is.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDesktop = () => {
      try {
        const isCoarseTouchOnly = window.matchMedia?.('(pointer: coarse) and (hover: none)')?.matches ?? false;
        const isDesktopScreen = window.innerWidth >= 1024 && !isCoarseTouchOnly;
        const isDismissed = sessionStorage.getItem('mw_dismiss_desktop_stage_banner') === 'true';
        setShowDesktopBanner(isDesktopScreen && !isDismissed);
      } catch {}
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

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
    promptSpark: selectedSpark,
    activeLanguage,
    audioBlob: recordedAudioBlob,
    audioDurationSeconds: recordedAudioDuration,
    videoBlob: recordedVideoBlob,
    videoDurationSeconds: recordedVideoDuration,
    mediaMode,
    sceneId: selectedSpark?.linkedSceneId,
    photos,
  });

  // Sync state if URL searchParams change
  useEffect(() => {
    if (initialLangParam && validLangs.includes(initialLangParam)) {
      setActiveLanguage(initialLangParam);
    }
  }, [initialLangParam]);

  const handleSelectPrompt = (spark: FiresidePromptSpark, _language: FiresideLanguage) => {
    setSelectedSpark(spark);

    if (mediaMode === 'video') {
      videoRecorderRef.current?.scrollIntoView();
      if (videoRecorderRef.current && videoRecorderRef.current.status !== 'recording') {
        setRecordedVideoBlob(null);
        setRecordedVideoDuration(0);
        videoRecorderRef.current.startRecording();
      }
    } else {
      // Smoothly autoscroll to the 88px voice recorder and action the SPEAK button directly
      recorderRef.current?.scrollIntoView();
      if (recorderRef.current && recorderRef.current.status !== 'recording') {
        setRecordedAudioBlob(null);
        setRecordedAudioDuration(0);
        recorderRef.current.startRecording();
      }
    }
  };

  const handleResetAudioRecording = useCallback(() => {
    setRecordedAudioBlob(null);
    setRecordedAudioDuration(0);
  }, []);

  const handleResetVideoRecording = useCallback(() => {
    setRecordedVideoBlob(null);
    setRecordedVideoDuration(0);
  }, []);

  const handleLanguageChange = (lang: FiresideLanguage) => {
    setActiveLanguage(lang);
  };

  const handlePhotoPromptClick = (photoText: string) => {
    setNotification(`Physical photo cue: "${photoText}". Opening heirloom photo digitiser...`);
    photoTrayRef.current?.scrollIntoView();
    setTimeout(() => {
      photoTrayRef.current?.triggerCamera();
    }, 350);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleAudioRecordingComplete = (audioBlob: Blob, durationSeconds: number) => {
    setRecordedAudioBlob(audioBlob);
    setRecordedAudioDuration(durationSeconds);
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    setNotification(`Memoir voice recording complete (${mins}m ${secs}s). Synchronising to vault.`);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleVideoRecordingComplete = (videoBlob: Blob, durationSeconds: number) => {
    setRecordedVideoBlob(videoBlob);
    setRecordedVideoDuration(durationSeconds);
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    setNotification(`Video memo recorded (${mins}m ${secs}s). Synchronising to vault.`);
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
      {/* 1. Discreet Elder Auth Header with Desktop Stage Ingress */}
      <FiresideAuthHeader activePartTitle={activePartTitle} />

      {/* 2. Reassuring Vault Synchronisation HUD Strip */}
      <div className="w-full bg-stone-950/70 border-b border-stone-800/60 py-2 px-4 sticky top-[49px] sm:top-[53px] z-20 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs">
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

      {/* 3. Primary Armchair Storytelling Surface */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-8">
        {/* Prominent Desktop Soundstage Recommendation Banner (visible on desktop viewports >= 1024px) */}
        {showDesktopBanner && (
          <div
            data-testid="desktop-soundstage-banner"
            className="hidden lg:block w-full bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-amber-950/40 backdrop-blur-md relative animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 text-amber-300">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Desktop Display Detected
                    </span>
                    <span className="text-xs text-stone-400">• Large Screen Experience</span>
                  </div>
                  <h2 className="text-sm sm:text-base font-serif font-medium text-white mt-1">
                    Recommend Flagship Desktop Theatrical Soundstage
                  </h2>
                  <p className="text-xs text-stone-300 mt-1 max-w-lg leading-relaxed">
                    You are accessing Fireside from a desktop browser. For the full multi-act theatrical experience with teleprompter controls, live audio visualisation, and multi-track master reel editing, try the Desktop Stage (Acts I–IV).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
                <Link
                  href="/studio"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-stone-950 font-sans shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Launch Soundstage</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  onClick={handleDismissDesktopBanner}
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

        {/* Intro Subhead */}
        <div className="text-center max-w-md">
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
            onModeChange={setMediaMode}
            suggestedMode={selectedSpark?.suggestedMediaMode}
          />
        </div>

        {/* The Prompt Carousel */}
        <div className="w-full">
          <SingleCardPromptCarousel
            prompts={FIRESIDE_PROMPT_SPARKS}
            initialPromptId={initialPromptParam}
            activeLanguage={activeLanguage}
            mediaMode={mediaMode}
            onSelectPrompt={handleSelectPrompt}
            onLanguageChange={handleLanguageChange}
            onPhotoPromptClick={handlePhotoPromptClick}
          />
        </div>

        {/* Conditional Media Surface */}
        {mediaMode === 'video' ? (
          /* Video Memo Recording Surface */
          <div className="w-full pt-4 border-t border-stone-900/80 flex flex-col items-center">
            <div className="text-center mb-4">
              <p className="text-xs uppercase tracking-widest text-amber-500/90 font-semibold mb-1">
                FaceTime Video Memo
              </p>
              <h2 className="text-lg sm:text-xl font-serif text-stone-200">
                {selectedSpark ? `Record: ${selectedSpark.title}` : 'Record Your Video Memo'}
              </h2>
            </div>

            <FiresideVideoRecorder
              ref={videoRecorderRef}
              promptSpark={selectedSpark}
              activeLanguage={activeLanguage}
              onRecordingComplete={handleVideoRecordingComplete}
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
            <div className="w-full pt-4 border-t border-stone-900/80 flex flex-col items-center">
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
                promptSpark={selectedSpark}
                activeLanguage={activeLanguage}
                onRecordingComplete={handleAudioRecordingComplete}
                onReset={handleResetAudioRecording}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Selected Spark / Recording Confirmation Toast */}
        {notification && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-stone-900/95 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">
              {notification}
            </p>
          </div>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="w-full py-4 border-t border-stone-900 text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
        <HeartHandshake className="w-3.5 h-3.5 text-stone-600" />
        <span>Designed for multi-generational storytelling & elder ergonomics</span>
      </footer>
    </div>
  );
}
