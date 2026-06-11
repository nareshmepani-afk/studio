"use client";

import React, { useRef, useMemo, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScriptBlock } from '@/types';
import { cn } from '@/lib/utils';
import { detectAnchors } from '@/hooks/studio/useDirectorInk';
import { Sparkles, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

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

interface PivotSuggestions {
  poetic: string[];
  grit: string[];
  heritage: string[];
}

const TONAL_PIVOT_MAP: Record<string, PivotSuggestions> = {
  sustenance: {
    poetic: ["lifeline", "vitality"],
    grit: ["rations", "provisions"],
    heritage: ["nourishment", "soul-food"]
  },
  hardship: {
    poetic: ["stoicism", "tribulation"],
    grit: ["struggle", "adversity"],
    heritage: ["privation", "austerity"]
  },
  persistence: {
    poetic: ["tenacity", "unwavering path", "perseverance"],
    grit: ["grit", "resolve"],
    heritage: ["resilience", "steadfastness", "stoutheartedness", "loyalty"]
  },
  tongue: {
    poetic: ["native voice", "inner speaker"],
    grit: ["dialect", "speech"],
    heritage: ["ancestral voice", "first language"]
  },
  mother: {
    poetic: ["maternal star", "lifegiver"],
    grit: ["guardian", "caretaker"],
    heritage: ["ancestress", "matriarch"]
  },
  story: {
    poetic: ["narrative", "chronicle"],
    grit: ["account", "records"],
    heritage: ["tale", "oral history"]
  },
  forebears: {
    poetic: ["lineage", "ancestors"],
    grit: ["predecessors", "settlers"],
    heritage: ["forefathers", "kin"]
  },
  tethered: {
    poetic: ["intertwined", "anchored"],
    grit: ["bound", "shackled"],
    heritage: ["linked", "tethered"]
  },
  stubborn: {
    poetic: ["persistent", "resolute"],
    grit: ["obstinate", "stiff-necked"],
    heritage: ["unyielding", "steadfast"]
  },
  soil: {
    poetic: ["clay", "cradle"],
    grit: ["dust", "turf"],
    heritage: ["earth", "homeland"]
  },
  bounty: {
    poetic: ["overflow", "plenty"],
    grit: ["yield", "harvest"],
    heritage: ["abundance", "provisions"]
  },
  nairobi: {
    poetic: ["my birthplace", "cradle of my memory"],
    grit: ["the capital", "the urban expanse"],
    heritage: ["our homestead", "the first station"]
  },
  kutch: {
    poetic: ["the salt flats", "the arid cradle"],
    grit: ["the province", "the borderlands"],
    heritage: ["our ancestral homeland", "our origin region"]
  },
  madhapur: {
    poetic: ["our sanctuary", "the silent village"],
    grit: ["the township", "the dust roads"],
    heritage: ["our ancestral village", "our roots settlement"]
  },
  born: {
    poetic: ["nurtured", "brought forth"],
    grit: ["forged", "raised"],
    heritage: ["native to", "descended in"]
  },
  begins: {
    poetic: ["unfolds", "awakens"],
    grit: ["starts", "commences"],
    heritage: ["originates", "roots itself"]
  },
  passport: {
    poetic: ["talisman", "ticket"],
    grit: ["permit", "license"],
    heritage: ["credential", "papers"]
  },
  hands: {
    poetic: ["palms", "instruments"],
    grit: ["grips", "fists"],
    heritage: ["ancestral tools", "touchstones"]
  },
  origin: {
    poetic: ["source", "wellspring"],
    grit: ["rooting", "startpoint"],
    heritage: ["birthplace", "descent"]
  },
  landscape: {
    poetic: ["vista", "canvas"],
    grit: ["terrain", "scenery"],
    heritage: ["homestead", "territory"]
  },
  etched: {
    poetic: ["engraved", "imprinted"],
    grit: ["scratched", "marked"],
    heritage: ["carved", "stamped"]
  },
  drew: {
    poetic: ["derived", "elicited"],
    grit: ["pulled", "extracted"],
    heritage: ["gathered", "inherited"]
  },
  land: {
    poetic: ["soil", "ground"],
    grit: ["turf", "fields"],
    heritage: ["country", "homeland"]
  },
  vegetarian: {
    poetic: ["plant-based", "pure diet"],
    grit: ["meat-free", "herbivorous"],
    heritage: ["customary diet", "faith-aligned"]
  },
  necessity: {
    poetic: ["obligation", "destiny"],
    grit: ["requirement", "essential"],
    heritage: ["customary law", "tradition"]
  },
  strong: {
    poetic: ["resilient", "robust"],
    grit: ["powerful", "tough"],
    heritage: ["sturdy", "unyielding"]
  },
  virtue: {
    poetic: ["integrity", "purity"],
    grit: ["strength", "discipline"],
    heritage: ["honor", "heritage"]
  },
  passed: {
    poetic: ["transmitted", "whispered"],
    grit: ["handed", "delivered"],
    heritage: ["bequeathed", "passed down"]
  },
  generations: {
    poetic: ["lineages", "descendants"],
    grit: ["waves", "predecessors"],
    heritage: ["ancestral lines", "kinfolk"]
  },
  constant: {
    poetic: ["anchor", "fixture"],
    grit: ["mainstay", "certainty"],
    heritage: ["tradition", "linchpin"]
  },
  opportunity: {
    poetic: ["chance", "opening"],
    grit: ["prospect", "avenue"],
    heritage: ["calling", "beckoning"]
  },
  arrived: {
    poetic: ["appeared", "emerged"],
    grit: ["came", "materialized"],
    heritage: ["arrived", "settled"]
  },
  shadow: {
    poetic: ["reach", "canopy"],
    grit: ["influence", "presence"],
    heritage: ["empire", "colonial echo"]
  },
  passage: {
    poetic: ["voyage", "journey"],
    grit: ["transition", "crossing"],
    heritage: ["travel", "exile"]
  },
  lessons: {
    poetic: ["teachings", "wisdom"],
    grit: ["rules", "principles"],
    heritage: ["lore", "creeds"]
  },
  imprinted: {
    poetic: ["engraved", "impressed"],
    grit: ["stamped", "embossed"],
    heritage: ["bequeathed", "passed down"]
  },
  learn: {
    poetic: ["absorb", "acquire"],
    grit: ["master", "study"],
    heritage: ["internalize", "retain"]
  },
  language: {
    poetic: ["speech", "expression"],
    grit: ["dialect", "tongue"],
    heritage: ["lexicon", "ancestry"]
  },
  new: {
    poetic: ["unfamiliar", "untold"],
    grit: ["different", "strange"],
    heritage: ["adopted", "foreign"]
  },
  world: {
    poetic: ["realm", "planet", "domain"],
    grit: ["society", "territory"],
    heritage: ["foreign land", "diaspora"]
  },
  adapt: {
    poetic: ["adjust", "acclimate"],
    grit: ["conform", "endure"],
    heritage: ["assimilate", "blend"]
  },
  cruelties: {
    poetic: ["severities", "harshness"],
    grit: ["hardships", "excesses"],
    heritage: ["oppressions", "trials"]
  },
  work: {
    poetic: ["strive", "struggle"],
    grit: ["labor", "toil"],
    heritage: ["farming", "crafting"]
  },
  relentlessly: {
    poetic: ["tirelessly", "ceaselessly"],
    grit: ["persistently", "unflinchingly"],
    heritage: ["steadfastly", "unwaveringly"]
  },
  survival: {
    poetic: ["endurance", "resilience"],
    grit: ["existence", "tenacity"],
    heritage: ["continuation", "bequest"]
  },
  miracle: {
    poetic: ["wonder", "blessing"],
    grit: ["fluke", "coincidence"],
    heritage: ["divine hand", "grace"]
  },
  practiced: {
    poetic: ["refined", "seasoned"],
    grit: ["trained", "skilled"],
    heritage: ["time-honored", "customary"]
  },
  skill: {
    poetic: ["craft", "expertise"],
    grit: ["ability", "tactics"],
    heritage: ["artistry", "trade"]
  },
  hand: {
    poetic: ["passed down", "imparted"],
    grit: ["transferred", "handed over"],
    heritage: ["descended", "inherited"]
  },
  inheritance: {
    poetic: ["legacy", "patrimony"],
    grit: ["bequest", "provisions"],
    heritage: ["heritage", "birthright"]
  },
  unwavering: {
    poetic: ["steadfast", "resolute"],
    grit: ["firm", "stubborn"],
    heritage: ["unbroken", "uncompromising"]
  },
  will: {
    poetic: ["drive", "spirit"],
    grit: ["determination", "resolve"],
    heritage: ["ancestral intent", "destiny"]
  },
  keep: {
    poetic: ["persist in", "strive to"],
    grit: ["continue", "proceed"],
    heritage: ["carry on", "preserve"]
  },
  moving: {
    poetic: ["progressing", "journeying"],
    grit: ["advancing", "running"],
    heritage: ["migrating", "traveling"]
  }
};

const findPivotRoot = (word: string): string | null => {
  const clean = word.toLowerCase().trim().replace(/[^\w]/g, '');
  if (!clean) return null;
  if (TONAL_PIVOT_MAP[clean]) {
    return clean;
  }
  for (const [root, pivots] of Object.entries(TONAL_PIVOT_MAP)) {
    if (
      pivots.poetic.some(p => p.toLowerCase().replace(/[^\w]/g, '') === clean) ||
      pivots.grit.some(p => p.toLowerCase().replace(/[^\w]/g, '') === clean) ||
      pivots.heritage.some(p => p.toLowerCase().replace(/[^\w]/g, '') === clean)
    ) {
      return root;
    }
  }
  return null;
};

const getActivePivotInfo = (word: string): { root: string; tone: 'poetic' | 'grit' | 'heritage' } | null => {
  const clean = word.toLowerCase().trim().replace(/[^\w]/g, '');
  if (!clean) return null;
  for (const [root, pivots] of Object.entries(TONAL_PIVOT_MAP)) {
    if (pivots.poetic.some(p => p.toLowerCase().replace(/[^\w]/g, '') === clean)) {
      return { root, tone: 'poetic' };
    }
    if (pivots.grit.some(p => p.toLowerCase().replace(/[^\w]/g, '') === clean)) {
      return { root, tone: 'grit' };
    }
    if (pivots.heritage.some(p => p.toLowerCase().replace(/[^\w]/g, '') === clean)) {
      return { root, tone: 'heritage' };
    }
  }
  return null;
};

const getSuggestions = (word: string): PivotSuggestions | null => {
  const clean = word.toLowerCase().trim().replace(/[^\w]/g, '');
  const root = findPivotRoot(clean);
  if (root && TONAL_PIVOT_MAP[root]) {
    const isCapitalized = word[0] === word[0].toUpperCase();
    const isAllUppercase = word === word.toUpperCase() && word.length > 1;
    
    const applyCasing = (sug: string) => {
      if (isAllUppercase) return sug.toUpperCase();
      if (isCapitalized) return sug.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
      return sug;
    };

    const pivots = TONAL_PIVOT_MAP[root];
    return {
      poetic: pivots.poetic.map(applyCasing),
      grit: pivots.grit.map(applyCasing),
      heritage: pivots.heritage.map(applyCasing),
    };
  }
  return null;
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
      const blocks = text.split(/\n+/).filter(line => line.trim() !== '');
      if (blocks.length > 1) {
        onBulkUpdate?.(blocks);
      } else {
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
  const [ghostWordInfo, setGhostWordInfo] = useState<{
    word: string;
    start: number;
    end: number;
    tokenIndex: number;
    rect: DOMRect;
  } | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  
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

    const sortedAnchors = [...anchors].sort((a, b) => b.word.length - a.word.length);
    const anchorPattern = sortedAnchors.map(a => a.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${anchorPattern}|[^a-zA-Z0-9])`, 'gi');
    
    return block.text.split(regex).filter((t: string) => t !== undefined && t !== "");
  }, [block.text, anchors]);

  const updateSparklePositions = useCallback(() => {
    if (!containerRef.current) return;
    
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const newRects: Record<string, DOMRect> = {};
      const spans = containerRef.current.querySelectorAll('.anchor-span, .pivot-span, .directive-span');
      
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

  // Listen to Caret Position and Text Selection to auto-identify Word Pivot Target
  const handleCaretOrSelectionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    if (readOnly) {
      const selectedText = target.value.substring(start, end).trim();
      if (!selectedText || start === end) {
        setGhostWordInfo(null);
        return;
      }
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect && rect.width > 0) {
          setGhostWordInfo({
            word: selectedText,
            start: start,
            end: end,
            tokenIndex: -1,
            rect: rect,
          });
        }
      }
      return;
    }

    let startPos = start;
    let endPos = end;
    
    // Collapsed selection: expand range outwards to find the bounding word boundaries
    if (start === end) {
      const text = target.value;
      let left = start - 1;
      while (left >= 0 && /[a-zA-Z0-9'’-]/.test(text[left])) {
        left--;
      }
      left++;

      let right = start;
      while (right < text.length && /[a-zA-Z0-9'’-]/.test(text[right])) {
        right++;
      }
      
      startPos = left;
      endPos = right;
    }

    const selectedText = target.value.substring(startPos, endPos).trim();
    if (!selectedText || startPos === endPos || /[^a-zA-Z0-9'’-]/.test(selectedText)) {
      setGhostWordInfo(null);
      return;
    }

    // Map characters to visual token offset span
    let charCount = 0;
    let foundIdx = -1;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const tokenStart = charCount;
      const tokenEnd = charCount + token.length;
      charCount = tokenEnd;

      if (startPos >= tokenStart && endPos <= tokenEnd) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx !== -1) {
      const tokenId = `${block.id}-${foundIdx}`;
      const spanEl = containerRef.current?.querySelector(`[data-token-id="${tokenId}"]`);
      if (spanEl) {
        setGhostWordInfo({
          word: selectedText,
          start: startPos,
          end: endPos,
          tokenIndex: foundIdx,
          rect: spanEl.getBoundingClientRect(),
        });
      }
    } else {
      setGhostWordInfo(null);
    }
  };

  const portalContent = useMemo(() => {
    if (hideAnchors || readOnly) return null;
    return tokens.map((token: string, idx: number) => {
      const clean = token.toLowerCase();
      const anchor = anchors.find(a => a.word.toLowerCase() === clean);
      const tokenId = `${block.id}-${idx}`;
      const rect = rects[tokenId];

      if (!anchor || !rect || rect.width === 0) return null;

      return (
        <Tooltip key={tokenId}>
          <TooltipTrigger asChild>
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                position: 'fixed',
                left: rect.left + (rect.width / 2),
                top: rect.top - 24,
                pointerEvents: 'auto'
              }}
              className="w-6 h-6 -translate-x-1/2 rounded-full bg-slate-950 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer"
              onMouseEnter={() => {
                const xOffset = rect.left + (rect.width / 2) - (window.innerWidth / 2);
                actions.triggerSynapse(anchor.word, anchor.type, xOffset);
              }}
              onMouseLeave={() => actions.triggerSynapse('', 'visual', 0)}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-950/95 border border-white/10 shadow-2xl backdrop-blur-md px-3 py-1.5 rounded-lg z-[10000]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sensory Anchor</span>
              <span className="text-xs font-mono text-white capitalize">{anchor.word} ({anchor.type})</span>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    });
  }, [tokens, anchors, rects, block.id, actions, hideAnchors, readOnly]);

  const pivotPortalContent = useMemo(() => {
    if (readOnly) return null;
    return tokens.map((token: string, idx: number) => {
      const clean = token.toLowerCase().trim().replace(/[^\w]/g, '');
      const pivotInfo = getActivePivotInfo(clean);
      if (!pivotInfo || clean === pivotInfo.root) return null;

      const { root, tone } = pivotInfo;
      const tokenId = `${block.id}-${idx}`;
      const rect = rects[tokenId];
      if (!rect || rect.width === 0) return null;

      const toneStyles = {
        poetic: {
          border: 'border-sky-400',
          text: 'text-sky-400',
          hoverText: 'hover:text-slate-950',
          hoverBg: 'hover:bg-sky-400',
          shadow: 'shadow-[0_0_15px_rgba(56,189,248,0.5)]',
          headerColor: 'text-sky-400',
        },
        grit: {
          border: 'border-amber-400',
          text: 'text-amber-400',
          hoverText: 'hover:text-slate-950',
          hoverBg: 'hover:bg-amber-400',
          shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]',
          headerColor: 'text-amber-400',
        },
        heritage: {
          border: 'border-emerald-400',
          text: 'text-emerald-400',
          hoverText: 'hover:text-slate-950',
          hoverBg: 'hover:bg-emerald-400',
          shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]',
          headerColor: 'text-emerald-400',
        },
      };

      const styleConfig = toneStyles[tone];

      return (
        <Tooltip key={`pivot-${tokenId}`}>
          <TooltipTrigger asChild>
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                position: 'fixed',
                left: rect.left + (rect.width / 2),
                top: rect.top - 24,
                pointerEvents: 'auto'
              }}
              className={cn(
                "w-6 h-6 -translate-x-1/2 rounded-full bg-slate-950 flex items-center justify-center border transition-all cursor-pointer",
                styleConfig.border,
                styleConfig.text,
                styleConfig.shadow,
                styleConfig.hoverBg,
                styleConfig.hoverText
              )}
              onClick={(e) => {
                e.stopPropagation();
                let startOffset = 0;
                for (let i = 0; i < idx; i++) {
                  startOffset += tokens[i].length;
                }
                const endOffset = startOffset + token.length;

                setGhostWordInfo({
                  word: token,
                  start: startOffset,
                  end: endOffset,
                  tokenIndex: idx,
                  rect: rect
                });
                setSuggestionsOpen(true);
              }}
            >
              <Sparkles className="w-3 h-3" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-950/95 border border-white/10 shadow-2xl backdrop-blur-md px-3 py-1.5 rounded-lg z-[10000]">
            <div className="flex flex-col gap-0.5">
              <span className={cn("text-[10px] font-black uppercase tracking-widest", styleConfig.headerColor)}>
                Linguistic Pivot ({tone})
              </span>
              <span className="text-xs font-mono text-white">
                "{token}" (pivoted from "{root}")
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    });
  }, [tokens, rects, block.id, readOnly]);

  // Selection ghosting trigger button floating above the highlighted word
  const sparkleTriggerPortal = useMemo(() => {
    if (readOnly || !ghostWordInfo || suggestionsOpen) return null;
    const { word, rect } = ghostWordInfo;
    const hasPivots = getSuggestions(word) !== null;
    if (!hasPivots) return null;

    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        style={{
          position: 'fixed',
          left: rect.left + (rect.width / 2),
          top: rect.top - 20,
          pointerEvents: 'auto',
        }}
        onMouseDown={(e) => {
          e.preventDefault(); // Keep textarea focus
          setSuggestionsOpen(true);
        }}
        className="w-5 h-5 -translate-x-1/2 rounded-full bg-slate-950 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)] hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer z-[9999]"
        title="Open Tonal Pivot Menu"
      >
        <Sparkles className="w-3 h-3" />
      </motion.button>
    );
  }, [ghostWordInfo, suggestionsOpen, readOnly]);

  // Tonal Spectrum suggestions grouped layout
  const suggestionsPortal = useMemo(() => {
    if (readOnly || !ghostWordInfo || !suggestionsOpen) return null;

    const { word, start, end, rect } = ghostWordInfo;
    const pivots = getSuggestions(word);

    if (!pivots) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{
          position: 'fixed',
          left: rect.left + (rect.width / 2),
          top: rect.top - 12,
          pointerEvents: 'auto',
        }}
        className="suggestions-popover -translate-x-1/2 -translate-y-full mb-2 bg-slate-950/95 border border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(16,185,129,0.2)] z-[10000] w-72 backdrop-blur-md"
      >
        <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest border-b border-white/5 pb-1 flex items-center justify-between">
          <span>Linguistic Pivot</span>
          <button 
            onMouseDown={(e) => { e.preventDefault(); setSuggestionsOpen(false); }}
            className="text-white/40 hover:text-white text-[9px] cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {(['poetic', 'grit', 'heritage'] as const).map((tone) => {
            const list = pivots[tone];
            if (list.length === 0) return null;
            
            const toneColors = {
              poetic: "text-sky-400 bg-sky-500/10 border-sky-500/20",
              grit: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              heritage: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            };

            return (
              <div key={tone} className="space-y-1.5 animate-fade-in">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border inline-block ${toneColors[tone]}`}>
                  {tone}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((suggestion) => (
                    <button
                      key={suggestion}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        
                        const prefix = block.text.slice(0, start);
                        const suffix = block.text.slice(end);
                        const newText = prefix + suggestion + suffix;
                        
                        onUpdate(newText);
                        setSuggestionsOpen(false);
                        setGhostWordInfo(null);
                        
                        toast.success(`Pivoted to ${tone} texture`, {
                          description: `Replaced "${word}" with "${suggestion}"`
                        });
                      }}
                      className="px-2.5 py-1 bg-white/5 hover:bg-emerald-500 hover:text-slate-950 text-white rounded-lg text-[10px] font-mono transition-all cursor-pointer border border-white/5 hover:border-emerald-400"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }, [ghostWordInfo, suggestionsOpen, block.text, onUpdate, readOnly]);

  // Tooltip portal when readOnly is true and a word is selected
  const lockedTooltipPortal = useMemo(() => {
    if (!readOnly || !ghostWordInfo) return null;
    const { rect } = ghostWordInfo;
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 5 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 5 }}
        style={{
          position: 'fixed',
          left: rect.left + (rect.width / 2),
          top: rect.top - 12,
          pointerEvents: 'none',
        }}
        className="fixed -translate-x-1/2 -translate-y-full mb-1 bg-slate-950/95 border border-red-500/30 text-rose-400 font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md z-[10000] whitespace-nowrap flex items-center gap-1.5"
      >
        <Lock className="w-3 h-3 text-red-400 animate-pulse" />
        Unlock editor to edit this script
      </motion.div>
    );
  }, [ghostWordInfo, readOnly]);

  const directiveRanges = useMemo(() => {
    if (!block.text) return [];
    const regex = /\[(?:archive|visual|b-roll|cue):?\s*([^\]]+)\]/gi;
    const ranges: { start: number; end: number; content: string }[] = [];
    let match;
    while ((match = regex.exec(block.text)) !== null) {
      ranges.push({
        start: match.index,
        end: regex.lastIndex,
        content: match[1]
      });
    }
    return ranges;
  }, [block.text]);

  const directivePortals = useMemo(() => {
    if (readOnly) return null;
    let charOffset = 0;
    return tokens.map((token: string, idx: number) => {
      const tokenId = `${block.id}-${idx}`;
      const rect = rects[tokenId];
      const tokenLength = token.length;
      
      const overlap = directiveRanges.find(r => 
        (charOffset >= r.start && charOffset < r.end) || 
        (charOffset + tokenLength > r.start && charOffset + tokenLength <= r.end)
      );
      
      const isDirectiveStart = overlap && charOffset === overlap.start;
      charOffset += tokenLength;
      
      if (!isDirectiveStart || !rect || rect.width === 0) return null;
      
      return (
        <Tooltip key={`dir-badge-${tokenId}`}>
          <TooltipTrigger asChild>
            <div
              style={{
                position: 'fixed',
                left: rect.left,
                top: rect.top - 20,
                pointerEvents: 'auto',
                zIndex: 9999,
                cursor: 'help'
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[8px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.3)] select-none animate-fade-in"
            >
              <span>🎬 Visual Cutaway</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-950/95 border border-emerald-500/30 shadow-2xl backdrop-blur-md px-3 py-2 rounded-xl z-[10000] max-w-xs leading-relaxed">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Directorial Video Cue</span>
              <p className="text-[9px] text-zinc-300 font-sans">
                This is a suggestion for a visual cutaway (B-roll footage) during your memory. It will be filtered out of your spoken prompter during recording.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    });
  }, [tokens, directiveRanges, rects, block.id, readOnly]);

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
          <TooltipProvider delayDuration={300}>
            <div className="fixed inset-0 pointer-events-none z-[9999]">
              {portalContent}
              {pivotPortalContent}
              {directivePortals}
              <AnimatePresence>
                {sparkleTriggerPortal}
              </AnimatePresence>
              <AnimatePresence>
                {suggestionsPortal}
              </AnimatePresence>
              <AnimatePresence>
                {lockedTooltipPortal}
              </AnimatePresence>
            </div>
          </TooltipProvider>,
          document.body
        )}

        <textarea
          ref={editorRef}
          value={block.text}
          onChange={(e) => onUpdate(e.target.value)}
          onPaste={handlePaste}
          onFocus={onFocus}
          onBlur={(e) => {
            setSuggestionsOpen(false);
            setGhostWordInfo(null);
            onBlur?.(e);
          }}
          onSelect={handleCaretOrSelectionChange}
          onKeyUp={handleCaretOrSelectionChange}
          onMouseUp={handleCaretOrSelectionChange}
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
          {(() => {
            let charOffset = 0;
            return tokens.map((token: string, idx: number) => {
              const clean = token.toLowerCase();
              const isAnchor = !hideAnchors && anchors.some(a => a.word.toLowerCase() === clean);
              
              const cleanCleaned = clean.trim().replace(/[^\w]/g, '');
              const pivotInfo = getActivePivotInfo(cleanCleaned);
              const isPivoted = pivotInfo !== null && cleanCleaned !== pivotInfo.root;
              const pivotTone = pivotInfo?.tone;

              const tokenId = `${block.id}-${idx}`;
              const isGhosted = ghostWordInfo?.tokenIndex === idx;

              const tokenLength = token.length;
              const overlap = directiveRanges.find(r => 
                (charOffset >= r.start && charOffset < r.end) || 
                (charOffset + tokenLength > r.start && charOffset + tokenLength <= r.end)
              );
              const isDirective = !!overlap;
              charOffset += tokenLength;

              return (
                <span 
                  key={tokenId}
                  data-token-id={tokenId}
                  className={cn(
                    isAnchor && "anchor-span border-b-2 border-emerald-500/50 bg-emerald-500/5",
                    isPivoted && "pivot-span border-b-2",
                    isPivoted && pivotTone === 'poetic' && "border-sky-500/50 bg-sky-500/5 text-sky-200",
                    isPivoted && pivotTone === 'grit' && "border-amber-500/50 bg-amber-500/5 text-amber-200",
                    isPivoted && pivotTone === 'heritage' && "border-emerald-500/50 bg-emerald-500/5 text-emerald-200",
                    isGhosted && "bg-emerald-400/20 border-b border-emerald-400 animate-pulse rounded-md px-0.5",
                    isDirective && "directive-span text-emerald-400/40 bg-emerald-500/5 italic font-mono decoration-dotted border-b border-emerald-500/20"
                  )}
                >
                  {token}
                </span>
              );
            });
          })()}
        </div>
      </div>
    </motion.div>
  );
});

SentenceWrapper.displayName = 'SentenceWrapper';
