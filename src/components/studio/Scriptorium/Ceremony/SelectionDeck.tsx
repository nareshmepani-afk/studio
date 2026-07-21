import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Heart, Film, Eye, ArrowRight, ClipboardCopy, AlertTriangle, RotateCcw, History, BookOpen, ArrowLeft, Award
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
  const { mentorContext, currentStage } = useStudioState();
  const { mentorModeActive } = mentorContext || {};

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
      description: "All four narrative paths (the polished original and three synthesized visions) have been copied."
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
    cinematic: Film
  };

  const AURAS: Record<string, string> = {
    original: 'border-purple-500/30 bg-purple-500/5',
    soul: 'border-amber-500/30 bg-amber-500/5',
    sensory: 'border-sky-500/30 bg-sky-500/5',
    cinematic: 'border-emerald-500/30 bg-emerald-500/5'
  };

  const COLORS: Record<string, string> = {
    original: 'text-purple-400',
    soul: 'text-amber-400',
    sensory: 'text-sky-400',
    cinematic: 'text-emerald-400'
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
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
      >
        {drafts.map((opt, idx) => {
          const typeId = getVisionId(opt.visionType);
          const Icon = ICONS[typeId] || Sparkles;

          return (
            <div 
              key={opt.visionType || `draft-${idx}`}
              className="relative min-h-[400px]"
              onMouseEnter={() => setHoveredId(opt.visionType)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <motion.div
                variants={cardVariants}
                animate={
                  hoveredId 
                    ? (hoveredId === opt.visionType ? "hovered" : "dimmed") 
                    : (selectedText === opt.cleanScript ? "selected" : "show")
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
                  AURAS[typeId] || 'border-white/10 bg-white/5',
                  selectedText === opt.cleanScript ? "ring-2 ring-white/20 border-white/40 bg-white/10" : "border-white/10",
                  hoveredId === opt.visionType && "backdrop-blur-2xl border-white/30"
                )}
              >
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      {typeId === 'original' ? (
                        <motion.div 
                          className="wax-seal-container p-3 rounded-2xl relative transition-all duration-300 bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-400/40 shadow-[0_4px_12px_rgba(168,85,247,0.4)] scale-105 text-purple-100"
                          style={{ perspective: 1000, transformStyle: "preserve-3d" }}
                          whileHover={{ 
                            scale: 1.15,
                            rotateY: 15,
                            rotateX: -10,
                            z: 50,
                            boxShadow: "0 20px 25px -5px rgba(168,85,247,0.4), 0 10px 10px -5px rgba(168,85,247,0.2)"
                          }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                          <div className="absolute inset-1 rounded-xl border border-purple-300/25 pointer-events-none" />
                          <Award className="w-6 h-6 text-purple-100 relative z-10" />
                        </motion.div>
                      ) : (
                        <div className={cn(
                          "p-3 rounded-2xl relative transition-all duration-300 bg-white/5",
                          COLORS[typeId] || 'text-white'
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                      )}
                      {typeId === 'original' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/15 border border-purple-400/30 rounded-full text-[8px] font-black uppercase tracking-widest text-purple-300 shadow-[0_2px_8px_rgba(168,85,247,0.2)] animate-pulse">
                           <Award className="w-3 h-3 text-purple-400" />
                           <span>Official Record</span>
                        </div>
                      )}
                   </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onPreview(opt); }}
                      className="group/preview flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                    >
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover/preview:text-white transition-colors">Open for Review</span>
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
                    "{opt.cleanScript}"
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
