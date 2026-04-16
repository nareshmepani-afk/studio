'use client';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockPromptGroups } from '@/lib/mockData';
import { Maximize, Monitor } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PerspectiveWrapper from './PerspectiveWrapper';
import SoloStage from './SoloStage';
import CollaborativeStage from './CollaborativeStage';

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
    const router = useRouter();
    const groupId = searchParams.get('groupId');

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

    const renderRoom = () => {
        switch (activeRoom) {
            case 'solo':
                return <SoloStage data={memoryData} update={handleUpdate} />;
            case 'collaborative':
                return <CollaborativeStage data={memoryData} update={handleUpdate} />;
            case 'guest':
                return <CollaborativeStage data={memoryData} update={handleUpdate} mode="guest" />;
            default:
                return <div>Select a production mode to begin.</div>;
        }
    };

    return (
        <div className="w-full min-h-[calc(100vh-64px)] flex flex-col">
            {/* The PerspectiveWrapper handles the overall background color transition and the blurry interior swap */}
            <PerspectiveWrapper activeRoom={activeRoom}>
                <div className="flex flex-col h-full relative">
                    {/* Navigation stays static during blur transition mapped by PerspectiveWrapper */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 z-50 rounded-lg backdrop-blur-md bg-black/20 mb-6">
                        
                        {/* Back Navigation */}
                        <button 
                          onClick={() => router.push('/studio')}
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
                    <div className="flex-1 overflow-y-auto relative">
                        {renderRoom()}
                        
                        {/* HUD Watermark Label - Relocated to Bottom Left */}
                        <div className="absolute bottom-6 left-6 select-none z-10 group cursor-help">
                            <div className="flex items-center gap-3 border-l border-white/10 pl-4 py-1 transition-all duration-500 group-hover:border-[var(--room-accent)] group-hover:pl-6 bg-black/0 group-hover:bg-black/20 rounded-r-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--room-accent)] animate-pulse shadow-[0_0_8px_var(--room-accent)] group-hover:scale-125 transition-transform" />
                                <span className="font-mono text-[10px] tracking-[0.4em] text-white/20 group-hover:text-white/80 uppercase whitespace-nowrap transition-colors">
                                    Studio // Deck // MOD-10
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </PerspectiveWrapper>
        </div>
    );
};

export default ProductionDeck;
