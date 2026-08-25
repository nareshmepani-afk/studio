"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UnifiedChapter } from '@/hooks/studio/useStudioData';
import { storyScripts } from '@/lib/storyScripts';
import { toast } from 'sonner';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cleanupAndMigrateMemories } from '@/actions/memoryActions';
import { premiumPromptIds } from '@/lib/premiumPrompts';
import { cn } from '@/lib/utils';

import { PromptCard } from '@/components/prompts/PromptCard';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import ProductionDeck from './ProductionDeck';
import { DirectorialUpsellDialog } from './overlays/DirectorialUpsellDialog';
import { stripScreenplayCues } from '@/lib/sanitizer';

// Icons
import { 
  Film, 
  Loader2, 
  Plus, 
  Lock, 
  Clapperboard, 
  MonitorPlay, 
  Sparkles, 
  RefreshCcw,
  LayoutDashboard,
  Clock,
  History,
  MessageSquarePlus,
  ArrowRight,
  Monitor,
  Maximize,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Memory, PromptGroup } from '@/types';

export function StudioDashboard({ 
  chapters,
  requests = [],
  stats,
  initialFlaggedPromptIds,
  isLoading,
  directorPassStatus,
  isGuest = false,
  sessionId = ''
}: { 
  chapters: UnifiedChapter[];
  requests?: any[];
  stats: any;
  initialFlaggedPromptIds: Set<string>;
  isLoading: boolean;
  directorPassStatus: string;
  isGuest?: boolean;
  sessionId?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [flaggedPromptIds, setFlaggedPromptIds] = useState(initialFlaggedPromptIds);
  const [isCleaning, setIsCleaning] = useState(false);

  // Guest Upsell State
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState("creating new scenes");

  // THE INVISIBLE GUIDE: Identify the next logical action for the director
  const recommendedPromptId = React.useMemo(() => {
    for (const chapter of chapters) {
      for (const cp of chapter.prompts) {
        if (!cp.memory) return cp.id;
      }
    }
    return null;
  }, [chapters]);

    // GUEST AUTO-OPEN logic
  // GUEST AUTO-OPEN logic
  useEffect(() => {
    if (isGuest && sessionId) {
      console.log("[StudioDashboard] Guest mode detected. Routing to Production Deck with Session ID:", sessionId);
      router.push(`/studio/production/${sessionId}`);
    }
  }, [isGuest, sessionId, router]);
  const [layoutMode, setLayoutMode] = useState<'takeover' | 'drawer'>('takeover');

  // Ensure Full-Screen is the default on entry
  useEffect(() => {
    setLayoutMode('takeover');
  }, []);

  const toggleLayoutMode = () => {
    const next = layoutMode === 'takeover' ? 'drawer' : 'takeover';
    setLayoutMode(next);
    localStorage.setItem('director_layout_mode', next);
    toast.success(`Layout changed to ${next.charAt(0).toUpperCase() + next.slice(1)} Mode`);
  };

  // Viewport Lock moved to Deck container.

  const handleStartChapter = useCallback((promptId: string, isCompleted: boolean, groupId: string) => {
    let targetId = promptId;
    if (isCompleted) {
        const chapterPrompts = chapters.flatMap(c => c.prompts);
        const cp = chapterPrompts.find(p => p.id === promptId);
        // We still route by promptId to let the container rehydrate it.
        targetId = promptId;
    }
    const actParam = isCompleted ? '?act=1' : '';
    router.push(`/studio/production/${targetId}${actParam}`);
  }, [chapters, router]);

  const handleToggleFlagPrompt = useCallback(async (promptIdToToggle: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const isFlagged = flaggedPromptIds.has(promptIdToToggle);
    try {
      await updateDoc(userRef, {
        flaggedPrompts: isFlagged ? arrayRemove(promptIdToToggle) : arrayUnion(promptIdToToggle)
      });
      setFlaggedPromptIds(prev => {
        const next = new Set(prev);
        if (isFlagged) next.delete(promptIdToToggle);
        else next.add(promptIdToToggle);
        return next;
      });
      toast.success(isFlagged ? "Prompt Unflagged" : "Prompt Flagged");
    } catch (error) {
      toast.error("Flagging Error", { description: "Could not update flag status." });
    }
  }, [user, flaggedPromptIds]);

  const handleCleanupMigration = async () => {
    setIsCleaning(true);
    try {
      const res = await cleanupAndMigrateMemories();
      if (res.success) {
        toast.success("Studio Cleaned", { 
          description: `Studio database optimized.`,
          icon: <Sparkles className="w-4 h-4 text-amber-500" />
        });
      } else {
        toast.error("Cleanup Failed", { description: res.message });
      }
    } catch (e) {
      toast.error("Error", { description: "Migration failed unexpectedly." });
    } finally {
      setIsCleaning(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-headline mb-2 text-primary/80 italic">Synchronizing Studio...</h2>
      </div>
    );
  }

  return (
    <div className="relative flex-1 pb-20">
      <div className="container relative z-10 mx-auto pt-10 px-4 max-w-7xl">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 pb-8 border-b border-white/10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-xl border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                <Clapperboard className="h-10 w-10 text-primary" />
              </div>
              <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-white via-white/95 to-white/40 bg-clip-text text-transparent italic drop-shadow-2xl">
                The Director's Studio
              </h1>
            </div>
            <p className="text-white/80 text-lg md:text-xl font-medium tracking-tight border-l-2 border-primary/40 pl-4 max-w-2xl">
              Backstage of your cinematic journey.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={handleCleanupMigration}
                      disabled={isCleaning}
                      className="w-full md:w-auto border-dashed border-amber-500/30 text-amber-500/80 hover:bg-amber-500/10 hover:text-amber-500 transition-all font-bold tracking-tight"
                    >
                      {isCleaning ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      {isCleaning ? 'Optimizing...' : 'Optimize Studio'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[300px] p-3 text-xs leading-relaxed bg-neutral-900 border-white/10 text-white shadow-2xl">
                    <div className="flex gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <p>Optimize your workspace by removing empty draft shells and migrating legacy memories.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
          </div>
        </header>

        {/* Master Control Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <StatCard 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Total Chapters" 
            value={stats.totalPossible} 
            color="primary"
          />
          <StatCard 
            icon={<MonitorPlay className="w-5 h-5" />} 
            label="Recorded" 
            value={stats.published + (stats.preRelease || 0) + stats.drafts} 
            subLabel={`${stats.completionPercentage}% Published`}
            color="green"
          />
          <StatCard 
            icon={<Clock className="w-5 h-5" />} 
            label="Studio Drafts" 
            value={stats.drafts} 
            color="amber"
          />
          <StatCard 
            icon={<History className="w-5 h-5" />} 
            label="Cinema Releases" 
            value={stats.published} 
            color="primary"
          />
        </div>

        {/* Story Requests Section (Director only) */}
        <AnimatePresence>
          {requests.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16 relative overflow-hidden p-8 rounded-[32px] border border-primary/20 bg-primary/5"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <MessageSquarePlus className="w-24 h-24 text-primary" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Badge className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest px-3">New Requests</Badge>
                  <h2 className="font-headline text-3xl italic tracking-tight text-white">Guest Requests</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {requests.slice(0, 3).map((req) => (
                    <div key={req.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] text-primary font-black uppercase tracking-[.2em] mb-3">Audience Desire</p>
                      <h4 className="text-white font-bold text-lg leading-tight mb-2">"{req.promptTitle}"</h4>
                      <p className="text-white/40 text-xs mb-4 italic">Requested by {req.guestName}</p>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full border border-white/5 hover:bg-primary hover:text-primary-foreground text-[10px] uppercase font-black tracking-widest h-10"
                        onClick={() => handleStartChapter(req.promptId, false, '')}
                      >
                        Start Scene <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Production Board */}
        <div className="space-y-24">
          {chapters.map((chapter) => {
              const isGroupPremium = chapter.id !== 'part-i';
              const canAccessGroup = !isGroupPremium || directorPassStatus === 'paid_host_pass_active';

              return (
                <section key={chapter.id} className="relative">
                  <div className="flex items-center gap-6 mb-12">
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.5em] text-primary/60 font-black mb-1">Production Stage</span>
                        <h2 className="font-headline text-4xl italic text-white tracking-tight">
                          {chapter.title}
                        </h2>
                     </div>
                     <div className="h-px flex-grow bg-gradient-to-r from-white/10 to-transparent" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {chapter.prompts.map((cp) => {
                      const isCompleted = !!cp.memory;
                      const isPremium = premiumPromptIds.has(cp.id);
                      const canAccess = !isPremium || directorPassStatus === 'paid_host_pass_active';

                      const effectiveOnStartChapter = (promptId: string, isCompleted: boolean) => {
                        if (canAccess) {
                          handleStartChapter(promptId, isCompleted, chapter.id);
                        } else {
                          toast.info("Premium Prompt", { description: "Upgrade your account to unlock this and all other prompts." });
                        }
                      };
                      
                      return (
                        <div key={cp.id} className="transform transition-all active:scale-[0.98]">
                          <PromptCard
                            promptId={cp.id}
                            promptText={cp.title}
                            storyScript={storyScripts[cp.id] || "No script available."}
                            isCompleted={isCompleted}
                            isRecommended={cp.id === recommendedPromptId}
                            isFlaggedForReuse={flaggedPromptIds.has(cp.id)}
                            isLoading={false}
                            onStartChapter={effectiveOnStartChapter}
                            onToggleFlagPrompt={handleToggleFlagPrompt}
                            canAccess={canAccess}
                            memoryDescription={(() => {
                              const isTemplate = (t?: string) => {
                                if (!t) return true;
                                const clean = t.replace(/<[^>]*>/g, '').trim();
                                return (
                                  clean.includes("Your birthplace, family roots") ||
                                  clean.includes("Let's begin the story of you") ||
                                  clean.includes("Enter the core of your memory") ||
                                  clean.includes("Select a prompt to begin")
                                );
                              };
                              const authenticText = [cp.memory?.prose, cp.memory?.originalHook, cp.memory?.description]
                                .find(t => t && !isTemplate(t));
                              return authenticText ? stripScreenplayCues(authenticText) : undefined;
                            })()}
                            status={cp.memory?.status}
                            prompt={{ id: cp.id, title: cp.title, description: cp.description, text: { en: cp.title, gu: '' }, isFlaggedForReuse: false }} // Minimal prompt object for compat
                          />
                        </div>
                      );
                    })}

                    {/* Add Your Own Memory Card */}
                    <TooltipProvider>
                      <Tooltip delayDuration={canAccessGroup ? 300 : 0}>
                        <TooltipTrigger asChild>
                          <div 
                            onClick={() => {
                              const hasActivePass = directorPassStatus === 'free_host_pass_active' || directorPassStatus === 'paid_host_pass_active';
                              if (!hasActivePass) {
                                setUpsellFeature("creating new scenes");
                                setIsUpsellOpen(true);
                                return;
                              }
                              if (canAccessGroup) {
                                router.push(`/add-memory?custom=true&groupId=${chapter.id}`);
                              } else {
                                router.push('/settings');
                              }
                            }}
                            className={cn(
                              "relative flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-dashed transition-all cursor-pointer min-h-[300px] text-center shadow-2xl group overflow-hidden bg-white/5 hover:bg-white/10",
                              canAccessGroup 
                                ? "border-primary/20 hover:border-primary/60" 
                                : "opacity-40 grayscale border-muted-foreground/20"
                            )}
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {!canAccessGroup && (
                              <div className="absolute top-6 flex items-center text-amber-500 text-[10px] font-black uppercase tracking-widest">
                                <Lock className="h-3 w-3 mr-1" /> Premium Access
                              </div>
                            )}

                            <div className={cn(
                              "mb-6 p-6 rounded-3xl transition-all shadow-2xl bg-white/5 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground duration-700",
                              !canAccessGroup && "bg-neutral-800 text-neutral-500"
                            )}>
                              <Plus className="h-10 w-10" />
                            </div>

                            <h3 className={cn(
                              "font-headline text-3xl mb-2 tracking-tight italic",
                              canAccessGroup ? "text-white" : "text-neutral-500"
                            )}>
                              Add Scene
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 group-hover:text-primary/70 transition-colors">
                              Personal Production
                            </p>
                          </div>
                        </TooltipTrigger>
                        {!canAccessGroup && (
                          <TooltipContent className="bg-primary text-primary-foreground border-none shadow-2xl p-6 max-w-[320px] rounded-[32px]">
                             <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl"><Lock className="h-5 w-5" /></div>
                                <p className="font-headline text-2xl italic">Premium Chapter</p>
                              </div>
                              <p className="text-sm leading-relaxed opacity-90 font-medium">
                                Upgrade your Director Pass to unlock unlimited freeform recording for this chapter.
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
      </div>

      <DirectorialUpsellDialog 
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        requiredFeature={upsellFeature}
      />
    </div>
  );
}

function StatCard({ icon, label, value, subLabel, color = 'primary' }: { icon: React.ReactNode, label: string, value: string | number, subLabel?: string, color?: 'primary' | 'green' | 'amber' }) {
  const colorMap = {
    primary: 'border-primary/20 text-primary bg-primary/5',
    green: 'border-green-500/20 text-green-500 bg-green-500/5',
    amber: 'border-amber-500/20 text-amber-500 bg-amber-500/5'
  };

  return (
    <div className={cn("p-6 rounded-[32px] border backdrop-blur-md shadow-2xl relative overflow-hidden group", colorMap[color])}>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-24 h-24" })}
      </div>
      <div className="flex items-center gap-3 mb-6 opacity-70">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-5xl font-headline font-bold text-white leading-none tracking-tighter italic">{value}</p>
        {subLabel && <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-2">{subLabel}</p>}
      </div>
    </div>
  );
}
