'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { MemoryForm } from './MemoryForm';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { 
  Video, Disc, Square, AlertTriangle, CheckCircle2, Play, Pause, Camera, Loader2, Mic2, MessageSquare, Volume2, Sparkles, 
  Languages, Layout, Zap, Settings2, RefreshCw, Rocket, Mic, Tag, ArrowLeft, 
  Film as FilmIcon, BrainCircuit, Maximize2, Minus, Plus, ChevronRight, ChevronLeft,
  Lock, ShieldAlert, Smartphone, ShieldCheck, Lightbulb, Theater, ExternalLink, ChevronDown, ChevronUp, Download, VideoOff, X, Wand2, Share2, Copy, Mail, FileText,
  Tv, Airplay, Cast
} from 'lucide-react';
import { downloadFusedAutobiography } from '@/utils/autobiographyExporter';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeCanvas } from 'qrcode.react';
import { generateInterviewQuestion, analyzeFraming } from '@/actions/aiWeaver';
import { synthesizeStudioSpeech } from '@/actions/studio-vocal';
import { useCamera } from '@/hooks/useCamera';
import { useMediaRecorder, type EDLTrackSegment } from '@/hooks/use-media-recorder';
import { useAudioLevel } from '@/hooks/use-audio-level';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import DirectorsNotepad from './DirectorsNotepad';
import { MentorshipHotspot } from './MentorshipHotspot';
import { generateDirectorsNotepad } from '@/actions/aiWeaver';
import { ProductionControlBar } from './ProductionControlBar';
import CinemaStageSwitch from './CinemaStageSwitch';
import { Memory, FusionManifest, PremiereMode } from '@/types';
import CinemaPoster from '../memory/CinemaPoster';
import { CinemaMonitor } from './CinemaMonitor';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { useAuth } from '@/hooks/useAuth';
import { Teleprompter } from './Teleprompter';
import { useJourneyLogger } from '@/hooks/telemetry/useJourneyLogger';
import { APP_VERSION } from '@/config/version';
import { useAudioMonitor } from '@/hooks/useAudioMonitor';
import { useCaptureLogic } from '@/hooks/studio/useCaptureLogic';
import { useAlchemy } from '@/hooks/studio/useAlchemy';
import { useQRBridge } from '@/hooks/studio/useQRBridge';
import { useInterviewMode } from '@/hooks/studio/useInterviewMode';
import { QRController } from './QRController';
import { BeatSheet } from './BeatSheet';
import { useTableRead } from '@/hooks/studio/useTableRead';

/**
 * Helper: Aspect-Ratio Preserving Center-Crop Canvas Drawer.
 * Prevents stretching / distorting webcam photos or video frames into 2:3 vertical aspect ratio.
 */
