
"use client";

import { Suspense } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function AddMemoryContentWithId() {
    const searchParams = useSearchParams();
    const editMemoryId = searchParams.get('editMemoryId');
    const promptId = searchParams.get('promptId');
    const customPrompt = searchParams.get('prompt');

    // [DIAGNOSTIC] Log the IDs received at the page level
    console.log(`[DIAGNOSTIC] add-memory/page.tsx: editMemoryId = ${editMemoryId}, promptId = ${promptId}, customPrompt = ${customPrompt}`);

    return <AddMemoryPageContent key={editMemoryId || 'new'} />;
}


export default function AddMemoryPage() {
    return (
        <AuthenticatedPageWrapper>
            <Suspense fallback={
                <div className="container mx-auto py-8 px-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground mt-4">Loading memory editor...</p>
                </div>
            }>
                <AddMemoryContentWithId />
            </Suspense>
        </AuthenticatedPageWrapper>
    );
}
