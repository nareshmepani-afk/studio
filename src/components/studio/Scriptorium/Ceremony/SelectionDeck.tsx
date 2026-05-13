import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Heart, Film, Eye, ArrowRight, ClipboardCopy, AlertTriangle, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { ScriptLightBox } from './ScriptLightBox';
import { 
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

interface SelectionDeckProps {
  drafts: any[];
  onSelect: (text: string, type: string, label: string) => void;
  onPreview: (draft: any) => void;
  selectedText: string;
  originalHook?: string; // Passed from MemoryForm
  isSaving?: boolean;
}

interface SynthesizingOverlayProps {
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const SynthesizingOverlay = ({ error, onRetry, onCancel }: SynthesizingOverlayProps) => (
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
          <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
        )}
      </div>
    </div>
    
    <div className="text-center space-y-6 max-w-md px-6">
      <div className="space-y-3">
        <h2 className={cn(
          "text-3xl font-headline italic tracking-widest transition-colors duration-500",
          error ? "text-rose-200" : "text-white"
        )}>
          {error ? "Ceremony Interrupted" : "Synthesizing Visions"}
        </h2>
        <p className={cn(
          "text-[10px] font-black uppercase tracking-[0.4em] transition-colors duration-500",
          error ? "text-rose-400/80" : "text-emerald-400/60"
        )}>
          {error ? error : "The Director is weaving your story into three distinct paths..."}
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center gap-3 justify-center"
        >
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-8 py-3 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-200 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center gap-3 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reattempt Synthesis
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center gap-3 transition-all"
          >
            Back to Script
          </button>
        </motion.div>
      )}
    </div>
  </div>
);

export const SelectionDeck = ({ 
  drafts, 
  onSelect, 
  onPreview, 
  selectedText,
  originalHook = "",
  isSaving = false
}: SelectionDeckProps) => {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [isCopyingBundle, setIsCopyingBundle] = React.useState(false);

  const getVisionId = (type: string) => {
    if (type.includes("Soul")) return "soul";
    if (type.includes("Atmospheric")) return "sensory";
    if (type.includes("Cinematic")) return "cinematic";
    return "sensory";
  };

  const copyComparisonBundle = async () => {
    setIsCopyingBundle(true);
    const bundleText = drafts.map(d => {
      return `--- ${d.visionType.toUpperCase()} ---
Focus: ${d.focus}
Stage Directions: ${d.stageDirections?.map((s: any) => `\n  • [${s.timecode}] (${s.type}) ${s.content}`).join("") || "None"}
Beat Sheet: ${d.beatSheet?.map((b: any) => `\n  • [${b.timing}] ${b.beat} (Visual: ${b.visual})`).join("") || "None"}

Text:
${d.cleanScript}
`;
    }).join('\n\n');

    const fullBundle = `DIRECTOR'S CUT COMPARISON BUNDLE
Generated: ${new Date().toLocaleString()}

ORIGINAL HOOK:
${originalHook}

DRAFT OPTIONS:
${bundleText}`;

    await navigator.clipboard.writeText(fullBundle);
    toast.success("Comparison Bundle Captured", {
      description: "All three narrative paths have been copied to your clipboard."
    });
    setTimeout(() => setIsCopyingBundle(false), 2000);
  };
  
  if (!drafts || drafts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 min-h-[60vh] text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
            <Film className="w-8 h-8 text-white/10" />
          </div>
          <motion.div 
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
    soul: Heart,
    sensory: Sparkles,
    cinematic: Film
  };

  const AURAS: Record<string, string> = {
    soul: 'border-amber-500/30 bg-amber-500/5',
    sensory: 'border-sky-500/30 bg-sky-500/5',
    cinematic: 'border-emerald-500/30 bg-emerald-500/5'
  };

  const COLORS: Record<string, string> = {
    soul: 'text-amber-400',
    sensory: 'text-sky-400',
    cinematic: 'text-emerald-400'
  };

  return (
    <div 
      data-blueprint="SelectionDeck"
      className="flex-1 flex flex-col space-y-16 py-12"
    >
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="space-y-4">
          <h2 className="text-4xl font-headline italic text-white">Director's Cut</h2>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">The Director has prepared three narrative interpretations of your memory</p>
        </div>
        
        <button 
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {drafts.map((opt, idx) => {
          const typeId = getVisionId(opt.visionType);
          const Icon = ICONS[typeId] || Sparkles;
          
          const xOffset = hoveredId === opt.visionType 
            ? (idx === 0 ? 'calc(100% + 2rem)' : idx === 2 ? 'calc(-100% - 2rem)' : 0)
            : 0;

          return (
            <div 
              key={opt.visionType}
              className="relative min-h-[400px]"
              onMouseEnter={() => setHoveredId(opt.visionType)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <motion.div
                animate={{
                  x: xOffset,
                  scale: hoveredId === opt.visionType ? 1.2 : hoveredId ? 0.85 : 1,
                  opacity: hoveredId === opt.visionType ? 1 : hoveredId ? 0 : (selectedText === opt.cleanScript ? 1 : 0.6),
                  zIndex: hoveredId === opt.visionType ? 100 : 1,
                  boxShadow: hoveredId === opt.visionType 
                    ? "0 50px 100px -20px rgba(0,0,0,0.9), 0 30px 60px -30px rgba(255,255,255,0.1)" 
                    : "0 0 0 rgba(0,0,0,0)"
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 25,
                  mass: 0.5
                }}
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
                   <div className={cn("p-3 rounded-2xl bg-white/5", COLORS[typeId] || 'text-white')}>
                     <Icon className="w-6 h-6" />
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
                  {opt.focus}
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
      </div>
    </div>
  );
};

export { ScriptLightBox };
