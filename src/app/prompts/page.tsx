
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptCard } from '@/components/prompts/PromptCard';
import { mockPrompts } from '@/lib/mockData';
import type { Prompt } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ThumbsUp, RotateCcw } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast'; // Changed import

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // const { toast } = useToast(); // Removed useToast() call

  useEffect(() => {
    setTimeout(() => {
      setPrompts(mockPrompts);
      setIsLoading(false);
    }, 500);
  }, []);


  const handleUsePrompt = (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    toast({ // Direct use
      title: "Prompt Selected!",
      description: `Using prompt: "${prompt?.text}". Redirecting to add memory...`
    });
    router.push(`/add-memory?prompt=${encodeURIComponent(prompt?.text || '')}`);
  };

  const handleToggleFlag = (promptId: string, isFlagged: boolean) => {
    setPrompts(prevPrompts =>
      prevPrompts.map(p => (p.id === promptId ? { ...p, isFlaggedForReuse: isFlagged } : p))
    );
  };

  const filteredPrompts = useMemo(() => {
    return prompts
      .filter(prompt =>
        prompt.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(prompt =>
        showFlaggedOnly ? prompt.isFlaggedForReuse : true
      );
  }, [prompts, searchTerm, showFlaggedOnly]);

  if (isLoading) {
     return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-8 px-4">
           <p>Loading prompts...</p>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="font-headline text-4xl mb-4 md:mb-0">Memory Prompts</h1>
        </div>

        <div className="mb-8 p-4 bg-card rounded-lg shadow sticky top-16 z-40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="search-prompts" className="block text-sm font-medium text-muted-foreground mb-1">Search Prompts</label>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-prompts"
                  type="search"
                  placeholder="Search for prompts..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 justify-self-start md:justify-self-end pt-5">
                <Button
                    variant={showFlaggedOnly ? "secondary" : "outline"}
                    onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
                >
                    {showFlaggedOnly ? <ThumbsUp className="mr-2 h-4 w-4" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                    {showFlaggedOnly ? 'Show All' : 'Show Flagged Only'}
                </Button>
            </div>
          </div>
        </div>

        {filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="font-headline text-2xl mb-2">No Prompts Found</h2>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onAction={handleUsePrompt}
                onToggleFlag={handleToggleFlag}
              />
            ))}
          </div>
        )}
      </div>
    </AuthenticatedPageWrapper>
  );
}