function drawAspectCover(
  ctx: CanvasRenderingContext2D,
  source: HTMLVideoElement | HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  flipHorizontal: boolean = false
) {
  const srcWidth = (source instanceof HTMLVideoElement) ? (source.videoWidth || 1280) : source.width;
  const srcHeight = (source instanceof HTMLVideoElement) ? (source.videoHeight || 720) : source.height;

  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  let sx = 0, sy = 0, sw = srcWidth, sh = srcHeight;

  if (srcRatio > targetRatio) {
    sw = srcHeight * targetRatio;
    sx = (srcWidth - sw) / 2;
  } else {
    sh = srcWidth / targetRatio;
    sy = (srcHeight - sh) / 2;
  }

  ctx.save();
  if (flipHorizontal) {
    ctx.translate(targetWidth, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
  ctx.restore();
}
import { TableReadPanel } from './TableReadPanel';
import { StudioBriefing } from './StudioBriefing';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { app, storage, db } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import localforage from 'localforage';
import { RecordEditingSuite } from './RecordEditingSuite';
import { DirectorialUpsellDialog } from './overlays/DirectorialUpsellDialog';
import { uploadFileInChunks } from '@/utils/storage/resumableUpload';
import { HotspotOverlay } from './HotspotOverlay';

interface RoomProps {
    data: Memory;
    update: (updatedData: Partial<Memory> | ((prev: Partial<Memory>) => Partial<Memory>)) => void;
    modality?: 'pen' | 'voice' | null;
    setModality?: (val: 'pen' | 'voice' | null) => void;
    onWordCountChange?: (count: number) => void;
    currentStage?: number;
    mentorActive?: boolean;
    onToggleMentor?: (manual?: boolean) => void;
    onClarityChange?: (clarity: number) => void;
    onNext?: () => void;
    onPrev?: () => void;
    isComplete?: boolean;
    charge?: number;
    wordCount?: number;
    highlightClarity?: boolean;
    onboardingJustClosed?: boolean;
    isUntouched?: boolean;
    onActivity?: () => void;
    formRef?: React.RefObject<any>;
    onClearBackup?: () => void;
    onSelectRoom?: (room: 'solo' | 'collaborative' | 'guest') => void;
    onTheaterToggle?: (isOpen: boolean) => void;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const totalSeconds = Math.floor(seconds);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function SoloStage({ 
  data, update, modality, setModality, onWordCountChange, 
  currentStage, mentorActive, onToggleMentor, onClarityChange,
  onNext, onPrev, isComplete, charge, wordCount, highlightClarity,
  onboardingJustClosed, isUntouched, onActivity, formRef, onClearBackup,
  onSelectRoom, onTheaterToggle
}: RoomProps) {
  const [mounted, setMounted] = useState(false);
  const { user, syncStatus } = useAuth();
  const userId = data?.userId || user?.uid;
  const { 
    isReviewing, 
    isProductionLocked, 
    selectedTake, 
    fontSize, 
    captureModality, 
    isScrolling,
    showBreathingMarks,
    enablePunctuationBraking,
    isolateSentenceHighlight,
    isRehearsing,
    rehearsalSpeed: globalRehearsalSpeed,
    sessionId,
    actions: globalActions 
  } = useStudioState();
  const { traceInteraction, logEvent } = useJourneyLogger(userId, sessionId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleGlobalClick = (e: any) => {
        traceInteraction(e);
      };
      window.addEventListener('click', handleGlobalClick, { capture: true });
      return () => {
        window.removeEventListener('click', handleGlobalClick, { capture: true });
      };
    }
  }, [traceInteraction]);

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Safety guard: If selectedTake is null/empty but the user has saved prose or description in data, initialize it.
  useEffect(() => {
    if ((data?.prose || data?.description) && !selectedTake) {
      const fallbackText = data.prose || data.description;
      console.log("[SoloStage] Auto-syncing selectedTake fallback from data:", fallbackText.substring(0, 40) + "...");
      if (typeof globalActions?.setSelectedTake === 'function') {
        globalActions.setSelectedTake(fallbackText);
      }
    }
  }, [data?.prose, data?.description, selectedTake, globalActions]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 100]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);
  // Tracks whether the master reel video is still buffering its first frame.
  // Starts true on every new previewUrl — cleared by onCanPlay / onError.
  const [isVideoBuffering, setIsVideoBuffering] = useState(true);

  // Guest Upsell State
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState("saving your memory");

  const checkGuestAndUpsell = (feature: string) => {
    const hasActivePass = user?.directorPassStatus === 'free_host_pass_active' || user?.directorPassStatus === 'paid_host_pass_active';
    if (!user || !hasActivePass) {
      setUpsellFeature(feature);
      setIsUpsellOpen(true);
      return true; // Is guest or expired, block action
    }
    return false; // Not guest, proceed
  };

  // Rehydrate trimRange when Firestore data or videoDuration loads (default trimStart to 0 for zero-start playhead integrity)
  useEffect(() => {
    const start = 0;
    const end = data?.trimEnd ?? (videoDuration || 100);
    setTrimRange([start, end]);
  }, [data?.trimEnd, videoDuration]);

  // Cinematic Pipeline State (Shared via Firestore)
  // BUGFIX: Prioritize global stage from prop, but allow local data fallback ONLY if prop is undefined.
  // We use currentStage prop as the source of truth from ProductionDeck.
  const productionStage = currentStage ?? (data?.productionStage || 0);

  // MOD-12: AI Interviewer State
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [interviewLanguage, setInterviewLanguage] = useState<'en' | 'gu'>('en');
  const [isFluidMode, setIsFluidMode] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('Achird');
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isAnalyzingFraming, setIsAnalyzingFraming] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  
  // MOD-13: Sound Check State
  const [showSoundCheck, setShowSoundCheck] = useState(false);
  const [hasDoneMicFeedback, setHasDoneMicFeedback] = useState(false);
  
  // MOD-14: Cinematic Polish State
  const [prompterSize, setPrompterSize] = useState<'mini' | 'sm' | 'md' | 'lg'>('md');
  const [prompterLayout, setPrompterLayout] = useState<'side' | 'center'>('side');
  const [techAlignmentConfirmed, setTechAlignmentConfirmed] = useState(false);
  const [opticsBrightness, setOpticsBrightness] = useState(100);
  const [opticsContrast, setOpticsContrast] = useState(110);
  const [opticsFilter, setOpticsFilter] = useState<'default' | 'warm' | 'cool' | 'noir'>('default');
  const [isTheaterExpanded, setIsTheaterExpanded] = useState(false);
  const [premiereMode, setPremiereMode] = useState<PremiereMode>('fusion');


  // Minimise / Restore panel states (pre-flight checks calibration stage)
  const [isDirectorMinimised, setIsDirectorMinimised] = useState(false);
  const [isTechScoutMinimised, setIsTechScoutMinimised] = useState(false);
  const [isOpticsMinimised, setIsOpticsMinimised] = useState(false);

  // MOD-17: Table Read (Acoustic Rehearsal Mode) State Triggers
  const {
    isTableReadActive,
    setIsTableReadActive,
    rehearsalSpeed,
    setRehearsalSpeed,
    captureLayoutSnapshot,
    restoreLayoutSnapshot
  } = useTableRead();
  const [showRehearsalFeedback, setShowRehearsalFeedback] = useState(false);

  // MW-48: Unified HUD & Focus Mode State Variables
  const [activeDirectorTab, setActiveDirectorTab] = useState<'director' | 'rehearse'>('director');
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);

  const handleEngageRehearsal = useCallback(() => {
    captureLayoutSnapshot(prompterLayout, prompterSize, fontSize);
    setIsTableReadActive(true);
    toast.info("Entering Acoustic Rehearsal", {
      description: "Sidebar calibration controls minimised. Zen performance stage engaged."
    });
  }, [prompterLayout, prompterSize, fontSize, captureLayoutSnapshot, setIsTableReadActive]);

  const handleEndRehearsal = useCallback(() => {
    setIsTableReadActive(false);
    const snap = restoreLayoutSnapshot();
    if (snap) {
      setPrompterLayout(snap.layout);
      setPrompterSize(snap.size);
      globalActions.setFontSize(snap.fontSize);
    }
    toast.success("Rhythm Authorised", {
      description: "Stage layout successfully restored to your previous blueprint configuration."
    });
  }, [restoreLayoutSnapshot, setIsTableReadActive, globalActions]);

  const prompterWidth = isInterviewMode 
    ? (prompterSize === 'mini' ? 280 : prompterSize === 'sm' ? 440 : prompterSize === 'md' ? 620 : 800)
    : (prompterSize === 'mini' ? 280 : prompterSize === 'sm' ? 480 : prompterSize === 'md' ? 680 : 880);

  const prompterHeight = isInterviewMode
    ? (prompterSize === 'mini' ? 180 : prompterSize === 'sm' ? 360 : prompterSize === 'md' ? 480 : 640)
    : (prompterSize === 'mini' ? 180 : prompterSize === 'sm' ? 360 : prompterSize === 'md' ? 560 : 740);

  const stageRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  
  // QR Mobile Remote Bridge
  const { peerState, bridgeStatus } = useQRBridge(data?.id);
  
  // Interview Modality Modeler
  const {
    modalityMode,
    setModalityMode,
    toggleModalityMode,
    triggerNextCue,
    activeBeatIndex,
    setActiveBeatIndex
  } = useInterviewMode(productionStage === 2 ? 'interview' : 'scripted');

  // Automatically auto-start Interview Mode when modalityMode is set to 'interview'
  useEffect(() => {
    if (modalityMode === 'interview') {
      setIsInterviewMode(true);
    } else {
      setIsInterviewMode(false);
    }
  }, [modalityMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTheaterExpanded) {
        setIsTheaterExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheaterExpanded]);
  

  const unmuteOptics = useCallback(() => {
    console.log("[SoloStage] Unmuting optics via Tech-Scout ceremony hotspot...");
    localStorage.setItem('privacy_optics_muted', 'false');
    window.dispatchEvent(new Event('privacy-optics-changed'));
  }, []);

  const setProductionStage = (stage: number) => {
    console.log(`[SoloStage] Advancing to Stage: ${stage}`);
    update((prev: any) => ({ ...prev, productionStage: stage }));
    globalActions.setStage(stage);
  };



  // Wireless Camera/Lens setup state
  const [isCameraQRModalOpen, setIsCameraQRModalOpen] = useState(false);
  const [hostIP, setHostIP] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studio_host_ip');
      if (saved) return saved;
      return window.location.hostname;
    }
    return '';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && hostIP) {
      localStorage.setItem('studio_host_ip', hostIP);
    }
  }, [hostIP]);

  const cameraPairingUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${hostIP || window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/studio/remote-camera?sessionId=solo-remote-${data?.id}-host`
    : '';

  // 1. Initialize local Camera stream (Only when explicitly enabled)
  const { 
    stream, 
    error, 
    cameraError, 
    isMuted, 
    capabilities, 
    applyZoom, 
    zoomValue, 
    switchCamera, 
    hasMultipleCameras,
    activeInput,
    switchInput,
    isWirelessLinked
  } = useCamera({ enabled: isCameraActive });
  const [isPersistenceSaving, setIsPersistenceSaving] = useState(false);
  const [reviewTake, setReviewTake] = useState(false);
  const [reviewVideoUrl, setReviewVideoUrl] = useState<string | null>(null);
  const reviewVideoRef = useRef<HTMLVideoElement>(null);
  const [reviewPlaying, setReviewPlaying] = useState(true);
  const [reviewEnded, setReviewEnded] = useState(false);
  const [reviewCurrentTime, setReviewCurrentTime] = useState(0);
  const [reviewDuration, setReviewDuration] = useState(0);
  const [reviewMuted, setReviewMuted] = useState(false);
  const [isStitching, setIsStitching] = useState(false);
  const [stitchingStatus, setStitchingStatus] = useState("Initializing transcode engine...");
  const [showStitchFallbackModal, setShowStitchFallbackModal] = useState(false);
  const [stuckEdl, setStuckEdl] = useState<any[]>([]);

  // Automatically close the Wireless Lens Bridge modal once linked
  useEffect(() => {
    if (isWirelessLinked && isCameraQRModalOpen) {
      console.log("[SoloStage] Wireless lens linked! Automatically closing pairing modal.");
      setIsCameraQRModalOpen(false);
      toast.success("Wireless Lens Connected", {
        description: "Your smartphone feed is now active and selected as the main camera stream!"
      });
    }
  }, [isWirelessLinked, isCameraQRModalOpen]);
  
  // 2. Bind the robust MediaRecorder Hook
  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    punchIn,
    recordingTime, 
    isWarningLimit,
    recordedBlob,
    recordedSegments,
    setRecordedSegments,
    clearRecording,
    uploadVideo,
    uploadMediaBlob,
    uploading, 
    uploadProgress, 
    uploadResult 
  } = useMediaRecorder(stream);

  // Synchronise useMediaRecorder's isRecording state to global studio state context
  useEffect(() => {
    if (typeof globalActions?.setRecording === 'function') {
      globalActions.setRecording(isRecording);
    }
  }, [isRecording, globalActions]);

  // Resiliency Shield: Unsaved take detection & recovery
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [cachedTakeBlob, setCachedTakeBlob] = useState<Blob | null>(null);
  const recoveredKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (productionStage > 2 || (recordedSegments && recordedSegments.length > 0)) {
      setShowRestorePrompt(false);
      return;
    }
    if (!data?.id) {
      console.log("[SoloStage] Resiliency Shield: No active memory ID to perform local storage backup scan.");
      return;
    }

    console.log("[SoloStage] Resiliency Shield: Initiating multi-key scan in IndexedDB...");

    localforage.keys()
      .then(async (keys) => {
        const backupKeys = keys.filter(k => k.startsWith('backup_take_'));
        
        let matchedBlob: Blob | null = null;
        let matchedKey: string | null = null;

        // 1. Try to find an exact match first (by ID or promptId)
        for (const key of backupKeys) {
          try {
            const item = await localforage.getItem<any>(key);
            if (!item) continue;

            let matches = false;
            let blob: Blob | null = null;

            if (item instanceof Blob) {
              // Legacy raw blob matching
              const keyId = key.replace('backup_take_', '');
              if (keyId === data.id || (data.promptId && keyId === data.promptId)) {
                matches = true;
                blob = item;
              }
            } else if (item && typeof item === 'object' && item.blob) {
              // Structured object matching
              if (item.memoryId === data.id || 
                  (data.promptId && item.promptId === data.promptId) ||
                  (item.promptId && item.promptId === data.id)) {
                matches = true;
                blob = item.blob;
              }
            }

            if (matches && blob && blob.size > 0) {
              console.log(`[SoloStage] Resiliency Shield: Match found for key "${key}" (${blob.size} bytes)`);
              matchedBlob = blob;
              matchedKey = key;
              break;
            }
          } catch (e) {
            console.warn(`[SoloStage] Error scanning key ${key}:`, e);
          }
        }

        // 2. Global Fallback: If no exact match, restore the most recent unsaved backup in IndexedDB
        if (!matchedBlob && backupKeys.length > 0) {
          console.log("[SoloStage] Resiliency Shield: No exact match found. Engaging global recovery fallback...");
          // Grab the first available backup key
          const bestKey = backupKeys[0];
          try {
            const item = await localforage.getItem<any>(bestKey);
            if (item) {
              let blob: Blob | null = null;
              if (item instanceof Blob) {
                blob = item;
              } else if (item && typeof item === 'object' && item.blob) {
                blob = item.blob;
              }

              if (blob && blob.size > 0) {
                console.log(`[SoloStage] Resiliency Shield: Global fallback match SUCCESS! Key: "${bestKey}" (${blob.size} bytes)`);
                matchedBlob = blob;
                matchedKey = bestKey;
              }
            }
          } catch (e) {
            console.warn(`[SoloStage] Error retrieving global fallback key ${bestKey}:`, e);
          }
        }

        if (matchedBlob && matchedBlob.size > 0) {
          setCachedTakeBlob(matchedBlob);
          recoveredKeyRef.current = matchedKey;
          setShowRestorePrompt(true);
          
          toast.info("Unstitched Take Detected", {
            description: "We found an unsaved recording from your previous session. Use the recovery banner to restore or discard it.",
            id: `unsaved-take-${data?.id}`,
            duration: 8000
          });
        } else {
          console.log("[SoloStage] Resiliency Shield: Scan complete. No unsaved take found.");
        }
      })
      .catch((err) => {
        console.warn("[SoloStage] Resiliency Shield: Error listing IndexedDB keys:", err);
      });
  }, [data?.id, data?.promptId, productionStage, recordedSegments?.length]);

  const handleRestoreTake = async () => {
    if (!cachedTakeBlob) return;
    
    console.log("[SoloStage] Restoring unsaved take from IndexedDB...");
    
    // Sniff the true duration of the video blob to prevent playback lockup
    let duration = 15; // default fallback
    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    
    if (!isTest && typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        duration = await new Promise<number>((resolve) => {
          const video = document.createElement('video');
          video.preload = 'auto'; // Ensure full local blob is loaded for seeking
          video.muted = true;
          video.playsInline = true;
          
          // Hide it off-screen and append to DOM to prevent Chrome from throttling media operations
          video.style.position = 'fixed';
          video.style.top = '-9999px';
          video.style.left = '-9999px';
          video.style.width = '1px';
          video.style.height = '1px';
          video.style.opacity = '0';
          video.style.pointerEvents = 'none';
          document.body.appendChild(video);
          
          const tempUrl = URL.createObjectURL(cachedTakeBlob);
          let resolved = false;

          console.log(`[SoloStage:Sniffer] Created object URL: ${tempUrl}. Size: ${cachedTakeBlob.size} bytes`);

          const cleanup = () => {
            if (resolved) return;
            resolved = true;
            try {
              URL.revokeObjectURL(tempUrl);
            } catch (e) {}
            try {
              video.remove(); // Remove from DOM
            } catch (e) {}
            video.onloadedmetadata = null;
            video.onerror = null;
            video.onseeked = null;
          };

          video.onloadedmetadata = () => {
            const dur = video.duration;
            console.log(`[SoloStage:Sniffer] onloadedmetadata. duration = ${dur}`);
            if (dur === Infinity || isNaN(dur)) {
              console.log("[SoloStage:Sniffer] WebM/MediaRecorder live stream dynamic seeking workaround triggered.");
              video.currentTime = 1e9; // Seek to end
              video.onseeked = () => {
                const finalDur = (video.duration === Infinity || isNaN(video.duration)) ? video.currentTime : video.duration;
                console.log(`[SoloStage:Sniffer] onseeked. finalDur = ${finalDur}, video.duration = ${video.duration}, video.currentTime = ${video.currentTime}`);
                cleanup();
                if (typeof finalDur === 'number' && isFinite(finalDur) && finalDur > 0) {
                  resolve(finalDur);
                } else {
                  console.warn("[SoloStage:Sniffer] finalDur is not valid number, using 15 fallback");
                  resolve(15);
                }
              };
            } else {
              cleanup();
              if (typeof dur === 'number' && isFinite(dur) && dur > 0) {
                resolve(dur);
              } else {
                console.warn("[SoloStage:Sniffer] dur is not valid number, using 15 fallback");
                resolve(15);
              }
            }
          };

          video.onerror = (e) => {
            console.error("[SoloStage:Sniffer] video.onerror triggered:", video.error);
            cleanup();
            resolve(15);
          };

          // Safe 10-second guard to prevent hanging if decoder loops on corrupted stream
          setTimeout(() => {
            if (!resolved) {
              console.warn("[SoloStage:Sniffer] Sniffing video duration timed out (10s limit), using fallback.");
              cleanup();
              resolve(15);
            }
          }, 10000);

          video.src = tempUrl;
        });
      } catch (e) {
        console.warn("[SoloStage] Sniffing video duration encountered an error, using fallback:", e);
      }
    }

    console.log(`[SoloStage] Sniffed restored take duration: ${duration}s`);

    const restoredSegment: EDLTrackSegment = {
      segmentId: `seg_restored_${Date.now()}`,
      blob: cachedTakeBlob,
      blobUrl: URL.createObjectURL(cachedTakeBlob),
      startOffset: 0,
      endOffset: duration,
      duration: duration
    };
    
    setRecordedSegments([restoredSegment]);
    setReviewTake(true); // Open review overlay immediately
    setShowRestorePrompt(false);
    
    // Clear the source IndexedDB backups so they don't get re-matched
    if (recoveredKeyRef.current) {
      localforage.removeItem(recoveredKeyRef.current).catch(() => {});
    }
    if (data?.id) {
      localforage.removeItem(`backup_take_${data.id}`).catch(() => {});
    }
    if (data?.promptId) {
      localforage.removeItem(`backup_take_${data.promptId}`).catch(() => {});
    }
    
    // Automatically advance to Act III (Capture) if not already there
    if (typeof globalActions?.setStage === 'function') {
      globalActions.setStage(2);
    }
    update({ productionStage: 2 });
    
    toast.success("Take Restored", {
      description: "Your previous recording session has been successfully recovered!"
    });
  };

  // Trigger vocal director feedback on stop recording ("Cut!" or "That's a wrap!")
  const wasRecordingRef = useRef(false);
  useEffect(() => {
    if (wasRecordingRef.current && !isRecording) {
      const duration = recordingTime;
      const phrase = duration >= 15 ? "That's a wrap!" : "Cut!";
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.rate = 1.15;
        utterance.volume = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en-'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        window.speechSynthesis.speak(utterance);
      }
    }
    wasRecordingRef.current = isRecording;
  }, [isRecording, recordingTime]);

  // Bind Cinematic Capture & Sealing Hooks
  const {
    countIn,
    isCountingIn,
    statusLabel,
    startCapture,
    cancelCapture
  } = useCaptureLogic({
    stream,
    startRecording,
    stopRecording,
    isRecording
  });

  // Automatically force layout based on Interview Mode and recording / counting-in states
  useEffect(() => {
    if (isInterviewMode) {
      if (isRecording || isCountingIn) {
        if (prompterLayout !== 'center') {
          setPrompterLayout('center');
        }
      } else {
        if (prompterLayout !== 'side') {
          setPrompterLayout('side');
        }
      }
    }
  }, [isInterviewMode, isRecording, isCountingIn, prompterLayout]);

  // Check if both windows are open and active in interview modality before camera starts rolling
  const handleStartCapture = useCallback(() => {
    if (!isCameraActive) {
      console.log('[SoloStage] Activating optics camera hardware prior to capture initiation...');
      setIsCameraActive(true);
    }
    if (modalityMode === 'interview' || isInterviewMode) {
      setIsInterviewMode(true);
      setPrompterLayout('center');
    }
    startCapture();
  }, [isCameraActive, modalityMode, isInterviewMode, startCapture]);

  // Listen to remote reset / restart take commands safely
  useEffect(() => {
    const handleRestartTake = () => {
      cancelCapture();
      setActiveBeatIndex(0);
      toast.info("Take Restarted", { description: "Prompt scroll position and recording state have been safely reset." });
    };
    window.addEventListener('studio-restart-take', handleRestartTake);
    return () => window.removeEventListener('studio-restart-take', handleRestartTake);
  }, [cancelCapture, setActiveBeatIndex]);

  // Listen to remote toggle camera events from Pop-out
  useEffect(() => {
    const handleToggleCamera = (e: Event) => {
      const customEvent = e as CustomEvent;
      const active = customEvent.detail?.active;
      console.log('[SoloStage] Received remote studio-toggle-camera custom event. Setting camera state to:', active);
      setIsCameraActive(active !== undefined ? active : !isCameraActive);
    };
    window.addEventListener('studio-toggle-camera', handleToggleCamera);
    return () => window.removeEventListener('studio-toggle-camera', handleToggleCamera);
  }, [isCameraActive]);

  // Listen to remote start performance event from Pop-out
  useEffect(() => {
    const handleStartPerformance = () => {
      console.log('[SoloStage] Received remote studio-start-performance custom event. Initiating capture...');
      if (!isRecording && !isCountingIn && techAlignmentConfirmed) {
        handleStartCapture();
      } else {
        console.warn('[SoloStage] Cannot start capture: ', { isRecording, isCountingIn, techAlignmentConfirmed });
      }
    };
    window.addEventListener('studio-start-performance', handleStartPerformance);
    return () => window.removeEventListener('studio-start-performance', handleStartPerformance);
  }, [isRecording, isCountingIn, techAlignmentConfirmed, handleStartCapture]);

  // Listen to remote stop performance event from Pop-out
  useEffect(() => {
    const handleStopPerformance = () => {
      console.log('[SoloStage] Received remote studio-stop-performance custom event. Stopping recording...');
      stopRecording();
      setIsCameraActive(false);
    };
    window.addEventListener('studio-stop-performance', handleStopPerformance);
    return () => window.removeEventListener('studio-stop-performance', handleStopPerformance);
  }, [stopRecording]);

  // MOD-15: Auto-minimise calibration panels and auto-start interviewer mode when recording starts
  useEffect(() => {
    if (isRecording) {
      console.log('[SoloStage] Recording active. Collapsing pre-flight panels and engaging performance modes...');
      setIsDirectorMinimised(true);
      setIsTechScoutMinimised(true);
      setIsOpticsMinimised(true);
      
      // Auto-start Interview Mode if 'interview' modality is selected in the script header
      if (modalityMode === 'interview') {
        setIsInterviewMode(true);
      }
    }
  }, [isRecording, modalityMode]);

  // Auto-minimise AI Director mentor panel when Interview mode / Start Interview is engaged/open
  useEffect(() => {
    if (isInterviewMode && techAlignmentConfirmed) {
      setIsDirectorMinimised(true);
    }
  }, [isInterviewMode, techAlignmentConfirmed]);



  // Enforce a strict 6-minute (360 seconds) hard recording limit on the desktop
  useEffect(() => {
    if (!isRecording) return;
    
    if (recordingTime === 300) {
      toast.warning("Recording Limit Warning", {
        description: "You have reached 5 minutes. A hard stop will be enforced in 1 minute (60 seconds)!",
        duration: 10000
      });
    }
    
    if (recordingTime >= 360) {
      toast.success("Hard Limit Reached", {
        description: "Enforcing 6-minute limit. Safely stopping and preserving your take..."
      });
      stopRecording();
      setIsCameraActive(false);
    }
  }, [isRecording, recordingTime, stopRecording]);

  // Floating Remote Command Alert Overlay
  const [remoteCommandAlert, setRemoteCommandAlert] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleRemoteCommand = (e: Event) => {
      const customEvent = e as CustomEvent<{ command: string }>;
      const cmd = customEvent.detail?.command;
      if (!cmd) return;
      
      const labelMap: Record<string, string> = {
        PLAY_PAUSE: 'Remote Scroll Toggled',
        NEXT_CUE: 'Remote Advancing Cue',
        RESTART_TAKE: 'Remote Restarting Take'
      };
      
      setRemoteCommandAlert(labelMap[cmd] || 'Remote Command Received');
      
      clearTimeout(timer);
      timer = setTimeout(() => {
        setRemoteCommandAlert(null);
      }, 1500);
    };
    
    window.addEventListener('studio-remote-command', handleRemoteCommand);
    return () => {
      window.removeEventListener('studio-remote-command', handleRemoteCommand);
      clearTimeout(timer);
    };
  }, []);

  const {
    isSaving: isAlchemySaving,
    progress: alchemyProgress,
    error: alchemyError,
    isComplete: isAlchemyComplete,
    isRetrying: isAlchemyRetrying,
    startAlchemy
  } = useAlchemy({
    userId: data?.userId,
    memoryId: data?.id,
    promptId: data?.promptId,
    selectedTake: selectedTake || data?.prose || data?.description || null,
    wordCount: wordCount || 0,
    onComplete: () => {
      console.log("[SoloStage] Alchemy Complete! Advancing production deck to Act IV.");
    }
  });

  const lastAttemptedBlobRef = useRef<Blob | null>(null);

  // Memoize recordedBlob URL safely to avoid browser memory leaks and duplicate URL instantiations
  useEffect(() => {
    if (!recordedBlob) {
      if (data?.videoUrl) {
        setReviewVideoUrl(data.videoUrl);
      } else {
        setReviewVideoUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(recordedBlob);
    setReviewVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [recordedBlob, data?.videoUrl]);

  // Auto-engage Review Take Mode on Act III load if a recorded video performance exists
  useEffect(() => {
    if (currentStage === 2 && (recordedBlob || data?.videoUrl)) {
      setReviewTake(true);
      if (data?.videoUrl && !recordedBlob) {
        setReviewVideoUrl(data.videoUrl);
      }
    }
  }, [currentStage, data?.videoUrl, recordedBlob]);

  // Intercept MediaRecorder stop event and trigger Review overlay before sealing
  useEffect(() => {
    if (recordedBlob && recordedBlob !== lastAttemptedBlobRef.current && !isAlchemySaving && !isAlchemyComplete) {
      lastAttemptedBlobRef.current = recordedBlob;
      console.log(`[SoloStage] SUCCESS: Compiled performance reel acquired (${recordedBlob.size} bytes). Triggering Review overlay...`);
      setReviewTake(true);
      setReviewPlaying(true);
      setReviewEnded(false);
    }
  }, [recordedBlob, isAlchemySaving, isAlchemyComplete]);

  // Force loading video source when review takeover becomes active to fix dynamic blob loading bugs in Safari/Chrome
  useEffect(() => {
    if (reviewTake && reviewVideoUrl && reviewVideoRef.current) {
      console.log("[SoloStage] Review takeover active. Force loading video stream source...");
      try {
        reviewVideoRef.current.load();
      } catch (err) {
        console.error("[SoloStage] Error loading video source:", err);
      }
    }
  }, [reviewTake, reviewVideoUrl]);

  const toggleReviewPlay = () => {
    console.log("[SoloStage] toggleReviewPlay invoked. Ref:", reviewVideoRef.current);
    if (reviewVideoRef.current) {
      if (reviewEnded) {
        reviewVideoRef.current.currentTime = 0;
        reviewVideoRef.current.play()
          .then(() => {
            console.log("[SoloStage] Replay started successfully.");
            setReviewEnded(false);
          })
          .catch(err => {
            console.error("[SoloStage] Replay failed:", err);
            toast.error("Playback Failed", {
              description: "The browser blocked unmuted video autoplay. Please click play again."
            });
          });
      } else if (reviewVideoRef.current.paused) {
        reviewVideoRef.current.play()
          .then(() => {
            console.log("[SoloStage] Play started successfully.");
          })
          .catch(err => {
            console.error("[SoloStage] Play failed:", err);
            toast.error("Playback Failed", {
              description: "Playback blocked. Please interact directly with the player to enable video."
            });
          });
      } else {
        reviewVideoRef.current.pause();
        console.log("[SoloStage] Play paused manually.");
      }
    }
  };

  const formatReviewTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const stopReviewVideo = () => {
    if (reviewVideoRef.current) {
      reviewVideoRef.current.pause();
      reviewVideoRef.current.currentTime = 0;
      setReviewEnded(false);
      setReviewCurrentTime(0);
    }
  };

  const toggleReviewMute = () => {
    if (reviewVideoRef.current) {
      const nextMuted = !reviewVideoRef.current.muted;
      reviewVideoRef.current.muted = nextMuted;
      setReviewMuted(nextMuted);
    }
  };

  const handleStitchAndApprove = async (edl: any[]) => {
    // DEMO SANDBOX SHIELD: Keep demo takes purely in-memory (blobUrls) and block cloud storage uploads
    if (data?.promptId === 'p_einstein' || data?.id === 'p_einstein') {
      setUpsellFeature("cloud stitching & 4K vault publishing");
      setIsUpsellOpen(true);
      return;
    }
    if (checkGuestAndUpsell("video stitching & cinema publishing")) return;
    if (edl.length === 0) return;
    
    setIsStitching(true);

    let activeMemoryId = data?.id;

    try {
      // IMMUTABILITY GATES SHIELD: Auto-clone the template document to a unique private user session
      if (activeMemoryId === 'p_einstein') {
        console.log("[SoloStage] Auto-cloning public template document 'p_einstein' into private user session...");
        
        if (!user?.uid) {
          throw new Error("User authentication is required to save progress.");
        }
        
        const memoriesRef = collection(db, 'users', user.uid, 'memories');
        const cleanEinsteinTemplate = {
          title: "Albert Einstein: Spacetime & Imagination",
          description: "Reconstruct early foundations and creative milestones from Albert Einstein's historical timeline.",
          promptId: "p_einstein",
          status: "draft",
          prose: data?.prose || "",
          sensoryConfig: data?.sensoryConfig || [],
          productionStage: 1, // Advance to recording stage
          createdAt: new Date().toISOString()
        };

        const newDocRef = await addDoc(memoriesRef, cleanEinsteinTemplate);
        activeMemoryId = newDocRef.id;
        
        console.log(`[SoloStage] Auto-cloned 'p_einstein' successfully. Private memory document target: ${activeMemoryId}`);
        
        // Push the update to parent state to align context
        update({ id: activeMemoryId });
        
        // Dynamically update the browser address bar silently without triggering remounting
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/studio/production/${activeMemoryId}`);
        }
      }

      console.log("[SoloStage] Uploading segments sequentially to Storage...");
      setStitchingStatus("Preparing segment uploads...");
      // Upload each segment blob
      for (let i = 0; i < edl.length; i++) {
        const seg = edl[i];
        const storagePath = `users/${userId || user?.uid}/memories/${activeMemoryId}/segments/${seg.segmentId}.webm`;
        const storageRef = ref(storage, storagePath);
        console.log(`[SoloStage] Uploading segment ${seg.segmentId} (${seg.blob.size} bytes)...`);
        
        let uploadSucceeded = false;
        
        try {
          // 1. Try to generate GCS Resumable Upload Session URL
          const sessionResponse = await fetch('/api/storage/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filePath: storagePath,
              contentType: 'video/webm',
              bucketName: storage.app.options.storageBucket
            })
          });
          
          if (sessionResponse.ok) {
            const { sessionUrl } = await sessionResponse.json();
            if (sessionUrl) {
              console.log("[SoloStage] Using GCS Native Resumable Session URL for segment upload...");
              await uploadFileInChunks(seg.blob, sessionUrl, 2 * 1024 * 1024, (progress) => {
                setStitchingStatus(`Uploading take segment ${i + 1} of ${edl.length} (${progress.percentage}%)...`);
              });
              uploadSucceeded = true;
            }
          }
        } catch (resumableErr) {
          console.warn("[SoloStage] GCS Resumable Chunk upload failed or unavailable. Falling back to direct upload...", resumableErr);
        }
        
        // 2. Fallback to standard uploadBytesResumable if chunk upload failed or was skipped
        if (!uploadSucceeded) {
          console.log("[SoloStage] Performing standard direct payload upload fallback...");
          const uploadTask = uploadBytesResumable(storageRef, seg.blob);
          if (uploadTask && typeof (uploadTask as any).on === 'function') {
            await new Promise<void>((resolve, reject) => {
              (uploadTask as any).on('state_changed',
                (snapshot: any) => {
                  const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                  setStitchingStatus(`Uploading take segment ${i + 1} of ${edl.length} (${progress}%)...`);
                },
                (error: any) => reject(error),
                () => resolve()
              );
            });
          } else {
            await uploadTask;
          }
        }
      }

      // Upload edl.json manifest
      setStitchingStatus("Persisting edit decision list manifest...");
      const manifest = edl.map(seg => ({
        segmentId: seg.segmentId,
        startOffset: seg.startOffset,
        endOffset: seg.endOffset,
        duration: seg.duration
      }));
      const edlBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const edlPath = `users/${userId || user?.uid}/memories/${activeMemoryId}/edl.json`;
      const edlRef = ref(storage, edlPath);
      console.log("[SoloStage] Uploading EDL manifest...");
      await uploadBytesResumable(edlRef, edlBlob);

      // Trigger Cloud Function
      console.log("[SoloStage] Triggering Cloud Function stitchPerformanceReel...");
      const functionsInstance = getFunctions(app);
      const stitchPerformanceReel = httpsCallable(functionsInstance, 'stitchPerformanceReel');
      
      toast.info("COMMENCING CINEMATIC STITCH...", {
        description: "Your editing layout is locked. Aligning memory segments..."
      });

      const simulateError = typeof window !== 'undefined' && localStorage.getItem('dev_simulate_transcoder_error') === 'true';
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      let resultData: { success: boolean; videoUrl: string };

      try {
        setStitchingStatus("Running cloud transcoding alignment (FFmpeg)...");
        const res = await stitchPerformanceReel({ 
          memoryId: activeMemoryId,
          simulateError: simulateError
        });
        resultData = res.data as { success: boolean; videoUrl: string };
      } catch (err: any) {
        if (isLocalhost) {
          console.warn("[SoloStage] Firebase Cloud Function failed/missing locally. Simulating transcode on localhost...", err);
          
          // Fallback: update Firestore document directly since Cloud Function isn't running locally
          const docRef = doc(db, 'users', userId || user?.uid || 'unknown', 'memories', data?.id || 'unknown');
          const firstSegmentPath = `users/${userId || user?.uid || 'unknown'}/memories/${data?.id || 'unknown'}/segments/${edl[0].segmentId}.webm`;
          const firstSegmentRef = ref(storage, firstSegmentPath);
          let fallbackVideoUrl = edl[0]?.blobUrl || '';
          try {
            fallbackVideoUrl = await getDownloadURL(firstSegmentRef);
            console.log("[SoloStage] Resolved real storage fallback download URL:", fallbackVideoUrl);
          } catch (storageErr) {
            console.warn("[SoloStage] Failed to get segment download URL, using local blob fallback:", storageErr);
          }
          
          await setDoc(docRef, { 
            videoUrl: fallbackVideoUrl,
            isProductionLocked: true,
            productionStage: 3 // Set to Stage 3 (Act IV - Cut)
          }, { merge: true });

          resultData = { success: true, videoUrl: fallbackVideoUrl };
          
          toast.warning("STITCH SIMULATED (LOCALHOST)", {
            description: "Using storage video stream fallback. Firestore advanced."
          });
        } else {
          console.error("[SoloStage] Production transcode failed. Launching user recovery fallback dialog...", err);
          setStuckEdl(edl);
          setShowStitchFallbackModal(true);
          return;
        }
      }

      if (resultData.success) {
        toast.success("STITCH COMPLETE", {
          description: "Your memory has been seamlessly compiled."
        });

        // Clear localforage cache key only AFTER the Cloud Function confirms a successful 'cinematic-ready' status
        const cacheKey = `backup_take_${data?.id}`;
        try {
          await localforage.removeItem(cacheKey);
          console.log(`[SoloStage] PERSISTENCE SHIELD: Successfully cleared IndexedDB backup: ${cacheKey}`);
          onClearBackup?.();
        } catch (e) {
          console.warn("[SoloStage] Persistence Shield cache cleanup warning:", e);
        }

        // Advance view / update stage
        setReviewTake(false);
        update({ 
          productionStage: 3, 
          isProductionLocked: true, 
          videoUrl: resultData.videoUrl 
        });

        // Trigger the AI Script Supervisor Analysis in the background
        generateDirectorsNotepad(activeMemoryId, resultData.videoUrl).catch(err => {
          console.error("[SoloStage] Background Director's Notepad analysis failed:", err);
        });
        if (typeof globalActions?.setStage === 'function') {
          globalActions.setStage(3);
        }
      } else {
        throw new Error("Stitching failed on the server.");
      }
    } catch (err: any) {
      console.error("[SoloStage] Splicing/Stitching failure:", err);
      toast.error("STITCHING FAILED", {
        description: err.message || "An unexpected error occurred during transcoding."
      });
    } finally {
      setIsStitching(false);
    }
  };

  const handleApproveTake = () => {
    if (recordedBlob) {
      lastAttemptedBlobRef.current = recordedBlob;
      console.log("[SoloStage] User approved take. Triggering Alchemy save...");
      startAlchemy(recordedBlob);
      setReviewTake(false);
      setReviewPlaying(true);
      setReviewEnded(false);
    }
  };

  const handleDiscardTake = () => {
    console.log("[SoloStage] User discarded take. Cleaning up resources...");
    clearRecording();
    lastAttemptedBlobRef.current = null;
    setReviewTake(false);
    setIsCameraActive(true);
    setReviewPlaying(true);
    setReviewEnded(false);
    
    // Clear IndexedDB cache immediately on discard
    if (data?.id) {
      const cacheKey = `backup_take_${data.id}`;
      localforage.removeItem(cacheKey).catch(() => {});
    }
    if (recoveredKeyRef.current) {
      localforage.removeItem(recoveredKeyRef.current).catch(() => {});
    }
    if (data?.promptId) {
      localforage.removeItem(`backup_take_${data.promptId}`).catch(() => {});
    }
    onClearBackup?.();
  };

  // Persistence Shield: Auto-cache recorded takes in IndexedDB as soon as recording completes
  useEffect(() => {
    if (!data?.id) return;
    const cacheKey = `backup_take_${data.id}`;
    
    if (recordedBlob && recordedBlob.size > 0) {
      console.log(`[SoloStage] Resiliency Shield: Auto-caching recorded Blob (${recordedBlob.size} bytes) to IndexedDB: ${cacheKey}...`);
      const cacheData = {
        blob: recordedBlob,
        memoryId: data.id,
        promptId: data.promptId || null,
        timestamp: Date.now()
      };
      localforage.setItem(cacheKey, cacheData)
        .catch((err) => console.warn("[SoloStage] Error auto-caching recordedBlob:", err));
    }
  }, [recordedBlob, data?.id, data?.promptId]);

  const micLevel = useAudioLevel(stream);
  
  // NEW: Tap into live MediaStream for frequency & volume monitoring
  const { volume, waveform } = useAudioMonitor(stream, cameraError);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [isReelTheaterOpen, setIsReelTheaterOpen] = useState(false);
  const [posterStyle, setPosterStyle] = useState<'vintage-35mm' | 'modern-legacy' | 'heritage-oil' | 'raw-authentic'>('modern-legacy');
  const [isGeneratingAIPoster, setIsGeneratingAIPoster] = useState(false);
  const [activeCarouselSlide, setActiveCarouselSlide] = useState<'video' | 'poster'>('video');

  // Dynamic CSS Visual Filters for Style Presets
  const getPosterStyleFilterClass = (style: 'vintage-35mm' | 'modern-legacy' | 'heritage-oil' | 'raw-authentic') => {
    switch (style) {
      case 'vintage-35mm':
        return 'sepia-[0.45] contrast-[1.2] saturate-[1.25] hue-rotate-[-10deg] brightness-[0.92] blur-[0.2px]';
      case 'modern-legacy':
        return 'contrast-[1.25] saturate-[1.2] brightness-[1.05] hue-rotate-[5deg]';
      case 'heritage-oil':
        return 'contrast-[1.3] saturate-[1.5] sepia-[0.3] brightness-[0.9] drop-shadow-[0_0_25px_rgba(245,158,11,0.4)]';
      case 'raw-authentic':
      default:
        return 'contrast-[1.05] saturate-[1.05]';
    }
  };

  const handleSelectPosterStyle = (styleId: 'vintage-35mm' | 'modern-legacy' | 'heritage-oil' | 'raw-authentic') => {
    setPosterStyle(styleId);
    update({ posterStyle: styleId as any });
    logEvent('HS_ACT4_POSTER_STYLE_CHANGE', { 
      style: styleId, 
      version: APP_VERSION 
    });
    const formattedStyle = styleId.replace('-', ' ').toUpperCase();
    toast.success(`Colour Grade Applied: ${formattedStyle}`, {
      description: "Live CSS colour filter updated. (Click 'Synthesize AI Key Art' to render new AI artwork).",
      icon: <CheckCircle2 className="w-4 h-4 text-amber-400" />
    });
  };

  const handleGenerateAIPoster = async () => {
    setIsGeneratingAIPoster(true);
    logEvent('HS_ACT4_GENERATE_AI_POSTER', { style: posterStyle, version: APP_VERSION });
    const formattedStyle = posterStyle.replace('-', ' ').toUpperCase();
    toast.info("Synthesising Generative AI Key Art...", {
      description: `Imagen AI is rendering custom ${formattedStyle} background artwork from your story prose.`
    });

    try {
      const sourceImage = localPosterUrl || data?.posterImageUrl || previewUrl;
      const response = await fetch('/api/ai/generate-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImage,
          storyText: data?.prose || data?.description || data?.originalHook || "Family memory legacy",
          style: posterStyle,
          title: "PART I: ROOTS & FOUNDATIONS",
          subtitle: data?.originalHook ? data.originalHook.slice(0, 60) + "..." : "Biographical Legacy Selection"
        })
      });

      const resData = await response.json();
      const posterUrl = resData?.posterUrl || sourceImage;

      setLocalPosterUrl(posterUrl);
      update({ posterImageUrl: posterUrl });

      toast.success("AI Generative Key Art Synthesised!", {
        description: `New ${formattedStyle} AI artwork composite generated and locked to poster frame.`
      });
    } catch (err) {
      console.warn("[SoloStage] AI Poster synthesis fallback triggered:", err);
      if (localPosterUrl || data?.posterImageUrl) {
        toast.success("Poster Refreshed with Selected Style", {
          description: `Applied ${formattedStyle} style grade preset to your active frame.`
        });
      }
    } finally {
      setIsGeneratingAIPoster(false);
    }
  };

  const [isPosterLightboxOpen, setIsPosterLightboxOpen] = useState(false);

  const handleOpenPosterLightbox = () => {
    setIsPosterLightboxOpen(true);
    logEvent('HS_ACT4_POSTER_LIGHTBOX_OPEN', {
      style: posterStyle,
      version: APP_VERSION
    });
  };

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showLivingRoomCastModal, setShowLivingRoomCastModal] = useState(false);
  const [isPinProtected, setIsPinProtected] = useState(false);
  const [sharePin, setSharePin] = useState('');

  const cinemaShareUrl = useMemo(() => {
    const basePin = isPinProtected && sharePin ? `&pin=${sharePin}` : '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/cinema?id=${data?.id || 'demo'}${basePin}`;
    }
    return `https://dev.memoryweaver.studio/cinema?id=${data?.id || 'demo'}${basePin}`;
  }, [data?.id, isPinProtected, sharePin]);

  const handleCopyCinemaLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cinemaShareUrl);
      toast.success("Cinema Share Link Copied!", {
        description: cinemaShareUrl,
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      });
      logEvent('HS_ACT4_CINEMA_LINK_COPY', { version: APP_VERSION });
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Watch my memory story '${data?.title || 'Part I: Roots and Foundations'}' on Memory Weaver Cinema: ${cinemaShareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    toast.success("Opening WhatsApp Share...", { icon: <MessageSquare className="w-4 h-4 text-emerald-400" /> });
  };

  const handleShareEmail = () => {
    const subject = `Inviting you to watch my memory story: ${data?.title || 'Part I: Roots and Foundations'}`;
    const body = `I've preserved an authentic oral history monologue on Memory Weaver Cinema.\n\nWatch it here: ${cinemaShareUrl}\n\nWith love,`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success("Opening Email App...", { icon: <Mail className="w-4 h-4 text-sky-400" /> });
  };

  // --- 4K KEY ART POSTER SYNTHESIS & DOWNLOAD ENGINE ---
  const handleDownloadPoster = async () => {
    const targetUrl = localPosterUrl || data?.posterImageUrl;
    if (!targetUrl) {
      toast.error("No Poster Anchored", { description: "Please generate or snap a poster frame first." });
      return;
    }

    logEvent('HS_ACT4_POSTER_DOWNLOAD', {
      style: posterStyle,
      version: APP_VERSION
    });

    const toastId = toast.loading("Synthesizing Ultra-HD 4K Key Art Poster...", {
      description: "Rendering 2400x3600 300 DPI typography & vector QR code..."
    });

    try {
      // 1. Create Ultra-HD 4K Canvas (2400 x 3600 px @ 300 DPI)
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 3600;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context initialization failed");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 2. Load base portrait image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = targetUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (err) => reject(err);
      });

      // Object-Fit Cover Math (Prevents Stretching / Distorting Webcam Photo)
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;

      if (imgRatio > canvasRatio) {
        sw = img.height * canvasRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / canvasRatio;
        sy = (img.height - sh) / 2;
      }

      ctx.save();
      // Apply active style filter grading
      if (posterStyle === 'vintage-35mm') ctx.filter = 'sepia(0.35) contrast(1.1) brightness(1.05)';
      else if (posterStyle === 'modern-legacy') ctx.filter = 'contrast(1.15) saturate(1.1)';
      else if (posterStyle === 'heritage-oil') ctx.filter = 'sepia(0.2) contrast(1.25) saturate(1.2)';
      else if (posterStyle === 'raw-authentic') ctx.filter = 'contrast(1.05)';

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 3. Draw Dark Cinematic Vignette Gradients
      const topGrad = ctx.createLinearGradient(0, 0, 0, 900);
      topGrad.addColorStop(0, 'rgba(2, 6, 23, 0.9)');
      topGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, canvas.width, 900);

      const bottomGrad = ctx.createLinearGradient(0, 1800, 0, 3600);
      bottomGrad.addColorStop(0, 'rgba(2, 6, 23, 0)');
      bottomGrad.addColorStop(0.4, 'rgba(2, 6, 23, 0.75)');
      bottomGrad.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, 1800, canvas.width, 1800);

      // 4. Draw Gold Theatrical Double Border Frame
      ctx.strokeStyle = '#f59e0b'; // amber-500
      ctx.lineWidth = 28;
      ctx.strokeRect(56, 56, canvas.width - 112, canvas.height - 112);

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'; // amber-400/50
      ctx.lineWidth = 8;
      ctx.strokeRect(92, 92, canvas.width - 184, canvas.height - 184);

      // 5. Draw Cinema Typography Layout & Filename Synthesis
      const rawUser = user?.email || (data as any)?.starring || (data as any)?.producer || 'MemoryWeaver';
      const cleanUser = rawUser.trim().replace(/[^a-zA-Z0-9@._-]/g, '_');

      // Subtitle / Hook (e.g. "A Child of Two Worlds")
      const rawSubtitle = data?.originalHook && !data.originalHook.toLowerCase().startsWith('in 19') && data.originalHook.length < 50 
        ? data.originalHook 
        : (data?.title && data.title.length < 50 && data.title !== data.chapterTitle ? data.title : 'A Child of Two Worlds');

      // Main Chapter Title (e.g. "Part I Roots & Foundations" - matches screen preview!)
      const rawTitle = data?.chapterTitle || 
        (data?.title && data.title.toUpperCase().trim() !== rawSubtitle.toUpperCase().trim() ? data.title : 'Part I Roots and Foundations');

      const cleanTitle = rawTitle.trim().replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').slice(0, 30);
      const cleanSubtitle = rawSubtitle.trim().replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').slice(0, 30);

      const docId = data?.id || 'key-art';

      const extractedYear = (() => {
        if ((data as any)?.year && !isNaN(Number((data as any).year))) return (data as any).year;
        const textToSearch = `${typeof data?.timeframeScope === 'string' ? data.timeframeScope : ''} ${data?.prose || ''} ${data?.title || ''}`;
        const match = textToSearch.match(/\b(19\d\d|20\d\d)\b/);
        return match ? match[1] : '1964';
      })();

      // Header Tagline
      ctx.fillStyle = '#fde68a'; // amber-200
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('A MEMORY WEAVER CINEMA SELECTION', canvas.width / 2, 2600);

      // Main Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 96px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(rawTitle.toUpperCase(), canvas.width / 2, 2740);

      // Subtitle (Hook) - Only render if subTitle is NOT identical to main title
      if (rawSubtitle && rawSubtitle.toUpperCase().trim() !== rawTitle.toUpperCase().trim()) {
        ctx.fillStyle = '#94a3b8'; // slate-400
        ctx.font = 'italic 60px serif';
        ctx.fillText(`"${rawSubtitle}"`, canvas.width / 2, 2840);
      }

      // Decorative Amber Line
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 400, 2920);
      ctx.lineTo(canvas.width / 2 + 400, 2920);
      ctx.stroke();

      // Style & Year Metadata
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = 'bold 40px monospace';
      ctx.fillText(`STYLE: ${posterStyle.toUpperCase()}  •  YEAR: ${extractedYear}`, canvas.width / 2, 3000);

      // Billing Line
      const performerName = (data as any)?.starring || (data as any)?.producer || user?.email?.split('@')[0] || 'N. Mepani';
      ctx.fillStyle = '#cbd5e1'; // slate-300
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`STARRING ${performerName.toUpperCase()}  •  DIRECTED BY MEMORY WEAVER`, canvas.width / 2, 3080);

      // 6. Synthesize & Draw Scannable Cinema QR Card
      const qrSize = 300;
      const qrBoxX = canvas.width - 420;
      const qrBoxY = canvas.height - 480;

      // Dark Glassmorphic Card Background
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(qrBoxX - 20, qrBoxY - 20, qrSize + 40, qrSize + 90, 24);
      } else {
        ctx.rect(qrBoxX - 20, qrBoxY - 20, qrSize + 40, qrSize + 90);
      }
      ctx.fill();

      // Gold Border Frame around QR Card
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Draw QR Code Image
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(cinemaShareUrl)}`;

      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrSize, qrSize);
          resolve();
        };
        qrImg.onerror = () => resolve();
      });

      // QR Code Label
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN TO WATCH', qrBoxX + qrSize / 2, qrBoxY + qrSize + 42);

      // 7. Trigger Direct Client Ultra-HD 4K PNG Download per User Specification ([user]-[title]-[subtitle]-[id].png)
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${cleanUser}-${cleanTitle}-${cleanSubtitle}-${docId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss(toastId);
      toast.success("Ultra-HD 4K Poster Downloaded!", {
        description: "Saved 2400x3600 300 DPI Key Art PNG with embedded Cinema QR Code to your device.",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      });
    } catch (err) {
      console.error("[4K Poster Engine] Download synthesis error:", err);
      toast.dismiss(toastId);
      toast.error("Download Failed", {
        description: "Unable to synthesize 4K poster PNG."
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPosterLightboxOpen) setIsPosterLightboxOpen(false);
        if (isReelTheaterOpen) {
          if (theaterVideoRef.current) {
            theaterVideoRef.current.pause();
          }
          setIsReelTheaterOpen(false);
          setIsPlaying(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReelTheaterOpen, isPosterLightboxOpen]);

  useEffect(() => {
    onTheaterToggle?.(isReelTheaterOpen || isTheaterExpanded);
  }, [isReelTheaterOpen, isTheaterExpanded, onTheaterToggle]);

  // 3. Mount Stream to Live Video Element
  useEffect(() => {
    if (videoRef.current && stream && !recordedBlob) {
      videoRef.current.srcObject = stream;
    }
    
    // Auto-trigger sound check on initialization in Stage 2 (Recording)
    if (stream && !recordedBlob && !isRecording && !showSoundCheck && !data?.videoUrl && productionStage === 2 && !hasDoneMicFeedback) {
      setShowSoundCheck(true);
      setHasDoneMicFeedback(true);
    }
  }, [stream, recordedBlob, isRecording, showSoundCheck, data?.videoUrl, productionStage, hasDoneMicFeedback]);

  // Auto-advance to Stage 2 (Notepad) when recording completes
  useEffect(() => {
    if (recordedBlob && productionStage === 1) {
      setProductionStage(2);
    }
  }, [recordedBlob, productionStage]);

  // NEW: Manage camera activation based on active Production Stage (Stage 1/Weave & Stage 2/Recording)
  useEffect(() => {
    if (showRestorePrompt) {
      if (isCameraActive) {
        setIsCameraActive(false);
      }
      return;
    }
    if ((productionStage === 1 || productionStage === 2 || productionStage === 3) && !isCameraActive) {
      setIsCameraActive(true);
    } else if (productionStage !== 1 && productionStage !== 2 && productionStage !== 3 && isCameraActive) {
      setIsCameraActive(false);
    }
  }, [productionStage, isCameraActive, recordedBlob, showRestorePrompt]);

  const handleReattemptAccess = useCallback(() => {
    setIsCameraActive(false);
    setTimeout(() => {
      setIsCameraActive(true);
    }, 150);
  }, []);

  // Phase 3 Preview Local URL
  const previewUrl = reviewVideoUrl || data?.videoUrl;

  // Zero-Start Playhead Safeguard: Ensure video playhead starts at 00:00 when entering Act IV or loading video
  useEffect(() => {
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = 0;
      setPreviewCurrentTime(0);
    }
  }, [previewUrl, currentStage]);

  // Video Buffering Guard: Require readyState >= 2 (HAVE_CURRENT_DATA) before clearing buffering
  useEffect(() => {
    if (!previewUrl) {
      setIsVideoBuffering(true);
      return;
    }
    
    // Check if video element is already initialized and has decoded its first frame
    if (previewVideoRef.current && previewVideoRef.current.readyState >= 2) {
      setIsVideoBuffering(false);
      return;
    }

    setIsVideoBuffering(true);

    // Polling timer: check readyState >= 2 until first frame is decoded
    const intervalId = setInterval(() => {
      if (previewVideoRef.current && previewVideoRef.current.readyState >= 2) {
        setIsVideoBuffering(false);
        clearInterval(intervalId);
      }
    }, 150);

    return () => clearInterval(intervalId);
  }, [previewUrl, currentStage]);

  const theaterVideoRef = useRef<HTMLVideoElement>(null);

  const togglePreviewPlay = () => {
    if (previewVideoRef.current) {
      if (isPlaying) {
        previewVideoRef.current.pause();
        setIsPlaying(false);
      } else {
        previewVideoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.warn("[SoloStage] Video playback error:", err);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleCloseReelTheater = useCallback(() => {
    if (theaterVideoRef.current) {
      theaterVideoRef.current.pause();
    }
    setIsReelTheaterOpen(false);
    setIsPlaying(false);
  }, []);

  const handleOpenReelTheater = useCallback(() => {
    // Crucial: Pause in-page preview video to prevent dual audio track echo!
    if (previewVideoRef.current) {
      previewVideoRef.current.pause();
    }
    const currentTime = previewVideoRef.current ? previewVideoRef.current.currentTime : previewCurrentTime;
    setIsPlaying(false);
    setIsReelTheaterOpen(true);

    // Sync start timecode on 4K Reel Theater video element
    setTimeout(() => {
      if (theaterVideoRef.current) {
        theaterVideoRef.current.currentTime = currentTime;
      }
    }, 50);

    logEvent('HS_ACT4_REEL_THEATER_OPEN', { version: APP_VERSION });
  }, [previewCurrentTime]);

  const handleRetakePerformance = useCallback(() => {
    if (previewVideoRef.current) {
      previewVideoRef.current.pause();
    }
    if (theaterVideoRef.current) {
      theaterVideoRef.current.pause();
    }
    
    setIsPlaying(false);
    setIsReelTheaterOpen(false);
    setIsPosterLightboxOpen(false);
    clearRecording();
    setReviewVideoUrl(null);
    setProductionStage(1);
    setIsCameraActive(true);

    logEvent('HS_ACT4_RETAKE_PERFORMANCE', { version: APP_VERSION });

    toast.info("Recording Studio Ready for Take 2", {
      description: "Returned to Stage 1. Frame yourself and start recording when ready.",
      icon: <RefreshCw className="w-4 h-4 text-sky-400" />
    });
  }, [setProductionStage, clearRecording]);

  const handleSeekPreview = useCallback((seconds: number, autoPlay: boolean = true) => {
    setPreviewCurrentTime(seconds);
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = seconds;
      if (autoPlay) {
        previewVideoRef.current.play().then(() => {
          setIsPlaying(true);
          setIsVideoBuffering(false);
        }).catch((err) => {
          console.warn("[SoloStage] Video seek playback requested:", err);
        });
      }
    }
  }, []);

  const handleSaveMemory = async () => {
    if (checkGuestAndUpsell("saving your memory")) return;
    if (recordedBlob && data?.id) {
      // "Soft-Clip": Inject raw numeric timestamps into Firebase payload!
      update({
        trimStart: trimRange[0],
        trimEnd: trimRange[1],
      });
      
      try {
        const url = await uploadVideo(recordedBlob, data.id);
        if (url) {
          update({
            trimStart: trimRange[0],
            trimEnd: trimRange[1],
            videoUrl: url,
            status: 'completed'
          });

          toast.success("Memory Secured", {
            description: "Footage uploaded. Director's analysis starting..."
          });
        }
      } catch (err) {
        console.error("Upload transmission failed.", err);
        toast.error("Upload Failed", { description: "The vault is currently closed. Please try again." });
      }
    } else {
      console.warn("Save requested but missing a valid Blob or Memory ID.");
    }
  };

  const [isCapturingThumbnail, setIsCapturingThumbnail] = useState(false);
  const [isCameraFlashActive, setIsCameraFlashActive] = useState(false);

  // SNAPSHOT: Capture current frame as thumbnail with 0ms instant feedback & CORS resilience
  const handleCaptureThumbnail = async () => {
    if (checkGuestAndUpsell("capturing cinematic poster frames")) return;
    
    // Choose active video element (theater video or in-page preview video)
    const video = (isReelTheaterOpen && theaterVideoRef.current) 
      ? theaterVideoRef.current 
      : previewVideoRef.current;

    if (!video || !data?.id) {
      toast.error("Video player unavailable for frame snap", {
        description: "Please play the master reel before snapping a key art frame."
      });
      return;
    }
    
    setIsCapturingThumbnail(true);
    playShutterSound();
    setIsCameraFlashActive(true);
    setTimeout(() => setIsCameraFlashActive(false), 300);

    try {
      const width = video.videoWidth || video.clientWidth || 1280;
      const height = video.videoHeight || video.clientHeight || 720;
      
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1800;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error("Could not initialize 2D canvas context");

      // Draw active frame onto canvas with aspect-ratio center crop (prevents face stretching!)
      drawAspectCover(ctx, video, canvas.width, canvas.height, false);

      let blob: Blob | null = null;
      let dataUrl: string | null = null;

      try {
        dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const res = await fetch(dataUrl);
        blob = await res.blob();
      } catch (corsErr) {
        console.warn("[SoloStage] Canvas export cross-origin warning, attempting direct blob export:", corsErr);
        blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      }

      if (blob || dataUrl) {
        const localUrl = dataUrl || (blob ? URL.createObjectURL(blob) : null);
        if (localUrl) {
          setLocalPosterUrl(localUrl);
          setActiveCarouselSlide('poster');
          
          if (isReelTheaterOpen) {
            setIsReelTheaterOpen(false);
          }

          toast.success("Frame Snapped! Viewing 2:3 Movie Key Art", { 
            description: "Switched to Poster Studio to inspect your anchored key art.",
            icon: <CheckCircle2 className="w-4 h-4 text-amber-400" />
          });
          
          logEvent('HS_ACT4_SNAP_FRAME', { version: APP_VERSION });
        }

        // Asynchronous background upload to Firebase Storage
        if (blob && data?.id) {
          uploadMediaBlob(blob, data.id).then((remoteUrl) => {
            if (remoteUrl) {
              const freshUrl = remoteUrl.includes('?') ? `${remoteUrl}&t=${Date.now()}` : `${remoteUrl}?t=${Date.now()}`;
              setLocalPosterUrl(freshUrl);
              update({ posterImageUrl: freshUrl });
            }
          }).catch(err => {
            console.error("[SoloStage] Background poster upload failed:", err);
          });
        }
      } else {
        throw new Error("Failed to export image blob from frame canvas");
      }
    } catch (e: any) {
      console.error("[SoloStage] Snapshot capture failed:", e);
      toast.error("Unable to snap video frame", {
        description: e?.message || "Ensure video playback has initialized.",
        icon: <AlertTriangle className="w-4 h-4 text-rose-400" />
      });
    } finally {
      setIsCapturingThumbnail(false);
    }
  };

  // --- STUDIO PORTRAIT PHOTOBOOTH STATE ---
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [selfieCapturedPreview, setSelfieCapturedPreview] = useState<string | null>(null);
  const [selfieCapturedBlob, setSelfieCapturedBlob] = useState<Blob | null>(null);
  const [selfieCountdown, setSelfieCountdown] = useState<number | string | null>(null);
  const [selfieFilter, setSelfieFilter] = useState<'default' | 'warm' | 'cool' | 'noir'>('default');
  const [localPosterUrl, setLocalPosterUrl] = useState<string | null>(null);
  const selfieVideoRef = useRef<HTMLVideoElement>(null);

  // Act IV Poster Auto-Anchor Safeguard: Automatically anchor selfie, photo, or extract video frame 0 as key art if unpopulated
  useEffect(() => {
    if (currentStage === 3) {
      if (!data?.posterImageUrl && !localPosterUrl) {
        const candidatePhoto = (data as any)?.selfieUrl || (data as any)?.narratorPhotoUrl || data?.imageUrl || (data as any)?.heroImageUrl;
        if (candidatePhoto && !candidatePhoto.match(/\.(webm|mp4|mov|ogg)$/i)) {
          setLocalPosterUrl(candidatePhoto);
          update({ posterImageUrl: candidatePhoto });
          return;
        }

        // Fallback: If candidate photo is missing or a video file, extract frame 0 from active video element
        const video = previewVideoRef.current;
        if (video && video.readyState >= 2) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 1800;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              drawAspectCover(ctx, video, canvas.width, canvas.height, false);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
              if (dataUrl) {
                setLocalPosterUrl(dataUrl);
                update({ posterImageUrl: dataUrl });
                console.log("[SoloStage] Auto-extracted video frame 0 for poster key art with aspect crop");
              }
            }
          } catch (e) {
            console.warn("[SoloStage] Auto video frame extraction warning:", e);
          }
        }
      }
    }
  }, [currentStage, data?.posterImageUrl, (data as any)?.selfieUrl, (data as any)?.narratorPhotoUrl, data?.imageUrl, localPosterUrl, isVideoBuffering, update]);

  const handleOpenSelfiePhotobooth = async () => {
    if (checkGuestAndUpsell("capturing cinematic poster frames")) return;
    if (previewVideoRef.current) {
      previewVideoRef.current.pause();
    }
    if (theaterVideoRef.current) {
      theaterVideoRef.current.pause();
    }
    setIsPlaying(false);
    setIsPosterLightboxOpen(false);
    setIsReelTheaterOpen(false);
    unmuteOptics();
    if (!isCameraActive || !stream) {
      handleReattemptAccess();
      await new Promise(res => setTimeout(res, 200));
    }
    setSelfieCapturedPreview(null);
    setSelfieCapturedBlob(null);
    setSelfieCountdown(null);
    setIsSelfieModalOpen(true);
    logEvent('HS_ACT4_POSTER_SELFIE_OPEN', { version: APP_VERSION });
  };

  useEffect(() => {
    if (isSelfieModalOpen && !selfieCapturedPreview && selfieVideoRef.current && stream) {
      selfieVideoRef.current.srcObject = stream;
      selfieVideoRef.current.play().catch(() => {});
    }
  }, [isSelfieModalOpen, selfieCapturedPreview, stream]);

  // Acoustic Countdown Cues & Web Audio Shutter Synthesiser (UK English per Rule 20)
  const speakAcousticCue = (text: string) => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.25;
        utter.pitch = 1.1;
        utter.lang = 'en-GB';
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {
      console.warn("[Acoustic Cue] Speech synthesis unavailable:", e);
    }
  };

  const playShutterSound = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const bufferSize = Math.floor(ctx.sampleRate * 0.08);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
    } catch (e) {
      console.warn("[Acoustic Cue] Web Audio shutter failed:", e);
    }
  };

  useEffect(() => {
    if (selfieCountdown === 3) speakAcousticCue("Three");
    else if (selfieCountdown === 2) speakAcousticCue("Two");
    else if (selfieCountdown === 1) speakAcousticCue("One");
    else if (selfieCountdown === "SMILE") speakAcousticCue("Smile! Hold it!");
  }, [selfieCountdown]);

  const handleTriggerSelfieCountdown = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (selfieCountdown !== null) return;
    setSelfieCountdown(3);

    setTimeout(() => {
      setSelfieCountdown(2);
    }, 1000);

    setTimeout(() => {
      setSelfieCountdown(1);
    }, 2000);

    setTimeout(() => {
      setSelfieCountdown("SMILE");
    }, 3000);

    setTimeout(() => {
      executeSelfieSnap();
      setSelfieCountdown(null);
    }, 4200);
  };

  const executeSelfieSnap = async () => {
    if (!selfieVideoRef.current) return;
    try {
      speakAcousticCue("Smile!");
      playShutterSound();

      const video = selfieVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1800; // 2:3 Vertical Movie Key Art aspect ratio
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (selfieFilter === 'warm') ctx.filter = 'sepia(0.35) contrast(1.1) brightness(1.05)';
        else if (selfieFilter === 'cool') ctx.filter = 'hue-rotate(180deg) saturate(1.2) contrast(1.1)';
        else if (selfieFilter === 'noir') ctx.filter = 'grayscale(1) contrast(1.3)';

        // Draw camera feed mirrored horizontally with aspect-ratio center crop (no stretching!)
        drawAspectCover(ctx, video, canvas.width, canvas.height, true);

        const dataUrl = canvas.toDataURL('image/webp', 0.95);
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', 0.95));
        if (blob) {
          setSelfieCapturedBlob(blob);
          setSelfieCapturedPreview(dataUrl);
        }
      }
    } catch (err) {
      console.error("[Photobooth] Snap error:", err);
      toast.error("Snap Failed", { description: "Unable to capture studio photo." });
    }
  };

  const handleConfirmSelfiePoster = async () => {
    if (!selfieCapturedBlob || !data?.id) return;
    setIsCapturingThumbnail(true);
    // Optimistic zero-latency local update
    if (selfieCapturedPreview) {
      setLocalPosterUrl(selfieCapturedPreview);
    }
    try {
      const url = await uploadMediaBlob(selfieCapturedBlob, data.id);
      if (url) {
        const freshUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
        setLocalPosterUrl(freshUrl);
        update({ posterImageUrl: freshUrl });
        toast.success("Studio Poster Anchored!", {
          description: "Your studio portrait is now set as the cinematic showcase poster.",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        });
        setIsSelfieModalOpen(false);
      }
    } catch (err) {
      console.error("[Photobooth] Upload error:", err);
      toast.error("Upload Failed", { description: "Unable to anchor poster photo." });
    } finally {
      setIsCapturingThumbnail(false);
    }
  };

  const playAudio = useCallback((base64: string) => {
    // PREMIUM: Natural Pause (Realism Injection)
    setTimeout(() => {
      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      audio.play();
    }, 600); 
  }, []);

  // MW-49: The Grand Tour & Onboarding Briefing States
  const hasPlayedMentorCue = useRef(false);
  const [hasSeenTour, setHasSeenTour] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('has_seen_studio_tour') === 'true';
    }
    return false;
  });
  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(false);
  const [showStageManagerCue, setShowStageManagerCue] = useState(false);

  const handleCloseBriefing = useCallback(async (completed: boolean) => {
    setIsBriefingOpen(false);
    setHasSeenTour(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('has_seen_studio_tour', 'true');
    }
    
    if (completed) {
      hasPlayedMentorCue.current = true; // Mark as played so general whisper cue doesn't double-trigger
      setShowStageManagerCue(true);
      toast.success("Briefing Complete", {
        description: "Stage Manager welcome cue initialized."
      });
      
      try {
        const cueText = "This stage is your sanctuary. Take a walk around, try the buttons, and make yourself at home. We'll be in the wings when you're ready.";
        const audio = await synthesizeStudioSpeech(cueText, 'Achird');
        if (audio) {
          playAudio(audio);
        }
      } catch (e) {
        console.warn("Achird vocal greeting failed:", e);
      }
    } else {
      toast.info("Fast Start Engaged", {
        description: "Bypassing guided briefing. Calibration dashboard ready."
      });
    }
  }, [playAudio]);

  useEffect(() => {
    // Only auto-open the onboarding briefing for brand new unrecorded memories!
    // If the user already has recorded footage or has progressed past initial capture, NEVER auto-open.
    const hasExistingFootage = Boolean(
      (recordedSegments && recordedSegments.length > 0) ||
      data?.videoUrl ||
      (data?.productionTakes && data.productionTakes.length > 0) ||
      data?.isProductionLocked ||
      (data?.productionStage && data.productionStage > 2)
    );

    if (productionStage === 2 && !hasSeenTour && !hasExistingFootage) {
      setIsBriefingOpen(true);
    }
  }, [productionStage, hasSeenTour, recordedSegments, data]);

  // Listen for Table Read complete event to trigger AI Director's UK-English rehearsal note
  useEffect(() => {
    const handleTableReadEnded = async () => {
      setShowRehearsalFeedback(true);
      
      // Auto-speak supportive feedback
      try {
        const note = "That felt authorised. The pacing on the 'Nairobi' section is your soul-print. Shall we take it to the floor for a real capture?";
        const audio = await synthesizeStudioSpeech(note, 'Achernar');
        if (audio) {
          playAudio(audio);
        }
      } catch (e) {
        console.warn("Table Read end TTS feedback failed:", e);
      }
    };
    
    window.addEventListener('studio-table-read-ended', handleTableReadEnded);
    return () => window.removeEventListener('studio-table-read-ended', handleTableReadEnded);
  }, [playAudio]);

  useEffect(() => {
    if (showRestorePrompt) return;
    const hasExistingFootage = Boolean(
      (recordedSegments && recordedSegments.length > 0) ||
      data?.videoUrl ||
      (data?.productionTakes && data.productionTakes.length > 0) ||
      data?.isProductionLocked ||
      (data?.productionStage && data.productionStage > 2)
    );
    if (hasExistingFootage) {
      hasPlayedMentorCue.current = true;
      return;
    }

    if (productionStage === 2 && !isBriefingOpen && hasSeenTour && !hasPlayedMentorCue.current) {
      hasPlayedMentorCue.current = true;
      console.log("[SoloStage] tech-scout ceremony entered. Synthesizing Stage Manager whisper...");
      const playMentorCue = async () => {
        try {
          const whisper = "The floor is yours. Settle in, check your framing, and ignite the prompter when you are ready.";
          const audio = await synthesizeStudioSpeech(whisper, 'Achird');
          if (audio) {
            playAudio(audio);
          }
        } catch (e) {
          console.warn("[SoloStage] Stage Manager cue failed:", e);
        }
      };
      playMentorCue();
    }
  }, [productionStage, isBriefingOpen, hasSeenTour, playAudio, showRestorePrompt, recordedSegments, data]);

  const triggerNextQuestion = async () => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);
    
    // Ensure Interviewer role uses language-appropriate voices
    const interviewerVoice = interviewLanguage === 'gu' ? selectedVoice : 'Achird';
    
    try {
      // If we are currently navigating historical questions and not at the end of the history array
      if (currentQuestionIndex < interviewHistory.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        const nextQuestion = interviewHistory[nextIndex].replace(/^AI:\s*/, '');
        setCurrentQuestion(nextQuestion);
        setCurrentQuestionIndex(nextIndex);
        
        const audio = await synthesizeStudioSpeech(nextQuestion, interviewerVoice);
        if (audio) {
          playAudio(audio);
        }
      } else {
        // Otherwise, generate a fresh new question using the AI bridge
        const question = await generateInterviewQuestion(
          data?.prose || '', 
          interviewHistory,
          interviewLanguage,
          isFluidMode ? 'fluid' : 'strict'
        );
        
        if (question) {
          setCurrentQuestion(question);
          const newHistory = [...interviewHistory, `AI: ${question}`];
          setInterviewHistory(newHistory);
          setCurrentQuestionIndex(newHistory.length - 1);
          
          const audio = await synthesizeStudioSpeech(question, interviewerVoice);
          if (audio) {
            playAudio(audio);
          }
        }
      }
    } catch (err) {
      console.error("Interviewer Error:", err);
      toast.error("Vocal Bridge Interrupted");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const triggerPrevQuestion = async () => {
    if (isSynthesizing || currentQuestionIndex <= 0) return;
    setIsSynthesizing(true);
    
    const interviewerVoice = interviewLanguage === 'gu' ? selectedVoice : 'Achird';
    
    try {
      const prevIndex = currentQuestionIndex - 1;
      const prevQuestion = interviewHistory[prevIndex].replace(/^AI:\s*/, '');
      setCurrentQuestion(prevQuestion);
      setCurrentQuestionIndex(prevIndex);
      
      const audio = await synthesizeStudioSpeech(prevQuestion, interviewerVoice);
      if (audio) {
        playAudio(audio);
      }
    } catch (err) {
      console.error("Interviewer Back Error:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleCheckFraming = async () => {
    if (isAnalyzingFraming || isSynthesizing) return;
    
    setIsTechScoutMinimised(true);
    setIsOpticsMinimised(true);
    setIsAnalyzingFraming(true);
    try {
      let imageBase64 = '';
      if (videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        }
      }

      let feedback = null;
      if (imageBase64) {
        try {
          feedback = await analyzeFraming(imageBase64, interviewLanguage);
        } catch (e) {
          console.warn("AI Framing API check failed, utilizing fallback:", e);
        }
      }

      if (!feedback) {
        // PREMIUM Directorial Fallback Feedback
        feedback = "Headroom is perfect. Try shifting slightly to the left to align with the Rule of Thirds. Lighting is a bit warm; your silhouette is authorised, but a touch more front-light would help your eyes sparkle.";
      }

      if (!isWirelessLinked) {
        feedback += " Since your desktop camera angle appears a bit static or offset, we highly recommend scanning the QR code under the [USE PHONE AS CAMERA] button in the Optics panel to pair your phone as a flexible wireless camera lens!";
      }

      // Contextual collaborative suggestion if struggling with lens alignment alone
      feedback += " If you are struggling to adjust your camera lens in Solo Booth, why not consider working with a friend in Collab Suite or Guest Director mode?";

      toast.info("Director Analysis", { 
        description: feedback,
        duration: 8000
      });
      const interviewerVoice = interviewLanguage === 'gu' ? selectedVoice : 'Achird';
      const audio = await synthesizeStudioSpeech(feedback, interviewerVoice);
      if (audio) playAudio(audio);
    } catch (err) {
      console.error("Framing Analysis Error:", err);
      toast.error("Framing Analyser Interrupted");
    } finally {
      setIsAnalyzingFraming(false);
    }
  };

  // Intelligent Mic Feedback
  useEffect(() => {
    if (showSoundCheck && micLevel < 10 && !hasDoneMicFeedback && !isSynthesizing) {
       const timer = setTimeout(async () => {
         if (micLevel < 10) {
            const lowMicPrompt = interviewLanguage === 'gu' 
              ? "માફ કરશો, હું તમને સાંભળી શકતો નથી. શું તમે તમારા માઇકને તપાસો છો અથવા થોડા નજીક જશો?"
              : "I'm having a little trouble hearing you. Could you check your mic or move slightly closer?";
            
            const interviewerVoice = interviewLanguage === 'gu' ? selectedVoice : 'Achird';
            const audio = await synthesizeStudioSpeech(lowMicPrompt, interviewerVoice);
            if (audio) playAudio(audio);
            setHasDoneMicFeedback(true);
         }
       }, 3000);
       return () => clearTimeout(timer);
    }
  }, [showSoundCheck, micLevel, hasDoneMicFeedback, isSynthesizing, interviewLanguage, selectedVoice, playAudio]);

  const handleNarratePoetic = async () => {
    const poeticText = data?.aiTakes?.poetic;
    if (!poeticText || isSynthesizing) return;
    
    setIsSynthesizing(true);
    try {
      // Storyteller role uses Achernar (Deep/Narrative)
      const audio = await synthesizeStudioSpeech(poeticText, 'Achernar');
      if (audio) {
        playAudio(audio);
        toast.success("Achernar is reading your Poetic Take");
      }
    } catch (err) {
      console.error("Narration Error:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };


  // UPLOAD: Select file from computer as poster
  const handleUploadPoster = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (checkGuestAndUpsell("uploading customized posters")) return;
    const file = e.target.files?.[0];
    if (!file || !data?.id) return;

    if (!file.type.startsWith('image/')) {
        toast.error("Invalid File", { description: "Please upload an image for the poster." });
        return;
    }

    try {
        const url = await uploadMediaBlob(file, data.id);
        if (url) {
            update({ posterImageUrl: url });
            toast.success("Portrait Uploaded!", {
                description: "Your uploaded image is now the cinematic poster.",
                icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
            });
        }
    } catch (e) {
        console.error("Poster upload failed:", e);
        toast.error("Upload Failed");
    }
  };

  const effectiveVideoDuration = useMemo(() => {
    // 1. Direct state duration if finite and > 0
    if (videoDuration && isFinite(videoDuration) && videoDuration > 0) {
      return videoDuration;
    }
    // 2. Direct preview video element duration
    if (previewVideoRef.current?.duration && isFinite(previewVideoRef.current.duration) && previewVideoRef.current.duration > 0) {
      return previewVideoRef.current.duration;
    }
    // 3. Direct theater video element duration
    if (theaterVideoRef.current?.duration && isFinite(theaterVideoRef.current.duration) && theaterVideoRef.current.duration > 0) {
      return theaterVideoRef.current.duration;
    }
    // 4. Sum of recordedSegments EDL tracks
    if (recordedSegments && recordedSegments.length > 0) {
      const sum = recordedSegments.reduce((acc, seg) => acc + (seg.duration || 0), 0);
      if (sum > 0) return sum;
    }
    // 5. Firestore data.videoDuration
    if ((data as any)?.videoDuration && isFinite((data as any).videoDuration) && (data as any).videoDuration > 0) {
      return (data as any).videoDuration;
    }
    // 6. Dynamic fallback: current playback time if video is playing
    return previewCurrentTime > 0 ? previewCurrentTime : 0;
  }, [videoDuration, previewCurrentTime, recordedSegments, data]);

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const vid = e.currentTarget;
    if (!vid) return;

    if (vid.duration && isFinite(vid.duration) && vid.duration > 0) {
      setVideoDuration(vid.duration);
    } else if (vid.duration === Infinity) {
      // Fix WebM MediaRecorder blob duration in Chrome (fast seek forces duration calculation)
      try {
        vid.currentTime = 1e101;
        const onTimeUpdateTemp = () => {
          vid.removeEventListener('timeupdate', onTimeUpdateTemp);
          vid.currentTime = 0;
          if (vid.duration && isFinite(vid.duration) && vid.duration > 0) {
            setVideoDuration(vid.duration);
          }
        };
        vid.addEventListener('timeupdate', onTimeUpdateTemp);
      } catch (err) {
        console.warn("[MediaEngine] WebM duration seek fallback:", err);
      }
    }
  };

  const handlePreviewTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const vid = e.currentTarget;
    const currentTime = vid.currentTime;
    setPreviewCurrentTime(currentTime);
    
    if (vid.duration && isFinite(vid.duration) && vid.duration > 0 && videoDuration !== vid.duration) {
      setVideoDuration(vid.duration);
    }

    const activeDur = effectiveVideoDuration;
    if (activeDur === 0) return;

    // Trim boundary check (pause if video exceeds active end trim, zero-start preserved)
    if (trimRange[1] > 0 && currentTime > trimRange[1]) {
      vid.pause();
      vid.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const shieldedUpdate = useCallback((updatedDataOrFn: Partial<Memory> | ((prev: Partial<Memory>) => Partial<Memory>)) => {
    update((prev: Partial<Memory>) => {
      const resolved = typeof updatedDataOrFn === 'function' ? updatedDataOrFn(prev) : updatedDataOrFn;
      return {
          ...prev,
          ...resolved,
          cameraActive: isCameraActive,
      };
    });
  }, [update, isCameraActive]);

  // --- SUB-RENDERERS FOR 5-ACT JOURNEY ---
  
  const renderIncitingMemory = () => (
    <div className="max-w-[95vw] xl:max-w-screen-2xl mx-auto w-full pb-8 transition-all duration-700">
      <MemoryForm ref={formRef} 
        data={data} 
        update={shieldedUpdate} 
        productionStage={0} 
        setProductionStage={setProductionStage}
        modality={modality}
        setModality={setModality}
        onWordCountChange={onWordCountChange}
        mentorActive={mentorActive}
        onToggleMentor={onToggleMentor}
        onClarityChange={onClarityChange}
        highlightClarity={highlightClarity}
        onboardingJustClosed={onboardingJustClosed}
        isUntouched={isUntouched}
        onActivity={onActivity}
        onNext={onNext}
      />
    </div>
  );

  const renderWeave = () => (
    <div className={cn(
      "w-full max-w-[95vw] xl:max-w-screen-2xl mx-auto pb-8 transition-all duration-1000",
      data?.structuredScript ? "h-[calc(100vh-180px)]" : ""
    )}>
      {/* PERSISTENCE MANTLE: Keep MemoryForm mounted for flush stability */}
      <div className={cn("w-full h-full", (data?.structuredScript && isReviewing) ? "hidden" : "block")}>
        <MemoryForm ref={formRef} 
          data={data} 
          update={shieldedUpdate} 
          productionStage={1} 
          setProductionStage={setProductionStage}
          forceAct="weave" 
          modality={modality}
          setModality={setModality}
          onWordCountChange={onWordCountChange}
          mentorActive={mentorActive}
          onToggleMentor={onToggleMentor}
          onClarityChange={onClarityChange}
          highlightClarity={highlightClarity}
          onActivity={onActivity}
          onSavingChange={setIsPersistenceSaving}
          onNext={onNext}
        />
      </div>

      {data?.structuredScript && isReviewing && (
        <CinemaMonitor 
          structuredScript={data.structuredScript} 
          onActivity={onActivity}
          onNext={onNext}
          onBackToEditor={() => globalActions.setIsReviewing(false)}
          isProductionLocked={isProductionLocked}
          onUnlock={() => {
            console.log("[SoloStage] Unlocking production lock via CinemaMonitor HUD");
            globalActions.setIsProductionLocked(false);
            update({ isProductionLocked: false });
          }}
          isSaving={isPersistenceSaving}
        />
      )}
    </div>
  );
  const renderRecording = () => (
    <div className={cn("w-full h-full flex flex-col items-center justify-center relative pb-8 transition-colors duration-1000", (isTableReadActive || captureModality === 'raw') ? "bg-[#030303]" : "")}>
       <div 
         ref={videoContainerRef}
         className={cn(
           "w-full max-w-[96vw] 2xl:max-w-[1720px] relative overflow-hidden transition-all duration-1000",
           !(isTableReadActive || captureModality === 'raw') ? "aspect-video min-h-[580px] md:min-h-[660px]" : "h-[calc(100vh-240px)] min-h-[480px] max-h-[720px]",
           isRecording ? 'ring-2 ring-rose-500/50 shadow-[0_0_120px_rgba(244,63,94,0.3)] scale-[1.01]' : 'shadow-2xl',
           (isTableReadActive || captureModality === 'raw') ? "bg-[#030303] border-sky-500/20" : "bg-black border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)]",
           isRehearsing && "ring-2 ring-amber-500/50 border-amber-500/30"
         )}
       >
          {mounted && isRehearsing && (
            <div className="absolute top-6 left-8 z-[35] bg-amber-500/10 backdrop-blur-md border border-amber-500/30 px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400 font-bold pointer-events-none select-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              [ REHEARSAL ONLY // NO CAPTURE ]
            </div>
          )}
          {mounted && captureModality === 'raw' && (
            <div className="absolute top-6 right-8 z-[35] bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-[0.2em] text-white/40 pointer-events-none select-none">
              MODE: UNTETHERED AUDIO-VISUAL CAPTURE
            </div>
          )}
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className={cn(
              "absolute inset-0 w-full h-full object-cover z-0 transition-all duration-700 ease-out",
              isCountingIn ? "blur-[20px]" : "blur-0",
              (isTableReadActive || captureModality === 'raw') ? "opacity-100 scale-100" : "opacity-100 scale-100"
            )}
            style={{
              filter: `
                brightness(${opticsBrightness || 100}%) 
                contrast(${opticsContrast || 100}%) 
                ${opticsFilter === 'noir' ? 'grayscale(1) contrast(1.2)' : ''}
                ${opticsFilter === 'warm' ? 'sepia(0.2) saturate(1.1) hue-rotate(-10deg)' : ''}
                ${opticsFilter === 'cool' ? 'saturate(0.9) hue-rotate(10deg)' : ''}
              `
            }}
          />
          {mounted && isMuted && (
            <div 
              onClick={unmuteOptics}
              className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-[35] animate-fade-in border border-rose-500/20 rounded-[2.5rem] cursor-pointer group/cam transition-all duration-500 hover:bg-slate-950/90"
              title="Click anywhere to ignite camera and mic"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center max-w-md text-center px-8 py-8 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-headline text-base font-bold text-white uppercase tracking-widest mb-1">Standing By // Awaiting Narrator</h3>
                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-6">Cinematic Rehearsal Checklist</p>

                <div className="w-full space-y-3.5 mb-8 text-left">
                  {/* Item 1: Optics Check */}
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Camera className="w-4 h-4 text-rose-400 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/90">Optics check</span>
                        <span className="text-[9px] text-white/40">Camera stream muted by Privacy Shield</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[8px] font-black uppercase tracking-wider text-rose-400">
                      Muted
                    </span>
                  </div>

                  {/* Item 2: Acoustics Check */}
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/90">Acoustics check</span>
                        <span className="text-[9px] text-white/40">Microphone stream muted by Privacy Shield</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[8px] font-black uppercase tracking-wider text-rose-400">
                      Muted
                    </span>
                  </div>

                  {/* Item 3: Blueprint Check */}
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/90">Blueprint check</span>
                        <span className="text-[9px] text-white/40">Cinematic memory text loaded successfully</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider text-emerald-400">
                      Authorised
                    </span>
                  </div>

                  {/* Dynamic AI Director Standby Cue (MW-39 integration) */}
                  {mentorActive && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.02)] animate-pulse">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Director's Rehearsal Tip</span>
                        <span className="text-[10px] text-white/60 leading-relaxed font-sans">Relax, frame yourself in the center, and click below to ignite camera & mic. We will linter your shot once live.</span>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={unmuteOptics}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  Ignite Camera & Mic
                </button>
              </motion.div>
            </div>
          )}

          {/* Focus Mode Cinematic Dimmer Overlay */}
          <AnimatePresence>
            {isFocusModeActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 bg-[#030303]/75 backdrop-blur-[0.5px] z-25 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Unified Director's HUD (Left Calibration Stack) */}
          <AnimatePresence>
            {mounted && !isMuted && !isTableReadActive && (
              <div 
                data-blueprint="DirectorsHUD"
                data-tour="directors-hud"
                className={cn(
                  "absolute z-30 pointer-events-auto",
                  !techAlignmentConfirmed 
                    ? "left-6 xl:left-12 top-12" 
                    : "left-10 top-10"
                )}
              >
                <motion.div
                  drag
                  dragConstraints={videoContainerRef}
                  dragElastic={0.05}
                  dragMomentum={false}
                  initial={{ 
                    opacity: 0, 
                    x: -50, 
                    scale: 0.95,
                    height: isDirectorMinimised ? '56px' : 'auto',
                    width: isDirectorMinimised ? '200px' : '296px'
                  }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    height: isDirectorMinimised ? '56px' : 'auto',
                    width: isDirectorMinimised ? '200px' : '296px',
                    borderRadius: isDirectorMinimised ? '9999px' : '2rem'
                  }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ 
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                    height: { type: "spring", stiffness: 150, damping: 20 },
                    width: { type: "spring", stiffness: 150, damping: 20 },
                    borderRadius: { type: "spring", stiffness: 150, damping: 20 }
                  }}
                  style={{ touchAction: 'none' }}
                  className={cn(
                    "bg-zinc-950/90 backdrop-blur-3xl border border-white/15 p-5 shadow-2xl flex flex-col justify-between hover:bg-zinc-900/95 transition-colors duration-700 select-none cursor-grab active:cursor-grabbing max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar",
                    isDirectorMinimised && "p-3 px-4 flex-row items-center justify-between overflow-hidden"
                  )}
                >
                  {isDirectorMinimised ? (
                    <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full animate-pulse",
                          activeDirectorTab === 'rehearse' 
                            ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" 
                            : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                        )} />
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-wider",
                          activeDirectorTab === 'rehearse' ? "text-sky-400" : "text-emerald-400"
                        )}>
                          {activeDirectorTab === 'rehearse' ? 'Table Read' : 'AI Director'}
                        </span>
                      </div>
                      <button 
                        onClick={() => setIsDirectorMinimised(false)}
                        className={cn(
                          "p-1.5 rounded-full transition-all cursor-pointer border",
                          activeDirectorTab === 'rehearse' 
                            ? "bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-sky-500/20" 
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                        )}
                        title="Restore Panel"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 flex-grow select-none">
                        {/* Drag Grip Handle */}
                        <div className="w-12 h-1 rounded-full bg-white/10 mx-auto hover:bg-white/20 mb-2 transition-colors shrink-0" />
                        
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                          {techAlignmentConfirmed ? (
                            <div className="flex items-center bg-white/5 p-1 rounded-full border border-white/5 gap-1">
                              <button
                                onClick={() => setActiveDirectorTab('director')}
                                className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                                  activeDirectorTab === 'director'
                                    ? "bg-emerald-500 text-zinc-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                              >
                                🎬 Director
                              </button>
                              <button
                                onClick={() => setActiveDirectorTab('rehearse')}
                                data-tour="table-rehearse"
                                className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                                  activeDirectorTab === 'rehearse'
                                    ? "bg-sky-500 text-zinc-950 shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                              >
                                🎙️ Rehearse
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-400">
                              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Director Active</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {/* Focus Mode Cinematic Lamp Toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsFocusModeActive(!isFocusModeActive);
                                if (!isFocusModeActive) {
                                  toast.info("Focus Mode Activated", {
                                    description: "Ambient lights dimmed. Focusing on prompter & direct camera feed.",
                                  });
                                } else {
                                  toast.info("Focus Mode Deactivated", {
                                    description: "Ambient lights restored.",
                                  });
                                }
                              }}
                              className={cn(
                                "p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center",
                                isFocusModeActive
                                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:bg-amber-500/30"
                                  : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                              )}
                              title={isFocusModeActive ? "Deactivate Focus Mode" : "Activate Focus Mode"}
                            >
                              <Lightbulb className={cn("w-3.5 h-3.5 transition-transform duration-500", isFocusModeActive && "rotate-12 scale-110")} />
                            </button>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsDirectorMinimised(true);
                              }}
                              className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all cursor-pointer"
                              title="Minimise Panel"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        {activeDirectorTab === 'director' || !techAlignmentConfirmed ? (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                🎬 Eye-Contact Rule
                              </span>
                              <p className="text-[10px] text-white/70 leading-relaxed">
                                Maintain direct eye contact with the camera lens. Let the teleprompter mirror guide your gaze naturally.
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                🗣️ Sensory Pacing
                              </span>
                              <p className="text-[10px] text-white/70 leading-relaxed">
                                Speak slowly. Pause and breathe at sensory highlights (marked in green, amber, and purple) to let emotion weave.
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                📐 Framing Linter
                              </span>
                              <p className="text-[10px] text-white/70 leading-relaxed font-sans">
                                Align your eyes with the upper-third line of the shot. Run live linter below to verify rule-of-thirds.
                              </p>
                            </div>

                            <div 
                              onClick={() => {
                                toast.success("Switched to Collaboration Suite");
                                onSelectRoom?.('collaborative');
                              }}
                              className="space-y-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-400/60 p-3.5 rounded-2xl mt-2 transition-all cursor-pointer group shadow-lg active:scale-98"
                              title="Click to launch Collaboration Suite"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9.5px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1.5 font-sans group-hover:text-sky-300">
                                  🤝 Collaborative Tip
                                </span>
                              </div>
                              <p className="text-[10px] text-sky-200/90 leading-relaxed font-medium font-sans">
                                Struggling to adjust your camera lens in Solo Booth? Click below to invite a co-creator in <strong className="text-white underline decoration-sky-400">COLLAB SUITE</strong> or <strong className="text-white underline decoration-sky-400">GUEST DIRECTOR</strong> mode.
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.success("Switched to Collaboration Suite");
                                    onSelectRoom?.('collaborative');
                                  }}
                                  className="text-[8.5px] font-black uppercase tracking-wider text-sky-950 bg-sky-400 hover:bg-sky-300 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
                                >
                                  Launch Collab Suite &rarr;
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.success("Switched to Guest Director Mode");
                                    onSelectRoom?.('guest');
                                  }}
                                  className="text-[8.5px] font-black uppercase tracking-wider text-sky-200 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                  Guest Director &rarr;
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                🎙️ Voice Shadowing
                              </span>
                              <p className="text-[10px] text-white/70 leading-relaxed font-sans font-medium">
                                Engage rhythm-shadowing with director <strong className="text-sky-400 font-bold">Achernar</strong>. Follow the synthesized flow to calibrate voice pitch.
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                <Languages className="w-3 h-3 text-sky-400" /> Bilingual Pacing Status
                              </span>
                              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 rounded-xl border border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                                  {interviewLanguage === 'gu' ? 'Gujarati (WaveNet-A)' : 'UK English (Achernar)'}
                                </span>
                              </div>
                            </div>

                            {/* Pace Dial (Words Per Minute / Speed multiplier) */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                  🎛️ Rehearsal Pace Dial
                                </span>
                                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-md">
                                  {(rehearsalSpeed * 100).toFixed(0)} WPM
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] text-white/30 font-bold">Slow</span>
                                <input
                                  type="range"
                                  min="0.5"
                                  max="2.5"
                                  step="0.1"
                                  value={rehearsalSpeed}
                                  onChange={(e) => setRehearsalSpeed(Number(e.target.value))}
                                  className="flex-grow accent-sky-400 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-[9px] text-white/30 font-bold">Fast</span>
                              </div>
                              <p className="text-[8.5px] text-white/40 italic leading-normal">
                                Adjust pacing specifically for the table read without altering production speed.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-white/5 mt-2">
                        {activeDirectorTab === 'director' || !techAlignmentConfirmed ? (
                          <button
                            onClick={handleCheckFraming}
                            disabled={isAnalyzingFraming}
                            className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 transition-all font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer group shadow-[0_0_15px_rgba(16,185,129,0.05)] disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                            <span>{isAnalyzingFraming ? 'Analyzing crop...' : 'Check Shot Linter'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleEngageRehearsal}
                            className="w-full py-3 bg-sky-500 hover:bg-sky-400 active:scale-95 transition-all text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                          >
                            <Sparkles className="w-3.5 h-3.5 animate-pulse text-slate-950" />
                            <span>Engage Rehearsal</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>


          {/* Floating 'Director's Tech Scout' Calibration Card (MW-39 full-view check) */}
          {mounted && !isMuted && !techAlignmentConfirmed && !isTableReadActive && (
            <>
              {!isTechScoutMinimised && (
                <div className="absolute inset-0 bg-black/5 pointer-events-none z-[34] animate-fade-in" />
              )}
              <div className={cn(
                "absolute z-[35] transition-all duration-500",
                isTechScoutMinimised 
                  ? "left-[40%] top-12 -translate-x-1/2 pointer-events-auto" 
                  : "left-1/2 top-12 -translate-x-1/2 pointer-events-auto",
                isFocusModeActive && "opacity-50 blur-[0.5px] pointer-events-none"
              )}>
                <motion.div 
                  drag
                  dragConstraints={videoContainerRef}
                  dragElastic={0.05}
                  dragMomentum={false}
                  initial={{ 
                    scale: 0.9, 
                    opacity: 0,
                    height: isTechScoutMinimised ? '56px' : '530px',
                    width: isTechScoutMinimised ? '200px' : '448px'
                  }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    height: isTechScoutMinimised ? '56px' : '530px',
                    width: isTechScoutMinimised ? '200px' : '448px',
                    borderRadius: isTechScoutMinimised ? '9999px' : '2.5rem'
                  }}
                style={{ touchAction: 'none' }}
                className={cn(
                  "flex flex-col items-center bg-slate-900/75 backdrop-blur-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] pointer-events-auto cursor-grab active:cursor-grabbing select-none",
                  isTechScoutMinimised ? "p-3 px-4 flex-row justify-between w-[200px]" : "max-w-md text-center px-8 pt-3 pb-8"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {isTechScoutMinimised ? (
                  <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Tech Scout</span>
                    </div>
                    <button 
                      onClick={() => setIsTechScoutMinimised(false)}
                      className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-full transition-all cursor-pointer"
                      title="Restore Panel"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Drag Grip Indicator Handle */}
                    <div className="w-full flex items-center justify-between border-b border-white/5 pb-2 mb-4 shrink-0">
                      <div className="w-8 h-8" /> {/* spacer */}
                      <div className="w-12 h-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTechScoutMinimised(true);
                        }}
                        className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all cursor-pointer"
                        title="Minimise Panel"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse">
                      <Sparkles className="w-6 h-6 text-emerald-400" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">
                      ACT III • CAPTURE BOOTH
                    </span>
                    <h3 className="font-headline text-base font-bold text-white uppercase tracking-widest mb-1">Director's Tech Scout</h3>
                    <p className="text-[9px] text-white/50 uppercase tracking-widest mb-6 font-mono">Act III Camera, Lighting & Sound Check</p>

                    <div className="w-full space-y-3.5 mb-8 text-left">
                      {/* Item 1: Camera Check */}
                      <div className="flex flex-col gap-2 p-3 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Camera className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white/90">Camera Angle & Lighting</span>
                              <span className="text-[9px] text-white/40">Optics active. Video stream is in full view.</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider text-emerald-400 shrink-0">
                            Active
                          </span>
                        </div>
                        
                        {/* Wireless Setup Link directly in Tech Scout Panel */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[8px] text-white/40 uppercase tracking-widest">Setup/Angle Stack:</span>
                          
                          {isWirelessLinked ? (
                            <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              Wireless Lens Connected
                            </span>
                          ) : (
                            <Dialog open={isCameraQRModalOpen} onOpenChange={setIsCameraQRModalOpen}>
                              <DialogTrigger asChild>
                                <button data-tour="wireless-lens" className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all font-black text-[8px] uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer">
                                  <Smartphone className="w-2.5 h-2.5" />
                                  <span>Use Phone as Camera</span>
                                </button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                                <DialogHeader>
                                  <DialogTitle className="font-headline text-lg uppercase tracking-wide text-white">
                                    Wireless Lens Bridge
                                  </DialogTitle>
                                  <DialogDescription className="text-zinc-400 text-xs">
                                    Scan this QR code with your mobile device to link your smartphone as a premium wireless camera lens.
                                  </DialogDescription>
                                </DialogHeader>

                                {typeof window !== 'undefined' && (
                                  window.location.hostname === 'localhost' ||
                                  window.location.hostname === '127.0.0.1' ||
                                  window.location.hostname.startsWith('192.168.') ||
                                  window.location.hostname.startsWith('10.') ||
                                  window.location.hostname.startsWith('172.')
                                ) && (
                                  <div className="space-y-1 bg-white/5 p-3.5 rounded-xl border border-white/10 my-1 animate-fadeIn">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                                      Local IP Address / Hostname
                                    </label>
                                    <input 
                                      type="text" 
                                      value={hostIP}
                                      onChange={(e) => setHostIP(e.target.value)}
                                      className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50"
                                      placeholder="e.g. 192.168.1.50"
                                    />
                                    <p className="text-[9px] text-zinc-500 leading-relaxed mt-1">
                                      Change <span className="text-zinc-300 font-bold">"localhost"</span> to your computer's local LAN IP (e.g. 192.168.x.x) so your phone can locate this computer over Wi-Fi.
                                    </p>
                                  </div>
                                )}

                                <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10 gap-4 my-1">
                                  <div className="relative p-3 bg-white rounded-xl">
                                    {cameraPairingUrl ? (
                                      <QRCodeCanvas value={cameraPairingUrl} size={200} level="H" includeMargin={false} className="rounded" />
                                    ) : (
                                      <div className="w-[200px] h-[200px] flex items-center justify-center text-zinc-800">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="w-full flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        isWirelessLinked
                                          ? "bg-emerald-500 animate-pulse"
                                          : "bg-zinc-600"
                                      )} />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                                        {isWirelessLinked ? 'WIRELESS FEED SYNCD' : 'WAITING FOR SOURCE STREAM'}
                                      </span>
                                    </div>
                                    <div className="text-[9px] leading-relaxed text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center mt-1 w-full font-medium">
                                      <strong>⚠️ SSL Certificate Warning:</strong> Local WebRTC camera access requires HTTPS. If your phone blocks the connection, tap <strong>"Advanced" ➔ "Proceed"</strong> (or visit <span className="underline font-mono">https://{hostIP || '192.168.x.x'}:3000</span> first to accept the local dev certificate).
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-zinc-500 text-[9px] tracking-widest uppercase border-t border-white/5 pt-4">
                                  <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/40" />
                                    <span>Secure WebRTC stream</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (cameraPairingUrl) {
                                        navigator.clipboard.writeText(cameraPairingUrl);
                                        toast.success("Wireless Lens URL copied to clipboard!");
                                      }
                                    }}
                                    className="text-[9px] font-black text-sky-400 hover:text-sky-300 transition-colors uppercase tracking-wider cursor-pointer bg-transparent border-0 outline-none"
                                  >
                                    Copy Link
                                  </button>
                                </div>

                                <DialogFooter className="mt-2">
                                  <Button variant="outline" onClick={() => setIsCameraQRModalOpen(false)} className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-zinc-300 text-xs">
                                    Close
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>

                      {/* Item 2: Acoustics Check (Live Sound Check Visualiser) */}
                      <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3 w-full">
                          <Mic className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                          <div className="flex flex-col w-full min-w-0 pr-2">
                            <span className="text-xs font-bold text-white/90">Acoustics Check</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[8px] text-white/40 uppercase tracking-wider font-mono">Live levels:</span>
                              <div className="flex-grow bg-white/10 h-1.5 rounded-full overflow-hidden relative">
                                <div 
                                  className="bg-emerald-400 h-full rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(52,211,153,0.6)]" 
                                  style={{ width: `${volume}%` }} 
                                />
                              </div>
                              <span className="text-[9px] font-mono font-bold text-emerald-400 shrink-0">{volume}%</span>
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider text-emerald-400 shrink-0">
                          {volume > 5 ? 'Active' : 'Listening'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-white/50 leading-relaxed mb-8 italic">
                      Take a moment to verify your framing, lighting, and background in full view. Click below once you are satisfied with the setup.
                    </p>

                    <div className="flex gap-4 w-full relative">
                      <MentorshipHotspot 
                        number={2} 
                        label="Calibrate Teleprompter Speed & Alignment" 
                        hotspotId="HS_ACT2_MENTOR_STEP2"
                        isCompleted={techAlignmentConfirmed}
                        className="-top-3 -left-3" 
                      />
                      <button 
                        data-hotspot-id="HS_STAGE_CONFIRM_ALIGNMENT"
                        onClick={() => {
                          globalActions.setCaptureModality('scripted');
                          setTechAlignmentConfirmed(true);
                          if (modalityMode === 'interview') {
                            setIsInterviewMode(true);
                          }
                          toast.success("Technical Alignment Confirmed", {
                            description: "Engaging prompter guide. Settle in for your performance!"
                          });
                        }}
                        title="Confirm setup & engage prompter guide/interview questions"
                        className="flex-grow flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] cursor-pointer"
                      >
                        Confirm Alignment
                      </button>
                      <button 
                        onClick={() => {
                          globalActions.setCaptureModality('raw');
                          setTechAlignmentConfirmed(true);
                          toast.success("Documentary Raw Modality Active", {
                            description: "Optics rolling untethered. Take your stage!"
                          });
                        }}
                        title="Record untethered, script-free raw camera capture"
                        className="flex-grow flex-1 py-4 bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 active:scale-95 transition-all text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer"
                      >
                        Just Roll Camera
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
            </>
          )}

          {/* Floating 'Camera Control Deck' calibration overlay */}
          {mounted && !isMuted && !techAlignmentConfirmed && !isTableReadActive && (
            <div className={cn("absolute right-6 xl:right-12 top-12 z-[35] pointer-events-auto transition-all duration-500", isFocusModeActive && "opacity-50 blur-[0.5px] pointer-events-none")}>
               <motion.div
                 drag
                 dragConstraints={videoContainerRef}
                 dragElastic={0.05}
                 dragMomentum={false}
                 initial={{ 
                   scale: 0.9, 
                   opacity: 0, 
                   x: 50,
                   height: isOpticsMinimised ? '56px' : '420px',
                   width: isOpticsMinimised ? '200px' : '288px'
                 }}
                 animate={{ 
                   scale: 1, 
                   opacity: 1, 
                   x: 0,
                   height: isOpticsMinimised ? '56px' : '420px',
                   width: isOpticsMinimised ? '200px' : '288px',
                   borderRadius: isOpticsMinimised ? '9999px' : '2.5rem'
                 }}
                 style={{ touchAction: 'none' }}
                 className={cn(
                   "flex flex-col bg-slate-900/75 backdrop-blur-2xl border border-white/10 shadow-2xl cursor-grab active:cursor-grabbing select-none",
                   isOpticsMinimised ? "p-3 px-4 flex-row items-center justify-between w-[200px]" : "w-72 p-6 space-y-5"
                 )}
               >
                 {isOpticsMinimised ? (
                   <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                       <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Optics</span>
                     </div>
                     <button 
                       onClick={() => setIsOpticsMinimised(false)}
                       className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-full transition-all cursor-pointer"
                       title="Restore Panel"
                     >
                       <Plus className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 ) : (
                   <>
                     {/* Drag handle */}
                     <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
                       <div className="w-8 h-8" />
                       <div className="w-12 h-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors" />
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setIsOpticsMinimised(true);
                         }}
                         className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all cursor-pointer"
                         title="Minimise Panel"
                       >
                         <Minus className="w-3.5 h-3.5" />
                       </button>
                     </div>
                     
                     <div className="border-b border-white/5 pb-2">
                       <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Optics Grading</span>
                       <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-0.5">Cinematic Styling</h4>
                     </div>

                     {/* Brightness Control */}
                     <div className="space-y-1.5">
                       <div className="flex items-center justify-between text-[10px] text-white/60">
                         <span>Brightness</span>
                         <span className="font-mono text-emerald-400">{opticsBrightness}%</span>
                       </div>
                       <input
                         type="range"
                         min="60"
                         max="140"
                         value={opticsBrightness}
                         onChange={(e) => setOpticsBrightness(Number(e.target.value))}
                         className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                       />
                     </div>

                     {/* Contrast Control */}
                     <div className="space-y-1.5">
                       <div className="flex items-center justify-between text-[10px] text-white/60">
                         <span>Contrast</span>
                         <span className="font-mono text-emerald-400">{opticsContrast}%</span>
                       </div>
                       <input
                         type="range"
                         min="60"
                         max="140"
                         value={opticsContrast}
                         onChange={(e) => setOpticsContrast(Number(e.target.value))}
                         className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                       />
                     </div>

                     {/* Zoom Control (Hardware Zoom if supported, otherwise digital scale fallback) */}
                     <div className="space-y-1.5">
                       <div className="flex items-center justify-between text-[10px] text-white/60">
                         <span>Zoom Level</span>
                         <span className="font-mono text-emerald-400">{capabilities?.zoom ? `${zoomValue}x` : '1.0x (Standard)'}</span>
                       </div>
                       <input
                         type="range"
                         min={capabilities?.zoom?.min || 1}
                         max={capabilities?.zoom?.max || 3}
                         step={capabilities?.zoom?.step || 0.1}
                         value={zoomValue}
                         onChange={(e) => applyZoom(Number(e.target.value))}
                         disabled={!capabilities?.zoom}
                         className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed"
                       />
                       {!capabilities?.zoom && (
                         <span className="text-[7px] text-white/30 uppercase tracking-wider block">Hardware zoom not supported by webcam</span>
                       )}
                     </div>

                     {/* Wireless Camera Bridge Setup & Switcher */}
                     <div className="space-y-2 pt-2 border-t border-white/5">
                       <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold block">Wireless camera Input</span>
                       
                       {isWirelessLinked ? (
                         <div className="flex flex-col gap-1.5">
                           <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider block bg-emerald-500/10 border border-emerald-500/20 py-1 px-2 rounded-lg text-center">
                             ✓ Remote Wireless Lens Connected
                           </span>
                           
                           {/* Premium Segment Switcher Button */}
                           <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
                             <button
                               onClick={() => switchInput('studio')}
                               className={cn(
                                 "py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                                 activeInput === 'studio'
                                   ? "bg-emerald-500 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                   : "text-white/50 hover:bg-white/5"
                               )}
                             >
                               Studio Cam
                             </button>
                             <button
                               onClick={() => switchInput('wireless')}
                               className={cn(
                                 "py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                                 activeInput === 'wireless'
                                   ? "bg-emerald-500 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                   : "text-white/50 hover:bg-white/5"
                               )}
                             >
                               Wireless Lens
                             </button>
                           </div>
                         </div>
                       ) : (
                         <Dialog open={isCameraQRModalOpen} onOpenChange={setIsCameraQRModalOpen}>
                           <DialogTrigger asChild>
                             <button
                               className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 border border-emerald-500/30 text-slate-950 transition-all font-black text-[9px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                             >
                               <Smartphone className="w-3.5 h-3.5" />
                               <span>Use Phone as Camera</span>
                             </button>
                           </DialogTrigger>
                           <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                             <DialogHeader>
                               <DialogTitle className="font-headline text-lg uppercase tracking-wide text-white">
                                 Wireless Lens Bridge
                               </DialogTitle>
                               <DialogDescription className="text-zinc-400 text-xs">
                                 Scan this QR code with your mobile device to link your smartphone as a premium wireless camera lens.
                               </DialogDescription>
                             </DialogHeader>

                             {typeof window !== 'undefined' && (
                               window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname.startsWith('192.168.') ||
                               window.location.hostname.startsWith('10.') ||
                               window.location.hostname.startsWith('172.')
                             ) && (
                               <div className="space-y-1 bg-white/5 p-3.5 rounded-xl border border-white/10 my-1 animate-fadeIn">
                                 <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                                   Local IP Address / Hostname
                                 </label>
                                 <input 
                                   type="text" 
                                   value={hostIP}
                                   onChange={(e) => setHostIP(e.target.value)}
                                   className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50"
                                   placeholder="e.g. 192.168.1.50"
                                 />
                                 <p className="text-[9px] text-zinc-500 leading-relaxed mt-1">
                                   Change <span className="text-zinc-300 font-bold">"localhost"</span> to your computer's local LAN IP (e.g. 192.168.x.x) so your phone can locate this computer over Wi-Fi.
                                 </p>
                               </div>
                             )}

                             <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10 gap-4 my-1">
                               <div className="relative p-3 bg-white rounded-xl">
                                 {cameraPairingUrl ? (
                                   <QRCodeCanvas value={cameraPairingUrl} size={200} level="H" includeMargin={false} className="rounded" />
                                 ) : (
                                   <div className="w-[200px] h-[200px] flex items-center justify-center text-zinc-800">
                                     <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                   </div>
                                 )}
                               </div>

                               <div className="w-full flex flex-col items-center gap-2">
                                 <div className="flex items-center gap-2">
                                   <span className={cn(
                                     "w-2 h-2 rounded-full",
                                     isWirelessLinked
                                       ? "bg-emerald-500 animate-pulse"
                                       : "bg-zinc-600"
                                   )} />
                                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                                     {isWirelessLinked ? 'WIRELESS FEED SYNCD' : 'WAITING FOR SOURCE STREAM'}
                                   </span>
                                 </div>
                                 <div className="text-[9px] leading-relaxed text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center mt-1 w-full font-medium">
                                   <strong>⚠️ SSL Certificate Warning:</strong> Local WebRTC camera access requires HTTPS. If your phone blocks the connection, tap <strong>"Advanced" ➔ "Proceed"</strong> (or visit <span className="underline font-mono">https://{hostIP || '192.168.x.x'}:3000</span> first to accept the local dev certificate).
                                 </div>
                               </div>
                             </div>

                             <div className="flex items-center justify-between text-zinc-500 text-[9px] tracking-widest uppercase border-t border-white/5 pt-4">
                               <div className="flex items-center gap-1.5">
                                 <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/40" />
                                 <span>Secure WebRTC stream</span>
                               </div>
                               <button
                                 onClick={() => {
                                   if (cameraPairingUrl) {
                                     navigator.clipboard.writeText(cameraPairingUrl);
                                     toast.success("Wireless Lens URL copied to clipboard!");
                                   }
                                 }}
                                 className="text-[9px] font-black text-sky-400 hover:text-sky-300 transition-colors uppercase tracking-wider cursor-pointer bg-transparent border-0 outline-none"
                               >
                                 Copy Link
                               </button>
                             </div>
                             <DialogFooter className="mt-2">
                               <Button variant="outline" onClick={() => setIsCameraQRModalOpen(false)} className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-zinc-300 text-xs">
                                 Close
                               </Button>
                             </DialogFooter>
                           </DialogContent>
                         </Dialog>
                       )}
                     </div>

                     {/* Cinematic Filter Presets - Dark High-Contrast Backdrop (MW-129) */}
                     <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/15 p-3 rounded-2xl shadow-2xl space-y-2.5 mt-4">
                       <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest block font-mono">Colour Grade Filter</span>
                         <span className="text-[8px] font-mono text-white/50 uppercase">{opticsFilter} active</span>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                         {(['default', 'warm', 'cool', 'noir'] as const).map((filter) => (
                           <button
                             key={filter}
                             onClick={() => setOpticsFilter(filter)}
                             className={cn(
                               "py-2 text-[8.5px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer shadow-sm",
                               opticsFilter === filter 
                                 ? "bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] scale-[1.02]"
                                 : "bg-slate-900/90 border-white/10 text-white/80 hover:bg-slate-800 hover:text-white"
                             )}
                           >
                             {filter === 'default' && 'Default'}
                             {filter === 'warm' && 'Warm Tint'}
                             {filter === 'cool' && 'Cool Modern'}
                             {filter === 'noir' && 'Noir Slate'}
                           </button>
                         ))}
                       </div>
                     </div>

                     {/* Camera Switcher (Only if multi-cam) */}
                     {hasMultipleCameras && (
                       <button
                         onClick={switchCamera}
                         className="w-full py-2.5 mt-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                       >
                         <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                         <span>Switch Camera Feed</span>
                       </button>
                     )}
                   </>
                 )}
               </motion.div>
             </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 z-10 pointer-events-none" />
          
          {/* Cinematic Teleprompter Overlay */}
          <motion.div 
             key="cinematic-teleprompter"
             drag={!isTheaterExpanded && !isTableReadActive && (prompterLayout as string) === 'overlay'}
             dragConstraints={videoContainerRef}
             dragElastic={0.05}
             dragMomentum={false}
             animate={isTheaterExpanded ? {
               opacity: 1,
               scale: 1,
               left: "24px",
               top: "76px",
               x: 0,
               y: 0,
               width: "calc(100vw - 48px)",
               height: "calc(100vh - 176px)"
             } : isAlchemySaving || reviewTake || captureModality === 'raw' ? {
               opacity: 0,
               scale: 0.95,
               x: 800,
             } : isTableReadActive ? (
                prompterSize === 'sm' ? {
                  opacity: 1,
                  scale: 1,
                  left: "22.5%",
                  top: "15%",
                  x: 0,
                  y: 0,
                  width: "55%",
                  height: "55%",
                } : prompterSize === 'md' ? {
                  opacity: 1,
                  scale: 1,
                  left: "12.5%",
                  top: "10%",
                  x: 0,
                  y: 0,
                  width: "75%",
                  height: "70%",
                } : {
                  opacity: 1,
                  scale: 1,
                  left: "3%",
                  top: "40px",
                  x: 0,
                  y: 0,
                  width: "94%",
                  height: "80%",
                }
              ) : prompterLayout === 'center' ? (
               isInterviewMode ? {
                 opacity: 1,
                 scale: 1,
                 left: "calc(50% - 340px)",
                 x: 0,
                 top: 170,
                 y: 0,
                 width: 680,
                 height: 340,
               } : {
                 opacity: 1,
                 scale: 1,
                 left: "12.5%",
                 top: "17.5%",
                 x: 0,
                 y: 0,
                 width: "75%",
                 height: "65%",
               }
             ) : {
               opacity: 1,
               scale: 1,
               left: `calc(100% - ${prompterWidth}px - 40px)`,
               top: "40px",
               x: 0,
               y: 0,
               width: prompterWidth,
               height: prompterHeight
             }}
             transition={{ type: "spring", stiffness: 120, damping: 22 }}
             style={{
               touchAction: 'none',
               ...(prompterLayout === 'center' || isTheaterExpanded ? { x: 0, y: 0 } : {})
             }}
             className={cn(
               "z-30 rounded-[2.5rem] shadow-2xl group/points overflow-hidden flex flex-col select-none relative",
               isTheaterExpanded ? "fixed top-[76px] bottom-[100px] left-6 right-6 z-40 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl transition-all duration-300 ease-in-out cursor-default p-8" : (prompterSize === 'mini' && !isTableReadActive) ? "p-4 bg-zinc-950/90" : "p-8",
               !isTheaterExpanded && !isTableReadActive ? "cursor-grab active:cursor-grabbing" : "",
               (isMuted || !mounted || !techAlignmentConfirmed) && "hidden",
               isAlchemySaving || reviewTake || captureModality === 'raw' ? "opacity-0 pointer-events-none" : "opacity-100 blur-0",
               isTheaterExpanded 
                 ? "" 
                 : isTableReadActive
                 ? "absolute bg-[#030303] border-2 border-sky-500/25 shadow-[0_0_50px_rgba(56,189,248,0.15)]"
                 : prompterLayout === 'center'
                 ? "absolute bg-zinc-950/65 backdrop-blur-md border border-white/10"
                 : "absolute bg-zinc-950/85 backdrop-blur-3xl border border-white/10"
             )}
           >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/10 rounded-full opacity-50" />
            {/* Header Top Line: Title & Size Actions */}
            <div 
              className={cn(
                "flex items-center justify-between shrink-0 select-none border-b border-white/5 pb-2 mb-3 mt-1"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`} />
                {prompterSize !== 'mini' && (
                  <span className="text-[10px] font-black text-emerald-400/90 uppercase tracking-[0.25em] animate-pulse whitespace-nowrap">
                    {isTableReadActive ? 'BLUEPRINT' : 'BLUEPRINT: SELECTED TAKE (ACT II)'}
                  </span>
                )}
                {prompterSize === 'mini' && (
                  <span className="text-[9px] font-black text-emerald-400/90 uppercase tracking-widest animate-pulse">BLUEPRINT</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider delayDuration={200}>
                  {/* Theater View Tooltip */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        data-hotspot-id="HS_PROMPTER_THEATER_BTN"
                        onClick={() => setIsTheaterExpanded(prev => !prev)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.2)] active:scale-95"
                      >
                        <ExternalLink className="w-3 h-3 text-emerald-400" />
                        <span className="text-[9px] font-black uppercase tracking-wider">{isTheaterExpanded ? 'Exit Theater' : 'Theater View'}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-950 border-white/10 max-w-[240px] p-3 text-xs leading-relaxed text-zinc-300 shadow-2xl z-[10002]">
                      <div className="space-y-1">
                        <p className="font-bold text-[9px] uppercase tracking-widest text-emerald-400">Theater View</p>
                        <p className="text-[10px] text-zinc-400 leading-normal">Expand teleprompter to full-screen view for maximum visual focus.</p>
                        <p className="text-[9px] text-zinc-500 font-mono pt-1 border-t border-white/5"><strong className="text-zinc-300">Shortcut:</strong> Press T or Esc</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Prompter Size Tooltip */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        data-hotspot-id="HS_PROMPTER_SIZE_BTN"
                        onClick={() => setPrompterSize(prev => prev === 'mini' ? 'sm' : prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : 'sm')}
                        className="p-1 rounded bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center w-6 h-6 shrink-0"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-950 border-white/10 max-w-[220px] p-3 text-xs leading-relaxed text-zinc-300 shadow-2xl z-[10002]">
                      <div className="space-y-1">
                        <p className="font-bold text-[9px] uppercase tracking-widest text-cyan-400">Prompter Scale</p>
                        <p className="text-[10px] text-zinc-400 leading-normal">Cycle prompter card dimensions (Small → Medium → Large → Mini).</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Stage Briefing Tooltip */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setIsBriefingOpen(true)}
                        className="p-1 rounded bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center w-6 h-6 shrink-0"
                      >
                        <Theater className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-950 border-white/10 max-w-[220px] p-3 text-xs leading-relaxed text-zinc-300 shadow-2xl z-[10002]">
                      <div className="space-y-1">
                        <p className="font-bold text-[9px] uppercase tracking-widest text-amber-400">Stage Briefing</p>
                        <p className="text-[10px] text-zinc-400 leading-normal">Open stage guide and performance checklist.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Header Second Row: Action Buttons */}
            {prompterSize !== 'mini' && !isTableReadActive && (
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2" data-tour="remote-bridge">
                  {/* QR Remote Controller Pair Trigger */}
                  <QRController memoryId={data?.id || ''} peerState={peerState} />

                  {/* Modality Mode Toggle Button */}
                  <button
                    onClick={toggleModalityMode}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                      modalityMode === 'interview'
                        ? "bg-sky-500/20 border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)] hover:bg-sky-500/30"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                    )}
                    title="Toggle Scripted vs Interview Mode"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{modalityMode === 'interview' ? 'Interview' : 'Scripted'}</span>
                  </button>
                </div>
              </div>
            )}
            
            <div className={cn("flex-grow flex overflow-hidden min-h-0", prompterSize === 'mini' ? "gap-2" : "gap-8")}>
              {/* Main Teleprompter */}
              <div className="flex-grow min-w-0 h-full">
                <Teleprompter 
                  modalityMode={modalityMode}
                  activeBeatIndex={activeBeatIndex}
                  onActiveBeatChange={setActiveBeatIndex}
                  isMini={prompterSize === 'mini'}
                  stream={stream}
                  prompterLayout={prompterLayout}
                  onPrompterLayoutToggle={() => setPrompterLayout(prev => prev === 'side' ? 'center' : 'side')}
                  isTableReadActive={isTableReadActive}
                  onTableReadToggle={isTableReadActive ? handleEndRehearsal : handleEngageRehearsal}
                  rehearsalSpeed={rehearsalSpeed}
                  isTheaterExpanded={isTheaterExpanded}
                  onTheaterExpandToggle={() => setIsTheaterExpanded(prev => !prev)}
                  hasRecordedTake={!!recordedBlob}
                  isAlchemySaving={isAlchemySaving}
                  isAlchemyComplete={isAlchemyComplete}
                />
              </div>
            </div>
          </motion.div>

          {/* Cinematic Camera Overlays (Safe Areas/REC) */}
          {!isTableReadActive && (
            <div className="absolute inset-0 z-20 pointer-events-none border-[40px] border-transparent">
               
               {/* Corner Accents */}
               <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-xl relative">
                  <MentorshipHotspot 
                    number={1} 
                    label="Position Camera & Check Mic" 
                    hotspotId="HS_ACT3_MENTOR_STEP1"
                    isCompleted={Boolean(stream)}
                    className="-top-3 -left-3" 
                  />
                </div>
               <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-xl" />
               <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-xl" />
               <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-xl" />
               
               {/* Safe Area Guides */}
               <div className="absolute inset-8 border border-dashed border-white/5 rounded-2xl" />
               
               {/* REC Indicator */}
               <AnimatePresence>
                 {isRecording && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(244,63,94,0.4)]"
                   >
                     <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                     On Air • Recording
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Remote Connection Pulse HUD (Right, Centered) */}
               <AnimatePresence>
                 {peerState === 'authorised' && (
                   <motion.div
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="absolute top-1/2 -translate-y-1/2 right-8 flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] pointer-events-auto"
                   >
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     Remote Linked
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          )}

             <div className="absolute inset-0 z-40 flex flex-col justify-between p-10 w-full mx-auto pointer-events-none">
                {!isTableReadActive ? (
                  <div className="flex justify-between items-start w-full pointer-events-auto">
                  <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                      {isRecording ? (
                        <motion.div 
                          key="recording"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-center gap-3 px-4 py-2 rounded-full font-mono font-bold tracking-widest backdrop-blur-md border ${isWarningLimit ? 'bg-amber-500/20 border-amber-500 text-amber-200' : 'bg-rose-500/20 border-rose-500 text-rose-200'}`}
                        >
                          <motion.div 
                            initial={{ opacity: 1 }}
                            animate={{ opacity: [1, 0, 1] }} 
                            transition={{ repeat: Infinity, duration: 1.5 }} 
                            className={`w-3 h-3 rounded-full ${isWarningLimit ? 'bg-amber-400' : 'bg-rose-500'}`} 
                          />
                          {formatTime(recordingTime)}
                        </motion.div>
                      ) : isCountingIn ? (
                        <motion.div 
                          key="countin"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 px-4 py-2 rounded-full font-mono font-bold tracking-widest backdrop-blur-md border bg-emerald-500/20 border-emerald-500 text-emerald-200"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          {statusLabel}
                        </motion.div>
                      ) : (
                        <div className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md text-xs transition-all font-mono font-bold tracking-wider",
                          (mounted && isMuted)
                            ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse"
                            : (mounted && error)
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                            : "bg-black/40 border-white/20 text-white/50"
                        )}>
                          {mounted && isMuted ? (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                              <span>OPTICS SHIELD ACTIVE // RE-ENABLE HARDWARE TO RECORD</span>
                            </>
                          ) : mounted && error ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              <span>HARDWARE ACCESS DENIED</span>
                            </>
                          ) : (
                            <>
                              <Disc className="w-3.5 h-3.5" /> {statusLabel}
                            </>
                          )}
                        </div>
                      )}
                    </AnimatePresence>
 
                    {/* Sleek Metadata Tag & Replay Tour aligned side-by-side with Status Label */}
                    <div className="flex items-center gap-2">
                      {!isOnline && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-500/20 border border-rose-500/50 text-rose-300 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse backdrop-blur-md h-[30px] cursor-help pointer-events-auto">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                <span>OFFLINE MODE // SECURE BROWSER SANDBOX ACTIVE</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-slate-900 border-white/10 text-[10px] py-2 px-3 shadow-2xl z-[10002] max-w-[280px]">
                              <div className="flex flex-col gap-1 text-left">
                                <span className="text-rose-400 font-bold uppercase tracking-widest text-[9px]">Offline & Sandbox Shield Engaged</span>
                                <span className="text-[10px] text-zinc-300 leading-normal normal-case font-normal">
                                  Your network connection or remote camera bridge is disconnected. Recording and media processing are executing 100% locally in your secure browser sandbox, and no data is being sent over the network.
                                </span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {isOnline && bridgeStatus !== 'disconnected' && (bridgeStatus === 'reconnecting' || syncStatus === 'local_cache') && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse backdrop-blur-md h-[30px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>HANDSHAKE OUT OF SYNC // LOCAL CACHE ENGAGED</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 px-4 py-1.5 bg-black/60 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/70 backdrop-blur-md h-[30px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>
                          INPUT: {activeInput === 'wireless' ? 'REMOTE WIRELESS LENS (1080p)' : 'STUDIO WEBCAM (720p)'}
                        </span>
                      </div>

                      {/* Persistent Theater Mode Fullscreen Trigger */}
                      <button
                        onClick={() => setIsTheaterExpanded(prev => !prev)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md h-[30px] shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all cursor-pointer pointer-events-auto active:scale-95"
                        title="Toggle Fullscreen Teleprompter Theater Mode"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isTheaterExpanded ? 'EXIT FOCUS' : 'PROMPTER FOCUS'}</span>
                      </button>
 
                      {/* Replay Planning Tour Button */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setIsBriefingOpen(true)}
                              className="w-[30px] h-[30px] rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/10 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center cursor-pointer pointer-events-auto"
                              aria-label="Replay Planning Tour"
                            >
                              <Theater className="w-4 h-4 text-emerald-400 animate-pulse" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-slate-900 border-white/10 text-[10px] font-black uppercase tracking-widest py-2 px-3 shadow-2xl z-[10002]">
                            <div className="flex flex-col gap-1 text-left">
                              <span className="text-emerald-400 font-bold">Replay Planning Tour</span>
                              <span className="text-[9px] text-white/40 normal-case font-normal">Refresh your memory on studio tools</span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  </div>
                ) : null}

             {!isTableReadActive ? (
               <div 
                 ref={stageRef}
                 data-blueprint="SoloStage:StageArea"
                 className={cn(
                   "flex-1 relative min-h-0 flex flex-col items-center justify-start py-20 px-8 transition-all duration-700",
                   "overflow-y-auto custom-scrollbar",
                   modality === null ? "opacity-0 scale-95" : "opacity-100 scale-100"
                 )}
               >
                 <AnimatePresence>
                   {isCountingIn && countIn !== null && (
                    <motion.div 
                      key="countdown"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-40"
                    >
                      <span className="font-serif text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                        {countIn}
                      </span>
                      <span className="text-xs font-mono uppercase tracking-[0.4em] text-white/40 mt-4 animate-pulse">
                        {statusLabel}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                 <AnimatePresence>
                    {isInterviewMode && techAlignmentConfirmed && (
                      <motion.div 
                        key="interviewer-card"
                        drag
                        dragConstraints={!isTableReadActive ? stageRef : undefined}
                        dragElastic={0.05}
                        dragMomentum={false}
                        initial={prompterLayout === 'center' ? {
                          opacity: 0,
                          left: "50%",
                          x: "-50%",
                          top: 30,
                          y: 0,
                          width: 680,
                          height: 120
                        } : {
                          opacity: 0,
                          left: 40,
                          x: 0,
                          top: 100,
                          y: 0,
                          width: 340,
                          height: 320
                        }}
                        animate={isAlchemySaving || reviewTake || captureModality === 'raw' ? {
                          opacity: 0,
                          scale: 0.95,
                        } : prompterLayout === 'center' ? {
                          opacity: 1,
                          scale: 1,
                          left: "50%",
                          x: "-50%",
                          top: 30,
                          y: 0,
                          width: 680,
                          height: 120
                        } : {
                          opacity: 1,
                          scale: 1,
                          left: 40,
                          x: 0,
                          top: 100,
                          y: 0,
                          width: 340,
                          height: 320
                        }}
                        exit={{ opacity: 0, x: -50 }}
                        style={{ touchAction: 'none' }}
                        transition={{ type: "spring", stiffness: 120, damping: 22 }}
                        className={cn(
                          "absolute bg-slate-950/85 backdrop-blur-3xl border border-sky-500/30 rounded-[2.5rem] p-6 shadow-2xl z-40 overflow-hidden flex cursor-grab active:cursor-grabbing select-none",
                          isAlchemySaving || reviewTake || captureModality === 'raw' ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto",
                          prompterLayout === 'center' ? "flex-row items-center gap-6 justify-between" : "flex-col text-center justify-between"
                        )}
                      >
                        {prompterLayout === 'center' ? (
                          <>
                            <div className="flex flex-col gap-1 items-start select-none shrink-0 w-32 border-r border-white/10 pr-4">
                               <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest animate-pulse">AI DIRECTOR</span>
                               <span className="text-[7px] font-mono text-white/40 tracking-wider font-bold">INTERVIEW LIVE</span>
                            </div>
                            <div className="flex-grow flex items-center justify-start min-h-0 px-2 overflow-hidden">
                               <p className="text-xs md:text-sm font-headline text-white leading-relaxed italic overflow-y-auto custom-scrollbar pr-2 max-h-[80px] text-left w-full">
                                  "{currentQuestion || 'Ready to start the interview...'}"
                               </p>
                            </div>
                            <TooltipProvider delayDuration={200}>
                               <div className="flex items-center gap-2.5 shrink-0 pl-2">
                                  {currentQuestionIndex > 0 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button onClick={triggerPrevQuestion} disabled={isSynthesizing} className="px-3 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1 cursor-pointer">
                                           <ArrowLeft className="w-3 h-3" /> Back
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="bg-slate-900 border border-white/20 text-slate-200 text-xs px-3 py-1.5 rounded-lg shadow-xl z-[100]">
                                        Return to previous interview prompt
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button onClick={triggerNextQuestion} disabled={isSynthesizing} className="px-4 py-2 bg-sky-500 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                                         <MessageSquare className="w-3.5 h-3.5" /> Next
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-slate-900 border border-sky-500/30 text-sky-200 text-xs px-3 py-1.5 rounded-lg shadow-xl z-[100]">
                                      Advance to next AI Director interview question
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button onClick={handleCheckFraming} disabled={isAnalyzingFraming} className="px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-[9px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                                         <Layout className="w-3.5 h-3.5 text-emerald-400" /> Lint
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-slate-900 border border-emerald-500/30 text-emerald-200 text-xs px-3 py-1.5 rounded-lg shadow-xl z-[100]">
                                      Analyze live camera framing &amp; rule-of-thirds alignment
                                    </TooltipContent>
                                  </Tooltip>
                               </div>
                             </TooltipProvider>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col gap-1 items-center mb-1 select-none shrink-0">
                               <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] animate-pulse">AI DIRECTOR: INTERVIEW ACTIVE</span>
                               <div className="w-8 h-[1px] bg-sky-500/30 my-1" />
                            </div>
                            <div className="flex-grow flex items-center justify-center min-h-0 py-2">
                               {isSynthesizing ? (
                                 <div className="flex flex-col items-center gap-2 py-3 text-sky-400 animate-pulse">
                                   <Sparkles className="w-4 h-4 animate-spin text-sky-400" />
                                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">AI Director Formulating Cue...</span>
                                 </div>
                               ) : (
                                 <p className="text-xs md:text-sm font-headline text-white leading-relaxed italic max-h-[140px] overflow-y-auto custom-scrollbar px-1">
                                    "{currentQuestion || 'Ready to start the interview...'}"
                                 </p>
                               )}
                            </div>
                            <TooltipProvider delayDuration={200}>
                               <div className="flex items-center gap-3 justify-center pt-2 shrink-0">
                                  {currentQuestionIndex > 0 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button onClick={triggerPrevQuestion} disabled={isSynthesizing} className="px-3 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1 cursor-pointer">
                                           <ArrowLeft className="w-3 h-3" /> Back
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="bg-slate-900 border border-white/20 text-slate-200 text-xs px-3 py-1.5 rounded-lg shadow-xl z-[100]">
                                        Return to previous interview prompt
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button onClick={triggerNextQuestion} disabled={isSynthesizing} className="px-4 py-2 bg-sky-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                                         <MessageSquare className="w-3.5 h-3.5" /> Next
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-slate-900 border border-sky-500/30 text-sky-200 text-xs px-3 py-1.5 rounded-lg shadow-xl z-[100]">
                                      Advance to next AI Director interview question
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button onClick={handleCheckFraming} disabled={isAnalyzingFraming} className="px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                                         <Layout className="w-3.5 h-3.5 text-emerald-400" /> Lint
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-slate-900 border border-emerald-500/30 text-emerald-200 text-xs px-3 py-1.5 rounded-lg shadow-xl z-[100]">
                                      Analyze live camera framing &amp; rule-of-thirds alignment
                                    </TooltipContent>
                                  </Tooltip>
                               </div>
                             </TooltipProvider>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
             </div>
             ) : (
               <div className="flex-grow min-h-0 w-full flex flex-col items-center justify-center relative pointer-events-none" />
             )}

             {techAlignmentConfirmed && (
                <div className="flex justify-between items-center w-full px-12 pb-6 pointer-events-auto">
                   {captureModality === 'raw' ? (
                     /* Bottom-Left: Elegant visual microphone level meter bar */
                     <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 pointer-events-auto">
                       <Volume2 className={cn("w-4 h-4 transition-colors", isRecording ? "text-rose-400" : "text-emerald-400")} />
                       <div className="flex items-end gap-[2px] h-6 w-32 px-1">
                         {waveform.slice(0, 24).map((value, i) => (
                           <motion.div
                             key={i}
                             className={cn(
                               "w-[3px] rounded-full transition-all",
                               isRecording 
                                 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" 
                                 : "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                             )}
                             animate={{ height: `${Math.max(4, value * (isRecording ? 48 : 24))}px` }}
                             transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                           />
                         ))}
                       </div>
                       <span className={cn("text-[10px] font-mono font-bold w-8 text-right transition-colors", isRecording ? "text-rose-400" : "text-emerald-400")}>{volume}%</span>
                     </div>
                   ) : (
                     isTableReadActive ? (
                       <div className={cn(
                         "flex flex-col gap-2 p-3 rounded-2xl border transition-all pointer-events-auto backdrop-blur-md",
                         isInterviewMode ? "bg-sky-500/10 border-sky-500/30 text-sky-400" : "bg-black/40 border-white/10 text-white/60"
                       )}>
                         {/* Row 1: SCROLL controls */}
                         <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-1">
                           <button
                             onClick={() => globalActions.toggleScrolling()}
                             className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                           >
                             {isScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                             <span className="text-[10px] font-black uppercase tracking-wider">SCROLL</span>
                           </button>
                           <div className="flex items-center gap-1">
                             <button
                               onClick={() => setRehearsalSpeed(Math.max(0.5, rehearsalSpeed - 0.1))}
                               className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white cursor-pointer"
                             >
                               <ChevronDown className="w-3.5 h-3.5" />
                             </button>
                             <span className="text-[10px] font-mono font-bold text-sky-400 w-6 text-center">{rehearsalSpeed.toFixed(1)}</span>
                             <button
                               onClick={() => setRehearsalSpeed(rehearsalSpeed + 0.1)}
                               className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white cursor-pointer"
                             >
                               <ChevronUp className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         </div>
                         {/* Row 2: Interview Mode Toggle */}
                         <button
                           onClick={() => setIsInterviewMode(!isInterviewMode)}
                           className="text-left text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
                         >
                           {isInterviewMode ? 'Interviewer Active' : 'Start Interview'}
                         </button>
                       </div>
                     ) : (
                       <button onClick={() => setIsInterviewMode(!isInterviewMode)} className={`px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all ${isInterviewMode ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-black/40 border-white/10 text-white/40'}`}>
                          {isInterviewMode ? 'Interviewer Active' : 'Start Interview'}
                       </button>
                     )
                   )}

                   {/* Center: Record button & Vocal Coaching Controls if rehearsal active */}
                   <div className="flex items-center gap-6 pointer-events-auto">
                     {isCountingIn ? (
                       <div className="relative flex flex-col items-center">
                         <div className="absolute -top-12 px-4 py-1.5 bg-emerald-600 border border-emerald-500 text-white text-[8px] font-black uppercase tracking-[0.25em] rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.6)] shrink-0 select-none pointer-events-none whitespace-nowrap flex items-center gap-1.5 z-40">
                           <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                           Rolling in {countIn}...
                         </div>
                         <button onClick={cancelCapture} className="w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-500 hover:bg-emerald-500/30 transition-all flex items-center justify-center animate-pulse group relative">
                           <Square className="w-6 h-6 text-emerald-400 fill-current opacity-20 group-hover:opacity-100 transition-opacity" />
                           <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-black text-emerald-400 select-none pointer-events-none">
                             {countIn}
                           </span>
                         </button>
                       </div>
                     ) : !isRecording ? (
                       <div className="relative flex flex-col items-center">
                         {!isRecording && !isCountingIn && techAlignmentConfirmed && (
                           <div className="absolute -top-12 px-4 py-1.5 bg-rose-600 border border-rose-500 text-white text-[8px] font-black uppercase tracking-[0.25em] rounded-full animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.6)] shrink-0 select-none pointer-events-none whitespace-nowrap flex items-center gap-1.5 z-40">
                             <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                             Start Performance
                           </div>
                         )}
                         <button 
                           data-hotspot-id="HS_STAGE_RECORD_BTN"
                           onClick={handleStartCapture} 
                           aria-label="Start Performance"
                           disabled={!stream || uploading || isAlchemySaving || !techAlignmentConfirmed} 
                           className="w-20 h-20 rounded-full bg-white/10 border-4 border-white/40 hover:border-rose-500 hover:bg-rose-500/20 transition-all flex items-center justify-center group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/40 disabled:hover:bg-white/10 relative"
                           title={!stream ? "Hardware access muted or blocked. Re-enable camera and mic access to record." : !techAlignmentConfirmed ? "Please confirm technical alignment before starting performance." : undefined}
                         >
                           <div className="w-6 h-6 rounded-full bg-rose-500 group-hover:scale-125 group-disabled:group-hover:scale-100 transition-all" />
                         </button>
                       </div>
                     ) : (
                       <div className="relative flex items-center gap-4">
                         {/* Dedicated Recording Timer Next to the Recording Button */}
                         <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/60 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold tracking-widest rounded-full shadow-[0_0_15px_rgba(244,63,94,0.2)] select-none pointer-events-auto transition-all animate-pulse">
                           <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                           <span>{formatTime(recordingTime)}</span>
                         </div>

                         <button 
                           data-hotspot-id="HS_STAGE_RECORD_BTN"
                           onClick={() => { stopRecording(); setIsCameraActive(false); }} 
                           className="w-20 h-20 rounded-full bg-rose-500/20 border-4 border-rose-500 hover:bg-rose-500 transition-all flex items-center justify-center cursor-pointer active:scale-95 z-50 pointer-events-auto"
                           aria-label="Stop Recording"
                         >
                           <Square className="w-6 h-6 text-white fill-current" />
                         </button>
                       </div>
                     )}

                     {/* Vocal Coaching Controls (Slashes, Brakes, Highlight) shown during active Table Read */}
                     {isTableReadActive && (
                       <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                         <button
                           onClick={() => globalActions.setShowBreathingMarks(!showBreathingMarks)}
                           className={cn(
                             "px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border border-transparent",
                             showBreathingMarks ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]" : "text-white/40 hover:text-white/80"
                           )}
                         >
                           Slashes
                         </button>
                         <button
                           onClick={() => globalActions.setEnablePunctuationBraking(!enablePunctuationBraking)}
                           className={cn(
                             "px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border border-transparent",
                             enablePunctuationBraking ? "bg-sky-500/20 border-sky-500/30 text-sky-400 font-bold shadow-[0_0_10px_rgba(56,189,248,0.15)]" : "text-white/40 hover:text-white/80"
                           )}
                         >
                           Brakes
                         </button>
                         <button
                           onClick={() => globalActions.setIsolateSentenceHighlight(!isolateSentenceHighlight)}
                           className={cn(
                             "px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border border-transparent",
                             isolateSentenceHighlight ? "bg-purple-500/20 border-purple-500/30 text-purple-400 font-bold shadow-[0_0_10px_rgba(168,85,247,0.15)]" : "text-white/40 hover:text-white/80"
                           )}
                         >
                           Highlight
                         </button>
                       </div>
                     )}
                   </div>

                   {/* Right: Spacer or original Volume visualizer with layout/popout tools */}
                   {captureModality === 'raw' ? (
                     <div className="w-[180px]" /> /* Spacer to balance the mic visualizer width on the left */
                   ) : (
                     <div className="flex items-center gap-4">
                       <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 pointer-events-auto">
                         <Volume2 className={cn("w-4 h-4 transition-colors", isRecording ? "text-rose-400" : "text-emerald-400")} />
                         <div className="flex items-end gap-[2px] h-6 w-32 px-1">
                           {waveform.slice(0, 24).map((value, i) => (
                             <motion.div
                               key={i}
                               className={cn(
                                 "w-[3px] rounded-full transition-all",
                                 isRecording 
                                   ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" 
                                   : "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                               )}
                               animate={{ height: `${Math.max(4, value * (isRecording ? 48 : 24))}px` }}
                               transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                             />
                           ))}
                         </div>
                         <span className={cn("text-[10px] font-mono font-bold w-8 text-right transition-colors", isRecording ? "text-rose-400" : "text-emerald-400")}>{volume}%</span>
                       </div>

                       {isTableReadActive && (
                         <div className="flex items-center gap-2 pointer-events-auto">
                           <button
                             onClick={() => setPrompterLayout(prev => prev === 'side' ? 'center' : 'side')}
                             className="p-2.5 bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-all cursor-pointer flex items-center justify-center w-9 h-9"
                             title="Toggle Prompter Layout Mode"
                           >
                             <Layout className="w-4 h-4" />
                           </button>
                           <button
                             onClick={() => {
                               const width = 800;
                               const height = 360;
                               const left = (window.screen.width - width) / 2;
                               const top = 0;
                               window.open(
                                 `/studio/teleprompter-popout?sessionId=${sessionId}`,
                                 `TeleprompterPopout_${sessionId}`,
                                 `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
                               );
                             }}
                             className="p-2.5 bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-all cursor-pointer flex items-center justify-center w-9 h-9"
                             title="Pop Out Teleprompter"
                           >
                             <ExternalLink className="w-4 h-4" />
                           </button>
                         </div>
                       )}
                     </div>
                   )}
                </div>
             )}

             {/* Cinematic Slate / Alchemy Saving Ceremony Overlay (MW-35) */}
             <AnimatePresence>
                {isAlchemySaving && (
                   <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }} 
                     className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-2xl p-10"
                   >
                      {/* Vintage Projector/Slate Style Loader */}
                      <div className="relative w-80 aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl mb-8 bg-black">
                         {recordedBlob && (
                            <video 
                               autoPlay 
                               loop 
                               muted 
                               playsInline
                               className="w-full h-full object-cover opacity-60 grayscale scale-102 blur-[0.5px]"
                               src={reviewVideoUrl || ''}
                            />
                         )}
                         {/* Mastering Watermark */}
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                            <div className="border border-rose-500/40 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 font-mono text-[9px] uppercase tracking-widest animate-pulse flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                               Mastering in Progress
                            </div>
                         </div>
                      </div>

                      <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2 text-center">
                         {isAlchemyRetrying ? "Sync Interrupted" : "Synthesising Master"}
                      </h3>
                      
                      <p className="text-xs text-white/50 max-w-sm text-center leading-relaxed mb-6 font-mono uppercase tracking-wider">
                         {isAlchemyRetrying 
                            ? "Connection interrupted. Retrying authorisation..."
                            : "Sealing Ceremony in progress. Please do not close the studio."}
                      </p>

                      {/* Progress Bar */}
                      <div className="w-full max-w-md bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 relative mb-4">
                         <motion.div 
                            className={cn(
                              "h-full rounded-full transition-all duration-300", 
                              isAlchemyRetrying ? "bg-amber-500" : "bg-emerald-500"
                            )} 
                            style={{ width: `${alchemyProgress}%` }}
                         />
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[9px] text-white/30 uppercase tracking-widest">
                         <span>Archival Progress:</span>
                         <span className={isAlchemyRetrying ? "text-amber-400 animate-pulse" : "text-emerald-400 font-bold"}>{alchemyProgress}%</span>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>

             <AnimatePresence>
                {reviewTake && reviewVideoUrl && (
                   <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }} 
                     className="absolute inset-0 z-[100] pointer-events-auto flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6 md:p-10 animate-fade-in"
                     style={{ pointerEvents: 'auto' }}
                   >
                     <RecordEditingSuite
                       segments={
                         recordedSegments && recordedSegments.length > 0
                           ? recordedSegments
                           : [{
                               segmentId: 'master_take_01',
                               blobUrl: reviewVideoUrl,
                               startOffset: 0,
                               endOffset: videoDuration || 60,
                               duration: videoDuration || 60,
                             }]
                       }
                       onUpdateSegments={setRecordedSegments}
                       onApprove={handleStitchAndApprove}
                       onDiscard={handleDiscardTake}
                       isStitching={isStitching}
                       stitchingStatus={stitchingStatus}
                     />
                   </motion.div>
                )}
             </AnimatePresence>
          </div>

          {error ? (() => {
            const errType = cameraError?.type || 'unknown';
            
            let icon = <Lock className="w-8 h-8" />;
            let title = "Optics & Mic Locked";
            let subtitle = "To record your cinematic memory, browser access to your camera and microphone is required. Your stream is processed entirely locally.";
            let actionLabel = "Re-attempt Access";
            let guideTitle = "How to Unlock Permissions";
            
            let guideContent = (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                 {/* Chrome/Edge/Firefox Instruction */}
                 <div className="space-y-2">
                    <div className="font-bold text-white flex items-center gap-2">
                       <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">1</span>
                       Chrome / Edge / Firefox
                    </div>
                    <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                       <li>Click the <strong className="text-white font-semibold">Site Settings / Lock Icon (🔒 or 🎛️ sliders)</strong> next to the URL in the address bar.</li>
                       <li>Toggle <strong className="text-white font-semibold">Camera</strong> and <strong className="text-white font-semibold">Microphone</strong> to <strong className="text-emerald-400 font-semibold">Allow</strong>.</li>
                    </ul>
                 </div>

                 {/* Safari Instruction */}
                 <div className="space-y-2">
                    <div className="font-bold text-white flex items-center gap-2">
                       <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">2</span>
                       Apple Safari
                    </div>
                    <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                       <li>Click <strong className="text-white font-semibold">Safari</strong> in the menu bar, then <strong className="text-white font-semibold">Settings for This Website...</strong></li>
                       <li>Set both <strong className="text-white font-semibold">Camera</strong> and <strong className="text-white font-semibold">Microphone</strong> to <strong className="text-emerald-400 font-semibold">Allow</strong>.</li>
                    </ul>
                 </div>
              </div>
            );

            if (errType === 'notFound') {
              icon = <AlertTriangle className="w-8 h-8" />;
              title = "No Media Devices Found";
              subtitle = "No camera or microphone device could be recognised on this system. Please check your physical connections.";
              actionLabel = "Scan for Hardware";
              guideTitle = "Hardware Verification Steps";
              guideContent = (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">1</span>
                         Physical Connections
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Verify that your external webcam or microphone is firmly plugged in.</li>
                         <li>Try using a different USB port directly on your computer.</li>
                      </ul>
                   </div>
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">2</span>
                         System Privacy Settings
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>On Windows, go to <strong className="text-white font-semibold">Settings &gt; Privacy &gt; Camera</strong> and enable access.</li>
                         <li>On macOS, open <strong className="text-white font-semibold">System Settings &gt; Privacy & Security &gt; Camera</strong> and check your browser.</li>
                      </ul>
                   </div>
                </div>
              );
            } else if (errType === 'notReadable') {
              icon = <RefreshCw className="w-8 h-8" />;
              title = "Hardware Already Sourced";
              subtitle = "The camera or microphone is already in use by another programme or browser tab.";
              actionLabel = "Re-attempt Access";
              guideTitle = "Device Conflict Resolution";
              guideContent = (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">1</span>
                         Active Background Applications
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Close video-conferencing apps like Zoom, Microsoft Teams, Google Meet, or Skype.</li>
                         <li>Ensure no other browser tabs or software are actively using your camera/mic.</li>
                      </ul>
                   </div>
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">2</span>
                         Hard Refresh & Re-attempt
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Click the <strong className="text-white font-semibold">Re-attempt Access</strong> button below to force-release the device.</li>
                         <li>Restart your browser if the device handle remains locked by the operating system.</li>
                      </ul>
                   </div>
                </div>
              );
            } else if (errType === 'overconstrained') {
              icon = <Settings2 className="w-8 h-8" />;
              title = "Optics Resolution Mismatch";
              subtitle = "The requested premium 4K or HD video resolution constraints could not be satisfied by your media hardware.";
              actionLabel = "Retry Lower Cascade";
              guideTitle = "Constraint Resolution Guide";
              guideContent = (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">1</span>
                         Resolution Limits
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Your camera may not support the high resolution constraints (e.g. 4K, 1080p, or 720p).</li>
                         <li>The adaptive resolution system will automatically fall back to standard settings on retry.</li>
                      </ul>
                   </div>
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">2</span>
                         Force Default Settings
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Click <strong className="text-white font-semibold">Retry Lower Cascade</strong> to cycle down through the adaptive cascade constraints.</li>
                      </ul>
                   </div>
                </div>
              );
            } else if (errType === 'unknown') {
              icon = <AlertTriangle className="w-8 h-8" />;
              title = "Hardware Bridge Interrupted";
              subtitle = "An unexpected error occurred while establishing the connection to your media devices.";
              actionLabel = "Re-attempt Access";
              guideTitle = "System Recovery Guide";
              guideContent = (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">1</span>
                         Quick Reconnect
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Unplug and plug your camera/mic back in to trigger system level driver resets.</li>
                         <li>Check if the device functions properly in other web browser applications.</li>
                      </ul>
                   </div>
                   <div className="space-y-2">
                      <div className="font-bold text-white flex items-center gap-2">
                         <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">2</span>
                         System Diagnostics
                      </div>
                      <ul className="space-y-1.5 text-white/50 pl-5 list-disc">
                         <li>Perform a full page reload (Ctrl+R or Cmd+R) to clear all stale navigator handles.</li>
                         <li>Verify that your browser is up-to-date and fully supports WebRTC capture.</li>
                      </ul>
                   </div>
                </div>
              );
            }

            return (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar">
                 {/* Premium Warning Lock Icon */}
                 <div className="relative mb-6">
                   <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
                   <div className="relative w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      {icon}
                   </div>
                 </div>

                 {/* Title */}
                 <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2 text-center">
                   {title}
                 </h3>
                 
                 {/* Subtitle */}
                 <p className="text-sm text-white/60 max-w-md text-center leading-relaxed mb-6">
                   {subtitle}
                 </p>

                 {/* Step-by-Step Instructions */}
                 <div className="w-full max-w-xl bg-white/[0.02] border border-white/5 rounded-3xl p-6 mb-6 text-left space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{guideTitle}</span>
                       <span className="text-[9px] font-mono text-rose-500/80 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10 uppercase">Required</span>
                    </div>
                    
                    {guideContent}

                    <p className="text-[10px] text-white/30 text-center italic pt-2 border-t border-white/5">
                       Tip: You may need to refresh the browser if your device updates don't apply immediately.
                    </p>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md justify-center">
                    {/* Re-attempt Access Button */}
                    <button 
                       onClick={handleReattemptAccess}
                       className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl hover:scale-102 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-98 transition-all flex items-center justify-center gap-2 group"
                    >
                       <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                       {actionLabel}
                    </button>

                    {/* Go Back Button */}
                    <button 
                       onClick={() => {
                          // Retreat to Scribing (Stage 0)
                          setProductionStage(0);
                       }}
                       className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white font-bold text-[11px] uppercase tracking-widest rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                       Go Back
                    </button>
                 </div>
              </div>
            );
          })() : !isCameraActive && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
               <Video className="w-16 h-16 text-white/20 mb-6" />
               <h3 className="text-xl font-bold text-white mb-2">Camera Offline</h3>
               <button onClick={() => setIsCameraActive(true)} className="px-8 py-3 bg-white text-black font-bold rounded-full">Initialize optics</button>
            </div>
          )}
       </div>

       <AnimatePresence>
          {showSoundCheck && stream && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl">
                <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-[3rem] p-10 text-center shadow-2xl">
                   <div className={`p-6 rounded-full border-4 mx-auto w-24 mb-8 ${micLevel > 15 ? 'bg-emerald-500/20 border-emerald-500' : 'bg-rose-500/10 border-rose-500/30'}`}>
                      <Mic2 className={`w-10 h-10 ${micLevel > 15 ? 'text-emerald-400' : 'text-rose-400'}`} />
                   </div>
                    <h2 className="text-2xl font-black text-white mb-2 uppercase">Sound Check</h2>
                    <p className="text-xs text-white/50 leading-relaxed mb-6 font-light">
                      Speak clearly into your microphone to verify acoustic levels. Say a quick <strong className="text-emerald-400">"test 1, 2, 3"</strong> before we initiate capture!
                    </p>
                   <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-8">
                      <motion.div className={`h-full ${micLevel > 15 ? 'bg-emerald-500' : 'bg-rose-500'}`} animate={{ width: `${micLevel}%` }} />
                   </div>
                   <button onClick={() => setShowSoundCheck(false)} className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl uppercase tracking-widest">Enter Studio</button>
                </div>
             </motion.div>
          )}
       </AnimatePresence>

        {/* Directorial Rehearsal Feedback Note Card */}
        <AnimatePresence>
          {showRehearsalFeedback && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl"
             >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="max-w-md w-full bg-slate-900 border border-white/10 rounded-[3rem] p-10 text-center shadow-2xl space-y-6"
                >
                   <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
                   </div>
                   <div className="space-y-2">
                      <h2 className="text-xl font-black text-white uppercase tracking-widest">REHEARSAL DESK // AUTHORISED BLUEPRINT</h2>
                      <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Rhythm Authorised. Restore Stage?</p>
                   </div>
                   <p className="text-sm text-white/80 leading-relaxed italic font-serif py-2">
                      "That felt authorised. The pacing on the 'Nairobi' section is your soul-print. Shall we take it to the floor for a real capture?"
                   </p>
                   <div className="pt-2 flex flex-col gap-3">
                      <button 
                        onClick={() => {
                           setShowRehearsalFeedback(false);
                           handleEndRehearsal();
                       }} 
                        className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 active:scale-95 transition-all text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.2)] cursor-pointer"
                      >
                         Restore Stage & Take to Floor
                      </button>
                      <button 
                        onClick={() => {
                           setShowRehearsalFeedback(false);
                        }} 
                        className="w-full py-3.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/60 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl border border-white/10 cursor-pointer"
                      >
                         Keep Rehearsing
                      </button>
                   </div>
                </motion.div>
             </motion.div>
          )}
        </AnimatePresence>
     </div>
  );

  const renderNotepad = () => (
    <div className="w-full max-w-[95vw] xl:max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-8 pb-8">
       <div className="w-full lg:w-1/2 flex flex-col gap-6">
          {/* Top Carousel Navigation Header */}
          <div className="w-full bg-slate-950/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex items-center justify-between shadow-xl">
             <div className="flex items-center gap-2">
                <button
                   type="button"
                   data-hotspot-id="HS_ACT4_CAROUSEL_SLIDE_VIDEO_BTN"
                   onClick={() => setActiveCarouselSlide('video')}
                   className={`px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                      activeCarouselSlide === 'video'
                        ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] font-black scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
                   }`}
                >
                   <FilmIcon className="w-3.5 h-3.5" />
                   <span>🎞️ Master Reel</span>
                </button>

                <button
                   type="button"
                   data-hotspot-id="HS_ACT4_CAROUSEL_SLIDE_POSTER_BTN"
                   onClick={() => setActiveCarouselSlide('poster')}
                   className={`px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                      activeCarouselSlide === 'poster'
                        ? 'bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] font-black scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
                   }`}
                >
                   <Camera className="w-3.5 h-3.5" />
                   <span>🎨 Poster Studio</span>
                </button>
             </div>

             {/* Carousel Slide Indicators & Direction Arrows */}
             <div className="flex items-center gap-3 pr-2">
                <div className="flex items-center gap-1">
                   <span className={`w-2 h-2 rounded-full transition-all ${activeCarouselSlide === 'video' ? 'bg-emerald-400 w-4' : 'bg-white/20'}`} />
                   <span className={`w-2 h-2 rounded-full transition-all ${activeCarouselSlide === 'poster' ? 'bg-amber-400 w-4' : 'bg-white/20'}`} />
                </div>
                <button
                   type="button"
                   onClick={() => setActiveCarouselSlide(activeCarouselSlide === 'video' ? 'poster' : 'video')}
                   className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                   title="Toggle Deck Slide"
                >
                   {activeCarouselSlide === 'video' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
             </div>
          </div>

          {/* Carousel Slide Viewport */}
          <AnimatePresence mode="wait">
             {activeCarouselSlide === 'video' ? (
                /* SLIDE 1: 🎞️ MASTER PERFORMANCE REEL */
                <motion.div
                   key="slide-video"
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   transition={{ duration: 0.25 }}
                   className="w-full rounded-[2.5rem] overflow-hidden border-2 border-emerald-500/25 bg-slate-950/90 shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative group"
                >
                   {/* Top 35mm Film Strip Sprocket Perforations Track */}
                   <div className="w-full bg-slate-950/90 border-b border-white/10 px-4 py-1.5 flex justify-between items-center select-none font-mono text-[9px] text-white/40 tracking-[0.3em] overflow-hidden">
                      <div className="flex items-center gap-1.5 shrink-0">
                         <FilmIcon className="w-3 h-3 text-emerald-400" />
                         <span className="text-emerald-400 font-bold">🎞️ 35MM CINEMA REEL #01</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-hidden text-slate-600">
                         <span>▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪</span>
                      </div>
                   </div>

                   {/* Video Player Canvas */}
                   <div className="aspect-video bg-black relative group">
                      <div className="absolute top-4 left-4 z-10 bg-slate-950/85 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[9px] font-mono font-bold text-white/80 uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                          <MentorshipHotspot 
                            number={1} 
                            label="Preview Recorded Takes" 
                            hotspotId="HS_ACT4_MENTOR_STEP1"
                            className="-top-2 -left-2" 
                          />
                         <Video className="w-3 h-3 text-emerald-400" />
                         <span>Master Performance Reel</span>
                      </div>

                      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                        <div className="relative">
                          <MentorshipHotspot 
                            number={2} 
                            label="Select Master Take & Retake" 
                            hotspotId="HS_ACT4_MENTOR_STEP2"
                            className="-top-2 -left-2" 
                          />
                          <button
                            type="button"
                            data-hotspot-id="HS_ACT4_RETAKE_BTN"
                            onClick={handleRetakePerformance}
                            className="bg-slate-950/85 hover:bg-slate-900 border border-sky-500/40 text-sky-400 hover:text-white px-3 py-1.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg cursor-pointer transition-all hover:scale-105"
                          >
                            <RefreshCw className="w-3 h-3 text-sky-400" />
                            <span>Retake Performance</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          data-hotspot-id="HS_ACT4_THEATER_TOGGLE_BTN"
                          onClick={handleOpenReelTheater}
                          className="bg-slate-950/85 hover:bg-slate-900 border border-white/10 text-white/80 hover:text-white px-3 py-1.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg cursor-pointer transition-all hover:scale-105"
                        >
                          <Maximize2 className="w-3 h-3 text-emerald-400" />
                          <span>Theater View</span>
                        </button>
                      </div>

                      {/* Master Reel Video — always rendered when URL exists so the browser can buffer */}
                      {previewUrl && (
                        <video 
                          ref={previewVideoRef}
                          src={previewUrl}
                          poster={localPosterUrl || data?.posterImageUrl}
                          crossOrigin="anonymous"
                          onLoadedMetadata={(e) => {
                            handleVideoLoadedMetadata(e);
                            if (previewVideoRef.current && previewVideoRef.current.readyState >= 2) {
                              setIsVideoBuffering(false);
                            }
                          }}
                          onLoadedData={() => {
                            if (previewVideoRef.current && previewVideoRef.current.readyState >= 2) {
                              setIsVideoBuffering(false);
                            }
                          }}
                          onDurationChange={handleVideoLoadedMetadata}
                          onCanPlay={() => setIsVideoBuffering(false)}
                          onWaiting={() => setIsVideoBuffering(true)}
                          onSeeking={() => setIsVideoBuffering(true)}
                          onSeeked={() => setIsVideoBuffering(false)}
                          onPlay={() => {
                            setIsPlaying(true);
                            if (previewVideoRef.current && previewVideoRef.current.readyState >= 2) {
                              setIsVideoBuffering(false);
                            }
                          }}
                          onPause={() => setIsPlaying(false)}
                          onEnded={() => setIsPlaying(false)}
                          onError={() => setIsVideoBuffering(false)}
                          onTimeUpdate={handlePreviewTimeUpdate}
                          className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1] rounded-2xl"
                          playsInline
                        />
                      )}

                      {/* CINEMATIC MEDIA LOADING WIDGET
                           Shows in two cases:
                           1. previewUrl is null  — no video recorded yet / Firestore rehydrating
                           2. isVideoBuffering    — video URL exists but first frame (readyState >= 2) not yet decoded
                           Fades out smoothly via opacity transition when video is ready. */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-950/95 rounded-2xl transition-opacity duration-500 pointer-events-none overflow-hidden z-30"
                        style={{ opacity: (!previewUrl || isVideoBuffering) ? 1 : 0 }}
                        aria-hidden={!(!previewUrl || isVideoBuffering)}
                      >
                        {/* Background Poster Image Blur Layer (shows during hard refresh if poster exists) */}
                        {(localPosterUrl || data?.posterImageUrl) && (
                          <div 
                            className="absolute inset-0 bg-cover bg-center opacity-35 blur-xl scale-110 pointer-events-none"
                            style={{ backgroundImage: `url("${localPosterUrl || data?.posterImageUrl}")` }}
                          />
                        )}

                        {/* Animated Shimmer Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/70 to-slate-950/95 bg-[length:200%_100%] animate-pulse pointer-events-none" />

                        {/* Animated Film Grain Noise Overlay */}
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                            backgroundSize: '128px 128px'
                          }}
                        />

                        {/* Film Sprocket Strip — Top */}
                        <div className="absolute top-0 left-0 right-0 h-6 bg-slate-900/90 border-b border-white/10 flex items-center gap-3 px-4 overflow-hidden z-10">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="w-3 h-3 rounded-sm border border-white/15 bg-black/50 shrink-0 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                          ))}
                        </div>

                        {/* Film Sprocket Strip — Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-900/90 border-t border-white/10 flex items-center gap-3 px-4 overflow-hidden z-10">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="w-3 h-3 rounded-sm border border-white/15 bg-black/50 shrink-0 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                          ))}
                        </div>

                        {/* Central Glassmorphic Loading Widget Card */}
                        <div className="flex flex-col items-center gap-4 z-20 p-6 rounded-3xl bg-slate-950/85 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] max-w-sm text-center">
                          <div className="relative w-14 h-14 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
                            <div className="absolute inset-1 rounded-full border border-emerald-400/40 animate-pulse" />
                            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                            <FilmIcon className="w-4 h-4 text-emerald-300 absolute inset-0 m-auto animate-pulse" />
                          </div>

                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              <span className="font-mono text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">
                                {previewUrl ? 'INITIALIZING MASTER REEL...' : 'AWAITING PERFORMANCE'}
                              </span>
                            </div>
                            <span className="font-mono text-[8px] text-white/50 uppercase tracking-widest leading-relaxed">
                              {previewUrl ? 'Buffering high-definition performance stream' : 'Record your performance in Act III'}
                            </span>
                          </div>

                          {/* Telemetry Shimmer Progress Bar */}
                          <div className="w-44 h-1 bg-slate-800/80 rounded-full overflow-hidden relative border border-white/10">
                            <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-emerald-500 via-sky-400 to-emerald-400 rounded-full animate-pulse" />
                          </div>
                        </div>

                        {/* Scanning line animation */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                          <div
                            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"
                            style={{ animation: 'scanLine 3s ease-in-out infinite', top: '0%' }}
                          />
                        </div>
                      </div>


                        {/* Playback HUD Overlay — permanently visible for high contrast playback control */}
                        <div className="absolute bottom-8 left-8 right-8 z-20 flex items-center gap-6 p-4 bg-slate-950/85 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl transition-all duration-500">
                         <TooltipProvider delayDuration={200}>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <button type="button" onClick={togglePreviewPlay} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-all cursor-pointer">
                                 {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                               </button>
                             </TooltipTrigger>
                             <TooltipContent side="top" className="bg-slate-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg z-[100]">
                               {isPlaying ? "Pause recorded master reel" : "Play recorded master reel"}
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>

                         <div className="flex-1">
                            <div className="flex justify-between items-center mb-2 px-1">
                               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Playback Scrubber</span>
                               <span className="font-mono text-[10px] text-emerald-400">{formatTime(previewCurrentTime)} / {formatTime(effectiveVideoDuration)}</span>
                            </div>
                            <div className="relative pt-2">
                               <Slider 
                                  value={[previewCurrentTime]} 
                                  onValueChange={(val) => handleSeekPreview(val[0])}
                                  min={0}
                                  max={effectiveVideoDuration || 100}
                                  step={0.1}
                               />
                            </div>
                         </div>

                         <TooltipProvider delayDuration={200}>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <button 
                                  type="button"
                                  data-hotspot-id="HS_ACT4_SNAP_FRAME_BTN"
                                  onClick={handleCaptureThumbnail} 
                                  disabled={isCapturingThumbnail} 
                                  className="px-4 py-3 bg-white hover:bg-emerald-400 text-black text-[9.5px] font-black uppercase tracking-[0.18em] rounded-xl hover:scale-105 transition-all shadow-[0_10px_25px_rgba(255,255,255,0.1)] disabled:opacity-50 cursor-pointer flex items-center gap-2 shrink-0"
                               >
                                  <Camera className="w-3.5 h-3.5 text-black" />
                                  <span>{isCapturingThumbnail ? 'Snapping...' : `Snap Frame at ${formatTime(previewCurrentTime)}`}</span>
                               </button>
                             </TooltipTrigger>
                             <TooltipContent side="top" className="bg-slate-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg z-[100]">
                               Capture frame at {formatTime(previewCurrentTime)} as Showcase Poster
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                       </div>
                   </div>

                   {/* Bottom Sprocket Track */}
                   <div className="w-full bg-slate-950/90 border-t border-white/10 px-4 py-1.5 flex justify-between items-center select-none font-mono text-[9px] text-white/40 tracking-[0.3em] overflow-hidden">
                      <div className="flex items-center gap-2 overflow-hidden text-slate-600">
                         <span>▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-white/30 text-[8px]">
                         <span>FPS: 60 • 4K PRORES</span>
                      </div>
                   </div>
                </motion.div>
             ) : (
                /* SLIDE 2: 🎨 THEATRICAL MOVIE POSTER STUDIO (Classic 2:3 Vertical Format) */
                <motion.div
                   key="slide-poster"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   transition={{ duration: 0.25 }}
                   className="bg-slate-950/60 border-2 border-amber-500/30 p-6 rounded-[2.5rem] flex flex-col items-center text-center space-y-6 shadow-[0_25px_60px_rgba(245,158,11,0.12)] relative overflow-hidden group"
                >
                   {/* Optical Viewfinder Reticle Corners */}
                   <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-400/70 rounded-tl-sm pointer-events-none" />
                   <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-400/70 rounded-tr-sm pointer-events-none" />
                   <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-400/70 rounded-bl-sm pointer-events-none" />
                   <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-400/70 rounded-br-sm pointer-events-none" />

                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                         <Camera className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-left">
                         <div className="flex items-center gap-2">
                            <h3 className="text-sm font-headline text-white italic font-bold">Theatrical Movie Poster Key Art</h3>
                            <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20">📷 2:3 VERTICAL KEY ART • f/1.8</span>
                         </div>
                         <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-0.5">Authentic theatrical poster presentation for Memory Cinema</p>
                      </div>
                   </div>

                   {/* Classic 2:3 Vertical Theatrical Poster Canvas (400px x 600px aspect-ratio) */}
                   <div 
                      data-hotspot-id="HS_ACT4_POSTER_LIGHTBOX_OPEN_BTN"
                      onClick={handleOpenPosterLightbox}
                      className="w-full max-w-xs md:max-w-sm aspect-[2/3] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_25px_60px_rgba(245,158,11,0.25)] relative group bg-black/80 transition-all hover:scale-[1.03] cursor-pointer hover:rotate-x-2 hover:rotate-y-2 duration-300"
                      title="Click to view full-screen 4K Poster Lightbox"
                   >
                      {(localPosterUrl || data?.posterImageUrl) ? (
                        <>
                          <img 
                            key={`${localPosterUrl || data?.posterImageUrl}-${posterStyle}`}
                            src={localPosterUrl || data?.posterImageUrl} 
                            alt="Poster Anchor Frame" 
                            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${getPosterStyleFilterClass(posterStyle)}`} 
                          />
                          {/* Rich Filmic Vignette Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40 pointer-events-none" />

                          {/* Top Status Badge */}
                          <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md border border-amber-500/60 px-3 py-1 rounded-lg text-[9px] font-mono font-bold text-amber-400 flex items-center gap-1.5 shadow-lg tracking-wider">
                            <CheckCircle2 className="w-3 h-3 text-amber-400" />
                            <span>POSTER ANCHORED • 4K KEY ART</span>
                          </div>

                          {/* Hover Zoom Prompt Badge */}
                          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-[8px] font-mono font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-all">
                            <span>🔍 CLICK FOR 4K LIGHTBOX</span>
                          </div>

                          {/* Bottom Hollywood Poster Typography Overlay */}
                          <div className="absolute bottom-5 left-5 right-5 text-left pointer-events-none space-y-1">
                            <span className="text-[9px] font-mono text-amber-300/90 uppercase tracking-[0.25em] block font-bold">A MEMORY WEAVER CINEMA SELECTION</span>
                            <h3 className="text-lg font-headline font-black text-white italic drop-shadow-lg leading-snug">
                              PART I: ROOTS & FOUNDATIONS
                            </h3>
                            <p className="text-[10px] text-white/70 font-serif italic line-clamp-2 drop-shadow-md">
                              {(data?.title || data?.originalHook || 'Biographical Memory Odyssey').slice(0, 60)}
                            </p>
                            <div className="pt-2 flex justify-between items-center text-[8px] font-mono text-white/40 uppercase tracking-widest border-t border-white/10">
                              <span>STYLE: {posterStyle.toUpperCase()}</span>
                              <span>1956 • KUTCH TO GREAT BRITAIN</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full border-2 border-dashed border-amber-500/30 flex flex-col items-center justify-center bg-black/40 text-[11px] font-mono text-amber-400/60 uppercase tracking-widest p-8 text-center gap-3">
                          <Camera className="w-10 h-10 text-amber-500/40 animate-pulse" />
                          <span className="font-bold">No Poster Anchored Yet</span>
                          <span className="text-[9px] text-white/40 lowercase font-sans max-w-[200px]">Generate an AI key art poster or snap a video frame</span>
                          {((data as any)?.selfieUrl || (data as any)?.narratorPhotoUrl || data?.imageUrl) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const photo = (data as any)?.selfieUrl || (data as any)?.narratorPhotoUrl || data?.imageUrl;
                                if (photo) {
                                  setLocalPosterUrl(photo);
                                  update({ posterImageUrl: photo });
                                  toast.success("Selfie Photo Anchored as Key Art!");
                                }
                              }}
                              className="mt-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-[10px] font-mono font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer pointer-events-auto"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>⚡ Auto-Anchor Selfie Photo</span>
                            </button>
                          )}
                        </div>
                      )}
                   </div>

                   {/* 4 Artistic Style Presets Selector */}
                   <div className="w-full max-w-md text-center pt-2 space-y-2">
                     <span className="text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-white/40 block">
                       STEP 1: SELECT COLOUR GRADE FILTER
                     </span>
                     <div className="flex flex-wrap justify-center gap-2">
                       {[
                         { id: 'vintage-35mm', label: '🎞️ Vintage 35mm' },
                         { id: 'modern-legacy', label: '💎 Modern Legacy' },
                         { id: 'heritage-oil', label: '🎨 Heritage Oil' },
                         { id: 'raw-authentic', label: '📷 Raw Authentic' },
                       ].map((style) => (
                         <button
                           key={style.id}
                           type="button"
                           data-hotspot-id={`HS_ACT4_POSTER_STYLE_${style.id.toUpperCase().replace('-', '_')}_BTN`}
                           onClick={() => handleSelectPosterStyle(style.id as any)}
                           title="Apply live CSS colour grade filter preview"
                           className={`px-3.5 py-1.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                             posterStyle === style.id
                               ? 'bg-amber-400 text-slate-950 shadow-md scale-105 font-black ring-2 ring-amber-300'
                               : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'
                           }`}
                         >
                           {style.label}
                         </button>
                       ))}
                     </div>
                   </div>

                   {/* Master Action Triggers */}
                   <div className="w-full max-w-md text-center pt-3 space-y-2">
                     <span className="text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-emerald-400/60 block">
                       STEP 2: SYNTHESISE GENERATIVE AI ARTWORK (IMAGEN AI)
                     </span>
                     <div className="flex flex-wrap items-center justify-center gap-3">
                       <button 
                          type="button"
                          data-hotspot-id="HS_ACT4_GENERATE_AI_POSTER_BTN"
                          onClick={handleGenerateAIPoster} 
                          disabled={isGeneratingAIPoster} 
                          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-[0.18em] rounded-xl hover:scale-105 transition-all shadow-[0_10px_25px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer flex items-center gap-2"
                       >
                          {isGeneratingAIPoster ? <Loader2 className="w-4 h-4 text-slate-950 animate-spin" /> : <Wand2 className="w-4 h-4 text-slate-950" />}
                          <span>{isGeneratingAIPoster ? 'Rendering Imagen AI Key Art...' : 'Synthesise AI Key Art (Imagen AI)'}</span>
                       </button>

                       <button 
                          type="button"
                          data-hotspot-id="HS_ACT4_OPEN_PHOTOBOOTH_BTN"
                          onClick={handleOpenSelfiePhotobooth} 
                          disabled={isCapturingThumbnail} 
                          className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black uppercase tracking-[0.18em] rounded-xl hover:scale-105 transition-all shadow-[0_10px_25px_rgba(245,158,11,0.25)] disabled:opacity-50 cursor-pointer flex items-center gap-2"
                       >
                          <Sparkles className="w-4 h-4 text-slate-950" />
                          <span>Open Studio Photobooth</span>
                       </button>
                     </div>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>
       </div>

       <div className="w-full lg:w-1/2 bg-black/40 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl h-full flex flex-col min-h-[500px]">
          <div className="w-full h-full flex flex-col flex-1 overflow-hidden">
            <DirectorsNotepad 
              userId={userId || user?.uid || data?.userId}
              memoryId={data?.id}
              data={data} 
              update={update} 
              onSave={handleSaveMemory}
              isSaving={uploading}
              onSeek={handleSeekPreview}
            />
          </div>
       </div>
    </div>
  );

  // ── PRINT: Opens system print dialog via hidden iframe (no page freeze) ─────
  // Temporarily overrides parent document.title so Chrome's Save-as-PDF dialog
  // suggests the correct filename, then restores it via the afterprint event.
  const handlePrintAutobiography = () => {
    const bookletPosterUrl =
      data?.posterImageUrl ||
      (data as any)?.generatedPosterUrl ||
      (data as any)?.aiPosterUrl ||
      localPosterUrl ||
      data?.imageUrl;

    const userEmail = user?.email || (data as any)?.userEmail || (data as any)?.email || '';
    // Set parent document.title — Chrome uses this as the suggested PDF filename.
    // Format: nareshmepani@hotmail.com_A_Child_of_Two_Worlds  →  Chrome saves as .pdf
    const originalTitle = document.title;
    const safeTitle = (data?.title || 'Memory Weaver')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const safeEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '');
    // nareshmepani@hotmail.com_A_Child_of_Two_Worlds → Chrome saves as .pdf
    document.title = safeEmail ? `${safeEmail}_${safeTitle}` : safeTitle;

    // Restore title after print dialog closes (afterprint is more reliable than setTimeout)
    window.addEventListener('afterprint', () => {
      document.title = originalTitle;
    }, { once: true });
    // Safety fallback in case afterprint never fires
    setTimeout(() => { document.title = originalTitle; }, 15000);

    downloadFusedAutobiography({
      ...data,
      prose: data?.prose || data?.originalHook || data?.description || selectedTake || '',
      posterImageUrl: bookletPosterUrl,
      userEmail
    } as any, userEmail);
  };



  const renderShowcase = () => (
    <div className="max-w-[95vw] xl:max-w-screen-2xl mx-auto w-full pt-4 pb-8 space-y-12">
       <motion.div 
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 1 }}
         className="text-center space-y-6"
       >
