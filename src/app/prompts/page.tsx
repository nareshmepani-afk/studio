
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { PromptCard } from '@/components/prompts/PromptCard';
import { mockPromptGroups } from '@/lib/mockData';
import { teleprompterScripts } from '@/lib/teleprompterScripts';
import { Button } from '@/components/ui/button';
import { Film, CheckCircle, Loader2, Languages, HelpCircle, Sparkles, Lightbulb, Zap, Star as StarIcon, Info, QrCode } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { getHostPassPriceAction } from '@/actions/getHostPassPriceAction';
import type { GetHostPassPriceOutput } from '@/ai/flows/get-host-pass-price-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { app } from '@/lib/firebase';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { addMonths, isBefore, parseISO, format, addDays } from 'date-fns';
import QRCode from "qrcode.react";
import type { Memory } from '@/types';
import { useMemories } from '@/hooks/useMemories';
import { usePromptFlags } from '@/hooks/usePromptFlags';


const FIRESTORE_USER_PROMPT_FLAGS_COLLECTION = 'userPromptFlags';

// This component is wrapped by AuthenticatedPageWrapper, which handles the auth loading state.
export default function LifeJourneyPage() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'gu'>('en');
  const router = useRouter();
  const isMountedRef = useRef(true);

  const {
    user,
    loading: authLoading, // We still use this to know when the user object is ready.
    userMode,
    hostPassStatus,
    updateUserProfileInFirestore,
  } = useAuth();
  
  // SENIOR ENGINEER FIX: Data fetching is now LOCAL to the component that needs it.
  const { memories, completedPromptIds, isLoading: isMemoriesLoading } = useMemories();
  const { flaggedPromptIds, isLoading: isFlagsLoading } = usePromptFlags();

  // The definitive loading state for this page.
  const isDataLoading = authLoading || isMemoriesLoading || isFlagsLoading;
  
  const [hostPassPriceDetails, setHostPassPriceDetails] = useState<GetHostPassPriceOutput | null>(null);
  const [isFetchingHostPassPrice, setIsFetchingHostPassPrice] = useState(false);

  const [showCustomChapterDialog, setShowCustomChapterDialog] = useState(false);
  const [customChapterUserProfile, setCustomChapterUserProfile] = useState('');
  const [customChapterLanguage, setCustomChapterLanguage] = useState<'en' | 'gu'>('en');
  const [generatedChapterIdeas, setGeneratedChapterIdeas] = useState<string[]>([]);
  const [isLoadingChapterIdeas, setIsLoadingChapterIdeas] = useState(false);

  const [qrCodeDialog, setQrCodeDialog] = useState<{ open: boolean; url: string; title: string; }>({ open: false, url: '', title: '' });


  const db = getFirestore(app);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => { if (user?.profileInfo) setCustomChapterUserProfile(user.profileInfo); }, [user?.profileInfo]);
  
  const fetchHostPassPrice = useCallback(async () => {
    if (isFetchingHostPassPrice || hostPassPriceDetails || !user) return;
    setIsFetchingHostPassPrice(true);
    try {
      const priceData = await getHostPassPriceAction({ city: user.city || 'London', country: user.countryOfBirth || 'UK' });
      if (isMountedRef.current) {
        setHostPassPriceDetails(priceData);
      }
    } catch (error) {
      console.error("PromptsPage: Failed to fetch HOST pass price:", error);
    } finally {
      if (isMountedRef.current) {
        setIsFetchingHostPassPrice(false);
      }
    }
  }, [isFetchingHostPassPrice, hostPassPriceDetails, user]);

    const activateFreeHostPass = useCallback(async () => {
        if (user && user.hostPassStatus === 'no_pass_initiated') {
        const now = new Date();
        await updateUserProfileInFirestore(user.id, { hostPassStatus: 'free_host_pass_active', freeHostPassActivatedDate: now.toISOString() });
        toast({ title: "Free Host Pass Activated!", description: `Your 6-month free host pass starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000, variant: "success" });
        }
    }, [user, updateUserProfileInFirestore]);

    const purchasePaidHostPass = useCallback(async () => {
        if (user) {
        const now = new Date(); let startDate = now;
        if (user.hostPassStatus === 'paid_host_pass_active' && user.paidHostPassExpiryDate && isBefore(now, parseISO(user.paidHostPassExpiryDate))) { startDate = parseISO(user.paidHostPassExpiryDate); }
        const newExpiryDate = addDays(startDate, 31);
        await updateUserProfileInFirestore(user.id, { hostPassStatus: 'paid_host_pass_active', paidHostPassExpiryDate: newExpiryDate.toISOString() });
        toast({ title: "Host Pass Activated (Payment Simulated)!", description: `Your 31-day host pass is active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000, variant: "success" });
        }
    }, [user, updateUserProfileInFirestore]);

  useEffect(() => {
    if (user && (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired')) {
      fetchHostPassPrice();
    }
  }, [user, hostPassStatus, fetchHostPassPrice]);

  const canAccessFullJourney = useMemo(() => {
    return hostPassStatus === 'free_host_pass_active' || hostPassStatus === 'paid_host_pass_active';
  }, [hostPassStatus]);

  const availablePromptGroups = useMemo(() => {
    if (canAccessFullJourney || mockPromptGroups.length === 0) return mockPromptGroups;
    return [mockPromptGroups[0]];
  }, [canAccessFullJourney]);

  const handleToggleFlagPrompt = useCallback(async (promptIdToToggle: string) => {
    if (!user || !flaggedPromptIds) return;
    const newFlaggedStatus = !flaggedPromptIds.has(promptIdToToggle);
    const promptFlagsDocRef = doc(db, FIRESTORE_USER_PROMPT_FLAGS_COLLECTION, user.id);
    try {
        await setDoc(promptFlagsDocRef, { [promptIdToToggle]: newFlaggedStatus }, { merge: true });
        toast({
            title: newFlaggedStatus ? "Prompt Flagged" : "Prompt Unflagged",
            description: `This prompt is ${newFlaggedStatus ? "now flagged." : "no longer flagged."}`,
            variant: "success"
        });
    } catch (error) {
        console.error("Error updating prompt flag in Firestore:", error);
        toast({ title: "Flagging Error", variant: "destructive" });
    }
  }, [user, flaggedPromptIds, db]);

  const handleGenerateCustomChapterIdeas = useCallback(async () => {
    if (!customChapterUserProfile.trim() && !user?.profileInfo?.trim()) {
      toast({ title: "Profile Info Needed", description: "Please provide some information about yourself or your interests in the text area." });
      return;
    }
    if (!canAccessFullJourney) {
        toast({ title: "Host Pass Required", description: "Activate or purchase a Host Pass to use AI brainstorming." });
        return;
    }
    setIsLoadingChapterIdeas(true);
    try {
      const profileToUse = customChapterUserProfile.trim() ? customChapterUserProfile : user?.profileInfo || '';
      const result = await generateMemoryCuesAction({ userProfile: profileToUse, currentDate: new Date().toISOString().split('T')[0], language: customChapterLanguage });
      if (isMountedRef.current) {
        setGeneratedChapterIdeas(result.memoryCues);
        toast({ title: result.memoryCues.length > 0 ? "Chapter Ideas Generated!" : "No Ideas Generated", variant: result.memoryCues.length > 0 ? "success" : "default" });
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({ title: "Error Generating Ideas", variant: "destructive" });
      }
    }
    if (isMountedRef.current) {
      setIsLoadingChapterIdeas(false);
    }
  }, [customChapterUserProfile, user?.profileInfo, canAccessFullJourney, customChapterLanguage]);

  const handleCustomIdeaSelected = useCallback((idea: string) => {
    if (!canAccessFullJourney) {
        toast({ title: "Host Pass Required", description: "Activate or purchase a Host Pass to start custom chapters." });
        return;
    }
    toast({ title: "Custom Chapter Selected!", description: `Starting chapter: "${idea}". Redirecting...`});
    router.push(`/add-memory?prompt=${encodeURIComponent(idea)}`);
    setShowCustomChapterDialog(false);
    setGeneratedChapterIdeas([]);
  }, [canAccessFullJourney, router]);

  const handleHostPassAction = useCallback(() => {
    if (hostPassStatus === 'no_pass_initiated') {
      activateFreeHostPass();
    } else if (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired') {
      purchasePaidHostPass();
    }
  }, [hostPassStatus, activateFreeHostPass, purchasePaidHostPass]);

  const handleShowQrCode = useCallback((promptId: string, promptTitle: string) => {
    const url = `${window.location.origin}/prompts/${promptId}`;
    setQrCodeDialog({ open: true, url, title: promptTitle });
  }, []);

  // **** THE FIX: REMOVED useCallback ****
  // This function is now recreated on every render, ensuring it always has the latest
  // router, memories, and canAccessFullJourney state, thus fixing the stale closure bug.
  const handleStartChapter = (promptId: string, isCompleted: boolean) => {
      const isFirstGroupPrompt = mockPromptGroups[0]?.prompts.some(p => p.id === promptId);
      if (!canAccessFullJourney && !isCompleted && !isFirstGroupPrompt) {
          toast({ title: "Activate Pass", description: "Please activate or purchase a Host Pass to start new chapters." });
          return;
      }

      // The key fix: wrap router.push in a setTimeout to escape the current event cycle.
      // This part remains valid to prevent other potential React lifecycle issues.
      setTimeout(() => {
        if (isCompleted) {
            const memory = memories.find((m: Memory) => m.promptId === promptId);
            if (memory) {
                router.push(`/add-memory?editMemoryId=${encodeURIComponent(memory.id)}`);
            } else {
                toast({ title: "Error", description: "Could not find the recorded memory for this chapter.", variant: "destructive" });
            }
        } else {
            router.push(`/add-memory?promptId=${encodeURIComponent(promptId)}`);
        }
      }, 0);
  };


  const hostPassButtonText = useMemo(() => {
    if (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired') {
        if (isFetchingHostPassPrice) return "Fetching price...";
        if (hostPassPriceDetails) return `Purchase Host Pass (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: hostPassPriceDetails.currency }).format(hostPassPriceDetails.passPrice)})`;
        return `Purchase Host Pass (price unavailable)`;
    }
    return "Activate 6-Month Free Host Pass";
  }, [hostPassStatus, isFetchingHostPassPrice, hostPassPriceDetails]);

  // The wrapper handles the auth splash screen. This handles the page's own data loading.
  if (isDataLoading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-headline mb-2">Loading Life Journey...</h2>
          <p className="text-muted-foreground">Please wait while your data is loaded.</p>
        </div>
     );
  }
  
  if (userMode === 'guest') {
    return (
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
            <p>Use the <QrCode className="inline-block h-4 w-4" /> icon to get a shareable QR code for an interviewer, or the <Info className="inline-block h-4 w-4" /> icon for a preview of the teleprompter script.</p>
            <p>Completed chapters are marked with a <CheckCircle className="inline-block h-4 w-4 text-green-500" />. You can view or edit these at any time.</p>
            <p>Use the <StarIcon className="inline-block h-4 w-4 text-amber-500" /> icon on a prompt to flag it for later re-use or if it particularly resonates with you.</p>
          </AlertDescription>
        </Alert>


        {(!canAccessFullJourney) && (
          <Alert className="mb-6 bg-primary/10 border-primary/30">
            {hostPassStatus === 'no_pass_initiated' ? <StarIcon className="h-5 w-5 text-primary" /> : <Zap className="h-5 w-5 text-primary" />}
            <AlertTitle className="font-headline text-primary">
              {hostPassStatus === 'no_pass_initiated' ? "Unlock Full Life Journey Access" : "Renew Host Pass for Full Access"}
            </AlertTitle>
            <AlertDescription className="text-primary/80 flex flex-col items-start">
              <p className="w-full">{hostPassStatus === 'no_pass_initiated'
                ? "Only the first chapter group is available. Activate your 6-month free Host Pass to access all chapters and AI brainstorming."
                : "Your Host Pass has expired. Renew to continue accessing all Life Journey chapters and creation tools."
              }</p>
              <Button onClick={handleHostPassAction} size="sm" className="mt-3" disabled={isFetchingHostPassPrice}>
                {isFetchingHostPassPrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (hostPassStatus === 'no_pass_initiated' ? <StarIcon className="mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4"/>)}
                {hostPassButtonText}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {availablePromptGroups.length === 0 && (
          <div className="text-center py-12">
            <Film className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="font-headline text-2xl mb-2">No Chapters Found</h2>
            <p className="text-muted-foreground">Try brainstorming a custom chapter!</p>
          </div>
        )}

        <div className="space-y-10">
          {availablePromptGroups.map((group) => (
            <section key={group.id}>
              <h2 className="font-headline text-3xl mb-6 border-b pb-3 text-primary">{group.title[currentLanguage] || group.title.en}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    promptId={prompt.id}
                    promptText={prompt.text[currentLanguage] || prompt.text.en}
                    teleprompterScript={teleprompterScripts[prompt.id] || "No script available for this prompt."}
                    isCompleted={completedPromptIds.has(prompt.id)}
                    isFlaggedForReuse={flaggedPromptIds.has(prompt.id)}
                    onStartChapter={handleStartChapter}
                    onToggleFlagPrompt={handleToggleFlagPrompt}
                    onShowQrCode={handleShowQrCode}
                    canAccess={canAccessFullJourney || availablePromptGroups[0].prompts.some(p => p.id === prompt.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
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

      <Dialog open={qrCodeDialog.open} onOpenChange={(open) => !open && setQrCodeDialog({ open: false, url: '', title: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-lg">Scan to View Prompt</DialogTitle>
            <DialogDescription>
              An interviewer can scan this QR code with their phone to open a webpage with the teleprompter script for the prompt: <strong>{qrCodeDialog.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <QRCode value={qrCodeDialog.url} size={256} level={"H"} includeMargin={true} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrCodeDialog({ open: false, url: '', title: '' })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedPageWrapper>
  );
}
