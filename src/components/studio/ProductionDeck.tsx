'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { useStudioState } from '@/hooks/useStudioState';

const DEFAULT_SIDEBAR_WIDTH = 280;
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
    const { currentStage, setStage, modality, setModality } = useStudioState(memoryData?.prose || '');

    const [sidebarWidth, setSidebarWidth] = useState(320); // Default width
    const [isDragging, setIsDragging] = useState(false);
    const [isSnapActive, setIsSnapActive] = useState(false);
    const SNAP_THRESHOLD = 20;

    // Interaction State
    const [hoveredInstrument, setHoveredInstrument] = useState<string | null>(null);
    const [wordCount, setWordCount] = useState(0);

    // Act Completion Logic
    const isActComplete = useMemo(() => {
        const stage = memoryData?.productionStage || 0;

        switch (stage) {
            case 0: // Act I: Hook
                return !!(memoryData?.title?.trim() && memoryData?.description?.trim());
            case 1: // Act II: Weave
                return wordCount >= 120;
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
            // setSidebarWidth(80); // REMOVED: This was causing a conflict with the toggle/drag logic
        } else if (currentStage === 1) {
            setIsRailRetracted(false);
        }
    }, [currentStage, modality]);

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
        switch (activeRoom) {
            case 'solo':
                return (
                    <SoloStage
                        data={memoryData}
                        update={handleUpdate}
                        modality={modality}
                        setModality={setModality}
                        onWordCountChange={setWordCount}
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
        if (isActComplete && currentStage < 4) {
            const next = currentStage + 1;
            setStage(next);
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
            const res = await publishMemoryAction(memoryData.id);
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

    const sidebarActualWidth = isRailRetracted ? 80 : sidebarWidth;

    return (
        <div className={`w-full h-full flex flex-col relative bg-[#020617] ${modality === null ? 'overflow-hidden' : ''}`}>
            {/* The PerspectiveWrapper handles the overall background color transition and the blurry interior swap */}
            <PerspectiveWrapper activeRoom={activeRoom}>
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
                                <span className="text-xl leading-none group-hover:-translate-x-1 transition-transform">&larr;</span>
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
                        className="flex-1 grid relative overflow-hidden h-full"
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
                            onToggleRetract={() => setIsRailRetracted(!isRailRetracted)}
                            modality={modality}
                            customWidth={sidebarWidth}
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
                            "relative flex-1 min-h-[calc(100vh-80px)] transition-all duration-1000 ease-in-out bg-gradient-to-b from-slate-900 via-[#030303] to-black",
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
                                    onCatalystDrop={(type) => {
                                        // Internal handle in MemoryForm will be needed
                                        console.log(`Catalyst Dropped: ${type}`);
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* PRODUCTION CONTROL BAR: THE HEARTBEAT */}
                    {modality !== null && (
                        <ProductionControlBar
                            currentStage={currentStage}
                            isComplete={isActComplete}
                            onNext={handleNextAct}
                            onPrev={handlePrevAct}
                            onPublish={handlePublish}
                        />
                    )}
                </div>
            </PerspectiveWrapper>

            {/* MODALITY SELECTION: STUDIO ENTRANCE */}
            <AnimatePresence>
                {modality === null && (
                    <InstrumentSelection
                        onSelect={setModality}
                        onHoverChange={setHoveredInstrument}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductionDeck;
