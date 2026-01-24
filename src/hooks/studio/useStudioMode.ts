import { useState, useCallback } from 'react';

export type JourneyMode = 'SOLO' | 'INTERVIEW';

export function useStudioMode(initialMode: JourneyMode = 'SOLO') {
  const [studioMode, setStudioMode] = useState<JourneyMode>(initialMode);

  const toggleStudioMode = useCallback(() => {
    setStudioMode(prev => prev === 'SOLO' ? 'INTERVIEW' : 'SOLO');
  }, []);

  return { studioMode, toggleStudioMode };
}
