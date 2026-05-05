"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useStoryScript } from '@/hooks/studio/useStoryScript';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { useAudioFeedback } from '@/hooks/studio/useAudioFeedback';
import { useDirectorInk, detectAnchors } from '@/hooks/studio/useDirectorInk';
import { SentenceWrapper } from './SentenceWrapper';
import { ScriptBlock, Memory } from '@/types';
import { LayoutGroup } from 'framer-motion';

import { useProductionCharge, SensoryType } from '@/hooks/studio/useProductionCharge';
import { AIPolishButton } from './AIPolishButton';
import { motion } from 'framer-motion';

const ClarityWaveform = ({ charge, color }: { charge: number, color: string }) => {
  const points = 12;
  const step = 100 / points;
  
  return (
    <svg viewBox="0 0 100 20" className="w-12 h-3 overflow-visible">
      <motion.path
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          d: [
            `M 0 10 ${Array.from({ length: points }).map((_, i) => 
              `Q ${i * step + step/2} ${10 + (Math.sin(i * 1.5) * 8) * (charge/100)} ${(i + 1) * step} 10`
            ).join(' ')}`,
            `M 0 10 ${Array.from({ length: points }).map((_, i) => 
              `Q ${i * step + step/2} ${10 + (Math.cos(i * 1.5) * 8) * (charge/100)} ${(i + 1) * step} 10`
            ).join(' ')}`,
            `M 0 10 ${Array.from({ length: points }).map((_, i) => 
              `Q ${i * step + step/2} ${10 + (Math.sin(i * 1.5) * 8) * (charge/100)} ${(i + 1) * step} 10`
            ).join(' ')}`
          ]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </svg>
  );
};

interface ScriptoriumProps {
  data: Partial<Memory>;
  onSync: (blocks: ScriptBlock[]) => void;
  onPolish?: (blockId: string) => void;
  onWordCountChange?: (count: number) => void;
}

