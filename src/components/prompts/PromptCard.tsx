
"use client";

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MessageSquarePlus } from 'lucide-react';

interface PromptCardProps {
  promptId: string;
  promptText: string; // Now receives the already localized text
  isFlaggedForReuse: boolean;
  onAction: (promptId: string) => void;
  onToggleFlag: (promptId: string, isFlagged: boolean) => void;
}

export function PromptCard({ promptId, promptText, isFlaggedForReuse, onAction, onToggleFlag }: PromptCardProps) {
  return (
    <Card className="shadow-lg transition-all hover:shadow-xl animate-fade-in">
      <CardContent className="pt-6">
        <p className="text-base text-foreground">{promptText}</p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`flag-${promptId}`}
            checked={isFlaggedForReuse}
            onCheckedChange={(checked) => onToggleFlag(promptId, !!checked)}
          />
          <Label htmlFor={`flag-${promptId}`} className="text-sm text-muted-foreground cursor-pointer">
            Flag for re-use
          </Label>
        </div>
        <Button onClick={() => onAction(promptId)} size="sm">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Use this Prompt
        </Button>
      </CardFooter>
    </Card>
  );
}

