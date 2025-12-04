
import { Suspense } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Loader2 } from 'lucide-react';
import { AddMemoryPageContent } from '@/components/memory/AddMemoryPageContent';


export default function AddMemoryPage() {
    return (
        <AuthenticatedPageWrapper>
            <Suspense fallback={
                <div className="container mx-auto py-8 px-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                </div>
            }>
                <AddMemoryPageContent />
            </Suspense>
        </AuthenticatedPageWrapper>
    );
}
