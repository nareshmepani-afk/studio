'use client';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Maximize, Monitor, Rocket, Edit3 } from 'lucide-react';
import { publishMemoryAction, unpublishMemoryAction } from '@/actions/memoryActions';
import { mockPromptGroups } from '@/lib/mockData';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import PerspectiveWrapper from './PerspectiveWrapper';
import SoloStage from './SoloStage';
import CollaborativeStage from './CollaborativeStage';
import { InstrumentSelection } from './InstrumentSelection';
import { ProductionRail, PRODUCTION_ACTS } from './ProductionRail';
import { cn } from '@/lib/utils';
import { ResizableDivider } from './ResizableDivider';
import { ProductionControlBar } from './ProductionControlBar';
import { SensoryCatalystHUD } from './SensoryCatalystHUD';
import { ThresholdGuard } from './overlays/ThresholdGuard';
import { ProductionPreFlight } from './overlays/ProductionPreFlight';
import { useStudioState } from '@/hooks/useStudioState';
import { useProductionCharge } from '@/hooks/studio/useProductionCharge';
import { detectAnchors } from '@/hooks/studio/useDirectorInk';

const DEFAULT_SIDEBAR_WIDTH = 280;
import { useMentorLifeline } from '@/hooks/studio/useMentorLifeline';
import { MentorshipOverlay } from './MentorshipOverlay';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { firebaseConfig } from '@/lib/config-schema';
import { OnboardingOverlay } from './overlays/OnboardingOverlay';
const SNAP_THRESHOLD = 20; // Magnetic snap range

// Define a placeholder for the memory data type
type MemoryData = any;

interface ProductionDeckProps {
    memoryData: MemoryData;
    onUpdate: (updatedData: MemoryData) => void;
    layoutMode: 'takeover' | 'drawer';
    onToggleLayout: () => void;
}

