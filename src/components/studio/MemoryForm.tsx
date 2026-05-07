import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scriptorium } from './Scriptorium/Scriptorium';
import { SentenceWrapper } from './Scriptorium/SentenceWrapper';
import { ScriptBlock } from '@/types';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  PenTool, Mic, Sparkles, MapPin, Calendar, Tag, ArrowRight, ArrowLeft, 
  Save, Rocket, AlertCircle, Loader2, Edit3, ChevronRight, ChevronDown, Maximize2, 
  Trash2, Plus, Info, Layout, Layers, Wand2, Music, Wind, Coffee, Zap,
  FileText, Film, Image as ImageIcon, Video, Heart, Share2, MoreHorizontal, Square, History, UserCircle
} from 'lucide-react';
import { Memory, SensoryPromptTemplate, ActionResponse, CatalystType } from '@/types';
import { useDictionary } from '@/hooks/use-dictionary';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CinemaPoster } from '@/components/memory/CinemaPoster';
import { analyzeSentiment, PulseState } from '@/utils/sentimentScore';
import { polishDescription, expandWithAI, getAtmosphericPolish } from '@/actions/aiWeaver';
import { publishMemoryAction, unpublishMemoryAction } from '@/actions/memoryActions';
import { useStudioState } from '@/hooks/useStudioState';
import { useStudioState as useGlobalStudioState } from '@/hooks/studio/useStudioState';
import { DirectorNoteDrawer } from './DirectorNoteDrawer';
import { cn } from '@/lib/utils';
import { useDirectorInk, getAnchorAtCaret } from '@/hooks/studio/useDirectorInk';
import { useProductionCharge } from '@/hooks/studio/useProductionCharge';
import { usePrimaryFocus } from '@/hooks/studio/usePrimaryFocus';
import { MentorshipHotspot } from './MentorshipHotspot';

