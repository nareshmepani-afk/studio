'use client';

import React from 'react';
import { useStudio } from '@/hooks/studio/useStudio';
import { useStudioMode } from '@/hooks/studio/useStudioMode';
import { useTeleprompter } from '@/hooks/studio/useTeleprompter';
import { useCameraManager } from '@/hooks/studio/useCameraManager';
import DirectorMonitor from '@/components/studio/DirectorMonitor';
import Teleprompter from '@/components/studio/Teleprompter';
import MetadataInspector from '@/components/studio/MetadataInspector';
import ModeSwitcher from '@/components/studio/ModeSwitcher';
import { teleprompterScripts, defaultTeleprompterFallbackScript } from '@/lib/teleprompterScripts';
import { Loader2 } from 'lucide-react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Button } from '@/components/ui/button';
import { Play, Pause, Plus, Minus, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const TeleprompterControls = ({ teleprompter, studioMode }) => {
  if (studioMode === 'INTERVIEW') return null;

  return (
    <div className="bg-muted/30 p-4 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Teleprompter</h3>
      <div className="flex items-center justify-center gap-2">
        <Button onClick={teleprompter.toggleScrolling} size="icon" variant="outline">
          {teleprompter.isScrolling ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button onClick={teleprompter.nextQuestion} size="icon" variant="outline">
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-2">
        <label className="text-sm">Speed</label>
        <Slider 
          value={[teleprompter.scrollSpeed]}
          onValueChange={(value) => teleprompter.setScrollSpeed(value[0])}
          min={0.5}
          max={10}
          step={0.5}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm">Font Size</label>
        <div className="flex items-center gap-2">
            <Button onClick={teleprompter.decreaseFontSize} size="icon" variant="outline"><Minus className="h-4 w-4" /></Button>
            <span className="text-sm w-10 text-center">{teleprompter.fontSize}</span>
            <Button onClick={teleprompter.increaseFontSize} size="icon" variant="outline"><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  )
}

export function Studio() {
  const studioState = useStudio();
  const { studioMode, toggleStudioMode } = useStudioMode();
  const cameraManager = useCameraManager();

  const teleprompterScript = teleprompterScripts[studioState.promptId as keyof typeof teleprompterScripts] || defaultTeleprompterFallbackScript;
  // A bit of a hack to get the questions from the script
  const teleprompterQuestions = teleprompterScript.split(/\n\s*\n/).map((text, i) => ({ id: `${studioState.promptId}-${i}`, text }));
  const teleprompter = useTeleprompter(teleprompterQuestions);

  if (studioState.authLoading || studioState.isLoadingMemory) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto max-w-6xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <DirectorMonitor stream={cameraManager.stream} />
          </div>
          <div className="space-y-8">
            <ModeSwitcher mode={studioMode} toggleMode={toggleStudioMode} />
            {studioMode === 'SOLO' && <TeleprompterControls teleprompter={teleprompter} studioMode={studioMode} />}
            <Teleprompter 
              text={teleprompter.currentQuestion?.text ?? ''}
              scrollSpeed={teleprompter.scrollSpeed}
              fontSize={teleprompter.fontSize} 
            />
            <MetadataInspector {...studioState} />
          </div>
        </div>
      </div>
    </AuthenticatedPageWrapper>
  );
}
