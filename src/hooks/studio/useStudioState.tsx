'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useRef, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { doc, onSnapshot, setDoc, DocumentReference } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { storyScripts } from '@/lib/storyScripts';
import { CatalystType, TimeframeScope } from '@/types';
import { DetectedAnchor } from './useDirectorInk';
import { StudioMentorProvider, useStudioMentor } from '@/context/StudioMentorContext';

export type DrawerType = 'sensory' | 'poster' | 'timeline' | 'architect' | null;

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
  lastDetectedAnchor: { text: string; type: CatalystType; timestamp: number; xOffset?: number } | null;
  appliedCatalystTypes: CatalystType[];
  isReviewing: boolean;
  isGeneratingDrafts: boolean;
  selectedVision: {
    type: 'soul' | 'sensory' | 'cinematic' | null;
    label: string | null;
  };
  reviewDrafts: Array<{ 
    visionType: string; 
    focus: string; 
    cleanScript: string; 
    stageDirections: Array<{ type: 'visual' | 'audio' | 'beat', content: string, timecode: string }>;
    beatSheet: string[];
  }> | null;
  polishedOriginalHook: string | null;
  modality: 'pen' | 'voice' | null;
  captureModality: 'scripted' | 'interview' | 'raw';
  currentStage: number;
  isDirectorOpen: boolean;
  isProductionLocked: boolean;
  synthesisError: string | null;
  timeframeScope: TimeframeScope;
  durationQuantity: number;
  durationUnit: 'days' | 'months' | 'years';
  narratorAgeAtTime: number;
  selectedTake: string | null;
  dispatcher?: {
    addCatalyst?: (blockId: string, type: CatalystType, value?: string) => { collisionDetected: boolean };
  };
}

// 2. Actions Interface
interface StudioActions {
  toggleScrolling: () => void;
  setScrolling: (val: boolean) => void;
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
  triggerSynapse: (text: string, type: CatalystType, xOffset?: number) => void;
  clearPendingAnchor: () => void;
  setDispatcher: (dispatcher: StudioState['dispatcher']) => void;
  setDraggingCatalyst: (type: CatalystType | null | 'polish') => void;
  setAppliedCatalysts: (types: CatalystType[]) => void;
  setIsReviewing: (val: boolean) => void;
  setReviewDrafts: (drafts: any[] | null | ((prev: any[] | null) => any[] | null)) => void;
  setPolishedOriginalHook: (hook: string | null) => void;
  setIsGeneratingDrafts: (val: boolean) => void;
  setSelectedVision: (type: 'soul' | 'sensory' | 'cinematic' | null, label: string | null) => void;
  setModality: (mod: 'pen' | 'voice' | null) => void;
  setCaptureModality: (mode: 'scripted' | 'interview' | 'raw') => void;
  setStage: (stage: number) => void;
  setIsDirectorOpen: (open: boolean) => void;
  setIsProductionLocked: (locked: boolean) => void;
  setSynthesisError: (error: string | null) => void;
  setTimeframeScope: (scope: TimeframeScope) => void;
  setDurationQuantity: (qty: number) => void;
  setDurationUnit: (unit: 'days' | 'months' | 'years') => void;
  setNarratorAgeAtTime: (age: number) => void;
  setSelectedTake: (take: string | null) => void;
}

// 3. Context Shape
type StudioContextType = StudioState & { actions: StudioActions };

// 4. Create Context
const StudioContext = createContext<StudioContextType | undefined>(undefined);