const SEED_CATALOG: Record<string, string[]> = {
  'p1': [
    "The kitchen was always thick with the aroma of my mother's cooking...",
    "We sat at the dinner table, the air filled with the familiar sounds of our language...",
    "I ran my fingers over the family heirloom, feeling its unique texture..."
  ],
  'p2': [
    "The smell of the living room was a mixture of old carpet and wood polish...",
    "Outside the window, I could always hear the distant sounds of the neighborhood...",
    "The front door handle felt cold and familiar, marking the boundary of my world..."
  ],
  'p3': [
    "The scent of old schoolbooks always brings back the feeling of...",
    "In the distance, the sounds of the playground echoed like...",
    "I still remember the texture of my favorite toy, a comfort in the quiet moments..."
  ],
  'generic': [
    "The first thing I remember about this moment was the lighting...",
    "I can still hear the ambient hum of the background...",
    "There was a specific texture to the air that day..."
  ]
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const YEARS = Array.from({ length: 100 }, (_, i) => (2026 - i).toString());

const ACT_TITLES = [
  "Act I: The Inciting Memory",
  "Act II: The Deep Weave",
  "Act III: The Sensory Capture",
  "Act IV: The Final Cut",
  "Act V: The Premiere"
];


interface MemoryFormProps {
  data: Partial<Memory>;
  update: (data: Partial<Memory>) => void;
  productionStage?: number;
  setProductionStage?: (stage: number) => void;
  modality?: 'pen' | 'voice' | null;
  setModality?: (val: 'pen' | 'voice' | null) => void;
  forceAct?: string;
  onWordCountChange?: (count: number) => void;
  mentorActive?: boolean;
  onToggleMentor?: (manual?: boolean) => void;
  onClarityChange?: (clarity: number) => void;
  highlightClarity?: boolean;
  onboardingJustClosed?: boolean;
  isUntouched?: boolean;
  onActivity?: () => void;
}

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RequiredIndicator = () => (
  <span className="ml-2 text-[9px] font-black text-rose-500/60 uppercase tracking-[0.2em]">
    * Required
  </span>
);

const StudioSelect = ({ 
  value, 
  onChange, 
  items, 
  placeholder = "-" 
}: { 
  value: string, 
  onChange: (v: string) => void, 
  items: { value: string, label: string }[], 
  placeholder?: string 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<string | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedItem = items.find(i => i.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.3em] text-white hover:text-emerald-400 transition-all focus:outline-none min-w-[32px] justify-start"
      >
        <span className={cn(value === 'none' && "text-white/20")}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDown className={cn("w-3 h-3 text-white/20 transition-transform duration-300", isOpen && "rotate-180 text-emerald-400")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 mt-3 z-[100] min-w-[120px] max-h-64 overflow-y-auto bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 custom-scrollbar"
          >
            <div className="p-1.5 space-y-0.5">
              <button
                type="button"
                onClick={() => { onChange('none'); setIsOpen(false); }}
                className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:bg-white/5 hover:text-white/60 rounded-lg transition-all"
              >
                {placeholder}
              </button>
              {items.map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => { onChange(item.value); setIsOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-between group",
                    value === item.value 
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]" 
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {item.label}
                  {value === item.value && (
                    <motion.div 
                      layoutId="active-dot"
                      className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MemoryForm: React.FC<MemoryFormProps> = ({ 
  data, 
  update, 
  modality: propModality, 
  setModality: propSetModality, 
  onWordCountChange,
  productionStage = 0,
  setProductionStage,
  forceAct,
  mentorActive,
  onToggleMentor,
  onClarityChange,
  highlightClarity,
  onboardingJustClosed,
  isUntouched,
  onActivity
}) => {
  const router = useRouter();
  // Lifted state management: use props if provided, otherwise local state
  const [internalModality, setInternalModality] = useState<'pen' | 'voice' | null>(data?.modality || null);
  const modality = propModality !== undefined ? propModality : internalModality;
  const setModality = propSetModality || setInternalModality;

  // THE INVISIBLE GUIDE: Focus the primary input for Act I
  // We use a callback ref to handle asynchronous mounting during transitions.
  const storyHookFocusRef = usePrimaryFocus(productionStage === 0 && modality !== null, 300, modality);
  const storyHookRef = useRef<HTMLTextAreaElement | null>(null);
  const lastPolishedRef = useRef<string>(data?.description || '');
  
  const setStoryHookRef = useCallback((node: HTMLTextAreaElement | null) => {
    storyHookRef.current = node;
    storyHookFocusRef(node);
  }, [storyHookFocusRef]);

  // ONBOARDING: Focus Handshake
  useEffect(() => {
    if (highlightClarity && storyHookRef.current) {
      // 50ms buffer to ensure overlay is gone and browser is ready
      const timer = setTimeout(() => {
        storyHookRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [highlightClarity]);

  // ONBOARDING: Narrative Seed Injection Handshake
  useEffect(() => {
    if (onboardingJustClosed) {
      const promptId = data?.promptId || 'generic';
      const seeds = SEED_CATALOG[promptId] || SEED_CATALOG['generic'];
      
      // Inject the seeds into the Script Supervisor HUD
      setAtmosphericSuggestions(seeds);
      
      toast("Director's Seeds Injected", {
        description: "The Script Supervisor has prepared some atmospheric takes.",
        icon: <History className="w-4 h-4 text-emerald-400" />
      });
    }
  }, [onboardingJustClosed, data?.promptId]);
  const [title, setTitle] = useState(data?.title || '');
  const [description, setDescription] = useState(data?.description || '');
  const [location, setLocation] = useState(data?.location || '');
  const [country, setCountry] = useState(data?.country && data.country !== 'none' ? data.country : '');
  const [tags, setTags] = useState<string[]>(data?.tags || []);
  const [day, setDay] = useState(data?.dateComponents?.day || 'none');
  const [month, setMonth] = useState(data?.dateComponents?.month || 'none');
  const [year, setYear] = useState(data?.dateComponents?.year || 'none');
  const [isDictating, setIsDictating] = useState(false);
  const [isPolishingDesc, setIsPolishingDesc] = useState(false);
  const [activeWhisper, setActiveWhisper] = useState<any>(null);

  const handleCaretUpdate = useCallback((e: any) => {
    const index = e.target.selectionStart;
    const anchor = getAnchorAtCaret(description, index);
    setActiveWhisper(anchor);
  }, [description]);
  const [appliedCatalysts, setAppliedCatalysts] = useState<CatalystType[]>([]);
  const [lastAppliedType, setLastAppliedType] = useState<CatalystType | null>(null);
  
  const { actions: globalActions, activeDrawer, pendingAnchor, draggingCatalyst } = useGlobalStudioState();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [prevDescription, setPrevDescription] = useState<string | null>(null);
  const [lastFocusedField, setLastFocusedField] = useState<'title' | 'description' | 'script' | 'metadata' | 'location' | null>(null);
  const [scriptBlocks, setScriptBlocks] = useState<ScriptBlock[]>(data?.scriptBlocks || []);
  
  // Poster State
  const [usePoster, setUsePoster] = useState(data?.usePoster ?? true);
  const [posterStyle, setPosterStyle] = useState(data?.posterStyle || 'cinematic');
  const [chapterTitle, setChapterTitle] = useState(data?.chapterTitle || '');
  const [director, setDirector] = useState(data?.credits?.director || '');
  const [producer, setProducer] = useState(data?.credits?.producer || '');
  const [starring, setStarring] = useState(data?.credits?.starring || '');
  const [billingLine, setBillingLine] = useState(data?.credits?.billingLine || 'A Chronicle Cinema Production');
  const [posterImageUrl, setPosterImageUrl] = useState(data?.posterImageUrl || '');
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  // Sensory State
  const [sensoryValues, setSensoryValues] = useState<Record<string, string>>(data?.sensory || {});
  const [isExpanding, setIsExpanding] = useState(false);
  
  // UI States
  const [isGuideFullyClosed, setIsGuideFullyClosed] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [atmosphericSuggestions, setAtmosphericSuggestions] = useState<string[]>(data?.atmosphericSuggestions || []);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isSaturated, setIsSaturated] = useState(false);

  const lastPropsId = useRef(data?.id || data?.promptId);
  const lastPromptId = useRef(data?.promptId);

  // CRITICAL: Sync local state when external data changes (e.g. Mentor injection)
  useEffect(() => {
    const currentId = data?.id || data?.promptId;
    const currentPromptId = data?.promptId;
    
    // NAVIGATION VS TRANSITION: 
    // Navigation is when we move to a different prompt (different story).
    // Transition is when we are in the same prompt but just got an ID (assigned after first save).
    const isPromptChange = currentPromptId !== lastPromptId.current;
    const isNavigation = isPromptChange; // Only reset if the actual prompt changed

    if (isNavigation) {
      console.log(`[MemoryForm] Prompt change detected (${lastPromptId.current} -> ${currentPromptId}). Resetting state.`);
      if (data?.title !== undefined) setTitle(data.title);
      if (data?.description !== undefined) setDescription(data.description);
      if (data?.location !== undefined) setLocation(data.location);
      if (data?.country !== undefined) setCountry(data.country);
      if (data?.tags !== undefined) setTags(data.tags);
      if (data?.dateComponents) {
        setDay(data.dateComponents.day || 'none');
        setMonth(data.dateComponents.month || 'none');
        setYear(data.dateComponents.year || 'none');
      }
      if (data?.scriptBlocks) setScriptBlocks(data.scriptBlocks);
      if (data?.chapterTitle !== undefined) setChapterTitle(data.chapterTitle);
      if (data?.posterStyle) setPosterStyle(data.posterStyle);
      
      lastPropsId.current = currentId;
      lastPromptId.current = currentPromptId;
      return;
    }

    // Update refs without returning so incremental sync can still happen if needed
    lastPropsId.current = currentId;
    lastPromptId.current = currentPromptId;


    // Incremental Sync (Protect active fields)
    if (data?.title !== undefined && data.title !== title && lastFocusedField !== 'title') setTitle(data.title);
    
    // THE "SPLIT-BRAIN" SHIELD: Only sync if it's a major change or we aren't focused.
    // We use a ref to preserve cursor position during these forced syncs.
    // If we are focused on 'description', we SHIELD it from background updates to prevent cursor jumps and data loss.
    const isFocusedOnDescription = lastFocusedField === 'description';
    const isMajorChange = data?.description && Math.abs(data.description.length - (description?.length || 0)) > 50;

    if (data?.description !== undefined && data.description !== description && (!isFocusedOnDescription || isMajorChange)) {
       console.log("[MemoryForm] Shielded Sync: Overwriting description from external update (Major Change).");
       const textarea = storyHookRef.current;
       const start = textarea?.selectionStart;
       const end = textarea?.selectionEnd;
       
       setDescription(data.description);
       
       // Restore focus/selection after sync if possible
       setTimeout(() => {
         if (textarea && start !== undefined && end !== undefined) {
           textarea.setSelectionRange(start, end);
         }
       }, 0);
    }

    if (data?.location !== undefined && data.location !== location && lastFocusedField !== 'metadata') setLocation(data.location);
    if (data?.country !== undefined && data.country !== country && lastFocusedField !== 'metadata') setCountry(data.country);
    
    if (data?.dateComponents && lastFocusedField !== 'metadata') {
      if (data.dateComponents.day !== undefined && data.dateComponents.day !== day) setDay(data.dateComponents.day);
      if (data.dateComponents.month !== undefined && data.dateComponents.month !== month) setMonth(data.dateComponents.month);
      if (data.dateComponents.year !== undefined && data.dateComponents.year !== year) setYear(data.dateComponents.year);
    }

    if (data?.scriptBlocks && JSON.stringify(data.scriptBlocks) !== JSON.stringify(scriptBlocks)) {
       // Only sync blocks if we aren't editing script content
       if (lastFocusedField !== 'script') {
          setScriptBlocks(data.scriptBlocks);
       }
    }
  }, [data, lastFocusedField, title, description, location, scriptBlocks]);

  // LOCAL STORAGE FAIL-SAFE: Backup the Story Hook locally in case of refresh/restart
  useEffect(() => {
    if (!description || description.length < 5) return;
    const id = data?.id || data?.promptId || 'unknown';
    localStorage.setItem(`draft_hook_${id}`, description);
  }, [description, data?.id, data?.promptId]);

  // Recovery on Mount
  useEffect(() => {
    const id = data?.id || data?.promptId || 'unknown';
    const backup = localStorage.getItem(`draft_hook_${id}`);
    if (backup && (!description || description.length < 2)) {
       console.log("[MemoryForm] Recovering Story Hook from local backup.");
       setDescription(backup);
    }
  }, []);

  const { isDirectorOpen, setIsDirectorOpen } = useStudioState(data?.prose || '');
  
  // Create refs for sensory inputs to allow programmatic focus
  const sensoryRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  
  // Refactored Dictation: Append to Story Hook only
  const { interimTranscript, isListening, startListening, stopListening, resetTranscript } = useDictionary((finalText) => {
    if (isDictating && productionStage === 0) {
      setDescription(prev => {
        const spacer = (prev && !prev.endsWith(' ') && !prev.endsWith('\n')) ? ' ' : '';
        return prev + spacer + finalText.trim();
      });
    }
  });

  // Logic: Act-Aware Sidebar Automation (respecting forceAct prop)
  useEffect(() => {
    if (forceAct === 'sensory') globalActions.setActiveDrawer('sensory');
    else if (forceAct === 'poster') globalActions.setActiveDrawer('poster');
  }, [forceAct, globalActions]);

  // THE PRELUDE: Sensory Anchor Auto-Injection
  useEffect(() => {
    if (pendingAnchor && activeDrawer === 'sensory') {
      const { text: word, type } = pendingAnchor;
      
      // 1. Inject the word if the field is empty or just has placeholders
      setSensoryValues(prev => ({
        ...prev,
        [type]: prev[type] ? `${prev[type]}, ${word}` : word
      }));

      // 2. Focus and select the field after a micro-task to ensure DOM is ready
      setTimeout(() => {
        const el = sensoryRefs.current[type];
        if (el) {
          el.focus();
          // Select the newly added word
          const val = el.value;
          const start = val.lastIndexOf(word);
          if (start !== -1) {
            el.setSelectionRange(start, start + word.length);
          }
        }
        // 3. Clear the pending state so it doesn't re-fire
        globalActions.clearPendingAnchor();
      }, 50);

      toast("Anchor Prime-Loaded", {
        description: `"${word}" has been injected into your ${type} catalyst.`,
        icon: <Sparkles className="w-4 h-4 text-emerald-400" />
      });
    }
  }, [pendingAnchor, activeDrawer, globalActions]);

  // Auto-start dictation when modality is 'voice'
  const hasAutoStartedDictation = useRef(false);

  useEffect(() => {
    if (modality === 'voice' && !hasAutoStartedDictation.current && !isListening && productionStage === 0) {
      startListening();
      setIsDictating(true);
      hasAutoStartedDictation.current = true;
      toast("Sonic Modality Active", {
        description: "Microphone activated. Your voice is now the scribe's ink.",
        icon: <Mic className="w-4 h-4 text-amber-500" />
      });
    }
  }, [modality, isListening, startListening, productionStage]);

  // Smart Context-Aware Auto Shutdown
  useEffect(() => {
    if (modality !== 'voice' || productionStage !== 0) {
      if (isListening) {
        stopListening();
        setIsDictating(false);
        hasAutoStartedDictation.current = false; // allow re-trigger if they return
      }
    }
  }, [modality, productionStage, isListening, stopListening]);

  // Dynamic Global Cursor based on Modality
  useEffect(() => {
    const penCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2338bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>') 2 2, auto`;
    const micCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>') 12 12, auto`;

    if (modality === 'pen') {
      document.body.style.cursor = penCursor;
    } else if (modality === 'voice') {
      document.body.style.cursor = micCursor;
    } else {
      document.body.style.cursor = 'auto';
    }

    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [modality]);

  // We removed the old transcript effect since we now append via the onFinalize callback above.

  const toggleDictation = () => {
    if (isListening) {
      stopListening();
      setIsDictating(false);
    } else {
      resetTranscript();
      startListening();
      setIsDictating(true);
      toast("Sonic Modality Active", {
        description: "Your voice is now the scribe's ink.",
        icon: <Mic className="w-4 h-4 text-amber-500" />
      });
    }
  };

  // FAIL-SAFE: Ensure dragging state is cleared if the user releases anywhere
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (draggingCatalyst) {
        globalActions.setDraggingCatalyst(null);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [draggingCatalyst, globalActions]);

  const handleToggleColumn = (col: 'sensory' | 'poster' | null) => {
    globalActions.setActiveDrawer(activeDrawer === col ? null : col as any);
    if (col !== null) {
      setIsGuideFullyClosed(false);
      globalActions.setDrafting(false); // Signal "Production Mode"
    }
  };


  useEffect(() => {
    setWordCount(description.trim() ? description.trim().split(/\s+/).length : 0);
  }, [description]);

  useEffect(() => {
    if (productionStage === 0) {
      const count = description.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(count);
      onWordCountChange?.(count);
    }
  }, [description, onWordCountChange, productionStage]);

  const handleRejuvenatePoster = async () => {
    setIsGeneratingPoster(true);
    try {
      // In a real app, this calls an API to analyze tags/description and pick/generate an image
      // Here we simulate a polish to the metadata
      setChapterTitle(title || "The Unspoken Chapter");
      setBillingLine(`A Chronicle Cinema Production • Filmed on location in ${location || 'the mind'}`);
      
      toast.success("Poster Rejuvenated", {
        description: "AI has polished your theatrical metadata based on the story's soul."
      });
    } catch (error) {
      toast.error("Poster AI Failed", { description: "The theatrical agent is busy. Try again later." });
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const handleSensoryChange = (id: string, value: string) => {
    setSensoryValues((prev: Record<string, string>) => ({ ...prev, [id]: value }));
  };

  const defaultSensoryConfig: SensoryPromptTemplate[] = [
    { id: 'aroma', label: 'Aroma', placeholder: 'e.g. Pine needles, rain...' },
    { id: 'soundscape', label: 'Soundscape', placeholder: 'e.g. Distant thunder...' },
    { id: 'texture', label: 'Texture', placeholder: 'e.g. Rough bark...' }
  ];
  const sensoryConfigToUse = (data?.sensoryConfig && data.sensoryConfig.length > 0) ? data.sensoryConfig : defaultSensoryConfig;
  
  const [pulse, setPulse] = useState<PulseState>('neutral');

  const { decoratedHtml: descDecorated, detectedAnchors: descAnchors } = useDirectorInk(description || '');
  const { totalCharge: descCharge, isReady: isDescReady } = useProductionCharge({ 
    text: description || '', 
    anchors: descAnchors 
  });

  // Hot Clarity Bridge: Update parent immediately for real-time control bar feedback
  useEffect(() => {
    onClarityChange?.(descCharge);
  }, [descCharge, onClarityChange]);

  const handlePolishDescription = useCallback(async (sensoryType?: CatalystType | 'polish', value?: string) => {
    if (value) {
      // Direct Injection Mode: Append the specific evocative detail
      setDescription(prev => prev.trim() + " " + value);
      
      if (sensoryType && sensoryType !== 'polish' && !appliedCatalysts.includes(sensoryType)) {
        setAppliedCatalysts(prev => [...prev, sensoryType]);
        setLastAppliedType(sensoryType);
        setTimeout(() => setLastAppliedType(null), 1500);
      }

      toast(`Infused ${sensoryType?.toUpperCase() || 'Catalyst'}`, {
        description: `"${value}" has been anchored to your story.`,
        icon: <Sparkles className="w-4 h-4 text-emerald-400" />
      });
      return;
    }

    if (isPolishingDesc) return;
    
    // Catalysts can be applied even if the full polish threshold isn't met
    const isFullPolish = !sensoryType || sensoryType === 'polish';
    if (isFullPolish && !isDescReady) return;
    
    // Saturation Check: Prevent redundant polishing for already infused layers
    if (sensoryType && sensoryType !== 'polish' && appliedCatalysts.includes(sensoryType)) {
      setIsSaturated(true);
      setTimeout(() => setIsSaturated(false), 1000);
      toast("Sensory Saturation Reached", {
        description: `This beat is already rich with ${sensoryType} details. Drag Soundscape or Texture to further deepen the memory.`,
        icon: <Zap className="w-4 h-4 text-amber-500" />
      });
      return;
    }
    
    setIsPolishingDesc(true);
    setIsDirectorOpen(true); // Reveal the Director's Note drawer
    setPrevDescription(description); // Store original for revert
    try {        const snapshotBeforePolish = description;
        const polishOptions = sensoryType && sensoryType !== 'polish' ? { sensoryFocus: sensoryType } : {};
        const polished = await polishDescription(description, polishOptions);
        
        // COLLISION PROTECTION: Only apply AI polish if the user hasn't typed anything new
        if (description === snapshotBeforePolish) {
           setDescription(polished);
        } else {
           console.log("[MemoryForm] AI Polish Collision Detected: User typed during AI processing. Discarding AI result to protect local work.");
           // We keep the prevDescription for the toast so they can still see what it WAS, 
           // but we don't overwrite the fresh work.
        }

        // Fetch Atmospheric Suggestions if not already present
        if (atmosphericSuggestions.length === 0) {
          setIsFetchingSuggestions(true);
          getAtmosphericPolish(polished).then(suggestions => {
            setAtmosphericSuggestions(suggestions);
            setIsFetchingSuggestions(false);
          }).catch(() => setIsFetchingSuggestions(false));
        }
        toast(`Applied ${sensoryType && sensoryType !== 'polish' ? sensoryType.toUpperCase() : 'AI'} Polish`, {
          description: sensoryType && sensoryType !== 'polish' 
            ? `Narrative Architect has infused your hook with ${sensoryType} details.`
            : "Narrative Architect has refined your hook.",
          action: { label: "Revert", onClick: () => { setDescription(prevDescription || description); setPrevDescription(null); } }
       });
    } catch (error: any) {
       console.error("Failed to polish description:", error);
       toast.error("AI Polish Failed", { 
         description: error.message || "The Narrative Architect is currently offline. Please try again." 
       });
    } finally {
       setIsPolishingDesc(false);
    }
  }, [description, isDescReady, isPolishingDesc, setIsDirectorOpen, setPrevDescription, setDescription, prevDescription]);

  // Bridge the latest polishing logic to the stable dispatcher registration
  const polishCallbackRef = useRef(handlePolishDescription);
  useEffect(() => {
    polishCallbackRef.current = handlePolishDescription;
  }, [handlePolishDescription]);

  useEffect(() => {
    globalActions.setAppliedCatalysts(appliedCatalysts);
  }, [appliedCatalysts, globalActions]);

  useEffect(() => {
    const dispatcher = globalActions.setDispatcher;
    if (!dispatcher) return;

    if (productionStage === 0) {
      dispatcher({
        addCatalyst: (blockId, type, value) => {
          if (blockId === 'story-hook') {
            // Always call the latest version through the ref
            polishCallbackRef.current(type, value);
            return { collisionDetected: true };
          }
          return { collisionDetected: false };
        }
      });
    }
    
    return () => {
      if (productionStage === 0) {
        dispatcher(undefined);
      }
    };
  }, [productionStage, globalActions.setDispatcher]);

  useEffect(() => {
    const content = scriptBlocks.map(b => b.text).join(' ');
    const result = analyzeSentiment(content);
    setPulse(result.state);
  }, [scriptBlocks]);

  // THE LIVE SCRIPT SUPERVISOR: Updates suggestions based on your typing
  useEffect(() => {
    if (!description || description.length < 20 || description === lastPolishedRef.current) return;

    const analyzeHandler = setTimeout(async () => {
       setIsFetchingSuggestions(true);
       try {
         const suggestions = await getAtmosphericPolish(description);
         setAtmosphericSuggestions(suggestions);
         lastPolishedRef.current = description;
       } catch (err) {
         console.error("Supervisor failed to listen:", err);
       } finally {
         setIsFetchingSuggestions(false);
       }
    }, 2500); // 2.5s pause in typing triggers the supervisor

    return () => clearTimeout(analyzeHandler);
  }, [description]);

  // Auto-save effect
  useEffect(() => {
    // Incrementally save state to avoid loss on navigation
    // This is a "Soft Save" - real persistence happens on explicit 'Update' or 'Close'
    const handler = setTimeout(() => {
      const hasChanged = 
        title !== (data?.title || '') ||
        description !== (data?.description || '') ||
        location !== (data?.location || '') ||
        country !== (data?.country || '') ||
        day !== (data?.dateComponents?.day || 'none') ||
        month !== (data?.dateComponents?.month || 'none') ||
        year !== (data?.dateComponents?.year || 'none') ||
        JSON.stringify(scriptBlocks) !== JSON.stringify(data?.scriptBlocks || []) ||
        chapterTitle !== (data?.chapterTitle || '') ||
        posterStyle !== (data?.posterStyle || 'cinematic') ||
        director !== (data?.credits?.director || '') ||
        producer !== (data?.credits?.producer || '') ||
        starring !== (data?.credits?.starring || '') ||
        JSON.stringify(aiTakes) !== JSON.stringify(data?.aiTakes || null);

      if (hasChanged) {
        update({
          ...data,
          title,
          description,
          location,
          country,
          tags,
          date: (day !== 'none' && month !== 'none' && year !== 'none') ? `${day}-${month === 'none' ? '' : month}-${year}` : '',
          dateComponents: {
             day: day === 'none' ? '' : day, 
             month: month === 'none' ? '' : month, 
             year: year === 'none' ? '' : year 
          },
          scriptBlocks,
          sensory: sensoryValues,
          chapterTitle,
          usePoster,
          posterStyle,
          posterImageUrl,
          credits: {
             director,
             producer,
             starring,
             billingLine
          },
          aiTakes,
          status: data?.status || 'draft'
        });
      }
    }, 1000); // Increased debounce to 1s for better performance

    return () => clearTimeout(handler);
  }, [title, description, location, country, tags, day, month, year, sensoryValues, scriptBlocks, update, data?.status, chapterTitle, usePoster, posterStyle, director, producer, starring, billingLine, posterImageUrl]);

  const [aiTakes, setAiTakes] = useState<{ poetic?: string, direct?: string, nostalgic?: string } | null>(null);


  // --- AI HANDLERS ---
  const handleAIExpand = useCallback(async () => {
    setIsExpanding(true);
    toast("Weaving Script...", {
      description: "The Director is expanding your memory hook into a full narrative sequence.",
      icon: <Sparkles className="w-4 h-4 text-sky-400" />
    });
    
    // Simulating AI delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsExpanding(false);
    toast.success("Script Weaved");
  }, []);

  const handleScriptPolish = useCallback((blockId: string) => {
    handleAIExpand();
  }, [handleAIExpand]);

  const handleScriptWordCount = useCallback((count: number) => {
    if (productionStage === 1) {
      setWordCount(count);
      onWordCountChange?.(count);
    }
  }, [productionStage, onWordCountChange]);

  const handlePublish = async () => {
    if (!data?.id) {
       toast.error("Save Required", { description: "Wait a moment for the initial auto-save to finish." });
       return;
    }
    
    const missingFields = [];
    if (!title?.trim()) missingFields.push("Title");
    if (!description?.trim()) missingFields.push("Description");
    if (year === 'none') missingFields.push("Date (Year required)");
    if (!data?.videoUrl) missingFields.push("Video Recording");

    if (missingFields.length > 0) {
       toast.error("Requirements Missing", { 
         description: `To publish to Cinema, please provide: ${missingFields.join(", ")}.`,
         icon: <AlertCircle className="w-4 h-4 text-white" />,
         className: "text-white"
       });
       return;
    }

    setIsPublishing(true);
    try {
       const res = await publishMemoryAction(data.id);
       if (res.success) {
          toast.success("Success!", { 
            description: "Your memory is now live in the Cinema.",
            icon: <Rocket className="w-4 h-4 text-green-500" />
          });
          update({ ...data, status: 'published' });
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

  const handleRevertToDraft = async () => {
    if (!data?.id) return;
    setIsUnpublishing(true);
    try {
      const res = await unpublishMemoryAction(data.id);
      if (res.success) {
        toast.success("Moved to Draft", { 
          description: "This memory has been removed from the Cinema and returned to Studio drafts.",
          icon: <Edit3 className="w-4 h-4 text-amber-500" />
        });
        update({ ...data, status: 'draft' });
      } else {
        toast.error("Failed to unpublish", { description: res.message });
      }
    } catch (e) {
      toast.error("Error", { description: "An unexpected error occurred." });
    } finally {
      setIsUnpublishing(false);
    }
  };

  // UNSAVED CHANGES WARNING: Prevent accidental data loss on tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isDirty = description !== (data?.description || '');
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [description, data?.description]);

  return (
    <div className="relative w-full z-10 px-8 pb-24 pt-4">
    <LayoutGroup>
      <div className="w-full relative">
        {/* --- PERSISTENT PRODUCTION HEADER --- */}
        {modality !== null && (
          <div className="mb-12 flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.6em]">
              <div className="w-8 h-px bg-emerald-500/30" />
              {ACT_TITLES[productionStage]}
            </div>
            
            <div className="flex items-center gap-4">
              {modality && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md",
                    modality === 'pen' ? "bg-sky-500/10 border-sky-500/30 text-sky-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  )}
                >
                  {modality === 'pen' ? <PenTool className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {modality === 'pen' ? 'Scribe' : 'Vocal'} Mode
                  </span>
                </motion.div>
              )}

              <button 
                onClick={() => setIsDirectorOpen(!isDirectorOpen)}
                className={cn(
                  "p-2 rounded-lg border transition-all flex items-center gap-2 relative pointer-events-auto",
                  isDirectorOpen 
                    ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20",
                  wordCount >= 50 && !isDirectorOpen && "animate-pulse border-emerald-400/50 text-emerald-400"
                )}
              >
                <Sparkles className={cn("w-3.5 h-3.5", wordCount >= 50 && !isDirectorOpen && "text-emerald-400")} />
                <span className="text-[9px] font-black uppercase tracking-widest px-1">Director's Note</span>
                {wordCount >= 50 && !isDirectorOpen && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
                )}
              </button>
            </div>
          </div>
        )}

        <AnimatePresence onExitComplete={() => setIsGuideFullyClosed(true)}>
          <DirectorNoteDrawer 
            isOpen={isDirectorOpen}
            onClose={() => setIsDirectorOpen(false)}
            modality={modality}
            onPolish={handlePolishDescription}
            isPolishing={isPolishingDesc}
            wordCount={wordCount}
            scriptBlocks={scriptBlocks}
          />

          {activeDrawer && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => handleToggleColumn(null)}
                className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150]"
              />
            
            {activeDrawer === 'sensory' && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full lg:w-[450px] z-[1000] flex flex-col shadow-[-20px_0_100px_rgba(0,0,0,0.8)] bg-slate-950/95 backdrop-blur-3xl border-l border-white/10"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-headline text-white italic">Sensory Catalyst</h2>
                      <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.3em]">Atmospheric Deepening</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggleColumn(null)} className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {(sensoryConfigToUse as SensoryPromptTemplate[]).map((config) => (
                    <div key={config.id} className="space-y-4">
                      <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">{config.label}</h3>
                      <textarea 
                        value={sensoryValues[config.id] || ''}
                        onChange={(e) => handleSensoryChange(config.id, e.target.value)}
                        placeholder={config.placeholder}
                        className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white/80 placeholder:text-white/5 focus:border-indigo-500/50 outline-none transition-all text-sm leading-relaxed min-h-[120px] resize-none italic"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeDrawer === 'poster' && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full lg:w-[450px] z-[1000] flex flex-col shadow-[-20px_0_100px_rgba(0,0,0,0.8)] bg-slate-950/95 backdrop-blur-3xl border-l border-white/10"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-headline text-white italic">Theatrical Poster</h2>
                      <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-[0.3em]">Visual Identity</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggleColumn(null)} className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {/* Poster Config UI */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Theatrical Title</h3>
                    <input type="text" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white italic outline-none focus:border-rose-500/50" />
                  </div>
                  {/* Additional poster fields could go here */}
                </div>
              </motion.div>
            )}
          </>
        )}
        </AnimatePresence>

        {/* --- MAIN THEATRICAL STAGES --- */}
        <div className="flex-1 min-w-0 px-4 xl:px-0">
          <AnimatePresence mode="wait">
            {/* ACT 1: THE CORE MEMORY (Title & Visual Hook) */}
            {productionStage === 0 && modality !== null && (
              <motion.div
                key="act-1"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="w-full max-w-4xl mx-auto flex flex-col pt-4 pb-0"
              >


                {/* Centered Scriptorium Content */}
                <div className="flex-1 flex flex-col justify-start space-y-16">
                  <div className="space-y-6">
                    <div className="space-y-2 relative">
                      {mentorActive && (productionStage === 0 || productionStage === 1) && (
                        <MentorshipHotspot 
                          number={1} 
                          label="Title your Remembrance" 
                          className="-top-8 -left-8" 
                        />
                      )}
                      <span className="text-[10px] font-black text-emerald-400/40 uppercase tracking-[0.4em] ml-1 flex items-center">
                        Title <RequiredIndicator />
                      </span>
                      <input 
                        type="text"
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); onActivity?.(); }}
                        onFocus={() => { setLastFocusedField('title'); onActivity?.(); }}
                        placeholder="GIVE YOUR MEMORY A CINEMATIC TITLE..."
                        className="w-full bg-transparent border-none text-4xl lg:text-5xl font-serif text-white/90 placeholder:text-white/5 focus:outline-none focus:ring-0 italic transition-all cursor-[inherit]"
                      />
                    </div>

                    {/* MEMORY ORIGIN & CONTEXT (Act I Metadata) */}
                    <div className="pt-8 border-t border-white/5 space-y-12 relative">
                       <div className="flex items-center gap-6">
                         <div className="px-5 py-1.5 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-[0.4em] rounded-full shadow-[0_5px_15px_rgba(16,185,129,0.3)]">
                            Memory
                         </div>

                         {/* STUDIO MENTOR (PERSISTENT LIFELINE) */}
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <motion.button 
                                 whileHover={{ scale: 1.05 }}
                                 whileTap={{ scale: 0.95 }}
                                 onClick={() => onToggleMentor?.(true)}
                                 className={cn(
                                   "px-5 py-1.5 rounded-full border transition-all flex items-center gap-2 relative group/mentor pointer-events-auto",
                                   mentorActive 
                                     ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                                     : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
                                 )}
                               >
                                 <UserCircle className={cn("w-3.5 h-3.5", mentorActive && "animate-pulse")} />
                                 <span className="text-[9px] font-black uppercase tracking-[0.3em]">Mentor</span>
                                 {mentorActive && (
                                   <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse" />
                                 )}
                               </motion.button>
                             </TooltipTrigger>
                             <TooltipContent side="bottom" className="bg-slate-900 border-white/10 text-[9px] font-black tracking-widest uppercase py-2 px-3">
                                Invoke the Lifeline
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>

                         <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
                       </div>

                       <div className="flex flex-wrap gap-x-16 gap-y-10 pl-2">
                      {/* Location & Country Pair */}
                      <div className="space-y-4">
                         <span className="text-[11px] font-black text-emerald-400/70 uppercase tracking-[0.4em] flex items-center">
                           Memory Coordinates <RequiredIndicator />
                         </span>
                        <div className="flex items-center gap-4 group/meta">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/meta:border-emerald-500/50 transition-all">
                            <MapPin className="w-4 h-4 text-emerald-400/60 group-hover/meta:text-emerald-400 transition-colors" />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">City / Venue</span>
                              <input 
                                value={location}
                                onChange={(e) => { setLocation(e.target.value); onActivity?.(); }}
                                onFocus={() => setLastFocusedField('metadata')}
                                placeholder="WHERE DID IT HAPPEN?"
                                className="bg-transparent border-none text-[11px] font-black uppercase tracking-[0.15em] text-white focus:text-emerald-400 focus:outline-none w-64 placeholder:text-white/40 transition-all"
                              />
                            </div>
                            <div className="w-px h-8 bg-white/5 mx-2" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Country</span>
                              <input 
                                value={country}
                                onChange={(e) => { setCountry(e.target.value); onActivity?.(); }}
                                onFocus={() => setLastFocusedField('metadata')}
                                placeholder="REGION"
                                className="bg-transparent border-none text-[11px] font-black uppercase tracking-[0.15em] text-white focus:text-emerald-400 focus:outline-none w-32 placeholder:text-white/40 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date Cluster */}
                      <div className="space-y-4">
                         <span className="text-[11px] font-black text-emerald-400/70 uppercase tracking-[0.4em] flex items-center">
                           Memory Mark <RequiredIndicator />
                         </span>
                        <div className="flex items-center gap-4 group/meta">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/meta:border-emerald-500/50 transition-all">
                            <Calendar className="w-4 h-4 text-emerald-400/60 group-hover/meta:text-emerald-400 transition-colors" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Day</span>
                              <StudioSelect 
                                value={day} 
                                onChange={(v) => { setDay(v); onActivity?.(); }} 
                                items={DAYS.map(d => ({ value: d, label: d }))} 
                              />
                            </div>
                            <div className="w-px h-8 bg-white/5 mx-1" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Month</span>
                              <StudioSelect 
                                value={month} 
                                onChange={(v) => { setMonth(v); onActivity?.(); }} 
                                items={MONTHS.map((m, i) => ({ 
                                  value: (i + 1).toString(), 
                                  label: m.substring(0, 3).toUpperCase() 
                                }))} 
                              />
                            </div>
                            <div className="w-px h-8 bg-white/5 mx-1" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Year</span>
                              <StudioSelect 
                                value={year} 
                                onChange={(v) => { setYear(v); onActivity?.(); }} 
                                items={YEARS.map(y => ({ value: y, label: y }))} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    {/* Instrument Watermark */}
                    {modality && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-[0.02] mix-blend-screen transition-all duration-1000">
                        {modality === 'pen' ? (
                          <PenTool className="w-64 h-64 -rotate-12 text-sky-400" strokeWidth={0.5} />
                        ) : (
                          <Mic className="w-64 h-64 -rotate-12 text-amber-400" strokeWidth={0.5} />
                        )}
                      </div>
                    )}

                    <div className="relative z-10 space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1 relative">
                              {mentorActive && (productionStage === 0 || productionStage === 1) && (
                                <MentorshipHotspot 
                                  number={2} 
                                  label={productionStage === 0 ? "Cast the Story Hook" : "Infuse your Script"} 
                                  className="top-full mt-4 left-0" 
                                />
                              )}
                              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center">
                                Story Hook <RequiredIndicator />
                              </h3>
                              
                              {/* Director's Lexicon (Legend) */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={cn(
                                      "flex items-center gap-3 transition-all duration-700 cursor-help",
                                      (descAnchors.length > 0) ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 group-focus-within:opacity-100 group-focus-within:translate-y-0"
                                    )}>
                                      <div className={cn("flex items-center gap-1 transition-opacity", descAnchors.some(a => a.type === 'soundscape') ? "opacity-100" : "opacity-40")}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.5)]" />
                                        <span className="text-[7px] font-black text-white/40 uppercase tracking-tighter">Sound</span>
                                      </div>
                                      <div className={cn("flex items-center gap-1 transition-opacity", descAnchors.some(a => a.type === 'visual') ? "opacity-100" : "opacity-40")}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[7px] font-black text-white/40 uppercase tracking-tighter">Visual</span>
                                      </div>
                                      <div className={cn("flex items-center gap-1 transition-opacity", descAnchors.some(a => a.type === 'aroma') ? "opacity-100" : "opacity-40")}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                                        <span className="text-[7px] font-black text-white/40 uppercase tracking-tighter">Aroma</span>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-slate-900 border-white/10 p-3 max-w-xs shadow-2xl z-[200]">
                                    <div className="space-y-2">
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/90">Sensory Insights</h4>
                                      {descAnchors.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {descAnchors.map((anchor, i) => (
                                            <div key={i} className="group/item flex flex-col gap-0.5">
                                              <span className={cn(
                                                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                anchor.type === 'visual' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                                anchor.type === 'soundscape' ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" :
                                                "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                              )}>
                                                {anchor.word}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[9px] text-white/40 italic">Awaiting sensory clarity in your hook...</p>
                                      )}
                                      <p className="text-[8px] text-white/20 uppercase tracking-tighter pt-1 border-t border-white/5">
                                        These anchors bridge your memory to cinematic space.
                                      </p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                           
                           {/* Vocal Command Console */}
                           {modality === 'voice' && productionStage === 0 && (
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full backdrop-blur-sm shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                               <button 
                                 onClick={(e) => {
                                   e.preventDefault();
                                   if (isListening && isDictating) {
                                      stopListening();
                                      setIsDictating(false);
                                   } else {
                                      startListening();
                                      setIsDictating(true);
                                   }
                                 }}
                                 className={cn("p-1.5 rounded-full transition-all flex items-center gap-2", 
                                   isListening && isDictating ? "text-amber-400 bg-amber-500/20" : "text-amber-500/40 hover:text-amber-400 hover:bg-amber-500/10"
                                 )}
                               >
                                 <Mic className={cn("w-3 h-3", isListening && isDictating && "animate-pulse")} />
                                 <span className="text-[8px] font-black uppercase tracking-widest">
                                   {isListening && isDictating ? "Recording" : "Paused"}
                                 </span>
                               </button>
                               
                               <div className="w-px h-3 bg-amber-500/20 mx-1" />
                               
                               <button 
                                 onClick={(e) => { e.preventDefault(); setModality('pen'); }}
                                 title="Switch to Pen Mode"
                                 className="p-1.5 rounded-full hover:bg-amber-500/20 text-amber-500/40 hover:text-amber-400 transition-all flex items-center gap-2"
                               >
                                 <Square className="w-2 h-2" fill="currentColor" />
                                 <span className="text-[8px] font-black uppercase tracking-widest">Off</span>
                               </button>
                             </div>
                           )}

                        <button 
                          onClick={() => handlePolishDescription()}
                          disabled={!isDescReady || isPolishingDesc}
                          className={cn(
                            "group relative flex items-center gap-3 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border overflow-hidden",
                            isDescReady 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" 
                              : "bg-white/10 text-white/80 border-white/10 grayscale",
                            highlightClarity && "animate-pulse border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.4)] bg-emerald-500/20 text-emerald-400"
                          )}
                        >
                           {/* Charge Glow Overlay */}
                           {isDescReady && (
                             <motion.div 
                               className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0"
                               animate={{ x: ['-100%', '200%'] }}
                               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                             />
                           )}

                           {isPolishingDesc ? (
                             <Loader2 className="w-3 h-3 animate-spin" />
                           ) : (
                             <Wand2 className={cn("w-3 h-3 transition-transform", isDescReady && "group-hover:rotate-12")} />
                           )}
                           
                           <span className="relative z-10">
                             {isPolishingDesc ? 'Polishing...' : isDescReady ? 'Apply AI Polish' : `Clarity ${descCharge}%`}
                           </span>

                           {isDescReady && !isPolishingDesc && (
                             <motion.div 
                               className="absolute inset-0 rounded-full border border-emerald-500/50"
                               animate={{ scale: [1, 1.1], opacity: [0.5, 0] }}
                               transition={{ duration: 1.5, repeat: Infinity }}
                             />
                           )}
                        </button>
                      </div>
                    </div>
                      
                      <div className="relative group">
                        {/* THE WHISPER BAR: Cinematic Context */}
                        <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none">
                          <AnimatePresence mode="wait">
                            {activeWhisper ? (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className={cn(
                                  "px-4 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-lg",
                                  activeWhisper.type === 'visual' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                  activeWhisper.type === 'aroma' ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                                  activeWhisper.type === 'soundscape' ? "bg-sky-500/10 border-sky-500/30 text-sky-400" :
                                  "bg-red-500/10 border-red-500/30 text-red-400"
                                )}
                              >
                                <div className="flex items-center gap-2 px-2 py-0.5 rounded-l-full bg-white/10 border-r border-white/10">
                                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                                  <span className="text-[8px] font-black uppercase tracking-tighter">{activeWhisper.type}</span>
                                </div>
                                <span className="text-[9px] font-bold text-white/90 pr-2">
                                  {activeWhisper.reason}
                                </span>
                              </motion.div>
                            ) : (
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <motion.div 
                                       initial={{ opacity: 0 }}
                                       animate={{ opacity: 1 }}
                                       className="px-4 py-1.5 rounded-full border border-white/5 bg-white/5 text-white/20 cursor-help"
                                     >
                                       <span className="text-[9px] font-black uppercase tracking-[0.2em]">The Architect is listening...</span>
                                     </motion.div>
                                   </TooltipTrigger>
                                   <TooltipContent side="top" className="bg-slate-900 border-white/10 text-[9px] font-black tracking-widest uppercase py-2 px-3">
                                      The AI Script Supervisor is analyzing your memory for sensory anchors in real-time.
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                            )}
                          </AnimatePresence>
                        </div>

                <AnimatePresence>
                  {lastAppliedType && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      className={cn(
                        "absolute inset-0 z-50 pointer-events-none rounded-2xl border-2 flex items-center justify-center overflow-hidden",
                        lastAppliedType === 'aroma' ? "border-amber-500/50 bg-amber-500/5" :
                        lastAppliedType === 'soundscape' ? "border-sky-500/50 bg-sky-500/5" :
                        "border-emerald-500/50 bg-emerald-500/5"
                      )}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <Sparkles className={cn(
                          "w-12 h-12",
                          lastAppliedType === 'aroma' ? "text-amber-400" :
                          lastAppliedType === 'soundscape' ? "text-sky-400" :
                          "text-emerald-400"
                        )} />
                        <span className="text-white font-black uppercase tracking-[0.2em] text-xs">
                          {lastAppliedType} Infused
                        </span>
                      </motion.div>
                      
                      {/* Ripple Effect */}
                      <motion.div 
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 4, opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "absolute w-40 h-40 rounded-full border border-current",
                          lastAppliedType === 'aroma' ? "text-amber-500" :
                          lastAppliedType === 'soundscape' ? "text-sky-500" :
                          "text-emerald-500"
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div 
                        data-block-id="story-hook"
                        onClick={() => {
                          if (storyHookRef.current) {
                            storyHookRef.current.focus();
                            // Move cursor to end if clicking empty space
                            const len = storyHookRef.current.value.length;
                            storyHookRef.current.setSelectionRange(len, len);
                          }
                        }}
                        className={cn(
                          "relative transition-all duration-700 rounded-3xl p-8 -mx-8 group/hook min-h-[500px] cursor-text",
                          "hover:bg-white/[0.02] focus-within:bg-white/[0.04]",
                          "ring-1 ring-transparent focus-within:ring-white/10",
                          isSaturated && "ring-4 ring-amber-500/50 bg-amber-500/10 scale-[1.02] shadow-[0_0_60px_rgba(245,158,11,0.2)]",
                          isListening && isDictating && modality === 'voice' && productionStage === 0 && "shadow-[0_0_30px_rgba(251,191,36,0.15)] ring-1 ring-amber-500/30 bg-amber-500/5",
                          mentorActive && productionStage === 0 && "ring-2 ring-emerald-400/50 shadow-[0_0_50px_rgba(16,185,129,0.2)] bg-emerald-500/5 scale-[1.01]",
                          draggingCatalyst && "ring-2 ring-cyan-500/50 bg-cyan-500/5 shadow-[0_0_40px_rgba(6,182,212,0.15)] scale-[1.005]"
                        )}>
                        
                        {/* 0. DROP ZONE OVERLAY */}
                        <AnimatePresence>
                          {draggingCatalyst && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute inset-0 z-50 rounded-3xl flex items-center justify-center bg-cyan-500/5 border-2 border-dashed border-cyan-400/30 backdrop-blur-[2px] pointer-events-none"
                            >
                              <div className="flex flex-col items-center gap-3">
                                <motion.div 
                                  animate={{ y: [0, -10, 0] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                  className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-400/50"
                                >
                                  <Sparkles className="w-6 h-6 text-cyan-400" />
                                </motion.div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 drop-shadow-glow">
                                  {appliedCatalysts.includes(draggingCatalyst as any) 
                                    ? "Sensory Saturation Reached" 
                                    : `Drop to Anchor ${draggingCatalyst.toUpperCase()}`}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {/* 1. THE UNIFIED APEX LAYER (V4.6) */}
                        <div className="relative pointer-events-auto">
                          <SentenceWrapper 
                             ref={setStoryHookRef}
                             block={{ id: 'story-hook', text: description, type: 'hook' }} 
                             isActive={productionStage === 0}
                             onUpdate={(text: string) => {
                               setDescription(text);
                               onActivity?.(); // Reset idle timer
                               // Update first script block title if it's the story hook
                               if (scriptBlocks.length > 0) {
                                 const updatedBlocks = [...scriptBlocks];
                                 updatedBlocks[0] = { ...updatedBlocks[0], text };
                                 setScriptBlocks(updatedBlocks);
                               }
                             }}
                             onFocus={() => setLastFocusedField('description')}
                             onBlur={handleCaretUpdate}
                             actions={globalActions}
                           />
                        </div>
                        {isListening && isDictating && interimTranscript && (
                          <div className="absolute bottom-4 left-4 right-4 p-4 bg-amber-500/10 border-t border-amber-500/20 text-amber-400 font-mono italic text-lg animate-pulse backdrop-blur-md rounded-b-xl pointer-events-none">
                            {interimTranscript}
                          </div>
                        )}
                      </div>
                      
                      {/* SCRIPT SUPERVISOR HUD (Act I Enhancements) */}
                      <AnimatePresence>
                        {atmosphericSuggestions.length > 0 && productionStage === 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              boxShadow: onboardingJustClosed ? [
                                "0 0 0px rgba(16, 185, 129, 0)",
                                "0 0 30px rgba(16, 185, 129, 0.3)",
                                "0 0 0px rgba(16, 185, 129, 0)"
                              ] : "0 0 0px rgba(0,0,0,0)"
                            }}
                            transition={{ 
                              opacity: { duration: 0.4 },
                              y: { duration: 0.4 },
                              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                            }}
                            className="p-8 mt-12 bg-zinc-900/50 border border-emerald-500/20 rounded-[2rem] backdrop-blur-xl relative overflow-hidden group"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50" />
                            <div className="relative z-10 space-y-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all">
                                    <History className="w-5 h-5 text-emerald-400" />
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Script Supervisor</h4>
                                    <p className="text-[8px] text-emerald-400/60 font-mono uppercase tracking-[0.2em]">Atmospheric Enhancements // READY</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Scene Clarity: HIGH</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {atmosphericSuggestions.map((suggestion, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setDescription(prev => isUntouched ? suggestion : prev + "\n\n" + suggestion);
                                      setAtmosphericSuggestions(prev => prev.filter((_, i) => i !== idx));
                                      toast("Enhancement Applied", {
                                        description: "Added to your Story Hook.",
                                        icon: <Sparkles className="w-4 h-4 text-emerald-400" />
                                      });
                                    }}
                                    className="text-left p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group/sug"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <Sparkles className="w-3 h-3 text-emerald-400/40 group-hover/sug:text-emerald-400" />
                                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest group-hover/sug:text-emerald-400/60">Take {idx + 1}</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 group-hover/sug:text-white transition-colors leading-relaxed italic">
                                      "{suggestion}"
                                    </p>
                                  </button>
                                ))}
                              </div>
                              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[8px] text-zinc-500 font-mono italic">Click to weave these sensory anchors into your performance blueprint.</p>
                                <button onClick={() => setAtmosphericSuggestions([])} className="text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-rose-400 transition-colors">Dismiss All</button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
          </motion.div>
        )}

          {/* ACT 2: THE FULL NARRATIVE (Modern Editor) */}
          {productionStage === 1 && (
            <motion.div
              key="act-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl mx-auto flex flex-col pt-4 pb-0"
              >
                {/* Pinned Metadata Header */}
                <div className="mb-12">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.6em]">
                      <div className="w-8 h-px bg-emerald-500/30" />
                      Act II: The Narrative Build
                    </div>
                    
                    {/* Compact Slate for Act II */}
                    <div className="flex items-center gap-8 px-6 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                           <MapPin className="w-3 h-3 text-sky-400/50" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-white/80">{location || 'UNTITLED LOCATION'}</span>
                           {country !== 'none' && country && (
                             <>
                               <span className="text-white/20 text-[9px]">/</span>
                               <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{country}</span>
                             </>
                           )}
                        </div>
                        <div className="flex items-center gap-2">
                           <Calendar className="w-3 h-3 text-amber-400/50" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-white/80">
                             {day !== 'none' ? day : ''} {month !== 'none' ? MONTHS[parseInt(month)-1].substring(0,3) : ''} {year !== 'none' ? year : 'UNDATED'}
                           </span>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Centered Editor Content */}
                <div className="flex-1 flex flex-col justify-start space-y-12">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-4xl font-serif text-white/90 italic flex items-center">
                      Script & Dialogue <RequiredIndicator />
                    </h2>
                    <button 
                      onClick={handleAIExpand}
                      disabled={isExpanding}
                      className="group relative flex items-center gap-4 px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all overflow-hidden"
                    >
                       <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                       {isExpanding ? <Loader2 className="w-5 h-5 animate-spin text-sky-400" /> : <Sparkles className="w-5 h-5 text-sky-400 group-hover:rotate-12 transition-transform" />}
                       <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] relative z-10">Weave Script with AI</span>
                    </button>
                  </div>

                  <div className={cn(
                    "relative scriptorium-fade min-h-[600px] transition-all duration-700 rounded-[2.5rem]",
                    mentorActive && productionStage === 1 && "ring-2 ring-emerald-400/50 shadow-[0_0_50px_rgba(16,185,129,0.2)] bg-emerald-500/5 scale-[1.01] p-4 -m-4"
                  )}>
                    <Scriptorium 
                      data={data} 
                      onSync={setScriptBlocks} 
                      onPolish={handleScriptPolish} 
                      onWordCountChange={handleScriptWordCount}
                      onActivity={onActivity}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ACT 3: SENSORY & METADATA (Contextual Richness) */}
            {productionStage === 2 && (
              <motion.div
                key="act-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full max-w-4xl mx-auto space-y-12 pb-32 pt-4"
              >
                <div className="text-center space-y-4 mb-12">
                    <div className="inline-flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.6em]">
                      <div className="w-8 h-px bg-emerald-500/30" />
                      Act III: Sensory Deepening
                      <div className="w-8 h-px bg-emerald-500/30" />
                    </div>
                    <h2 className="text-6xl font-serif text-white/90 italic">Atmospheric Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {(sensoryConfigToUse as SensoryPromptTemplate[]).map((config: SensoryPromptTemplate) => (
                    <motion.div 
                      key={config.id}
                      whileHover={{ translateY: -5 }}
                      className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 space-y-6 group hover:bg-white/[0.05] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-sky-500/10 group-hover:text-sky-400 transition-all">
                          {config.id === 'aroma' && <Wind className="w-5 h-5" />}
                          {config.id === 'soundscape' && <Music className="w-5 h-5" />}
                          {config.id === 'texture' && <Layers className="w-5 h-5" />}
                        </div>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{config.label}</span>
                      </div>
                        <textarea 
                          ref={el => { sensoryRefs.current[config.id] = el; }}
                          value={sensoryValues[config.id] || ''}
                          onChange={(e) => handleSensoryChange(config.id, e.target.value)}
                          onFocus={() => globalActions.setDrafting(false)}
                          placeholder={config.placeholder}
                          className={cn(
                            "w-full bg-transparent border-none text-white/70 placeholder:text-white/10 focus:outline-none focus:ring-0 text-sm leading-relaxed min-h-[100px] resize-none italic font-mono cursor-[inherit] transition-all",
                            pendingAnchor?.type === config.id && "animate-pulse text-emerald-400"
                          )}
                        />
                    </motion.div>
                  ))}
                </div>

                <div className="p-12 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Location & Country <RequiredIndicator /></span>
                      </div>
                      <div className="flex items-end gap-4">
                        <div className="flex-1">
                          <input 
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="CITY / VENUE"
                            className="w-full bg-transparent border-none text-3xl font-headline text-white placeholder:text-white/5 focus:outline-none focus:ring-0 italic cursor-[inherit]"
                          />
                        </div>
                        <div className="w-px h-8 bg-white/10 mb-2" />
                        <div className="flex-1">
                          <input 
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="COUNTRY"
                            className="w-full bg-transparent border-none text-xl font-headline text-white/40 placeholder:text-white/5 focus:outline-none focus:ring-0 italic cursor-[inherit]"
                          />
                        </div>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Date <RequiredIndicator /></span>
                      </div>
                      <div className="flex gap-4">
                         <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-transparent border-none text-3xl font-headline text-white focus:outline-none focus:ring-0 italic">
                            <option value="none">Year</option>
                            {Array.from({ length: 50 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
                         </select>
                         {/* Simple Day/Month selectors would go here */}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* ACT 4: THE POSTER & PUBLICATION (The Final Reveal) */}
            {productionStage === 3 && (
              <motion.div
                key="act-4"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="w-full max-w-4xl mx-auto flex flex-col gap-24 pb-24 pt-4 items-center"
              >
                <div className="flex-1 space-y-12 max-w-xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.6em]">
                      <div className="w-8 h-px bg-emerald-500/30" />
                      Act IV: The Final Cut
                    </div>
                    <h2 className="text-6xl font-serif text-white/90 italic leading-tight">Prepare for the Premiere</h2>
                    <p className="text-white/40 text-lg leading-relaxed font-serif italic">Your memory has been woven. The credits are set. All that remains is to release it to the world's collective soul.</p>
                  </div>

                  <div className="space-y-8 p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.3em]">Theatrical Credits</h3>
                       <button 
                        onClick={handleRejuvenatePoster}
                        disabled={isGeneratingPoster}
                        className="p-2 text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"
                       >
                         {isGeneratingPoster ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                       </button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest text-white/30 font-black ml-1">Director</label>
                          <input type="text" value={director} onChange={(e) => setDirector(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:border-emerald-500/50 outline-none transition-all font-mono" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest text-white/30 font-black ml-1">Producer</label>
                          <input type="text" value={producer} onChange={(e) => setProducer(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:border-emerald-500/50 outline-none transition-all font-mono" />
                       </div>
                    </div>
                  </div>
                </div>

                <div className="relative group perspective-1000">
                   <div className="absolute -inset-10 bg-sky-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                   <motion.div 
                    whileHover={{ scale: 1.02, rotateY: -10, rotateX: 5 }}
                    className="relative"
                   >
                     <CinemaPoster memory={{ ...data, id: data.id || '', title, chapterTitle, usePoster, posterStyle, posterImageUrl, credits: { director, producer, starring, billingLine } } as Memory} />
                   </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
    </div>
  );
}

// Export removed for named export migration
