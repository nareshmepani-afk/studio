
"use client";

import dynamic from 'next/dynamic';
import { Loader2, ShieldAlert } from 'lucide-react';
import type { Memory } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { MemoryForm } from '@/components/memory/MemoryForm';

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
