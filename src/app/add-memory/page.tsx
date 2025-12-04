
"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Memory } from '@/types';
import { toast } from '@/hooks/use-toast';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { parseISO, isValid, format, getYear, getMonth, getDate } from 'date-fns';
import { saveMemory } from '@/actions/memoryActions';
import { app } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const MemoryForm = dynamic(() => import('@/components/memory/MemoryForm').then(mod => mod.MemoryForm), {
  ssr: false,
  loading: () => (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="flex justify-between">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
  )
});

function AddMemoryPageComponent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const editMemoryId = searchParams.get('editMemoryId');
  const initialPromptId = searchParams.get('promptId') || undefined;
  const initialCustomPromptText = searchParams.get('prompt') || undefined;

  const [memoryToEdit, setMemoryToEdit] = useState<Memory | null>(null);
  const [isLoadingMemory, setIsLoadingMemory] = useState(true);
  
  useEffect(() => {
    if (editMemoryId && user) {
      const db = getFirestore(app);
      const fetchMemory = async () => {
        setIsLoadingMemory(true);
        try {
          const memoryDocRef = doc(db, 'users', user.id, 'memories', editMemoryId);
          const docSnap = await getDoc(memoryDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Memory;
            setMemoryToEdit({
              ...data,
              id: docSnap.id,
              date: data.date && isValid(parseISO(data.date)) ? parseISO(data.date).toISOString() : new Date().toISOString(),
            });
          } else {
            toast({ title: "Memory not found", variant: "destructive" });
            router.push('/timeline');
          }
        } catch (error) {
          toast({ title: "Error loading memory", variant: "destructive" });
        } finally {
          setIsLoadingMemory(false);
        }
      };
      fetchMemory();
    } else {
        setIsLoadingMemory(false);
    }
  }, [editMemoryId, user, router]);

  const handleSubmit = async (
      memoryData: Omit<Memory, 'id' | 'userId'> & { promptId?: string },
      mediaFileToUpload?: File | undefined
    ) => {
    if (!user) {
      toast({ title: "Authentication Error", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    // Use a server action that handles FormData properly.
    // Instead of stringifying, we'll send raw values and the file.
    // The server action 'saveMemory' will need to be adapted for this.

    // A more robust way to handle complex objects with FormData is to stringify non-file data.
    Object.entries(memoryData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'mediaFile') { // Ensure mediaFile isn't stringified
             formData.append(key, JSON.stringify(value));
        }
    });
    
    if (mediaFileToUpload) {
        // The file from the trimmer is now correctly appended.
        formData.append('mediaFile', mediaFileToUpload);
    }
    
    const result = await saveMemory(formData, user.id, editMemoryId);

    if (result.success) {
      toast({ title: result.message, variant: "success" });
      if (initialPromptId) {
          router.push('/prompts');
      } else {
          router.push('/timeline');
      }
    } else {
      toast({ title: "Failed to Save Memory", description: result.message, variant: "destructive" });
    }
  };
  
  if (isLoadingMemory) {
      return (
          <AuthenticatedPageWrapper>
              <div className="container mx-auto py-8 px-4 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground mt-4">Loading memory...</p>
              </div>
          </AuthenticatedPageWrapper>
      );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <MemoryForm
          memory={memoryToEdit || undefined}
          onSubmit={handleSubmit}
          initialPromptId={initialPromptId}
          initialCustomPromptText={initialCustomPromptText}
        />
      </div>
    </AuthenticatedPageWrapper>
  );
}

export default function AddMemoryPage() {
    return (
        <Suspense fallback={
            <AuthenticatedPageWrapper>
                <div className="container mx-auto py-8 px-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                </div>
            </AuthenticatedPageWrapper>
        }>
            <AddMemoryPageComponent />
        </Suspense>
    );
}
