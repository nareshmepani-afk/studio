'use client';
import React, { useState, useMemo, useEffect, useCallback, useRef, useImperativeHandle } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Maximize, Monitor, Rocket, Edit3, Loader2 } from 'lucide-react';
import { publishMemoryAction, unpublishMemoryAction } from '@/actions/memoryActions';
import { mockPromptGroups } from '@/lib/mockData';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import dynamic from 'next/dynamic';
import PerspectiveWrapper from './PerspectiveWrapper';
import { MemoryForm, ACT_TITLES } from './MemoryForm';
import SoloStage from './SoloStage';
import { StudioLobby } from './StudioLobby';
const CollaborativeStage = dynamic(() => import('./CollaborativeStage'), { ssr: false });
import { InstrumentSelection } from './InstrumentSelection';
import { ProductionRail, PRODUCTION_ACTS } from './ProductionRail';
import { cn } from '@/lib/utils';
import { ResizableDivider } from './ResizableDivider';
import { ProductionControlBar } from './ProductionControlBar';
import { ProductionPreFlight } from './overlays/ProductionPreFlight';
import { useStudioState as useGlobalStudioState } from '@/hooks/studio/useStudioState';
import { useProductionCharge } from '@/hooks/studio/useProductionCharge';
import { detectAnchors } from '@/hooks/studio/useDirectorInk';
import { generateDraftOptions, generateDirectorialBrief } from '@/actions/aiWeaver';
import { generateSoundtrack } from '@/actions/audioWeaver';
import { StudioBlueprint } from './StudioBlueprint';
import { useAuth } from '@/hooks/useAuth';
import { DirectorialUpsellDialog } from './overlays/DirectorialUpsellDialog';


const DEFAULT_SIDEBAR_WIDTH = 280;
import { MentorGuide } from './MentorGuide';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { firebaseConfig } from '@/lib/config-schema';
import { OnboardingOverlay } from './overlays/OnboardingOverlay';
const SNAP_THRESHOLD = 20; // Magnetic snap range
import localforage from 'localforage';

// Define a placeholder for the memory data type
type MemoryData = any;

interface ProductionDeckProps {
    memoryData: MemoryData;
    onUpdate: (updatedData: MemoryData) => any;
    layoutMode: 'takeover' | 'drawer';
    onToggleLayout: () => void;
    onClose?: () => void;
}

