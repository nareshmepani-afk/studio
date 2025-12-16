
"use client";

import { ShieldAlert } from 'lucide-react';
import type { Memory } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { AuthenticatedPageWrapper } from '../layout/AuthenticatedPageWrapper';

interface AddMemoryPageContentProps {
  memoryToEdit: Memory | null;
  promptId?: string;
  initialCustomPrompt?: string;
  error?: string | null;
}

// This component now acts as a simple client-side wrapper.
// It receives all necessary data as props from the server component.
export function AddMemoryPageContent({ memoryToEdit, promptId, initialCustomPrompt, error }: AddMemoryPageContentProps) {
  
  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        {error && (
            <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Error Loading Memory</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {!error && (
            <MemoryForm 
            memoryToEdit={memoryToEdit} // Pass the full object
            promptId={promptId}
            initialCustomPrompt={initialCustomPrompt}
            />
        )}
      </div>
    </AuthenticatedPageWrapper>
  );
}
