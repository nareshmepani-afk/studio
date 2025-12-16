
import { Loader2 } from 'lucide-react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';

export default function Loading() {
  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4 flex justify-center items-center h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading memory...</p>
        </div>
      </div>
    </AuthenticatedPageWrapper>
  );
}
