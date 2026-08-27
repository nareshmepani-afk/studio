import React, { Suspense } from 'react';
import { Metadata } from 'next';
import StagingLockContent from '@/components/auth/StagingLockContent';

export const metadata: Metadata = {
  title: 'Staging Access Key | Memory Weaver',
  description: 'Authorised preview sandbox access control.',
  robots: {
    index: false,
    follow: false
  }
};

export default function StagingLockPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-amber-400 font-mono text-xs">
        Loading Access Gate...
      </div>
    }>
      <StagingLockContent />
    </Suspense>
  );
}
