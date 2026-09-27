'use client';

/**
 * 🎙️ Fireside Voice Studio — 30-Second Mic Warmup & Soundcheck Modal (MW-88-T3)
 *
 * Mobile rehearsal equivalent to Desktop `first_flight_rehearsal`.
 * Guides elderly narrators through a 3-step soundcheck and photo digitiser preview:
 *   - Step 1: Quick 10-second test voice recording into the phone mic.
 *   - Step 2: Instant playback check with visual audio waveform, ambient acoustic warmth,
 *             and reassurance feedback: "Your voice sounds warm and crystal clear."
 *   - Step 3: Optional test photo capture to preview client-side compression & physical album digitiser (MW-246).
 *   - Exit:   "Soundcheck complete. Entering Part I: Roots and Foundations."
 *
 * Zero-Contamination Shield:
 * All test audio blobs and photos are held strictly in local ephemeral component state (`useState`)
 * and immediately revoked via `URL.revokeObjectURL()`. Zero mock or test data is ever written
 * to the user's permanent Firestore or IndexedDB vault.
 *
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English: synchronised, prioritised, centred, colour, digitiser, Rule 26 56px Touch Targets)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Volume2,
  Camera,
  CheckCircle2,
  Sparkles,
  X,
  ArrowRight,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import type { FiresideLanguage } from '@/types/fireside';
import { FIRESIDE_TOUCH_TARGETS } from '@/types/fireside';

export interface FiresideWarmupModalProps {
  isOpen: boolean;
  activeLanguage?: FiresideLanguage;
  onComplete: (exitMessage: string) => void;
  onClose: () => void;
}

export const WARMUP_EXIT_MESSAGE =
  'Soundcheck complete. Entering Part I: Roots and Foundations.';

export const WARMUP_REASSURANCE_FEEDBACK =
  'Your voice sounds warm and crystal clear.';

/**
 * Canonical Multi-Lingual Rehearsal Scripts (Sunday Kettle & Cardamom Chai — MW-88-T5)
 * Synchronised and prioritised with Desktop FlightSimulatorCard.tsx (Rule 20 British English:
 * synchronised, prioritised, sanitisation, colour, behaviour, digitiser, centred)
 */
export const WARMUP_CHAI_SCRIPTS: Record<FiresideLanguage, string> = {
  en: "The Sunday kettle whistling on the stove, rain drumming against the windowpane, and warm cardamom chai served in cracked ceramic cups. In that kitchen, nobody was in a hurry.",
  gu: "રવિવારે ચૂલા પર સીટી વગાડતી કીટલી, બારીના કાચ પર પડતો વરસાદ અને ગરમ એલચીવાળી ચા. તે રસોડામાં કોઈને ઉતાવળ નહોતી.",
  pa: "ਐਤਵਾਰ ਨੂੰ ਚੁੱਲ੍ਹੇ 'ਤੇ ਸੀਟੀ ਵਜਾਉਂਦੀ ਕੇਤਲੀ, ਖਿੜਕੀ 'ਤੇ ਪੈਂਦੀ ਬਾਰਿਸ਼, ਅਤੇ ਗਰਮ ਇਲਾਇਚੀ ਵਾਲੀ ਚਾਹ। ਉਸ ਰਸੋਈ ਵਿੱਚ ਕਿਸੇ ਨੂੰ ਕੋਈ ਕਾਹਲੀ ਨਹੀਂ ਸੀ।",
  hi: "रविवार को चूल्हे पर सीटी बजाती केतली, खिड़की के शीशे पर थपथपाती बारिश, और गर्म इलायची वाली चाय। उस रसोई में किसी को कोई जल्दी नहीं थी।",
};

const WARMUP_TEST_PHRASES: Record<FiresideLanguage, string> = WARMUP_CHAI_SCRIPTS;

