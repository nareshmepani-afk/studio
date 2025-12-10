"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// The MemoryForm now contains all client-side logic and must not be rendered on the server.
const MemoryForm = dynamic(() => import('@/components/memory/MemoryForm').then(mod => mod.MemoryForm), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto py-8 px-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground mt-4">[DIAGNOSTIC] Loading MemoryForm component...</p>
    </div>
  ),
});

interface AddMemoryPageContentProps {
  editMemoryId?: string;
  promptId?: string;
  initialCustomPrompt?: string;
}

export function AddMemoryPageContent({ editMemoryId, promptId, initialCustomPrompt }: AddMemoryPageContentProps) {
  // This component now receives the IDs as props and passes them to the form.
  console.log(`[DIAGNOSTIC] AddMemoryPageContent: Rendering MemoryForm with editMemoryId=${editMemoryId}`);
  return (
    <div className="container mx-auto py-8 px-4">
        <MemoryForm 
          editMemoryId={editMemoryId}
          promptId={promptId}
          initialCustomPrompt={initialCustomPrompt}
        />
    </div>
  );
}
