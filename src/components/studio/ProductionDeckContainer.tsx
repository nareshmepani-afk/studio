'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useStudioData } from '@/hooks/studio/useStudioData';
import { storyScripts } from '@/lib/storyScripts';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductionDeck from './ProductionDeck';
import { Loader2, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { resolveTemplateFixtureAsync } from '@/utils/templateResolver';
import { MobilePortalOverlay } from './overlays/MobilePortalOverlay';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductionDeckContainerProps {
  promptId: string;
  isModal?: boolean;
}

export function ProductionDeckContainer({ promptId, isModal = false }: ProductionDeckContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { chapters, memories, isLoading: studioLoading } = useStudioData(user?.uid || 'guest');
  const pathname = usePathname();
  
  // THE INVISIBLE DISMISSAL: If we are in modal mode but navigated away from production, 
  // we must return null to ensure the "layering" doesn't block the dashboard.
  const isProductionRoute = pathname?.includes('/production/');

  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isRemoteLens = searchParams.get('room') === 'solo' || searchParams.get('mode') === 'remote-lens';
  
  // Smart Viewport & Foldable Device Detection:
  // Standard portrait phones have narrow aspect ratios (< 0.85) and width < 768px.
  // Unfolded foldables (e.g., Z Fold) have width >= 600px and near-square/landscape aspect ratios (>= 0.85).
  const isFoldableOrTabletCanvas = windowWidth !== null && windowWidth >= 600 && typeof window !== 'undefined' && (window.innerWidth / (window.innerHeight || 1)) >= 0.85;
  const showMobileGuard = windowWidth !== null && windowWidth < 768 && !isFoldableOrTabletCanvas && !isRemoteLens;
  
  const [selectedProductionData, setSelectedProductionData] = useState<any>(null);
  const [resolvedAsyncTemplate, setResolvedAsyncTemplate] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  
  // To avoid circular layout state, we just keep it simple. If it's modal, we use takeover.
  // We can still support the drawer mode if needed, but takeover is the default.
  const [layoutMode, setLayoutMode] = useState<'takeover' | 'drawer'>('takeover');

  const lastLoadedId = useRef<string | null>(null);
  const lastLocalUpdateRef = useRef<number>(0);
  const deckRef = useRef<any>(null);
  // Track the previous authenticated UID so we only clear rehydration state on
  // a genuine user-switch (login/logout), not on same-user Firebase token refreshes.
  // Firebase re-validates the auth token during browser events such as the system
  // print dialog closing (Chrome tab suspension/resume), emitting a new User object
  // with the identical UID — which previously caused a spurious full state reset.
  const prevUidRef = useRef<string | null | undefined>(undefined);

  // Reset container state when the authenticated user GENUINELY changes (login/logout).
  // Guards against two false-positive triggers:
  //   1. Same-user Firebase token refresh: Firebase emits a new User object with the
  //      same UID during Chrome tab resume events (e.g. after the system print dialog
  //      closes). The UID string is identical — no state reset needed.
  //   2. Active print session: window.__mwPrintGuard is set by autobiographyExporter
  //      while the print dialog is open. Auth token re-validation during this window
  //      must never clear loaded memory state or reset the studio stage.
  useEffect(() => {
    const currentUid = user?.uid ?? null;

    // Skip if this is the very first mount evaluation (prevUid === undefined)
    if (prevUidRef.current === undefined) {
      prevUidRef.current = currentUid;
      return;
    }

    // Skip if the UID string has not actually changed (same-user token refresh)
    if (prevUidRef.current === currentUid) {
      return;
    }

    // Skip if a print operation is actively in progress
    if (typeof window !== 'undefined' && (window as any).__mwPrintGuard === true) {
      console.log('[ProductionDeckContainer] Auth event suppressed: print guard is active.');
      prevUidRef.current = currentUid;
      return;
    }

    // Genuine user change — clear all cached state to prevent cross-login data leaks
    console.log('[ProductionDeckContainer] Auth user state changed. Clearing local rehydration guards...');
    prevUidRef.current = currentUid;
    lastLoadedId.current = null;
    setIsReady(false);
    setIsNotFound(false);
    setSelectedProductionData(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // 4-Second Timeout Safety Guard: Prevent hanging indefinitely on a black loading screen
  useEffect(() => {
    if (isReady) {
      setIsNotFound(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!isReady && !selectedProductionData) {
        console.warn(`[ProductionDeckContainer] Stage resolution timeout reached for ID "${promptId}". Displaying recovery shield.`);
        setIsNotFound(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [isReady, promptId, selectedProductionData]);

  // Direct Firestore Document Resolution:
  // If promptId is a document ID (e.g. ey96djU6qR1BrDGnvZwp), fetch the document directly from Firestore
  // on mount so direct URL navigation & parallel tabs load in <100ms without waiting for user collection queries.
  useEffect(() => {
    let active = true;

    async function resolveDirectDocument() {
      if (!promptId || isReady || (selectedProductionData?.id === promptId && isReady)) return;

      try {
        console.log(`[ProductionDeckContainer] Executing direct Firestore lookup for document ID "${promptId}"...`);
        let docSnap = await getDoc(doc(db, 'memories', promptId));

        if (!docSnap.exists() && user?.uid) {
          docSnap = await getDoc(doc(db, 'users', user.uid, 'memories', promptId));
        }

        if (active && docSnap.exists()) {
          const fetchedMemory = { id: docSnap.id, ...docSnap.data() };
          console.log(`[ProductionDeckContainer] Direct Firestore document lookup succeeded for "${promptId}". Title: "${(fetchedMemory as any).title}", Stage: ${(fetchedMemory as any).productionStage}`);
          setSelectedProductionData(fetchedMemory);
          setIsReady(true);
          setIsNotFound(false);
          lastLoadedId.current = promptId;
        }
      } catch (err) {
        console.warn("[ProductionDeckContainer] Direct document resolution warning:", err);
      }
    }

    resolveDirectDocument();

    return () => {
      active = false;
    };
  }, [promptId, isReady, selectedProductionData?.id, user?.uid]);

  // Scroll to top on modal exit/unmount to prevent Next.js layout shift clamping bugs
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      }
    };
  }, []);

  // Pre-load dynamic templates asynchronously on mount or ID transitions
  useEffect(() => {
    let active = true;
    async function loadTemplate() {
      const res = await resolveTemplateFixtureAsync(promptId);
      if (active) {
        setResolvedAsyncTemplate(res);
      }
    }
    loadTemplate();
    return () => {
      active = false;
    };
  }, [promptId]);

  useEffect(() => {
    if (studioLoading || authLoading || !chapters.length) return;

    const chapterPrompts = chapters.flatMap(c => c.prompts);
    const isTemplateId = chapterPrompts.some(p => p.id === promptId);

    // Resolve cp from template ID or dynamically matched memory ID
    let cp = chapterPrompts.find(p => p.id === promptId);
    if (cp) {
      cp = { ...cp };
    } else if (memories) {
      const matchedMemory = memories.find(m => m.id === promptId);
      if (matchedMemory) {
        // Trace backward: Follow the chain of memory promptIds recursively until we find a match in static templates
        let currentPromptId = matchedMemory.promptId;
        let template = chapterPrompts.find(p => p.id === currentPromptId);
        const visitedIds = new Set<string>([matchedMemory.id]);
        
        while (!template && currentPromptId && !visitedIds.has(currentPromptId)) {
          visitedIds.add(currentPromptId);
          const parentMemory = memories.find(m => m.id === currentPromptId);
          if (parentMemory) {
            currentPromptId = parentMemory.promptId;
            template = chapterPrompts.find(p => p.id === currentPromptId);
          } else {
            break;
          }
        }
        
        if (template) {
          cp = { ...template, memory: matchedMemory };
        }
      }
    }

    // If it is not a template ID, and we haven't resolved cp (the memory), we must wait for it to sync
    if (!isTemplateId && !cp) {
      if (!user && !authLoading) {
        console.log(`[ProductionDeckContainer] Guest user attempted to access document URL "${promptId}". Redirecting to gateway...`);
        router.push(`/login?reason=unauthenticated&redirect=/studio/production/${promptId}`);
        return;
      }
      console.log(`[ProductionDeckContainer] URL ID "${promptId}" is an existing document, but not yet loaded in memories. Waiting for sync...`);
      return;
    }

    // GUARD: Only initialize data once per resolved prompt to prevent "Split-Brain" resets
    // when background Firestore snapshots fire.
    if (lastLoadedId.current === promptId && isReady) {
      if (cp?.memory) {
         // SHIELD: If we recently updated locally, ignore background snapshots for 2 seconds
         // to allow Firestore to catch up and prevent "text regression" flickers.
         if (Date.now() - lastLocalUpdateRef.current < 2000) return;

         // Only update if there's a meaningful change
         const hasIdTransition = cp.memory.id && !selectedProductionData?.id;
         const hasDataUpdate = cp.memory.description !== selectedProductionData?.description || 
                               cp.memory.prose !== selectedProductionData?.prose ||
                               cp.memory.productionStage !== selectedProductionData?.productionStage ||
                               cp.memory.id !== selectedProductionData?.id ||
                               (cp.memory.narratorAgeAtTime !== undefined && cp.memory.narratorAgeAtTime !== selectedProductionData?.narratorAgeAtTime);

         if (hasIdTransition || hasDataUpdate) {
            console.log(`[ProductionDeckContainer] Firestore update synced to local state. Stage: ${cp.memory.productionStage}`);
            setSelectedProductionData((prev: any) => ({
              ...prev,
              ...cp.memory,
              promptId: cp.id, // Enforce clean root prompt ID in local state update
            }));
         }
      }
      return;
    }

    let memoryToEdit = null;

    if (cp?.memory) {
        console.log(`[ProductionDeckContainer] Loading existing memory document "${cp.memory.id}" (stage: ${cp.memory.productionStage}) for template "${cp.id}"`);
        
        // Sync browser URL bar to point to the actual document ID if we loaded via template ID
        if (promptId === cp.id && typeof window !== 'undefined') {
          const actParam = searchParams.get('act') ? `?act=${searchParams.get('act')}` : '';
          console.log(`[ProductionDeckContainer] Syncing browser URL bar template path "/production/${cp.id}" to document ID "/production/${cp.memory.id}${actParam}"`);
          window.history.replaceState(null, '', `/studio/production/${cp.memory.id}${actParam}`);
        }

        const pid = cp.id; // Enforce resolved root template ID
        const script = pid ? storyScripts[pid] : '';
        const formattedProse = script ? `<p>${script.split('\\n').join('</p><p>')}</p>` : '';
        
        let loadedProse = cp.memory.prose || cp.memory.content || '';
        if (!loadedProse || loadedProse === '<p></p>' || loadedProse === '<p><br></p>' || loadedProse.trim() === '') {
            loadedProse = formattedProse;
        }

        memoryToEdit = {
            ...cp.memory,
            title: cp.memory.title || cp.title || '',
            promptId: cp.id, // Enforce resolved root template ID to break the chain at client-side source
            prose: loadedProse
        };
    } else {
        // New Production Draft
        const template = cp;
        const templateId = cp?.id || promptId;
        console.log(`[ProductionDeckContainer] Initializing new production draft for template "${templateId}"`);
        
        const draftScript = templateId ? storyScripts[templateId] : '';
        const draftFormattedProse = draftScript ? `<p>${draftScript.split('\\n').join('</p><p>')}</p>` : '';

        // Hydrate dynamically using the resolved asynchronous template state
        const resolvedTemplate = resolvedAsyncTemplate;
        
        let initialSensoryConfig: any[] = [];
        let initialProse = draftFormattedProse;
        
        if (resolvedTemplate) {
          initialSensoryConfig = resolvedTemplate.sensoryConfig || [];
          initialProse = resolvedTemplate.prose ? `<p>${resolvedTemplate.prose.split('\n').join('</p><p>')}</p>` : draftFormattedProse;
        }

        memoryToEdit = {
          title: resolvedTemplate ? resolvedTemplate.title : (template?.title || ''),
          description: resolvedTemplate ? resolvedTemplate.description : (template?.description || ''),
          promptId: templateId,
          status: 'draft',
          prose: initialProse,
          sensoryConfig: initialSensoryConfig,
          modality: searchParams.get('modality') === 'vocal' ? 'voice' : (searchParams.get('modality') === 'scribe' ? 'pen' : null)
        };
    }

    if (memoryToEdit) {
        setSelectedProductionData(memoryToEdit);
        setIsReady(true);
        lastLoadedId.current = promptId;
    }
  }, [promptId, chapters, memories, studioLoading, authLoading, isReady, resolvedAsyncTemplate, user, router, selectedProductionData?.id]);

  const handleUpdateProduction = useCallback(async (updatedDataOrFn: any) => {
    if (!user) return;
    
    let resolvedData: any;
    let deltaToSave: any;
    
    setSelectedProductionData((prev: any) => {
      if (typeof updatedDataOrFn === 'function') {
        resolvedData = updatedDataOrFn(prev);
        // If it's a function, we unfortunately have to assume the result is the full object
        // unless we want to do a deep diff. For now, we'll treat it as the full object.
        deltaToSave = resolvedData;
      } else {
        deltaToSave = updatedDataOrFn;
        resolvedData = { ...prev, ...updatedDataOrFn };
      }
      return resolvedData;
    });
    
    lastLocalUpdateRef.current = Date.now();

    // Firestore Sync
    try {
      if (!deltaToSave) return;
      
      const { id: _, ...dataToSave } = deltaToSave;
      const memoryId = selectedProductionData?.id || (resolvedData as any)?.id;
      
      // DEEP SANITIZATION: Firestore does not support 'undefined' values.
      // JSON.stringify naturally strips undefined values from objects and handles nested structures.
      const cleanData = JSON.parse(JSON.stringify(dataToSave));

      if (!memoryId) {
        // If no ID yet, we must save the FULL resolved data to create the document
        const fullData = JSON.parse(JSON.stringify(resolvedData));
        const { id: __, ...cleanFullData } = fullData;
        
        const memoriesRef = collection(db, 'users', user.uid, 'memories');
        const newDoc = await addDoc(memoriesRef, {
          ...cleanFullData,
          createdAt: new Date().toISOString()
        });
        setSelectedProductionData((prev: any) => ({ ...prev, id: newDoc.id }));
        
        // Dynamically update the browser URL to point to the newly created document ID
        // to ensure page refreshes (F5) reload this exact document instead of spawning a new draft.
        // We use window.history.replaceState directly to update the address bar silently
        // and prevent Next.js from unmounting/remounting the active component.
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/studio/production/${newDoc.id}`);
        }
        return;
      }

      // Only perform update if there is actually data to save (excluding ID)
      if (Object.keys(cleanData).length > 0) {
        await updateDoc(doc(db, 'users', user.uid, 'memories', memoryId), cleanData);
      }
    } catch (e) {
      console.error("[ProductionDeckContainer] Auto-save error:", e);
    }
  }, [user, selectedProductionData?.id]);

  // MW-186: Auto-transition draft → pre-release when memory has mastered artifacts
  // This runs in the Container (not ProductionDeck) because user/auth is guaranteed available here
  // and we can write directly to Firestore without going through the handleUpdate prop chain
  const preReleaseTransitionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !selectedProductionData?.id) return;
    if (preReleaseTransitionRef.current === selectedProductionData.id) return; // Already processed

    const data = selectedProductionData;
    const isActVOrMastered = (data.productionStage === 4) || (data.videoUrl && data.isProductionLocked);

    if (isActVOrMastered && data.status === 'draft') {
      preReleaseTransitionRef.current = data.id;
      console.log('[ProductionDeckContainer] MW-186: Auto-transitioning draft → pre-release for:', data.id);
      
      // Direct Firestore write (bypasses handleUpdate which may fail during mount race)
      updateDoc(doc(db, 'users', user.uid, 'memories', data.id), { status: 'pre-release' })
        .then(() => {
          setSelectedProductionData((prev: any) => prev ? { ...prev, status: 'pre-release' } : prev);
          console.log('[ProductionDeckContainer] MW-186: Status updated to pre-release in Firestore');
        })
        .catch((err) => console.error('[ProductionDeckContainer] MW-186: Failed to update status:', err));
    }
  }, [user, selectedProductionData?.id, selectedProductionData?.status, selectedProductionData?.videoUrl, selectedProductionData?.isProductionLocked, selectedProductionData?.productionStage]);


  const handleClose = () => {
    if (isModal) {
      router.back();
    } else {
      router.push('/studio');
    }
  };

  const handleExitTrigger = async () => {
    if (deckRef.current?.handleExit) {
      await deckRef.current.handleExit();
    } else {
      handleClose();
    }
  };

  const toggleLayoutMode = () => {
    const next = layoutMode === 'takeover' ? 'drawer' : 'takeover';
    setLayoutMode(next);
  };

  if (showMobileGuard) {
    return (
      <MobilePortalOverlay
        onActivateRemoteLens={() => {
          router.push(`${pathname}?room=solo`);
        }}
        onExit={() => {
          router.push('/studio');
        }}
      />
    );
  }

  if (isNotFound && (!isReady || !selectedProductionData)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-xl font-headline font-bold text-white italic">Memory Production Not Resolved</h2>
          <p className="text-xs text-white/50 font-mono leading-relaxed">
            Unable to load memory document "{promptId}". It may require host authentication or has been relocated.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/studio')}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-mono font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg hover:scale-105"
          >
            Return to Studio Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isReady || !selectedProductionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-headline mb-2 text-primary/80 italic">Preparing Stage...</h2>
      </div>
    );
  }

  const containerContent = (
    <div className="flex-1 overflow-hidden h-full flex flex-col">
        <ProductionDeck 
          ref={deckRef}
          memoryData={selectedProductionData} 
          onUpdate={handleUpdateProduction} 
          layoutMode={layoutMode}
          onToggleLayout={toggleLayoutMode}
          onClose={handleClose}
        />
      </div>
  );

  if (isModal) {
    if (!isProductionRoute) return null;
    
    return (
      <>
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[30]"
        />
        
        {/* The Deck Modal */}
        <motion.div
          initial={layoutMode === 'takeover' ? { opacity: 0, scale: 0.95 } : { x: '100%' }}
          animate={layoutMode === 'takeover' ? { opacity: 1, scale: 1 } : { x: 0 }}
          exit={layoutMode === 'takeover' ? { opacity: 0, scale: 0.95 } : { x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "fixed z-[40] bg-slate-950 border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-500",
            layoutMode === 'takeover' 
              ? "inset-0 top-16 h-[calc(100vh-64px)] border-t shadow-[0_0_50px_rgba(0,0,0,0.5)]" 
              : "top-16 right-0 bottom-0 w-full md:w-[75%] h-[calc(100vh-64px)] border-l"
          )}
        >
          {containerContent}
        </motion.div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex items-center p-4 border-b border-white/10">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleExitTrigger} 
                variant="ghost" 
                className="text-white/60 hover:text-white"
              >
                &larr; Exit to Studio
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-900 border border-white/20 text-slate-200 text-xs px-3 py-1.5 rounded-lg shadow-xl z-[100]">
              Return to main Memory Weaver Studio dashboard
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex-1 overflow-hidden">
        {containerContent}
      </div>
    </div>
  );
}
