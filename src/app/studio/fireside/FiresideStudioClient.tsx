'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useFiresideSync } from '@/hooks/useFiresideSync';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { TactileVoiceRecorder, TactileVoiceRecorderRef } from '@/components/fireside/TactileVoiceRecorder';
import { AlbumPhotoCaptureTray, AlbumPhotoCaptureTrayRef } from '@/components/fireside/AlbumPhotoCaptureTray';
import { FiresideLanguage, FiresidePromptSpark, HeirloomPhotoAttachment } from '@/types/fireside';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';
import {
  Sparkles,
  ArrowLeft,
  HeartHandshake,
  CheckCircle2,
  Loader2,
  CloudOff,
  AlertCircle,
} from 'lucide-react';

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
  const [selectedSpark, setSelectedSpark] = useState<FiresidePromptSpark | null>(null);
  const [photos, setPhotos] = useState<HeirloomPhotoAttachment[]>([]);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  const photoTrayRef = useRef<AlbumPhotoCaptureTrayRef>(null);
  const recorderRef = useRef<TactileVoiceRecorderRef>(null);

  // Background Offline-First Synchronization Hook (MW-247)
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
    // Smoothly autoscroll to the 88px voice recorder and action the SPEAK button directly
    recorderRef.current?.scrollIntoView();
    if (recorderRef.current && recorderRef.current.status !== 'recording') {
      setRecordedAudioBlob(null);
      setRecordedAudioDuration(0);
      recorderRef.current.startRecording();
    }
  };

  const handleResetRecording = useCallback(() => {
    setRecordedAudioBlob(null);
    setRecordedAudioDuration(0);
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

  const handleRecordingComplete = (audioBlob: Blob, durationSeconds: number) => {
    setRecordedAudioBlob(audioBlob);
    setRecordedAudioDuration(durationSeconds);
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    setNotification(`Memoir recorded (${mins}m ${secs}s). Tap Listen to preview.`);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-stone-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Ambient Navigation Header */}
      <header className="w-full border-b border-stone-800/80 bg-stone-950/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-stone-400 hover:text-amber-300 transition-colors py-1.5 px-2 rounded-lg hover:bg-stone-900 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
            <span className="text-xs sm:text-sm font-serif font-semibold tracking-wide text-amber-300 truncate">
              Fireside Voice Studio
            </span>
          </div>

          {/* Reassuring Vault Synchronisation HUD Pill */}
          <div className="flex items-center shrink-0">
            {isSaving ? (
              <div
                className="flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-950/40 border border-amber-500/40 px-2.5 py-1 rounded-full animate-pulse"
                title="Saving spoken tale and photographs to cloud vault"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span className="hidden sm:inline">Saving to vault...</span>
                <span>{progressPercent}%</span>
              </div>
            ) : isSynced ? (
              <div
                className="flex items-center gap-1.5 text-xs text-emerald-300 font-mono bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-1 rounded-full"
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
                <span className="sm:hidden">Offline Vault</span>
              </div>
            ) : syncState === 'error' ? (
              <button
                type="button"
                onClick={() => triggerManualSync()}
                className="flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-950/60 border border-amber-500/60 px-2.5 py-1 rounded-full hover:bg-amber-900/80 transition-colors"
                title="Tap to retry cloud synchronisation"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Saved to phone • Retry sync ↺</span>
                <span className="sm:hidden">Retry ↺</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="hidden sm:inline text-stone-500">Living Memoir</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Primary Armchair Storytelling Surface */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-8">
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

        {/* The Carousel */}
        <div className="w-full">
          <SingleCardPromptCarousel
            prompts={FIRESIDE_PROMPT_SPARKS}
            initialPromptId={initialPromptParam}
            activeLanguage={activeLanguage}
            onSelectPrompt={handleSelectPrompt}
            onLanguageChange={handleLanguageChange}
            onPhotoPromptClick={handlePhotoPromptClick}
          />
        </div>

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
            onRecordingComplete={handleRecordingComplete}
            onReset={handleResetRecording}
            className="w-full"
          />
        </div>

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
