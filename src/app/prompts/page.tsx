
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptCard } from '@/components/prompts/PromptCard';
import { mockPromptGroups } from '@/lib/mockData'; // Changed to mockPromptGroups
import type { Prompt, PromptGroup } from '@/types'; // Added PromptGroup
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ThumbsUp, RotateCcw, Languages, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function PromptsPage() {
  const [promptGroups, setPromptGroups] = useState<PromptGroup[]>([]); // Changed state to hold PromptGroup[]
  const [searchTerm, setSearchTerm] = useState('');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'gu'>('en');
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      setPromptGroups(mockPromptGroups); // Use mockPromptGroups
      setIsLoading(false);
    }, 500);
  }, []);


  const handleUsePrompt = (promptId: string) => {
    let selectedPrompt: Prompt | undefined;
    for (const group of promptGroups) { // Iterate through groups to find the prompt
      selectedPrompt = group.prompts.find(p => p.id === promptId);
      if (selectedPrompt) break;
    }

    if (!selectedPrompt) return;

    const promptTextForSelectedLanguage = selectedPrompt.text[currentLanguage] || selectedPrompt.text.en;

    toast({
      title: "Prompt Selected!",
      description: `Using prompt: "${promptTextForSelectedLanguage}". Redirecting to add memory...`
    });
    router.push(`/add-memory?prompt=${encodeURIComponent(promptTextForSelectedLanguage)}`);
  };

  const handleToggleFlag = (promptId: string, isFlagged: boolean) => {
    setPromptGroups(prevGroups =>
      prevGroups.map(group => ({
        ...group,
        prompts: group.prompts.map(p =>
          p.id === promptId ? { ...p, isFlaggedForReuse: isFlagged } : p
        ),
      }))
    );
  };

  const filteredPromptGroups = useMemo(() => {
    if (!promptGroups) return [];

    return promptGroups
      .map(group => {
        const filteredGroupPrompts = group.prompts
          .filter(prompt =>
            (prompt.text[currentLanguage] || prompt.text.en).toLowerCase().includes(searchTerm.toLowerCase())
          )
          .filter(prompt =>
            showFlaggedOnly ? prompt.isFlaggedForReuse : true
          );
        return { ...group, prompts: filteredGroupPrompts };
      })
      .filter(group => group.prompts.length > 0); // Only include groups that have prompts after filtering
  }, [promptGroups, searchTerm, showFlaggedOnly, currentLanguage]);

  if (isLoading) {
     return (
      <AuthenticatedPageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-headline mb-2">Loading Prompts...</h2>
          <p className="text-muted-foreground">Please wait while we find inspiring ideas for you.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="search-prompts" className="block text-sm font-medium text-muted-foreground mb-1">Search Prompts</Label>
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
             <div>
                <Label htmlFor="prompt-language" className="block text-sm font-medium text-muted-foreground mb-1">Language</Label>
                <Select value={currentLanguage} onValueChange={(value: 'en' | 'gu') => setCurrentLanguage(value)}>
                    <SelectTrigger id="prompt-language">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>

        {filteredPromptGroups.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="font-headline text-2xl mb-2">No Prompts Found</h2>
            <p className="text-muted-foreground">Try adjusting your search or filters for the selected language.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredPromptGroups.map((group) => (
              <section key={group.id}>
                <h2 className="font-headline text-3xl mb-6 border-b pb-2">
                  {group.title[currentLanguage] || group.title.en}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      promptId={prompt.id}
                      promptText={prompt.text[currentLanguage] || prompt.text.en}
                      isFlaggedForReuse={prompt.isFlaggedForReuse}
                      onAction={handleUsePrompt}
                      onToggleFlag={handleToggleFlag}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedPageWrapper>
  );
}

    