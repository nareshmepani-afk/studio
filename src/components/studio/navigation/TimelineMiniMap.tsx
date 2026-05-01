"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { ScriptBlock } from '@/types';
import { SuggestedAnchor } from './SuggestedAnchor';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { CatalystLink } from '../overlays/CatalystLink';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface CatalystSuggestion {
  blockId: string;
  type: 'aroma' | 'soundscape' | 'visual' | 'polish';
  value: string;
  reasoning: string;
}

interface TimelineMiniMapProps {
  blocks: ScriptBlock[];
  suggestions: CatalystSuggestion[];
}

export const TimelineMiniMap = ({ blocks, suggestions }: TimelineMiniMapProps) => {
  const { isDrafting, overloadedBlockIds } = useStudioState();
  const pulseIntensity = isDrafting ? 0.2 : 0.8;

  const scrollToBlock = (blockId: string) => {
    const el = document.getElementById(`block-${blockId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="relative flex flex-col gap-6 py-4 w-full">
      {/* The Central Line */}
      <div className="absolute left-[39px] top-6 bottom-6 w-px bg-slate-800" />

      {blocks.map((block) => {
        const blockSuggestions = suggestions.filter(s => s.blockId === block.id);
        const isOverloaded = overloadedBlockIds?.includes(block.id);
        
        return (
          <div key={block.id} className="relative flex items-start gap-4 group">
            {/* The Timeline Node / Container */}
            <div className="relative flex-shrink-0 w-16 flex justify-center items-center py-2 z-10">
              <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-500",
                isOverloaded 
                  ? "bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse scale-125" 
                  : "bg-slate-700 group-hover:bg-slate-400"
              )} />
            </div>

            {/* The Content */}
            <div 
              className="flex-1 flex flex-col gap-3 cursor-pointer p-3 rounded-xl transition-all border border-transparent hover:border-white/5 hover:bg-white/[0.02]"
              onClick={() => scrollToBlock(block.id)}
            >
              {/* Truncated Text Excerpt */}
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed line-clamp-2 italic">
                {block.text || "Empty beat..."}
              </p>

              {/* Catalysts & Suggestions */}
              <div className="flex flex-col gap-3">
                {/* Existing Catalysts (Heat Map) */}
                {block.catalysts.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {block.catalysts.map((cat, i) => {
                      const colorClass = cat.type === 'soundscape' ? 'bg-sky-500' : cat.type === 'visual' ? 'bg-emerald-500' : cat.type === 'polish' ? 'bg-fuchsia-500' : 'bg-amber-500';
                      // "Heat Map" scale based on value length. Baseline scale is 1. Maximum is 1.5.
                      const scale = cat.value ? Math.min(1 + (cat.value.length / 100), 1.5) : 1;
                      return (
                        <div 
                          key={`existing-${cat.id || i}`} 
                          className={`rounded-full ${colorClass} shadow-sm transition-all`}
                          style={{
                            width: `${6 * scale}px`,
                            height: `${6 * scale}px`,
                            boxShadow: `0 0 ${10 * scale}px ${colorClass.replace('bg-', 'rgba(').replace('-500', ', 0.5)')}`
                          }}
                          title={`${cat.type.toUpperCase()}: ${cat.value}`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* AI Suggestions (The Pulse) */}
                {blockSuggestions.length > 0 && (
                  <div className="flex flex-col gap-2 w-full mt-2">
                    {blockSuggestions.map((suggestion, i) => (
                      <div 
                        key={`sug-${suggestion.type}-${i}`} 
                        className="flex items-start gap-3 bg-slate-900/40 p-3 rounded-lg border border-white/5"
                        onClick={(e) => e.stopPropagation()} // Prevent block scroll when interacting with the suggestion
                      >
                        <div className="pt-1">
                          <SuggestedAnchor type={suggestion.type} intensity={pulseIntensity} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CatalystLink 
                            blockId={suggestion.blockId}
                            type={suggestion.type}
                            value={suggestion.value}
                            reasoning={suggestion.reasoning}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
