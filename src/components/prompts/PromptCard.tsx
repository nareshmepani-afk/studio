"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, CheckCircle, Edit, Flag, QrCode, Lock, Info, Rocket, PencilLine } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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
};

export function PromptCard(props: PromptCardProps) {
  const router = useRouter();

  if (props.isLoading) {
    return (
        <Card className="shadow-lg flex flex-col h-full bg-card/50">
            <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent className="flex-grow" />
            <CardFooter className="flex justify-between items-center mt-auto">
                <div className="flex items-center space-x-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <div className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-md mr-2" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                </div>
            </CardFooter>
        </Card>
    );
  }

  const {
    promptId,
    promptText,
    teleprompterScript,
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
    onStartChapter(promptId, isCompleted);
  };
  
  const handleFlagToggle = (e: React.MouseEvent) => {
    if (props.isLoading || !canAccess) return;
    e.stopPropagation();
    onToggleFlagPrompt(promptId);
  };
  
  const cardClasses = cn(
    "shadow-lg transition-all flex flex-col h-full relative group cursor-pointer",
    isCompleted ? 'bg-green-50 dark:bg-green-900/10 border-green-500/50' : 'bg-card',
    !canAccess && "opacity-60 grayscale-[0.5] blur-[0.2px] hover:opacity-80 hover:grayscale-0 border-dashed"
  );

  const cardTitleClasses = cn(
    "font-normal text-base leading-snug",
    isCompleted ? 'text-green-800 dark:text-green-300' : 'text-foreground',
    !canAccess && 'text-muted-foreground'
  );

  const mainButton = (
    <Button
      onClick={handleAction}
      size="sm"
      variant={!canAccess ? "secondary" : isCompleted ? "outline" : "default"}
      className="w-full"
      disabled={props.isLoading}
    >
      {!canAccess ? (
          <>
            <Lock className="mr-2 h-4 w-4" /> Upgrade
          </>
      ) : isCompleted ? (
        <>
          <Edit className="mr-2 h-4 w-4" /> View/Edit
        </>
      ) : (
        <>
          <BookText className="mr-2 h-4 w-4" /> Start
        </>
      )}
    </Button>
  );

  const cardContent = (
      <Card className={cardClasses} onClick={handleAction}>
        <div className="flex flex-col h-full">
            <CardHeader className="pb-3">
              {isCompleted && (
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Recorded
                    </div>
                    {status === 'published' ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 text-green-500 border border-green-500/30 text-[9px] font-black uppercase">
                        <Rocket className="w-2.5 h-2.5" /> Cinema
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[9px] font-black uppercase">
                        <PencilLine className="w-2.5 h-2.5" /> Studio Draft
                      </span>
                    )}
                  </div>
              )}
              {!canAccess && (
                  <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs mb-1">
                      <Lock className="h-3.5 w-3.5 mr-1.5" />
                      Premium Chapter
                  </div>
              )}
              <CardTitle className={cardTitleClasses}>
                {promptText}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              {isCompleted && memoryDescription && (
                <p className="text-sm text-muted-foreground line-clamp-3 italic border-l-2 border-green-200 dark:border-green-800 pl-2">
                  {memoryDescription}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between items-center mt-auto pt-2">
              <div className="flex items-center space-x-2">
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="View teleprompter script" disabled={props.isLoading || !canAccess} onClick={(e) => e.stopPropagation()}>
                                 <Info className="h-5 w-5" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs p-4" align="start">
                              <h4 className="font-bold mb-2 text-primary">Teleprompter Preview</h4>
                              <p className="whitespace-pre-wrap text-xs leading-relaxed">{teleprompterScript}</p>
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleFlagToggle}
                          className="shrink-0"
                          aria-label={isFlaggedForReuse ? "Unflag this prompt" : "Flag this prompt for re-use"}
                          disabled={props.isLoading || !canAccess}
                        >
                          <Flag className={cn("h-5 w-5 transition-colors", isFlaggedForReuse ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary')} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent align="start" side="top">
                        <p>{isFlaggedForReuse ? "Unflag this prompt" : "Flag this prompt to easily find and reuse it."}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
              </div>

              <div className="flex items-center">
                  {mainButton}
              </div>
            </CardFooter>
        </div>
      </Card>
  );

  if (!canAccess) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent className="bg-primary text-primary-foreground border-none shadow-2xl p-4 max-w-[280px] rounded-xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <p className="font-bold text-sm">Premium Content</p>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                This chapter is part of the Premium Life Journey. Upgrade your Host Pass to weave this memory into your legacy.
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-2 border-t border-white/20 pt-2">
                Click card to upgrade
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}
