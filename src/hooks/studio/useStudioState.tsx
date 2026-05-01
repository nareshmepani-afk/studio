'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useRef, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, onSnapshot, setDoc, DocumentReference } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { storyScripts } from '@/lib/storyScripts';
import { CatalystType } from '@/types';
import { DetectedAnchor } from './useDirectorInk';

export type DrawerType = 'sensory' | 'poster' | 'timeline' | null;

// 1. State Interface
interface StudioState {
  isScrolling: boolean;
  scrollSpeed: number;
  fontSize: number;
  isMirrored: boolean;
  script: string;
  mode: 'solo' | 'director' | 'guest_director' | 'guest';
  isConnected: boolean;
  isRecording: boolean;
  sessionId: string;
  isDrafting: boolean;
  detectedAnchors: DetectedAnchor[];
  activeAnchorTypes: CatalystType[];
  directorialNote: string | null;
  activeDrawer: DrawerType;
  draggingCatalyst: CatalystType | null;
  overloadedBlockIds: string[];
  pendingAnchor: { text: string; type: CatalystType } | null;
  lastDetectedAnchor: { text: string; type: CatalystType; timestamp: number } | null;
  appliedCatalystTypes: CatalystType[];
  dispatcher?: {
    addCatalyst?: (blockId: string, type: CatalystType, value?: string) => { collisionDetected: boolean };
  };
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
  setMode: (mode: 'solo' | 'director' | 'guest_director' | 'guest') => void;
  toggleRecording: () => void;
  setDrafting: (isDrafting: boolean) => void;
  setDetectedAnchors: (anchors: DetectedAnchor[]) => void;
  setActiveAnchorTypes: (types: CatalystType[]) => void;
  setDirectorialNote: (note: string | null) => void;
  setActiveDrawer: (drawer: DrawerType) => void;
  setOverloadedBlocks: (ids: string[]) => void;
  primeCatalyst: (text: string, type: CatalystType) => void;
  triggerSynapse: (text: string, type: CatalystType) => void;
  clearPendingAnchor: () => void;
  setDispatcher: (dispatcher: StudioState['dispatcher']) => void;
  setDraggingCatalyst: (type: CatalystType | null | 'polish') => void;
  setAppliedCatalysts: (types: CatalystType[]) => void;
}

// 3. Context Shape
type StudioContextType = StudioState & { actions: StudioActions };

// 4. Create Context
const StudioContext = createContext<StudioContextType | undefined>(undefined);

// 5. URL Sync Component to isolate Suspense
function URLStateSync({ 
  onSync 
}: { 
  onSync: (sessionId: string, mode: 'solo' | 'director' | 'guest_director' | 'guest', promptId: string | null) => void 
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const sessionId = searchParams.get('sessionId') || 'default';
    const urlMode = searchParams.get('mode') as 'solo' | 'director' | 'guest_director' | 'guest';
    const promptId = searchParams.get('promptId');
    const finalMode = (urlMode === 'solo' || urlMode === 'director' || urlMode === 'guest_director' || urlMode === 'guest') ? urlMode : 'solo';
    onSync(sessionId, finalMode, promptId);
  }, [searchParams, onSync]);

  return null;
}

