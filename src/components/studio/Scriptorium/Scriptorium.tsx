import React, { useEffect, useMemo, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
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
import { History, Lock, Unlock, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
        initial={{
          d: `M 0 10 ${Array.from({ length: points }).map((_, i) => 
            `Q ${i * step + step/2} ${10 + (Math.sin(i * 1.5) * 8) * (charge/100)} ${(i + 1) * step} 10`
          ).join(' ')}`
        }}
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
  onActivity?: () => void;
  isProductionLocked?: boolean;
  onOpenArchive?: () => void;
  onUnlockProduction?: () => void;
  onLockProduction?: () => void;
}

export const Scriptorium = forwardRef<any, ScriptoriumProps>(({ 
  data, 
  onSync, 
  onPolish, 
  onWordCountChange, 
  onActivity,
  isProductionLocked = false,
  onOpenArchive,
  onUnlockProduction,
  onLockProduction
}, ref) => {
  const { actions, detectedAnchors, activeDrawer } = useStudioState();

  // 1. THE HYDRATION-SAFE MIGRATION ENGINE
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  
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
    bulkInsertBlocks,
    setBlocks
  } = useStoryScript(data.scriptBlocks || []);

  useEffect(() => {
    if (hasHydrated) return;
    
    // Migration logic (Client-side only)
    if (!data.scriptBlocks || data.scriptBlocks.length === 0) {
      if (data.prose) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.prose, 'text/html');
        const paragraphs = Array.from(doc.querySelectorAll('p'));

        if (paragraphs.length > 0) {
          const migrated = paragraphs.map((p, index) => ({
            id: uuidv4(),
            type: (index === 0 ? 'hook' : 'beat') as 'hook' | 'beat',
            text: p.innerHTML,
            catalysts: [],
          }));
          setBlocks(migrated);
        } else {
          setBlocks([{ id: uuidv4(), type: 'hook', text: '', catalysts: [] }]);
        }
      } else {
        setBlocks([{ id: uuidv4(), type: 'hook', text: '', catalysts: [] }]);
      }
    }
    setHasHydrated(true);
  }, [data.scriptBlocks, data.prose, hasHydrated, setBlocks]);
  
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

  const debouncedBlocks = useDebounce(blocks, 1000); // 1-second buffer for heavy sync
  const latestBlocksRef = useRef(blocks);
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    latestBlocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  // 3. REAL-TIME UI SYNC (Active Block Metadata)
  useEffect(() => {
    if (focusedBlock) {
      actions.setAppliedCatalysts(focusedBlock.catalysts.map(c => c.type));
    } else {
      actions.setAppliedCatalysts([]);
    }
  }, [focusedBlock, actions]);

  // 4. DEBOUNCED HEAVY SYNC (Database & Script Analysis)
  useEffect(() => {
    const blocksJSON = JSON.stringify(debouncedBlocks);
    
    // Aggressive Guard: Only sync if blocks actually changed
    if (blocksJSON !== lastSyncedBlocksRef.current) {
      onSync(debouncedBlocks);
      lastSyncedBlocksRef.current = blocksJSON;
    }
    
    // Aggregate anchors across all blocks (Heavy Regex Operation)
    const allText = debouncedBlocks.map(b => b.text).join(' ');
    const uniqueAnchors = detectAnchors(allText);
    const activeTypes = Array.from(new Set(uniqueAnchors.map(a => a.type)));
    
    // Diagnostic: Identify Overloaded Beats
    const overloadedIds = debouncedBlocks
      .filter(b => detectAnchors(b.text).length >= 4)
      .map(b => b.id);
    
    actions.setDetectedAnchors(uniqueAnchors);
    actions.setOverloadedBlocks(overloadedIds);
    actions.setActiveAnchorTypes(activeTypes);

    // DIRECTORIAL GUIDE LOGIC
    const totalWords = allText.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    if (totalWords !== lastSyncedWordCountRef.current) {
      onWordCountChange?.(totalWords);
      lastSyncedWordCountRef.current = totalWords;
    }

    let note: string | null = null;
    if (totalWords < 20) {
      note = "Begin by drafting your Inciting Memory. The Director's Ink will highlight sensory opportunities as you write.";
    } else if (activeTypes.length === 0) {
      note = "Try adding sensory details like 'scent', 'sound', or 'color' to anchor your narrative in physical space.";
    } else if (debouncedBlocks.every(b => b.catalysts.length === 0)) {
      const firstType = activeTypes[0];
      const typeLabel = firstType === 'aroma' ? 'Wind' : firstType === 'soundscape' ? 'Music' : 'Layers';
      note = `I've detected a ${firstType} anchor. Drag the ${typeLabel} catalyst from the right rack to lock it in.`;
    } else if (totalWords < 50) {
      note = `Your narrative density is increasing. You're ${Math.max(0, 50 - totalWords)} words away from unlocking AI Polish.`;
    } else {
      note = "The Scribe is prepared. Use the Apply AI Polish tool to refine the scene's emotional clarity.";
    }

    actions.setDirectorialNote(note);
    
  }, [debouncedBlocks, onSync, actions, onWordCountChange]);

  // 4.5 FINAL FLUSH ON UNMOUNT (Ensures last keystrokes are captured)
  useEffect(() => {
    return () => {
      const finalJSON = JSON.stringify(latestBlocksRef.current);
      if (finalJSON !== lastSyncedBlocksRef.current) {
        onSyncRef.current(latestBlocksRef.current);
      }
    };
  }, []); // Only on unmount

  useImperativeHandle(ref, () => ({
    flush: () => {
      const finalJSON = JSON.stringify(latestBlocksRef.current);
      if (finalJSON !== lastSyncedBlocksRef.current) {
        onSync(latestBlocksRef.current);
        lastSyncedBlocksRef.current = finalJSON;
      }
      return latestBlocksRef.current;
    }
  }));

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
          sensors={isProductionLocked ? [] : sensors}
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
                  onUpdate={(text: string) => { updateBlockText(block.id, text); onActivity?.(); }}
                  onBulkUpdate={(texts: string[]) => { bulkInsertBlocks(block.id, texts); onActivity?.(); }}
                  actions={actions}
                  readOnly={isProductionLocked}
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
                  readOnly={isProductionLocked}
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

        <div className="flex items-center gap-3">
          {onOpenArchive && (
            <div className="relative flex items-center gap-2">
              <motion.button
                onClick={onOpenArchive}
                className="relative z-10 flex items-center gap-2 px-6 py-3.5 rounded-full font-black text-[10px] uppercase tracking-[0.25em] bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:bg-amber-500/20 active:scale-95 transition-all duration-300"
              >
                <History className="w-3.5 h-3.5" />
                View Archive
              </motion.button>
              
              <motion.button
                onClick={() => actions.setActiveDrawer(activeDrawer === 'architect' ? null : 'architect')}
                className={cn(
                  "relative z-10 flex items-center gap-2 px-6 py-3.5 rounded-full font-black text-[10px] uppercase tracking-[0.25em] transition-all duration-300 cursor-pointer",
                  activeDrawer === 'architect'
                    ? "bg-amber-500 text-slate-950 border border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]"
                    : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white"
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Architect's Drawer
              </motion.button>
              
              {onUnlockProduction && (
                isProductionLocked ? (
                  <button
                    onClick={() => setShowUnlockConfirm(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-950/60 hover:text-red-300 transition-all duration-300"
                    title="Release Production Lock"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => onLockProduction?.()}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-950/60 hover:text-emerald-300 transition-all duration-300"
                    title="Seal Production Lock"
                  >
                    <Unlock className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
          )}

          <AIPolishButton 
            charge={totalCharge} 
            isReady={isReady} 
            disabled={isProductionLocked}
            onClick={() => onPolish?.(focusedBlockId || blocks[0].id)}
          />
        </div>
      </div>

      {/* STAGE DECORATION: The "End of Scene" Marker */}
      <div className="mt-16 flex flex-col gap-8">
        {isProductionLocked && data.activeVision && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-md shadow-[0_15px_35px_rgba(16,185,129,0.05)] flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.25em]">Sensory Blueprint Sealed</h4>
                <p className="text-[10px] text-white/50 leading-relaxed font-sans max-w-md">
                  Pacing and script details have been locked to preserve recording fidelity. Proceed to the booth to capture your performance.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // Dispatch click trigger on global navigation next step
                const nextBtn = document.querySelector('[data-blueprint="ProductionControlBar"] button.bg-emerald-505, [data-blueprint="ProductionControlBar"] button.bg-emerald-500') as HTMLButtonElement;
                if (nextBtn) {
                  nextBtn.click();
                } else {
                  console.warn("[Scriptorium] Global navigate next trigger button could not be located in DOM.");
                }
              }}
              className="w-full md:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.5)] flex items-center justify-center gap-3"
            >
              <span>Enter Recording Studio</span>
              <BookOpen className="w-4 h-4 text-slate-950" />
            </button>
          </motion.div>
        )}

        <div className="flex items-center gap-4 opacity-20">
          <div className="h-px flex-1 bg-emerald-500/50" />
          <span className="font-mono text-[10px] tracking-[0.4em] text-emerald-500 uppercase">
            {isProductionLocked ? "Directorial Blueprint Locked" : "End of Script Blueprint"}
          </span>
          <div className="h-px flex-1 bg-emerald-500/50" />
        </div>
      </div>

      {/* Custom Alert Dialog for Unlocking Production */}
      <AlertDialog open={showUnlockConfirm} onOpenChange={setShowUnlockConfirm}>
        <AlertDialogContent className="bg-slate-900 border border-white/10 text-white rounded-3xl p-6 max-w-md shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-lg font-black uppercase tracking-wider text-rose-400 font-mono">
              Release Production Lock?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-xs leading-relaxed font-sans">
              Unlocking this scene will allow edits to your script but may desync any recordings in Act II. Proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-3 justify-end">
            <AlertDialogCancel className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onUnlockProduction?.();
                setShowUnlockConfirm(false);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white border-none rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
            >
              Unlock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
});

Scriptorium.displayName = 'Scriptorium';

