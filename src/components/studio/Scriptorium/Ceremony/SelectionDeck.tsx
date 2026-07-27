import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Heart, Film, Eye, ArrowRight, ClipboardCopy, AlertTriangle, RotateCcw, History, BookOpen, ArrowLeft, Award, Check, Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { ScriptLightBox } from './ScriptLightBox';
import { 
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { MentorshipHotspot } from '@/components/studio/MentorshipHotspot';
import { stripScreenplayCues } from '@/lib/sanitizer';

interface SelectionDeckProps {
  drafts: any[];
  onSelect: (text: string, type: string, label: string, structured?: any) => void;
  onPreview: (draft: any) => void;
  selectedText: string;
  originalHook?: string; // Passed from MemoryForm
  isSaving?: boolean;
  onBackToEditor?: () => void;
}

interface SynthesizingOverlayProps {
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}

export const SynthesizingOverlay = ({ error, onRetry, onCancel, title, subtitle }: SynthesizingOverlayProps) => (
  <div className="flex-1 flex flex-col items-center justify-center space-y-12 min-h-[60vh]">
    <div className="relative">
      <motion.div 
        animate={{ rotate: error ? 0 : 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className={cn(
          "w-32 h-32 rounded-full border-2 border-dashed transition-colors duration-500",
          error ? "border-rose-500/40" : "border-emerald-500/20"
        )}
      />
      <motion.div 
        animate={{ rotate: error ? 0 : -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className={cn(
          "absolute inset-0 w-32 h-32 rounded-full border-2 border-dashed scale-125 transition-colors duration-500",
          error ? "border-amber-500/30" : "border-sky-500/20"
        )}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        {error ? (
          <AlertTriangle className="w-10 h-10 text-rose-500 animate-pulse" />
        ) : (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </motion.div>
        )}
      </div>
    </div>
    
    <div className="space-y-4 max-w-sm text-center">
      <h3 className={cn(
        "text-xl font-headline italic transition-colors duration-500",
        error ? "text-rose-400" : "text-white"
      )}>
        {error ? "Thread Tangled" : (title || "Weaving Narrative Pathways")}
      </h3>
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 leading-relaxed">
        {error ? error : (subtitle || "The AI Weaver is interlacing your memories into cinematic script options.")}
      </p>
    </div>
    
    {error && (
      <div className="flex gap-4">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="flex items-center gap-3 px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-xl transition-all"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Re-weave thread</span>
          </button>
        )}
        {onCancel && (
          <button 
            onClick={onCancel}
            className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Cancel</span>
          </button>
        )}
      </div>
    )}
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 0.6,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 120, damping: 18 }
  },
  selected: {
    opacity: 1,
    y: 0,
    scale: 1.02,
    transition: { type: "spring" as const, stiffness: 120, damping: 18 }
  },
  hovered: {
    scale: 1.2,
    opacity: 1,
    zIndex: 100,
    boxShadow: "0 50px 100px -20px rgba(0,0,0,0.9), 0 30px 60px -30px rgba(255,255,255,0.1)",
    transition: { type: "spring" as const, stiffness: 260, damping: 25 }
  },
  dimmed: {
    scale: 0.85,
    opacity: 0,
    zIndex: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 25 }
  }
};