const ProductionDeck = ({
    memoryData,
    onUpdate,
    layoutMode,
    onToggleLayout
}: ProductionDeckProps) => {
    const searchParams = useSearchParams();
    const urlMode = searchParams.get('mode');
    const [activeRoom, setActiveRoom] = useState<'solo' | 'collaborative' | 'guest'>(
        urlMode === 'guest' ? 'guest' :
            urlMode === 'collaborative' ? 'collaborative' : 'solo'
    );
    const [isRailRetracted, setIsRailRetracted] = useState(false);

    // NEW: URL-based Source of Truth for the active act and modality
    const { currentStage, setStage, modality, setModality, isDirectorOpen } = useStudioState(memoryData?.prose || '');

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

    // MOD-15: Mentorship Lifeline
    const { 
        mentorModeActive, 
        isOverlayOpen, 
        isManualMentor,
        toggleMentor, 
        triggerWhisper,
        closeOverlay, 
        getWhisper 
    } = useMentorLifeline();
    
    // reCAPTCHA Hook
    const { executeAction } = useRecaptcha(firebaseConfig.recaptchaSiteKey);

    // Clarity Logic for Act I
    const { totalCharge, dominantType } = useProductionCharge({
        text: memoryData?.description || '',
        anchors: detectAnchors(memoryData?.description || '')
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
                return wordCount >= 150;
            case 2: // Act III: Capture
                return !!memoryData?.videoUrl;
            case 3: // Act IV: Cut
                return true; // Usually manual review
            case 4: // Act V: Premiere
                return true;
            default:
                return false;
        }
    }, [currentStage, memoryData?.title, memoryData?.description, memoryData?.videoUrl, wordCount]);

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
            if (!mentorModeActive && currentStage === 0) {
                toggleMentor(false); // Auto-trigger, not manual
                console.log("[Studio] User idle detected (90s). Engaging Mentor Lifeline.");
            }
        }, 90000); // 90 seconds
    }, [mentorModeActive, currentStage, toggleMentor]);

    // AUTO-ACTIVATION: Studio Mentor Idle Protocol
    useEffect(() => {
        // Only trigger in Act I if not already active
        if (currentStage !== 0 || mentorModeActive) return;

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
    }, [currentStage, mentorModeActive, resetIdleTimer]);

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
    }, [modality, memoryData?.id, memoryData?.description, currentStage, mentorModeActive, currentGroup, searchParams]);

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

    const handleUpdate = (updatedData: MemoryData) => {
        onUpdate(updatedData);
    };

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
                        data={memoryData}
                        update={handleUpdate}
                        modality={modality}
                        setModality={setModality}
                        onWordCountChange={setWordCount}
                        currentStage={currentStage}
                        mentorActive={mentorModeActive}
                        onToggleMentor={toggleMentor}
                        onClarityChange={(c: any) => console.log("Clarity:", c)}
                        onNext={handleNextAct}
                        onPrev={handlePrevAct}
                        isComplete={isActComplete}
                        charge={currentStage === 0 ? hotClarity : totalCharge}
                        wordCount={wordCount}
                        highlightClarity={highlightClarity}
                        onboardingJustClosed={onboardingJustClosed}
                        isUntouched={isUntouched}
                        onActivity={resetIdleTimer}
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

    const handleNextAct = () => {
        const isAct1 = currentStage === 0;
        const clarity = isAct1 ? hotClarity : totalCharge;
        const isLowClarity = isAct1 && clarity < 40;

        // NEW: Intercept Act 1 transition for the Pre-Flight Diagnostic
        if (isAct1 && !isLowClarity && !showPreFlight) {
            setShowPreFlight(true);
            return;
        }

        // Note: ProductionControlBar handles the UI/Toast for the low clarity state,
        // which prevents us from firing onNext if the gate is closed.
        // We ensure that we only proceed if complete OR if we have clarity (or override).
        if ((isActComplete || isLowClarity || showPreFlight) && currentStage < 4) {
            const next = currentStage + 1;
            setStage(next);
            setShowPreFlight(false); // Reset pre-flight
            // Sync highest reached stage to backend for persistence
            if ((memoryData?.productionStage || 0) < next) {
                handleUpdate({ ...memoryData, productionStage: next });
            }
        }
    };

    const handlePrevAct = () => {
        if (currentStage > 0) {
            setStage(currentStage - 1);
        }
    };

    const [isPublishing, setIsPublishing] = useState(false);
    const handlePublish = async () => {
        if (!memoryData?.id) return;
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
                handleUpdate({ ...memoryData, status: 'published' });
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
                <div className="flex flex-col min-h-full relative overflow-hidden">
                    {/* Navigation stays static during blur transition mapped by PerspectiveWrapper */}
                    {modality !== null && (
                        <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 z-50 rounded-lg backdrop-blur-md bg-black/20 mb-6">

                            {/* Back Navigation */}
                            <button
                                onClick={() => {
                                    toast.success("Draft Saved", { description: "Your progress is secure." });
                                    router.push('/studio');
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
                                            <button onClick={() => setActiveRoom('solo')} className={`px-5 py-2 rounded-full font-medium transition-all ${activeRoom === 'solo' ? 'bg-[var(--room-accent)] text-slate-900 shadow-lg scale-105' : 'hover:bg-white/10'}`}>Solo Stage</button>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={8} className="bg-slate-950 border border-[var(--room-accent)] text-[var(--room-accent)] font-medium">
                                            <p>Record directly from this device (Director Mode)</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button onClick={() => setActiveRoom('collaborative')} className={`px-5 py-2 rounded-full font-medium transition-all ${activeRoom === 'collaborative' ? 'bg-[var(--room-accent)] text-slate-900 shadow-lg scale-105' : 'hover:bg-white/10'}`}>Collaboration</button>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={8} className="bg-slate-950 border border-[var(--room-accent)] text-[var(--room-accent)] font-medium">
                                            <p>Connect a mobile prompter/camera for co-creation</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button onClick={() => setActiveRoom('guest')} className={`px-5 py-2 rounded-full font-medium transition-all ${activeRoom === 'guest' ? 'bg-[var(--room-accent)] text-slate-900 shadow-lg scale-105' : 'hover:bg-white/10'}`}>Guest Director</button>
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
                            currentStage={currentStage}
                            onStageChange={setStage}
                            isRetracted={isRailRetracted}
                            onToggleRetract={() => {
                                const newState = !isRailRetracted;
                                console.log(`[ProductionDeck] Toggling retraction. New state will be: ${newState}`);
                                setIsRailRetracted(newState);
                                // If unretracting and width is too small, jump to a healthy default
                                if (!newState && sidebarWidth < 160) {
                                    setSidebarWidth(320);
                                }
                            }}
                            modality={modality}
                            customWidth={sidebarActualWidth}
                            wordCount={wordCount}
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
                         )}>
                             {renderRoom()}

                            {/* Tech Scout Threshold Guard */}
                            <AnimatePresence>
                                {modality !== null && currentStage > 1 && wordCount < 150 && (
                                    <ThresholdGuard
                                        currentCount={wordCount}
                                        threshold={150}
                                        actTitle={PRODUCTION_ACTS[currentStage].title}
                                    />
                                )}
                            </AnimatePresence>

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

                            {/* SENSORY CATALYST HUD: FIXED DOCK */}
                            {modality !== null && (
                                <SensoryCatalystHUD
                                    wordCount={wordCount}
                                    isDirectorOpen={isDirectorOpen}
                                    mentorActive={mentorModeActive}
                                    currentStage={currentStage}
                                    onCatalystDrop={(type) => {
                                        // Internal handle in MemoryForm will be needed
                                        console.log(`Catalyst Dropped: ${type}`);
                                    }}
                                />
                            )}
                             {/* PRODUCTION CONTROL BAR: THE HEARTBEAT */}
                             {modality !== null && currentStage >= 2 && (
                                 <ProductionControlBar
                                     currentStage={currentStage}
                                     isComplete={isActComplete}
                                     onNext={handleNextAct}
                                     onPrev={handlePrevAct}
                                     onPublish={handlePublish}
                                     charge={currentStage === 0 ? hotClarity : totalCharge}
                                     wordCount={wordCount}
                                     isDocked={currentStage < 2}
                                 />
                             )}
                        </div>
                    </div>

                 </div>
            </PerspectiveWrapper>

            {/* PRODUCTION PRE-FLIGHT OVERLAY */}
            <ProductionPreFlight
                isOpen={showPreFlight}
                onClose={() => setShowPreFlight(false)}
                onConfirm={handleNextAct}
                charge={totalCharge}
                anchors={detectAnchors(memoryData?.description || '')}
                dominantType={dominantType}
                storyData={{
                    title: memoryData?.title || '',
                    hook: memoryData?.description || ''
                }}
            />

            {/* STUDIO MENTOR OVERLAY (LIFELINE) */}
            <MentorshipOverlay 
                active={isOverlayOpen}
                onClose={closeOverlay}
                whisper={getWhisper(currentStage)}
                onApplySeed={(seed) => {
                    handleUpdate({ ...memoryData, description: (memoryData.description || '') + (memoryData.description ? '\n\n' : '') + seed });
                    closeOverlay();
                    toast.success("Inspiration Seed Sown", {
                        description: "The Mentor has added a sensory anchor to your hook."
                    });
                }}
            />

            {/* MODALITY SELECTION: STUDIO ENTRANCE */}
            <AnimatePresence>
                {modality === null && (
                    <InstrumentSelection
                        onSelect={setModality}
                        onHoverChange={setHoveredInstrument}
                    />
                )}
            </AnimatePresence>

            {/* DIRECTOR'S BRIEFING ONBOARDING */}
            <OnboardingOverlay 
                isOpen={showOnboarding}
                onClose={handleOnboardingClose}
            />
        </div>
    );
};

export default ProductionDeck;
