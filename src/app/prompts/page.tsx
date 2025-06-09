
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptCard } from '@/components/prompts/PromptCard';
import { mockPromptGroups, mockMemories } from '@/lib/mockData';
import type { Prompt, PromptGroup, Memory, HostPlan } from '@/types';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Edit3, Loader2, Languages, HelpCircle, Sparkles, Lightbulb, Zap } from 'lucide-react'; // Added Zap
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateMemoryCuesAction } from '@/actions/generateMemoryCuesAction';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert components

export default function LifeJourneyPage() {
  const [promptGroups, setPromptGroups] = useState<PromptGroup[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'gu'>('en');
  const router = useRouter();
  const { user, userMode, upgradeToPremium } = useAuth(); // Added upgradeToPremium

  const [showCustomChapterDialog, setShowCustomChapterDialog] = useState(false);
  const [customChapterUserProfile, setCustomChapterUserProfile] = useState('');
  const [customChapterLanguage, setCustomChapterLanguage] = useState<'en' | 'gu'>('en');
  const [generatedChapterIdeas, setGeneratedChapterIdeas] = useState<string[]>([]);
  const [isLoadingChapterIdeas, setIsLoadingChapterIdeas] = useState(false);

  useEffect(() => {
    if (user?.profileInfo) {
      setCustomChapterUserProfile(user.profileInfo);
    }
  }, [user?.profileInfo]);

  const hostPlan: HostPlan = user?.hostPlan || 'free';
  const availablePromptGroups = useMemo(() => {
    if (hostPlan === 'premium') {
      return mockPromptGroups;
    }
    // Free plan gets only the first group
    return mockPromptGroups.length > 0 ? [mockPromptGroups[0]] : [];
  }, [hostPlan]);


  useEffect(() => {
    setTimeout(() => {
      setPromptGroups(mockPromptGroups); // Keep all for potential upgrade display
      const userMemories = mockMemories.filter(m => m.userId === user?.id);
      setMemories(userMemories);
      setIsLoading(false);
    }, 500);
  }, [user?.id]);

  const completedPromptIds = useMemo(() => {
    return new Set(memories.filter(m => m.promptId).map(m => m.promptId));
  }, [memories]);

  const handleStartChapter = (promptId: string, promptText: string) => {
    toast({
      title: "Starting a New Chapter!",
      description: `Prompt: "${promptText}". Redirecting to add memory...`
    });
    router.push(`/add-memory?prompt=${encodeURIComponent(promptText)}&promptId=${encodeURIComponent(promptId)}`);
  };

  const handleViewEditChapter = (promptId: string) => {
    const memoryForPrompt = memories.find(m => m.promptId === promptId);
    if (memoryForPrompt) {
      router.push(`/add-memory?editMemoryId=${encodeURIComponent(memoryForPrompt.id)}&promptId=${encodeURIComponent(promptId)}`);
    } else {
      toast({ title: "Error", description: "Could not find the memory for this chapter.", variant: "destructive" });
    }
  };

  const handleGenerateCustomChapterIdeas = async () => {
    if (!customChapterUserProfile.trim() && !user?.profileInfo?.trim()) {
      toast({ title: "Profile Info Needed", description: "Please provide some information about yourself in the profile field to generate ideas.", variant: "destructive" });
      return;
    }
    setIsLoadingChapterIdeas(true);
    try {
      const profileToUse = customChapterUserProfile.trim() ? customChapterUserProfile : user?.profileInfo || '';
      const result = await generateMemoryCuesAction({
        userProfile: profileToUse,
        currentDate: new Date().toISOString().split('T')[0],
        language: customChapterLanguage,
      });
      setGeneratedChapterIdeas(result.memoryCues);
      toast({ title: result.memoryCues.length > 0 ? "Chapter Ideas Generated!" : "No Ideas Generated", description: result.memoryCues.length > 0 ? "Select an idea below or refine your profile." : "Try refining your profile information." });
    } catch (error) {
      console.error("Failed to generate chapter ideas", error);
      toast({ title: "Error Generating Ideas", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
    setIsLoadingChapterIdeas(false);
  };

  const handleCustomIdeaSelected = (idea: string) => {
    toast({
      title: "Custom Chapter Selected!",
      description: `Starting chapter: "${idea}". Redirecting...`
    });
    router.push(`/add-memory?prompt=${encodeURIComponent(idea)}`);
    setShowCustomChapterDialog(false);
    setGeneratedChapterIdeas([]);
  };

  const handleUpgradeClick = () => {
    upgradeToPremium(); 
    // Optionally, you could redirect to settings or show a success message here if it's not handled by AuthContext toast
    toast({title: "Switched to Premium Features!", description: "You now have access to all chapters."});
  };


  if (userMode === 'guest') {
    return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-8 px-4 text-center">
          <HelpCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="font-headline text-3xl mb-2">Life Journey Not Available</h1>
          <p className="text-muted-foreground mb-6">
            The "My Life Journey" feature is available for hosts to record their stories.
            Guests can view shared memories on their timeline.
          </p>
          <Link href="/timeline" passHref>
            <Button variant="outline">Go to Shared Timeline</Button>
          </Link>
        </div>
      </AuthenticatedPageWrapper>
    );
  }


  if (isLoading) {
     return (
      <AuthenticatedPageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-headline mb-2">Loading Your Life Journey...</h2>
          <p className="text-muted-foreground">Please wait while we gather your story.</p>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <BookOpen className="h-10 w-10 text-primary mr-3" />
            <h1 className="font-headline text-4xl">My Life Journey</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button onClick={() => setShowCustomChapterDialog(true)} variant="secondary" className="w-full sm:w-auto">
                <Sparkles className="mr-2 h-4 w-4" /> Brainstorm Custom Chapter
              </Button>
              <div className="w-full sm:w-auto">
                <Label htmlFor="prompt-language" className="sr-only">Language for Prompts</Label>
                <Select value={currentLanguage} onValueChange={(value: 'en' | 'gu') => setCurrentLanguage(value)}>
                    <SelectTrigger id="prompt-language" className="w-full">
                        <Languages className="mr-2 h-4 w-4" />
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
        
        <div className="mb-8 p-4 bg-card/50 rounded-lg shadow">
            <p className="text-muted-foreground">
                Welcome to your Life Journey. Each section below represents a chapter of your story.
                Click on a prompt to record memories associated with it, or brainstorm a custom chapter idea. Completed chapters are marked with a <CheckCircle className="inline-block h-4 w-4 text-green-500" />.
                {hostPlan === 'free' && ' Your current plan gives you access to the first chapter group.'}
            </p>
        </div>

        {hostPlan === 'free' && availablePromptGroups.length < mockPromptGroups.length && (
          <Alert className="mb-6 bg-primary/10 border-primary/30">
            <Zap className="h-5 w-5 text-primary" />
            <AlertTitle className="font-headline text-primary">Unlock More Chapters!</AlertTitle>
            <AlertDescription className="text-primary/80">
              Upgrade to Premium to access all Life Journey chapters and more features.
              <Button onClick={handleUpgradeClick} size="sm" className="mt-2 ml-auto block sm:inline-block sm:ml-3">Upgrade to Premium (Mock)</Button>
            </AlertDescription>
          </Alert>
        )}


        {availablePromptGroups.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="font-headline text-2xl mb-2">No Chapters Found</h2>
            <p className="text-muted-foreground">It seems there are no prompt groups defined yet. Try brainstorming a custom chapter!</p>
          </div>
        ) : (
          <div className="space-y-10">
            {availablePromptGroups.map((group) => (
              <section key={group.id}>
                <h2 className="font-headline text-3xl mb-6 border-b pb-3 text-primary">
                  {group.title[currentLanguage] || group.title.en}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.prompts.map((prompt) => {
                    const isCompleted = completedPromptIds.has(prompt.id);
                    const memoryForPrompt = memories.find(m => m.promptId === prompt.id);
                    return (
                      <PromptCard
                        key={prompt.id}
                        promptId={prompt.id}
                        promptText={prompt.text[currentLanguage] || prompt.text.en}
                        isCompleted={isCompleted}
                        memoryId={memoryForPrompt?.id}
                        onStartChapter={handleStartChapter}
                        onViewEditChapter={handleViewEditChapter}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCustomChapterDialog} onOpenChange={setShowCustomChapterDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" /> Brainstorm Custom Chapter Idea
            </DialogTitle>
            <DialogDescription>
              Provide some context about yourself to help the AI generate relevant chapter ideas.
              These ideas can then become the titles for new memory chapters.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="custom-chapter-user-profile">About Yourself (for AI Chapter Ideas)</Label>
              <Textarea
                id="custom-chapter-user-profile"
                value={customChapterUserProfile}
                onChange={(e) => setCustomChapterUserProfile(e.target.value)}
                placeholder="Feeling stuck or unsure where to begin? Share key life themes, interests, or periods (e.g., 'early childhood in London', 'my passion for gardening', 'travels in the 70s'). The AI will suggest relevant chapter starting points."
                rows={4}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-grow space-y-1">
                <Label htmlFor="custom-chapter-language">Language for Ideas</Label>
                <Select value={customChapterLanguage} onValueChange={(value: 'en' | 'gu') => setCustomChapterLanguage(value)}>
                  <SelectTrigger id="custom-chapter-language">
                    <Languages className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateCustomChapterIdeas} disabled={isLoadingChapterIdeas} className="w-full sm:w-auto">
                {isLoadingChapterIdeas ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                Generate Ideas
              </Button>
            </div>
            {generatedChapterIdeas.length > 0 && (
              <div className="space-y-2 pt-2 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium">Suggested Chapter Ideas:</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-2">These chapter themes were generated by the AI based on your profile. Clicking an idea will take you to the memory form with that idea pre-filled as the chapter title, ready for you to elaborate with your story.</p>
                <ul className="space-y-1">
                  {generatedChapterIdeas.map((idea, index) => (
                    <li key={index}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-1.5 px-2"
                        onClick={() => handleCustomIdeaSelected(idea)}
                      >
                        {idea}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomChapterDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AuthenticatedPageWrapper>
  );
}
