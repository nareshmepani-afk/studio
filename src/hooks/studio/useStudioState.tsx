'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, onSnapshot, setDoc, DocumentReference } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { teleprompterScripts } from '@/lib/teleprompterScripts';

// 1. State Interface (No changes needed)
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

// 2. Actions Interface (No changes needed)
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

// 3. Context Shape (No changes needed)
type StudioContextType = StudioState & { actions: StudioActions };

// 4. Create Context (No changes needed)
const StudioContext = createContext<StudioContextType | undefined>(undefined);

// 5. Provider Component (This is where the magic happens)
export const StudioProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
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
    sessionId: sessionId,
  });

  const studioStateRef: DocumentReference = doc(db, "studio", sessionId);

  // STORM FIX PART 1: A "Sync Guard" ref.
  // This ref helps us distinguish between a user's local action and a remote update from Firestore.
  const isSyncingFromFirestore = useRef(false);

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

  // STORM FIX PART 2: The Listener
  // This effect listens for remote changes from Firestore.
  useEffect(() => {
    const unsubscribe = onSnapshot(studioStateRef,
      (doc) => {
        if (doc.exists()) {
            const remoteState = doc.data();

            // Set the guard flag to true BEFORE updating the state.
            // This tells our other effect, "Don't sync this change back to Firestore!"
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

  // STORM FIX PART 3: The Emitter
  // This effect syncs local changes TO Firestore.
  useEffect(() => {
    // This is our "Sync Guard" in action.
    // If the flag is true, the state change came FROM Firestore.
    // We reset the flag for the next local change and exit early to prevent an infinite loop.
    if (isSyncingFromFirestore.current === true) {
        isSyncingFromFirestore.current = false;
        return;
    }
    
    // If the flag was false, the change was made by the local user.
    // We sync the relevant parts of the state to Firestore.
    const { isConnected, sessionId, script, ...syncState } = state;
    setDoc(studioStateRef, syncState, { merge: true });

  }, [state, studioStateRef]); // This effect runs whenever the local state changes.


  // STORM FIX PART 4: The Actions
  // Actions now ONLY modify the local state. The Emitter effect above will handle syncing.
  const actions: StudioActions = {
    toggleScrolling: () => setState(s => ({ ...s, isScrolling: !s.isScrolling })),
    setScrollSpeed: (speed) => setState(s => ({ ...s, scrollSpeed: speed })),
    increaseSpeed: () => setState(s => ({ ...s, scrollSpeed: s.scrollSpeed + 0.5 })),
    decreaseSpeed: () => setState(s => ({ ...s, scrollSpeed: Math.max(0.5, s.scrollSpeed - 0.5) })),
    setFontSize: (size) => setState(s => ({ ...s, fontSize: size })),
    increaseFontSize: () => setState(s => ({ ...s, fontSize: s.fontSize + 4 })),
    decreaseFontSize: () => setState(s => ({ ...s, fontSize: Math.max(12, s.fontSize - 4) })),
    toggleMirror: () => setState(s => ({ ...s, isMirrored: !s.isMirrored })),
    setScript: (script) => setState(s => ({ ...s, script })), // Local only, no sync needed
    setMode: (mode) => setState(s => ({ ...s, mode })),
    toggleRecording: () => setState(s => ({ ...s, isRecording: !s.isRecording })),
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
