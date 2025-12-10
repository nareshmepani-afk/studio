
"use client";

import { ShieldAlert } from 'lucide-react';
import type { Memory } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { MemoryForm } from '@/components/memory/MemoryForm';

interface AddMemoryPageContentProps {
  memoryToEdit: Memory | null;
  promptId?: string;
  initialCustomPrompt?: string;
  error?: string | null;
}

// This component now acts as a simple client-side wrapper.
// It receives all necessary data as props from the server component.
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

  // Pass the server-fetched memory object directly to the form.
  // The form is now "dumb" and just renders the data it's given.
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
