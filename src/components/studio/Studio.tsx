'use client';

import { DirectorMonitor } from '@/components/studio/DirectorMonitor';
import { MetadataInspector } from '@/components/studio/MetadataInspector';
import { ModeSwitcher } from '@/components/studio/ModeSwitcher';
import { Teleprompter } from '@/components/studio/Teleprompter';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { RemoteControlDialog } from './RemoteControlDialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export const Studio = () => {
  const { mode, actions } = useStudioState();
  const [isRemoteControlOpen, setIsRemoteControlOpen] = useState(false);

  return (
    <div className="grid lg:grid-cols-10 h-screen bg-studio-black text-studio-text">
      {/* Main Content (70%) */}
      <div className="lg:col-span-7 flex flex-col h-full">
        <div className="flex-grow relative">
          {mode === 'solo' ? <Teleprompter /> : <DirectorMonitor />}
        </div>
      </div>

      {/* Sidebar (30%) */}
      <div className="lg:col-span-3 flex flex-col h-full bg-studio-card p-4 border-l border-studio-border">
        <div className="flex justify-center mb-6">
          <ModeSwitcher />
        </div>
        <MetadataInspector />
        <div className="mt-auto">
            <Button onClick={() => setIsRemoteControlOpen(true)} className="w-full">Remote Control</Button>
        </div>
      </div>
      <RemoteControlDialog open={isRemoteControlOpen} onClose={() => setIsRemoteControlOpen(false)} />
    </div>
  );
};