// 6. Provider Component
export const StudioProvider = ({ children, initialState }: { children: ReactNode, initialState?: Partial<StudioState> }) => {
  const [state, setState] = useState<StudioState>({
    isScrolling: false,
    scrollSpeed: 1,
    fontSize: 48,
    isMirrored: false,
    script: 'Loading your script...',
    mode: 'solo',
    isConnected: !!initialState, 
    isRecording: false,
    sessionId: 'default',
    isDrafting: false,
    detectedAnchors: [],
    activeAnchorTypes: [],
    directorialNote: null,
    activeDrawer: null,
    draggingCatalyst: null,
    overloadedBlockIds: [],
    pendingAnchor: null,
    lastDetectedAnchor: null,
    appliedCatalystTypes: [],
    dispatcher: undefined,
    ...(initialState || {}),
  });

  const [urlPromptId, setUrlPromptId] = useState<string | null>(null);

  const handleURLSync = useCallback((sessionId: string, mode: 'solo' | 'director' | 'guest_director' | 'guest', promptId: string | null) => {
    setState(prev => {
      if (prev.sessionId === sessionId && prev.mode === mode) return prev;
      return { ...prev, sessionId, mode };
    });
    setUrlPromptId(promptId);
  }, []);

  // 2. Persistent Reference: Memoize the document reference to prevent redundant effect cycles
  const studioStateRef = useMemo(() => {
    if (!state.sessionId || state.sessionId === 'default') return null;
    return doc(db, "studio", state.sessionId);
  }, [state.sessionId]);

  const isSyncingFromFirestore = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load script from URL
  useEffect(() => {
    if (urlPromptId) {
      const selectedScript = storyScripts[urlPromptId];
      if (selectedScript) {
        setState(s => ({ ...s, script: selectedScript }));
      } else {
        setState(s => ({ ...s, script: 'Prompt not found.' }));
      }
    } else if (!initialState?.script) { // Only set default if no script came from server
      setState(s => ({ ...s, script: 'Select a prompt to begin, or start typing.' }));
    }
  }, [urlPromptId, initialState]);

  const lastRemoteJSON = useRef<string>('');

  // The Listener for real-time updates
  useEffect(() => {
    // GUARD: If we are in any Guest mode, we DO NOT sync with Firestore 
    // because guests do not have write permissions to the 'studio' collection.
    // They will communicate via PeerJS P2P instead.
    const isGuest = state.mode === 'guest' || state.mode === 'guest_director';
    if (!studioStateRef || isGuest) return;

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
        console.error(`Firebase connection error on session [${state.sessionId}]:`, error);
        setState(prevState => ({ ...prevState, isConnected: false }));
      }
    );
    return () => unsubscribe();
  }, [studioStateRef, state.sessionId]);

  // The Emitter (Force silence if no meaningful local change occurred)
  useEffect(() => {
    if (isSyncingFromFirestore.current === true) {
        isSyncingFromFirestore.current = false;
        return;
    }

    // GUARD: Disable background sync for Guests to avoid Permission Denied crashes.
    const isGuest = state.mode === 'guest' || state.mode === 'guest_director';
    if (isGuest) return;
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const { isConnected, sessionId, script, dispatcher, isDrafting, detectedAnchors, ...syncState } = state;
      const syncStateJSON = JSON.stringify(syncState);

      // GUARD: Only setDoc if the local state has diverged from the last known remote state
      if (syncStateJSON === lastRemoteJSON.current) return;

      if (!studioStateRef) return;
      setDoc(studioStateRef, syncState, { merge: true });
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [state, studioStateRef]);


  const actions: StudioActions = useMemo(() => ({
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
    setDrafting: (isDrafting) => setState(s => ({ ...s, isDrafting })),
    setDetectedAnchors: (anchors) => setState(s => {
      if (JSON.stringify(s.detectedAnchors) === JSON.stringify(anchors)) {
        return s;
      }
      return { ...s, detectedAnchors: anchors };
    }),
    setActiveAnchorTypes: (types) => setState(s => {
      if (JSON.stringify(s.activeAnchorTypes) === JSON.stringify(types)) return s;
      return { ...s, activeAnchorTypes: types };
    }),
    setDirectorialNote: (note) => setState(s => {
      if (s.directorialNote === note) return s;
      return { ...s, directorialNote: note };
    }),
    setActiveDrawer: (drawer) => setState(s => {
      if (s.activeDrawer === drawer) return s;
      return { ...s, activeDrawer: drawer };
    }),
    setOverloadedBlocks: (ids) => setState(s => {
      if (JSON.stringify(s.overloadedBlockIds) === JSON.stringify(ids)) return s;
      return { ...s, overloadedBlockIds: ids };
    }),
    primeCatalyst: (text, type) => setState(s => ({ 
      ...s, 
      isDrafting: false, 
      activeDrawer: 'sensory', 
      pendingAnchor: { text, type } 
    })),
    triggerSynapse: (text, type) => setState(s => ({
      ...s,
      lastDetectedAnchor: { text, type, timestamp: Date.now() }
    })),
    clearPendingAnchor: () => setState(s => ({ ...s, pendingAnchor: null })),
    setDispatcher: (dispatcher) => setState(s => {
      if (s.dispatcher === dispatcher) return s;
      return { ...s, dispatcher };
    }),
    setDraggingCatalyst: (type) => setState(s => {
      if (s.draggingCatalyst === type) return s;
      return { ...s, draggingCatalyst: type };
    }),
    setAppliedCatalysts: (types) => setState(s => {
      if (JSON.stringify(s.appliedCatalystTypes) === JSON.stringify(types)) return s;
      return { ...s, appliedCatalystTypes: types };
    }),
  }), []);

  return (
    <StudioContext.Provider value={{ ...state, actions }}>
      <Suspense fallback={null}>
        <URLStateSync onSync={handleURLSync} />
      </Suspense>
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
