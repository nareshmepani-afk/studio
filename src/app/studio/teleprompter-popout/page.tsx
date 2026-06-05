'use client';

import React, { Suspense } from 'react';
import { PopoutTeleprompter } from '@/components/studio/PopoutTeleprompter';

export default function TeleprompterPopoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-xs font-mono text-zinc-500">Loading Teleprompter...</div>}>
      <PopoutTeleprompter />
    </Suspense>
  );
}
