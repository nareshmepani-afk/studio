'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useStudioData } from '@/hooks/studio/useStudioData';
import { storyScripts } from '@/lib/storyScripts';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductionDeck from './ProductionDeck';
import { Loader2, Plus } from 'lucide-react';
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
  
  // To avoid circular layout state, we just keep it simple. If it's modal, we use takeover.
  // We can still support the drawer mode if needed, but takeover is the default.
  const [layoutMode, setLayoutMode] = useState<'takeover' | 'drawer'>('takeover');

  const lastLoadedId = useRef<string | null>(null);
  const lastLocalUpdateRef = useRef<number>(0);
  const deckRef = useRef<any>(null);

  // Reset container state when user session changes to prevent cross-login cache leaks
  useEffect(() => {
    console.log("[ProductionDeckContainer] Auth user state changed. Clearing local rehydration guards...");
    lastLoadedId.current = null;
    setIsReady(false);
    setSelectedProductionData(null);
  }, [user?.uid]);

  // Scroll to top on modal exit/unmount to prevent Next.js layout shift clamping bugs
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        // We use a small timeout to let the modal transition close and Next.js router navigate
        // before smoothly scrolling the main viewport back to the top dashboard view.
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

  if (!isReady || !selectedProductionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-headline mb-2 text-primary/80 italic">Preparing Stage...</h2>
      </div>
    );
  }

  const containerContent = (
    <>
      {isModal && (
        <div className="absolute top-6 right-6 z-[110]">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleExitTrigger}
              className="rounded-full bg-black/20 hover:bg-white/10 text-white/50 hover:text-white transition-all w-12 h-12"
            >
              <Plus className="w-6 h-6 rotate-45" />
            </Button>
        </div>
      )}
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
    </>
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
