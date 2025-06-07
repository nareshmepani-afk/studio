
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  // You can add any UI you want here, a simpler skeleton is often effective.
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg md:col-span-2" />
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  );
}
