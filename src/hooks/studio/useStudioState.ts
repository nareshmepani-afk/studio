'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const [state, setState] = useState<StudioState>({
    isScrolling: false,
    scrollSpeed: 1,
    fontSize: 48,
    isMirrored: false,
    script: 'Loading your script...',
    mode: 'solo',
    isConnected: false,
    isRecording: false,
  });

  const studioStateRef = doc(db, "studio", "default");

  // Listen for remote control changes
  useEffect(() => {
    const unsubscribe = onSnapshot(studioStateRef, 
      (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setState(prevState => ({
                ...prevState,
                ...data,
                isConnected: true,
            }));
        }
      },
      (error) => {
        console.error("Firebase connection error:", error);
        setState(prevState => ({ ...prevState, isConnected: false }));
      }
    );
    return () => unsubscribe();
  }, []);

  // Actions
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

// 6. Custom Hook
export const useStudioState = () => {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudioState must be used within a StudioProvider');
  }
  return context;
};
