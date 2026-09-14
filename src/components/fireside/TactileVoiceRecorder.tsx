'use client';

/**
 * 🎙️ Fireside Voice Studio — Tactile Web Audio Voice Recorder & VU Visualiser
 *
 * Armchair-first tactile recording engine designed for elderly storytellers.
 * Features an oversized 88px central record boundary, real-time amber VU meter,
 * DynamicsCompressorNode speech levelling, Screen Wake Lock API guard,
 * navigator.vibrate haptic feedback, and an intuitive permission recovery slate.
 *
 * Milestone: MW-87 (Ticket #250 / MW-246)
 * Target Route: /studio/fireside
 * Constitutional Governance: C:\\Users\\home\\studio\\.agents\\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English, Rule 26 Elder Ergonomics, Rule 8 Mobile Viewport)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Check,
  Volume2,
  AlertCircle,
  ShieldCheck,
  Lock,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  FiresidePromptSpark,
  FiresideLanguage,
  FIRESIDE_TOUCH_TARGETS,
} from '@/types/fireside';
import {
  useFiresideAudioRecorder,
  formatDurationMMSS,
} from '@/hooks/useFiresideAudioRecorder';

export interface TactileVoiceRecorderProps {
  promptSpark?: FiresidePromptSpark | null;
  activeLanguage?: FiresideLanguage;
  onRecordingComplete?: (audioBlob: Blob, durationSeconds: number) => void;
  onReset?: () => void;
  className?: string;
}

export function TactileVoiceRecorder({
  promptSpark,
  activeLanguage = 'en',
  onRecordingComplete,
  onReset,
  className = '',
}: TactileVoiceRecorderProps) {
  const {
    status,
    permissionState,
    durationSeconds,
    formattedDuration,
    audioBlob,
    audioUrl,
    volume,
    waveform,
    isWakeLockActive,
    errorMessage,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    retryPermission,
  } = useFiresideAudioRecorder({
    onRecordingComplete,
    onReset,
  });

  // ---------------------------------------------------------------------------
  // Audio Playback Preview State (When status === 'saved')
  // ---------------------------------------------------------------------------
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);

  const togglePlayPreview = useCallback(() => {
    if (!audioPlayerRef.current) return;
    if (isPlayingPreview) {
      audioPlayerRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPlayerRef.current.play().catch((err) => {
        console.warn('Audio preview playback error:', err);
      });
      setIsPlayingPreview(true);
    }
  }, [isPlayingPreview]);

  const handleTimeUpdate = () => {
    if (audioPlayerRef.current) {
      const cur = audioPlayerRef.current.currentTime;
      if (typeof cur === 'number' && Number.isFinite(cur)) {
        setPreviewCurrentTime(cur);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioPlayerRef.current) {
      const dur = audioPlayerRef.current.duration;
      if (typeof dur === 'number' && Number.isFinite(dur) && dur > 0) {
        setPreviewDuration(dur);
      } else {
        setPreviewDuration(durationSeconds);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingPreview(false);
    setPreviewCurrentTime(0);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (audioPlayerRef.current && Number.isFinite(targetTime)) {
      audioPlayerRef.current.currentTime = targetTime;
      setPreviewCurrentTime(targetTime);
    }
  };

  // Sync duration on saved transition to guarantee accurate finite duration
  useEffect(() => {
    if (status === 'saved') {
      setIsPlayingPreview(false);
      setPreviewCurrentTime(0);
      if (durationSeconds > 0) {
        setPreviewDuration(durationSeconds);
      }
    }
  }, [status, durationSeconds]);

  // Safe effective total duration that can never be Infinity or NaN
  const effectiveTotalDuration =
    typeof previewDuration === 'number' && Number.isFinite(previewDuration) && previewDuration > 0
      ? previewDuration
      : (durationSeconds > 0 ? durationSeconds : 0);

  // Resolve Prompt Text in Selected Language
  const sparkText = promptSpark
    ? promptSpark.sparks[activeLanguage] || promptSpark.sparks.en
    : null;
  const sparkTitle = promptSpark ? promptSpark.title : null;

  // Calculate dynamic pulse scale for the central VU ring based on volume (0-100)
  const dynamicRingScale = 1 + (volume / 100) * 0.4;

  return (
    <div
      className={`w-full max-w-xl mx-auto rounded-3xl bg-[#171717] border border-stone-800 shadow-2xl p-5 sm:p-7 flex flex-col items-center select-none ${className}`}
      style={{ minHeight: '340px' }}
    >
      {/* Hidden Audio Player for Preview */}
      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}

      {/* 1. Contextual Prompt Spark Pill (If Selected) */}
      {promptSpark && (
        <div className="w-full mb-5 bg-stone-900/90 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-0.5">
              Active Story Prompt: {sparkTitle}
            </p>
            <p className="text-sm text-stone-200 line-clamp-2 leading-relaxed">
              {sparkText}
            </p>
          </div>
        </div>
      )}

      {/* 2. Permission Denial Recovery Slate */}
      {permissionState === 'denied' && (
        <div className="w-full bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5 text-center flex flex-col items-center gap-3 my-auto">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-1">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold text-amber-300">
            Microphone Access Blocked
          </h3>
          <p className="text-sm text-stone-300 leading-relaxed max-w-md">
            Your device browser has blocked microphone permissions. To record your spoken memoir, please allow microphone access:
          </p>
          <div className="w-full bg-stone-900/80 rounded-xl p-3 text-left text-xs text-stone-300 space-y-2 border border-stone-800">
            <p className="flex items-center gap-1.5 font-medium text-amber-400">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Instructions for Mobile Devices:</span>
            </p>
            <p>• <strong>iPhone / iPad (Safari):</strong> Tap the <code>aA</code> icon in the address bar ➔ Website Settings ➔ Set Microphone to <strong>Allow</strong>.</p>
            <p>• <strong>Android (Chrome):</strong> Tap the Lock icon beside the web address ➔ Permissions ➔ Turn Microphone <strong>On</strong>.</p>
          </div>
          <button
            type="button"
            onClick={retryPermission}
            className="w-full max-w-xs mt-2 min-h-[56px] px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-102 active:scale-98"
            aria-label="Retry microphone permissions"
          >
            <RefreshCw className="w-5 h-5" />
            <span>I've Enabled It — Try Again</span>
          </button>
        </div>
      )}

      {/* 3. Normal Recording Flow (When Permissions Not Blocked) */}
      {permissionState !== 'denied' && (
        <>
          {/* Top Status & Elapsed Timer Bar */}
          <div className="w-full flex items-center justify-between px-2 mb-4">
            <div className="flex items-center gap-2">
              {status === 'recording' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>Recording Live</span>
                </div>
              )}
              {status === 'paused' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold tracking-wide">
                  <Pause className="w-3 h-3 text-amber-400" />
                  <span>Recording Paused</span>
                </div>
              )}
              {status === 'saved' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wide">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Memoir Saved</span>
                </div>
              )}
              {status === 'idle' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 text-xs font-medium">
                  <Volume2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>Ready to Speak</span>
                </div>
              )}
            </div>

            {/* Large High-Contrast Timer (Min 18px / Rule 26) */}
            <div
              className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-amber-300"
              aria-label={`Recording duration: ${formattedDuration}`}
            >
              {status === 'saved'
                ? formatDurationMMSS(previewCurrentTime > 0 ? previewCurrentTime : effectiveTotalDuration)
                : formattedDuration}
            </div>
          </div>

          {/* Real-time Amber VU Waveform Visualiser (Rule 20 / Rule 26) */}
          <div className="w-full h-20 bg-stone-950/70 border border-stone-800/80 rounded-2xl flex items-center justify-center gap-1 px-3 py-2 my-2 overflow-hidden">
            {status === 'recording' || status === 'paused' ? (
              waveform.map((barValue, idx) => {
                const heightPct = Math.max(8, Math.min(100, Math.round(barValue * 100)));
                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-full transition-all duration-75"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: status === 'paused' ? '#78716C' : '#F59E0B',
                      opacity: status === 'paused' ? 0.5 : 0.4 + (heightPct / 100) * 0.6,
                    }}
                  />
                );
              })
            ) : status === 'saved' ? (
              /* Saved Preview Slider / Progress */
              <div className="w-full flex flex-col justify-center px-2 gap-1.5">
                <div className="flex justify-between text-xs text-stone-400 font-mono">
                  <span>Preview: {formatDurationMMSS(previewCurrentTime)}</span>
                  <span>Total: {formatDurationMMSS(effectiveTotalDuration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={effectiveTotalDuration > 0 ? effectiveTotalDuration : 1}
                  step="0.1"
                  value={previewCurrentTime}
                  onChange={handleScrub}
                  className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  aria-label="Audio playback scrubber"
                />
              </div>
            ) : (
              /* Idle State Waveform Placeholder */
              <div className="flex items-center gap-2 text-stone-500 text-xs">
                <Sparkles className="w-4 h-4 text-amber-500/50" />
                <span>Tap the amber record button below to begin speaking</span>
              </div>
            )}
          </div>

          {/* Screen Wake Lock Protective Pill */}
          <div className="h-6 my-1 flex items-center justify-center">
            {isWakeLockActive && (
              <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-400/80 font-medium">
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Screen Wake Lock Active (Screen stays on while speaking)</span>
              </div>
            )}
          </div>

          {/* Error Message Toast If Applicable */}
          {errorMessage && (
            <p className="text-xs text-red-400 text-center my-1">
              {errorMessage}
            </p>
          )}

          {/* 4. Elder Tactile Controls Area (Rule 26: 88px Record / 56px Secondary) */}
          <div className="w-full mt-4 flex items-center justify-around gap-2">
            {/* Left Secondary Action: Discard / Reset */}
            <div className="w-20 flex flex-col items-center justify-center">
              {(status === 'recording' || status === 'paused' || status === 'saved') && (
                <>
                  <button
                    type="button"
                    onClick={resetRecording}
                    className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-red-400 flex items-center justify-center transition-all active:scale-95 shadow-md"
                    title="Discard recording and start over"
                    aria-label="Discard recording and start over"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                  <span className="text-[11px] font-semibold text-stone-400 mt-1.5 uppercase tracking-wider">
                    Discard
                  </span>
                </>
              )}
            </div>

            {/* Central Master Button: Oversized 88px Touch Envelope (Rule 26) */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Dynamic Amber VU Halo / Pulse Ring */}
              {status === 'recording' && (
                <div
                  className="absolute inset-0 rounded-full bg-amber-500/20 pointer-events-none transition-transform duration-75"
                  style={{
                    transform: `scale(${dynamicRingScale})`,
                  }}
                />
              )}

              {status === 'idle' && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-[88px] h-[88px] min-w-[88px] min-h-[88px] rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-stone-950 font-bold flex flex-col items-center justify-center gap-1 shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95"
                  aria-label="Start recording spoken memory"
                >
                  <Mic className="w-8 h-8 text-stone-950" />
                  <span className="text-[11px] uppercase tracking-wider font-extrabold">Speak</span>
                </button>
              )}

              {status === 'recording' && (
                <button
                  type="button"
                  onClick={() => stopRecording()}
                  className="w-[88px] h-[88px] min-w-[88px] min-h-[88px] rounded-full bg-red-600 hover:bg-red-500 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-pulse transition-all hover:scale-105 active:scale-95"
                  aria-label="Stop and complete recording"
                >
                  <Square className="w-7 h-7 text-white fill-white" />
                  <span className="text-[11px] uppercase tracking-wider font-extrabold">Finish</span>
                </button>
              )}

              {status === 'paused' && (
                <button
                  type="button"
                  onClick={() => stopRecording()}
                  className="w-[88px] h-[88px] min-w-[88px] min-h-[88px] rounded-full bg-red-600 hover:bg-red-500 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-[0_0_35px_rgba(239,68,68,0.4)] transition-all hover:scale-105 active:scale-95"
                  aria-label="Stop and complete recording"
                >
                  <Square className="w-7 h-7 text-white fill-white" />
                  <span className="text-[11px] uppercase tracking-wider font-extrabold">Finish</span>
                </button>
              )}

              {status === 'saved' && (
                <button
                  type="button"
                  onClick={togglePlayPreview}
                  className="w-[88px] h-[88px] min-w-[88px] min-h-[88px] rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 hover:from-emerald-500 hover:to-teal-300 text-stone-950 font-bold flex flex-col items-center justify-center gap-1 shadow-[0_0_35px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95"
                  aria-label={isPlayingPreview ? 'Pause audio preview' : 'Play audio preview'}
                >
                  {isPlayingPreview ? (
                    <Pause className="w-8 h-8 text-stone-950 fill-stone-950" />
                  ) : (
                    <Play className="w-8 h-8 text-stone-950 fill-stone-950 ml-1" />
                  )}
                  <span className="text-[11px] uppercase tracking-wider font-extrabold">
                    {isPlayingPreview ? 'Pause' : 'Listen'}
                  </span>
                </button>
              )}
            </div>

            {/* Right Secondary Action: Pause / Resume */}
            <div className="w-20 flex flex-col items-center justify-center">
              {status === 'recording' && (
                <>
                  <button
                    type="button"
                    onClick={pauseRecording}
                    className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 flex items-center justify-center transition-all active:scale-95 shadow-md"
                    title="Pause voice recording"
                    aria-label="Pause voice recording"
                  >
                    <Pause className="w-6 h-6" />
                  </button>
                  <span className="text-[11px] font-semibold text-stone-400 mt-1.5 uppercase tracking-wider">
                    Pause
                  </span>
                </>
              )}
              {status === 'paused' && (
                <>
                  <button
                    type="button"
                    onClick={resumeRecording}
                    className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-amber-500/40 ring-2 ring-amber-400"
                    title="Resume voice recording"
                    aria-label="Resume voice recording"
                  >
                    <Play className="w-6 h-6 ml-0.5 fill-stone-950" />
                  </button>
                  <span className="text-[11px] font-bold text-amber-400 mt-1.5 uppercase tracking-wider">
                    Resume
                  </span>
                </>
              )}
              {status === 'saved' && (
                <>
                  <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 mt-1.5 uppercase tracking-wider">
                    Saved
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Saved State Elder Action Bar (Explicit Discard & Retake / Keep Memoir) */}
          {status === 'saved' && (
            <div className="w-full mt-6 pt-5 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetRecording}
                className="w-full sm:w-auto flex-1 max-w-xs min-h-[56px] px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 hover:text-red-400 font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-md"
                aria-label="Discard recording and start over"
              >
                <RotateCcw className="w-5 h-5 text-stone-400" />
                <span>Discard & Retake</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (audioBlob && onRecordingComplete) {
                    onRecordingComplete(audioBlob, effectiveTotalDuration);
                  }
                }}
                className="w-full sm:w-auto flex-1 max-w-xs min-h-[56px] px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/40 transition-all active:scale-98"
                aria-label="Keep this recording and proceed"
              >
                <Check className="w-5 h-5 text-white" />
                <span>Keep This Memoir ✓</span>
              </button>
            </div>
          )}

          {/* Helper Subtext */}
          <p className="text-xs text-stone-400 text-center mt-4">
            {status === 'idle' && 'Tap the amber Speak button whenever you are ready.'}
            {status === 'recording' && 'Speak at your natural pace. Tap Finish when complete.'}
            {status === 'paused' && 'Take your time. Tap the amber button to resume speaking.'}
            {status === 'saved' && 'Your spoken memoir is ready. Listen above or record again.'}
          </p>
        </>
      )}
    </div>
  );
}
