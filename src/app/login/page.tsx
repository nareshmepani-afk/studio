'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div>
      {/* Only render the conditional message and the form itself on the client 
          to avoid any possible hydration mismatch, regardless of the source. */}
      {isClient && (
        <>
          {reason === 'expired' && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-sm text-yellow-700">
                For your security, your session has timed out. Please sign in to continue.
              </p>
            </div>
          )}
          <LoginForm />
        </>
      )}
    </div>
  );
}
