
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
  // All logic to find the memory has been moved up to the page level.
  // This component now just receives the memory (or undefined) and passes it to the form.
  return (
    <div className="container mx-auto py-8 px-4">
        <MemoryForm memoryToEdit={memory} />
    </div>
  );
}
