
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { Memory, PromptGroup } from '@/types';
import { teleprompterScripts } from '@/lib/teleprompterScripts';
import { toast } from 'sonner';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { getOrCreateMemoryForPrompt } from '@/actions/memoryActions';
import { premiumPromptIds } from '@/lib/premiumPrompts'; // Import the premium prompts list
import { cn } from '@/lib/utils';

// UI Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PromptCard } from '@/components/prompts/PromptCard';
import { QrCodeDialog } from '@/components/prompts/QrCodeDialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons
import { Film, CheckCircle, Loader2, Languages, Info, Plus, Lock } from 'lucide-react';

interface PromptsPageContentProps {
  initialMemories: Memory[];
  initialFlaggedPromptIds: Set<string>;
  mockPromptGroups: PromptGroup[];
  isLoading: boolean;
  hostPassStatus: string;
}

export function PromptsPageContent({ initialMemories, initialFlaggedPromptIds, mockPromptGroups, isLoading, hostPassStatus }: PromptsPageContentProps) {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'gu'>('en');
  const router = useRouter();
  
  const [memories, setMemories] = useState(initialMemories);
  const [flaggedPromptIds, setFlaggedPromptIds] = useState(initialFlaggedPromptIds);

  const { user, loading: authLoading } = useAuth();
  
  const [qrCodeDialog, setQrCodeDialog] = useState<{ open: boolean; url: string; title: string; }>({ open: false, url: '', title: '' });

  useEffect(() => {
    setMemories(initialMemories);
    setFlaggedPromptIds(initialFlaggedPromptIds);
  }, [initialMemories, initialFlaggedPromptIds]);

  const completedPromptIds = useMemo(() => {
    return new Set((memories ?? []).map(m => m.promptId).filter(Boolean) as string[]);
  }, [memories]);

  const handleStartChapter = useCallback((promptId: string, isCompleted: boolean) => {
      if (promptId === 'p25_1') {
        router.push(`/add-memory?custom=true`);
        return;
      }
      if (isCompleted) {
          const memory = memories.find((m: Memory) => m.promptId === promptId);
          if (memory && memory.id) {
              router.push(`/add-memory?editMemoryId=${encodeURIComponent(memory.id)}`);
          } else {
              toast.error("Error", { description: "Could not find the recorded memory for this chapter." });
          }
      } else {
          router.push(`/add-memory?promptId=${encodeURIComponent(promptId)}`);
      }
  }, [memories, router]);

  const handleToggleFlagPrompt = useCallback(async (promptIdToToggle: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const isFlagged = flaggedPromptIds.has(promptIdToToggle);
    try {
      await updateDoc(userRef, {
        flaggedPrompts: isFlagged ? arrayRemove(promptIdToToggle) : arrayUnion(promptIdToToggle)
      });
      toast.success(isFlagged ? "Prompt Unflagged" : "Prompt Flagged");
    } catch (error) {
      toast.error("Flagging Error", { description: "Could not update flag status." });
    }
  }, [user, flaggedPromptIds]);
  
  const handleShowQrCode = useCallback(async (promptId: string, promptTitle: string) => {
    toast("Generating Remote Link", { description: "Please wait..." });

    const currentUser = auth.currentUser;

    if (!currentUser) {
        toast.error("Error", { description: "Authentication not ready." });
        return;
    }

    try {
        const token = await currentUser.getIdToken(true);
        if (!token) {
          toast.error("Error", { description: "Could not get authentication token." });
          return;
        }
        
        const result = await getOrCreateMemoryForPrompt(promptId, token);

        if (result.success && result.memoryId) {
          const url = `${window.location.origin}/studio/${result.memoryId}?role=remote`;
          setQrCodeDialog({ open: true, url, title: `Remote for: ${promptTitle}` });
        } else {
          toast.error("Error", { description: result.message || 'An unknown error occurred.' });
        }
    } catch (error) {
        console.error("Error generating remote link:", error);
        toast.error("Error", { description: "Failed to generate remote link." });
    }
  }, []);

   if (authLoading || isLoading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-headline mb-2">Loading Life Journey...</h2>
        </div>
     );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <Film className="h-10 w-10 text-primary mr-3" />
            <h1 className="font-headline text-4xl">My Life Journey</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Select value={currentLanguage} onValueChange={(value) => setCurrentLanguage(value as 'en' | 'gu')}>
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

        <Alert className="mb-8 bg-secondary/50 border-secondary/20 shadow">
          <Info className="h-5 w-5 text-secondary-foreground" />
          <AlertTitle className="font-headline text-secondary-foreground">Welcome to Your Life Journey!</AlertTitle>
          <AlertDescription className="text-secondary-foreground/80 space-y-1.5">
            <p>Click on a prompt to start recording. Completed chapters are marked with a <CheckCircle className="inline-block h-4 w-4 text-green-500" />.</p>
          </AlertDescription>
        </Alert>

        <div className="space-y-10">
          {mockPromptGroups.map((group) => {
              const isGroupPremium = group.id !== 'part-i';
              const canAccessGroup = !isGroupPremium || hostPassStatus === 'paid_host_pass_active';

              return (
                <section key={group.id}>
                  <h2 className="font-headline text-3xl mb-6 border-b pb-3 text-primary">{group.title[currentLanguage] || group.title.en}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.prompts.map((prompt) => {
                      const isCompleted = completedPromptIds.has(prompt.id);
                      const memoryForPrompt = isCompleted ? memories.find(m => m.promptId === prompt.id) : undefined;
                      
                      const isPremium = premiumPromptIds.has(prompt.id);
                      const canAccess = !isPremium || hostPassStatus === 'paid_host_pass_active';

                      const effectiveOnStartChapter = (promptId: string, isCompleted: boolean) => {
                        if (canAccess) {
                          handleStartChapter(promptId, isCompleted);
                        } else {
                          toast.info("Premium Prompt", { description: "Upgrade your account to unlock this and all other prompts." });
                        }
                      };
                      
                      return (
                        <PromptCard
                          key={prompt.id}
                          promptId={prompt.id}
                          promptText={prompt.text[currentLanguage] || prompt.text.en}
                          teleprompterScript={teleprompterScripts[prompt.id] || "No script available."}
                          isCompleted={isCompleted}
                          isFlaggedForReuse={flaggedPromptIds.has(prompt.id)}
                          isLoading={authLoading}
                          onStartChapter={effectiveOnStartChapter}
                          onToggleFlagPrompt={handleToggleFlagPrompt}
                          onShowQrCode={handleShowQrCode}
                          canAccess={canAccess}
                          memoryDescription={memoryForPrompt?.description}
                        />
                      );
                    })}

                    {/* Add Your Own Memory Card */}
                    <TooltipProvider>
                      <Tooltip delayDuration={canAccessGroup ? 300 : 0}>
                        <TooltipTrigger asChild>
                          <div 
                            onClick={() => {
                              if (canAccessGroup) {
                                router.push(`/add-memory?custom=true&groupId=${group.id}`);
                              } else {
                                router.push('/settings');
                              }
                            }}
                            className={cn(
                              "relative flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all cursor-pointer min-h-[240px] text-center shadow-sm hover:shadow-md",
                              canAccessGroup 
                                ? "border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10" 
                                : "opacity-60 grayscale-[0.5] blur-[0.2px] border-muted-foreground/20 bg-muted/10 hover:opacity-80 hover:grayscale-0"
                            )}
                          >
                            {!canAccessGroup && (
                              <div className="absolute top-3 left-3 flex items-center text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                <Lock className="h-3 w-3 mr-1" />
                                Premium Access
                              </div>
                            )}
                            <div className={cn(
                              "mb-4 p-4 rounded-full transition-all shadow-inner",
                              canAccessGroup ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground"
                            )}>
                              <Plus className="h-8 w-8" />
                            </div>
                            <h3 className={cn(
                              "font-headline text-xl mb-1",
                              canAccessGroup ? "text-primary" : "text-muted-foreground"
                            )}>
                              Add Your Own Memory
                            </h3>
                            <p className="text-xs text-muted-foreground px-4">
                              to "{group.title[currentLanguage] || group.title.en}"
                            </p>
                            
                            {!canAccessGroup && (
                              <div className="mt-6">
                                <Button variant="secondary" size="sm" className="h-8 px-4 text-xs font-bold pointer-events-none">
                                    <Lock className="mr-2 h-3.5 w-3.5" /> Upgrade to Add
                                </Button>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        {!canAccessGroup && (
                          <TooltipContent className="bg-primary text-primary-foreground border-none shadow-2xl p-4 max-w-[280px] rounded-xl">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                <p className="font-bold text-sm">Premium Feature</p>
                              </div>
                              <p className="text-xs leading-relaxed opacity-90">
                                Custom memories allow you to weave your unique stories into this chapter. Upgrade your Host Pass to unlock unlimited freeform recording.
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-wider mt-2 border-t border-white/20 pt-2">
                                Click card to upgrade
                              </p>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </section>
              );
            })}
        </div>
         <QrCodeDialog
          open={qrCodeDialog.open}
          url={qrCodeDialog.url}
          title={qrCodeDialog.title}
          onClose={() => setQrCodeDialog({ open: false, url: '', title: '' })}
        />
      </div>
  );
}
