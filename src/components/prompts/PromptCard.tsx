
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, CheckCircle, Edit, Star, Loader2, Info, QrCode } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface PromptCardProps {
  promptId: string;
  promptText: string;
  teleprompterScript: string;
  isCompleted: boolean;
  isFlaggedForReuse: boolean;
  isLoading?: boolean;
  onStartChapter: (promptId: string, isCompleted: boolean) => void;
  onToggleFlagPrompt: (promptId: string) => void;
  onShowQrCode: (promptId: string, promptTitle: string) => void;
  canAccess: boolean; 
}

export function PromptCard({
  promptId,
  promptText,
  teleprompterScript,
  isCompleted,
  isFlaggedForReuse,
  isLoading = false,
  onStartChapter,
  onToggleFlagPrompt,
  onShowQrCode,
  canAccess,
}: PromptCardProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleAction = useCallback(() => {
    console.log(`[PromptCard] handleAction called for promptId: ${promptId}. isCompleted: ${isCompleted}`);
    if (isLoading || !hasMounted) return;
    onStartChapter(promptId, isCompleted);
  }, [isLoading, hasMounted, onStartChapter, promptId, isCompleted]);
  
  const handleFlagToggle = (e: React.MouseEvent) => {
    if (isLoading || !hasMounted) return;
    e.stopPropagation();
    onToggleFlagPrompt(promptId);
  };
  
  const handleQrCodeClick = (e: React.MouseEvent) => {
    if (isLoading || !hasMounted) return;
    e.stopPropagation();
    onShowQrCode(promptId, promptText);
  };

  if (!hasMounted) {
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

  return (
    <Card className={`shadow-lg transition-all hover:shadow-xl animate-fade-in flex flex-col h-full ${isCompleted ? 'bg-green-50 dark:bg-green-900/30 border-green-500' : 'bg-card'}`}>
      <CardHeader className="pb-3">
        {isLoading ? (
            <div className="flex items-center text-muted-foreground text-xs mb-1">
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Loading...
            </div>
        ) : isCompleted && (
            <div className="flex items-center text-green-600 dark:text-green-400 text-xs mb-1">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Chapter Recorded
            </div>
        )}
        <CardTitle className={`font-normal text-base ${isCompleted ? 'text-green-800 dark:text-green-300' : 'text-foreground'}`}>
          {promptText}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Can add a snippet of the memory description here if completed, in the future */}
      </CardContent>
      <CardFooter className="flex justify-between items-center mt-auto">
        <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleQrCodeClick} className="text-muted-foreground hover:text-primary" aria-label="Show QR Code for this prompt" disabled={isLoading}>
                    <QrCode className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Show QR Code for Interviewer</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="View teleprompter script" disabled={isLoading} onClick={(e) => e.stopPropagation()}>
                           <Info className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs sm:max-w-sm md:max-w-md p-4" align="start">
                        <h4 className="font-bold mb-2">Teleprompter Script Preview</h4>
                        <p className="whitespace-pre-wrap text-xs">{teleprompterScript}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>

        <div className="flex items-center">
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFlagToggle}
                    className="mr-2 shrink-0"
                    aria-label={isFlaggedForReuse ? "Unflag this prompt" : "Flag this prompt for re-use"}
                    disabled={isLoading}
                  >
                    <Star className={`h-5 w-5 ${isFlaggedForReuse ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFlaggedForReuse ? "Unflag this prompt" : "Flag this prompt for re-use"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              onClick={handleAction}
              size="sm"
              variant={isCompleted ? "outline" : "default"}
              className="w-full"
              disabled={isLoading || !canAccess}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
        </div>
      </CardFooter>
    </Card>
  );
}