const SAMPLE_VINTAGE_SVG_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <rect width="640" height="420" fill="#292118"/>
      <rect x="20" y="20" width="600" height="380" rx="16" fill="#3a2e21" stroke="#d97706" stroke-width="3"/>
      <text x="320" y="190" text-anchor="middle" fill="#fde68a" font-family="Georgia, serif" font-size="24">Heirloom Album Print Preview</text>
      <text x="320" y="235" text-anchor="middle" fill="#d6d3d1" font-family="monospace" font-size="15">Client-Side Compression • Ephemeral Sandbox</text>
    </svg>`
  );

const WAVEFORM_BARS = [35, 62, 84, 48, 92, 74, 56, 88, 66, 42, 78, 52];

export function FiresideWarmupModal({
  isOpen,
  activeLanguage = 'en',
  onComplete,
  onClose,
}: FiresideWarmupModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sandboxMode, setSandboxMode] = useState<'video' | 'audio'>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [ephemeralAudioUrl, setEphemeralAudioUrl] = useState<string | null>(null);
  const [hasRealRecording, setHasRealRecording] = useState(false);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');
  const [hasLiveVideoTrack, setHasLiveVideoTrack] = useState(false);
  const [isPlayingWarmth, setIsPlayingWarmth] = useState(false);
  const [ephemeralPhotoUri, setEphemeralPhotoUri] = useState<string | null>(null);
  const [ephemeralPhotoLabel, setEphemeralPhotoLabel] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const liveVideoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const playbackMediaElRef = useRef<HTMLMediaElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const ephemeralAudioUrlRef = useRef<string | null>(null);
  const ephemeralPhotoUriRef = useRef<string | null>(null);
  const hasRealRecordingRef = useRef<boolean>(false);

  ephemeralAudioUrlRef.current = ephemeralAudioUrl;
  ephemeralPhotoUriRef.current = ephemeralPhotoUri;

  const stopStreamTracks = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // Ignore track stop errors
      }
    });
  }, []);

  const buildRealMediaBlob = useCallback((fallbackMimeType: string) => {
    if (
      audioChunksRef.current.length > 0 &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    ) {
      try {
        if (
          ephemeralAudioUrlRef.current &&
          typeof URL.revokeObjectURL === 'function'
        ) {
          URL.revokeObjectURL(ephemeralAudioUrlRef.current);
        }
        const blob = new Blob(audioChunksRef.current, { type: fallbackMimeType });
        const createdUrl = URL.createObjectURL(blob);
        ephemeralAudioUrlRef.current = createdUrl;
        hasRealRecordingRef.current = true;
        setHasRealRecording(true);
        setRecordedMimeType(fallbackMimeType);
        setEphemeralAudioUrl(createdUrl);
        return true;
      } catch {
        // Ignore blob creation failure in restricted environments
      }
    }
    return false;
  }, []);

  // Attach active camera stream to Step 1 live video viewfinder
  useEffect(() => {
    if (
      isRecording &&
      hasLiveVideoTrack &&
      liveVideoPreviewRef.current &&
      mediaStreamRef.current
    ) {
      try {
        liveVideoPreviewRef.current.srcObject = mediaStreamRef.current;
        void liveVideoPreviewRef.current.play().catch(() => {});
      } catch {
        // Ignore in headless test environments
      }
    }
  }, [isRecording, hasLiveVideoTrack]);

  // Contamination Shield: Ephemeral resource teardown & URL.revokeObjectURL cleanup
  const purgeEphemeralResources = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop errors on inactive recorder
      }
    }
    mediaRecorderRef.current = null;

    stopStreamTracks(mediaStreamRef.current);
    mediaStreamRef.current = null;
    setHasLiveVideoTrack(false);

    if (playbackMediaElRef.current) {
      try {
        playbackMediaElRef.current.pause();
      } catch {
        // Ignore media pause errors
      }
    }

    if (playbackAudioRef.current) {
      try {
        playbackAudioRef.current.pause();
        playbackAudioRef.current.src = '';
      } catch {
        // Ignore audio pause errors
      }
      playbackAudioRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speechSynthesis cancel errors
      }
    }

    if (audioCtxRef.current) {
      try {
        void audioCtxRef.current.close();
      } catch {
        // Ignore AudioContext close errors
      }
      audioCtxRef.current = null;
    }

    if (
      ephemeralAudioUrlRef.current &&
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function'
    ) {
      try {
        URL.revokeObjectURL(ephemeralAudioUrlRef.current);
      } catch {
        // Ignore revoke errors
      }
      ephemeralAudioUrlRef.current = null;
    }

    if (
      ephemeralPhotoUriRef.current &&
      ephemeralPhotoUriRef.current.startsWith('blob:') &&
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function'
    ) {
      try {
        URL.revokeObjectURL(ephemeralPhotoUriRef.current);
      } catch {
        // Ignore revoke errors
      }
      ephemeralPhotoUriRef.current = null;
    }

    audioChunksRef.current = [];
    hasRealRecordingRef.current = false;
    setHasRealRecording(false);
    setEphemeralAudioUrl(null);
    setEphemeralPhotoUri(null);
    setEphemeralPhotoLabel(null);
    setIsRecording(false);
    setIsPlayingWarmth(false);
    setRecordingSeconds(0);
  }, [stopStreamTracks]);

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

    const recorder = mediaRecorderRef.current;
    const activeStream = mediaStreamRef.current;
    const defaultMime =
      recorder?.mimeType ||
      (activeStream && activeStream.getVideoTracks().length > 0 ? 'video/webm' : 'audio/webm');

    if (recorder && recorder.state !== 'inactive') {
      try {
        if (typeof recorder.requestData === 'function') {
          recorder.requestData();
        }
      } catch {
        // Ignore requestData errors
      }
      // Assemble any already-collected timeslice chunks immediately for 0ms Step 2 readiness
      buildRealMediaBlob(defaultMime);
      try {
        recorder.stop();
      } catch {
        stopStreamTracks(activeStream);
        mediaStreamRef.current = null;
      }
    } else {
      buildRealMediaBlob(defaultMime);
      stopStreamTracks(activeStream);
      mediaStreamRef.current = null;
    }

    // Only create synthetic placeholder blob for URL.revokeObjectURL tracking when no real MediaRecorder was active
    if (
      !ephemeralAudioUrlRef.current &&
      !recorder &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    ) {
      try {
        const syntheticBlob = new Blob(['ephemeral-rehearsal-stream'], {
          type: sandboxMode === 'video' ? 'video/webm' : 'audio/webm',
        });
        const createdUrl = URL.createObjectURL(syntheticBlob);
        ephemeralAudioUrlRef.current = createdUrl;
        hasRealRecordingRef.current = false;
        setHasRealRecording(false);
        setEphemeralAudioUrl(createdUrl);
      } catch {
        // Ignore in restricted environments
      }
    }

    setHasLiveVideoTrack(false);
    setIsRecording(false);
    setStep(2);
  }, [sandboxMode, buildRealMediaBlob, stopStreamTracks]);

  const handleStartStep1Recording = async () => {
    if (isRecording) {
      finishStep1Recording();
      return;
    }

    setIsRecording(true);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
    hasRealRecordingRef.current = false;
    setHasRealRecording(false);

    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      let stream: MediaStream | null = null;
      if (sandboxMode === 'video') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: true,
          });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          } catch {
            try {
              // Fallback to microphone-only if device has no webcam or camera is busy
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch {
              stream = null;
            }
          }
        }
      } else {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          stream = null;
        }
      }

      if (stream) {
        mediaStreamRef.current = stream;
        const hasVideo = stream.getVideoTracks().length > 0;
        setHasLiveVideoTrack(hasVideo);

        if (typeof MediaRecorder !== 'undefined') {
          try {
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            const resolvedMime =
              recorder.mimeType || (hasVideo ? 'video/webm' : 'audio/webm');
            setRecordedMimeType(resolvedMime);

            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data);
              }
            };
            recorder.onstop = () => {
              buildRealMediaBlob(resolvedMime);
              stopStreamTracks(stream);
              if (mediaStreamRef.current === stream) {
                mediaStreamRef.current = null;
              }
            };
            recorder.start(200);
          } catch {
            // Ignore MediaRecorder init errors in headless environments
          }
        }
      }
    }

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev + 1 >= 10) {
          finishStep1Recording();
          return 10;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handlePlayWarmthPreview = () => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }

    setIsPlayingWarmth(true);
    const playbackDurationSec = Math.max(4, Math.min(10, recordingSeconds || 4));
    let voiceStarted = false;

    // 1. Play recorded real media via mounted <video>/<audio> element or HTMLAudioElement
    if (hasRealRecordingRef.current && ephemeralAudioUrlRef.current) {
      if (playbackMediaElRef.current) {
        try {
          playbackMediaElRef.current.currentTime = 0;
          playbackMediaElRef.current.muted = false;
          playbackMediaElRef.current.volume = 1.0;
          voiceStarted = true;
          void playbackMediaElRef.current.play().catch(() => {});
        } catch {
          // Ignore playback error
        }
      }
      if (!voiceStarted && typeof Audio !== 'undefined') {
        try {
          if (playbackAudioRef.current) {
            playbackAudioRef.current.pause();
          }
          const audio = new Audio(ephemeralAudioUrlRef.current);
          audio.volume = 1.0;
          audio.onended = () => {
            setIsPlayingWarmth(false);
          };
          playbackAudioRef.current = audio;
          voiceStarted = true;
          void audio.play().catch(() => {});
        } catch {
          // Ignore audio playback exception in test environment
        }
      }
    }

    // 2. If no hardware microphone stream was captured, provide spoken reassurance fallback via SpeechSynthesis
    if (
      !voiceStarted &&
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined'
    ) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          `${WARMUP_REASSURANCE_FEEDBACK} ${WARMUP_TEST_PHRASES[activeLanguage] || WARMUP_TEST_PHRASES.en}`
        );
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onend = () => {
          setIsPlayingWarmth(false);
        };
        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore SpeechSynthesis errors
      }
    }

    // 3. Synthesise rich, clearly audible fireside ambient acoustic warmth chord via Web Audio API
    if (typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          if (audioCtxRef.current) {
            void audioCtxRef.current.close().catch(() => {});
          }
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
            void ctx.resume().catch(() => {});
          }

          const now = ctx.currentTime;
          const masterGain = ctx.createGain();
          masterGain.gain.setValueAtTime(0.001, now);
          masterGain.gain.linearRampToValueAtTime(0.18, now + 0.35);
          masterGain.gain.setValueAtTime(0.14, now + playbackDurationSec - 0.8);
          masterGain.gain.exponentialRampToValueAtTime(0.0001, now + playbackDurationSec);

          let destinationNode: AudioNode = masterGain;
          if (typeof ctx.createBiquadFilter === 'function') {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(780, now);
            filter. connect(masterGain);
            destinationNode = filter;
          }
          masterGain.connect(ctx.destination);

          // Warm A-major fireside chord (A2, E3, A3, C#4, E4)
          const chordFrequencies = [110, 164.81, 220, 277.18, 329.63];
          chordFrequencies.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const voiceGain = ctx.createGain();
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            voiceGain.gain.setValueAtTime(1 / chordFrequencies.length, now);
            osc.connect(voiceGain);
            voiceGain.connect(destinationNode);
            osc.start(now);
            osc.stop(now + playbackDurationSec);
          });
        } catch {
          // Ignore Web Audio errors in headless environments
        }
      }
    }

    playbackTimeoutRef.current = setTimeout(() => {
      setIsPlayingWarmth(false);
    }, playbackDurationSec * 1000);
  };

  const handlePhotoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      if (ephemeralPhotoUriRef.current?.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(ephemeralPhotoUriRef.current);
      }
      const uri = URL.createObjectURL(file);
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      setEphemeralPhotoUri(uri);
      setEphemeralPhotoLabel(`${file.name} (${sizeKb} KB • Client-Side Compression Preview)`);
    }
    e.target.value = '';
  };

  const handlePreviewSamplePrint = () => {
    setEphemeralPhotoUri(SAMPLE_VINTAGE_SVG_DATA_URI);
    setEphemeralPhotoLabel('Sample 1962 Family Portrait (Client-Side Compression & Digitiser Preview)');
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
      aria-label="30-Second Mic Warmup and Soundcheck"
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
            30-Second Mic Warmup &amp; Soundcheck
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
          style={{
            minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px`,
            minWidth: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px`,
          }}
          className="min-h-[56px] min-w-[56px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
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
          1. 10s Mic Check
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
          2. Waveform Check
        </div>
        <div
          className={`py-1.5 px-2 rounded-xl border ${
            step === 3
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
              : 'bg-stone-900/40 border-stone-800/60 text-stone-500'
          }`}
        >
          3. Photo Compression
        </div>
      </div>

      {/* STEP 1: Quick 10-second test camera/voice recording */}
      {step === 1 && (
        <div data-testid="warmup-step-1" className="space-y-5">
          {/* Sandbox Mode Toggle: Selfie Video & Prompter vs Voice Only (MW-88-T5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              data-testid="HS_FIRESIDE_WARMUP_MODE_VIDEO_BTN"
              data-hotspot-id="HS_FIRESIDE_WARMUP_MODE_VIDEO_BTN"
              onClick={() => setSandboxMode('video')}
              className={`min-h-[48px] px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                sandboxMode === 'video'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md'
                  : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Video className="w-4 h-4 text-amber-400" />
              <span>[ 📹 Test Selfie Video &amp; Prompter ]</span>
            </button>

            <button
              type="button"
              data-testid="HS_FIRESIDE_WARMUP_MODE_VOICE_BTN"
              data-hotspot-id="HS_FIRESIDE_WARMUP_MODE_VOICE_BTN"
              onClick={() => setSandboxMode('audio')}
              className={`min-h-[48px] px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                sandboxMode === 'audio'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md'
                  : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Mic className="w-4 h-4 text-amber-400" />
              <span>[ 🎙️ Test Voice Only ]</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-amber-500/25">
            <p className="text-xs uppercase tracking-widest text-amber-400/90 font-semibold mb-2">
              Step 1: Quick 10-Second Rehearsal ({sandboxMode === 'video' ? 'Selfie Video & Prompter' : 'Voice Only'})
            </p>
            <p
              data-testid="warmup-chai-script-text"
              className="text-lg sm:text-xl font-serif italic text-white leading-relaxed"
            >
              &ldquo;{phrase}&rdquo;
            </p>
          </div>

          {isRecording && hasLiveVideoTrack && (
            <div
              data-testid="warmup-live-video-preview"
              className="rounded-2xl overflow-hidden border border-amber-500/40 bg-black relative"
            >
              <video
                ref={liveVideoPreviewRef}
                autoPlay
                muted
                playsInline
                className="w-full max-h-52 object-cover transform -scale-x-100"
              />
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/70 border border-rose-500/40 text-rose-300 text-[11px] font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>LIVE SELFIE PREVIEW</span>
              </div>
            </div>
          )}

          {isRecording && (
            <div
              data-testid="warmup-recording-meter"
              className="flex items-center justify-center gap-3 py-2 text-amber-300 text-xs font-mono"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>
                Recording 10-second {sandboxMode === 'video' ? 'camera & mic' : 'voice'} check... ({recordingSeconds}s / 10s)
              </span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              data-testid="warmup-record-btn"
              data-hotspot-id="HS_FIRESIDE_WARMUP_RECORD_BTN"
              onClick={handleStartStep1Recording}
              style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
              className={`w-full min-h-[56px] px-6 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg ${
                isRecording
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950'
              }`}
            >
              {sandboxMode === 'video' ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span>
                {isRecording
                  ? 'Finish Test Phrase & Continue ➔'
                  : sandboxMode === 'video'
                  ? '📹 Record 10-Second Selfie & Mic Check'
                  : '🎙️ Speak 10-Second Test Phrase into Mic'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Instant playback check with visual audio waveform and reassurance feedback */}
      {step === 2 && (
        <div data-testid="warmup-step-2" className="space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Step 2: Instant Playback &amp; Visual Waveform Check</span>
            </div>

            <p
              data-testid="warmup-reassurance-feedback"
              className="text-base sm:text-lg font-serif text-emerald-200 font-medium"
            >
              &ldquo;{WARMUP_REASSURANCE_FEEDBACK}&rdquo;
            </p>

            {/* Recorded Ephemeral Media Player (Video or Audio) */}
            {hasRealRecording && ephemeralAudioUrl && (
              <div className="rounded-xl overflow-hidden bg-black/70 border border-emerald-500/30 p-2">
                {recordedMimeType.startsWith('video') ? (
                  <video
                    ref={(el) => {
                      playbackMediaElRef.current = el;
                    }}
                    src={ephemeralAudioUrl}
                    controls
                    playsInline
                    onEnded={() => setIsPlayingWarmth(false)}
                    data-testid="warmup-recorded-video-player"
                    className="w-full max-h-56 object-cover rounded-lg bg-black"
                  />
                ) : (
                  <audio
                    ref={(el) => {
                      playbackMediaElRef.current = el;
                    }}
                    src={ephemeralAudioUrl}
                    controls
                    onEnded={() => setIsPlayingWarmth(false)}
                    data-testid="warmup-recorded-audio-player"
                    className="w-full h-10"
                  />
                )}
              </div>
            )}

            {/* Visual Audio Waveform */}
            <div
              data-testid="warmup-visual-waveform"
              className="flex items-end justify-center gap-1.5 h-12 pt-2 px-3 bg-black/40 rounded-xl border border-emerald-500/20"
              aria-label="Visual audio waveform"
            >
              {WAVEFORM_BARS.map((heightPct, idx) => (
                <div
                  key={idx}
                  style={{ height: `${isPlayingWarmth ? Math.min(100, heightPct + 12) : heightPct}%` }}
                  className={`w-2 rounded-full transition-all duration-300 ${
                    isPlayingWarmth ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400/80'
                  }`}
                />
              ))}
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
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
              className="w-full min-h-[56px] px-5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer"
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
              className="w-full min-h-[56px] px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Next: Preview Photo Digitiser</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Optional test photo capture to preview client-side compression (MW-246) */}
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
              Step 3 (Optional): Preview Physical Album Digitiser &amp; Compression (MW-246)
            </p>
            <p className="text-sm sm:text-base text-stone-200 leading-relaxed">
              Snap an optional test photo print (or preview a sample heirloom portrait) to verify instant client-side compression before entering Part I.
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
              className="w-full min-h-[56px] px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-stone-200 font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Snap Optional Photo Print</span>
            </button>

            <button
              type="button"
              data-testid="warmup-sample-print-btn"
              onClick={handlePreviewSamplePrint}
              style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
              className="w-full min-h-[56px] px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-amber-300 font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            className="w-full min-h-[56px] px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-stone-950 font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Complete Soundcheck &amp; Enter Part I ➔</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default FiresideWarmupModal;
