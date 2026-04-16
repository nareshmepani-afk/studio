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

// UI Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PromptCard } from '@/components/prompts/PromptCard';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import ProductionDeck from './ProductionDeck';

// Icons
import { 
  Film, 
  Loader2, 
  Languages, 
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
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'gu'>('en');
  const router = useRouter();
  const { user } = useAuth();
  
  const [flaggedPromptIds, setFlaggedPromptIds] = useState(initialFlaggedPromptIds);
  const [isCleaning, setIsCleaning] = useState(false);

  // Production Deck State
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  const [selectedProductionData, setSelectedProductionData] = useState<any>(null);
  
  // GUEST AUTO-OPEN logic
  useEffect(() => {
    if (isGuest && !isDeckOpen) {
      console.log("[StudioDashboard] Guest mode detected. Auto-activating Storyteller Stage with Session ID:", sessionId);
      setSelectedProductionData({
        id: sessionId, // Use the unique session ID as the memory ID for PeerJS coordination
        title: "Guest Collaboration Session",
        description: "Direct-to-Director link session.",
        promptId: "guest_session",
        status: 'draft',
        prose: '<p>Welcome to your Guest Collaboration session. Your director has shared this link to guide your recording.</p>',
        sensoryConfig: [],
      });
      setIsDeckOpen(true);
    }
  }, [isGuest, isDeckOpen, sessionId]);
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

  const handleStartChapter = useCallback((promptId: string, isCompleted: boolean, groupId: string) => {
      let memoryToEdit = null;

      if (isCompleted) {
          const chapterPrompts = chapters.flatMap(c => c.prompts);
          const cp = chapterPrompts.find(p => p.id === promptId);
          if (cp?.memory) {
              // Rehydrate memory data for the deck
              const pid = cp.memory.promptId;
              const script = pid ? storyScripts[pid] : '';
              const formattedProse = script ? `<p>${script.split('\\n').join('</p><p>')}</p>` : '';
              
              let loadedProse = cp.memory.prose || cp.memory.content || '';
              if (!loadedProse || loadedProse === '<p></p>' || loadedProse === '<p><br></p>' || loadedProse.trim() === '') {
                  loadedProse = formattedProse;
              }

              memoryToEdit = {
                  ...cp.memory,
                  prose: loadedProse
              };
          }
      } else {
          // New Production
          const chapterPrompts = chapters.flatMap(c => c.prompts);
          const template = chapterPrompts.find(p => p.id === promptId);
          const script = promptId ? storyScripts[promptId] : '';
          const formattedProse = script ? `<p>${script.split('\\n').join('</p><p>')}</p>` : '';

          memoryToEdit = {
            title: template?.title || '',
            description: template?.description || '',
            promptId: promptId,
            status: 'draft',
            prose: formattedProse,
            sensoryConfig: [], // Default empty
          };
      }

      if (memoryToEdit) {
          setSelectedProductionData(memoryToEdit);
          setIsDeckOpen(true);
      }
  }, [chapters]);

  const handleUpdateProduction = useCallback(async (updatedData: any) => {
    if (!user) return;
    
    // Optimistic Update
    setSelectedProductionData(updatedData);

    try {
      const { id, ...dataToSave } = updatedData;
      if (id) {
         await updateDoc(doc(db, 'users', user.uid, 'memories', id), dataToSave);
      } else {
         // Create local in DB
         const memoriesRef = collection(db, 'users', user.uid, 'memories');
         const newDoc = await addDoc(memoriesRef, {
            ...dataToSave,
            createdAt: new Date().toISOString()
         });
         setSelectedProductionData((prev: any) => ({ ...prev, id: newDoc.id }));
      }
    } catch (e) {
      console.error("Auto-save error:", e);
    }
  }, [user, db]);

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
            <Select value={currentLanguage} onValueChange={(value) => setCurrentLanguage(value as 'en' | 'gu')}>
              <SelectTrigger className="w-full md:w-44 bg-white/10 border-white/20 hover:bg-white/20 transition-all text-white font-bold tracking-tight shadow-xl">
                <Languages className="mr-2 h-4 w-4 text-primary" />
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
              </SelectContent>
            </Select>

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
            value={stats.published + stats.drafts} 
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
                            isFlaggedForReuse={flaggedPromptIds.has(cp.id)}
                            isLoading={false}
                            onStartChapter={effectiveOnStartChapter}
                            onToggleFlagPrompt={handleToggleFlagPrompt}
                            canAccess={canAccess}
                            memoryDescription={cp.memory?.description}
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

      {/* Production Deck Overlay / Drawer */}
      <AnimatePresence>
        {isDeckOpen && selectedProductionData && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeckOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[30]"
            />
            
            {/* The Deck */}
            <motion.div
              initial={layoutMode === 'takeover' ? { opacity: 0, scale: 0.95 } : { x: '100%' }}
              animate={layoutMode === 'takeover' ? { opacity: 1, scale: 1 } : { x: 0 }}
              exit={layoutMode === 'takeover' ? { opacity: 0, scale: 0.95 } : { x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed z-[40] bg-slate-950 border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-500",
                layoutMode === 'takeover' 
                  ? "inset-0 top-16 border-t shadow-[0_0_50px_rgba(0,0,0,0.5)]" 
                  : "top-16 right-0 bottom-0 w-full md:w-[75%] border-l"
              )}
            >
              {/* Close Button UI */}
              <div className="absolute top-6 right-6 z-[110]">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   onClick={() => setIsDeckOpen(false)}
                   className="rounded-full bg-black/20 hover:bg-white/10 text-white/50 hover:text-white transition-all w-12 h-12"
                 >
                   <Plus className="w-6 h-6 rotate-45" />
                 </Button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ProductionDeck 
                  memoryData={selectedProductionData} 
                  onUpdate={handleUpdateProduction} 
                  layoutMode={layoutMode}
                  onToggleLayout={toggleLayoutMode}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