// 5. URL Sync Component to isolate Suspense
function URLStateSync({ 
  onSync 
}: { 
  onSync: (sessionId: string, mode: 'solo' | 'director' | 'guest_director' | 'guest', promptId: string | null, act?: number, modality?: 'pen' | 'voice' | null, isDirectorOpen?: boolean) => void 
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const sessionId = searchParams.get('sessionId') || 'default';
    const urlMode = searchParams.get('mode') as 'solo' | 'director' | 'guest_director' | 'guest';
    const promptId = searchParams.get('promptId');
    const finalMode = (urlMode === 'solo' || urlMode === 'director' || urlMode === 'guest_director' || urlMode === 'guest') ? urlMode : 'solo';
    
    // Act parsing
    const actParam = searchParams.get('act');
    const ACT_MAP = ['hook', 'weave', 'capture', 'cut', 'premiere'];
    const actIndex = actParam ? ACT_MAP.indexOf(actParam) : -1;

    // Modality parsing
    const modParam = searchParams.get('modality');
    const modality = modParam === 'scribe' ? 'pen' : (modParam === 'vocal' ? 'voice' : undefined);

    // Director parsing
    const directorParam = searchParams.get('director');
    const isDirectorOpen = directorParam === 'true';

    onSync(
      sessionId, 
      finalMode, 
      promptId, 
      actIndex === -1 ? undefined : actIndex, 
      modality as any, 
      isDirectorOpen
    );
  }, [searchParams, onSync]);

  return null;
}

