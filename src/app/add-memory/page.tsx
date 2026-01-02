'use client';

import { Suspense } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryForm } from '@/components/memory/MemoryForm';

export default function AddMemoryPage() {
    return (
        <AuthenticatedPageWrapper>
            <Suspense fallback={<div>Loading...</div>}>
                <MemoryForm />
            </Suspense>
        </AuthenticatedPageWrapper>
    )
}
