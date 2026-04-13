"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookText, 
  Film,
  CheckCircle, 
  Edit, 
  Flag, 
  Lock, 
  Scan, 
  X,
  Info,
  Rocket, 
  PencilLine,
  Play,
  Clapperboard
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Prompt } from '@/types';
import StudioChapterContent from '../studio/StudioChapterContent';

// Prop types
type PromptCardProps = {
  promptId: string;
  promptText: string;
  teleprompterScript: string;
  isCompleted: boolean;
  isFlaggedForReuse: boolean;
  isLoading?: boolean;
  onStartChapter: (promptId: string, isCompleted: boolean) => void;
  onToggleFlagPrompt: (promptId: string) => void;
  canAccess: boolean;
  memoryDescription?: string;
  status?: 'draft' | 'published';
  prompt?: Prompt;
  parentPrompt?: Prompt;
};

export function PromptCard(props: PromptCardProps) {
  const router = useRouter();
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout| null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsBriefOpen(true);
  };


  if (props.isLoading) {
    return (
        <Card className="shadow-lg flex flex-col h-full bg-neutral-900/50 border-white/5">
            <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24 mb-2 bg-white/5" />
                <Skeleton className="h-5 w-3/4 bg-white/5" />
                <Skeleton className="h-5 w-1/2 bg-white/5" />
            </CardHeader>
            <CardContent className="flex-grow" />
            <CardFooter className="flex justify-between items-center mt-auto">
                <div className="flex items-center space-x-1">
                    <Skeleton className="h-8 w-8 rounded-md bg-white/5" />
                </div>
                <div className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-md mr-2 bg-white/5" />
                    <Skeleton className="h-9 w-24 rounded-md bg-white/5" />
                </div>
            </CardFooter>
        </Card>
    );
  }

  const {
    promptId,
    promptText,
    isCompleted,
    isFlaggedForReuse,
    onStartChapter,
    onToggleFlagPrompt,
    canAccess,
    memoryDescription,
    status
  } = props;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.isLoading) return;
    if (!canAccess) {
        router.push('/settings');
        return;
    }
    // Clicking action button starts production, 
    // but we'll also let clicking the INFO icon toggle the brief
    onStartChapter(promptId, isCompleted);
  };

  const toggleBrief = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsBriefOpen(!isBriefOpen);
  };
  
  const handleFlagToggle = (e: React.MouseEvent) => {
    if (props.isLoading || !canAccess) return;
    e.stopPropagation();
    onToggleFlagPrompt(promptId);
  };
  
  const cardClasses = cn(
    "transition-all duration-500 flex flex-col h-full relative group cursor-pointer overflow-hidden rounded-2xl border backdrop-blur-sm",
    isCompleted 
      ? 'bg-primary/[0.03] border-primary/20 hover:border-primary/40 shadow-2xl shadow-primary/5' 
      : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]',
    isBriefOpen && "border-amber-500/50 ring-1 ring-amber-500/20 shadow-[0_0_30px_rgba(251,191,36,0.1)]",
    !canAccess && "opacity-30 grayscale blur-[0.5px]"
  );

  const cardTitleClasses = cn(
    "font-headline font-bold text-lg leading-tight transition-colors mb-2 italic",
    isCompleted ? 'text-white' : 'text-white/70 group-hover:text-white',
    !canAccess && 'text-white/20'
  );

  const mainButton = (
    <Button
      onClick={handleAction}
      size="sm"
      variant={!canAccess ? "secondary" : isCompleted ? "outline" : "default"}
      className={cn(
        "rounded-full px-4 h-9 font-bold tracking-tight transform active:scale-95 transition-all",
        isCompleted && "border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-xl transition-all duration-300"
      )}
      disabled={props.isLoading}
    >
      {!canAccess ? (
          <>
            <Lock className="mr-2 h-3.5 w-3.5" /> Upgrade
          </>
      ) : isCompleted ? (
        <>
          <Edit className="mr-2 h-3.5 w-3.5" /> Edit Scene
        </>
      ) : (
        <>
          <Play className="mr-2 h-3.5 w-3.5 fill-current" /> Action
        </>
      )}
    </Button>
  );

  const cardContent = (
      <div className={cardClasses} onClick={handleAction}>
        {/* Film Frame Aesthetic Overlay */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(255,255,255,0.05)_20px,rgba(255,255,255,0.05)_40px)]" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(255,255,255,0.05)_20px,rgba(255,255,255,0.05)_40px)]" />

        <div className="flex flex-col h-full p-6">
            <header className="mb-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                {isCompleted ? (
                   <div className="flex items-center gap-2">
                      <div className="flex items-center bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />
                          Captured
                      </div>
                      {status === 'published' ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/20 text-green-500 border border-green-500/30 text-[9px] font-black uppercase tracking-widest">
                          <Rocket className="w-2.5 h-2.5" /> Cinema
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[9px] font-black uppercase tracking-widest">
                          <PencilLine className="w-2.5 h-2.5" /> Studio Draft
                        </div>
                      )}
                   </div>
                ) : (
                  <div className="flex items-center text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">
                    <Clapperboard className="h-3 w-3 mr-1.5 opacity-50" />
                    Ready for Action
                  </div>
                )}
                
                {!canAccess && (
                  <div className="flex items-center bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                      <Lock className="h-2.5 w-2.5 mr-1" /> Premium
                  </div>
                )}
              </div>
              
              <h3 className={cardTitleClasses}>
                {promptText}
              </h3>
            </header>

            <section className="flex-grow">
              {isCompleted && memoryDescription ? (
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 relative group/desc">
                  <p className="text-xs text-white/50 line-clamp-2 italic leading-relaxed">
                    "{memoryDescription}"
                  </p>
                  <div className="absolute top-1 right-2 opacity-0 group-hover/desc:opacity-100 transition-opacity">
                    <Scan className="w-3 h-3 text-primary/40" />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border border-dashed border-white/5 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity">
                  <Film className="w-8 h-8" />
                </div>
              )}
            </section>

            <footer className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
              <div className="flex items-center gap-1">
                   <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            onMouseEnter={handleMouseEnter} 
                            className="relative z-10"
                          >
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn(
                                "h-8 w-8 transition-colors",
                                isBriefOpen ? "text-amber-400 bg-amber-400/10" : "text-white/40 hover:text-white hover:bg-white/5"
                              )}
                              onClick={toggleBrief}
                              aria-label="View scene details" 
                              disabled={props.isLoading || !canAccess} 
                            >
                               <Info className="h-4 w-4" />
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                            Review Scene Brief
                        </TooltipContent>
                      </Tooltip>

                      <Dialog open={mounted && isBriefOpen} onOpenChange={setIsBriefOpen}>
                        <DialogContent 
                          className="fixed inset-0 translate-x-0 translate-y-0 max-w-none w-full h-full border-0 bg-transparent p-0 shadow-none z-[1000] focus:outline-none [&>button:last-child]:hidden block"
                        >
                          {/* Explicit Backdrop to ensure "click outside" works with custom positioning */}
                          <div 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                            onClick={() => setIsBriefOpen(false)}
                          />

                          <div className="relative z-10 h-full w-full flex items-center justify-center p-[5vh] pointer-events-none">
                            <div 
                              className="flex flex-col h-full w-full lg:w-[80vw] max-w-[1600px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-[2.5rem] pointer-events-auto"
                              onMouseEnter={() => {
                                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                setIsBriefOpen(true);
                              }}
                            >
                                {/* Zen Header Style from MemoryForm */}
                                <div className="bg-black/95 px-8 py-5 border border-white/10 border-b-0 rounded-t-[2.5rem] flex justify-between items-center backdrop-blur-2xl shrink-0">
                                   <div className="flex items-center gap-4">
                                     <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                                     <div>
                                       <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase italic pb-1 leading-none">Production Brief</DialogTitle>
                                       <DialogDescription className="sr-only">Detailed description of the cinematic scene and production requirements.</DialogDescription>
                                       <p className="text-[10px] font-black text-amber-400/60 uppercase tracking-[0.4em]">Scene Exploration • Zen Mode Focus</p>
                                     </div>
                                   </div>
                                   <div className="flex items-center gap-6">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setIsBriefOpen(false); }} 
                                        className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all group border border-white/10"
                                      >
                                        <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                      </button>
                                   </div>
                                </div>

                                <div className="flex-grow w-full bg-neutral-950/95 px-6 py-3 border border-white/10 border-t-0 rounded-b-[2.5rem] shadow-2xl overflow-y-auto backdrop-blur-3xl custom-scrollbar relative">
                                    {/* Inner reading area */}
                                    <div className="max-w-4xl mx-auto">
                                      {props.prompt && (
                                        <StudioChapterContent 
                                          prompt={props.prompt} 
                                          parentPrompt={props.parentPrompt} 
                                          script={props.teleprompterScript}
                                          isModal={true}
                                          isCompleted={isCompleted}
                                        />
                                      )}
                                    </div>
                                </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleFlagToggle}
                          className="h-8 w-8 text-white/40 hover:text-primary hover:bg-primary/5 shrink-0"
                          aria-label={isFlaggedForReuse ? "Unflag scene" : "Flag scene for priority"}
                          disabled={props.isLoading || !canAccess}
                        >
                          <Flag className={cn("h-4 w-4 transition-all", isFlaggedForReuse ? 'fill-primary text-primary' : '')} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent align="start" side="top" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                        {isFlaggedForReuse ? "Remove Priority" : "Flag for Priority"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
              </div>

              <div className="flex items-center">
                  {mainButton}
              </div>
            </footer>
        </div>
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-5 blur-[80px] transition-opacity pointer-events-none" />
      </div>
  );

  if (!canAccess) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent className="bg-primary text-primary-foreground border-none shadow-2xl p-5 max-w-[300px] rounded-2xl">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20"><Lock className="h-4 w-4" /></div>
                <p className="font-headline text-lg italic">Premium Chapter</p>
              </div>
              <p className="text-xs leading-relaxed opacity-90 italic">
                This chapter is part of the Premium Life Journey production suite. Upgrade your Host Pass to weave this memory into your legacy.
              </p>
              <div className="pt-3 border-t border-white/20">
                <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">
                  Click card to upgrade
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}
