"use client";

import React, { useRef, useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScriptBlock, CatalystType } from '@/types';
import { cn } from '@/lib/utils';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { useDirectorInk } from '@/hooks/studio/useDirectorInk';

import { Music, Sparkles, Eye, PenTool, GripVertical } from 'lucide-react';
import { useAudioFeedback } from '@/hooks/studio/useAudioFeedback';
import { AnimatePresence } from 'framer-motion';

interface SentenceWrapperProps {
  block: ScriptBlock;
  isFocused: boolean;
  onUpdate: (text: string) => void;
  onSplit: (cursorPos: number) => void;
  onMerge: () => void;
  onFocus: () => void;
}

const getCatalystIcon = (type: string) => {
  switch (type) {
    case 'aroma': return <Sparkles className="w-4 h-4" />;
    case 'soundscape': return <Music className="w-4 h-4" />;
    case 'visual': return <Eye className="w-4 h-4" />;
    case 'polish': return <PenTool className="w-4 h-4" />;
    default: return <Sparkles className="w-4 h-4" />;
  }
};

const SHARED_EDITOR_STYLES: React.CSSProperties = {
  fontFamily: '"Courier Prime", monospace',
  fontSize: '18px',
  lineHeight: '1.6',
  letterSpacing: '0.025em',
  padding: '0px',
  margin: '0px',
  border: 'none',
  boxSizing: 'border-box',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  wordWrap: 'break-word',
  textAlign: 'left',
};

