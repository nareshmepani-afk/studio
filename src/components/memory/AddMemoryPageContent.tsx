
"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

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

export function AddMemoryPageContent() {
  // This component now only serves to dynamically load the client-heavy MemoryForm.
  return (
    <div className="container mx-auto py-8 px-4">
        <MemoryForm />
    </div>
  );
}
