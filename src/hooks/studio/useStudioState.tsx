'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, onSnapshot, setDoc, DocumentReference } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { teleprompterScripts } from '@/lib/teleprompterScripts';

// 1. State Interface (Add sessionId)
interface StudioState {
  isScrolling: boolean;
  scrollSpeed: number;
  fontSize: number;
  isMirrored: boolean;
  script: string;
  mode: 'solo' | 'director';
  isConnected: boolean;
  isRecording: boolean;
  sessionId: string; // <-- WITNESS: Expose the session ID
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
export const StudioProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  // STRATEGIC FIX: Use sessionId from URL, or fallback to 'default'
  const sessionId = searchParams.get('sessionId') || 'default';

  const [state, setState] = useState<StudioState>({
    isScrolling: false,
    scrollSpeed: 1,
    fontSize: 48,
    isMirrored: false,
    script: 'Loading your script...',
    mode: 'solo',
    isConnected: false,
    isRecording: false,
    sessionId: sessionId, // <-- WITNESS: Initialize state with the session ID
  });

  // STRATEGIC FIX: Create a dynamic reference to the Firestore document
  const studioStateRef: DocumentReference = doc(db, "studio", sessionId);

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
    } else {
      setState(s => ({ ...s, script: 'Select a prompt to begin, or start typing.' }));
    }
  }, [searchParams]);

  // Listen for remote control changes
  useEffect(() => {
    const unsubscribe = onSnapshot(studioStateRef,
      (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const { script, ...remoteState } = data;
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
  }, [studioStateRef, sessionId]); // <-- STRATEGIC FIX: Re-subscribe if the reference changes

  // Actions (These will now correctly use the dynamic studioStateRef)
  const actions: StudioActions = {
    toggleScrolling: () => {
        const newIsScrolling = !state.isScrolling
        setState(s => ({ ...s, isScrolling: newIsScrolling }));
        setDoc(studioStateRef, { isScrolling: newIsScrolling }, { merge: true });
    },
    setScrollSpeed: (speed) => {
        setState(s => ({ ...s, scrollSpeed: speed }));
        setDoc(studioStateRef, { scrollSpeed: speed }, { merge: true });
    },
    increaseSpeed: () => actions.setScrollSpeed(state.scrollSpeed + 0.5),
    decreaseSpeed: () => actions.setScrollSpeed(Math.max(0.5, state.scrollSpeed - 0.5)),
    setFontSize: (size) => {
        setState(s => ({ ...s, fontSize: size }));
        setDoc(studioStateRef, { fontSize: size }, { merge: true });
    },
    increaseFontSize: () => actions.setFontSize(state.fontSize + 4),
    decreaseFontSize: () => actions.setFontSize(Math.max(12, state.fontSize - 4)),
    toggleMirror: () => {
        const newIsMirrored = !state.isMirrored;
        setState(s => ({ ...s, isMirrored: newIsMirrored }));
        setDoc(studioStateRef, { isMirrored: newIsMirrored }, { merge: true });
    },
    setScript: (script) => setState(s => ({ ...s, script })),
    setMode: (mode) => {
        setState(s => ({ ...s, mode }));
        setDoc(studioStateRef, { mode }, { merge: true });
    },
    toggleRecording: () => {
        const newIsRecording = !state.isRecording;
        setState(s => ({ ...s, isRecording: newIsRecording }));
        setDoc(studioStateRef, { isRecording: newIsRecording }, { merge: true });
    },
  };

  return (
    <StudioContext.Provider value={{ ...state, actions }}>
      {children}
    </StudioContext.Provider>
  );
};

// 6. Custom Hook (No changes needed here)
export const useStudioState = () => {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudioState must be used within a StudioProvider');
  }
  return context;
};
