'use client';

import { useStudioState } from '@/hooks/studio/useStudioState';
import { Play, Pause, Plus, Minus, Type, FlipHorizontal } from 'lucide-react';
import { RemoteControlSection } from './RemoteControlSection';
import { RemoteControlButton } from './RemoteControlButton';
import { RemoteControlSlider } from './RemoteControlSlider';

export const RemoteControl = () => {
  const { 
    isConnected,
    isScrolling, 
    scrollSpeed, 
    fontSize, 
    isMirrored, 
    actions 
  } = useStudioState();

  return (
    <div className="bg-studio-black rounded-lg p-4 space-y-4">
      <div className="flex justify-center items-center space-x-2">
        <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        <span className="text-sm text-white">{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      <RemoteControlSection title="Teleprompter">
        <div className="flex items-center justify-center space-x-2">
          <RemoteControlButton onClick={actions.toggleScrolling} aria-label={isScrolling ? "Pause scrolling" : "Start scrolling"}>
            {isScrolling ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </RemoteControlButton>
        </div>
      </RemoteControlSection>

      <RemoteControlSection title="Speed">
        <div className="flex items-center justify-center space-x-2">
          <RemoteControlButton onClick={actions.decreaseSpeed} aria-label="Decrease speed">
            <Minus className="w-6 h-6" />
          </RemoteControlButton>
          <RemoteControlSlider
            value={[scrollSpeed]}
            onValueChange={([value]) => actions.setScrollSpeed(value)}
            min={0.5}
            max={10}
            step={0.5}
          />
          <RemoteControlButton onClick={actions.increaseSpeed} aria-label="Increase speed">
            <Plus className="w-6 h-6" />
          </RemoteControlButton>
        </div>
      </RemoteControlSection>

      <RemoteControlSection title="Font Size">
          <div className="flex items-center justify-center space-x-2">
              <RemoteControlButton onClick={actions.decreaseFontSize} aria-label="Decrease font size">
                  <Minus className="w-6 h-6" />
              </RemoteControlButton>
              <RemoteControlSlider
                  value={[fontSize]}
                  onValueChange={([value]) => actions.setFontSize(value)}
                  min={12}
                  max={120}
                  step={4}
                />
              <RemoteControlButton onClick={actions.increaseFontSize} aria-label="Increase font size">
                  <Plus className="w-6 h-6" />
              </RemoteControlButton>
          </div>
      </RemoteControlSection>

      <RemoteControlSection title="Mirror">
        <div className="flex items-center justify-center">
          <RemoteControlButton onClick={actions.toggleMirror} aria-label="Toggle mirror mode">
            <FlipHorizontal className="w-6 h-6" />
          </RemoteControlButton>
        </div>
      </RemoteControlSection>
    </div>
  );
};
