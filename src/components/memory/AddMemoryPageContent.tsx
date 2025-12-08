
"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { Memory } from '@/types';

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
  // This component now only serves to dynamically load the client-heavy MemoryForm
  // and pass the pre-loaded memory object to it.
  return (
    <div className="container mx-auto py-8 px-4">
        <MemoryForm memoryToEdit={memory} />
    </div>
  );
}
