
"use client";

import { Suspense, useEffect } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Loader2 } from 'lucide-react';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMemories } from '@/hooks/useMemories';
import type { Memory } from '@/types';
import { toast } from "@/hooks/use-toast";

// This helper component handles the specific case where a memory is not found after loading.
// It shows a toast notification and redirects the user back to the timeline gracefully.
const RedirectAndNotify = () => {
    const router = useRouter();
    useEffect(() => {
        toast({
            title: "Memory Not Found",
            description: "The requested memory could not be found. You are being redirected.",
            variant: "destructive",
        });
        router.push('/timeline');
    }, [router]);

    return (
        <div className="container mx-auto py-8 px-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-4">Memory not found. Redirecting to timeline...</p>
        </div>
    );
};

function EditMemoryLoader() {
    const searchParams = useSearchParams();
    const editMemoryId = searchParams.get('editMemoryId');
    const { memories, isLoading } = useMemories();

    // If there's no editMemoryId in the URL, we are creating a new memory.
    if (!editMemoryId) {
        return <AddMemoryPageContent />;
    }

    // --- THIS IS THE ROBUST FIX ---
    // 1. We must wait if the hook is in a loading state OR if the memories array hasn't been populated yet.
    // This prevents any attempt to access `memories` when it is undefined, which was the cause of the crash.
    if (isLoading || !memories) {
        return (
            <div className="container mx-auto py-8 px-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-4">Loading memory...</p>
            </div>
        );
    }

    // 2. Only after we are sure data is loaded and available, we try to find the memory.
    const memoryToEdit = memories.find((m: Memory) => m.id === editMemoryId);

    // 3. If the memory is not found in the loaded data, we render the redirect component.
    // This avoids calling hooks conditionally and ensures a graceful exit.
    if (!memoryToEdit) {
        return <RedirectAndNotify />;
    }
    
    // 4. If the memory is found, we can safely render the content.
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
