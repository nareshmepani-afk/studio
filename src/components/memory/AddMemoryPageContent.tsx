
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Memory } from '@/types';
import { toast } from '@/hooks/use-toast';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { parseISO, isValid } from 'date-fns';
import { saveMemory } from '@/actions/memoryActions';
import { app } from '@/lib/firebase';
import { MemoryForm } from '@/components/memory/MemoryForm';


export function AddMemoryPageContent() {
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
            
            // This is the line that caused the ReferenceError before.
            // It's safe here because this is a 'use client' component.
            const validDate = data.date && isValid(parseISO(data.date)) ? parseISO(data.date).toISOString() : new Date().toISOString();

            setMemoryToEdit({
              ...data,
              id: docSnap.id,
              date: validDate,
            });
          } else {
            toast({ title: "Memory not found", variant: "destructive" });
            router.push('/timeline');
          }
        } catch (error) {
          console.error("Error loading memory:", error);
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
    Object.entries(memoryData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'mediaFile') { 
             formData.append(key, JSON.stringify(value));
        }
    });
    
    if (mediaFileToUpload) {
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
          <div className="container mx-auto py-8 px-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-4">Loading memory...</p>
          </div>
      );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <MemoryForm
        memory={memoryToEdit || undefined}
        onSubmit={handleSubmit}
        initialPromptId={initialPromptId}
        initialCustomPromptText={initialCustomPromptText}
      />
    </div>
  );
}
