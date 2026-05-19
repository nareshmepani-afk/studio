'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useStudioData } from '@/hooks/studio/useStudioData';
import { unpublishMemoryAction } from '@/actions/memoryActions';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { MemoryCinematicViewer } from '@/components/memory/MemoryCinematicViewer';
import { CinemaComingSoon } from '@/components/cinema/CinemaComingSoon';
import { GuestRequestModal } from '@/components/cinema/GuestRequestModal';
import { Loader2, Clapperboard, Film, Sparkles, User, Info } from 'lucide-react';
import type { Memory } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

function CinemaContent() {
  const { user } = useAuth();
  const { mode } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hostId = user?.uid || searchParams.get('hostId') || 'legacy_host_id'; // Fallback for testing
  
  const { chapters, isLoading, stats } = useStudioData(hostId);
  
  const isGuest = !user || (user.uid !== hostId);
  
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [requestModalState, setRequestModalState] = useState<{ isOpen: boolean; promptId: string; promptTitle: string } | null>(null);

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

  const handleRequestStory = (promptId: string, title: string) => {
    setRequestModalState({
      isOpen: true,
      promptId,
      promptTitle: title
    });
  };

  if (isLoading) {
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
