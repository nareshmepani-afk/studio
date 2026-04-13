'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, onSnapshot, setDoc, DocumentReference } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { teleprompterScripts } from '@/lib/teleprompterScripts';

// 1. State Interface
interface StudioState {
  isScrolling: boolean;
  scrollSpeed: number;
  fontSize: number;
  isMirrored: boolean;
  script: string;
  mode: 'solo' | 'director';
  isConnected: boolean;
  isRecording: boolean;
  sessionId: string;
}

// 2. Actions Interface
interface StudioActions {
  toggleScrolling: () => void;
  setScrollSpeed: (speed: number) => void;
  increaseSpeed: () => void;
  decreaseSpeed: () => void;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleMirror: () => void;
  setScript: (script: string) => void;
  setMode: (mode: 'solo' | 'director') => void;
  toggleRecording: () => void;
}

// 3. Context Shape
type StudioContextType = StudioState & { actions: StudioActions };

// 4. Create Context
const StudioContext = createContext<StudioContextType | undefined>(undefined);

// 5. Provider Component
export const StudioProvider = ({ children, initialState }: { children: ReactNode, initialState?: Partial<StudioState> }) => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || 'default';

  const [state, setState] = useState<StudioState>({
    isScrolling: false,
    scrollSpeed: 1,
    fontSize: 48,
    isMirrored: false,
    script: 'Loading your script...',
    mode: 'solo',
    isConnected: !!initialState, // We are connected if we have an initial state from the server
    isRecording: false,
    sessionId: sessionId,
    ...(initialState || {}),
  });

  // 2. Persistent Reference: Memoize the document reference to prevent redundant effect cycles
  const studioStateRef = useMemo(() => {
    if (!sessionId || sessionId === 'default') return null;
    return doc(db, "studio", sessionId);
  }, [sessionId]);

  const isSyncingFromFirestore = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load script from URL (No changes needed here)
  useEffect(() => {
    const promptId = searchParams.get('promptId');
    if (promptId) {
      const selectedScript = teleprompterScripts[promptId];
      if (selectedScript) {
        setState(s => ({ ...s, script: selectedScript }));
      } else {
        setState(s => ({ ...s, script: 'Prompt not found.' }));
      }
    } else if (!initialState?.script) { // Only set default if no script came from server
      setState(s => ({ ...s, script: 'Select a prompt to begin, or start typing.' }));
    }
  }, [searchParams, initialState]);

  const lastRemoteJSON = useRef<string>('');

  // The Listener for real-time updates
  useEffect(() => {
    if (!studioStateRef) return;

    const unsubscribe = onSnapshot(studioStateRef,
      (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const { script, ...remoteState } = data;
            const remoteStateJSON = JSON.stringify(remoteState);

            // GUARD: Only update if the remote state actually changed
            if (remoteStateJSON === lastRemoteJSON.current) return;

            lastRemoteJSON.current = remoteStateJSON;
            isSyncingFromFirestore.current = true;

            setState(prevState => ({
                ...prevState,
                ...remoteState,
                isConnected: true,
            }));
        }
      },
      (error) => {
        console.error(`Firebase connection error on session [${sessionId}]:`, error);
        setState(prevState => ({ ...prevState, isConnected: false }));
      }
    );
    return () => unsubscribe();
  }, [studioStateRef, sessionId]);

  // The Emitter (Force silence if no meaningful local change occurred)
  useEffect(() => {
    if (isSyncingFromFirestore.current === true) {
        isSyncingFromFirestore.current = false;
        return;
    }
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const { isConnected, sessionId, script, ...syncState } = state;
      const syncStateJSON = JSON.stringify(syncState);

      // GUARD: Only setDoc if the local state has diverged from the last known remote state
      if (syncStateJSON === lastRemoteJSON.current) return;

      setDoc(studioStateRef, syncState, { merge: true });
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [state, studioStateRef]);


  // The Actions (No changes needed)
  const actions: StudioActions = {
    toggleScrolling: () => setState(s => ({ ...s, isScrolling: !s.isScrolling })),
    setScrollSpeed: (speed) => setState(s => ({ ...s, scrollSpeed: speed })),
    increaseSpeed: () => setState(s => ({ ...s, scrollSpeed: s.scrollSpeed + 0.5 })),
    decreaseSpeed: () => setState(s => ({ ...s, scrollSpeed: Math.max(0.5, s.scrollSpeed - 0.5) })),
    setFontSize: (size) => setState(s => ({ ...s, fontSize: size })),
    increaseFontSize: () => setState(s => ({ ...s, fontSize: s.fontSize + 4 })),
    decreaseFontSize: () => setState(s => ({ ...s, fontSize: Math.max(12, s.fontSize - 4) })),
    toggleMirror: () => setState(s => ({ ...s, isMirrored: !s.isMirrored })),
    setScript: (script) => setState(s => ({ ...s, script })), // Local only
    setMode: (mode) => setState(s => ({ ...s, mode })),
    toggleRecording: () => setState(s => ({ ...s, isRecording: !s.isRecording })),
  };

  return (
    <StudioContext.Provider value={{ ...state, actions }}>
      {children}
    </StudioContext.Provider>
  );
};

// 6. Custom Hook (No changes needed)
export const useStudioState = () => {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudioState must be used within a StudioProvider');
  }
  return context;
};
