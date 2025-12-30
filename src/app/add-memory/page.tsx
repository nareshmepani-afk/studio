
import React from 'react';
import { MemoryForm } from '@/components/memory/MemoryForm';
import type { Memory } from '@/types';
import { Suspense } from 'react';
import Loading from './loading';

// This is the new, simplified page component. It acts as a server-side "wrapper".
// Its only job is to render the client-side form component, using Suspense for loading.
// The actual data fetching logic for edits is now handled inside MemoryForm.tsx on the client.
export default function AddMemoryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const editMemoryId = typeof searchParams.editMemoryId === 'string' ? searchParams.editMemoryId : undefined;
  const promptId = typeof searchParams.promptId === 'string' ? searchParams.promptId : undefined;
  const initialCustomPrompt = typeof searchParams.customPrompt === 'string' ? searchParams.customPrompt : undefined;
  
  return (
    <Suspense fallback={<Loading />}>
      <MemoryForm
        editMemoryId={editMemoryId}
        promptId={promptId}
        initialCustomPrompt={initialCustomPrompt}
      />
    </Suspense>
  );
}