const ProductionDeck = React.forwardRef<any, ProductionDeckProps>(({
    memoryData,
    onUpdate,
    layoutMode,
    onToggleLayout,
    onClose
}, ref) => {
    const searchParams = useSearchParams();
    const urlMode = searchParams.get('mode');
    const [activeRoom, setActiveRoom] = useState<'solo' | 'collaborative' | 'guest'>(
        urlMode === 'guest' ? 'guest' :
            urlMode === 'collaborative' ? 'collaborative' : 'solo'
    );
    const [isRailRetracted, setIsRailRetracted] = useState(false);
    const [hasUnsavedTake, setHasUnsavedTake] = useState(false);

    // Auth & Upsell State
    const { user } = useAuth();
    const [isUpsellOpen, setIsUpsellOpen] = useState(false);
    const [upsellFeature, setUpsellFeature] = useState("recording new takes");

    const checkUnsavedTake = useCallback(() => {
        localforage.keys()
            .then((keys) => {
                const hasBackup = keys.some(k => k.startsWith('backup_take_'));
                setHasUnsavedTake(hasBackup);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        checkUnsavedTake();
    }, [memoryData?.id, checkUnsavedTake]);

    // 1. Unified Global State
    const { 
        currentStage, 
        modality, 
        isDirectorOpen,
        isReviewing, 
        selectedVision,
        polishedOriginalHook,
        timeframeScope,
        durationQuantity,
        durationUnit,
        narratorAgeAtTime,
        isProductionLocked,
        selectedTake,
        mentorContext,
        actions: {
            setIsReviewing, 
            setReviewDrafts, 
            setPolishedOriginalHook,
            setIsGeneratingDrafts,
            setModality,
            setStage,
            setIsDirectorOpen,
            setSynthesisError,
            setSelectedVision,
            setTimeframeScope,
            setDurationQuantity,
            setDurationUnit,
            setNarratorAgeAtTime,
            setIsProductionLocked,
            setSelectedTake
        }
    } = useGlobalStudioState();

    const [hasNavigatedBack, setHasNavigatedBack] = useState(false);
    const prevStageRef = useRef<number>(0);

    useEffect(() => {
        if (prevStageRef.current >= 1 && currentStage === 0) {
            console.log("[ProductionDeck] Navigated back from Act II+ to Act I. Setting hasNavigatedBack to true.");
            setHasNavigatedBack(true);
        }
        prevStageRef.current = currentStage;
    }, [currentStage]);

    const lastLoadedIdRef = useRef<string | null>(null);
    const isNewMemoryRef = useRef<boolean>(!memoryData?.id);

    useEffect(() => {
        const currentRefId = memoryData?.id || memoryData?.promptId;
        if (!currentRefId) return;
        
        // If it was a brand new memory that just got its ID assigned, 
        // transition it to an existing memory but do not overwrite current active state.
        if (isNewMemoryRef.current && memoryData?.id) {
            console.log("[ProductionDeck] New memory ID assigned:", memoryData.id, ". Avoiding rehydration overwrite.");
            lastLoadedIdRef.current = memoryData.id;
            isNewMemoryRef.current = false;
            return;
        }

        // Only run sync when a different memory is loaded
        if (currentRefId === lastLoadedIdRef.current) return;
        
        setHasNavigatedBack(false);
        prevStageRef.current = 0;
        
        const targetStage = memoryData?.productionStage || 0;
        console.log("[ProductionDeck] Syncing/Rehydrating global state from Firestore memory data:", currentRefId, "stage:", targetStage);
        
        // 1. Sync stage - Entry Rule: Every session MUST mount at Act I (The Scriptorium)
        setStage(0);
        
        // 2. Sync modality
        if (hasNavigatedBack && memoryData?.modality) {
            setModality(memoryData.modality);
        } else {
            setModality(null);
        }
        
        // 3. Sync original hook
        if (memoryData?.originalHook) {
            setPolishedOriginalHook(memoryData.originalHook);
        } else {
            setPolishedOriginalHook(null);
        }
        
        // 4. Sync selected vision
        if (memoryData?.activeVision) {
            const type = (memoryData.activeVision === 'soul' || memoryData.activeVision === 'poetic') ? 'soul' :
                         (memoryData.activeVision === 'sensory' || memoryData.activeVision === 'direct') ? 'sensory' :
                         (memoryData.activeVision === 'cinematic' || memoryData.activeVision === 'nostalgic') ? 'cinematic' : null;
            setSelectedVision(type, memoryData.activeVisionLabel || memoryData.activeVision);
        } else {
            setSelectedVision(null, null);
        }
        
        // 5. Sync review drafts
        if (targetStage === 0 && memoryData?.productionTakes && memoryData.productionTakes.length > 0) {
            setReviewDrafts(memoryData.productionTakes);
            setIsReviewing(memoryData.isReviewing !== false);
        } else {
            setReviewDrafts([]);
            setIsReviewing(false);
        }
        
        // 6. Sync temporal parameters
        if (memoryData?.timeframeScope) setTimeframeScope(memoryData.timeframeScope);
        if (memoryData?.durationQuantity) setDurationQuantity(memoryData.durationQuantity);
        if (memoryData?.durationUnit) setDurationUnit(memoryData.durationUnit);
        if (memoryData?.narratorAgeAtTime !== undefined) setNarratorAgeAtTime(memoryData.narratorAgeAtTime);
        
        // 6.5. Sync production lock
        const isLocked = !!(memoryData?.isProductionLocked || targetStage >= 1);
        setIsProductionLocked(isLocked);
        if (isLocked) {
            if (typeof setSelectedTake === 'function') {
                setSelectedTake(memoryData?.prose || memoryData?.description || null);
            }
        } else {
            if (typeof setSelectedTake === 'function') {
                setSelectedTake(null);
            }
        }
        
        // 7. Reset transient state
        setIsGeneratingDrafts(false);
        setSynthesisError(null);
        
        // Set the ref so we don't sync again for the same memory ID
        lastLoadedIdRef.current = currentRefId;
        
    }, [
        memoryData?.id,
        memoryData?.promptId,
        memoryData?.productionStage,
        memoryData?.modality,
        memoryData?.originalHook,
        memoryData?.activeVision,
        memoryData?.activeVisionLabel,
        memoryData?.productionTakes,
        memoryData?.timeframeScope,
        memoryData?.durationQuantity,
        memoryData?.durationUnit,
        memoryData?.narratorAgeAtTime,
        memoryData?.isProductionLocked,
        setStage,
        setModality,
        setPolishedOriginalHook,
        setSelectedVision,
        setReviewDrafts,
        setIsReviewing,
        setTimeframeScope,
        setDurationQuantity,
        setDurationUnit,
        setNarratorAgeAtTime,
        setIsProductionLocked,
        setIsGeneratingDrafts,
        setSelectedTake,
        hasNavigatedBack,
    ]);

    // Sync production lock state dynamically whenever it changes in memoryData,
    // bypassing the early-return ID-check guard of the main sync effect.
    useEffect(() => {
        if (!memoryData?.id) return;
        const isLocked = !!(memoryData.isProductionLocked || (memoryData.productionStage || 0) >= 1);
        console.log("[ProductionDeck:SyncLock] Syncing production lock. memoryData:", {
            id: memoryData.id,
            isProductionLocked: memoryData.isProductionLocked,
            productionStage: memoryData.productionStage,
            proseLength: memoryData.prose?.length || 0,
            descriptionLength: memoryData.description?.length || 0,
            isLocked
        });
        setIsProductionLocked(isLocked);
        if (isLocked) {
            if (typeof setSelectedTake === 'function') {
                const targetTake = memoryData.prose || memoryData.description || null;
                console.log("[ProductionDeck:SyncLock] Setting selectedTake to:", targetTake ? targetTake.substring(0, 60) + "..." : null);
                setSelectedTake(targetTake);
            }
        } else {
            if (typeof setSelectedTake === 'function') {
                console.log("[ProductionDeck:SyncLock] Clearing selectedTake (null)");
                setSelectedTake(null);
            }
        }
    }, [
        memoryData?.id,
        memoryData?.isProductionLocked,
        memoryData?.productionStage,
        memoryData?.prose,
        memoryData?.description,
        setIsProductionLocked,
        setSelectedTake
    ]);


    const [sidebarWidth, setSidebarWidth] = useState(320); // Default width
    const [isDragging, setIsDragging] = useState(false);
    const [isSnapActive, setIsSnapActive] = useState(false);
    const SNAP_THRESHOLD = 20;

    const [hoveredInstrument, setHoveredInstrument] = useState<string | null>(null);
    const [wordCount, setWordCount] = useState(0);
    const [hotClarity, setHotClarity] = useState(0);
    const [showPreFlight, setShowPreFlight] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [highlightClarity, setHighlightClarity] = useState(false);
    const [isSavingNext, setIsSavingNext] = useState(false);
    const formRef = useRef<any>(null);
    const synthesisAbortRef = useRef<boolean>(false);
    const [lobbyConfirmed, setLobbyConfirmed] = useState<boolean>(false);

    // Reset Lobby Confirmation when navigating away from Act III (Capture / stage 2)
    useEffect(() => {
        if (currentStage !== 2) {
            setLobbyConfirmed(false);
        }
    }, [currentStage]);

    // MOD-15: Mentorship Lifeline (Elevated to global StudioMentorProvider)
    const { 
        mentorModeActive = false, 
        isOverlayOpen = false, 
        isManualMentor = false,
        toggleMentor = () => {}, 
        triggerWhisper = () => {},
        closeOverlay = () => {}, 
        getWhisper = () => ({ act: 0, whisper: '' } as any)
    } = mentorContext || {};
    
    // reCAPTCHA Hook
    const { executeAction } = useRecaptcha(firebaseConfig.recaptchaSiteKey);

    // Clarity Logic for Act I
    const anchors = useMemo(() => detectAnchors(memoryData?.description || ''), [memoryData?.description]);
    const { totalCharge, dominantType } = useProductionCharge({
        text: memoryData?.description || '',
        anchors
    });

    // Act Completion Logic
    const isActComplete = useMemo(() => {
        const stage = currentStage;

        switch (stage) {
            case 0: // Act I: Hook
                return !!(
                    memoryData?.title?.trim() && 
                    (memoryData?.description?.trim()?.length > 10) && 
                    memoryData?.location?.trim() && 
                    memoryData?.dateComponents?.year && 
                    memoryData?.dateComponents?.year !== 'none' &&
                    memoryData?.dateComponents?.year !== ''
                );
            case 1: // Act II: Weave
                return ['poetic', 'direct', 'nostalgic'].includes(memoryData?.activeVision || '');
            case 2: // Act III: Capture
                return !!memoryData?.videoUrl;
            case 3: // Act IV: Director's Cut
                return true; // Usually manual review
            case 4: // Act V: Premiere
                return true;
            default:
                return false;
        }
    }, [currentStage, memoryData?.title, memoryData?.description, memoryData?.videoUrl, memoryData?.location, memoryData?.dateComponents?.year, memoryData?.activeVision]);

    const isLowClarity = useMemo(() => {
        const isAct1 = currentStage === 0;
        const clarity = isAct1 ? hotClarity : totalCharge;
        return isAct1 && clarity < 15;
    }, [currentStage, hotClarity, totalCharge]);

    const missingRequirements = useMemo(() => {
        const reqs = [];
        if (currentStage === 0) {
            if (!memoryData?.title?.trim()) reqs.push("Theatrical Title");
            if (!memoryData?.location?.trim()) reqs.push("Cinematic Location");
            if (!memoryData?.dateComponents?.year) reqs.push("Time/Year Anchor");
            if (memoryData?.description?.trim()?.length < 10) reqs.push("Narrative Hook (> 10 chars)");
            if (hotClarity < 15) reqs.push("Scene Clarity (needs sensory keywords)");
        } else if (currentStage === 1) {
            const hasWeave = ['poetic', 'direct', 'nostalgic'].includes(memoryData?.activeVision || '');
            if (!hasWeave) reqs.push("Sensory Weave Selection");
        } else if (currentStage === 2) {
            if (!memoryData?.videoUrl) reqs.push("Video Recording");
        }
        return reqs;
    }, [currentStage, memoryData, hotClarity]);

    const router = useRouter();
    const groupId = searchParams.get('groupId');

    // PERSISTENCE: Initialize from localStorage on mount
    useEffect(() => {
        const savedWidth = localStorage.getItem('studio_sidebar_width');
        if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
    }, []);

    // PERSISTENCE: Save on change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('studio_sidebar_width', sidebarWidth.toString());
        }, 500);
        return () => clearTimeout(timer);
    }, [sidebarWidth]);

    // ELASTIC LOGIC: Respond to content volume
    useEffect(() => {
        // Only trigger elastic flow in 'pen' modality and ACT II (Weave)
        if (modality !== 'pen' || currentStage !== 1) return;

        // Director's Recommendation: Fade starts at 50, full recession at 150
        if (wordCount < 50) return; // Keep broad

        const minWidth = 120; // "Deep Flow" width
        const maxWidth = 320; // Focus width

        // Progress: 0 (at 50 words) to 1 (at 150 words)
        const progress = Math.min(Math.max((wordCount - 50) / 100, 0), 1);
        const targetWidth = maxWidth - (maxWidth - minWidth) * progress;

        // Smoothly adjust sidebar width (don't override manual drag if we've just dragged)
        if (!isDragging) {
            setSidebarWidth(targetWidth);
        }
    }, [wordCount, modality, currentStage, isDragging]);

    // ACT-AWARE FOCUS: Hook Phase (Act I) Retraction
    useEffect(() => {
        if (currentStage === 0 && modality !== null) {
            setIsRailRetracted(true);
        } else if (currentStage === 1) {
            setIsRailRetracted(false);
        }
    }, [currentStage, modality]);

    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            if (!mentorModeActive && currentStage === 0 && !isReviewing) {
                toggleMentor(false); // Auto-trigger, not manual
            }
        }, 90000); // 90 seconds
    }, [mentorModeActive, currentStage, toggleMentor, isReviewing]);

    // AUTO-ACTIVATION: Studio Mentor Idle Protocol
    useEffect(() => {
        // Only trigger in Act I if not already active and not reviewing
        if (currentStage !== 0 || mentorModeActive || isReviewing) {
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
                idleTimerRef.current = null;
            }
            return;
        }

        // Listen for activity in the window
        window.addEventListener('mousemove', resetIdleTimer);
        window.addEventListener('keydown', resetIdleTimer);
        window.addEventListener('mousedown', resetIdleTimer);
        window.addEventListener('scroll', resetIdleTimer, true);
        window.addEventListener('touchstart', resetIdleTimer);

        // Initial timer start
        resetIdleTimer();

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            window.removeEventListener('mousemove', resetIdleTimer);
            window.removeEventListener('keydown', resetIdleTimer);
            window.removeEventListener('mousedown', resetIdleTimer);
            window.removeEventListener('scroll', resetIdleTimer, true);
            window.removeEventListener('touchstart', resetIdleTimer);
        };
    }, [currentStage, mentorModeActive, isReviewing, resetIdleTimer]);

    // Find the current group context for navigation breadcrumbs
    const currentGroup = useMemo(() => {
        // 1. Try URL parameter first (passed from dashboard)
        if (groupId) {
            return mockPromptGroups.find(g => g.id === groupId);
        }
        // 2. Fallback: Search the prompt library for the promptId in this memory
        if (memoryData?.promptId) {
            return mockPromptGroups.find(g =>
                g.prompts.some(p => p.id === memoryData.promptId)
            );
        }
        return null;
    }, [groupId, memoryData?.promptId]);

    const groupTitle = currentGroup?.title?.en || "My Life Journey";

    // ONBOARDING: Director's Briefing Logic
    useEffect(() => {
        // If we are not in Act I, onboarding must not be shown.
        if (currentStage !== 0) {
            if (showOnboarding) {
                setShowOnboarding(false);
            }
            return;
        }

        // Only trigger briefing in Act I when not reviewing the synthesized drafts
        if (isReviewing) return;

        // PER-MEMORY TRACKING: We want a briefing for every new production
        const onboardingKey = `onboarding_completed_${memoryData?.id || 'global'}`;
        const hasSeenOnboarding = localStorage.getItem(onboardingKey);
        
        // FIND CURRENT PROMPT to check for "Untouched" state
        const currentPrompt = currentGroup?.prompts.find(p => p.id === memoryData?.promptId);
        const isUntouched = memoryData?.description === currentPrompt?.description;
        // Only auto-trigger the briefing if the text is strictly UNTOUCHED.
        // If they clear the text, we don't want to re-trigger the onboarding.
        const isFirstProduction = isUntouched;

        // MENTOR OVERRIDE: If URL has mentor=on OR Mentor Button is clicked
        const mentorRequested = searchParams.get('mentor') === 'on' || mentorModeActive;

        // Trigger if:
        // 1. Truly first time (untouched) AND hasn't seen onboarding
        // 2. OR Mentor button is manually clicked (mentorModeActive) while in Act I
        //    (This allows re-watching the briefing if they click Mentor again)
        // TIGHTENED: Only auto-trigger if untouched. 
        // If seen once, only manual Mentor button can re-trigger it.
        const shouldTrigger = !hasSeenOnboarding 
            ? (isFirstProduction || mentorModeActive)
            : (isManualMentor && mentorModeActive && currentStage === 0);

        if (shouldTrigger && modality !== null && !showOnboarding) {
            setShowOnboarding(true);
            
            // If we're showing the briefing, we should close the regular mentor whisper overlay
            // to prevent UI competition
            if (isOverlayOpen) closeOverlay();
        }
    }, [modality, memoryData?.id, memoryData?.description, currentStage, mentorModeActive, currentGroup, searchParams, isReviewing, showOnboarding]);

    const [onboardingJustClosed, setOnboardingJustClosed] = useState(false);

    const handleOnboardingClose = () => {
        setShowOnboarding(false);
        const onboardingKey = `onboarding_completed_${memoryData?.id || 'global'}`;
        localStorage.setItem(onboardingKey, 'true');
        setHighlightClarity(true);
        setOnboardingJustClosed(true);
        
        // Reset the closed signal after a short delay so it can be re-triggered if needed
        setTimeout(() => setOnboardingJustClosed(false), 2000);
        
        // Mentor Baton Hand-off
        triggerWhisper({
            act: 0,
            whisper: "The briefing is complete. Act I is your foundation—don't rush it. Focus on the sensory details that make this memory yours.",
            toolLabel: "Director's Insight"
        });
    };

    const handleUpdate = useCallback((updatedData: MemoryData) => {
        return onUpdate(updatedData);
    }, [onUpdate]);

    // DRAG LOGIC
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        setIsRailRetracted(false); // Ensure we're in 'open' mode when dragging
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const newWidth = Math.max(0, Math.min(clientX, 800)); // Clamp between 0 and 800px
            setSidebarWidth(newWidth);
        };

        const handleUp = () => {
            setIsDragging(false);

            // SMART SNAPS
            const containerWidth = window.innerWidth;
            const goldenRatioWidth = containerWidth / 2.618;
            const halfWidth = containerWidth / 2;

            if (Math.abs(sidebarWidth - 80) < SNAP_THRESHOLD) {
                setSidebarWidth(80);
                setIsSnapActive(true);
            } else if (Math.abs(sidebarWidth - goldenRatioWidth) < SNAP_THRESHOLD) {
                setSidebarWidth(goldenRatioWidth);
                setIsSnapActive(true);
            } else if (Math.abs(sidebarWidth - halfWidth) < SNAP_THRESHOLD) {
                setSidebarWidth(halfWidth);
                setIsSnapActive(true);
            } else if (sidebarWidth < 50) {
                setSidebarWidth(0);
                setIsRailRetracted(true);
            }

            setTimeout(() => setIsSnapActive(false), 500);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDragging, sidebarWidth]);

    const handleSnapGoldenRatio = () => {
        const target = window.innerWidth / 2.618;
        setSidebarWidth(target);
        setIsSnapActive(true);
        setTimeout(() => setIsSnapActive(false), 500);
    };

    const renderRoom = () => {
        const currentPrompt = currentGroup?.prompts.find(p => p.id === memoryData?.promptId);
        const isUntouched = memoryData?.description === currentPrompt?.description;

        switch (activeRoom) {
            case 'solo':
                return (
                    <SoloStage
                        formRef={formRef}
                        data={memoryData}
                        update={handleUpdate}
                        modality={modality}
                        setModality={setModality}
                        onClarityChange={setHotClarity}
                        onWordCountChange={setWordCount}
                        currentStage={currentStage}
                        mentorActive={mentorModeActive}
                        onToggleMentor={toggleMentor}
                        onNext={handleNextAct}
                        onPrev={handlePrevAct}
                        isComplete={isActComplete}
                        charge={currentStage === 0 ? hotClarity : totalCharge}
                        wordCount={wordCount}
                        highlightClarity={highlightClarity}
                        onboardingJustClosed={onboardingJustClosed}
                        isUntouched={isUntouched}
                        onActivity={resetIdleTimer}
                        onClearBackup={checkUnsavedTake}
                    />
                );
            case 'collaborative':
                return <CollaborativeStage data={memoryData} update={handleUpdate} modality={modality} setModality={setModality} />;
            case 'guest':
                return <CollaborativeStage data={memoryData} update={handleUpdate} mode="guest" modality={modality} setModality={setModality} />;
            default:
                return <div>Select a production mode to begin.</div>;
        }
    };


    const handleNextAct = useCallback(async () => {
        // COMMIT MANTLE: Force child form to flush state to parent before processing transitions
        let flushedState: any = null;
        if (formRef.current?.flush) {
            setIsSavingNext(true);
            try {
                flushedState = await formRef.current.flush();
            } catch (err) {
                console.error("Flush failed during transition", err);
            } finally {
                setIsSavingNext(false);
            }
        }

        const isAct1 = currentStage === 0;

        // If the scene has an active production lock, skip the AI Synthesis ceremony entirely
        // and advance the user directly to the weave (Act II)
        if (isAct1 && isProductionLocked) {
            console.log("[ProductionDeck] Production is locked. Advancing directly to Act II (The Weave).");
            const next = 1;
            setStage(next);
            setShowPreFlight(false);
            if ((memoryData?.productionStage || 0) < next) {
                handleUpdate({ productionStage: next });
            }
            return;
        }

        // NEW: "Director's Cut" Ceremony Trigger
        if (isAct1 && !isReviewing) {
            console.log("[ProductionDeck] Act I detected. Triggering AI Synthesis Ceremony...");
            setIsGeneratingDrafts(true);
            setSynthesisError(null); // RESET: Start fresh
            synthesisAbortRef.current = false; // Reset abort signal for new generation
            try {
                const latestDescription = flushedState?.description || memoryData?.description || '';
                const latestTimeframeScope = flushedState?.latestState?.timeframeScope || timeframeScope;
                const latestDurationQuantity = flushedState?.latestState?.durationQuantity || durationQuantity;
                const latestDurationUnit = flushedState?.latestState?.durationUnit || durationUnit;
                const latestNarratorAgeAtTime = flushedState?.latestState?.narratorAgeAtTime || narratorAgeAtTime;

                console.log("[ProductionDeck] Calling generateDraftOptions with description length:", latestDescription.length);
                const { polishedOriginalHook, visions, temporalSummary } = await generateDraftOptions(
                    latestDescription,
                    latestTimeframeScope,
                    latestDurationQuantity,
                    latestDurationUnit,
                    latestNarratorAgeAtTime,
                    memoryData?.dateComponents?.year?.toString() || 'Unknown'
                );
                console.log("[ProductionDeck] AI Synthesis successful. Visions received:", visions?.length || 0);
                
                // MANTLE GATE: Ensure we don't advance to an empty selection screen
                if (!visions || visions.length === 0) {
                    throw new Error("The Weaver returned no visions. Recalibrating...");
                }

                setPolishedOriginalHook(polishedOriginalHook);
                // Map temporalSummary to each vision for consistent display in SelectionDeck if needed
                const visionsWithSummary = visions.map(v => ({ ...v, temporalSummary }));
                
                // NEW: Add the Original Hook as a 4th option
                const originalVision = {
                    visionType: 'Original Polished',
                    visionFocus: 'Your authentic voice, preserved and polished.',
                    cleanScript: polishedOriginalHook,
                    stageDirections: [],
                    beatSheet: ['Original Dictation'],
                    preFlightBrief: {
                      sensoryAnchors: ['Your Voice'],
                      vocalInstructions: ['Speak naturally'],
                      heroMoment: 'Your authentic memory'
                    },
                    temporalSummary: temporalSummary
                };
                
                const completeDrafts = [originalVision, ...visionsWithSummary];
                setReviewDrafts(completeDrafts);
                console.log("[ProductionDeck] Setting isReviewing to true. Entering SelectionDeck...");
                setIsReviewing(true);
                setIsGeneratingDrafts(false); // SUCCESS: Close overlay
                toast.success("Visions Synthesized", {
                    description: "The Director has prepared three distinct paths for your memory."
                });

                // Persist the generated drafts and review state immediately to Firestore
                await handleUpdate({
                    productionTakes: completeDrafts,
                    isReviewing: true
                });

                // --- AUTOMATED SOUNDSTACK & BRIEF INTEGRATION ---
                (async () => {
                    for (let index = 0; index < visions.length; index++) {
                        if (synthesisAbortRef.current) {
                            console.log("[ProductionDeck] Synthesis aborted by user navigation.");
                            break;
                        }
                        const vision = visions[index];

                        // 1. Soundtrack Generation
                        const audioCue = vision.stageDirections.find((d: any) => d.type === 'audio');
                        if (audioCue && memoryData?.id) {
                            console.log(`[ProductionDeck] Triggering automated soundtrack generation for vision ${index}...`);
                            try {
                                const url = await generateSoundtrack(audioCue.content, memoryData.id, vision.visionType);
                                if (synthesisAbortRef.current) break; // Check again after await
                                if (url) {
                                    console.log(`[ProductionDeck] Soundtrack synthesized for vision ${index}:`, url);
                                    setReviewDrafts((prev: any[] | null) => prev?.map((v: any, i: number) => i === index ? { ...v, generatedSoundtrackUrl: url } : v) || null);
                                }
                            } catch (e) {
                                console.error(`[ProductionDeck] Soundtrack failure for vision ${index}:`, e);
                            }
                        }
                    }
                })();
            } catch (err: any) {
                console.error("[ProductionDeck] Synthesis failure:", err);
                setSynthesisError(err.message || "The AI Weaver encountered a transient knot. Reattempting may clear the thread.");
            }
            return;
        }

        // Wait, if we are in Review mode, do not auto-advance via the standard stage logic!
        if (isAct1 && isReviewing) {
            return;
        }

        // Original logic for other stages
        if (isAct1 && !isLowClarity && !showPreFlight) {
            setShowPreFlight(true);
            return;
        }

        if ((isActComplete || isLowClarity || showPreFlight) && currentStage < 4) {
            const next = currentStage + 1;
            if (next === 2) {
                const hasActivePass = user?.directorPassStatus === 'free_host_pass_active' || user?.directorPassStatus === 'paid_host_pass_active';
                if (!user || !hasActivePass) {
                    setUpsellFeature("recording new takes");
                    setIsUpsellOpen(true);
                    return;
                }
            }
            setStage(next);
            setShowPreFlight(false); // Reset pre-flight
            if ((memoryData?.productionStage || 0) < next) {
                handleUpdate({ productionStage: next });
            }
        }
    }, [
        currentStage, isReviewing, memoryData?.description, memoryData?.productionStage, isProductionLocked,
        selectedVision, isLowClarity, showPreFlight, isActComplete, handleUpdate,
        timeframeScope, durationQuantity, durationUnit, narratorAgeAtTime, memoryData?.dateComponents?.year,
        user, setIsUpsellOpen
    ]);

    const handleExit = useCallback(async () => {
        synthesisAbortRef.current = true;
        
        // Clean up volatile global ceremony state on exit
        setIsReviewing(false);
        setIsGeneratingDrafts(false);
        setSynthesisError(null);
        setReviewDrafts([]);

        if (formRef.current?.flush) {
            setIsSavingNext(true);
            try {
                // Pass overrides to flush so Firestore is updated synchronously with isReviewing: false
                await formRef.current.flush({ isReviewing: false });
            } catch (err) {
                console.error("Flush failed during exit", err);
            } finally {
                setIsSavingNext(false);
            }
        }
        onClose?.();
    }, [onClose, setIsReviewing, setIsGeneratingDrafts, setSynthesisError, setReviewDrafts]);

    useImperativeHandle(ref, () => ({
        handleExit
    }));

    const handlePrevAct = useCallback(async () => {
        synthesisAbortRef.current = true;
        if (currentStage > 0) {
            // COMMIT MANTLE: Flush state before retreating
            if (formRef.current?.flush) {
                setIsSavingNext(true);
                try {
                    await formRef.current.flush();
                } catch (err) {
                    console.error("Flush failed during retreat", err);
                } finally {
                    setIsSavingNext(false);
                }
            }
            setStage(currentStage - 1);
        }
    }, [currentStage]);

    const handleStageJump = async (newStage: number) => {
        synthesisAbortRef.current = true;
        if (newStage === currentStage) return;
        
        // COMMIT MANTLE: Flush state before jumping to a specific act
        if (formRef.current?.flush) {
            setIsSavingNext(true);
            try {
                await formRef.current.flush();
            } catch (err) {
                console.error("Flush failed during stage jump", err);
            } finally {
                setIsSavingNext(false);
            }
        }
        setStage(newStage);
    };

    const [isPublishing, setIsPublishing] = useState(false);
    const handlePublish = async () => {
        if (!memoryData?.id) return;
        
        // Final Handshake
        if (formRef.current?.flush) {
            setIsSavingNext(true);
            try {
                await formRef.current.flush();
            } catch (err) {
                console.error("Flush failed during publish", err);
            } finally {
                setIsSavingNext(false);
            }
        }

        setIsPublishing(true);
        try {
            // Generate reCAPTCHA token
            const token = await executeAction('publish');
            
            const res = await publishMemoryAction(memoryData.id, token || undefined);
            if (res.success) {
                toast.success("Success!", {
                    description: "Your memory is now live in the Cinema.",
                    icon: <Rocket className="w-4 h-4 text-green-500" />
                });
                handleUpdate({ status: 'published' });
                router.push('/cinema');
            } else {
                toast.error("Publish Failed", { description: res.message });
            }
        } catch (e) {
            toast.error("Error", { description: "An unexpected error occurred." });
        } finally {
            setIsPublishing(false);
        }
    };

    // Logic: Actual Width for the Grid
    const sidebarActualWidth = isRailRetracted ? 96 : Math.max(sidebarWidth, 96);

    return (
        <div className={`w-full h-full flex flex-col relative bg-[#020617] ${modality === null ? 'overflow-hidden' : ''}`}>
            {/* The PerspectiveWrapper handles the overall background color transition and the blurry interior swap */}
            <PerspectiveWrapper activeRoom={activeRoom} dominantType={dominantType}>
                <div className="flex flex-col min-h-full relative overflow-hidden" data-blueprint="StageContainer">
                    {/* Navigation stays static during blur transition mapped by PerspectiveWrapper */}
                    {modality !== null && (
                        <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 z-50 rounded-lg backdrop-blur-md bg-black/20 mb-6">

                            {/* Back Navigation */}
                            <button
                                onClick={async () => {
                                    toast.info("Securing Draft...", { duration: 1500 });
                                    await handleExit();
                                    toast.success("Draft Saved", { description: "Your progress is secure." });
                                }}
                                className="flex items-center gap-3 tracking-wide text-[var(--room-accent)] hover:brightness-125 transition-all p-2 pr-4 rounded-xl hover:bg-white/5 group"
                            >
                                <span className="text-white/80 group-hover:text-white transition-colors uppercase">&larr;</span>
                                <span className="text-sm font-headline uppercase tracking-widest">{groupTitle}</span>
                            </button>

                            {/* Room Switcher */}
                            <nav className="flex space-x-4">
                                <TooltipProvider delayDuration={200}>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                disabled={isSavingNext}
                                                onClick={async () => {
                                                  if (formRef.current?.flush) {
                                                      setIsSavingNext(true);
                                                      try { await formRef.current.flush(); } finally { setIsSavingNext(false); }
                                                  }
                                                  setActiveRoom('solo');
                                                }} 
                                                className={`px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${activeRoom === 'solo' ? 'bg-[var(--room-accent)] text-slate-900 shadow-lg scale-105' : 'hover:bg-white/10'} ${isSavingNext ? 'opacity-50 cursor-wait' : ''}`}
                                            >
                                                {isSavingNext && activeRoom !== 'solo' && <Loader2 className="w-3 h-3 animate-spin" />}
                                                Solo Stage
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={8} className="bg-slate-950 border border-[var(--room-accent)] text-[var(--room-accent)] font-medium">
                                            <p>Record directly from this device (Director Mode)</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                disabled={isSavingNext}
                                                onClick={async () => {
                                                  if (formRef.current?.flush) {
                                                      setIsSavingNext(true);
                                                      try { await formRef.current.flush(); } finally { setIsSavingNext(false); }
                                                  }
                                                  setActiveRoom('collaborative');
                                                }} 
                                                className={`px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${activeRoom === 'collaborative' ? 'bg-[var(--room-accent)] text-slate-900 shadow-lg scale-105' : 'hover:bg-white/10'} ${isSavingNext ? 'opacity-50 cursor-wait' : ''}`}
                                            >
                                                {isSavingNext && activeRoom !== 'collaborative' && <Loader2 className="w-3 h-3 animate-spin" />}
                                                Collaboration
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={8} className="bg-slate-950 border border-[var(--room-accent)] text-[var(--room-accent)] font-medium">
                                            <p>Connect a mobile prompter/camera for co-creation</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                disabled={isSavingNext}
                                                onClick={async () => {
                                                  if (formRef.current?.flush) {
                                                      setIsSavingNext(true);
                                                      try { await formRef.current.flush(); } finally { setIsSavingNext(false); }
                                                  }
                                                  setActiveRoom('guest');
                                                }} 
                                                className={`px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${activeRoom === 'guest' ? 'bg-[var(--room-accent)] text-slate-900 shadow-lg scale-105' : 'hover:bg-white/10'} ${isSavingNext ? 'opacity-50 cursor-wait' : ''}`}
                                            >
                                                {isSavingNext && activeRoom !== 'guest' && <Loader2 className="w-3 h-3 animate-spin" />}
                                                Guest Director
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={8} className="bg-slate-950 border border-[var(--room-accent)] text-[var(--room-accent)] font-medium">
                                            <p>Invite a professional to control your camera remotely</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <div className="h-6 w-px bg-white/10 mx-2" />

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={onToggleLayout}
                                                className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                                            >
                                                {layoutMode === 'takeover' ? <Monitor className="w-5 h-5 text-[var(--room-accent)]" /> : <Maximize className="w-5 h-5 text-[var(--room-accent)]" />}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={8} className="bg-slate-950 border border-[var(--room-accent)] text-[var(--room-accent)] font-medium">
                                            <p>Switch to {layoutMode === 'takeover' ? 'Side Drawer' : 'Full-Screen'} Layout</p>
                                        </TooltipContent>
                                    </Tooltip>

                                </TooltipProvider>
                            </nav>
                        </div>
                    )}
                    <div
                        className={cn(
                            "flex-1 grid relative overflow-hidden h-full",
                            !isDragging && "transition-[grid-template-columns] duration-500 ease-in-out"
                        )}
                        style={{
                            gridTemplateColumns: `${sidebarActualWidth}px 6px 1fr`,
                            cursor: isDragging ? 'col-resize' : 'default'
                        }}
                    >
                        {/* THE PRODUCTION RAIL: THE SIDEBAR SPINE */}
                        <ProductionRail
                            data-blueprint="ProductionRail"
                            currentStage={currentStage}
                            onStageChange={handleStageJump}
                            isRetracted={isRailRetracted}
                            onToggleRetract={() => {
                                const newState = !isRailRetracted;
                                setIsRailRetracted(newState);
                                // If unretracting and width is too small, jump to a healthy default
                                if (!newState && sidebarWidth < 220) {
                                    setSidebarWidth(320);
                                }
                            }}
                            modality={modality}
                            customWidth={sidebarActualWidth}
                            wordCount={wordCount}
                            mentorActive={mentorModeActive}
                            onToggleMentor={toggleMentor}
                        />

                        {/* DIRECTOR'S DRAG: THE RESIZABLE DIVIDER */}
                        {modality !== null && (
                            <ResizableDivider
                                onDragStart={handleDragStart}
                                onDoubleClick={handleSnapGoldenRatio}
                                isDragging={isDragging}
                                isSnapActive={isSnapActive}
                            />
                        )}

                        {/* THE STAGE: CONTENT AREA WITH BLACK OUT GUARD */}
                         <div className={cn(
                             "relative flex-1 min-h-[calc(100vh-80px)] overflow-y-auto flex flex-col transition-all duration-1000 ease-in-out bg-gradient-to-b from-slate-900 via-[#030303] to-black",
                             modality === null && (hoveredInstrument ? "blur-md brightness-50" : "blur-xl brightness-50 pointer-events-none")
                         )} data-blueprint="StageArea">
                             {currentStage === 2 && !lobbyConfirmed && !hasUnsavedTake ? (
                                 <StudioLobby
                                     onConfirm={(mode) => {
                                         setLobbyConfirmed(true);
                                         setActiveRoom(mode);
                                     }}
                                 />
                             ) : (
                                 renderRoom()
                             )}

                            {/* HUD Watermark Label - Relocated to Bottom Left */}
                            {modality !== null && (
                                <div className="absolute bottom-6 left-6 select-none z-10 group cursor-help">
                                    <div className="flex items-center gap-3 border-l border-white/10 pl-4 py-1 transition-all duration-500 group-hover:border-[var(--room-accent)] group-hover:pl-6 bg-black/0 group-hover:bg-black/20 rounded-r-lg">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--room-accent)] animate-pulse shadow-[0_0_8px_var(--room-accent)] group-hover:scale-125 transition-transform" />
                                        <span className="font-mono text-[10px] tracking-[0.4em] text-white/20 group-hover:text-white/80 uppercase whitespace-nowrap transition-colors">
                                            Studio // Deck // MOD-10
                                        </span>
                                    </div>
                                </div>
                            )}

                             {/* PRODUCTION CONTROL BAR: THE HEARTBEAT */}
                             {modality !== null && currentStage >= 0 && (
                                 <div className={cn("transition-all duration-500", isDirectorOpen && "opacity-20 blur-sm pointer-events-none")}>
                                     <ProductionControlBar
                                         currentStage={currentStage}
                                         isComplete={isActComplete}
                                         isLowClarity={isLowClarity}
                                         missingRequirements={missingRequirements}
                                         onNext={handleNextAct}
                                         onPrev={handlePrevAct}
                                         onPublish={handlePublish}
                                         charge={currentStage === 0 ? hotClarity : totalCharge}
                                         wordCount={wordCount}
                                         isDocked={currentStage <= 1}
                                         mentorActive={mentorModeActive}
                                         isSaving={isSavingNext}
                                         isProductionLocked={!!isProductionLocked}
                                     />
                                 </div>
                             )}
                        </div>
                    </div>

                 </div>
            </PerspectiveWrapper>

            {/* Global Overlays */}
            <StudioBlueprint />
            <ProductionPreFlight
                isOpen={showPreFlight}
                onClose={() => setShowPreFlight(false)}
                onConfirm={handleNextAct}
                charge={totalCharge}
                anchors={anchors}
                dominantType={dominantType}
                storyData={{
                    title: memoryData?.title || '',
                    hook: memoryData?.description || ''
                }}
            />

            {/* STUDIO MENTOR OVERLAY (LIFELINE) */}
            <MentorGuide 
                active={isOverlayOpen}
                onClose={closeOverlay}
                whisper={getWhisper(currentStage)}
                onApplySeed={(seed) => {
                    handleUpdate((prev: any) => ({ ...prev, description: (prev.description || '') + (prev.description ? '\n\n' : '') + seed }));
                    closeOverlay();
                    toast.success("Inspiration Seed Sown", {
                        description: "The Mentor has added a sensory anchor to your hook."
                    });
                }}
            />

            {/* MODALITY SELECTION: STUDIO ENTRANCE */}
            <AnimatePresence>
                {modality === null && !searchParams.get('modality') && (
                    <InstrumentSelection
                        onSelect={(selectedModality) => {
                            setModality(selectedModality);
                            handleUpdate({ modality: selectedModality });
                        }}
                        onHoverChange={setHoveredInstrument}
                    />
                )}
            </AnimatePresence>

            {/* DIRECTOR'S BRIEFING ONBOARDING */}
            <OnboardingOverlay 
                isOpen={showOnboarding}
                onClose={handleOnboardingClose}
            />

            <DirectorialUpsellDialog 
                isOpen={isUpsellOpen}
                onClose={() => setIsUpsellOpen(false)}
                requiredFeature={upsellFeature}
            />
        </div>
    );
});

ProductionDeck.displayName = 'ProductionDeck';

export default ProductionDeck;
