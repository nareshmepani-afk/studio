
"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMemories } from '@/hooks/useMemories';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import type { Memory } from '@/types';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';
import { Loader2 } from 'lucide-react';

function AddMemoryContentLoader() {
    const searchParams = useSearchParams();
    const editMemoryId = searchParams.get('editMemoryId');
    const { memories, isLoading: isLoadingMemories } = useMemories();

    if (editMemoryId && (isLoadingMemories || memories.length === 0)) {
        return (
            <div className="container mx-auto py-8 px-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-4">Loading memory...</p>
            </div>
        );
    }
    
    const memoryToEdit = editMemoryId ? memories.find((m: Memory) => m.id === editMemoryId) : undefined;
    
    // This condition is important for the initial render after a hard refresh on the edit page
    if (editMemoryId && !memoryToEdit && !isLoadingMemories) {
         return (
            <div className="container mx-auto py-8 px-4 text-center">
                <p className="text-destructive mt-4">Memory not found. It may have been deleted.</p>
            </div>
        );
    }

    return <AddMemoryPageContent memory={memoryToEdit} />;
}

export default function AddMemoryPage() {
    return (
        <AuthenticatedPageWrapper>
            <Suspense fallback={
                <div className="container mx-auto py-8 px-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground mt-4">Loading editor...</p>
                </div>
            }>
                <AddMemoryContentLoader />
            </Suspense>
        </AuthenticatedPageWrapper>
    );
}
