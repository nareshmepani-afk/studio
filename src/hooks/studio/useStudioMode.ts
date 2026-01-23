import { useState, useCallback } from 'react';

export type JourneyMode = 'solo' | 'interview';

export function useStudioMode(initialMode: JourneyMode = 'solo') {
  const [currentMode, setCurrentMode] = useState<JourneyMode>(initialMode);

  const handleModeChange = useCallback((mode: JourneyMode) => {
    setCurrentMode(mode);
  }, []);

  return { currentMode, onModeChange: handleModeChange };
}
