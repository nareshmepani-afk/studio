'use client';

import { DirectorMonitor } from '@/components/studio/DirectorMonitor';
import { MetadataInspector } from '@/components/studio/MetadataInspector';
import { ModeSwitcher } from '@/components/studio/ModeSwitcher';
import { Teleprompter } from '@/components/studio/Teleprompter';
import { useStudio } from '@/hooks/studio/useStudio';

export const Studio = () => {
  const { mode, setMode } = useStudio();

  return (
    <div className="grid lg:grid-cols-10 h-screen bg-studio-black text-white">
      {/* Main Content (70%) */}
      <div className="lg:col-span-7 flex flex-col h-full">
        <div className="flex-grow relative">
          {mode === 'solo' ? <Teleprompter /> : <DirectorMonitor />}
        </div>
      </div>

      {/* Sidebar (30%) */}
      <div className="lg:col-span-3 flex flex-col h-full bg-[#121212] p-4 border-l border-white/10">
        <div className="flex justify-center mb-6">
          <ModeSwitcher mode={mode} setMode={setMode} />
        </div>
        <MetadataInspector />
      </div>
    </div>
  );
};
