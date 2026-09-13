import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import FiresideStudioClient from './FiresideStudioClient';

export const metadata: Metadata = {
  title: 'Fireside Voice Studio | Memory Weaver',
  description: 'Armchair storytelling surface for family memoirs with elder-friendly ergonomics.',
  openGraph: {
    title: 'Fireside Voice Studio | Memory Weaver',
    description: 'Armchair storytelling surface for family memoirs with elder-friendly ergonomics.',
    locale: 'en_GB',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default function FiresideStudioPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-amber-400 font-serif">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-4" />
          <p className="text-sm tracking-wide">Opening Fireside Voice Studio...</p>
        </div>
      }
    >
      <FiresideStudioClient />
    </Suspense>
  );
}