export const SentenceWrapper = ({ 
  block, 
  isFocused, 
  onUpdate, 
  onSplit, 
  onMerge, 
  onFocus 
}: SentenceWrapperProps) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const controls = useAnimation();
  const prevCatalystCountRef = useRef(block.catalysts.length);
  const { actions, draggingCatalyst } = useStudioState();
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { playError } = useAudioFeedback();
  const wasOverloaded = useRef(false);
  const { decoratedHtml, isOverloaded } = useDirectorInk(block.text);

  // 0. The Sensory Overload Logic (One-shot Buzz)
  useEffect(() => {
    if (isOverloaded && !wasOverloaded.current) {
      playError(); // Single sharp burst
      wasOverloaded.current = true;
    } else if (!isOverloaded && wasOverloaded.current) {
      wasOverloaded.current = false;
    }
  }, [isOverloaded, playError]);

  const shakeAnimation = {
    x: [0, -2, 2, -2, 2, 0],
    transition: { duration: 0.4, ease: "easeInOut" as any }
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    actions.setDrafting(true);
    onFocus();
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      actions.setDrafting(false);
    }, 100);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 1. The Seamless Focus Jump
  useEffect(() => {
    if (!isFocused || !editorRef.current) return;

    const focusElement = () => {
      if (editorRef.current) {
        editorRef.current.focus();
        // Maintain selection if already set, otherwise move to start/end as appropriate
        // For new blocks, we usually want to be at the start
      }
    };

    // Try immediately
    focusElement();

    // Try after a short delay (handles framer-motion entry)
    const timer1 = setTimeout(focusElement, 100);
    const timer2 = setTimeout(focusElement, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isFocused]);

  const [lastSplash, setLastSplash] = useState<CatalystType | null>(null);

  // 2. The "Director's Shake" Physics + Splash
  useEffect(() => {
    if (block.catalysts.length > prevCatalystCountRef.current) {
      const newCat = block.catalysts[block.catalysts.length - 1];
      if (newCat) {
        setLastSplash(newCat.type as any);
        setTimeout(() => setLastSplash(null), 1500);
      }

      controls.start({
        x: [-3, 3, -3, 3, 0],
        transition: { duration: 0.2, ease: "easeInOut" as any }
      });
    }
    prevCatalystCountRef.current = block.catalysts.length;
  }, [block.catalysts.length, controls]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSplit(editorRef.current?.selectionStart || 0);
    } else if (e.key === 'Backspace' && editorRef.current?.selectionStart === 0) {
      if (block.text.length === 0 || window.confirm("Merge this beat?")) {
        onMerge();
      }
    }
  };

  return (
    <motion.div
      id={`block-${block.id}`}
      data-block-id={block.id}
      ref={setNodeRef}
      style={style}
      layout
      animate={isOverloaded ? shakeAnimation : controls}
      className={cn(
        "group relative flex items-start gap-8 py-2 transition-all duration-300 rounded-xl px-4",
        isDragging && "opacity-40 z-50",
        draggingCatalyst && "ring-1 ring-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:ring-emerald-500/20",
        draggingCatalyst === 'aroma' && "hover:shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]",
        draggingCatalyst === 'soundscape' && "hover:shadow-[inset_0_0_20px_rgba(56,189,248,0.1)]",
        draggingCatalyst === 'visual' && "hover:shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]"
      )}
    >
      <AnimatePresence>
        {lastSplash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className={cn(
              "absolute inset-0 z-10 pointer-events-none rounded-xl border-2 flex items-center justify-center overflow-hidden",
              lastSplash === 'aroma' ? "border-amber-500/50 bg-amber-500/5" :
              lastSplash === 'soundscape' ? "border-sky-500/50 bg-sky-500/5" :
              "border-emerald-500/50 bg-emerald-500/5"
            )}
          >
            <motion.div 
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "absolute w-20 h-20 rounded-full border border-current",
                lastSplash === 'aroma' ? "text-amber-500" :
                lastSplash === 'soundscape' ? "text-sky-500" :
                "text-emerald-500"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* DRAG HANDLE: The "Six-Dot" Studio Tool */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -left-6 top-3 opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab active:cursor-grabbing transition-opacity z-50"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      {/* THE PRIVATE PROPERTY MARGIN (Magnetic Dock Location) */}
      <div className="absolute -left-16 flex flex-col gap-2 items-center w-12 z-10">
        {block.catalysts.map((catalyst) => (
          <motion.div
            key={catalyst.id}
            layoutId={catalyst.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-8 h-8 rounded-lg bg-slate-900/90 border border-emerald-500/30 
                       flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-blur-sm"
          >
            {getCatalystIcon(catalyst.type)}
          </motion.div>
        ))}
      </div>

      {/* THE TEXT STAGE: Mirrored Overlay */}
      <div className="relative w-full">
        {/* 1. THE GHOST LAYER (Background) */}
        <div
          aria-hidden="true"
          style={SHARED_EDITOR_STYLES}
          className="pointer-events-none absolute inset-0 select-none text-slate-200"
          dangerouslySetInnerHTML={{ __html: decoratedHtml || block.text }}
        />

        {/* 2. THE INTERACTIVE LAYER (Foreground) */}
        <textarea
          ref={editorRef}
          value={block.text}
          onChange={(e) => onUpdate(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Enter a new story beat..."
          style={SHARED_EDITOR_STYLES}
          className={cn(
            "relative z-10 w-full resize-none overflow-hidden outline-none",
            "bg-transparent text-transparent caret-emerald-500 placeholder:text-slate-700/50",
            "selection:bg-emerald-500/30",
            isDragging && "pointer-events-none"
          )}
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
        />

        {/* Visual Warning: Subtle Red Vignette on Overload */}
        <AnimatePresence>
          {isOverloaded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 border border-red-500/20 bg-red-500/5 rounded-lg z-0"
            />
          )}
        </AnimatePresence>
      </div>

      {/* BLOCK METADATA (Space Mono diagnostic feel) */}
      <div className="absolute -right-24 top-2 opacity-0 group-hover:opacity-40 transition-opacity 
                      font-mono text-[9px] text-emerald-500 tracking-tighter uppercase w-20 text-right">
        {block.type} // {block.id.slice(0, 4)}
      </div>
    </motion.div>
  );
};
