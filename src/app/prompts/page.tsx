
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptCard } from '@/components/prompts/PromptCard';
import { mockPromptGroups } from '@/lib/mockData'; // mockPromptGroups remains for structure
import type { Prompt, PromptGroup, Memory } from '@/types';
import { Button } from '@/components/ui/button';
import { Film, CheckCircle, Loader2, Languages, HelpCircle, Sparkles, Lightbulb, Zap, Star as StarIcon, Info } from 'lucide-react'; 
import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

// Use a different key for Firestore-backed prompt flags if needed, or integrate into user document
const FIRESTORE_USER_PROMPT_FLAGS_COLLECTION = 'userPromptFlags'; 

export default function LifeJourneyPage() {
  const [promptGroups, setPromptGroups] = useState<PromptGroup[]>(mockPromptGroups); // Initialize with static structure
  const [completedPromptIds, setCompletedPromptIds] = useState<Set<string>>(new Set());
  const [flaggedPromptIds, setFlaggedPromptIds] = useState<Set<string>>(new Set());
  
  const [isLoading, setIsLoading] = useState(true); // Start as true
  const [memoriesLoaded, setMemoriesLoaded] = useState(false);
  const [flagsLoaded, setFlagsLoaded] = useState(false);

  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'gu'>('en');
  const router = useRouter();
  
  const { 
    user, 
    userMode, 
    purchasePaidHostPass, 
    activateFreeHostPass, 
    hostPassPriceDetails, 
    isFetchingHostPassPrice: isFetchingAuthHostPassPrice,
    hostPassStatus 
  } = useAuth(); 

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
    if (canAccessFullJourney || promptGroups.length === 0) return promptGroups;
    return [promptGroups[0]]; // Show only first group if pass not active
  }, [canAccessFullJourney, promptGroups]);

  // Fetch completed prompts and flagged prompts from Firestore
  useEffect(() => {
    if (!user) {
      setMemoriesLoaded(true); // No user, so consider these "loaded"
      setFlagsLoaded(true);
      setCompletedPromptIds(new Set());
      setFlaggedPromptIds(new Set());
      return;
    }

    setIsLoading(true); // Reset loading states when user changes
    setMemoriesLoaded(false);
    setFlagsLoaded(false);

    let unsubscribeMemories: () => void = () => {};
    let unsubscribeFlags: () => void = () => {};

    // Fetch completed prompts based on memories
    const memoriesColRef = collection(db, "users", user.id, "memories");
    const memoriesQuery = query(memoriesColRef, where("promptId", "!=", null));
    unsubscribeMemories = onSnapshot(memoriesQuery, (snapshot) => {
      const ids = new Set(snapshot.docs.map(docSnap => docSnap.data().promptId as string).filter(Boolean));
      setCompletedPromptIds(ids);
      setMemoriesLoaded(true);
    }, (error) => {
      console.error("Error fetching completed prompts:", error);
      toast({ title: "Error loading completion status", variant: "destructive" });
      setMemoriesLoaded(true); // Still mark as loaded to unblock UI
    });

    // Fetch flagged prompts from user's promptFlags subcollection
    const promptFlagsDocRef = doc(db, FIRESTORE_USER_PROMPT_FLAGS_COLLECTION, user.id);
    unsubscribeFlags = onSnapshot(promptFlagsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const flaggedIdsFromDb = Object.entries(data)
                .filter(([_, value]) => value === true)
                .map(([key, _]) => key);
            setFlaggedPromptIds(new Set(flaggedIdsFromDb));
        } else {
            setFlaggedPromptIds(new Set());
        }
        setFlagsLoaded(true);
    }, (error) => {
        console.error("Error fetching flagged prompts:", error);
        setFlagsLoaded(true); // Still mark as loaded
    });

    return () => {
      unsubscribeMemories();
      unsubscribeFlags();
    };
  }, [user]);

  // Effect to manage the overall isLoading state based on individual data loads
  useEffect(() => {
    if (memoriesLoaded && flagsLoaded) {
      setIsLoading(false);
    } else if (!user && memoriesLoaded && flagsLoaded) { // Case for no user, initial load done
      setIsLoading(false);
    }
  }, [user, memoriesLoaded, flagsLoaded]);


  const handleStartChapter = (promptId: string, promptText: string) => {
    const isPromptInAvailableGroups = availablePromptGroups.flatMap(g => g.prompts).some(p => p.id === promptId);

    if (!canAccessFullJourney && !isPromptInAvailableGroups) {
        setTimeout(() => toast({ title: "Activate Pass", description: "Please activate or purchase a Host Pass to start new chapters.", variant: "destructive" }), 0);
        return;
    }
    setTimeout(() => toast({ title: "Starting New Chapter!", description: `Prompt: "${promptText}". Redirecting...`}), 0);
    router.push(`/add-memory?promptId=${encodeURIComponent(promptId)}`); // Removed prompt text from query
  };

  const handleViewEditChapter = async (promptId: string) => {
    if (!user) return;
    // Find the memory associated with this promptId from Firestore
    // This is slightly inefficient if many memories exist, could optimize if needed.
    const memoriesColRef = collection(db, "users", user.id, "memories");
    const q = query(memoriesColRef, where("promptId", "==", promptId));
    
    try {
      const snapshot = await onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const memoryDoc = querySnapshot.docs[0];
          router.push(`/add-memory?editMemoryId=${encodeURIComponent(memoryDoc.id)}&promptId=${encodeURIComponent(promptId)}`);
        } else {
          toast({ title: "Error", description: "Could not find the recorded memory for this chapter.", variant: "destructive" });
        }
      });
      // Detach listener after first result or handle errors appropriately if it's a long-lived listener.
      // For a simple navigation, a getDocs might be better if not needing real-time updates here.
      // For simplicity here, we assume one-time fetch for navigation.
      // To make it truly one-time, replace onSnapshot with getDocs(q) and process snapshot.docs[0].
      // Example with getDocs:
      // const querySnapshot = await getDocs(q);
      // if (!querySnapshot.empty) { /* ... */ }

    } catch (error) {
      console.error("Error finding memory for prompt:", error);
      toast({ title: "Error", description: "Could not retrieve memory details.", variant: "destructive" });
    }
  };

  const handleToggleFlagPrompt = useCallback(async (promptIdToToggle: string) => {
    if (!user) return;
    const newFlagStatus = !flaggedPromptIds.has(promptIdToToggle);
    
    const promptFlagsDocRef = doc(db, FIRESTORE_USER_PROMPT_FLAGS_COLLECTION, user.id);
    try {
        await setDoc(promptFlagsDocRef, { [promptIdToToggle]: newFlagStatus }, { merge: true });
        // Optimistically update UI, onSnapshot will confirm
        setFlaggedPromptIds(prev => {
            const newSet = new Set(prev);
            if (newFlagStatus) newSet.add(promptIdToToggle);
            else newSet.delete(promptIdToToggle);
            return newSet;
        });
        
        const promptText = mockPromptGroups.flatMap(g => g.prompts).find(p => p.id === promptIdToToggle)?.text[currentLanguage] || "This prompt";
        toast({
            title: newFlagStatus ? "Prompt Flagged" : "Prompt Unflagged",
            description: `"${promptText}" is ${newFlagStatus ? "now flagged." : "no longer flagged."}`,
        });
    } catch (error) {
        console.error("Error updating prompt flag in Firestore:", error);
        toast({ title: "Flagging Error", variant: "destructive" });
    }
  }, [user, flaggedPromptIds, currentLanguage]);


  const handleGenerateCustomChapterIdeas = async () => {
    if (!customChapterUserProfile.trim() && !user?.profileInfo?.trim()) {
      setTimeout(() => toast({ title: "Profile Info Needed", description: "Please provide some information about yourself or your interests in the text area.", variant: "destructive" }), 0);
      return;
    }
    if (!canAccessFullJourney) {
        setTimeout(() => toast({ title: "Host Pass Required", description: "Activate or purchase a Host Pass to use AI brainstorming.", variant: "destructive" }), 0);
        return;
    }
    setIsLoadingChapterIdeas(true);
    try {
      const profileToUse = customChapterUserProfile.trim() ? customChapterUserProfile : user?.profileInfo || '';
      const result = await generateMemoryCuesAction({ userProfile: profileToUse, currentDate: new Date().toISOString().split('T')[0], language: customChapterLanguage });
      setGeneratedChapterIdeas(result.memoryCues);
      setTimeout(() => toast({ title: result.memoryCues.length > 0 ? "Chapter Ideas Generated!" : "No Ideas Generated" }), 0);
    } catch (error) {
      setTimeout(() => toast({ title: "Error Generating Ideas", variant: "destructive" }), 0);
    }
    setIsLoadingChapterIdeas(false);
  };

  const handleCustomIdeaSelected = (idea: string) => {
    if (!canAccessFullJourney) {
        setTimeout(() => toast({ title: "Host Pass Required", description: "Activate or purchase a Host Pass to start custom chapters.", variant: "destructive" }), 0);
        return;
    }
    setTimeout(() => toast({ title: "Custom Chapter Selected!", description: `Starting chapter: "${idea}". Redirecting...`}), 0);
    // For custom ideas, we don't have a promptId, just the text
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
         hostPassButtonText = `Purchase Host Pass (£12.99 - Mock)`;
    }
  }

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
        
        <Alert className="mb-8 bg-secondary/50 border-secondary/20 shadow">
          <Info className="h-5 w-5 text-secondary-foreground" />
          <AlertTitle className="font-headline text-secondary-foreground">Welcome to Your Life Journey!</AlertTitle>
          <AlertDescription className="text-secondary-foreground/80 space-y-1.5">
            <p>This is where you can explore guided chapters to record your life story. Click on a prompt below to start recording your memory for that chapter.</p>
            <p>Completed chapters are marked with a <CheckCircle className="inline-block h-4 w-4 text-green-500" />. You can view or edit these at any time.</p>
            <p>Use the <StarIcon className="inline-block h-4 w-4 text-amber-500" /> icon on a prompt to flag it for later re-use or if it particularly resonates with you.</p>
            <p>Full access to all chapter groups and the "Brainstorm Custom Chapter" feature requires an active Host Pass. If your pass is inactive, you'll only see the first chapter group.</p>
          </AlertDescription>
        </Alert>


        {(!canAccessFullJourney && (hostPassStatus === 'no_pass_initiated' || hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired')) && (
          <Alert className="mb-6 bg-primary/10 border-primary/30">
            {hostPassStatus === 'no_pass_initiated' ? <StarIcon className="h-5 w-5 text-primary" /> : <Zap className="h-5 w-5 text-primary" />}
            <AlertTitle className="font-headline text-primary">
              {hostPassStatus === 'no_pass_initiated' 
                ? "Unlock Full Life Journey Access" 
                : "Renew Host Pass for Full Access"}
            </AlertTitle>
            <AlertDescription className="text-primary/80 flex flex-col items-start">
              {hostPassStatus === 'no_pass_initiated' 
                ? (
                    <>
                        <p className="w-full">Only the first chapter group is available.</p>
                        <p className="mt-1 w-full">Activate your 6-month free Host Pass to access all chapters, AI brainstorming, and more features to continue your Life Journey.</p>
                    </>
                  )
                : <p className="w-full">Your Host Pass has expired. Renew to continue accessing all Life Journey chapters and creation tools.</p>}
              
              <Button
                onClick={handleHostPassAction}
                size="sm"
                className={cn(
                  "mt-3 bg-primary hover:bg-primary/90 text-primary-foreground w-fit",
                  hostPassStatus === 'no_pass_initiated' && "px-4"
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
                    <StarIcon className="mr-2 h-4 w-4" />
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
                    // Finding memoryId for completed prompts for View/Edit would require another query or passing full memory objects.
                    // For now, handleViewEditChapter will query Firestore for the specific memory.
                    const isFlagged = flaggedPromptIds.has(prompt.id);
                    
                    return (
                      <PromptCard
                        key={prompt.id}
                        promptId={prompt.id}
                        promptText={prompt.text[currentLanguage] || prompt.text.en}
                        isCompleted={isCompleted}
                        // memoryId is not directly passed here as it's not readily available without complex state management
                        isFlaggedForReuse={isFlagged}
                        onStartChapter={handleStartChapter}
                        onViewEditChapter={handleViewEditChapter} // This will find the memoryId
                        onToggleFlagPrompt={handleToggleFlagPrompt}
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
              <p className="text-xs text-muted-foreground pt-1">Mentioning specific decades, significant life events (like migrations, career changes), or periods you lived through can help AI generate more evocative, context-rich chapter ideas.</p>
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
