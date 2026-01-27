'use client';

import { useStudioState } from '@/hooks/studio/useStudioState';
import { Play, Pause, Plus, Minus, FlipHorizontal } from 'lucide-react';
import { RemoteControlSection } from './RemoteControlSection';
import { RemoteControlButton } from './RemoteControlButton';
import { RemoteControlSlider } from './RemoteControlSlider';
import SessionIdWitness from '../../debug/SessionIdWitness';

export const RemoteControl = () => {
  const { 
    isConnected,
    isScrolling, 
    scrollSpeed, 
    fontSize, 
    actions, 
    sessionId
  } = useStudioState();

  // --- ACTION WRAPPERS WITH LOGGING ---
  const logAndExecute = (actionName: string, action: Function, ...args: any[]) => {
    console.log(`[REMOTE_ACTION] ${actionName}`, ...args);
    action(...args);
  };

  const toggleScrolling = () => logAndExecute('toggleScrolling', actions.toggleScrolling);
  const decreaseSpeed = () => logAndExecute('decreaseSpeed', actions.decreaseSpeed);
  const increaseSpeed = () => logAndExecute('increaseSpeed', actions.increaseSpeed);
  const setScrollSpeed = (value: number) => logAndExecute('setScrollSpeed', actions.setScrollSpeed, value);
  const decreaseFontSize = () => logAndExecute('decreaseFontSize', actions.decreaseFontSize);
  const increaseFontSize = () => logAndExecute('increaseFontSize', actions.increaseFontSize);
  const setFontSize = (value: number) => logAndExecute('setFontSize', actions.setFontSize, value);
  const toggleMirror = () => logAndExecute('toggleMirror', actions.toggleMirror);
  // --- END --- 

  return (
    <div className="bg-studio-black rounded-lg p-4 space-y-4">
      <SessionIdWitness sessionId={sessionId} />
      <div className="flex justify-center items-center space-x-2">
        <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        <span className="text-sm text-white">{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      <RemoteControlSection title="Teleprompter">
        <div className="flex items-center justify-center space-x-2">
          <RemoteControlButton onClick={toggleScrolling} aria-label={isScrolling ? "Pause scrolling" : "Start scrolling"}>
            {isScrolling ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </RemoteControlButton>
        </div>
      </RemoteControlSection>

      <RemoteControlSection title="Speed">
        <div className="flex items-center justify-center space-x-2">
          <RemoteControlButton onClick={decreaseSpeed} aria-label="Decrease speed">
            <Minus className="w-6 h-6" />
          </RemoteControlButton>
          <RemoteControlSlider
            value={[scrollSpeed]}
            onValueChange={([value]) => setScrollSpeed(value)}
            min={0.5}
            max={10}
            step={0.5}
          />
          <RemoteControlButton onClick={increaseSpeed} aria-label="Increase speed">
            <Plus className="w-6 h-6" />
          </RemoteControlButton>
        </div>
      </RemoteControlSection>

      <RemoteControlSection title="Font Size">
          <div className="flex items-center justify-center space-x-2">
              <RemoteControlButton onClick={decreaseFontSize} aria-label="Decrease font size">
                  <Minus className="w-6 h-6" />
              </RemoteControlButton>
              <RemoteControlSlider
                  value={[fontSize]}
                  onValueChange={([value]) => setFontSize(value)}
                  min={12}
                  max={120}
                  step={4}
                />
              <RemoteControlButton onClick={increaseFontSize} aria-label="Increase font size">
                  <Plus className="w-6 h-6" />
              </RemoteControlButton>
          </div>
      </RemoteControlSection>

      <RemoteControlSection title="Mirror">
        <div className="flex items-center justify-center">
          <RemoteControlButton onClick={toggleMirror} aria-label="Toggle mirror mode">
            <FlipHorizontal className="w-6 h-6" />
          </RemoteControlButton>
        </div>
      </RemoteControlSection>
    </div>
  );
};
