
"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { Memory } from '@/types';
import { useSearchParams } from 'next/navigation';

// The MemoryForm now contains all client-side logic and must not be rendered on the server.
const MemoryForm = dynamic(() => import('@/components/memory/MemoryForm').then(mod => mod.MemoryForm), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto py-8 px-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground mt-4">Loading editor...</p>
    </div>
  ),
});

interface AddMemoryPageContentProps {
    memory?: Memory;
}

export function AddMemoryPageContent({ memory }: AddMemoryPageContentProps) {
  const searchParams = useSearchParams();
  const isEditing = !!searchParams.get('editMemoryId');

  // THIS IS THE FIX:
  // If the URL indicates we are editing, but the memory prop hasn't been passed down yet
  // (because it's still loading in the parent), we render a loading state.
  // This prevents passing `undefined` to the MemoryForm and causing a crash.
  if (isEditing && !memory) {
    return (
        <div className="container mx-auto py-8 px-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-4">Verifying memory data...</p>
        </div>
    );
  }

  // If we are not editing, or if we are editing and the memory is loaded, render the form.
  return (
    <div className="container mx-auto py-8 px-4">
        <MemoryForm memoryToEdit={memory} />
    </div>
  );
}
