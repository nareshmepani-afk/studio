'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, where } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { unpublishMemoryAction } from '@/actions/memoryActions';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { MemoryCinematicViewer } from '@/components/memory/MemoryCinematicViewer';
import { Loader2, Film } from 'lucide-react';
import type { Memory } from '@/types';
import { toast } from 'sonner';

export default function TimelinePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  useEffect(() => {
    if (user && db) {
      setIsLoading(true);
      const memoriesQuery = query(
        collection(db, 'users', user.uid, 'memories'), 
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
        
      const unsubscribe = onSnapshot(memoriesQuery, (snapshot) => {
        const memoriesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Memory[];
        setMemories(memoriesData);
        setIsLoading(false);
      }, (error) => {
        console.error('Error fetching memories:', error);
        toast.error('Error', { description: 'Could not fetch memories.' });
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  const handleEdit = (memory: Memory) => {
    router.push(`/add-memory?editMemoryId=${memory.id}`);
  };

  const handleUnpublish = async (memoryId: string) => {
    if (!user) return;

    try {
      const res = await unpublishMemoryAction(memoryId);
      if (res.success) {
        toast.success('Success', { description: 'Memory moved back to Studio Drafts.' });
      } else {
        toast.error('Error', { description: res.message });
      }
    } catch (error) {
      console.error('Error unpublishing memory:', error);
      toast.error('Error', { description: 'Failed to move memory to draft.' });
    }
  };

  return (
    <AuthenticatedPageWrapper>
      <div className='container mx-auto py-8 px-4'>
        <h1 className='text-4xl font-bold mb-8'>Your Timeline</h1>
        {isLoading ? (
          <div className='flex justify-center items-center py-12'>
            <Loader2 className='animate-spin h-12 w-12' />
          </div>
        ) : memories.length === 0 ? (
          <div className='text-center py-12'>
            <Film className='mx-auto h-16 w-16 text-primary mb-6 animate-pulse' />
            <h2 className='font-headline text-3xl mb-3'>Your Cinema is Empty</h2>
            <p className='text-muted-foreground mb-8'>Go to the Studio to draft and publish your first cinematic memory.</p>
            <button 
              onClick={() => router.push('/prompts')}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold hover:brightness-110 transition-all"
            >
              Enter Studio
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(
              memories.reduce((acc, memory) => {
                const chapter = memory.chapterTitle || 'Epilogue';
                if (!acc[chapter]) acc[chapter] = [];
                acc[chapter].push(memory);
                return acc;
              }, {} as Record<string, Memory[]>)
            ).map(([chapter, chapterMemories], idx) => (
              <div key={`${chapter}-${idx}`} className="space-y-8">
                {/* Chapter Header */}
                <div className="relative flex flex-col items-center justify-center py-6">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent h-px top-1/2 -translate-y-1/2 w-full opacity-30" />
                   <div className="bg-[#0f172a] px-8 relative z-10 text-center">
                     <span className="text-[10px] uppercase tracking-[0.5em] text-primary/60 font-bold mb-2 block">Part {idx + 1}</span>
                     <h2 className="text-3xl md:text-5xl font-serif italic tracking-tight text-white drop-shadow-xl">{chapter}</h2>
                   </div>
                </div>

                {/* Chapter Memories Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {chapterMemories.map((memory) => (
                    <MemoryCard 
                      key={memory.id}
                      memory={memory}
                      onEdit={() => handleEdit(memory)}
                      onUnpublish={() => handleUnpublish(memory.id)}
                      onView={() => setSelectedMemory(memory)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MemoryCinematicViewer 
        memory={selectedMemory} 
        onClose={() => setSelectedMemory(null)} 
      />
    </AuthenticatedPageWrapper>
  );
}