export const SelectionDeck = ({ 
  drafts, 
  onSelect, 
  onPreview, 
  selectedText,
  originalHook = "",
  isSaving = false,
  onBackToEditor
}: SelectionDeckProps) => {
  const { mentorContext, currentStage, selectedVision, selectedTake } = useStudioState();
  const { mentorModeActive } = mentorContext || {};

  const activeVisionKey = selectedVision?.type;
  const activeVisionTitle = selectedVision?.label;
  const activeTakeText = selectedTake || selectedText;

  const isActII = currentStage === 1;
  const headerTitle = isActII ? "The Deep Weave" : "Director's Cut";
  const headerSubtitle = isActII 
    ? "The AI Weaver has synthesised three sensory interpretations of your script" 
    : "The Director has prepared three narrative interpretations of your memory";
  const temporalNoteLabel = isActII 
    ? "Director's Sensory Note" 
    : "Director's Temporal Note";

  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [isCopyingBundle, setIsCopyingBundle] = React.useState(false);

  const getVisionId = (type: string) => {
    if (type.includes("Memory Weave") || type.includes("Master") || type.includes("Crown") || type.includes("Fusion")) return "master";
    if (type.includes("Original") || type.includes("Committed")) return "original";
    if (type.includes("Soul") || type.includes("Poetic")) return "soul";
    if (type.includes("Atmospheric") || type.includes("Direct")) return "sensory";
    if (type.includes("Cinematic") || type.includes("Generational")) return "cinematic";
    return "sensory";
  };

  const copyComparisonBundle = async () => {
    setIsCopyingBundle(true);
    const bundleText = drafts.map(d => {
      return `--- ${d.visionType.toUpperCase()} ---
${d.cleanScript}
`;
    }).join('\n\n');

    const fullBundle = `DIRECTOR'S CUT COMPARISON BUNDLE
Generated: ${new Date().toLocaleString()}

TEMPORAL CONTEXT:
${drafts[0]?.temporalSummary || "N/A"}

ORIGINAL HOOK:
${originalHook}

DRAFT OPTIONS:
${bundleText}`;

    await navigator.clipboard.writeText(fullBundle);
    toast.success("Comparison Bundle Captured", {
      description: "All narrative paths (the polished original and synthesized visions) have been copied."
    });
    setTimeout(() => setIsCopyingBundle(false), 2000);
  };

  const hoveredDraft = drafts.find(d => d.visionType === hoveredId);
  const isOriginalHovered = hoveredDraft && getVisionId(hoveredDraft.visionType) === 'original';
  
  if (!drafts || drafts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 min-h-[60vh] text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
            <Film className="w-8 h-8 text-white/10" />
          </div>
          <motion.div 
            initial={{ opacity: 0.1 }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-4 bg-sky-500/5 blur-2xl rounded-full"
          />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-headline italic text-white/40">The Reel is Empty</h2>
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] max-w-xs leading-relaxed">
            The Director's vision was interrupted. <br/>
            Please try synthesizing again or check your connection.
          </p>
        </div>
      </div>
    );
  }

  const ICONS: Record<string, any> = {
    original: BookOpen,
    soul: Heart,
    sensory: Sparkles,
    cinematic: Film,
    master: Crown
  };

  const AURAS: Record<string, string> = {
    original: 'border-purple-500/30 bg-purple-500/5',
    soul: 'border-amber-500/30 bg-amber-500/5',
    sensory: 'border-sky-500/30 bg-sky-500/5',
    cinematic: 'border-emerald-500/30 bg-emerald-500/5',
    master: 'border-amber-400/50 bg-amber-950/30 shadow-[0_0_50px_rgba(245,158,11,0.25)]'
  };

  const COLORS: Record<string, string> = {
    original: 'text-purple-400',
    soul: 'text-amber-400',
    sensory: 'text-sky-400',
    cinematic: 'text-emerald-400',
    master: 'text-amber-300'
  };

  const isSelectedCard = (opt: any) => {
    const typeId = getVisionId(opt.visionType);
    if (activeVisionTitle && activeVisionTitle.toLowerCase().trim() === (opt.visionType || '').toLowerCase().trim()) return true;
    if (activeVisionKey && (activeVisionKey === typeId || activeVisionKey === opt.visionType)) return true;
    if (activeTakeText && opt.cleanScript && activeTakeText.trim() === opt.cleanScript.trim()) return true;
    if (selectedText && opt.cleanScript && selectedText.trim() === opt.cleanScript.trim()) return true;
    return false;
  };

  return (
    <div 
      data-blueprint="SelectionDeck"
      className="relative flex-1 flex flex-col space-y-16 py-12"
    >
      <AnimatePresence>
        {isOriginalHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 -z-10 pointer-events-none overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12)_0%,transparent_70%)] blur-[80px]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="space-y-4 relative">
          {mentorModeActive && (
            <MentorshipHotspot 
              number={1} 
              label="Review Narrative Interpretations" 
              className="-top-6 -left-6" 
            />
          )}
          <h2 className="text-4xl font-headline italic text-white">{headerTitle}</h2>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">{headerSubtitle}</p>
        </div>

        {activeVisionTitle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto px-6 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-fade-in"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>ACTIVE SENSORY BLUEPRINT: {activeVisionTitle}</span>
          </motion.div>
        )}

        {drafts[0]?.temporalSummary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto px-6 py-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-sm flex items-start gap-4"
          >
            <History className="w-5 h-5 text-emerald-400 mt-1 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{temporalNoteLabel}</span>
              <p className="text-[11px] text-white/60 leading-relaxed italic font-serif">
                "{drafts[0].temporalSummary}"
              </p>
            </div>
          </motion.div>
        )}
        
        <div className="flex items-center gap-4 justify-center flex-wrap">
          {onBackToEditor && (
            <button 
              data-hotspot-id="HS_ACT2_BACK_BTN"
              onClick={onBackToEditor}
              className="flex items-center gap-3 px-6 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-full text-[9px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-all group"
            >
              <ArrowLeft className="w-3 h-3 text-purple-400" />
              <span>Back to Script Editor</span>
            </button>
          )}
          
          <button 
            data-hotspot-id="HS_ACT2_COPY_BUNDLE_BTN"
            onClick={copyComparisonBundle}
            disabled={isCopyingBundle}
            className="flex items-center gap-3 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all group"
          >
            {isCopyingBundle ? (
              <span className="text-emerald-400">Bundle Captured</span>
            ) : (
              <>
                <span>Copy Comparison Bundle</span>
                <ClipboardCopy className="w-3 h-3 opacity-40 group-hover:opacity-100" />
              </>
            )}
          </button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 gap-6",
          drafts.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"
        )}
      >
        {drafts.map((opt, idx) => {
          const typeId = getVisionId(opt.visionType);
          const Icon = ICONS[typeId] || Sparkles;
          const isSelected = isSelectedCard(opt);

          return (
            <div 
              key={opt.visionType || `draft-${idx}`}
              data-hotspot-id={typeId === 'master' ? "HS_ACT2_CARD_5_BTN" : (typeId === 'original' ? "HS_ACT2_CARD_1_BTN" : undefined)}
              className="relative min-h-[400px]"
              onMouseEnter={() => setHoveredId(opt.visionType)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <motion.div
                variants={cardVariants}
                animate={
                  hoveredId 
                    ? (hoveredId === opt.visionType ? "hovered" : "dimmed") 
                    : (isSelected ? "selected" : "show")
                }
                whileTap={{ scale: 0.98 }}
                onClick={() => onPreview(opt)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPreview(opt);
                  }
                }}
                className={cn(
                  "absolute inset-0 group flex flex-col p-8 rounded-[2.5rem] border transition-all text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--room-accent)] overflow-hidden",
                  isSelected 
                    ? "ring-2 ring-emerald-400 border-emerald-500/80 bg-emerald-950/40 shadow-[0_0_50px_rgba(16,185,129,0.35)]" 
                    : (AURAS[typeId] || 'border-white/10 bg-white/5'),
                  hoveredId === opt.visionType && "backdrop-blur-2xl border-white/30"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
                   <div className="flex items-center gap-2 shrink-0">
                      {typeId === 'original' ? (
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                          className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-800 p-0.5 shadow-[0_10px_25px_rgba(168,85,247,0.3)] flex items-center justify-center cursor-pointer group/seal shrink-0"
                          style={{
                            z: 50,
                            boxShadow: "0 20px 25px -5px rgba(168,85,247,0.4), 0 10px 10px -5px rgba(168,85,247,0.2)"
                          }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                          <div className="absolute inset-1 rounded-xl border border-purple-300/25 pointer-events-none" />
                          <Award className="w-5 h-5 text-purple-100 relative z-10" />
                        </motion.div>
                      ) : (
                        <div className={cn(
                          "p-2.5 rounded-2xl relative transition-all duration-300 bg-white/5 shrink-0",
                          COLORS[typeId] || 'text-white'
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                      )}
                      {typeId === 'master' && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[8px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse shrink-0">
                           <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                           <span>CROWN SYNTHESIS</span>
                        </div>
                      )}
                      {typeId === 'original' && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-500/15 border border-purple-400/30 rounded-full text-[8px] font-black uppercase tracking-widest text-purple-300 shadow-[0_2px_8px_rgba(168,85,247,0.2)] animate-pulse shrink-0">
                           <Award className="w-2.5 h-2.5 text-purple-400" />
                           <span>Official Record</span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[8px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse shrink-0">
                           <Check className="w-2.5 h-2.5 text-emerald-400" />
                           <span>ACTIVE BLUEPRINT</span>
                        </div>
                      )}
                   </div>
                    <button 
                      data-hotspot-id="HS_ACT2_OPEN_REVIEW_BTN"
                      onClick={(e) => { e.stopPropagation(); onPreview(opt); }}
                      className={cn(
                        "group/preview flex items-center gap-2 px-3 py-2 rounded-xl transition-all shrink-0 border",
                        isSelected 
                          ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                          : "bg-white/5 hover:bg-white/10 border-white/10"
                      )}
                    >
                      <Eye className={cn("w-3.5 h-3.5", isSelected ? "text-emerald-300" : "text-emerald-400")} />
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest whitespace-nowrap",
                        isSelected ? "text-emerald-300" : "text-white/40 group-hover/preview:text-white"
                      )}>
                        {isSelected ? "Active Blueprint (Review)" : "Open for Review"}
                      </span>
                    </button>
                </div>
                
                <h3 className={cn(
                  "font-headline italic text-white mb-2 transition-all duration-500",
                  hoveredId === opt.visionType ? "text-3xl" : "text-xl"
                )}>{opt.visionType}</h3>
                
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 group-hover:text-white/40 transition-colors">
                  {opt.visionFocus}
                </p>

                <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 pr-2 -mr-2 [mask-image:linear-gradient(to_bottom,black_85%,transparent)]">
                  <p className={cn(
                    "text-white/70 leading-relaxed italic font-serif transition-all duration-500",
                    hoveredId === opt.visionType ? "text-sm" : "text-[11px]"
                  )}>
                    "{stripScreenplayCues(opt.cleanScript || '')}"
                  </p>
                </div>
                
                {/* Removed Apply Vision footer to mandate Directorial Review */}
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export { ScriptLightBox };
