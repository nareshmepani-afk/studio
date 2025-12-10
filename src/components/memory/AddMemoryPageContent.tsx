
"use client";

import dynamic from 'next/dynamic';
import { Loader2, ShieldAlert } from 'lucide-react';
import type { Memory } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// The MemoryForm now contains all client-side logic and must not be rendered on the server.
const MemoryForm = dynamic(() => import('@/components/memory/MemoryForm').then(mod => mod.MemoryForm), {
  ssr: false, // Ensure this component is never rendered on the server
  loading: () => (
    <div className="container mx-auto py-8 px-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground mt-4">Loading memory form...</p>
    </div>
  ),
});

interface AddMemoryPageContentProps {
  memoryToEdit: Memory | null;
  promptId?: string;
  initialCustomPrompt?: string;
  error?: string | null;
}

export function AddMemoryPageContent({ memoryToEdit, promptId, initialCustomPrompt, error }: AddMemoryPageContentProps) {
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Memory</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Pass the fetched memory object directly to the form.
  return (
    <div className="container mx-auto py-8 px-4">
        <MemoryForm 
          memoryToEdit={memoryToEdit} // Pass the full object
          promptId={promptId}
          initialCustomPrompt={initialCustomPrompt}
        />
    </div>
  );
}
