'use client';

/**
 * 🎥 Fireside Video Studio — Front-Facing FaceTime/WhatsApp Video Memo Engine
 *
 * Designed for intimate, front-camera elder storytelling memoirs.
 * Features:
 * - Mirrored front-camera viewfinder with warm amber/red recording borders
 * - Translucent story prompt banner pinned near the top camera lens for natural eye contact
 * - Oversized 88px tactile recording trigger (Rule 26 Elder Ergonomics)
 * - 720p 24fps clamped 2.0 Mbps bitrate with 5000ms timeslices for mobile resiliency
 * - Screen Wake Lock API guard to prevent screen timeout while speaking
 * - Video playback review player with Discard/Retake & Keep confirmation CTAs
 *
 * Milestone: MW-87 (Ticket #249 / MW-248)
 * Target Route: /studio/fireside
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English, Rule 26 Elder Ergonomics, Rule 8 Mobile Viewport)
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Video,
  Square,
  Pause,
  Play,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Eye,
  ShieldCheck,
  Ban,
} from 'lucide-react';
import {
  FiresidePromptSpark,
  FiresideLanguage,
  FIRESIDE_TOUCH_TARGETS,
  RecordingLifecycleStatus,
} from '@/types/fireside';
import { StoryMoodTag } from '@/types/curriculum';
import { FiresideMoodChips } from '@/components/fireside/FiresideMoodChips';
import { useFiresideVideoRecorder } from '@/hooks/useFiresideVideoRecorder';
import { useHardwarePrivacy } from '@/context/HardwarePrivacyContext';

export interface FiresideVideoRecorderRef {
  enableCameraPreview: () => Promise<boolean>;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
  releaseHardwareStream: () => void;
  scrollIntoView: () => void;
  status: RecordingLifecycleStatus;
  stream: MediaStream | null;
}

export interface FiresideVideoRecorderProps {
  promptSpark?: FiresidePromptSpark | null;
  activeLanguage?: FiresideLanguage;
  activeMood?: StoryMoodTag;
  activeActStage?: 1 | 2 | 3 | 4;
  takeNumber?: number;
  hasExternalScriptBanner?: boolean;
  isMasterProtected?: boolean;
  onMoodChange?: (mood: StoryMoodTag) => void;
  onRecordingComplete?: (videoBlob: Blob, durationSeconds: number) => void;
  onKeepRecording?: (videoBlob: Blob, durationSeconds: number) => void;
  onReset?: () => void;
  onRecordingChange?: (isRecording: boolean) => void;
  className?: string;
}

export const FiresideVideoRecorder = forwardRef<FiresideVideoRecorderRef, FiresideVideoRecorderProps>(
  function FiresideVideoRecorder(
    {
      promptSpark,
      activeLanguage = 'en',
      activeMood,
      activeActStage,
      takeNumber = 1,
      hasExternalScriptBanner = false,
      isMasterProtected = false,
      onMoodChange,
      onRecordingComplete,
      onKeepRecording,
      onReset,
      onRecordingChange,
      className = '',
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const nativeVideoInputRef = useRef<HTMLInputElement>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [masterChallengeArmed, setMasterChallengeArmed] = useState(false);
    const [showMasterChallengePrompt, setShowMasterChallengePrompt] = useState(false);
    const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const {
      status: hardwarePrivacyStatus,
      killAllHardwareFeeds,
      rearmHardware,
    } = useHardwarePrivacy();

    const {
      status,
      cameraPermissionState,
      durationSeconds,
      formattedDuration,
      videoBlob,
      videoUrl,
      stream,
      isWakeLockActive,
      errorMessage,
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      resetRecording,
      retryPermission,
      enableCameraPreview,
      importVideoFile,
      releaseHardwareStream,
    } = useFiresideVideoRecorder({
      onRecordingComplete,
      onReset,
    });

    const cancelCountdown = useCallback(() => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setCountdown(null);
    }, []);

    useEffect(() => {
      return () => {
        cancelCountdown();
      };
    }, [cancelCountdown]);

    // MW-88-T9: Auto-release camera & microphone tracks when switching away from Act III (Soundstage)
    useEffect(() => {
      if (
        activeActStage !== undefined &&
        activeActStage !== 3 &&
        status !== 'recording' &&
        status !== 'paused'
      ) {
        cancelCountdown();
        if (stream) {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
        }
        releaseHardwareStream();
      }
    }, [activeActStage, status, stream, releaseHardwareStream, cancelCountdown]);

    useEffect(() => {
      setMasterChallengeArmed(false);
      setShowMasterChallengePrompt(false);
    }, [promptSpark?.id, isMasterProtected]);

    // UI-only 3-2-1 breath countdown on the 88px Record button (keeps ref.current.startRecording instant for tests)
    const handleRecordTriggerClick = useCallback(async () => {
      if (status === 'recording' || status === 'paused') {
        cancelCountdown();
        await stopRecording();
        return;
      }

      if (isMasterProtected && !masterChallengeArmed) {
        setShowMasterChallengePrompt(true);
        return;
      }

      if (countdown !== null) {
        cancelCountdown();
        return;
      }

      // Warm preview stream BEFORE countdown starts so OS permission never interrupts tick 1
      if (!stream) {
        const previewOk = await enableCameraPreview();
        if (!previewOk) return;
      }

      let remaining = 3;
      setCountdown(remaining);
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          cancelCountdown();
          void startRecording();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    }, [status, isMasterProtected, masterChallengeArmed, countdown, stream, enableCameraPreview, startRecording, stopRecording, cancelCountdown]);

    // Expose imperative API for parent container auto-scrolling and direct preview/recording trigger
    useImperativeHandle(
      ref,
      () => ({
        enableCameraPreview,
        startRecording,
        stopRecording,
        resetRecording,
        releaseHardwareStream,
        scrollIntoView: () => {
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        status,
        stream,
      }),
      [enableCameraPreview, startRecording, stopRecording, resetRecording, releaseHardwareStream, status, stream]
    );

    // Attach live stream to video element when recording or previewing
    useEffect(() => {
      if (liveVideoRef.current && stream) {
        liveVideoRef.current.srcObject = stream;
      }
    }, [stream]);

    // Active prompt text resolution
    const promptTitle = promptSpark ? promptSpark.title : 'Fireside Video Memoir';
    const promptText = promptSpark
      ? promptSpark.sparks[activeLanguage] || promptSpark.sparks.en
      : 'Look into the camera and share what comes to heart.';

    
    useEffect(() => {
      onRecordingChange?.(status === 'recording' || status === 'paused');
    }, [status, onRecordingChange]);

    const isRecording = status === 'recording';
    const isPaused = status === 'paused';
    const isProcessing = status === 'processing';
    const isSaved = status === 'saved';
    const isError = status === 'error' || cameraPermissionState === 'denied';

    const handleNativeVideoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        importVideoFile(file);
      }
      e.target.value = '';
    };

    return (
      <div
        ref={containerRef}
        data-recording={isRecording || isPaused ? 'true' : 'false'}
        className={`w-full max-w-xl mx-auto flex flex-col items-center select-none ${className}`}
        role="region"
        aria-label="Fireside Video Memo Studio"
      >
        {/* Hidden 1-Tap Mobile Camera Capture Input (Bypasses Browser Site Permission Locks) */}
        <input
          ref={nativeVideoInputRef}
          type="file"
          accept="video/*"
          capture="user"
          onChange={handleNativeVideoCapture}
          className="hidden"
          aria-label="Capture video directly with phone camera"
        />

        {/* Main Card Surface */}
        <div className="w-full bg-[#141414] border border-stone-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md flex flex-col items-center relative overflow-hidden">
          {/* Ambient Background Warmth */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* ================================================================= */}
          {/* State 1: Permission Recovery Slate                                */}
          {/* ================================================================= */}
          {isError ? (
            <div className="w-full py-8 px-4 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-stone-100">
                  Camera Access Required
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 mt-1.5 max-w-md leading-relaxed">
                  {errorMessage ||
                    'Tap a button below to enable your camera and microphone, or record directly with your phone camera in one tap.'}
                </p>
              </div>
              <div className="w-full max-w-xs flex flex-col gap-2.5">
                <button
                  type="button"
                  data-hotspot-id="HS_FIRESIDE_CAMERA_RETRY_BTN"
                  onClick={retryPermission}
                  style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
                  className="w-full px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-98"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Tap to Enable Camera & Mic</span>
                </button>
                <button
                  type="button"
                  data-testid="native-phone-video-capture-btn"
                  onClick={() => nativeVideoInputRef.current?.click()}
                  style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
                  className="w-full px-6 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-98"
                >
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Use Phone Camera Directly (1-Tap)</span>
                </button>
              </div>
            </div>
          ) : isSaved && videoUrl ? (
            /* ================================================================= */
            /* State 2: Video Playback Review & Keep / Retake Slate              */
            /* ================================================================= */
            <div className="w-full flex flex-col items-center space-y-4 animate-in fade-in duration-300">
              <div className="w-full relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-black aspect-[4/3] sm:aspect-video shadow-lg">
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget;
                    if (!Number.isFinite(vid.duration) || vid.duration === Infinity) {
                      vid.currentTime = 1e101;
                      const resolveWebmDuration = () => {
                        vid.removeEventListener('timeupdate', resolveWebmDuration);
                        vid.currentTime = 0;
                      };
                      vid.addEventListener('timeupdate', resolveWebmDuration);
                    }
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Video Memo Recorded ({formattedDuration})</span>
                </div>
              </div>

              {/* Recorded Reel Details Summary Bar (Title, Duration, Timestamp, Take #) */}
              <div
                data-testid="video-review-metadata-bar"
                className="w-full rounded-2xl bg-stone-900/90 border border-stone-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-stone-300"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                    Take #{takeNumber}
                  </span>
                  <span className="font-serif text-sm text-white truncate">{promptTitle}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-400">
                  <span>
                    Duration: <strong className="text-emerald-300">{formattedDuration}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {new Date().toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Review Guidance & Actions */}
              <div className="w-full flex flex-col gap-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <button
                    type="button"
                    data-hotspot-id="HS_FIRESIDE_VIDEO_DISCARD_RETAKE_BTN"
                    onClick={resetRecording}
                    style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
                    className="w-full px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 font-medium text-sm sm:text-base border border-stone-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    aria-label="Discard video memo and record again"
                  >
                    <RotateCcw className="w-4 h-4 text-stone-400" />
                    <span>Discard & Retake</span>
                  </button>

                  <button
                    type="button"
                    data-hotspot-id="HS_FIRESIDE_VIDEO_KEEP_BTN"
                    onClick={() => {
                      if (videoBlob) {
                        if (onKeepRecording) {
                          onKeepRecording(videoBlob, durationSeconds);
                        } else {
                          onRecordingComplete?.(videoBlob, durationSeconds);
                        }
                      }
                    }}
                    style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
                    className="w-full px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-stone-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    aria-label={
                      isMasterProtected
                        ? 'Save as alternate take keeping Master Reel untouched'
                        : 'Keep this video memo'
                    }
                  >
                    <Check className="w-5 h-5 text-stone-950 shrink-0" />
                    <span>
                      {isMasterProtected
                        ? 'Save as Alternate Take (Master Untouched)'
                        : 'Keep This Video Memo'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* State 3: Live Camera Viewfinder & Recording Controls              */
            /* ================================================================= */
            <div className="w-full flex flex-col items-center space-y-5">
              {/* Viewfinder Enclosure */}
              <div
                className={`w-full relative rounded-3xl overflow-hidden bg-black aspect-[4/3] sm:aspect-video flex items-center justify-center transition-all duration-300 ${
                  isRecording
                    ? 'border-2 border-red-500 shadow-xl shadow-red-500/20'
                    : isPaused
                    ? 'border-2 border-amber-500/70 shadow-lg shadow-amber-500/10'
                    : 'border border-amber-500/30'
                }`}
              >
                {/* Live Video Preview Stream (Mirrored for Natural Selfie Feedback) */}
                {stream ? (
                  <>
                    <video
                      ref={liveVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ transform: 'scaleX(-1)' }}
                      className="w-full h-full object-cover"
                    />
                    {/* Top-Right Sever Feed Badge (separated cleanly from top-left REC & bottom-right Wake Lock) */}
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        type="button"
                        data-testid="HS_FIRESIDE_VIEWFINDER_SEVER_BTN"
                        onClick={() => {
                          cancelCountdown();
                          killAllHardwareFeeds();
                        }}
                        className="min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3 py-1 rounded-xl bg-amber-950/85 hover:bg-rose-950/90 border border-amber-500/50 text-amber-300 hover:text-rose-200 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
                        title="Immediately sever camera and microphone hardware feeds"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                        <span className="hidden sm:inline">CAMERA LIVE • Sever Feed ✕</span>
                        <span className="sm:hidden">LIVE • Sever ✕</span>
                      </button>
                    </div>

                    {/* 3-2-1 Breath Countdown Overlay */}
                    {countdown !== null && (
                      <div
                        data-testid="fireside-video-countdown-overlay"
                        className="absolute inset-0 z-30 bg-stone-950/55 backdrop-blur-[2px] flex flex-col items-center justify-center text-center pointer-events-none"
                      >
                        <span className="text-7xl font-serif font-black text-amber-300 drop-shadow-[0_0_24px_rgba(245,158,11,0.7)] animate-pulse">
                          {countdown}
                        </span>
                        <span className="mt-2 px-3 py-1 rounded-full bg-stone-950/80 border border-amber-500/40 text-xs font-mono text-amber-200">
                          Take a breath — tap button to cancel
                        </span>
                      </div>
                    )}
                  </>
                ) : hardwarePrivacyStatus === 'severed' ? (
                  <div
                    data-testid="HS_FIRESIDE_VIEWFINDER_SEVERED_SLATE"
                    className="w-full h-full flex flex-col items-center justify-center text-stone-300 space-y-3 p-6 text-center z-10"
                  >
                    <span
                      data-testid="HS_FIRESIDE_VIEWFINDER_OPTICS_BADGE"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-500/50 text-rose-300 text-[11px] font-mono font-bold tracking-widest"
                    >
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      <span>OPTICS SEVERED — Privacy Shield Active</span>
                    </span>
                    <p className="text-xs text-stone-300 max-w-xs">
                      Hardware camera and microphone feeds are severed for your privacy. Tap below to re-arm optics.
                    </p>
                    <button
                      type="button"
                      data-testid="enable-camera-preview-btn"
                      data-hotspot-id="HS_FIRESIDE_REARM_OPTICS_BTN"
                      onClick={() => {
                        rearmHardware();
                        enableCameraPreview();
                      }}
                      className="min-h-[48px] px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900/90 border border-rose-500/50 text-rose-200 text-xs font-mono font-bold tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md"
                    >
                      <span data-testid="HS_FIRESIDE_VIEWFINDER_REARM_BTN">
                        Re-Arm Camera &amp; Mic
                      </span>
                    </button>
                  </div>
                ) : (
                  <div
                    data-testid="HS_FIRESIDE_VIEWFINDER_INACTIVE_SLATE"
                    className="w-full h-full flex flex-col items-center justify-center text-stone-500 space-y-3 p-6 text-center z-10"
                  >
                    <span
                      data-testid="HS_FIRESIDE_VIEWFINDER_OPTICS_BADGE"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/60 text-zinc-300 text-[11px] font-mono font-bold tracking-widest"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                      <span>OPTICS INACTIVE — Standby</span>
                    </span>
                    <p className="text-xs text-stone-300 max-w-xs">
                      Tap below to preview your camera &amp; frame yourself, then tap Record when ready.
                    </p>
                    <button
                      type="button"
                      data-testid="enable-camera-preview-btn"
                      onClick={enableCameraPreview}
                      className="min-h-[48px] px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enable Camera &amp; Microphone</span>
                    </button>
                  </div>
                )}

                {/* PINNED PROMPT SPARK BANNER NEAR TOP LENS (Suppressed when external script banner is already displayed above the camera) */}
                {!hasExternalScriptBanner && (
                  <div className="hidden sm:block absolute top-3 inset-x-3 sm:top-14 sm:inset-x-4 z-10 pointer-events-none">
                    <div className="bg-stone-950/75 backdrop-blur-md border border-amber-500/35 rounded-2xl p-3 text-center shadow-xl">
                      <p className="text-[11px] uppercase font-mono tracking-wider text-amber-400 font-semibold mb-1 flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{promptTitle}</span>
                      </p>
                      <p className="text-xs font-serif text-stone-100 leading-snug line-clamp-2">
                        &ldquo;{promptText}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* Top-Left Live Recording Timer (zero overlap with Top-Right Sever or Bottom-Right Screen Awake) */}
                {(isRecording || isPaused) && (
                  <div className="absolute top-3 left-3 z-20 pointer-events-none">
                    <div
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-mono text-xs sm:text-sm font-bold backdrop-blur-md shadow-md ${
                        isRecording
                          ? 'bg-red-950/85 border border-red-500 text-red-200 animate-pulse'
                          : 'bg-amber-950/85 border border-amber-500 text-amber-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-amber-400'}`} />
                      <span>{isRecording ? 'REC' : 'PAUSED'}</span>
                      <span>{formattedDuration}</span>
                    </div>
                  </div>
                )}

                {/* Bottom-Right Wake Lock Active Indicator (dedicated corner) */}
                {(isRecording || isPaused) && isWakeLockActive && (
                  <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-950/80 border border-stone-700/80 text-[11px] font-mono text-stone-300 backdrop-blur-md">
                      <Eye className="w-3 h-3 text-amber-400" />
                      <span className="hidden sm:inline">Screen Awake</span>
                    </div>
                  </div>
                )}
              </div>

              {/* RECORDING CONTROLS CONTAINER */}
              <div className="w-full flex flex-col items-center space-y-4 pt-1">
                {/* Master-Reel Protection Pre-Record Challenge (RC1.1) */}
                {isMasterProtected && !isRecording && !isPaused && (
                  <div
                    data-testid="HS_FIRESIDE_VIDEO_MASTER_GUARD"
                    role="region"
                    aria-label="Master Reel protection notice"
                    className={`w-full rounded-2xl px-4 py-3 border text-left transition-all ${
                      masterChallengeArmed
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-100'
                        : showMasterChallengePrompt
                        ? 'bg-amber-950/85 border-amber-400 text-amber-100 shadow-lg shadow-amber-950/50'
                        : 'bg-amber-950/55 border-amber-500/45 text-amber-100'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          masterChallengeArmed ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      />
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-semibold leading-snug">
                          {masterChallengeArmed
                            ? 'Audition Take Mode Armed — Your published / Desktop Soundstage Master Reel stays untouched.'
                            : 'Master Reel Protected — This scene already has a Desktop Soundstage / Published Master Reel. Fireside recordings save separately and never overwrite it.'}
                        </p>
                        {!masterChallengeArmed && (
                          <button
                            type="button"
                            data-testid="HS_FIRESIDE_VIDEO_ARM_AUDITION_BTN"
                            onClick={() => {
                              setMasterChallengeArmed(true);
                              setShowMasterChallengePrompt(false);
                            }}
                            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs tracking-wide transition-all cursor-pointer active:scale-98 shadow-sm"
                          >
                            Record Separate Audition Take (Keeps Master Safe)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning Banner for < 3s Short Recordings or Tab-Switch Pause */}
                {errorMessage && (
                  <div
                    data-testid="video-recorder-warning-banner"
                    role="alert"
                    className="w-full px-4 py-2.5 rounded-xl bg-amber-950/70 border border-amber-500/60 text-amber-200 text-xs sm:text-sm font-medium text-center flex items-center justify-center gap-2 animate-in fade-in duration-200 shadow-md"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Story Resonance Mood Selector (Ticket #263 / Rule 26 & 39) */}
                {onMoodChange && (
                  <div className="w-full mb-1 flex flex-col items-center">
                    <span className="text-[11px] font-semibold tracking-wider text-amber-500/90 uppercase mb-2">
                      Story Resonance Mood
                    </span>
                    <FiresideMoodChips
                      activeMood={activeMood}
                      onMoodChange={onMoodChange}
                      disabled={isRecording}
                    />
                  </div>
                )}

                {/* Control Action Buttons Row */}
                <div className="flex items-center justify-center gap-6 sm:gap-8">
                  {/* Secondary Action: Pause / Resume (Visible only while recording or paused) */}
                  {(isRecording || isPaused) && (
                    <button
                      type="button"
                      data-hotspot-id="HS_FIRESIDE_VIDEO_PAUSE_BTN"
                      onClick={isRecording ? pauseRecording : resumeRecording}
                      style={{
                        width: `${FIRESIDE_TOUCH_TARGETS.SECONDARY_BUTTON_SIZE_PX}px`,
                        height: `${FIRESIDE_TOUCH_TARGETS.SECONDARY_BUTTON_SIZE_PX}px`,
                      }}
                      className="rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95"
                      title={isRecording ? 'Pause video memo' : 'Resume video memo'}
                      aria-label={isRecording ? 'Pause recording' : 'Resume recording'}
                    >
                      {isRecording ? (
                        <Pause className="w-6 h-6 text-amber-400" />
                      ) : (
                        <Play className="w-6 h-6 text-emerald-400 ml-0.5" />
                      )}
                    </button>
                  )}

                  {/* PRIMARY OVERSIZED 88px RECORD / STOP BUTTON (Rule 26) */}
                  <div className="relative flex items-center justify-center">
                    {/* Glowing outer pulse halo when recording */}
                    {isRecording && (
                      <div className="absolute inset-0 rounded-full bg-red-500/25 animate-ping pointer-events-none scale-110" />
                    )}

                    <button
                      type="button"
                      data-hotspot-id="HS_FIRESIDE_VIDEO_RECORD_BTN"
                      onClick={() => void handleRecordTriggerClick()}
                      disabled={isProcessing}
                      style={{
                        width: `${FIRESIDE_TOUCH_TARGETS.RECORD_BUTTON_SIZE_PX}px`,
                        height: `${FIRESIDE_TOUCH_TARGETS.RECORD_BUTTON_SIZE_PX}px`,
                      }}
                      className={`rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xl relative z-10 ${
                        isRecording || isPaused
                          ? 'bg-red-600 hover:bg-red-500 border-4 border-white/80 shadow-red-600/50'
                          : countdown !== null
                          ? 'bg-amber-500/20 border-4 border-amber-400 text-amber-200 shadow-amber-500/40'
                          : 'bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-300 border-4 border-stone-950 shadow-amber-500/30'
                      }`}
                      aria-label={
                        isRecording || isPaused
                          ? 'Stop and save video memo'
                          : countdown !== null
                          ? 'Cancel recording countdown'
                          : 'Start video recording'
                      }
                      title={
                        isRecording || isPaused
                          ? 'Stop and save video memo'
                          : countdown !== null
                          ? 'Tap to cancel countdown'
                          : 'Start video recording (3-2-1 countdown)'
                      }
                    >
                      {isRecording || isPaused ? (
                        <Square className="w-8 h-8 text-white fill-white" />
                      ) : countdown !== null ? (
                        <span className="text-2xl font-mono font-black text-amber-300">{countdown}</span>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-stone-950 shadow-sm" />
                      )}
                    </button>
                  </div>

                  {/* Secondary Action: Discard / Cancel while recording */}
                  {(isRecording || isPaused) && (
                    <button
                      type="button"
                      data-hotspot-id="HS_FIRESIDE_VIDEO_CANCEL_BTN"
                      onClick={resetRecording}
                      style={{
                        width: `${FIRESIDE_TOUCH_TARGETS.SECONDARY_BUTTON_SIZE_PX}px`,
                        height: `${FIRESIDE_TOUCH_TARGETS.SECONDARY_BUTTON_SIZE_PX}px`,
                      }}
                      className="rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-red-400 flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95"
                      title="Discard current video memo"
                      aria-label="Discard recording"
                    >
                      <RotateCcw className="w-6 h-6" />
                    </button>
                  )}
                </div>

                {/* Subtext Label for Narration Clarity */}
                <p className="text-xs text-stone-400 text-center font-medium">
                  {isRecording
                    ? 'Recording video memo. Tap the red square to finish.'
                    : isPaused
                    ? 'Recording paused. Tap Play to resume or the red square to save.'
                    : countdown !== null
                    ? `Starting in ${countdown}… Tap the circle to cancel.`
                    : 'Frame yourself above, then tap the circular button to begin (3-2-1 countdown).'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default FiresideVideoRecorder;
