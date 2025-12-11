
import React from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';
import { getMemory } from '@/actions/getMemoryAction'; // Import the new server action

// This is now a simple, clean Server Component.
// Its only job is to orchestrate the data fetching and pass it to the client.

interface AddMemoryPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AddMemoryPage({ searchParams }: AddMemoryPageProps) {

  const editMemoryId = typeof searchParams.editMemoryId === 'string' ? searchParams.editMemoryId : undefined;
  const promptId = typeof searchParams.promptId === 'string' ? searchParams.promptId : undefined;
  const initialCustomPrompt = typeof searchParams.prompt === 'string' ? searchParams.prompt : undefined;

  // All authentication and data fetching is now handled by the getMemory server action.
  // This completely bypasses the header propagation issue with client-side navigation.
  if (editMemoryId) {
    const { memory, error } = await getMemory(editMemoryId);

    // Generate a unique key to force a re-mount of the client component when the memory ID changes.
    const componentKey = `edit-${editMemoryId}`;

    return (
      <AuthenticatedPageWrapper>
        <AddMemoryPageContent
          key={componentKey}
          memoryToEdit={memory} // Pass the fetched memory (or null)
          promptId={promptId}
          initialCustomPrompt={initialCustomPrompt}
          error={error} // Pass any error that occurred
        />
      </AuthenticatedPageWrapper>
    );
  } else {
    // Handle the case for creating a new memory (no fetching required)
    const componentKey = `new-${promptId || initialCustomPrompt || 'freeform'}`;
    return (
      <AuthenticatedPageWrapper>
        <AddMemoryPageContent
          key={componentKey}
          memoryToEdit={null}
          promptId={promptId}
          initialCustomPrompt={initialCustomPrompt} // Corrected typo here
          error={null}
        />
      </AuthenticatedPageWrapper>
    );
  }
}
