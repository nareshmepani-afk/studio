
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4 flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
          <h2 className="text-2xl font-headline mb-2">Loading Page...</h2>
          <p className="text-muted-foreground mb-8">Please wait a moment.</p>
        </div>
        {/* You can optionally keep some skeleton if it fits the desired loading look */}
        <div className="w-full max-w-3xl space-y-6 opacity-50">
          <Skeleton className="h-10 w-1/3" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg md:col-span-2" />
            <Skeleton className="h-40 rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  );
}
