'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useStudioData } from '@/hooks/studio/useStudioData';
import { unpublishMemoryAction, getPublicMemoryAction, addGuestReactionAction } from '@/actions/memoryActions';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { MemoryCinematicViewer } from '@/components/memory/MemoryCinematicViewer';
import { CinemaComingSoon } from '@/components/cinema/CinemaComingSoon';
import { GuestRequestModal } from '@/components/cinema/GuestRequestModal';
import { Loader2, Clapperboard, Film, Sparkles, User, Play, Heart, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Memory } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

function CinemaContent() {
  const { user } = useAuth();
  const { mode } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const memoryIdParam = searchParams.get('id');
  const hostId = user?.uid || searchParams.get('hostId') || 'legacy_host_id';
  
  const { chapters, isLoading: isStudioLoading, stats } = useStudioData(hostId);
  
  const isGuest = !user || (user.uid !== hostId);
  
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [publicMemory, setPublicMemory] = useState<Memory | null>(null);
  const [isFetchingPublic, setIsFetchingPublic] = useState<boolean>(!!memoryIdParam);
  const [requestModalState, setRequestModalState] = useState<{ isOpen: boolean; promptId: string; promptTitle: string } | null>(null);

  // Guestbook Reaction State
  const [guestName, setGuestName] = useState<string>('');
  const [guestComment, setGuestComment] = useState<string>('');
  const [selectedReaction, setSelectedReaction] = useState<'inspiring' | 'moved' | 'legendary' | null>(null);
  const [isSubmittingReaction, setIsSubmittingReaction] = useState<boolean>(false);

  // Auto-fetch shared memory when opened via Guest Access Pass URL (?id=...)
  useEffect(() => {
    if (!memoryIdParam) {
      setIsFetchingPublic(false);
      return;
    }

    let isMounted = true;
    setIsFetchingPublic(true);

    getPublicMemoryAction(memoryIdParam)
      .then((res) => {
        if (isMounted && res.success && res.memory) {
          setPublicMemory(res.memory);
          setSelectedMemory(res.memory);
        }
      })
      .catch((err) => console.error('[CinemaPage] Public memory fetch error:', err))
      .finally(() => {
        if (isMounted) setIsFetchingPublic(false);
      });

    return () => { isMounted = false; };
  }, [memoryIdParam]);

  const handleEdit = (memory: Memory) => {
    router.push(`/add-memory?editMemoryId=${memory.id}`);
  };

  const handleUnpublish = async (memoryId: string) => {
    if (!user) return;

    try {
      const res = await unpublishMemoryAction(memoryId);
      if (res.success) {
        toast.success('Success', { description: 'Story moved back to Studio Drafts.' });
      } else {
        toast.error('Error', { description: res.message });
      }
    } catch (error) {
      console.error('Error unpublishing story:', error);
      toast.error('Error', { description: 'Failed to move story to draft.' });
    }
  };

  const handleSendReaction = async (type: 'inspiring' | 'moved' | 'legendary') => {
    const targetId = publicMemory?.id || selectedMemory?.id || memoryIdParam;
    if (!targetId) return;

    setSelectedReaction(type);
    setIsSubmittingReaction(true);

    try {
      const res = await addGuestReactionAction(targetId, type, guestName, guestComment);
      if (res.success) {
        toast.success('Heartfelt Reaction Sent!', {
          description: res.message,
          icon: <Heart className="w-4 h-4 text-rose-400 fill-current" />
        });
        setGuestComment('');
      } else {
        toast.error('Could not send reaction', { description: res.message });
      }
    } catch (err) {
      console.error('[CinemaPage] Reaction error:', err);
    } finally {
      setIsSubmittingReaction(false);
    }
  };

  const handleRequestStory = (promptId: string, title: string) => {
    setRequestModalState({
      isOpen: true,
      promptId,
      promptTitle: title
    });
  };

  if (isStudioLoading || isFetchingPublic) {
    return (
      <AuthenticatedPageWrapper>
        <div className='flex flex-col justify-center items-center min-h-[60vh] gap-4'>
           <Loader2 className='animate-spin h-12 w-12 text-primary/40' />
            <p className="text-[10px] uppercase tracking-[.4em] font-black text-white/20">Initializing Memory Cinema...</p>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className='container mx-auto py-12 px-6 lg:px-12 max-w-7xl min-h-screen'>
        
        {/* PUBLIC GUEST PASS HERO PREMIERE BANNER */}
        {publicMemory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-20 p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-slate-900/90 via-slate-950 to-black border border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Film className="w-64 h-64 text-amber-400" />
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
              {/* 4K Poster Preview Card */}
              <div 
                onClick={() => setSelectedMemory(publicMemory)}
                className="w-48 md:w-64 aspect-[2/3] rounded-2xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl relative cursor-pointer group shrink-0"
              >
                <img 
                  src={publicMemory.posterImageUrl || publicMemory.imageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000'} 
                  alt={publicMemory.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <span className="text-[9px] font-mono text-amber-300 font-bold uppercase tracking-[0.2em] block">
                    {publicMemory.chapterTitle || 'Part I: Roots & Foundations'}
                  </span>
                  <h4 className="text-sm font-headline italic font-black text-white truncate mt-1">
                    {publicMemory.title}
                  </h4>
                </div>
              </div>

              {/* Story Details & Premiere Launcher */}
              <div className="flex-1 space-y-6 text-left">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold uppercase tracking-widest rounded-full">
                    🎟️ Guest Access Pass Active
                  </span>
                  <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
                    A Memory Weaver Selection
                  </span>
                </div>

                <h2 className="text-4xl md:text-6xl font-headline italic text-white leading-tight">
                  {publicMemory.title}
                </h2>
                
                <p className="text-white/70 text-base md:text-lg font-serif italic max-w-2xl leading-relaxed">
                  "{publicMemory.originalHook || publicMemory.description || 'An authentic oral history monologue preserved for future generations.'}"
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMemory(publicMemory)}
                    className="px-8 py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-all flex items-center gap-3 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current text-slate-950" />
                    <span>Watch Premiere</span>
                  </button>
                </div>
              </div>
            </div>

            {/* GUESTBOOK REACTION SUITE */}
            <div className="mt-12 pt-8 border-t border-white/10 space-y-6">
              <h4 className="text-xs font-mono font-bold text-white/60 uppercase tracking-[0.25em] flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Send a Heartfelt Reaction to the Director</span>
              </h4>

              <div className="flex flex-wrap items-center gap-3">
                {[
                  { id: 'inspiring', label: '❤️ Inspiring' },
                  { id: 'moved', label: '🥹 Deeply Moved' },
                  { id: 'legendary', label: '👏 Legendary Heritage' }
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSendReaction(r.id as any)}
                    disabled={isSubmittingReaction}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                      selectedReaction === r.id 
                        ? 'bg-rose-500 text-white shadow-lg scale-105' 
                        : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                <input
                  type="text"
                  placeholder="Your Name (Optional family name)..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400 flex-1"
                />
                <input
                  type="text"
                  placeholder="Leave a short note for the storyteller..."
                  value={guestComment}
                  onChange={(e) => setGuestComment(e.target.value)}
                  className="px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400 flex-[2]"
                />
                <button
                  type="button"
                  onClick={() => handleSendReaction('inspiring')}
                  disabled={isSubmittingReaction}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0"
                >
                  Send Note
                </button>
              </div>
            </div>

            {/* VIRAL PRODUCER CONVERSION BANNER */}
            <div className="mt-8 p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Inspired by this story?</h4>
                  <p className="text-xs text-white/50 leading-relaxed font-medium">Weave your own family legacy with 6 months complimentary Host Pass access.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push('/register')}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Claim 6-Month Host Pass</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Cinematic Header Section */}
        <div className="relative mb-20">
           <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
           
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
              <div className="space-y-4">
                 <div className="inline-flex items-center gap-2 group">
                    <span className="h-px w-10 bg-primary/40 group-hover:w-16 transition-all duration-700" />
                    <span className="text-[11px] uppercase tracking-[0.5em] text-primary font-black">A Chronicle Cinema Production</span>
                 </div>
                 <h1 className='text-6xl md:text-9xl font-headline italic tracking-tighter bg-gradient-to-br from-white via-white/95 to-white/30 bg-clip-text text-transparent drop-shadow-2xl'>
                    The Memory Cinema
                 </h1>
                 <div className="flex items-center gap-4 text-white/40">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                       <User className="h-3 w-3 text-primary/60" />
                       <span className="text-[10px] uppercase font-bold tracking-widest">Director: {user?.displayName || 'Legacy Host'}</span>
                    </div>
                    {!isGuest && stats.published > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/10">
                         <Sparkles className="h-3 w-3 text-primary" />
                         <span className="text-[10px] uppercase font-bold tracking-widest text-primary">{stats.published} Stories Released</span>
                      </div>
                    )}
                 </div>
              </div>

              <div className="hidden lg:flex flex-col items-end text-right space-y-2">
                 <p className="text-[10px] uppercase tracking-[.2em] font-medium text-white/40 leading-relaxed max-w-xs">
                    Welcome to your cinematic legacy. Grouped by life chapters, this space showcases published memories.
                 </p>
              </div>
           </div>
        </div>

        {/* Chapters and Grid */}
        <div className="space-y-32">
          {chapters.length > 0 ? (
            chapters.map((chapter, idx) => (
            <section key={chapter.id} className="relative">
              {/* Chapter Backdrop Visual */}
              <div className="absolute -left-20 top-0 text-[18vw] font-headline italic tracking-tighter text-white/[0.02] select-none pointer-events-none -z-10 h-min">
                 {String(idx + 1).padStart(2, '0')}
              </div>

              <div className="space-y-12">
                {/* Chapter Title Block */}
                <div className="relative pl-4 border-l-2 border-primary/20">
                   <span className="text-[10px] uppercase tracking-[.5em] text-primary font-black mb-2 block">
                      {mode === 'gu' ? `ભાગ ${idx + 1}` : mode === 'dual' ? `Part ${idx + 1} | ભાગ ${idx + 1}` : `Part ${idx + 1}`}
                   </span>
                   <h2 className="text-4xl md:text-6xl font-headline italic tracking-tighter text-white drop-shadow-sm">{chapter.title}</h2>
                   {chapter.subtitle && <p className="text-white/30 text-lg mt-2 font-medium italic">{chapter.subtitle}</p>}
                </div>

                {/* The Cinematic Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {chapter.prompts.map((cp) => (
                      <div key={cp.id}>
                        {cp.memory && cp.memory.status === 'published' ? (
                           <MemoryCard 
                              memory={cp.memory}
                              onEdit={!isGuest ? () => handleEdit(cp.memory!) : undefined}
                              onUnpublish={!isGuest ? () => handleUnpublish(cp.memory!.id) : undefined}
                              onView={() => setSelectedMemory(cp.memory!)}
                           />
                        ) : (
                           <CinemaComingSoon 
                              title={cp.title}
                              description={cp.description}
                              onRequest={() => handleRequestStory(cp.id, cp.title)}
                              requestCount={cp.requests.length}
                           />
                        )}
                      </div>
                   ))}
                </div>
              </div>
            </section>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-40 text-center space-y-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                <Film className="h-24 w-24 text-white/5 relative z-10" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-headline italic text-white/60">Theater Doors Closed</h2>
                <p className="text-sm text-white/20 max-w-sm mx-auto uppercase tracking-[0.2em] font-bold">
                  {isGuest 
                    ? "This director hasn't released any memories to the public yet." 
                    : "Your cinematic journey is awaiting its first release. Head to the Studio to publish a memory."}
                </p>
              </div>
              {!isGuest && (
                <button 
                  onClick={() => router.push('/studio')}
                  className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-500"
                 >
                  Open Studio
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Global Stats Footer */}
        <div className="mt-40 pt-20 border-t border-white/5 text-center text-white/20 pb-20">
           <div className="inline-flex items-center gap-4 mb-8">
              <Film className="h-5 w-5 text-current" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[11px] uppercase tracking-[.5em] font-black">All scenes recorded in high fidelity</p>
           </div>
           <p className="text-xs max-w-md mx-auto leading-relaxed">
              Your memory weaving journey is approximately {stats.completionPercentage}% complete. 
              {stats.totalRequests > 0 && ` You have ${stats.totalRequests} pending story requests from your audience.`}
           </p>
        </div>
      </div>

      <MemoryCinematicViewer 
        memory={selectedMemory} 
        onClose={() => setSelectedMemory(null)} 
      />

      {requestModalState && (
        <GuestRequestModal 
          isOpen={requestModalState.isOpen}
          onClose={() => setRequestModalState(null)}
          promptId={requestModalState.promptId}
          promptTitle={requestModalState.promptTitle}
          hostId={hostId}
        />
      )}
    </AuthenticatedPageWrapper>
  );
}

export default function CinemaPage() {
  return (
    <Suspense fallback={
      <AuthenticatedPageWrapper>
        <div className='flex flex-col justify-center items-center min-h-[60vh] gap-4'>
           <Loader2 className='animate-spin h-12 w-12 text-primary/40' />
            <p className="text-[10px] uppercase tracking-[.4em] font-black text-white/20">Initializing Memory Cinema...</p>
        </div>
      </AuthenticatedPageWrapper>
    }>
      <CinemaContent />
    </Suspense>
  );
}
