
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptCard } from '@/components/prompts/PromptCard';
import { mockPromptGroups, mockMemories } from '@/lib/mockData';
import type { Prompt, PromptGroup, Memory } from '@/types';
import { Button } from '@/components/ui/button';
import { Film, CheckCircle, Loader2, Languages, HelpCircle, Sparkles, Lightbulb, Zap, Star } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { cn } from "@/lib/utils";

export default function LifeJourneyPage() {
  const [promptGroups, setPromptGroups] = useState<PromptGroup[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'gu'>('en');
  const router = useRouter();
  
  const { 
    user, 
    userMode, 
    purchasePaidHostPass, 
    activateFreeHostPass, 
    hostPassPriceDetails, 
    isFetchingHostPassPrice: isFetchingAuthHostPassPrice 
  } = useAuth(); 
  const hostPassStatus = user?.hostPassStatus; 

  const [showCustomChapterDialog, setShowCustomChapterDialog] = useState(false);
  const [customChapterUserProfile, setCustomChapterUserProfile] = useState('');
  const [customChapterLanguage, setCustomChapterLanguage] = useState<'en' | 'gu'>('en');
  const [generatedChapterIdeas, setGeneratedChapterIdeas] = useState<string[]>([]);
  const [isLoadingChapterIdeas, setIsLoadingChapterIdeas] = useState(false);

  const isActuallyFetchingHostPassPrice = isFetchingAuthHostPassPrice;


  useEffect(() => { if (user?.profileInfo) setCustomChapterUserProfile(user.profileInfo); }, [user?.profileInfo]);

  const canAccessFullJourney = useMemo(() => {
    return hostPassStatus === 'free_host_pass_active' || hostPassStatus === 'paid_host_pass_active';
  }, [hostPassStatus]);

  const availablePromptGroups = useMemo(() => {
    if (canAccessFullJourney) return mockPromptGroups;
     if (hostPassStatus === 'no_pass_initiated' || hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired') {
        return mockPromptGroups.length > 0 ? [mockPromptGroups[0]] : [];
     }
    return []; 
  }, [hostPassStatus, canAccessFullJourney]);


  useEffect(() => {
    setTimeout(() => {
      setPromptGroups(mockPromptGroups); 
      const userMemories = mockMemories.filter(m => m.userId === user?.id);
      setMemories(userMemories);
      setIsLoading(false);
    }, 500);
  }, [user?.id]);

  const completedPromptIds = useMemo(() => new Set(memories.filter(m => m.promptId).map(m => m.promptId)), [memories]);

  const handleStartChapter = (promptId: string, promptText: string) => {
    const isPromptInAvailableGroups = availablePromptGroups.flatMap(g => g.prompts).some(p => p.id === promptId);

    if (!canAccessFullJourney && !isPromptInAvailableGroups) {
        toast({ title: "Activate Pass", description: "Please activate or purchase a Host Pass to start new chapters.", variant: "destructive" });
        return;
    }
    toast({ title: "Starting New Chapter!", description: `Prompt: "${promptText}". Redirecting...`});
    router.push(`/add-memory?prompt=${encodeURIComponent(promptText)}&promptId=${encodeURIComponent(promptId)}`);
  };

  const handleViewEditChapter = (promptId: string) => {
    const memoryForPrompt = memories.find(m => m.promptId === promptId);
    if (memoryForPrompt) {
      router.push(`/add-memory?editMemoryId=${encodeURIComponent(memoryForPrompt.id)}&promptId=${encodeURIComponent(promptId)}`);
    } else {
      toast({ title: "Error", description: "Could not find the recorded memory for this chapter.", variant: "destructive" });
    }
  };

  const handleGenerateCustomChapterIdeas = async () => {
    if (!customChapterUserProfile.trim() && !user?.profileInfo?.trim()) {
      toast({ title: "Profile Info Needed", description: "Please provide some information about yourself or your interests in the text area.", variant: "destructive" });
      return;
    }
    if (!canAccessFullJourney) {
        toast({ title: "Host Pass Required", description: "Activate or purchase a Host Pass to use AI brainstorming.", variant: "destructive" });
        return;
    }
    setIsLoadingChapterIdeas(true);
    try {
      const profileToUse = customChapterUserProfile.trim() ? customChapterUserProfile : user?.profileInfo || '';
      const result = await generateMemoryCuesAction({ userProfile: profileToUse, currentDate: new Date().toISOString().split('T')[0], language: customChapterLanguage });
      setGeneratedChapterIdeas(result.memoryCues);
      toast({ title: result.memoryCues.length > 0 ? "Chapter Ideas Generated!" : "No Ideas Generated" });
    } catch (error) {
      toast({ title: "Error Generating Ideas", variant: "destructive" });
    }
    setIsLoadingChapterIdeas(false);
  };

  const handleCustomIdeaSelected = (idea: string) => {
    if (!canAccessFullJourney) {
        toast({ title: "Host Pass Required", description: "Activate or purchase a Host Pass to start custom chapters.", variant: "destructive" });
        return;
    }
    toast({ title: "Custom Chapter Selected!", description: `Starting chapter: "${idea}". Redirecting...`});
    router.push(`/add-memory?prompt=${encodeURIComponent(idea)}`); 
    setShowCustomChapterDialog(false);
    setGeneratedChapterIdeas([]); 
  };

  const handleHostPassAction = () => {
    if (hostPassStatus === 'no_pass_initiated') {
      activateFreeHostPass();
    } else if (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired') {
      purchasePaidHostPass();
    }
  };
  
  let hostPassButtonText = "Activate 6-Month Free Host Pass";
  let hostPassPriceString = ""; 
  if (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired') {
    hostPassButtonText = "Purchase Host Pass"; 
    if (isActuallyFetchingHostPassPrice) {
        hostPassButtonText = "Fetching price...";
    } else if (hostPassPriceDetails) {
        hostPassPriceString = ` (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: hostPassPriceDetails.currency }).format(hostPassPriceDetails.passPrice)})`;
        hostPassButtonText = `Purchase Host Pass ${hostPassPriceString}`;
    } else {
         hostPassButtonText = `Purchase Host Pass (£4.99/month - Mock)`;
    }
  }

  console.log("[PromptsPage] Rendering with hostPassStatus from user object:", user?.hostPassStatus, "User object:", user);

  if (userMode === 'guest') {
    return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-8 px-4 text-center">
          <HelpCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="font-headline text-3xl mb-2">Life Journey Not Available</h1>
          <p className="text-muted-foreground mb-6">
            This feature is for hosts to record their memories. Guests can view memories shared with them on the Timeline.
          </p>
          <Link href="/timeline" passHref>
            <Button variant="outline">Go to Timeline</Button>
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
          <h2 className="text-2xl font-headline mb-2">Loading Life Journey...</h2>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <Film className="h-10 w-10 text-primary mr-3" /> 
            <h1 className="font-headline text-4xl">My Life Journey</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button onClick={() => setShowCustomChapterDialog(true)} variant="secondary" className="w-full sm:w-auto" disabled={!canAccessFullJourney}>
                <Sparkles className="mr-2 h-4 w-4" /> Brainstorm Custom Chapter
              </Button>
              <div className="w-full sm:w-auto">
                <Label htmlFor="prompt-language" className="sr-only">Language</Label>
                <Select value={currentLanguage} onValueChange={(value: 'en' | 'gu') => setCurrentLanguage(value)}>
                  <SelectTrigger id="prompt-language" className="w-full">
                    <Languages className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Language" />
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
            <p className="text-muted-foreground">Welcome! Click a prompt to record memories or brainstorm a custom chapter. Completed chapters are marked with <CheckCircle className="inline-block h-4 w-4 text-green-500" />.</p>
            {!canAccessFullJourney && hostPassStatus !== 'no_pass_initiated' && (
                <p className="text-sm text-primary mt-1">Your Host Pass has expired. Full access to all chapters and brainstorming requires an active pass.</p>
            )}
             {hostPassStatus === 'no_pass_initiated' && !canAccessFullJourney && (
                <p className="text-sm text-primary mt-1">Activate your 6-month free Host Pass to unlock all chapters and features!</p>
            )}
        </div>

        {(!canAccessFullJourney && (hostPassStatus === 'no_pass_initiated' || hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired')) && (
          <Alert className="mb-6 bg-primary/10 border-primary/30">
            {hostPassStatus === 'no_pass_initiated' ? <Star className="h-5 w-5 text-primary" /> : <Zap className="h-5 w-5 text-primary" />}
            <AlertTitle className="font-headline text-primary">
              {hostPassStatus === 'no_pass_initiated' 
                ? "Host Pass & Features" 
                : "Renew Host Pass for Full Access"}
            </AlertTitle>
            <AlertDescription className="text-primary/80">
              {hostPassStatus === 'no_pass_initiated' 
                ? (
                    <>
                        <p>Manage your access to memory creation tools and features.</p>
                        <p className="mt-1">Activate your 6-month free Host Pass to access all chapters, AI brainstorming, and more features to begin your Life Journey.</p>
                    </>
                  )
                : "Your Host Pass has expired. Renew to continue accessing all Life Journey chapters and creation tools."}
              
              <Button
                onClick={handleHostPassAction}
                size="sm"
                className={cn(
                  "mt-3 ml-auto block sm:inline-block sm:ml-3 bg-primary hover:bg-primary/90 text-primary-foreground",
                  hostPassStatus === 'no_pass_initiated' && "px-4" // Increased padding for this specific button
                )}
                disabled={isActuallyFetchingHostPassPrice && (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired')}
              >
                {isActuallyFetchingHostPassPrice && (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired') ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {hostPassButtonText}
                  </>
                ) : hostPassStatus === 'no_pass_initiated' ? (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    {hostPassButtonText}
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4"/>
                    {hostPassButtonText}
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {availablePromptGroups.length === 0 && canAccessFullJourney ? ( 
          <div className="text-center py-12">
            <Film className="mx-auto h-16 w-16 text-muted-foreground mb-4" /> 
            <h2 className="font-headline text-2xl mb-2">No Chapters Found</h2>
            <p className="text-muted-foreground">Try brainstorming a custom chapter!</p>
          </div>
        ) : availablePromptGroups.length === 0 && !canAccessFullJourney ? ( 
            <div className="text-center py-12">
                <Film className="mx-auto h-16 w-16 text-muted-foreground mb-4" /> 
                <h2 className="font-headline text-2xl mb-2">Activate Your Host Pass</h2>
                <p className="text-muted-foreground">Activate or purchase a host pass to begin your Life Journey.</p>
            </div>
        ) : (
          <div className="space-y-10">
            {availablePromptGroups.map((group) => (
              <section key={group.id}>
                <h2 className="font-headline text-3xl mb-6 border-b pb-3 text-primary">{group.title[currentLanguage] || group.title.en}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.prompts.map((prompt) => {
                    const isCompleted = completedPromptIds.has(prompt.id);
                    const memoryForPrompt = memories.find(m => m.promptId === prompt.id);
                    const isPromptActionable = canAccessFullJourney || availablePromptGroups.flatMap(g => g.prompts).some(p => p.id === prompt.id) || isCompleted;
                    
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
            <DialogTitle className="font-headline text-xl flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary" /> Brainstorm Custom Chapter Idea</DialogTitle>
            <DialogDescription>
              Provide context to help AI generate chapter ideas. These become titles for new memory chapters.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="custom-chapter-user-profile">About Yourself (for AI Chapter Ideas)</Label>
              <Textarea
                id="custom-chapter-user-profile"
                value={customChapterUserProfile}
                onChange={(e) => setCustomChapterUserProfile(e.target.value)}
                placeholder="Feeling stuck? Share life themes, interests, periods (e.g., 'childhood in London', 'my gardening passion', '70s travels'). AI will suggest chapter starting points."
                rows={4}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-grow space-y-1">
                <Label htmlFor="custom-chapter-language">Language</Label>
                <Select value={customChapterLanguage} onValueChange={(value: 'en' | 'gu') => setCustomChapterLanguage(value)}>
                  <SelectTrigger id="custom-chapter-language">
                    <Languages className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateCustomChapterIdeas} disabled={isLoadingChapterIdeas || !canAccessFullJourney} className="w-full sm:w-auto">
                {isLoadingChapterIdeas ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                Generate Ideas
              </Button>
            </div>
            {generatedChapterIdeas.length > 0 && (
              <div className="space-y-2 pt-2 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium">Suggested Chapter Ideas:</h4>
                 <p className="text-xs text-muted-foreground mt-1 mb-2">AI generated chapter themes. Clicking an idea pre-fills it as a new chapter title.</p>
                <ul className="space-y-1">
                  {generatedChapterIdeas.map((idea, index) => (
                    <li key={index}>
                      <Button variant="outline" size="sm" className="w-full justify-start text-left h-auto py-1.5 px-2" onClick={() => handleCustomIdeaSelected(idea)}>
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