// 6. Provider Component
export const StudioProvider = ({ children, initialState }: { children: ReactNode, initialState?: Partial<StudioState> }) => {
  const [state, setState] = useState<StudioState>({
    isScrolling: false,
    scrollSpeed: 1,
    fontSize: 24,
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
    isReviewing: false,
    isGeneratingDrafts: false,
    reviewDrafts: [],
    selectedVision: { type: null, label: null },
    modality: null,
    captureModality: 'scripted',
    currentStage: 0,
    isDirectorOpen: false,
    isProductionLocked: false,
    synthesisError: null,
    polishedOriginalHook: null,
    timeframeScope: 'Year',
    durationQuantity: 1,
    durationUnit: 'years',
    narratorAgeAtTime: 25,
    selectedTake: null,
    dispatcher: undefined,
    ...(initialState || {}),
  });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

    // Bidirectional URL Sync: Local State -> URL
    const lastSyncedState = useRef<string>('');
    const isInternalSync = useRef(false);

    useEffect(() => {
        if (!state.sessionId || state.sessionId === 'default') return;

        // 1. Generate desired params based on current state
        const targetParams = new URLSearchParams(searchParams.toString());
        const ACT_MAP = ['hook', 'weave', 'capture', 'cut', 'premiere'];
        
        // Act Sync
        const newActQuery = ACT_MAP[state.currentStage] || 'hook';
        targetParams.set('act', newActQuery);

        // Modality Sync
        const newModQuery = state.modality === 'pen' ? 'scribe' : (state.modality === 'voice' ? 'vocal' : null);
        if (newModQuery) {
            targetParams.set('modality', newModQuery);
        } else {
            targetParams.delete('modality');
        }

        // Director Sync
        if (state.isDirectorOpen) {
            targetParams.set('director', 'true');
        } else {
            targetParams.delete('director');
        }

        // 2. STABLE COMPARISON: Sort and compare to prevent order-flip loops
        targetParams.sort();
        const targetString = targetParams.toString();

        if (targetString !== lastSyncedState.current) {
            lastSyncedState.current = targetString;
            const newUrl = `${pathname}?${targetString}`;
            
            // Only replace if the URL actually differs from current browser state
            const currentParams = new URLSearchParams(searchParams.toString());
            currentParams.sort();
            
            if (targetString !== currentParams.toString()) {
                console.log("[useStudioState] URL Syncing to:", newUrl);
                isInternalSync.current = true;
                router.replace(newUrl, { scroll: false });
                // Reset the guard after a tick to allow legitimate external changes
                setTimeout(() => { isInternalSync.current = false; }, 100);
            }
        }
    }, [state.currentStage, state.modality, state.isDirectorOpen, pathname, router, searchParams]);

    const [urlPromptId, setUrlPromptId] = useState<string | null>(null);

    const handleURLSync = useCallback((sessionId: string, mode: 'solo' | 'director' | 'guest_director' | 'guest', promptId: string | null, act?: number, modality?: 'pen' | 'voice' | null, isDirectorOpen?: boolean) => {
        if (isInternalSync.current) {
            console.log("[useStudioState] handleURLSync blocked by internal sync guard");
            return;
        }

        setState(prev => {
            const updates: Partial<StudioState> = {};
            if (prev.sessionId !== sessionId) updates.sessionId = sessionId;
            if (prev.mode !== mode) updates.mode = mode;
            if (act !== undefined && prev.currentStage !== act) updates.currentStage = act;
            if (modality !== undefined && prev.modality !== modality) updates.modality = modality;
            if (isDirectorOpen !== undefined && prev.isDirectorOpen !== isDirectorOpen) updates.isDirectorOpen = isDirectorOpen;
            // Handle explicit false (param removed)
            if (isDirectorOpen === false && prev.isDirectorOpen === true) updates.isDirectorOpen = false;

            if (Object.keys(updates).length === 0) return prev;
            console.log("[useStudioState] Applying external URL sync:", updates);
            return { ...prev, ...updates };
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

  const setDurationUnit = (unit: 'days' | 'months' | 'years') => setState(prev => ({ ...prev, durationUnit: unit }));
  const setNarratorAgeAtTime = (age: number) => {
    setState(prev => ({ ...prev, narratorAgeAtTime: age }));
  };

  const actions: StudioActions = useMemo(() => ({
    toggleScrolling: () => setState(s => ({ ...s, isScrolling: !s.isScrolling })),
    setScrolling: (val) => setState(s => ({ ...s, isScrolling: val })),
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
    triggerSynapse: (text, type, xOffset) => setState(s => ({
      ...s,
      lastDetectedAnchor: { text, type, timestamp: Date.now(), xOffset }
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
    setIsReviewing: (val) => setState(s => ({ ...s, isReviewing: val })),
    setReviewDrafts: (drafts) => setState(s => ({ 
      ...s, 
      reviewDrafts: typeof drafts === 'function' ? drafts(s.reviewDrafts) : drafts 
    })),
    setPolishedOriginalHook: (hook) => setState(s => ({ ...s, polishedOriginalHook: hook })),
    setIsGeneratingDrafts: (val) => setState(s => ({ ...s, isGeneratingDrafts: val })),
    setSelectedVision: (type, label) => setState(s => ({ ...s, selectedVision: { type, label } })),
    setModality: (mod) => setState(s => ({ ...s, modality: mod })),
    setCaptureModality: (mode) => setState(s => ({ ...s, captureModality: mode })),
    setStage: (stage) => {
      console.log(`[useStudioState] globalActions.setStage triggered: ${stage}`);
      setState(s => ({ ...s, currentStage: stage }));
    },
    setIsDirectorOpen: (open) => setState(s => ({ ...s, isDirectorOpen: open })),
    setIsProductionLocked: (locked) => setState(s => ({ ...s, isProductionLocked: locked })),
    setSynthesisError: (error) => setState(s => ({ ...s, synthesisError: error })),
    setTimeframeScope: (scope) => setState(s => ({ ...s, timeframeScope: scope })),
    setDurationQuantity: (qty) => setState(s => ({ ...s, durationQuantity: qty })),
    setDurationUnit,
    setNarratorAgeAtTime,
    setSelectedTake: (take) => setState(s => ({ ...s, selectedTake: take })),
  }), []);

  return (
    <StudioContext.Provider value={{ ...state, actions }}>
      <StudioMentorProvider>
        <Suspense fallback={null}>
          <URLStateSync onSync={handleURLSync} />
        </Suspense>
        {children}
      </StudioMentorProvider>
    </StudioContext.Provider>
  );
};

// 6. Custom Hook (Exposes mentorContext helper)
export const useStudioState = () => {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudioState must be used within a StudioProvider');
  }

  const mentorContext = useStudioMentor();

  return {
    ...context,
    mentorContext
  };
};