<div className="flex items-center justify-center gap-4 text-emerald-400 font-black text-[10px] uppercase tracking-[0.8em] mb-4">
            <div className="w-12 h-px bg-emerald-500/30" />
            Premiere: Act V
            <div className="w-12 h-px bg-emerald-500/30" />
          </div>
          <h2 className="text-7xl font-serif text-white/90 italic leading-tight tracking-tighter">Your Memory, Immortalized.</h2>
          <p className="text-white/40 text-xl font-serif italic max-w-2xl mx-auto leading-relaxed">
            The weave is complete. Your story has been transformed from a fleeting thought into a cinematic treasure.
          </p>

          {/* DUAL-REEL MODE SEGMENTED CONTROL BAR */}
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-col items-center justify-center gap-2 pt-3">
              <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/40 font-bold">
                Presentation Reel Mode
              </span>
              <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 flex items-center gap-2 shadow-2xl backdrop-blur-xl">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      data-hotspot-id="HS_ACT5_MODE_FUSION_BTN"
                      onClick={() => setPremiereMode('fusion')}
                      className={`px-5 py-2.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all border flex items-center gap-2 cursor-pointer ${
                        premiereMode === 'fusion'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                          : 'bg-transparent text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fusion Masterpiece</span>
                      {premiereMode === 'fusion' && (
                        <span className="px-2 py-0.5 rounded-md text-[8px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 font-mono tracking-widest uppercase font-bold">
                          APPLIED
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-slate-900 border border-emerald-500/30 text-slate-200 text-xs px-3.5 py-2 rounded-xl shadow-2xl z-[10002] max-w-[280px]">
                    <p className="font-bold text-emerald-400 font-mono text-[11px] mb-0.5 uppercase tracking-wider">✨ Fusion Masterpiece // APPLIED</p>
                    <p className="text-white/80 leading-relaxed">Blends your polished narrative prose with the spoken recorded performance into a seamless, cinematic-grade presentation.</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      data-hotspot-id="HS_ACT5_MODE_RAW_BTN"
                      onClick={() => setPremiereMode('raw')}
                      className={`px-5 py-2.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all border flex items-center gap-2 cursor-pointer ${
                        premiereMode === 'raw'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.25)]'
                          : 'bg-transparent text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <FilmIcon className="w-3.5 h-3.5 text-sky-400" />
                      <span>Authentic Performance</span>
                      {premiereMode === 'raw' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse ml-0.5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-slate-900 border border-sky-500/30 text-slate-200 text-xs px-3.5 py-2 rounded-xl shadow-2xl z-[10002] max-w-[280px]">
                    <p className="font-bold text-sky-400 font-mono text-[11px] mb-0.5 uppercase tracking-wider">📽️ Authentic Performance</p>
                    <p className="text-white/80 leading-relaxed">Displays your unedited, raw archival recording exactly as performed in the studio without AI prose synthesis.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
       </motion.div>
       
       <div className="flex flex-col lg:flex-row gap-12 items-start justify-center pt-4">
          {/* THE POSTER (LEFT) */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, rotateY: 20 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
            className="relative group perspective-2000 shrink-0"
          >
             <div className="absolute -inset-20 bg-sky-500/10 blur-[120px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
             <div className="relative z-10">
                <CinemaPoster memory={{
                  ...data,
                  posterImageUrl: localPosterUrl || data?.posterImageUrl || (data as any)?.selfieUrl || (data as any)?.narratorPhotoUrl || data?.imageUrl || (data as any)?.heroImageUrl
                }} />
             </div>

             {/* Mode Indicator Overlay Badge */}
             <div className="mt-4 text-center">
               <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest border ${
                 premiereMode === 'fusion'
                   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                   : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
               }`}>
                 {premiereMode === 'fusion' ? '✨ Fusion Masterpiece // APPLIED' : '📽️ Authentic Solo Performance // Archival Raw Take'}
               </span>
             </div>
             
             {/* Filmic Reflections */}
             <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden opacity-30">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-2000" />
             </div>
          </motion.div>

          {/* PRODUCTION ACTIONS & STATS (RIGHT) */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex-1 space-y-6 max-w-xl text-left"
          >
              {/* HOLLYWOOD-GRADE MASTER STUDIO CONSOLE */}
              <div className="bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden max-w-md w-full mx-auto space-y-4">
                 {/* Specular Edge */}
                 <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

                 {/* Console Status Header */}
                 <div className="flex items-center justify-between pb-1">
                   <h4 className="text-[10px] font-mono tracking-[0.3em] text-amber-400 font-bold uppercase flex items-center gap-2">
                     🎬 MASTERING CONSOLE
                   </h4>
                   <div className="flex items-center gap-2">
                      {/* MW-186: Dynamic Lifecycle Status Badge */}
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {data?.status === 'published' ? (
                                <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  🎬 LIVE IN CINEMA
                                </span>
                              ) : data?.status === 'pre-release' ? (
                                <span className="flex items-center gap-1.5 text-[9px] font-mono text-violet-400 bg-violet-950/50 border border-violet-500/30 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                                  🌟 PRE-RELEASE
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-[9px] font-mono text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  🛠️ IN PRODUCTION
                                </span>
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-slate-950/95 border border-white/10 p-3 text-xs text-white max-w-xs shadow-2xl z-[10002] rounded-xl">
                            {data?.status === 'published' ? (
                              <div>
                                <p className="font-mono text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Official Cinema Release</p>
                                <p className="text-[10px] text-white/70">This memory is published and available in your public Cinema screening room.</p>
                              </div>
                            ) : data?.status === 'pre-release' ? (
                              <div>
                                <p className="font-mono text-[9px] font-bold text-violet-400 uppercase tracking-widest mb-1">Private Screener Active</p>
                                <p className="text-[10px] text-white/70">Share this screener link with family and collaborators to gather private feedback before releasing officially to the Cinema.</p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-mono text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-1">Production in Progress</p>
                                <p className="text-[10px] text-white/70">Complete Act V to master your video reel and enter Pre-Release.</p>
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full cursor-help">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              4K MASTERED
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-slate-950/95 border border-white/10 p-3 text-xs text-white max-w-xs shadow-2xl z-[10002] rounded-xl">
                            <div>
                              <p className="font-mono text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Hollywood-Grade Master</p>
                              <p className="text-[10px] text-white/70">Master reel is fully stitched in 4K resolution with synchronized ambient audio score and theatrical video delivery.</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                   </div>
                 </div>
                 
                 {/* TIER 1: HERO ACTION - LAUNCH FULLSCREEN PREMIERE */}
                 <button 
                   data-hotspot-id="HS_ACT5_VIEW_PREMIERE_BTN"
                   onClick={() => window.location.href = `/cinema?id=${data.id}`} 
                   className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs tracking-wider uppercase rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                 >
                   <Play className="w-4 h-4 fill-current text-slate-950" />
                   Launch Fullscreen Premiere
                 </button>
                 
                 {/* TIER 2: SECONDARY ACTION - START LIVING ROOM TV PREMIERE */}
                 <div className="relative w-full">
                   <MentorshipHotspot 
                     number={1} 
                     label="Stream to Living Room TV" 
                     hotspotId="HS_ACT5_MENTOR_STEP1"
                     className="-top-3 -left-3" 
                   />
                   <button 
                     data-hotspot-id="HS_ACT5_LIVING_ROOM_PREMIERE_BTN"
                     onClick={() => setShowLivingRoomCastModal(true)}
                     className="w-full py-3.5 bg-slate-900/90 border border-amber-500/30 text-amber-300 font-semibold text-xs rounded-xl hover:bg-amber-500/10 hover:border-amber-400/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:scale-[1.01]"
                   >
                     <Tv className="w-4 h-4 text-amber-400 animate-pulse" />
                     Start Living Room TV Premiere
                   </button>
                 </div>

                 {/* TIER 3: EXPORT ACTIONS — Print + Share & QR (2-column) */}
                 <div className="grid grid-cols-2 gap-2 pt-1">
                   <div className="relative w-full">
                     <MentorshipHotspot 
                       number={2} 
                       label="Print or Save as PDF" 
                       hotspotId="HS_ACT5_MENTOR_STEP2"
                       className="-top-3 -left-3" 
                     />
                     {/* 🖨️ PRINT: Opens iframe print dialog — user chooses printer or Save as PDF */}
                     <button 
                       data-hotspot-id="HS_ACT5_PRINT_AUTOBIOGRAPHY_BTN"
                       onClick={handlePrintAutobiography}
                       title="Print or save as PDF — choose your destination in the print dialog"
                       className="w-full py-3 bg-slate-900/60 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-white/80 hover:text-amber-300 font-bold rounded-xl text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                     >
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                       Print / Save PDF
                     </button>
                   </div>

                   <div className="relative w-full">
                     <button 
                       data-hotspot-id="HS_ACT5_SHARE_LINK_BTN"
                       onClick={() => setIsShareModalOpen(true)}
                       className="w-full py-3 bg-slate-900/60 hover:bg-white/5 border border-white/10 text-white/80 font-bold rounded-xl text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-white/20"
                     >
                       <Share2 className="w-3.5 h-3.5 text-white/70" />
                       Share &amp; QR
                     </button>
                   </div>
                 </div>

                 {/* FOOTER ACTION */}
                 <button 
                   onClick={() => window.location.href = '/studio'}
                   className="text-[10px] font-mono text-white/40 hover:text-white/70 uppercase tracking-widest transition-all cursor-pointer text-center block w-full pt-2"
                 >
                   ← Return to Studio Slate
                 </button>
              </div>

              {/* COMPACT PRODUCTION VERIFICATION GRID */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                       <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">Negative Mastered</h4>
                       <p className="text-[10px] text-white/40 leading-snug">Visual & audio weave processed.</p>
                    </div>
                 </div>

                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-sky-400 shrink-0" />
                    <div>
                       <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">Metadata Synced</h4>
                       <p className="text-[10px] text-white/40 leading-snug">Archive mapping verified.</p>
                    </div>
                 </div>

                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                       <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">Fusion Protocol</h4>
                       <p className="text-[10px] text-white/40 leading-snug">Intent & performance fused.</p>
                    </div>
                 </div>

                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                    <Rocket className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                       <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">Archive Entry</h4>
                       <p className="text-[10px] text-white/40 leading-snug">Permanent chapter secured.</p>
                    </div>
                 </div>
              </div>

              {data.videoStory && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="p-6 bg-gradient-to-br from-emerald-500/5 via-white/5 to-transparent border border-white/10 rounded-3xl backdrop-blur-xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FilmIcon className="w-12 h-12 text-white" />
                  </div>
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    The Narrative Fusion
                  </h4>
                  <p className="text-base text-white/90 leading-relaxed font-medium italic serif">
                    "{data.videoStory}"
                  </p>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                     <span className="text-[8px] font-mono uppercase tracking-widest text-white/30">Auteur Synthesis // AI-Fused Narrative</span>
                     <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
                     </div>
                  </div>
                </motion.div>
              )}
          </motion.div>
       </div>
    </div>
  );

  return (
    <>
      <CinemaStageSwitch
        currentStage={productionStage}
        onStageChange={setProductionStage}
        acts={[
          { id: 0, title: 'Inciting Memory', label: 'ACT I' },
          { id: 1, title: 'Weave', label: 'ACT II' },
          { id: 2, title: 'Capture', label: 'ACT III' },
          { id: 3, title: 'Director\'s Cut', label: 'ACT IV' },
          { id: 4, title: 'Premiere', label: 'ACT V' },
        ]}
      >
        {renderIncitingMemory()}
        {renderWeave()}
        {renderRecording()}
        {renderNotepad()}
        {renderShowcase()}
      </CinemaStageSwitch>

      {/* Floating Remote Command Alert Overlay */}
      <AnimatePresence>
        {remoteCommandAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-500/90 text-slate-950 font-black text-xs uppercase tracking-[0.2em] px-6 py-3 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-emerald-400 flex items-center gap-2 pointer-events-none"
          >
            <Smartphone className="w-4 h-4 animate-bounce" />
            <span>{remoteCommandAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UK English Stage Manager welcome cue banner */}
      <AnimatePresence>
        {showStageManagerCue && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 md:right-10 z-[1000] w-[calc(100%-3rem)] max-w-md bg-zinc-950/95 backdrop-blur-3xl border border-sky-500/30 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
              <span className="text-[9px] font-black text-sky-400 uppercase tracking-[0.25em]">Stage Manager Briefing // Sanctuary Cue</span>
            </div>
            
            <p className="text-xs text-white/95 leading-relaxed font-headline italic px-2">
              "This stage is your sanctuary. Take a walk around, try the buttons, and make yourself at home. We'll be in the wings when you're ready."
            </p>

            <button
              onClick={() => setShowStageManagerCue(false)}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
            >
              Begin Performance
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Grand Tour & Onboarding Walkthrough Overlay */}
      <AnimatePresence>
        {isBriefingOpen && (
          <StudioBriefing
            isOpen={isBriefingOpen}
            onClose={handleCloseBriefing}
            cameraPairingUrl={cameraPairingUrl}
            peerState={peerState}
            hostIP={hostIP}
            setHostIP={setHostIP}
          />
        )}
      </AnimatePresence>

      {/* Stitch Fallback Recovery Dialog */}
      <Dialog open={showStitchFallbackModal} onOpenChange={setShowStitchFallbackModal}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border border-white/10 text-white font-mono rounded-[2rem] p-6 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <DialogTitle className="font-mono text-xs uppercase tracking-[0.25em] font-black text-rose-400">
                TRANSCODER TIMEOUT
              </DialogTitle>
            </div>
            <DialogDescription className="text-zinc-400 text-[10px] leading-relaxed font-sans normal-case">
              Your memory segments have been safely uploaded to storage, but the high-definition cloud stitching service is temporarily busy or unreachable. 
              <br/><br/>
              To avoid re-recording, you can bypass the transcode queue and proceed immediately using the raw recording.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={async () => {
                setShowStitchFallbackModal(false);
                await handleStitchAndApprove(stuckEdl);
              }}
              className="w-full py-4 bg-zinc-900 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              Retry Cloud Stitch
            </Button>
            <Button
              onClick={async () => {
                setShowStitchFallbackModal(false);
                setIsStitching(true);
                try {
                  console.log("[SoloStage] User forced local fallback bypass. Saving raw segment directly...");
                  const docRef = doc(db, 'users', userId || user?.uid || 'unknown', 'memories', data?.id || 'unknown');
                  const localVideoUrl = stuckEdl[0]?.blobUrl || '';
                  
                  await setDoc(docRef, { 
                    videoUrl: localVideoUrl,
                    isProductionLocked: true,
                    productionStage: 3 // Set to Stage 3 (Act IV - Cut)
                  }, { merge: true });

                  toast.success("TRANSCODE SKIPPED", {
                    description: "Proceeding with raw take segments. Firestore advanced."
                  });
                  setReviewTake(false);
                  update({ 
                    productionStage: 3, 
                    isProductionLocked: true, 
                    videoUrl: localVideoUrl 
                  });
                  if (typeof globalActions?.setStage === 'function') {
                    globalActions.setStage(3);
                  }
                } catch (e: any) {
                  console.error("[SoloStage] Local transcode bypass save failed:", e);
                  toast.error("Bypass failed", { description: e.message });
                } finally {
                  setIsStitching(false);
                }
              }}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)] border-0"
            >
              Use Raw Take (No Re-Recording)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resiliency Shield: Restore Take Banner */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showRestorePrompt && (
            <motion.div
              key="resiliency-shield-banner"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-8 right-6 md:right-10 z-[99999] w-[calc(100%-3rem)] max-w-sm bg-slate-950 border border-emerald-500/50 p-5 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.95),0_0_30px_rgba(16,185,129,0.2)] flex flex-col gap-3.5 pointer-events-auto"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.25em]">PERSISTENCE SHIELD // UNSTITCHED TAKE</span>
              </div>
              
              <p className="text-[10px] text-zinc-300 leading-relaxed font-sans">
                We detected a recorded take for <strong className="text-white">"{data?.title || 'this memory'}"</strong> from your previous session that was not compiled or approved. Would you like to recover it?
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRestorePrompt(false);
                    const cacheKey = `backup_take_${data?.id}`;
                    localforage.removeItem(cacheKey).catch(() => {});
                    if (recoveredKeyRef.current) {
                      localforage.removeItem(recoveredKeyRef.current).catch(() => {});
                    }
                    if (data?.promptId) {
                      localforage.removeItem(`backup_take_${data.promptId}`).catch(() => {});
                    }
                    onClearBackup?.();
                  }}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer border border-white/5"
                >
                  Discard
                </button>
                <button
                  onClick={handleRestoreTake}
                  className="flex-grow-[2] py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md border-0"
                >
                  Restore Take
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <DirectorialUpsellDialog
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        requiredFeature={upsellFeature}
      />

      {/* STUDIO PORTRAIT PHOTOBOOTH MODAL */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isSelfieModalOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-slate-950 border border-emerald-500/30 rounded-[2.5rem] p-6 shadow-[0_0_100px_rgba(16,185,129,0.25)] flex flex-col gap-4 relative overflow-hidden"
              >
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-headline text-white italic">Studio Portrait Photobooth</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Frame your portrait & capture showcase poster</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSelfieModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Viewfinder / Freeze-Frame Preview (Strict 2:3 Vertical Movie Key Art Aspect Ratio) */}
                <div className="relative aspect-[2/3] w-full max-h-[50vh] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center mx-auto">
                  {selfieCapturedPreview ? (
                    <img src={selfieCapturedPreview} alt="Captured Studio Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video
                        ref={selfieVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                        style={{
                          filter: selfieFilter === 'warm' ? 'sepia(0.35) contrast(1.1)' :
                                  selfieFilter === 'cool' ? 'hue-rotate(180deg) saturate(1.2)' :
                                  selfieFilter === 'noir' ? 'grayscale(1) contrast(1.3)' : 'none'
                        }}
                      />

                      {/* Golden Portrait Frame Oval Overlay */}
                      {stream && isCameraActive && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center border-2 border-dashed border-amber-400/50 rounded-full my-4 mx-auto aspect-[3/4] max-h-[85%] shadow-[0_0_50px_rgba(251,191,36,0.15)] animate-pulse">
                          <span className="text-[8px] font-mono font-bold tracking-[0.3em] text-amber-300 uppercase bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">FRAME FACE HERE</span>
                        </div>
                      )}

                      {/* Optics Muted / Enable Camera State */}
                      {(!stream || !isCameraActive) && (
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-20 p-6 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
                            <VideoOff className="w-6 h-6 text-amber-400" />
                          </div>
                          <div className="space-y-1 max-w-xs">
                            <h4 className="text-sm font-headline text-white italic">Studio Optics Muted</h4>
                            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Camera feed is offline or muted</p>
                          </div>
                          <button
                            onClick={() => {
                              unmuteOptics();
                              handleReattemptAccess();
                            }}
                            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Camera className="w-3.5 h-3.5 text-slate-950" />
                            <span>Engage Camera Optics</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Countdown & Smile Hold Overlay */}
                  {selfieCountdown !== null && (
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-30 select-none">
                      {selfieCountdown === "SMILE" ? (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: [1, 1.1, 1], opacity: 1 }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          className="flex flex-col items-center gap-3"
                        >
                          <div className="w-24 h-24 rounded-full border-4 border-emerald-400 bg-emerald-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.7)] animate-pulse">
                            <span className="text-4xl">😁</span>
                          </div>
                          <div className="text-center space-y-1">
                            <span className="text-2xl font-black font-headline text-emerald-300 uppercase tracking-widest block drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]">
                              SMILE & HOLD!
                            </span>
                            <span className="text-[10px] font-mono font-bold text-white/80 uppercase tracking-widest block">
                              Hold your smile... Capturing portrait key art 📸
                            </span>
                          </div>
                        </motion.div>
                      ) : (
                        <>
                          <div className="w-20 h-20 rounded-full border-4 border-amber-400 bg-amber-500/20 flex items-center justify-center animate-bounce shadow-[0_0_40px_rgba(245,158,11,0.5)]">
                            <span className="text-4xl font-black text-amber-300 font-mono">{selfieCountdown}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                            Frame Face & Prepare Your Smile... 📸
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Filter Selection Bar (Before Snap) */}
                {!selfieCapturedPreview && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest mr-2">Grading:</span>
                    {(['default', 'warm', 'cool', 'noir'] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setSelfieFilter(f)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer",
                          selfieFilter === f
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {f === 'default' && 'Studio Natural'}
                        {f === 'warm' && '1960s Warm'}
                        {f === 'cool' && 'Cool Modern'}
                        {f === 'noir' && 'Cinematic Noir'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Button Bar */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  {selfieCapturedPreview ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelfieCapturedPreview(null);
                          setSelfieCapturedBlob(null);
                        }}
                        className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4 text-amber-400" />
                        <span>Retake Portrait</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmSelfiePoster}
                        disabled={isCapturingThumbnail}
                        className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>{isCapturingThumbnail ? 'Saving Poster...' : 'Anchor as Poster'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTriggerSelfieCountdown}
                      disabled={selfieCountdown !== null}
                      className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-105 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4 text-slate-950" />
                      <span>{selfieCountdown !== null ? 'Framing...' : 'Take Studio Photo (3s)'}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Full-Screen 4K Poster Lightbox Modal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isPosterLightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 md:p-10 select-none overflow-hidden"
            >
              {/* Top Control Bar */}
              <div className="w-full max-w-4xl flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm md:text-base font-black text-white uppercase tracking-widest font-headline italic">
                      4K Key Art Exhibition Lightbox
                    </h2>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                      High-Res Theatrical Poster Presentation
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    data-hotspot-id="HS_ACT4_LIGHTBOX_SELFIE_BTN"
                    onClick={handleOpenSelfiePhotobooth}
                    className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:scale-105"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Snap Studio Selfie</span>
                  </button>

                  <button
                    type="button"
                    data-hotspot-id="HS_ACT4_LIGHTBOX_RETAKE_BTN"
                    onClick={handleRetakePerformance}
                    className="px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4 text-sky-400" />
                    <span>Retake Video Reel</span>
                  </button>

                  <button
                    type="button"
                    data-hotspot-id="HS_ACT4_SHARE_CINEMA_BTN"
                    onClick={() => setIsShareModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:scale-105"
                  >
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <span>Share Cinema Link & QR Code</span>
                  </button>

                  <button
                    type="button"
                    data-hotspot-id="HS_ACT4_DOWNLOAD_POSTER_BTN"
                    onClick={handleDownloadPoster}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-mono font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105"
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>Download 4K Poster</span>
                  </button>

                  <button
                    type="button"
                    data-hotspot-id="HS_ACT4_DOWNLOAD_AUTOBIOGRAPHY_BTN"
                    onClick={() => {
                      if (data) {
                        downloadFusedAutobiography(data as Memory);
                        toast.success('Generating Master Autobiography Keepsake...', {
                          description: "Your 2-page heirloom document is ready! In the print window, Choose your printer or select 'Save as PDF' to save a copy.",
                          duration: 6000,
                          dismissible: true
                        });
                      }
                    }}
                    className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:scale-105"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Print / Save PDF Autobiography</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPosterLightboxOpen(false)}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <X className="w-4 h-4 text-white" />
                    <span>Close (Esc)</span>
                  </button>
                </div>
              </div>

              {/* Ultra-Crisp 4K Poster Card */}
              <div className="h-[65vh] max-h-[680px] aspect-[2/3] max-w-[90vw] shrink-0 rounded-3xl overflow-hidden border-2 border-amber-500/60 shadow-[0_30px_90px_rgba(245,158,11,0.35)] relative group bg-black/90 transition-all hover:scale-[1.01]">
                {(localPosterUrl || data?.posterImageUrl) ? (
                  <>
                    <img 
                      key={`${localPosterUrl || data?.posterImageUrl}-${posterStyle}`}
                      src={localPosterUrl || data?.posterImageUrl} 
                      alt="4K Key Art Poster" 
                      className={`w-full h-full object-cover transition-all duration-500 ${getPosterStyleFilterClass(posterStyle)}`} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40 pointer-events-none" />

                    <div className="absolute top-5 left-5 bg-slate-950/90 backdrop-blur-md border border-amber-500/60 px-3.5 py-1.5 rounded-xl text-[10px] font-mono font-bold text-amber-400 flex items-center gap-2 shadow-xl tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>4K EXHIBITION MASTER • {posterStyle.toUpperCase()}</span>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 text-left pointer-events-none space-y-1.5">
                      <span className="text-[10px] font-mono text-amber-300 uppercase tracking-[0.3em] block font-bold">A MEMORY WEAVER CINEMA SELECTION</span>
                      <h2 className="text-xl font-headline font-black text-white italic drop-shadow-xl leading-tight">
                        PART I: ROOTS & FOUNDATIONS
                      </h2>
                      <p className="text-xs text-white/80 font-serif italic line-clamp-3 drop-shadow-md">
                        {data?.title || data?.originalHook || 'Biographical Memory Odyssey'}
                      </p>
                      <div className="pt-3 flex justify-between items-center text-[9px] font-mono text-white/50 uppercase tracking-widest border-t border-white/15">
                        <span>STYLE: {posterStyle.toUpperCase()}</span>
                        <span>1956 • KUTCH TO GREAT BRITAIN</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <Camera className="w-12 h-12 text-amber-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">No Poster Anchored Yet</span>
                  </div>
                )}
              </div>

              {/* Interactive Style Preset Selector Bar Inside Lightbox */}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mt-5 z-10">
                {[
                  { id: 'vintage-35mm', label: '🎞️ Vintage 35mm' },
                  { id: 'modern-legacy', label: '💎 Modern Legacy' },
                  { id: 'heritage-oil', label: '🎨 Heritage Oil' },
                  { id: 'raw-authentic', label: '📷 Raw Authentic' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    data-hotspot-id={`HS_ACT4_POSTER_STYLE_${style.id.toUpperCase().replace('-', '_')}_BTN`}
                    onClick={() => handleSelectPosterStyle(style.id as any)}
                    className={`px-4 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      posterStyle === style.id
                        ? 'bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105 font-black ring-2 ring-amber-300'
                        : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Full-Screen 4K Master Reel Theater Portal Modal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isReelTheaterOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 md:p-10 select-none overflow-hidden"
            >
              {/* Top Control Header */}
              <div className="w-full max-w-5xl flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FilmIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm md:text-base font-black text-white uppercase tracking-widest font-headline italic">
                      4K Master Reel Cinematic Theater
                    </h2>
                    <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono">
                      Full-Screen Performance Screening // 60 FPS ProRes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    data-hotspot-id="HS_ACT4_THEATER_RETAKE_BTN"
                    onClick={handleRetakePerformance}
                    className="px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4 text-sky-400" />
                    <span>Retake Performance</span>
                  </button>

                  <button
                    type="button"
                    data-hotspot-id="HS_ACT4_THEATER_SNAP_FRAME_BTN"
                    onClick={handleCaptureThumbnail}
                    disabled={isCapturingThumbnail}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-mono font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105"
                  >
                    <Camera className="w-4 h-4 text-slate-950" />
                    <span>{isCapturingThumbnail ? 'Snapping...' : 'Snap Poster Frame'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseReelTheater}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <X className="w-4 h-4 text-white" />
                    <span>Close Theater (Esc)</span>
                  </button>
                </div>
              </div>

              {/* 16:9 Full Theater Video Viewport */}
              <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-[0_30px_90px_rgba(16,185,129,0.25)] relative group bg-black/90 flex items-center justify-center">
                {previewUrl ? (
                  <video 
                    ref={theaterVideoRef}
                    src={previewUrl}
                    crossOrigin="anonymous"
                    autoPlay
                    controls
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    onDurationChange={handleVideoLoadedMetadata}
                    onTimeUpdate={(e) => {
                      const vid = e.currentTarget;
                      setPreviewCurrentTime(vid.currentTime);
                      if (vid.duration && isFinite(vid.duration) && vid.duration > 0 && videoDuration !== vid.duration) {
                        setVideoDuration(vid.duration);
                      }
                    }}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/40 space-y-2">
                    <FilmIcon className="w-10 h-10 animate-pulse text-emerald-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Awaiting Master Performance Reel...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* CINEMA SHARE & QR CODE PORTAL MODAL */}
      {isShareModalOpen && createPortal(
        <div className="fixed inset-0 z-[25000] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 select-none">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-[0_0_80px_rgba(16,185,129,0.3)] space-y-6 relative"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-headline text-white uppercase tracking-wider">
                    Memory Weaver Cinema Portal
                  </h3>
                  <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                    Unique Share Link & Scannable Key Art QR Code
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Display Card */}
            <div className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-950/80 rounded-2xl border border-emerald-500/30">
              <div className="p-3 bg-white rounded-2xl border-4 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <QRCodeCanvas 
                  value={cinemaShareUrl} 
                  size={200} 
                  level="H" 
                  includeMargin={false} 
                  className="rounded-lg" 
                />
              </div>
              <div className="text-center space-y-1">
                <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest block">
                  Scan With Mobile Camera
                </span>
                <span className="text-[10px] font-mono text-white/60 block">
                  Instantly opens performance reel on Memory Weaver Cinema
                </span>
              </div>
            </div>

            {/* Unique Link & Multi-Channel Action Bar */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-slate-950/90 rounded-xl border border-white/10">
                <span className="text-xs font-mono text-emerald-400 truncate flex-1 px-2">
                  {cinemaShareUrl}
                </span>
                <button
                  type="button"
                  data-hotspot-id="HS_ACT4_SHARE_COPY_LINK_BTN"
                  onClick={handleCopyCinemaLink}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-mono font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
              </div>

              {/* Multi-Channel Direct Share Triggers */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  data-hotspot-id="HS_ACT4_SHARE_WHATSAPP_BTN"
                  onClick={handleShareWhatsApp}
                  className="py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Share to WhatsApp</span>
                </button>

                <button
                  type="button"
                  data-hotspot-id="HS_ACT4_SHARE_EMAIL_BTN"
                  onClick={handleShareEmail}
                  className="py-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>Send via Email</span>
                </button>
              </div>

              {/* 4-Digit Family Passcode PIN Toggle */}
              <div className="p-3 bg-slate-950/50 rounded-xl border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-left">
                  <ShieldCheck className={`w-4 h-4 ${isPinProtected ? 'text-amber-400' : 'text-white/40'}`} />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider block">
                      Optional 4-Digit Passcode PIN
                    </span>
                    <span className="text-[9px] font-mono text-white/40 block">
                      {isPinProtected ? 'PIN Security Active' : 'Default: Public Unlisted (Off)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isPinProtected && (
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="1234"
                      value={sharePin}
                      onChange={(e) => setSharePin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-16 px-2 py-1 bg-black/60 border border-amber-400/50 rounded-lg text-center text-xs font-mono text-amber-400 font-bold focus:outline-none"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPinProtected(!isPinProtected)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      isPinProtected ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {isPinProtected ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDownloadPoster}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-mono font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download 4K Poster PNG (With Embedded QR Code)</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* LIVING ROOM PREMIERE CASTING MODAL */}
      {showLivingRoomCastModal && createPortal(
        <div className="fixed inset-0 z-[25000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 select-none">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-xl bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 shadow-[0_0_80px_rgba(245,158,11,0.3)] space-y-6 relative text-center"
          >
            <button
              onClick={() => setShowLivingRoomCastModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(245,158,11,0.25)]">
              <Tv className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>

            <div>
              <h3 className="font-headline text-2xl font-black text-white uppercase tracking-widest mb-2">Living Room TV Premiere</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed font-mono uppercase tracking-wider">
                Open your cinema player, then use your browser&apos;s native cast to stream to your TV.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLivingRoomCastModal(false);
                  window.location.href = `/cinema?id=${data.id}`;
                }}
                className="p-5 bg-slate-950 border border-amber-500/30 hover:border-amber-400 rounded-2xl flex flex-col items-center gap-2 group/cast transition-all cursor-pointer"
              >
                <Airplay className="w-6 h-6 text-amber-400 group-hover/cast:scale-110 transition-transform" />
                <span className="text-xs font-black text-white uppercase tracking-wider">Apple AirPlay</span>
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Opens Cinema Player</span>
                <span className="text-[8px] font-mono text-zinc-500 normal-case">Use Safari&apos;s AirPlay icon in the video player</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLivingRoomCastModal(false);
                  window.location.href = `/cinema?id=${data.id}`;
                }}
                className="p-5 bg-slate-950 border border-amber-500/30 hover:border-amber-400 rounded-2xl flex flex-col items-center gap-2 group/cast transition-all cursor-pointer"
              >
                <Cast className="w-6 h-6 text-amber-400 group-hover/cast:scale-110 transition-transform" />
                <span className="text-xs font-black text-white uppercase tracking-wider">Google Chromecast</span>
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Opens Cinema Player</span>
                <span className="text-[8px] font-mono text-zinc-500 normal-case">Use Chrome menu ⋮ → Cast to stream to TV</span>
              </button>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-white/10 text-left">
                <div>
                  <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-0.5">Smart TV Web Route</span>
                  <span className="text-xs font-mono text-zinc-300 font-bold truncate max-w-xs block">
                    {typeof window !== 'undefined' ? window.location.host : 'memoryweaver.studio'}/cinema/tv?id={data.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/cinema/tv?id=${data.id}`);
                    toast.success("TV Link Copied", { description: "Paste into your Smart TV browser address bar." });
                  }}
                  title="Copy the TV cinema link to your clipboard"
                  className="px-4 py-2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-colors shrink-0 cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* 0ms Camera Shutter Lens Flash Overlay */}
      <AnimatePresence>
        {isCameraFlashActive && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[30000] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>
    </>
  );
}
