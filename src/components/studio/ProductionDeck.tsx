'use client';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

// Define a placeholder for the memory data type
type MemoryData = any;

interface ProductionDeckProps {
    memoryData: MemoryData;
    onUpdate: (updatedData: MemoryData) => void;
}

const ProductionDeck = ({ memoryData, onUpdate }: ProductionDeckProps) => {
    const [activeRoom, setActiveRoom] = useState<'solo' | 'collaborative'>('solo');
    const router = useRouter();
    const searchParams = useSearchParams();
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
            default:
                return <div>Select a production mode to begin.</div>;
        }
    };

    return (
        <div className="w-full min-h-[calc(100vh-64px)] flex flex-col">
            {/* The PerspectiveWrapper handles the overall background color transition and the blurry interior swap */}
            <PerspectiveWrapper activeRoom={activeRoom}>
                <div className="flex flex-col h-full">
                    {/* Navigation stays static during blur transition mapped by PerspectiveWrapper */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 z-50 rounded-lg backdrop-blur-md bg-black/20 mb-6">
                        
                        {/* Back Navigation */}
                        <button 
                          onClick={() => router.push('/prompts')}
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

                        </TooltipProvider>
                    </nav>
                </div>
                    <div className="flex-1 overflow-y-auto">
                        {renderRoom()}
                    </div>
                </div>
            </PerspectiveWrapper>
        </div>
    );
};

export default ProductionDeck;
