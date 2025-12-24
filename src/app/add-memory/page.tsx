'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { getMemoryById } from '@/actions/memoryActions';
import type { Memory } from '@/types.ts';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// A fallback component to show while the main component is suspended.
function AddMemoryLoading() {
  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex justify-center mb-6 space-x-2">
        <Skeleton className="h-2 w-16 rounded-full" />
        <Skeleton className="h-2 w-16 rounded-full" />
      </div>
      <Card>
        <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddMemoryPage() {
  const searchParams = useSearchParams();
  // --- CORRECTED: Reads 'editMemoryId' from the URL --- 
  const memoryId = searchParams.get('editMemoryId');
  const promptId = searchParams.get('promptId');
  const customPrompt = searchParams.get('customPrompt');

  const [memoryToEdit, setMemoryToEdit] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if there is a memoryId
    if (memoryId) {
      setIsLoading(true);
      getMemoryById(memoryId)
        .then(result => {
          if (result.success && result.data) {
            setMemoryToEdit(result.data);
          } else {
            setError(result.message || 'Failed to load memory.');
          }
        })
        .catch(err => {
            console.error("Fetch error:", err);
            setError("An unexpected error occurred.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // If there's no ID, we are creating a new memory, so don't load.
      setIsLoading(false);
    }
  }, [memoryId]);

  // Display loading skeleton
  if (isLoading) {
    return <AddMemoryLoading />;
  }

  // Display error message if fetching failed
  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  // If we have an ID but no memory, it means it's still loading or failed.
  // This check is important because memoryToEdit will be null on the first render.
  if (memoryId && !memoryToEdit) {
      return <AddMemoryLoading />;
  }
  
  return (
    <MemoryForm 
      memoryToEdit={memoryToEdit} 
      promptId={promptId || undefined}
      initialCustomPrompt={customPrompt || undefined}
    />
  );
}

// Wrap the page in a Suspense boundary to handle the initial render
// and use of searchParams.
export default function AddMemoryPageWrapper() {
    return (
        <Suspense fallback={<AddMemoryLoading />}>
            <AddMemoryPage />
        </Suspense>
    );
}
