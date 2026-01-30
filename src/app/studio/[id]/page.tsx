
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/auth/useAuth';
import { RemoteView } from '@/components/studio/RemoteView';
import { signInAnonymously } from '@/app/auth/actions';

export default function StudioPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const role = searchParams.get('role');

  useEffect(() => {
    if (role === 'remote' && !user && !loading) {
      signInAnonymously();
    }
  }, [role, user, loading]);

  if (role === 'remote') {
    return <RemoteView />;
  }

  // Handle the case where the role is not remote, or for the main user.
  // This might involve redirecting to the main studio view or showing a different UI.
  // For now, we'll just return a simple message.
  return <div>Main Studio View</div>;
}

