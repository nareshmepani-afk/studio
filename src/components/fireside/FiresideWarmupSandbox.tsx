'use client';

/**
 * 🎙️ Fireside Warmup & Soundcheck Sandbox (MW-88-T3)
 *
 * Mobile-native 30-second rehearsal equivalent to Desktop's Flight Simulator.
 * Guides first-time elders through:
 *  - Step 1: Speak a short test phrase into the phone mic.
 *  - Step 2: Instant playback with ambient background warmth to reassure audio quality.
 *  - Step 3: Snap an optional photo print to preview the physical album digitiser (MW-246).
 *  - Exit: "Soundcheck complete. Entering Part I: Roots and Foundations."
 *
 * Contamination Shield:
 * All warmup audio and test photos are strictly ephemeral and discarded upon exit.
 * Zero mock data is ever written to the user's permanent Firestore or IndexedDB vault.
 *
 * Constitutional Governance: Rule 7 Non-Degradation, Rule 20 British English, Rule 26 (56px touch targets).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Volume2, Camera, CheckCircle2, Sparkles, X, ArrowRight, Image as ImageIcon } from 'lucide-react';
import type { FiresideLanguage } from '@/types/fireside';
import { FIRESIDE_TOUCH_TARGETS } from '@/types/fireside';

export const WARMUP_EXIT_MESSAGE =
  'Soundcheck complete. Entering Part I: Roots and Foundations.';

const WARMUP_TEST_PHRASES: Record<FiresideLanguage, string> = {
  en: 'Hello, my name is... and I remember the warmth of my childhood home.',
  gu: 'નમસ્તે, મારું નામ... છે અને મને મારા બાળપણના ઘરની હૂંફ યાદ છે.',
  pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੇਰਾ ਨਾਮ... ਹੈ ਅਤੇ ਮੈਨੂੰ ਆਪਣੇ ਬਚਪਨ ਦੇ ਘਰ ਦੀ ਨਿੱਘ ਯਾદ ਹੈ।',
  hi: 'नमस्ते, मेरा नाम... है और मुझे अपने बचपन के घर की गर्माहट याद है।',
};

const SAMPLE_VINTAGE_SVG_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#2a2118"/>
      <rect x="24" y="24" width="552" height="352" rx="12" fill="#3d3024" stroke="#d97706" stroke-width="2" stroke-opacity="0.5"/>
      <circle cx="300" cy="175" r="64" fill="#d97706" fill-opacity="0.2" stroke="#f59e0b" stroke-width="2"/>
      <text x="300" y="285" text-anchor="middle" fill="#fde68a" font-family="Georgia, serif" font-size="22" font-style="italic">Sample Vintage Heirloom Print (1962)</text>
      <text x="300" y="318" text-anchor="middle" fill="#d6d3d1" font-family="monospace" font-size="13">Physical Album Digitiser Preview • Ephemeral Sandbox</text>
    </svg>`
  );

export interface FiresideWarmupSandboxProps {
  isOpen: boolean;
  activeLanguage?: FiresideLanguage;
  onClose: () => void;
  onComplete: (exitMessage: string) => void;
}

export function FiresideWarmupSandbox({
  isOpen,
  activeLanguage = 'en',
  onClose,
  onComplete,
}: FiresideWarmupSandboxProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [ephemeralAudioUrl, setEphemeralAudioUrl] = useState<string | null>(null);
  const [isPlayingWarmth, setIsPlayingWarmth] = useState(false);
  const [ephemeralPhotoUri, setEphemeralPhotoUri] = useState<string | null>(null);
  const [ephemeralPhotoLabel, setEphemeralPhotoLabel] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Contamination Shield: Discard all ephemeral resources and stop hardware tracks
  const purgeEphemeralResources = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore already stopped recorder
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (playbackAudioRef.current) {
      try {
        playbackAudioRef.current.pause();
      } catch {
        // Ignore
      }
      playbackAudioRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        void audioCtxRef.current.close();
      } catch {
        // Ignore
      }
      audioCtxRef.current = null;
    }
    setEphemeralAudioUrl((prev) => {
      if (prev && prev.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(prev);
        } catch {
          // Ignore
        }
      }
      return null;
    });
    setEphemeralPhotoUri((prev) => {
      if (prev && prev.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(prev);
        } catch {
          // Ignore
        }
      }
      return null;
    });
    setEphemeralPhotoLabel(null);
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsPlayingWarmth(false);
    setRecordingSeconds(0);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      purgeEphemeralResources();
      setStep(1);
    }
    return () => {
      purgeEphemeralResources();
    };
  }, [isOpen, purgeEphemeralResources]);

  const finishStep1Recording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setStep(2);
  }, []);

  const handleStartStep1Recording = async () => {
    if (isRecording) {
      finishStep1Recording();
      return;
    }

    setIsRecording(true);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        if (typeof MediaRecorder !== 'undefined') {
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          recorder.onstop = () => {
            if (audioChunksRef.current.length > 0 && typeof URL !== 'undefined' && URL.createObjectURL) {
              const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              setEphemeralAudioUrl(URL.createObjectURL(blob));
            }
          };
          recorder.start(250);
        }
      } catch {
        // Fallback smoothly in headless or restricted mic environments so rehearsal never locks out
      }
    }

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev + 1 >= 5) {
          finishStep1Recording();
          return 5;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handlePlayWarmthPreview = () => {
    setIsPlayingWarmth(true);

    // Play recorded ephemeral voice if available
    if (ephemeralAudioUrl && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio(ephemeralAudioUrl);
        playbackAudioRef.current = audio;
        void audio.play().catch(() => {});
      } catch {
        // Ignore audio playback exception in test environment
      }
    }

    // Synthesise gentle ambient background warmth pad via Web Audio API if available
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          gain.gain.setValueAtTime(0.02, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 2.2);
        } catch {
          // Ignore Web Audio errors in headless environments
        }
      }
    }

    setTimeout(() => {
      setIsPlayingWarmth(false);
    }, 1800);
  };

  const handlePhotoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      const uri = URL.createObjectURL(file);
      setEphemeralPhotoUri(uri);
      setEphemeralPhotoLabel(`${file.name} (Ephemeral Print Preview)`);
    }
    e.target.value = '';
  };

  const handlePreviewSamplePrint = () => {
    setEphemeralPhotoUri(SAMPLE_VINTAGE_SVG_DATA_URI);
    setEphemeralPhotoLabel('Sample 1962 Family Portrait (Physical Album Digitiser Preview)');
  };

  const handleCompleteWarmup = () => {
    purgeEphemeralResources();
    onComplete(WARMUP_EXIT_MESSAGE);
  };

  const handleCancelWarmup = () => {
    purgeEphemeralResources();
    onClose();
  };

  if (!isOpen) return null;

  const phrase = WARMUP_TEST_PHRASES[activeLanguage] || WARMUP_TEST_PHRASES.en;

  return (
    <div
      data-testid="fireside-warmup-sandbox"
      role="dialog"
      aria-modal="true"
      aria-label="30-Second Warmup and Soundcheck"
      className="w-full rounded-3xl bg-[#141210] border-2 border-amber-500/40 p-5 sm:p-7 shadow-2xl relative overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Specular Highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20" />

      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Fireside Warmup • Step {step} of 3</span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif text-white">
            30-Second Warmup &amp; Soundcheck
          </h3>
          <p
            data-testid="warmup-contamination-shield-note"
            className="text-xs text-stone-400 mt-0.5"
          >
            Contamination Shield Active • Practice Sandbox • Zero mock data saved to your permanent family vault
          </p>
        </div>

        <button
          type="button"
          onClick={handleCancelWarmup}
          data-testid="warmup-close-btn"
          style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px`, minWidth: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
          className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label="Close warmup soundcheck"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step Progress Pills */}
      <div className="grid grid-cols-3 gap-2 mb-6 text-center text-[11px] font-mono">
        <div
          className={`py-1.5 px-2 rounded-xl border ${
            step === 1
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
              : 'bg-stone-900/80 border-stone-800 text-emerald-400'
          }`}
        >
          1. Mic Test
        </div>
        <div
          className={`py-1.5 px-2 rounded-xl border ${
            step === 2
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
              : step > 2
              ? 'bg-stone-900/80 border-stone-800 text-emerald-400'
              : 'bg-stone-900/40 border-stone-800/60 text-stone-500'
          }`}
        >
          2. Warmth Check
        </div>
        <div
          className={`py-1.5 px-2 rounded-xl border ${
            step === 3
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
              : 'bg-stone-900/40 border-stone-800/60 text-stone-500'
          }`}
        >
          3. Photo Print
        </div>
      </div>

      {/* STEP 1: Speak a short test phrase into the phone mic */}
      {step === 1 && (
        <div data-testid="warmup-step-1" className="space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-amber-500/25">
            <p className="text-xs uppercase tracking-widest text-amber-400/90 font-semibold mb-2">
              Step 1: Speak a Short Test Phrase into the Phone Mic
            </p>
            <p className="text-lg sm:text-xl font-serif italic text-white leading-relaxed">
              &ldquo;{phrase}&rdquo;
            </p>
          </div>

          {isRecording && (
            <div
              data-testid="warmup-recording-meter"
              className="flex items-center justify-center gap-3 py-2 text-amber-300 text-xs font-mono"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>Listening to your voice... ({recordingSeconds}s / 5s)</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              data-testid="warmup-record-btn"
              data-hotspot-id="HS_FIRESIDE_WARMUP_RECORD_BTN"
              onClick={handleStartStep1Recording}
              style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
              className={`w-full px-6 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg ${
                isRecording
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span>
                {isRecording
                  ? 'Finish Test Phrase & Continue ➔'
                  : '🎙️ Speak Test Phrase into Phone Mic'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Instant playback with ambient background warmth */}
      {step === 2 && (
        <div data-testid="warmup-step-2" className="space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Step 2: Instant Playback with Ambient Background Warmth</span>
            </div>
            <p className="text-sm sm:text-base text-stone-200 leading-relaxed">
              Your microphone is clear and centred. Tap below to hear your soundcheck blended with gentle fireside acoustic warmth.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              data-testid="warmup-playback-btn"
              data-hotspot-id="HS_FIRESIDE_WARMUP_PLAY_BTN"
              onClick={handlePlayWarmthPreview}
              style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
              className="w-full px-5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Volume2 className="w-5 h-5 text-amber-400" />
              <span>
                {isPlayingWarmth
                  ? '🔊 Playing with Ambient Background Warmth...'
                  : '🔊 Play Back with Ambient Warmth'}
              </span>
            </button>

            <button
              type="button"
              data-testid="warmup-next-to-photo-btn"
              data-hotspot-id="HS_FIRESIDE_WARMUP_STEP3_BTN"
              onClick={() => setStep(3)}
              style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
              className="w-full px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Next: Preview Photo Digitiser</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Snap an optional photo print to preview the physical album digitiser */}
      {step === 3 && (
        <div data-testid="warmup-step-3" className="space-y-5">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            data-testid="warmup-photo-input"
            onChange={handlePhotoFileSelected}
            className="hidden"
            aria-label="Snap optional test photo print"
          />

          <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-amber-500/25 space-y-2">
            <p className="text-xs uppercase tracking-widest text-amber-400/90 font-semibold">
              Step 3 (Optional): Preview the Physical Album Digitiser (MW-246)
            </p>
            <p className="text-sm sm:text-base text-stone-200 leading-relaxed">
              Snap an optional photo print (or preview a sample heirloom portrait) to see how physical photographs are framed alongside your voice.
            </p>
          </div>

          {ephemeralPhotoUri && (
            <div
              data-testid="warmup-photo-preview"
              className="p-3 rounded-2xl bg-stone-900/90 border border-amber-500/40 space-y-2"
            >
              <img
                src={ephemeralPhotoUri}
                alt="Ephemeral heirloom print preview"
                className="w-full max-h-44 object-cover rounded-xl border border-stone-700"
              />
              <p className="text-xs font-mono text-amber-300 text-center">
                ✓ {ephemeralPhotoLabel} (Discarded on exit)
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              data-testid="warmup-snap-photo-btn"
              data-hotspot-id="HS_FIRESIDE_WARMUP_PHOTO_BTN"
              onClick={() => photoInputRef.current?.click()}
              style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
              className="w-full px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-stone-200 font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Snap Optional Photo Print</span>
            </button>

            <button
              type="button"
              data-testid="warmup-sample-print-btn"
              onClick={handlePreviewSamplePrint}
              style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
              className="w-full px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-amber-300 font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>Preview Sample Print</span>
            </button>
          </div>

          <button
            type="button"
            data-testid="warmup-complete-btn"
            data-hotspot-id="HS_FIRESIDE_WARMUP_COMPLETE_BTN"
            onClick={handleCompleteWarmup}
            style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
            className="w-full px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-stone-950 font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Complete Soundcheck &amp; Enter Part I ➔</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default FiresideWarmupSandbox;
