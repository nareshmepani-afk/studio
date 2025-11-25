
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, CheckCircle, Edit, Star, Loader2, Info, QrCode } from 'lucide-react'; // Updated icons
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PromptCardProps {
  promptId: string;
  promptText: string;
  teleprompterScript: string;
  isCompleted: boolean;
  isFlaggedForReuse: boolean;
  isLoading?: boolean; // New prop
  onStartChapter: (promptId: string, promptText: string) => void;
  onViewEditChapter: (promptId: string) => void;
  onToggleFlagPrompt: (promptId: string) => void;
  onShowQrCode: (promptId: string, promptTitle: string) => void;
}

export function PromptCard({
  promptId,
  promptText,
  teleprompterScript,
  isCompleted,
  isFlaggedForReuse,
  isLoading = false, // Default to false
  onStartChapter,
  onViewEditChapter,
  onToggleFlagPrompt,
  onShowQrCode
}: PromptCardProps) {

  const handleAction = () => {
    if (isLoading) return;
    if (isCompleted) {
      onViewEditChapter(promptId);
    } else {
      onStartChapter(promptId, promptText);
    }
  };

  const handleFlagToggle = (e: React.MouseEvent) => {
    if (isLoading) return;
    e.stopPropagation(); // Prevent card action if clicking flag button
    onToggleFlagPrompt(promptId);
  };
  
  const handleQrCodeClick = (e: React.MouseEvent) => {
    if (isLoading) return;
    e.stopPropagation();
    onShowQrCode(promptId, promptText);
  };

  return (
    <Card className={`shadow-lg transition-all hover:shadow-xl animate-fade-in flex flex-col h-full ${isCompleted ? 'bg-green-50 dark:bg-green-900/30 border-green-500' : 'bg-card'}`}>
      <CardHeader className="pb-3">
        {isCompleted && (
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
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleQrCodeClick} className="text-muted-foreground hover:text-primary" aria-label="Show QR Code for this prompt">
                    <QrCode className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Show QR Code for Interviewer</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="View teleprompter script">
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
                    className="mr-2 shrink-0" // Ensure button doesn't cause overflow
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
              className="flex-grow" // Main action button takes more space
              disabled={isLoading}
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
