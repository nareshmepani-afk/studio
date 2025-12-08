
"use client";

import { Suspense } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Loader2 } from 'lucide-react';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';
import { useSearchParams } from 'next/navigation';
import { useMemories } from '@/hooks/useMemories';
import type { Memory } from '@/types';

// This component now acts as a Client Component data loader for the edit page.
function EditMemoryLoader() {
    const searchParams = useSearchParams();
    const editMemoryId = searchParams.get('editMemoryId');
    const { memories, isLoading } = useMemories();

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-4">Loading memory...</p>
            </div>
        );
    }
    
    // Find the specific memory from the centralized cache provided by the hook.
    const memoryToEdit = memories.find((m: Memory) => m.id === editMemoryId);

    // Pass the found memory down as a prop. The form is now a "dumb" component.
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
                {/* The new loader component handles fetching the specific memory */}
                <EditMemoryLoader />
            </Suspense>
        </AuthenticatedPageWrapper>
    );
}