export const Scriptorium = ({ data, onSync, onPolish, onWordCountChange }: ScriptoriumProps) => {
  const { actions, detectedAnchors } = useStudioState();

  // 1. THE MIGRATION SCRIPT
  const initialBlocks = useMemo<ScriptBlock[]>(() => {
    // If we already have blocks, use them.
    if (data.scriptBlocks && data.scriptBlocks.length > 0) {
      return data.scriptBlocks;
    }

    // If we only have legacy prose, migrate it.
    if (data.prose) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.prose, 'text/html');
      const paragraphs = Array.from(doc.querySelectorAll('p'));

      if (paragraphs.length > 0) {
        return paragraphs.map((p, index) => ({
          id: uuidv4(),
          type: index === 0 ? 'hook' : 'beat',
          text: p.innerHTML, // Preserves <strong>/<em> tags
          catalysts: [],
        }));
      }
    }

    // Fallback: Start a fresh session
    return [{ id: uuidv4(), type: 'hook', text: '', catalysts: [] }];
  }, [data.scriptBlocks, data.prose]);

  // 2. INITIALIZE THE ENGINE
  const {
    blocks,
    focusedBlockId,
    setFocusedBlockId,
    updateBlockText,
    addCatalyst,
    splitBlock,
    mergeWithPrevious,
    reorderBlocks,
  } = useStoryScript(initialBlocks);
  
  const { playSnap } = useAudioFeedback();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSurging, setIsSurging] = useState(false);
  const prevAnchorsCountRef = useRef<number>(0);

  // 2.5 NARRATIVE BATTERY LOGIC
  const focusedBlock = useMemo(() => 
    blocks.find(b => b.id === focusedBlockId) || blocks[0], 
  [blocks, focusedBlockId]);

  const { totalCharge, isReady, dominantType } = useProductionCharge({
    text: focusedBlock?.text || '',
    anchors: detectAnchors(focusedBlock?.text || '')
  });

  const auraStyles = {
    aroma: { 
      text: 'text-amber-400', 
      border: 'border-amber-500/30', 
      bg: 'bg-amber-500/5',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
      color: '#fbbf24'
    },
    soundscape: { 
      text: 'text-sky-400', 
      border: 'border-sky-500/30', 
      bg: 'bg-sky-500/5',
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.15)]',
      color: '#38bdf8'
    },
    visual: { 
      text: 'text-emerald-400', 
      border: 'border-emerald-500/30', 
      bg: 'bg-emerald-500/5',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      color: '#10b981'
    },
    none: { 
      text: 'text-white/20', 
      border: 'border-white/5', 
      bg: 'bg-white/[0.02]',
      glow: '',
      color: 'rgba(255,255,255,0.2)'
    }
  }[dominantType || 'none'];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderBlocks(active.id as string, over.id as string);
      playSnap();
    }
  };

  const lastSyncedBlocksRef = useRef<string>('');
  const lastSyncedWordCountRef = useRef<number>(-1);

  // 3. AUTO-SYNC TO DATABASE & AGGREGATE ANCHORS
  useEffect(() => {
    const blocksJSON = JSON.stringify(blocks);
    
    // Aggressive Guard: Only sync if blocks actually changed
    if (blocksJSON !== lastSyncedBlocksRef.current) {
      onSync(blocks);
      lastSyncedBlocksRef.current = blocksJSON;
    }
    
    // Aggregate anchors across all blocks
    const allText = blocks.map(b => b.text).join(' ');
    const uniqueAnchors = detectAnchors(allText);
    const activeTypes = Array.from(new Set(uniqueAnchors.map(a => a.type)));
    
    // Diagnostic: Identify Overloaded Beats
    const overloadedIds = blocks
      .filter(b => detectAnchors(b.text).length >= 4)
      .map(b => b.id);
    
    // Only update if changed to avoid unnecessary re-renders
    actions.setDetectedAnchors(uniqueAnchors);
    actions.setOverloadedBlocks(overloadedIds);
    actions.setActiveAnchorTypes(activeTypes);

    // DIRECTORIAL GUIDE LOGIC
    const totalWords = allText.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // Word Count Guard: Only notify parent if count actually changed
    if (totalWords !== lastSyncedWordCountRef.current) {
      onWordCountChange?.(totalWords);
      lastSyncedWordCountRef.current = totalWords;
    }

    let note: string | null = null;

    if (totalWords < 20) {
      note = "Begin by drafting your Story Hook. The Director's Ink will highlight sensory opportunities as you write.";
    } else if (activeTypes.length === 0) {
      note = "Try adding sensory details like 'scent', 'sound', or 'color' to anchor your narrative in physical space.";
    } else if (blocks.every(b => b.catalysts.length === 0)) {
      const firstType = activeTypes[0];
      const typeLabel = firstType === 'aroma' ? 'Wind' : firstType === 'soundscape' ? 'Music' : 'Layers';
      note = `I've detected a ${firstType} anchor. Drag the ${typeLabel} catalyst from the right rack to lock it in.`;
    } else if (totalWords < 50) {
      note = `Your narrative density is increasing. You're ${Math.max(0, 50 - totalWords)} words away from unlocking AI Polish.`;
    } else {
      note = "The Scribe is prepared. Use the Apply AI Polish tool to refine the scene's emotional clarity.";
    }

    actions.setDirectorialNote(note);
    
    // Sync applied catalysts for focused block
    if (focusedBlock) {
      actions.setAppliedCatalysts(focusedBlock.catalysts.map(c => c.type));
    } else {
      actions.setAppliedCatalysts([]);
    }
    
  }, [blocks, onSync, actions, onWordCountChange, focusedBlock]);

  // Bridge the latest addCatalyst logic to the stable dispatcher registration
  const addCatalystRef = useRef(addCatalyst);
  useEffect(() => {
    addCatalystRef.current = addCatalyst;
  }, [addCatalyst]);

  // 4. THE DISPATCHER MOUNT
  useEffect(() => {
    const dispatcher = actions.setDispatcher;
    if (!dispatcher) return;

    dispatcher({ 
      addCatalyst: (blockId, type, value) => addCatalystRef.current(blockId, type, value) 
    });

    return () => {
      dispatcher(undefined);
    };
  }, [actions.setDispatcher]);

  const activeBlock = useMemo(
    () => blocks.find((b) => b.id === activeId),
    [blocks, activeId]
  );

  return (
    <section className="relative max-w-4xl mx-auto mt-12 pb-32">
      <LayoutGroup>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {blocks.map((block) => (
                <SentenceWrapper
                  key={block.id}
                  block={block}
                  isActive={activeId === block.id}
                  onFocus={() => setActiveId(block.id)}
                  onBlur={() => setActiveId(null)}
                  onUpdate={(text: string) => updateBlockText(block.id, text)}
                  actions={actions}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeBlock ? (
              <div className="opacity-100 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-slate-950/80 rounded-lg backdrop-blur-md">
                <SentenceWrapper
                  block={activeBlock}
                  isActive={true}
                  onFocus={() => {}}
                  onBlur={() => {}}
                  onUpdate={() => {}}
                  actions={actions}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </LayoutGroup>

      {/* ACT II INSTRUMENTS: AI Polish & Catalysts */}
      <div className="mt-12 flex items-center justify-between px-2">
        <motion.div 
          layout
          className={cn(
            "flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-700",
            auraStyles.border,
            auraStyles.bg,
            auraStyles.glow,
            isSurging && "ring-2 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105"
          )}
        >
          <div className="flex items-center gap-3">
            <ClarityWaveform charge={totalCharge} color={auraStyles.color} />
            <div className={cn("font-mono text-[10px] uppercase tracking-[0.2em] font-black", auraStyles.text)}>
              Scene Clarity: {totalCharge}%
            </div>
          </div>
          <p className="text-[10px] text-white/30 italic max-w-[200px] leading-relaxed">
            {isReady 
              ? "The frequency is locked. Ignition sequence prepared." 
              : `Deepen the ${dominantType !== 'none' ? dominantType : 'prose'} to tune the clarity.`}
          </p>
        </motion.div>

        <AIPolishButton 
          charge={totalCharge} 
          isReady={isReady} 
          onClick={() => onPolish?.(focusedBlockId || blocks[0].id)}
        />
      </div>

      {/* STAGE DECORATION: The "End of Scene" Marker */}
      <div className="mt-16 flex items-center gap-4 opacity-20">
        <div className="h-px flex-1 bg-emerald-500/50" />
        <span className="font-mono text-[10px] tracking-[0.4em] text-emerald-500 uppercase">
          End of Act II
        </span>
        <div className="h-px flex-1 bg-emerald-500/50" />
      </div>
    </section>
  );
};

