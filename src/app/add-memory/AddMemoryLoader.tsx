
"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const AddMemoryPageContent = dynamic(() => import('@/components/memory/AddMemoryPageContent').then(mod => mod.AddMemoryPageContent), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto py-8 px-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground mt-4">Loading editor...</p>
    </div>
  ),
});

export function AddMemoryLoader() {
  return <AddMemoryPageContent />;
}
