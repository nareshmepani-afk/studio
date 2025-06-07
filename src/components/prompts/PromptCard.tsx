
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, CheckCircle, Edit } from 'lucide-react'; // Updated icons

interface PromptCardProps {
  promptId: string;
  promptText: string;
  isCompleted: boolean;
  memoryId?: string; // ID of the memory if this prompt is completed
  onStartChapter: (promptId: string, promptText: string) => void;
  onViewEditChapter: (promptId: string) // Changed to take promptId, will find memoryId internally or via lookup
}

export function PromptCard({
  promptId,
  promptText,
  isCompleted,
  memoryId,
  onStartChapter,
  onViewEditChapter
}: PromptCardProps) {

  const handleAction = () => {
    if (isCompleted && memoryId) {
      onViewEditChapter(promptId);
    } else {
      onStartChapter(promptId, promptText);
    }
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
      <CardFooter>
        <Button
          onClick={handleAction}
          size="sm"
          variant={isCompleted ? "outline" : "default"}
          className="w-full"
        >
          {isCompleted ? (
            <>
              <Edit className="mr-2 h-4 w-4" /> View / Edit Chapter
            </>
          ) : (
            <>
              <BookText className="mr-2 h-4 w-4" /> Start this Chapter
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
