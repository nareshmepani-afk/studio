
"use client";

import { Suspense, useEffect } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Loader2 } from 'lucide-react';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMemories } from '@/hooks/useMemories';
import type { Memory } from '@/types';
import { toast } from "@/hooks/use-toast";

function EditMemoryLoader() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const editMemoryId = searchParams.get('editMemoryId');
    const { memories, isLoading } = useMemories();

    // If we're not in "edit" mode, render the form for a new memory immediately.
    if (!editMemoryId) {
        return <AddMemoryPageContent />;
    }

    // This effect handles the core logic for the "edit" mode.
    // It waits for the memory data to finish loading, then checks if the requested memory exists.
    useEffect(() => {
        // Only run the check after loading is complete and we are trying to edit.
        if (!isLoading && editMemoryId) {
            const memoryExists = memories.some((m: Memory) => m.id === editMemoryId);
            
            // If the memory does not exist in the cache, it's an error.
            if (!memoryExists) {
                console.error(`ERROR: Memory with ID ${editMemoryId} not found in cache after loading.`);
                toast({
                    title: "Memory Not Found",
                    description: "Returning to the timeline. The memory may have been deleted.",
                    variant: "destructive",
                });
                // This is a GRACEFUL redirect back to the timeline page using the Next.js router.
                // It does NOT cause a full page refresh.
                router.push('/timeline');
            }
        }
    }, [isLoading, memories, editMemoryId, router]);


    // While the main memory cache is loading, show a spinner.
    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-4">Loading memory...</p>
            </div>
        );
    }
    
    // Find the specific memory from the now-loaded centralized cache.
    const memoryToEdit = memories.find((m: Memory) => m.id === editMemoryId);

    // If the useEffect hasn't redirected yet but the memory isn't found
    // (e.g., during a brief re-render), show a verifying state instead of an error.
    // The useEffect will catch the final error state.
    if (!memoryToEdit) {
         return (
            <div className="container mx-auto py-8 px-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-4">Verifying memory...</p>
            </div>
        );
    }

    // If the memory is found, pass it to the form component.
    return <AddMemoryPageContent memory={memoryToEdit} />;
}


export default function AddMemoryPage() {
    return (
        <AuthenticatedPageWrapper>
            <Suspense fallback={
                <div className="container mx-auto py-8 px-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                </div>
            }>
                <EditMemoryLoader />
            </Suspense>
        </AuthenticatedPageWrapper>
    );
}
