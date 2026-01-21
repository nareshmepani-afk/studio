'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { Loader2, Film } from 'lucide-react';
import type { Memory } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function TimelinePage() {
  console.log('TimelinePage: Rendering');
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('TimelinePage: useEffect triggered', { user });
    if (user && db) {
      console.log('TimelinePage: User is authenticated, fetching memories.');
      setIsLoading(true);
      const memoriesQuery = query(
        collection(db, 'users', user.uid, 'memories'), 
        orderBy('createdAt', 'desc') // Order by creation time
      );
        
      const unsubscribe = onSnapshot(memoriesQuery, (snapshot) => {
        console.log('TimelinePage: onSnapshot fired', { snapshot });
        const memoriesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Memory[];
        console.log('TimelinePage: Fetched memories data', { memoriesData });
        setMemories(memoriesData);
        setIsLoading(false);
      }, (error) => {
        console.error('TimelinePage: onSnapshot error', { error });
        toast({ title: 'Error', description: 'Could not fetch memories.', variant: 'destructive' });
        setIsLoading(false);
      });

      return () => {
        console.log('TimelinePage: Unsubscribing from onSnapshot.');
        unsubscribe();
      }
    } else {
      console.log('TimelinePage: User is not authenticated, not fetching memories.');
      setIsLoading(false);
    }
  }, [user, toast]);
  
  const handleEdit = (memory: Memory) => {
    console.log('TimelinePage: handleEdit called', { memory });
    router.push(`/add-memory?editMemoryId=${memory.id}`);
  };

  const handleDelete = async (memoryId: string) => {
    console.log('TimelinePage: handleDelete called', { memoryId });
    if (!user) {
      console.error('TimelinePage: handleDelete failed - user not authenticated.');
      return;
    }

    const memoryToDelete = memories.find(m => m.id === memoryId);
    if (!memoryToDelete) {
      console.error('TimelinePage: handleDelete failed - memory not found in state.');
      return;
    }

    try {
      console.log('TimelinePage: Deleting memory from Firestore and Storage.', { memoryToDelete });
      await deleteDoc(doc(db, 'users', user.uid, 'memories', memoryId));

      if (memoryToDelete.mediaAttachments?.length) {
        for (const attachment of memoryToDelete.mediaAttachments) {
          const fileRef = ref(storage, attachment.url);
          await deleteObject(fileRef);
          console.log('TimelinePage: Deleted media from Storage.', { fileUrl: attachment.url });
        }
      }

      toast({ title: 'Success', description: 'Memory deleted successfully.' });
    } catch (error) {
      console.error('TimelinePage: handleDelete failed with error.', { error });
      toast({ title: 'Error', description: 'Failed to delete memory.', variant: 'destructive' });
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
            <Film className='mx-auto h-16 w-16 text-primary mb-6' />
            <h2 className='font-headline text-3xl mb-3'>No memories found.</h2>
            <p className='text-muted-foreground mb-8'>Start by adding a new memory.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {memories.map((memory) => (
              <MemoryCard 
                key={memory.id}
                memory={memory}
                onEdit={() => handleEdit(memory)}
                onDelete={() => handleDelete(memory.id)}
                userMode={'host'}
              />
            ))}
          </div>
        )}
      </div>
    </AuthenticatedPageWrapper>
  );
}
