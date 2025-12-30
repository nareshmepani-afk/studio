
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMemoryById, saveMemory } from '@/actions/memoryActions';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import type { Memory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AddMemoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const editMemoryId = searchParams.get('editMemoryId');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    if (editMemoryId) {
      setLoading(true);
      getMemoryById(editMemoryId)
        .then(response => {
          if (response.success && response.data) {
            setMemory(response.data);
          } else {
            setError(response.message || 'Failed to load memory.');
            toast({ title: 'Error', description: response.message, variant: 'destructive' });
          }
        })
        .catch(err => {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        })
        .finally(() => setLoading(false));
    } else {
      setMemory(null); // Ensure it's reset for new memory creation
      setLoading(false);
    }
  }, [editMemoryId, user, authLoading, router, toast]);

  const handleSubmit = async (formData: FormData) => {
    if (!user) {
      toast({ title: 'Unauthorized', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }

    try {
        // --- START DEFINITIVE FIX ---
        // The root cause of the hang: The client was not calling the correct server action for edits.
        // It was trying to hit a separate API route not designed for updates.
        // This now correctly uses the 'saveMemory' server action for both creating and editing.

        const result = await saveMemory(formData, editMemoryId);

        // --- END DEFINITIVE FIX ---

        if (result.success) {
            toast({ title: 'Success!', description: result.message });
            router.push('/timeline');
        } else {
            toast({ 
                title: 'Save Failed', 
                description: result.message || 'An unknown error occurred on the server.', 
                variant: 'destructive' 
            });
        }
    } catch (e: any) {
        console.error("Form submission crash:", e);
        toast({ 
            title: 'Client-side Error', 
            description: e.message || 'An unexpected error occurred before sending to the server.',
            variant: 'destructive' 
        });
    }
  };

  if (loading || authLoading) {
    return (
        <AuthenticatedPageWrapper> 
            <div className="container mx-auto py-10 px-4">
                <Skeleton className="h-12 w-1/2 mb-6" />
                <Skeleton className="h-96 w-full" />
            </div>
        </AuthenticatedPageWrapper>
    );
  }

  if (error) {
    return (
        <AuthenticatedPageWrapper>
            <div className="container mx-auto py-10 px-4 text-center">
                <p className="text-red-500">{error}</p>
            </div>
        </AuthenticatedPageWrapper>
    );
  }

  return (
    <AuthenticatedPageWrapper>
        <MemoryForm 
            memory={memory} 
            onSubmit={handleSubmit} 
            isEditing={!!editMemoryId} 
        />
    </AuthenticatedPageWrapper>
  );
}
