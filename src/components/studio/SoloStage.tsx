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
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Video, Disc, Square, AlertTriangle, UploadCloud, CheckCircle2, Scissors, 
  Play, Pause, Camera, Loader2, Mic2, MessageSquare, Volume2, Sparkles, 
  UserCircle, Languages, Layout, Zap, Settings2, RefreshCw, CheckCircle, 
  Rocket, PenTool, Mic, MapPin, Calendar, Tag, ArrowRight, ArrowLeft, 
  Film as FilmIcon, BrainCircuit, Maximize2, Minus, Plus, ChevronRight, ChevronLeft,
  Lock, ShieldAlert, Smartphone, ShieldCheck, Lightbulb, Theater, Trash2,
  ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
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
import { generateDirectorsNotepad } from '@/actions/aiWeaver';
import { ProductionControlBar } from './ProductionControlBar';
import CinemaStageSwitch from './CinemaStageSwitch';
import { Memory } from '@/types';
import CinemaPoster from '../memory/CinemaPoster';
import { CinemaMonitor } from './CinemaMonitor';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { useAuth } from '@/hooks/useAuth';
import { Teleprompter } from './Teleprompter';
import { useAudioMonitor } from '@/hooks/useAudioMonitor';
import { useCaptureLogic } from '@/hooks/studio/useCaptureLogic';
import { useAlchemy } from '@/hooks/studio/useAlchemy';
import { useQRBridge } from '@/hooks/studio/useQRBridge';
import { useInterviewMode } from '@/hooks/studio/useInterviewMode';
import { QRController } from './QRController';
import { BeatSheet } from './BeatSheet';
import { useTableRead } from '@/hooks/studio/useTableRead';
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
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function SoloStage({ 
  data, update, modality, setModality, onWordCountChange, 
  currentStage, mentorActive, onToggleMentor, onClarityChange,
  onNext, onPrev, isComplete, charge, wordCount, highlightClarity,
  onboardingJustClosed, isUntouched, onActivity, formRef, onClearBackup
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
    sessionId,
    actions: globalActions 
  } = useStudioState();
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

  // Rehydrate trimRange when Firestore data or videoDuration loads
  useEffect(() => {
    if (data?.trimStart !== undefined || data?.trimEnd !== undefined) {
      const start = data?.trimStart ?? 0;
      const end = data?.trimEnd ?? (videoDuration || 100);
      setTrimRange([start, end]);
    }
  }, [data?.trimStart, data?.trimEnd, videoDuration]);

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
    ? (prompterSize === 'mini' ? 280 : 520)
    : (prompterSize === 'mini' ? 280 : prompterSize === 'sm' ? 380 : prompterSize === 'md' ? 580 : 820);

  const prompterHeight = isInterviewMode
    ? (prompterSize === 'mini' ? 180 : 420)
    : (prompterSize === 'mini' ? 180 : prompterSize === 'sm' ? 350 : prompterSize === 'md' ? 520 : 720);

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
    if (modalityMode === 'interview' || isInterviewMode) {
      setIsInterviewMode(true);
      setPrompterLayout('center');
    }
    startCapture();
  }, [modalityMode, isInterviewMode, startCapture]);

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
      setReviewVideoUrl(null);
      return;
    }
    const url = URL.createObjectURL(recordedBlob);
    setReviewVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [recordedBlob]);

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
      // Upload each segment blob
      for (let i = 0; i < edl.length; i++) {
        const seg = edl[i];
        const storagePath = `users/${userId || user?.uid}/memories/${activeMemoryId}/segments/${seg.segmentId}.webm`;
        const storageRef = ref(storage, storagePath);
        console.log(`[SoloStage] Uploading segment ${seg.segmentId} (${seg.blob.size} bytes)...`);
        await uploadBytesResumable(storageRef, seg.blob);
      }

      // Upload edl.json manifest
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
    if ((productionStage === 1 || productionStage === 2) && !isCameraActive && !recordedBlob) {
      setIsCameraActive(true);
    } else if (productionStage !== 1 && productionStage !== 2 && isCameraActive) {
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
  const previewUrl = reviewVideoUrl;

  const togglePreviewPlay = () => {
    if (previewVideoRef.current) {
      if (isPlaying) {
        previewVideoRef.current.pause();
      } else {
        previewVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

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

  // SNAPSHOT: Capture current frame as thumbnail
  const handleCaptureThumbnail = async () => {
    if (checkGuestAndUpsell("capturing cinematic poster frames")) return;
    if (!previewVideoRef.current || !data?.id) return;
    
    setIsCapturingThumbnail(true);
    try {
      const video = previewVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
         const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));
         if (blob) {
            const url = await uploadMediaBlob(blob, data.id);
            if (url) {
               update({ posterImageUrl: url }); // STANDARDIZE: Use posterImageUrl globally
               toast.success("Poster Updated", { 
                 description: "This frame is now your cinematic poster image.",
                 icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
               });
            }
         }
      }
    } catch (e) {
      console.error("Snapshot capture failed:", e);
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
    if (productionStage === 2 && !hasSeenTour) {
      setIsBriefingOpen(true);
    }
  }, [productionStage, hasSeenTour]);

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
  }, [productionStage, isBriefingOpen, hasSeenTour, playAudio, showRestorePrompt]);

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

  const handlePreviewTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const vid = e.currentTarget;
    const currentTime = vid.currentTime;
    
    // Safety check just in case Infinity slipped through
    if (videoDuration === 0 || !isFinite(videoDuration)) return;

    if (currentTime < trimRange[0]) vid.currentTime = trimRange[0];
    if (currentTime > trimRange[1]) {
      vid.pause();
      vid.currentTime = trimRange[0];
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
    <div className="max-w-5xl mx-auto w-full pb-2 transition-all duration-700">
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
      />
    </div>
  );

  const renderWeave = () => (
    <div className={cn(
      "w-full pb-2 transition-all duration-1000",
      data?.structuredScript ? "max-w-[95vw] xl:max-w-screen-2xl mx-auto h-[calc(100vh-180px)]" : "max-w-4xl mx-auto"
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
    <div className={cn("w-full h-full flex flex-col items-center justify-center relative pb-24 transition-colors duration-1000", (isTableReadActive || captureModality === 'raw') ? "bg-[#030303]" : "")}>
       <div 
         ref={videoContainerRef}
         className={cn(
           "w-full max-w-[90vw] xl:max-w-7xl relative overflow-hidden transition-all duration-1000",
           !(isTableReadActive || captureModality === 'raw') ? "aspect-video min-h-[580px] md:min-h-[660px]" : "h-[calc(100vh-240px)] min-h-[480px] max-h-[720px]",
           isRecording ? 'ring-2 ring-rose-500/50 shadow-[0_0_120px_rgba(244,63,94,0.3)] scale-[1.01]' : 'shadow-2xl',
           (isTableReadActive || captureModality === 'raw') ? "bg-[#030303] border-sky-500/20" : "bg-black border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)]"
         )}
       >
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
                    height: isDirectorMinimised ? '56px' : '420px',
                    width: isDirectorMinimised ? '200px' : '288px'
                  }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    height: isDirectorMinimised ? '56px' : '420px',
                    width: isDirectorMinimised ? '200px' : '288px',
                    borderRadius: isDirectorMinimised ? '9999px' : '2.5rem'
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
                    "bg-zinc-950/85 backdrop-blur-3xl border border-white/10 p-6 shadow-2xl flex flex-col justify-between hover:bg-zinc-900/90 transition-colors duration-700 select-none cursor-grab active:cursor-grabbing",
                    isDirectorMinimised && "p-3 px-4 flex-row items-center justify-between"
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
                      <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar select-none">
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

                            <div className="space-y-1 bg-sky-500/5 border border-sky-500/20 p-2.5 rounded-xl mt-1">
                              <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                🤝 Collaborative Tip
                              </span>
                              <p className="text-[9.5px] text-sky-300/90 leading-relaxed font-medium font-sans">
                                If you are struggling to adjust your camera lens in Solo Booth, why not consider working with a friend in <strong className="text-white">COLLAB SUITE</strong> or <strong className="text-white">GUEST DIRECTOR</strong> mode?
                              </p>
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

                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse">
                      <Sparkles className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="font-headline text-base font-bold text-white uppercase tracking-widest mb-1">Director's Tech Scout</h3>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mb-6">Camera, Lighting & Sound Check</p>

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

                    <div className="flex gap-4 w-full">
                      <button 
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

                     {/* Cinematic Filter Presets */}
                     <div className="space-y-2">
                       <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold block">Color Grade Filter</span>
                       <div className="grid grid-cols-2 gap-1.5">
                         {(['default', 'warm', 'cool', 'noir'] as const).map((filter) => (
                           <button
                             key={filter}
                             onClick={() => setOpticsFilter(filter)}
                             className={cn(
                               "py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer",
                               opticsFilter === filter 
                                 ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                 : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                             )}
                           >
                             {filter === 'default' && 'Default'}
                             {filter === 'warm' && 'Warm Tint'}
                             {filter === 'cool' && 'Cool modern'}
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
             drag={true}
             dragConstraints={videoContainerRef}
             dragElastic={0.05}
             dragMomentum={false}
             animate={isAlchemySaving || reviewTake || captureModality === 'raw' ? {
               opacity: 0,
               scale: 0.95,
               x: 800,
             } : isTableReadActive ? {
               opacity: 1,
               scale: 1,
               left: "3%",
               top: "40px",
               x: 0,
               y: 0,
               width: "94%",
               height: "84%",
             } : prompterLayout === 'center' ? (
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
               isTheaterExpanded ? "fixed inset-6 z-50 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl transition-all duration-300 ease-in-out cursor-default" : (prompterSize === 'mini' && !isTableReadActive) ? "p-4 bg-zinc-950/90" : "p-8",
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
            {isTheaterExpanded && stream && (
              <div className="absolute top-4 right-4 w-48 aspect-video rounded-lg border border-slate-700 shadow-md overflow-hidden z-50 bg-black">
                <video
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover animate-fade-in"
                  style={{ transform: 'scaleX(-1)' }}
                  ref={(el) => {
                    if (el) el.srcObject = stream;
                  }}
                />
              </div>
            )}
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
                <button 
                  onClick={() => setIsTheaterExpanded(prev => !prev)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.2)] active:scale-95"
                  title="Toggle Theater Mode (Full Screen Takeover)"
                >
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-wider">{isTheaterExpanded ? 'Exit Theater' : 'Theater View'}</span>
                </button>
                <button 
                  onClick={() => setPrompterSize(prev => prev === 'mini' ? 'sm' : prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : 'mini')}
                  className="p-1 rounded bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center w-6 h-6 shrink-0"
                  title="Toggle Teleprompter Size"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setIsBriefingOpen(true)}
                  className="p-1 rounded bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center w-6 h-6 shrink-0"
                  title="Open Stage Briefing & Tour"
                >
                  <Theater className="w-3.5 h-3.5" />
                </button>
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
                />
              </div>

              {/* Directorial Sidebar (Conditional) - Restricted to 'lg' size to prevent layout collisions */}
              {data?.structuredScript && prompterSize === 'lg' && captureModality !== 'raw' && (
                <div className="w-64 flex-none border-l border-white/5 pl-8 space-y-8 overflow-y-auto custom-scrollbar">
                  <BeatSheet 
                    beats={data.structuredScript.beatSheet}
                    activeBeatIndex={activeBeatIndex}
                    onBeatClick={(i) => {
                      window.dispatchEvent(new CustomEvent('studio-scroll-to-beat', { detail: { index: i } }));
                    }}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400/60">
                      <Video className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Live Cues</span>
                    </div>
                    {data.structuredScript.stageDirections.slice(0, 3).map((dir, i) => (
                      <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 hover:bg-white/10 transition-all">
                        <div className="flex items-center justify-between">
                           <span className="text-[8px] font-black text-emerald-400/60 uppercase">{dir.type}</span>
                           <span className="text-[8px] font-mono text-white/20">{dir.timecode}</span>
                        </div>
                        <p className="text-[10px] text-white/50 leading-snug">{dir.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Cinematic Camera Overlays (Safe Areas/REC) */}
          {!isTableReadActive && (
            <div className="absolute inset-0 z-20 pointer-events-none border-[40px] border-transparent">
               
               {/* Corner Accents */}
               <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-xl" />
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
                      {(!isOnline || bridgeStatus === 'disconnected') && (
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
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/10 rounded-full opacity-50" />
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
                            <div className="flex items-center gap-2.5 shrink-0 pl-2">
                               {currentQuestionIndex > 0 && (
                                 <button onClick={triggerPrevQuestion} disabled={isSynthesizing} className="px-3 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1 cursor-pointer">
                                    <ArrowLeft className="w-3 h-3" /> Back
                                 </button>
                               )}
                               <button onClick={triggerNextQuestion} disabled={isSynthesizing} className="px-4 py-2 bg-sky-500 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                                  <MessageSquare className="w-3.5 h-3.5" /> Next
                               </button>
                               <button onClick={handleCheckFraming} disabled={isAnalyzingFraming} className="px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-[9px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                                  <Layout className="w-3.5 h-3.5 text-emerald-400" /> Lint
                               </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col gap-1 items-center mb-1 select-none shrink-0">
                               <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] animate-pulse">AI DIRECTOR: INTERVIEW ACTIVE</span>
                               <div className="w-8 h-[1px] bg-sky-500/30 my-1" />
                            </div>
                            <div className="flex-grow flex items-center justify-center min-h-0 py-2">
                               <p className="text-xs md:text-sm font-headline text-white leading-relaxed italic max-h-[140px] overflow-y-auto custom-scrollbar px-1">
                                  "{currentQuestion || 'Ready to start the interview...'}"
                               </p>
                            </div>
                            <div className="flex items-center gap-3 justify-center pt-2 shrink-0">
                               {currentQuestionIndex > 0 && (
                                 <button onClick={triggerPrevQuestion} disabled={isSynthesizing} className="px-3 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1 cursor-pointer">
                                    <ArrowLeft className="w-3 h-3" /> Back
                                 </button>
                               )}
                               <button onClick={triggerNextQuestion} disabled={isSynthesizing} className="px-4 py-2 bg-sky-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                                  <MessageSquare className="w-3.5 h-3.5" /> Next
                               </button>
                               <button onClick={handleCheckFraming} disabled={isAnalyzingFraming} className="px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                                  <Layout className="w-3.5 h-3.5 text-emerald-400" /> Lint
                               </button>
                            </div>
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
                       segments={recordedSegments}
                       onUpdateSegments={setRecordedSegments}
                       onApprove={handleStitchAndApprove}
                       onDiscard={handleDiscardTake}
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
    <div className="w-full max-w-[95vw] xl:max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-8 pb-24 h-[calc(100vh-140px)]">
       <div className="w-full lg:w-1/2 flex flex-col gap-8 h-full">
          <div className="aspect-video bg-black rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative group">
             {previewUrl ? (
                <video 
                  ref={previewVideoRef}
                  src={previewUrl}
                  onTimeUpdate={handlePreviewTimeUpdate}
                  className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
                />
             ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/10 font-black uppercase tracking-[0.5em] text-xs">Awaiting Development Reel...</div>
             )}
              {/* Playback Overlay */}
              <div className="absolute bottom-8 left-8 right-8 z-20 flex items-center gap-6 p-4 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500">
                <button onClick={togglePreviewPlay} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-all">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <div className="flex-1">
                   <div className="flex justify-between items-center mb-2 px-1">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Master Reel Progress</span>
                      <span className="font-mono text-[10px] text-emerald-400">{formatTime(trimRange[0])} / {formatTime(videoDuration)}</span>
                   </div>
                    <div className="relative pt-2">
                       <Slider 
                          value={trimRange} 
                          onValueChange={(val) => setTrimRange(val as [number, number])}
                          onValueCommit={(val) => update({ trimStart: val[0], trimEnd: val[1] })}
                          min={0}
                          max={videoDuration || 100}
                          step={0.1}
                       />
                       {/* Beat Markers Overlay */}
                       <div className="absolute top-0 left-0 right-0 h-4 pointer-events-none">
                          {videoDuration > 0 && data?.emotionalBeats?.map((beat: any, idx: number) => {
                             const percent = (beat.time / videoDuration) * 100;
                             if (percent > 100) return null;
                             return (
                               <motion.div 
                                 key={idx}
                                 initial={{ scale: 0 }}
                                 animate={{ scale: 1 }}
                                 className="absolute w-1 h-3 bg-emerald-500/60 rounded-full"
                                 style={{ left: `${percent}%`, top: '8px' }}
                                 title={beat.label}
                               />
                             );
                          })}
                       </div>
                    </div>
                </div>
              </div>
          </div>
          
          <div className="flex-1 bg-white/[0.02] border border-white/5 p-12 rounded-[3rem] flex flex-col justify-center items-center text-center space-y-6">
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Camera className="w-6 h-6 text-emerald-400" />
             </div>
             <div>
                <h3 className="text-xl font-headline text-white italic mb-2">Cinematic Visualization</h3>
                <p className="text-xs text-white/30 max-w-xs uppercase tracking-widest font-bold leading-relaxed">Capture a frame from your reel to anchor the theatrical showcase poster.</p>
             </div>
             <button 
                onClick={handleCaptureThumbnail} 
                disabled={isCapturingThumbnail} 
                className="px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
             >
                {isCapturingThumbnail ? 'Capturing Snapshot...' : 'Snap Production Frame'}
             </button>
          </div>
       </div>

       <div className="w-full lg:w-1/2 bg-black/40 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl h-full">
          <div className="h-full overflow-y-auto custom-scrollbar">
            <DirectorsNotepad 
              userId={data?.userId}
              memoryId={data?.id}
              data={data} 
              update={update} 
              onSave={handleSaveMemory}
              isSaving={uploading}
            />
          </div>
       </div>
    </div>
  );

  const renderShowcase = () => (
    <div className="max-w-6xl mx-auto w-full pt-10 pb-32 space-y-16">
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
       </motion.div>
       
       <div className="flex flex-col lg:flex-row gap-20 items-center justify-center">
          {/* THE POSTER (LEFT) */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, rotateY: 20 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
            className="relative group perspective-2000"
          >
             <div className="absolute -inset-20 bg-sky-500/10 blur-[120px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
             <div className="relative z-10">
                <CinemaPoster memory={data} />
             </div>
             
             {/* Filmic Reflections */}
             <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden opacity-30">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-2000" />
             </div>
          </motion.div>

          {/* PRODUCTION STATS & ACTIONS (RIGHT) */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="flex-1 space-y-10 max-w-md text-left"
          >
             <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                   <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                   </div>
                   <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-widest mb-1">Negative Mastered</h4>
                      <p className="text-sm text-white/40 leading-relaxed font-medium">All visual and auditory catalysts have been processed into the final narrative weave.</p>
                   </div>
                </div>

                <div className="flex items-start gap-6 group">
                   <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-sky-500/10 group-hover:border-sky-500/30 transition-all">
                      <BrainCircuit className="w-7 h-7 text-sky-400" />
                   </div>
                   <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-widest mb-1">AI Metadata Synced // VERIFIED</h4>
                      <p className="text-sm text-white/40 leading-relaxed font-medium">Emotional beats and entity mapping have been secured for the global cinematic archive.</p>
                   </div>
                </div>

                <div className="flex items-start gap-6 group">
                   <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-all">
                      <Sparkles className="w-7 h-7 text-amber-400" />
                   </div>
                   <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-widest mb-1">Fusion Protocol // ACTIVE</h4>
                      <p className="text-sm text-white/40 leading-relaxed font-medium">Original intent and performance have been synthesized into a prestigious video story.</p>
                   </div>
                </div>

                <div className="flex items-start gap-6 group">
                   <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-rose-500/10 group-hover:border-rose-500/30 transition-all">
                      <Rocket className="w-7 h-7 text-rose-400" />
                   </div>
                   <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-widest mb-1">Archive Entry</h4>
                      <p className="text-sm text-white/40 leading-relaxed font-medium">Your memory is now a permanent chapter in your life's cinematic timeline.</p>
                   </div>
                </div>
             </div>

             {data.videoStory && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 1.2 }}
                 className="mt-8 p-8 bg-gradient-to-br from-emerald-500/5 via-white/5 to-transparent border border-white/10 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group"
               >
                 <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                   <FilmIcon className="w-16 h-16 text-white" />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-6 flex items-center gap-3">
                   <Sparkles className="w-4 h-4" />
                   The Narrative Fusion
                 </h4>
                 <p className="text-xl text-white/90 leading-relaxed font-medium italic serif">
                   "{data.videoStory}"
                 </p>
                 <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-white/20">Auteur Synthesis // AI-Fused Narrative</span>
                    <div className="flex gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
                    </div>
                 </div>
               </motion.div>
             )}

             <div className="pt-8 space-y-4">
                <button 
                  onClick={() => window.location.href = `/memory/${data.id}`} 
                  className="w-full py-6 bg-white text-slate-950 font-black rounded-3xl uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3"
                >
                  <Play className="w-4 h-4 fill-current" />
                  View Premiere
                </button>
                
                <button 
                  onClick={() => window.location.href = '/timeline'} 
                  className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-3xl uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3"
                >
                  Return to Studio Slate
                </button>
             </div>
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
    </>
  );
}
