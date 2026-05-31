import { useState, useCallback } from 'react';

export interface LayoutSnapshot {
  layout: 'side' | 'center';
  size: 'mini' | 'sm' | 'md' | 'lg';
  fontSize: number;
}

export const useTableRead = () => {
  const [isTableReadActive, setIsTableReadActive] = useState(false);
  const [snapshot, setSnapshot] = useState<LayoutSnapshot | null>(null);
  
  // Rehearsal-specific speed pacing (independent of main production auto-scroll speed)
  const [rehearsalSpeed, setRehearsalSpeed] = useState<number>(1.5); 

  const captureLayoutSnapshot = useCallback((
    layout: 'side' | 'center',
    size: 'mini' | 'sm' | 'md' | 'lg',
    fontSize: number
  ) => {
    console.log("[useTableRead] Capturing pre-rehearsal layout snapshot:", { layout, size, fontSize });
    setSnapshot({ layout, size, fontSize });
  }, []);

  const restoreLayoutSnapshot = useCallback(() => {
    if (snapshot) {
      console.log("[useTableRead] Restoring pre-rehearsal layout snapshot:", snapshot);
      return snapshot;
    }
    return null;
  }, [snapshot]);

  return {
    isTableReadActive,
    setIsTableReadActive,
    snapshot,
    setSnapshot,
    rehearsalSpeed,
    setRehearsalSpeed,
    captureLayoutSnapshot,
    restoreLayoutSnapshot
  };
};
