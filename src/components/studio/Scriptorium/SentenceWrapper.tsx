"use client";

import React, { useRef, useMemo, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScriptBlock } from '@/types';
import { cn } from '@/lib/utils';
import { detectAnchors } from '@/hooks/studio/useDirectorInk';
import { Sparkles } from 'lucide-react';

const SHARED_STYLES: React.CSSProperties = {
  fontFamily: '"Courier Prime", monospace',
  fontSize: '18px',
  lineHeight: '1.6',
  letterSpacing: '0.025em',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  padding: '0px',
  margin: '0px',
  border: 'none',
  outline: 'none',
  WebkitFontSmoothing: 'antialiased',
  boxSizing: 'border-box',
};

export const SentenceWrapper = React.forwardRef<HTMLTextAreaElement, any>(({ 
  block, 
  isActive, 
  onUpdate, 
  onBulkUpdate,
  onFocus, 
  onBlur,
  actions,
  hideAnchors = false,
  readOnly = false
}, ref) => {
  const isHook = block.type === 'hook';
  
  // 0. SMART PASTE HANDLER
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text.includes('\n')) {
      e.preventDefault();
      // Split by double newlines or single newlines depending on preference
      // Here we split by any newline and filter out empty strings
      const blocks = text.split(/\n+/).filter(line => line.trim() !== '');
      if (blocks.length > 1) {
        onBulkUpdate?.(blocks);
      } else {
        // Just a single line but maybe with trailing newlines
        onUpdate(text.trim());
      }
    }
  }, [onBulkUpdate, onUpdate]);

  // DYNAMIC STYLING FOR UNIFIED ENGINE
  const RESOLVED_STYLES = useMemo(() => ({
    ...SHARED_STYLES,
    fontSize: isHook ? '24px' : '18px',
    lineHeight: isHook ? '1.5' : '1.6',
    fontWeight: isHook ? '500' : '400',
  }), [isHook]);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rects, setRects] = useState<Record<string, DOMRect>>({});
  const [isMounted, setIsMounted] = useState(false);
  
  // Ref Sync Mandate
  useLayoutEffect(() => {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(editorRef.current);
    } else {
      (ref as any).current = editorRef.current;
    }
  }, [ref]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // AUTO-SYNC HEIGHT: Ensures the interaction layer (textarea) matches the visual layer
  useLayoutEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.height = 'auto';
      editorRef.current.style.height = `${editorRef.current.scrollHeight}px`;
    }
  }, [block.text]);

  const anchors = useMemo(() => hideAnchors ? [] : detectAnchors(block.text), [block.text, hideAnchors]);

  // 1. REFINED TOKENIZATION ENGINE (V4.6 - CODE RED STABILIZATION)
  const tokens = useMemo(() => {
    if (!block.text) return [];
    if (anchors.length === 0) return block.text.split(/([^a-zA-Z0-9])/g).filter((t: string) => t !== "");

    // Sort anchors by length (longest first) to prevent partial matching
    const sortedAnchors = [...anchors].sort((a, b) => b.word.length - a.word.length);
    
    // ESCAPING MANDATE: Using the exact requested escaping structure
    const anchorPattern = sortedAnchors.map(a => a.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    
    // PHRASE PROTECTION: Captures full phrases before atomic characters
    const regex = new RegExp(`(${anchorPattern}|[^a-zA-Z0-9])`, 'gi');
    
    return block.text.split(regex).filter((t: string) => t !== undefined && t !== "");
  }, [block.text, anchors]);

  const updateSparklePositions = useCallback(() => {
    if (!containerRef.current) return;
    
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const newRects: Record<string, DOMRect> = {};
      const spans = containerRef.current.querySelectorAll('.anchor-span');
      
      spans.forEach((span) => {
        const id = span.getAttribute('data-token-id');
        if (id) {
          newRects[id] = span.getBoundingClientRect();
        }
      });
      
      setRects(newRects);
    });
  }, []);

  useLayoutEffect(() => {
    updateSparklePositions();
    const timer = setTimeout(updateSparklePositions, 150);
    
    const observer = new ResizeObserver(updateSparklePositions);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('scroll', updateSparklePositions, true);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('scroll', updateSparklePositions, true);
    };
  }, [tokens, updateSparklePositions]);

  const portalContent = useMemo(() => {
    if (hideAnchors || readOnly) return null;
    return tokens.map((token: string, idx: number) => {
      const clean = token.toLowerCase();
      const anchor = anchors.find(a => a.word.toLowerCase() === clean);
      const tokenId = `${block.id}-${idx}`;
      const rect = rects[tokenId];

      if (!anchor || !rect || rect.width === 0) return null;

      return (
        <motion.button
          key={tokenId}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            position: 'fixed',
            left: rect.left + (rect.width / 2),
            top: rect.top - 24,
            pointerEvents: 'auto'
          }}
          className="w-6 h-6 -translate-x-1/2 rounded-full bg-slate-950 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-help"
          onMouseEnter={() => {
            const xOffset = rect.left + (rect.width / 2) - (window.innerWidth / 2);
            actions.triggerSynapse(anchor.word, anchor.type, xOffset);
          }}
          onMouseLeave={() => actions.triggerSynapse('', 'visual', 0)}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </motion.button>
      );
    });
  }, [tokens, anchors, rects, block.id, actions, hideAnchors, readOnly]);

  const { setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      data-blueprint="SentenceWrapper"
      ref={(node) => {
        setNodeRef(node);
        // @ts-ignore
        containerRef.current = node;
      }}
      style={style}
      layout
      data-block-id={block.id}
      onClick={(e) => {
        // Prevent click events on the wrapper padding/margins/empty areas from bubbling to the parent
        // container (which would force the cursor to jump to the end of the script).
        if (e.target !== editorRef.current && editorRef.current) {
          editorRef.current.focus();
        }
        e.stopPropagation();
      }}
      className={cn(
        "group relative flex items-start gap-8 py-2 transition-all duration-300 rounded-xl px-4",
        isDragging && "opacity-40 z-50",
        isActive && "bg-white/[0.03]",
        readOnly && "bg-slate-950/40 border border-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.05)] rounded-xl"
      )}
    >
      <div className="relative w-full grid">
        {/* APEX PORTAL: document.body level */}
        {isMounted && createPortal(
          <div className="fixed inset-0 pointer-events-none z-[9999]">
            {portalContent}
          </div>,
          document.body
        )}

        <textarea
          ref={editorRef}
          value={block.text}
          onChange={(e) => onUpdate(e.target.value)}
          onPaste={handlePaste}
          onFocus={onFocus}
          onBlur={onBlur}
          readOnly={readOnly}
          spellCheck={false}
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            ...RESOLVED_STYLES, 
            color: 'transparent', 
            caretColor: readOnly ? 'transparent' : '#10b981',
            gridArea: '1 / 1 / 2 / 2'
          }}
          className="relative z-[50] w-full resize-none overflow-hidden bg-transparent selection:bg-emerald-500/30"
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
        />

        <div
          aria-hidden="true"
          style={{
            ...RESOLVED_STYLES,
            gridArea: '1 / 1 / 2 / 2'
          }}
          className="z-10 pointer-events-none text-slate-200 w-full"
        >
          {tokens.map((token: string, idx: number) => {
            const clean = token.toLowerCase();
            const isAnchor = !hideAnchors && anchors.some(a => a.word.toLowerCase() === clean);
            const tokenId = `${block.id}-${idx}`;

            return (
              <span 
                key={tokenId}
                data-token-id={tokenId}
                className={cn(
                  isAnchor && "anchor-span border-b-2 border-emerald-500/50 bg-emerald-500/5"
                )}
              >
                {token}
              </span>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

SentenceWrapper.displayName = 'SentenceWrapper';
