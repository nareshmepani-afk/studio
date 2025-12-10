
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';
import { Loader2 } from 'lucide-react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';

/**
 * COMPONENT 1: The Content Wrapper
 * This component is responsible for reading the URL.
 * It is ONLY rendered once the Suspense boundary is satisfied.
 */
function AddMemoryContentWithParams() {
  const searchParams = useSearchParams();
  
  // Safely extract parameters. They are guaranteed to be available here.
  const editMemoryId = searchParams.get('editMemoryId') || undefined;
  const promptId = searchParams.get('promptId') || undefined;
  const initialPrompt = searchParams.get('prompt') || undefined;

  // We use a key to force React to destroy and recreate the form 
  // if we switch from "Edit" to "New" or vice versa.
  // This prevents the state "ghosting" issues.
  const componentKey = editMemoryId ? `edit-${editMemoryId}` : `new-${promptId || initialPrompt || 'freeform'}`;

  // [DIAGNOSTIC] Log the IDs received at the page level
  console.log(`[DIAGNOSTIC] add-memory/page.tsx wrapper: editMemoryId=${editMemoryId}, promptId=${promptId}, initialPrompt=${initialPrompt}`);

  return (
    <AddMemoryPageContent 
      key={componentKey}
      editMemoryId={editMemoryId}
      promptId={promptId}
      initialCustomPrompt={initialPrompt}
    />
  );
}

/**
 * COMPONENT 2: The Loading Fallback
 * This is what the user sees for the fraction of a second while URL params load.
 */
function LoadingState() {
  return (
    <div className="container mx-auto py-8 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground mt-4">Loading memory editor...</p>
    </div>
  );
}

/**
 * MAIN PAGE EXPORT
 * This is the entry point. It sets up the Suspense boundary.
 */
export default function AddMemoryPage() {
  return (
    <AuthenticatedPageWrapper>
      <Suspense fallback={<LoadingState />}>
        <AddMemoryContentWithParams />
      </Suspense>
    </AuthenticatedPageWrapper>
  );
}
