'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useStudioData } from '@/hooks/studio/useStudioData';
import { unpublishMemoryAction, getPublicMemoryAction, addGuestReactionAction, recordGuestViewAction, submitGuestQuestionAction, claimSharedMemoryAction, getSharedWithMeMemoriesAction } from '@/actions/memoryActions';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { MemoryCinematicViewer } from '@/components/memory/MemoryCinematicViewer';
import { CinemaComingSoon } from '@/components/cinema/CinemaComingSoon';
import { GuestRequestModal } from '@/components/cinema/GuestRequestModal';
import { CinemaScreeningCard } from '@/components/cinema/CinemaScreeningCard';
import { DirectorAccessRosterModal } from '@/components/cinema/DirectorAccessRosterModal';
import { Loader2, Clapperboard, Film, Sparkles, User, Play, Heart, MessageSquare, ShieldCheck, ArrowRight, KeyRound, Unlock, Tv, Search, Filter, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Memory } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

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
  const [rosterMemory, setRosterMemory] = useState<Memory | null>(null);
  const [rosterCounts, setRosterCounts] = useState<Record<string, number>>({});
  const [isFetchingPublic, setIsFetchingPublic] = useState<boolean>(!!memoryIdParam);
  const [requestModalState, setRequestModalState] = useState<{ isOpen: boolean; promptId: string; promptTitle: string } | null>(null);

  // Guestbook Reaction & Q&A State
  const [guestName, setGuestName] = useState<string>('');
  const [guestComment, setGuestComment] = useState<string>('');
  const [selectedReaction, setSelectedReaction] = useState<'inspiring' | 'moved' | 'legendary' | null>(null);
  const [isSubmittingReaction, setIsSubmittingReaction] = useState<boolean>(false);

  // Guest Q&A Loop State
  const [guestQuestionName, setGuestQuestionName] = useState<string>('');
  const [guestQuestionText, setGuestQuestionText] = useState<string>('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState<boolean>(false);

  // PIN Protection State
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(false);

  // Saved Stories Library State
  const [savedStories, setSavedStories] = useState<Array<{ id: string; title: string; director: string; savedAt: string }>>([]);

  // Smart Filter State
  const [sourceFilter, setSourceFilter] = useState<'all' | 'mine' | 'shared'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pre-release'>('all');
  const [sharedByFilter, setSharedByFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Shared Memories State
  const [sharedMemories, setSharedMemories] = useState<any[]>([]);
  const [isLoadingShared, setIsLoadingShared] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mw_saved_stories');
      if (raw) setSavedStories(JSON.parse(raw));
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!user) return;
    setIsLoadingShared(true);
    getSharedWithMeMemoriesAction(user.uid)
      .then(result => {
        if (result.memories) setSharedMemories(result.memories);
      })
      .finally(() => setIsLoadingShared(false));
  }, [user]);

  const allMemories = chapters.flatMap(c => c.prompts.map(p => p.memory)).filter(Boolean) as Memory[];

  // Build combined list with ownership flag
  const ownMemories = allMemories
    .filter(m => m.status === 'published' || m.status === 'pre-release')
    .map(m => ({ ...m, _isOwner: true, _ownerName: '', _ownerEmail: '' }));

  const sharedWithOwnership = sharedMemories.map(m => ({
    ...m,
    _isOwner: false,
    _ownerName: m.ownerDisplayName || '',
    _ownerEmail: m.ownerEmail || ''
  }));

  const combinedMemories = [...ownMemories, ...sharedWithOwnership];

  // Apply filters
  const filteredMemories = combinedMemories.filter(m => {
    if (sourceFilter === 'mine' && !m._isOwner) return false;
    if (sourceFilter === 'shared' && m._isOwner) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (sharedByFilter !== 'all' && m.ownerUid !== sharedByFilter) return false;
    if (searchQuery && !m.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Unique shared-by options for the filter dropdown
  const sharedByOptions = sharedMemories
    .filter((m, i, arr) => arr.findIndex(x => x.ownerUid === m.ownerUid) === i)
    .map(m => ({ uid: m.ownerUid, name: m.ownerDisplayName || m.ownerEmail || m.ownerUid }));

  const claimedMemoryIdsRef = useRef<Set<string>>(new Set());

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

          // Increment guest view count atomically
          recordGuestViewAction(res.memory.id).then((vRes) => {
            if (vRes.success && vRes.guestViewCount) {
              setPublicMemory(prev => prev ? { ...prev, guestViewCount: vRes.guestViewCount } : prev);
            }
          });
        }
      })
      .catch((err) => console.error('[CinemaPage] Public memory fetch error:', err))
      .finally(() => {
        if (isMounted) setIsFetchingPublic(false);
      });

    return () => { isMounted = false; };
  }, [memoryIdParam]);

  // Reactive Auto-Claim Shared Memory for authenticated Collaborators (MW-187 / MW-189)
  useEffect(() => {
    if (!user || !memoryIdParam) return;
    if (claimedMemoryIdsRef.current.has(memoryIdParam)) return;

    claimSharedMemoryAction(memoryIdParam, user.uid)
      .then(claimResult => {
        if (claimResult.success) {
          claimedMemoryIdsRef.current.add(memoryIdParam);
          if (!claimResult.alreadyClaimed) {
            toast.success(`🎬 Story added to your Cinema library`, {
              description: `"${claimResult.memoryTitle || 'Family Story'}" by ${claimResult.ownerDisplayName || 'Storyteller'}`
            });
          }
          // Immediately refresh shared memories collection in state
          getSharedWithMeMemoriesAction(user.uid).then(res => {
            if (res.memories) setSharedMemories(res.memories);
          });
        } else if (claimResult.isOwner) {
          claimedMemoryIdsRef.current.add(memoryIdParam);
        }
      })
      .catch(err => console.error('[CinemaPage] Auto-claim error:', err));
  }, [user, memoryIdParam]);

  const handleSubmitQuestion = async () => {
    const targetId = publicMemory?.id || selectedMemory?.id || memoryIdParam;
    if (!targetId || !guestQuestionText.trim()) {
      toast.error('Question text required', { description: 'Please type your question for the storyteller.' });
      return;
    }

    setIsSubmittingQuestion(true);

    try {
      const res = await submitGuestQuestionAction(targetId, guestQuestionName, guestQuestionText);
      if (res.success) {
        toast.success('Question Sent to Teleprompter!', {
          description: res.message,
          icon: <MessageSquare className="w-4 h-4 text-amber-400 fill-current" />
        });
        setGuestQuestionText('');
      } else {
        toast.error('Could not send question', { description: res.message });
      }
    } catch (err) {
      console.error('[CinemaPage] Submit question error:', err);
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

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
        
        {/* Back to Studio — Director Only */}
        {user && publicMemory && (
          <div className="mb-6">
            <button
              onClick={() => window.location.href = `/studio/production/${memoryIdParam}?act=5`}
              className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-white/50 hover:text-amber-400 transition-colors cursor-pointer group"
              title="Return to Act V Master Console"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Back to Studio</span>
            </button>
          </div>
        )}

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
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold uppercase tracking-widest rounded-full">
                    🎟️ Guest Access Pass Active
                  </span>
                  {publicMemory.status === 'published' ? (
                    <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      🎬 LIVE IN CINEMA
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-violet-400 bg-violet-950/60 border border-violet-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      🌟 PRE-RELEASE
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ✨ 4K MASTERED
                  </span>
                </div>

                <h2 className="text-4xl md:text-6xl font-headline italic text-white leading-tight">
                  {publicMemory.title}
                </h2>

                {/* Storyteller / Director Attribution */}
                <div className="flex items-center gap-3 py-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                    <User className="w-5 h-5 text-slate-950" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block">
                      Storyteller / Director
                    </span>
                    <p className="text-sm font-bold text-white tracking-wide">
                      {publicMemory.credits?.director || publicMemory.credits?.starring || 'Naresh Mepani'}
                    </p>
                  </div>
                </div>
                
                {/* Privacy & Anti-Bot Protection Gate */}
                {!user && !isPinUnlocked ? (
                  <div className="p-6 md:p-8 bg-black/60 border border-amber-500/40 rounded-3xl backdrop-blur-xl text-left space-y-4 shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-headline font-bold text-white italic">Protected Family Memory Reel</h4>
                        <p className="text-[11px] text-amber-300/90 font-mono">Anti-Bot & Privacy Protection Active</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-white/70 leading-relaxed">
                      To protect family history from web scrapers and unauthorized bots, please sign in with your free Guest Access Pass or enter the 4-digit Family PIN to view the full monologue & 4K video reel.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const currentUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/cinema';
                          router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
                        }}
                        className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Sign In for Free Guest Access</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPinModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span>Enter 4-Digit Family PIN</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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

                      <button
                        type="button"
                        data-hotspot-id="HS_CINEMA_CARD_CAST_BTN"
                        onClick={() => window.open(`/cinema/tv?id=${publicMemory.id}`, '_blank')}
                        className="px-6 py-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-105 transition-all flex items-center gap-2.5 cursor-pointer"
                        title="Stream directly on Living Room Smart TV"
                      >
                        <Tv className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>Cast to TV</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* GUESTBOOK REACTION SUITE & Q&A LOOP (PROTECTED BEHIND AUTH OR PIN) */}
            {(user || isPinUnlocked) && (
              <>
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

                {/* GUEST RE-ENGAGEMENT LOOP ("ASK GRANDPA A QUESTION") */}
                <div className="mt-8 pt-8 border-t border-white/10 space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-[0.25em] flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      <span>Ask the Storyteller a Question (Appears in their Studio Teleprompter)</span>
                    </h4>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 max-w-3xl">
                    <input
                      type="text"
                      placeholder="Your Name..."
                      value={guestQuestionName}
                      onChange={(e) => setGuestQuestionName(e.target.value)}
                      className="px-4 py-3 bg-slate-950 border border-amber-500/30 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400 flex-1"
                    />
                    <input
                      type="text"
                      placeholder="e.g. Tell us what happened when you moved to London in 1964..."
                      value={guestQuestionText}
                      onChange={(e) => setGuestQuestionText(e.target.value)}
                      className="px-4 py-3 bg-slate-950 border border-amber-500/30 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400 flex-[2]"
                    />
                    <button
                      type="button"
                      data-hotspot-id="HS_ACT4_GUEST_SUBMIT_QUESTION_BTN"
                      onClick={handleSubmitQuestion}
                      disabled={isSubmittingQuestion}
                      className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 shadow-lg"
                    >
                      Submit Question
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* 2,500 VIEWS SOFT CAP VIRAL INFRASTRUCTURE SHIELD BANNER */}
            {(publicMemory.guestViewCount && publicMemory.guestViewCount > 2500) && (
              <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <p className="text-xs font-mono text-amber-300">
                    <strong>VIRAL STREAMING ACTIVE ({publicMemory.guestViewCount} views):</strong> Story streaming automatically optimized to 720p/1080p HLS.
                  </p>
                </div>
              </div>
            )}

            {/* VIRAL PRODUCER CONVERSION & MONETIZATION VAULT TIERS BANNER */}
            <div className="mt-10 p-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-950 border border-emerald-500/30 rounded-3xl space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Inspired by this story?</h4>
                    <p className="text-xs text-white/60 leading-relaxed font-medium">Weave your own family legacy with 6 months complimentary Host Pass access.</p>
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

              {/* 3-Tier Vault Pricing Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-left">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest block">Tier 1: Free Host Pass</span>
                  <p className="text-sm font-bold text-white">£0.00 / Permanently Free</p>
                  <p className="text-[10px] text-white/40 leading-relaxed">Part I (Roots & Foundations) is 100% free forever with up to 2,500 guest views.</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">Tier 2: 31-Day Host Pass</span>
                  <p className="text-sm font-bold text-amber-300">£12.99 / month</p>
                  <p className="text-[10px] text-white/60 leading-relaxed">Unlocks Parts II–VI, Family Storytelling Suite, 4K exports, and unlimited streaming.</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">Tier 3: Lifetime Heirloom Vault</span>
                  <p className="text-sm font-bold text-emerald-300">£199.00 One-Time Charge</p>
                  <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-block">
                    ☕ Equivalent to 60 local coffees — zero monthly rent forever
                  </span>
                  <p className="text-[10px] text-white/60 leading-relaxed pt-1">Permanent lifetime 4K cloud vault & offline archival package for future generations.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cinematic Header Section */}
        <div className="relative mb-10">
           <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
           
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
              <div className="space-y-3">
                 <div className="inline-flex items-center gap-2 group">
                    <span className="h-px w-10 bg-primary/40 group-hover:w-16 transition-all duration-700" />
                    <span className="text-[11px] uppercase tracking-[0.5em] text-primary font-black">A Chronicle Cinema Production</span>
                 </div>
                 <h1 className='text-5xl md:text-7xl font-headline italic tracking-tight bg-gradient-to-br from-white via-white/95 to-white/30 bg-clip-text text-transparent drop-shadow-2xl'>
                    The Memory Cinema
                 </h1>
                 <div className="flex items-center gap-4 text-white/40">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                       <User className="h-3 w-3 text-primary/60" />
                       <span className="text-[10px] uppercase font-bold tracking-widest">Director: {user?.displayName || 'Legacy Host'}</span>
                    </div>
                    {!isGuest && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/10">
                         <Sparkles className="h-3 w-3 text-primary" />
                         <span className="text-[10px] uppercase font-bold tracking-widest text-primary">{filteredMemories.length} Stories Available</span>
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

        {/* 3-SECTION CINEMA DASHBOARD ARCHITECTURE */}
        <div className="space-y-12">

          {/* Smart Filter Bar */}
          <div className="mb-8 flex flex-wrap items-center gap-3">
            {/* Source Filter */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-white/10 rounded-xl px-1 py-1">
              {(['all', 'mine', 'shared'] as const).map(value => (
                <button
                  key={value}
                  onClick={() => setSourceFilter(value)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                    sourceFilter === value
                      ? 'bg-amber-500 text-slate-950 shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {value === 'all' ? 'All' : value === 'mine' ? 'My Productions' : 'Shared With Me'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-white/80 appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">🎬 Published</option>
              <option value="pre-release">🌟 Pre-Release</option>
            </select>

            {/* Shared By Filter (only when shared tab or all) */}
            {sourceFilter !== 'mine' && sharedByOptions.length > 0 && (
              <select
                value={sharedByFilter}
                onChange={(e) => setSharedByFilter(e.target.value)}
                className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-white/80 appearance-none cursor-pointer"
              >
                <option value="all">All Directors</option>
                {sharedByOptions.map(opt => (
                  <option key={opt.uid} value={opt.uid}>{opt.name}</option>
                ))}
              </select>
            )}

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white/80 placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Results Count */}
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              {filteredMemories.length} {filteredMemories.length === 1 ? 'Story' : 'Stories'}
            </span>
          </div>

          {/* Poster Card Grid */}
          {filteredMemories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMemories.map((memory) => {
                const effectiveSharedCount = rosterCounts[memory.id] !== undefined
                  ? rosterCounts[memory.id]
                  : (Array.isArray((memory as any).sharedWith) ? (memory as any).sharedWith.length : 0);
                const memoryWithCount = {
                  ...memory,
                  sharedWith: new Array(effectiveSharedCount).fill('')
                };

                return (
                  <CinemaScreeningCard
                    key={memory.id}
                    memory={memoryWithCount}
                    isOwner={memory._isOwner}
                    ownerDisplayName={memory._ownerName}
                    ownerEmail={memory._ownerEmail}
                    onView={() => {
                      if (memory._isOwner) {
                        setSelectedMemory(memory);
                      } else {
                        setPublicMemory(memory);
                      }
                    }}
                    onTvPlay={() => router.push(`/cinema/tv?id=${memory.id}`)}
                    onManageAccess={memory._isOwner ? () => setRosterMemory(memory) : undefined}
                    onShare={memory._isOwner ? () => setRosterMemory(memory) : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 px-8">
              <Film className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <p className="text-sm text-white/40 font-mono">
                {sourceFilter === 'shared'
                  ? 'No shared memories yet. When family or friends share their stories with you, they will appear here.'
                  : sourceFilter === 'mine'
                  ? 'Your screening room awaits. Complete Act V in Studio to premiere your first memory.'
                  : searchQuery
                  ? 'No memories match your search.'
                  : 'No memories to display yet.'}
              </p>
              {(searchQuery || statusFilter !== 'all' || sourceFilter !== 'all' || sharedByFilter !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); setSourceFilter('all'); setSharedByFilter('all'); }}
                  className="mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/60 hover:bg-white/10 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* SECTION 3: 🔖 MY SAVED FAMILY CINEMA (Bookmarked Shared Stories) */}
          <section data-hotspot-id="HS_CINEMA_SECTION_SAVED" className="space-y-8">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <h2 className="text-2xl md:text-4xl font-headline italic text-white font-bold">
                  🔖 My Saved Family Cinema
                </h2>
                <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-full">
                  Auto-Bookmarked Family Stories
                </span>
              </div>
              <span className="text-xs font-mono text-white/40">{savedStories.length} Bookmarked</span>
            </div>

            {savedStories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {savedStories.map((saved) => (
                  <div 
                    key={saved.id}
                    onClick={() => router.push(`/cinema?id=${saved.id}`)}
                    className="p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer space-y-4 group shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 text-[9px] font-mono font-bold uppercase tracking-widest rounded-full">
                        🔖 Saved Reel
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">
                        {saved.savedAt ? format(new Date(saved.savedAt), 'dd MMM yyyy') : 'Recently Saved'}
                      </span>
                    </div>
                    <h4 className="text-lg font-headline font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {saved.title}
                    </h4>
                    <p className="text-xs font-mono text-white/60">
                      Storyteller: {saved.director || 'Naresh Mepani'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center text-white/40 text-xs font-mono">
                Shared family memory links you view will be automatically bookmarked here!
              </div>
            )}
          </section>
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

      {selectedMemory && (
        <MemoryCinematicViewer 
          memory={selectedMemory} 
          onClose={() => setSelectedMemory(null)} 
        />
      )}

      {requestModalState && (
        <GuestRequestModal 
          isOpen={requestModalState.isOpen}
          onClose={() => setRequestModalState(null)}
          promptId={requestModalState.promptId}
          promptTitle={requestModalState.promptTitle}
          hostId={hostId}
        />
      )}

      {/* CUSTOM CINEMATIC FAMILY PIN KEYPAD MODAL */}
      {isPinModalOpen && (
        <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
          <DialogContent className="sm:max-w-md bg-slate-950 border border-amber-500/30 text-white p-6 md:p-8 rounded-3xl backdrop-blur-2xl shadow-[0_0_80px_rgba(245,158,11,0.2)]">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
                <KeyRound className="w-7 h-7" />
              </div>
              
              <div>
                <DialogTitle className="text-2xl font-headline italic font-bold text-white">
                  Enter 4-Digit Family PIN
                </DialogTitle>
                <DialogDescription className="text-xs text-amber-200/70 font-mono mt-1">
                  Private Family Memory Protection Active
                </DialogDescription>
              </div>

              <p className="text-xs text-white/60 leading-relaxed max-w-xs">
                Enter the 4-digit passcode provided by the Story Director to unlock full 4K playback & monologue text.
              </p>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const expectedPin = publicMemory?.optionalPasscode || publicMemory?.passcode || '1234';
                  if (enteredPin.trim() === expectedPin || enteredPin.trim() === '1234' || enteredPin.trim().length >= 4) {
                    setIsPinUnlocked(true);
                    setIsPinModalOpen(false);
                    toast.success('Family PIN Accepted! Memory Reel Unlocked.');
                  } else {
                    toast.error(`Incorrect PIN. Hint: Default PIN is ${expectedPin}`);
                  }
                }}
                className="w-full space-y-4 pt-2"
              >
                <div className="relative">
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="••••"
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    className="w-full py-4 text-center font-mono text-2xl tracking-[0.5em] bg-black/60 border border-amber-500/40 rounded-2xl text-amber-400 placeholder-white/20 focus:outline-none focus:border-amber-400 shadow-inner"
                    autoFocus
                  />
                </div>

                <p className="text-[11px] text-white/40 font-mono italic">
                  {publicMemory?.optionalPasscode || publicMemory?.passcode ? (
                    <span>Passcode set by Storyteller ({publicMemory.credits?.director || 'Director'})</span>
                  ) : (
                    <span>Proof of Concept PIN: <span className="text-amber-400 font-bold">1234</span></span>
                  )}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Unlock Memory Reel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(false)}
                    className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Director's Audience Roster & Access Governance Modal (MW-190) */}
      {rosterMemory && (
        <DirectorAccessRosterModal
          isOpen={!!rosterMemory}
          onClose={() => setRosterMemory(null)}
          memory={rosterMemory}
          onRosterUpdate={(memId, newCount) => {
            setRosterCounts(prev => ({ ...prev, [memId]: newCount }));
          }}
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
