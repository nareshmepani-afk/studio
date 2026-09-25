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

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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

export interface FiresideVideoRecorderRef {
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
  scrollIntoView: () => void;
  status: RecordingLifecycleStatus;
}

export interface FiresideVideoRecorderProps {
  promptSpark?: FiresidePromptSpark | null;
  activeLanguage?: FiresideLanguage;
  activeMood?: StoryMoodTag;
  onMoodChange?: (mood: StoryMoodTag) => void;
  onRecordingComplete?: (videoBlob: Blob, durationSeconds: number) => void;
  onReset?: () => void;
  className?: string;
}

export const FiresideVideoRecorder = forwardRef<FiresideVideoRecorderRef, FiresideVideoRecorderProps>(
  function FiresideVideoRecorder(
    {
      promptSpark,
      activeLanguage = 'en',
      activeMood,
      onMoodChange,
      onRecordingComplete,
      onReset,
      className = '',
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const nativeVideoInputRef = useRef<HTMLInputElement>(null);

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
    } = useFiresideVideoRecorder({
      onRecordingComplete,
      onReset,
    });

    // Expose imperative API for parent container auto-scrolling and direct trigger
    useImperativeHandle(
      ref,
      () => ({
        startRecording,
        stopRecording,
        resetRecording,
        scrollIntoView: () => {
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        status,
      }),
      [startRecording, stopRecording, resetRecording, status]
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
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Video Memo Recorded ({formattedDuration})</span>
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
                        onRecordingComplete?.(videoBlob, durationSeconds);
                      }
                    }}
                    style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
                    className="w-full px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-stone-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    aria-label="Keep this video memo"
                  >
                    <Check className="w-5 h-5 text-stone-950" />
                    <span>Keep This Video Memo</span>
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
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ transform: 'scaleX(-1)' }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 space-y-3 p-6 pt-20 text-center z-10">
                    <Video className="w-10 h-10 text-amber-500/70 animate-pulse" />
                    <p className="text-xs text-stone-300 max-w-xs">
                      Tap below to enable your front camera & microphone, or tap Record to start immediately.
                    </p>
                    <button
                      type="button"
                      data-testid="enable-camera-preview-btn"
                      onClick={enableCameraPreview}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enable Camera & Microphone</span>
                    </button>
                  </div>
                )}

                {/* PINNED PROMPT SPARK BANNER NEAR TOP LENS (Key Ergonomic Innovation) */}
                <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-20 pointer-events-none">
                  <div className="bg-stone-950/80 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 sm:p-4 text-center shadow-xl">
                    <p className="text-[11px] sm:text-xs uppercase font-mono tracking-wider text-amber-400 font-semibold mb-1 flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{promptTitle}</span>
                    </p>
                    <p className="text-xs sm:text-sm font-serif text-stone-100 leading-snug line-clamp-3">
                      "{promptText}"
                    </p>
                  </div>
                </div>

                {/* Bottom Overlay Status Bar: Rec Timer & Wake Lock */}
                {(isRecording || isPaused) && (
                  <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 z-20 flex items-center justify-between pointer-events-none">
                    {/* Live Duration Badge */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs sm:text-sm font-bold backdrop-blur-md shadow-md ${
                        isRecording
                          ? 'bg-red-950/80 border border-red-500 text-red-200 animate-pulse'
                          : 'bg-amber-950/80 border border-amber-500 text-amber-200'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500' : 'bg-amber-400'}`} />
                      <span>{isRecording ? 'REC' : 'PAUSED'}</span>
                      <span>{formattedDuration}</span>
                    </div>

                    {/* Wake Lock Active Indicator */}
                    {isWakeLockActive && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-950/80 border border-stone-700/80 text-[11px] font-mono text-stone-300 backdrop-blur-md">
                        <Eye className="w-3 h-3 text-amber-400" />
                        <span className="hidden xs:inline">Screen Awake</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RECORDING CONTROLS CONTAINER */}
              <div className="w-full flex flex-col items-center space-y-4 pt-1">
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
                      onClick={isRecording || isPaused ? () => stopRecording() : startRecording}
                      disabled={isProcessing}
                      style={{
                        width: `${FIRESIDE_TOUCH_TARGETS.RECORD_BUTTON_SIZE_PX}px`,
                        height: `${FIRESIDE_TOUCH_TARGETS.RECORD_BUTTON_SIZE_PX}px`,
                      }}
                      className={`rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xl relative z-10 ${
                        isRecording || isPaused
                          ? 'bg-red-600 hover:bg-red-500 border-4 border-white/80 shadow-red-600/50'
                          : 'bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-300 border-4 border-stone-950 shadow-amber-500/30'
                      }`}
                      aria-label={isRecording || isPaused ? 'Stop and save video memo' : 'Start video recording'}
                      title={isRecording || isPaused ? 'Stop and save video memo' : 'Start video recording'}
                    >
                      {isRecording || isPaused ? (
                        <Square className="w-8 h-8 text-white fill-white" />
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
                    : 'Tap the circular button to begin your selfie video memo.'}
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
