
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, CheckCircle, Edit, Flag, Loader2, Info, QrCode, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

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
  memoryDescription?: string;
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
  memoryDescription,
}: PromptCardProps) {
  const router = useRouter();

  const handleAction = (e: React.MouseEvent) => {
    if (isLoading) return;
    e.stopPropagation();
    if (!canAccess) {
        router.push('/settings');
        return;
    }
    onStartChapter(promptId, isCompleted);
  };
  
  const handleFlagToggle = (e: React.MouseEvent) => {
    if (isLoading || !canAccess) return;
    e.stopPropagation();
    onToggleFlagPrompt(promptId);
  };
  
  const handleQrCodeClick = (e: React.MouseEvent) => {
    if (isLoading || !canAccess) return;
    e.stopPropagation();
    onShowQrCode(promptId, promptText);
  };

  if (isLoading) {
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

  const cardClasses = `
    shadow-lg transition-all hover:shadow-xl animate-fade-in flex flex-col h-full 
    ${isCompleted ? 'bg-green-50 dark:bg-green-900/30 border-green-500' : 'bg-card'}
    ${!canAccess ? 'opacity-50 hover:opacity-75 cursor-pointer' : ''}
  `;

  const cardTitleClasses = `
    font-normal text-base 
    ${isCompleted ? 'text-green-800 dark:text-green-300' : 'text-foreground'}
    ${!canAccess ? 'text-muted-foreground' : ''}
  `;

  const mainButton = (
    <Button
      onClick={handleAction}
      size="sm"
      variant={isCompleted && canAccess ? "outline" : "default"}
      className="w-full"
      disabled={isLoading && canAccess}
      data-testid={`prompt-start-button-${promptId}`}
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

  return (
    <Card className={cardClasses} onClick={!canAccess ? handleAction : undefined}>
      <CardHeader className="pb-3">
        {isCompleted && (
            <div className="flex items-center text-green-600 dark:text-green-400 text-xs mb-1">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Chapter Recorded
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
        <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleQrCodeClick} className="text-muted-foreground hover:text-primary" aria-label="Show QR Code for this prompt" disabled={isLoading || !canAccess}>
                    <QrCode className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Show QR Code for Interviewer</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="View teleprompter script" disabled={isLoading || !canAccess} onClick={(e) => e.stopPropagation()}>
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
                    disabled={isLoading || !canAccess}
                  >
                    <Flag className={`h-5 w-5 transition-colors ${isFlaggedForReuse ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFlaggedForReuse ? "Unflag this prompt" : "Flag this prompt to easily find and reuse it for future interviews."}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {!canAccess ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {mainButton}
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>This is a premium prompt. Click to upgrade your pass.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : mainButton}

        </div>
      </CardFooter>
    </Card>
  );
}
