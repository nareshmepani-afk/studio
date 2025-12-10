
"use client";

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMemories } from '@/hooks/useMemories';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import type { Memory } from '@/types';

function DebuggerContent() {
    const renderCount = useRef(1);
    const searchParams = useSearchParams();
    const editMemoryId = searchParams.get('editMemoryId');
    const { memories, isLoading, isError } = useMemories();

    useEffect(() => {
        const targetMemory = memories?.find((m: Memory) => m.id === editMemoryId);

        console.log(`
-----------------------------------------
Render Cycle #${renderCount.current}
-----------------------------------------
Timestamp: ${new Date().toISOString()}
isLoading: ${isLoading}
isError: ${isError}
memories is undefined: ${memories === undefined}
memories is null: ${memories === null}
memories array length: ${memories?.length ?? 'N/A'}
editMemoryId: ${editMemoryId}
Target memory found: ${!!targetMemory}
-----------------------------------------
        `);

        renderCount.current += 1;
    });

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', lineHeight: '1.6' }}>
            <h1>Debugging Memory State...</h1>
            <p>Check the developer console for detailed logs on each render cycle.</p>
            <p>This page is in a temporary diagnostic mode.</p>
            <hr />
            <h2>Live State:</h2>
            <p><strong>isLoading:</strong> {String(isLoading)}</p>
            <p><strong>Memories Array Length:</strong> {memories?.length ?? 'N/A'}</p>
            <p><strong>editMemoryId:</strong> {editMemoryId}</p>
        </div>
    );
}

export default function AddMemoryPage() {
    return (
        <AuthenticatedPageWrapper>
            <Suspense fallback={<div>Loading Suspense...</div>}>
                <DebuggerContent />
            </Suspense>
        </AuthenticatedPageWrapper>
    );
}
