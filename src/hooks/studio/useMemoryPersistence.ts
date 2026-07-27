import { useEffect, useRef, useState, useCallback } from 'react';
import { Memory, ScriptBlock, StructuredScript, TimeframeScope } from '@/types';
import { toast } from 'sonner';

interface PersistenceProps {
  data: Partial<Memory>;
  update: (data: Partial<Memory> | ((prev: Partial<Memory>) => Partial<Memory>)) => any;
  title: string;
  description: string;
  location: string;
  country: string;
  tags: string[];
  day: string;
  month: string;
  year: string;
  sensoryValues: Record<string, string>;
  scriptBlocks: ScriptBlock[];
  chapterTitle: string;
  usePoster: boolean;
  posterStyle: 'cinematic' | 'modern' | 'minimalist' | undefined;
  posterImageUrl: string;
  director: string;
  producer: string;
  starring: string;
  billingLine: string;
  aiTakes: any;
  setDescription: (val: string) => void;
  isReviewing?: boolean;
  isGeneratingDrafts?: boolean;
  structuredScript?: StructuredScript;
  originalHook?: string;
  scriptHistory?: any[];
  isProductionLocked?: boolean;
  productionStage?: number;
  prose?: string;
  timeframeScope?: TimeframeScope;
  narratorAgeAtTime?: number;
  durationQuantity?: number;
  durationUnit?: 'days' | 'months' | 'years';
  modality?: 'pen' | 'voice' | null;
  activeVision?: 'soul' | 'sensory' | 'cinematic' | string;
  activeVisionLabel?: string;
  productionTakes?: any[];
}

export function useMemoryPersistence({
  data,
  update,
  title,
  description,
  location,
  country,
  tags,
  day,
  month,
  year,
  sensoryValues,
  scriptBlocks,
  chapterTitle,
  usePoster,
  posterStyle,
  posterImageUrl,
  director,
  producer,
  starring,
  billingLine,
  aiTakes,
  setDescription,
  isReviewing = false,
  isGeneratingDrafts = false,
  structuredScript,
  originalHook,
  scriptHistory,
  isProductionLocked,
  productionStage,
  prose,
  timeframeScope,
  durationQuantity,
  durationUnit,
  narratorAgeAtTime,
  modality,
  activeVision,
  activeVisionLabel,
  productionTakes
}: PersistenceProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const lastSavedTimestamp = useRef<number>(0);
  const previousDescription = useRef<string>(description);
  
  // THE LATEST STATE REF:
  // This is the "God Ref" that ensures flush() always has the absolute latest data,
  // even if called from a stale closure (like an async click handler).
  const latestStateRef = useRef({
    title, description, location, country, tags, day, month, year,
    sensoryValues, scriptBlocks, chapterTitle, usePoster, 
    posterStyle, posterImageUrl, director, producer, starring, 
    billingLine, aiTakes, structuredScript,
    originalHook, scriptHistory, isProductionLocked, productionStage, prose,
    timeframeScope, durationQuantity, durationUnit, narratorAgeAtTime, modality,
    activeVision, activeVisionLabel, productionTakes, isReviewing
  });

  useEffect(() => {
    latestStateRef.current = {
      title, description, location, country, tags, day, month, year,
      sensoryValues, scriptBlocks, chapterTitle, usePoster, 
      posterStyle, posterImageUrl, director, producer, starring, 
      billingLine, aiTakes, structuredScript,
      originalHook, scriptHistory, isProductionLocked, productionStage, prose,
      timeframeScope, durationQuantity, durationUnit, narratorAgeAtTime, modality,
      activeVision, activeVisionLabel, productionTakes, isReviewing
    };
  }, [
    title, description, location, country, tags, day, month, year,
    sensoryValues, scriptBlocks, chapterTitle, usePoster, 
    posterStyle, posterImageUrl, director, producer, starring, 
    billingLine, aiTakes, structuredScript,
    originalHook, scriptHistory, isProductionLocked, productionStage, prose,
    timeframeScope, durationQuantity, durationUnit, narratorAgeAtTime, modality,
    activeVision, activeVisionLabel, productionTakes, isReviewing
  ]);
  
  // Stable references for parent state to decouple dependency arrays
  const dataRef = useRef(data);
  const updateRef = useRef(update);

  useEffect(() => {
    dataRef.current = data;
    updateRef.current = update;
  }, [data, update]);

  // 1. LOCAL STORAGE FAIL-SAFE: Backup the Story Hook locally
  useEffect(() => {
    if (!description || description.length < 5) return;
    const id = data?.id || data?.promptId || 'unknown';
    
    // THE OVERWRITE SHIELD:
    // Don't overwrite a potentially long backup with a default placeholder or a significantly shorter text.
    const isDefault = description.includes("Your birthplace, family roots") || description.includes("Enter the core of your memory");
    if (isDefault) return; // Never backup the placeholder

    const existingBackup = localStorage.getItem(`draft_hook_${id}`);
    if (existingBackup && description.length < existingBackup.length && existingBackup.length > 100) {
      // If we have a substantial backup, and the current text is much shorter, 
      // it might be a partial load or a "vanishing script" bug. Don't overwrite.
      return;
    }

    localStorage.setItem(`draft_hook_${id}`, description);
  }, [description, data?.id, data?.promptId]);

  // 2. Recovery on Mount
  useEffect(() => {
    const id = data?.id || data?.promptId || 'unknown';
    const backup = localStorage.getItem(`draft_hook_${id}`) || localStorage.getItem('draft_hook_unknown');
    const isDefault = !description || 
                    description.includes("Your birthplace, family roots") || 
                    description.includes("Enter the core of your memory") ||
                    description.includes("Select a prompt to begin");
    
    if (backup && isDefault && backup.length > (description?.length || 0)) {
       console.log("[useMemoryPersistence] Recovering Story Hook from local backup.", { id, backupLength: backup.length });
       setDescription(backup);
       toast.success("Script Recovered", { 
         description: "Restored from local fail-safe backup.",
         duration: 5000 
       });
    }
  }, []);

  const flush = useCallback(async (overrides?: Partial<PersistenceProps>) => {
    // Synchronize overrides to God Ref immediately to bypass React async render batching latency
    if (overrides) {
      latestStateRef.current = { ...latestStateRef.current, ...overrides };
    }

    // RIGID GUARDRAIL: Concurrent Save Shield with Ref-Based Async Waiting
    if (isSavingRef.current) {
      console.log("[useMemoryPersistence] Save already in flight. Waiting for completion...");
      let waitTime = 0;
      while (isSavingRef.current && waitTime < 3000) {
        await new Promise(r => setTimeout(r, 50));
        waitTime += 50;
      }
      console.log("[useMemoryPersistence] Completed wait for concurrent save. Proceeding with fresh check.");
    }

    const currentData = dataRef.current;
    const s = { ...latestStateRef.current, ...overrides };

    // RIGID GUARDRAIL: Empty-State Shield
    if (s.description.length === 0 && previousDescription.current.length > 10) {
      console.error("[DIAGNOSTIC: ERROR] Persistence blocked: Attempted to overwrite script with empty string during transition.");
      return { success: false, reason: 'empty_shield' };
    }

    // RIGID GUARDRAIL: Timestamp Validation (Throttle rapid fires)
    const now = Date.now();
    if (now - lastSavedTimestamp.current < 500) {
      return { success: true, reason: 'throttled', description: s.description, latestState: s };
    }

    const hasChanged = (() => {
      const checks = {
        title: s.title !== (currentData?.title || ''),
        description: s.description !== (currentData?.description || ''),
        location: s.location !== (currentData?.location || ''),
        country: s.country !== (currentData?.country || ''),
        date: (s.day || 'none') !== (currentData?.dateComponents?.day || 'none') ||
              (s.month || 'none') !== (currentData?.dateComponents?.month || 'none') ||
              (s.year || 'none') !== (currentData?.dateComponents?.year || 'none'),
        scriptBlocks: JSON.stringify(s.scriptBlocks || []) !== JSON.stringify(currentData?.scriptBlocks || []),
        chapterTitle: s.chapterTitle !== (currentData?.chapterTitle || ''),
        posterStyle: s.posterStyle !== (currentData?.posterStyle || 'cinematic'),
        credits: s.director !== (currentData?.credits?.director || '') ||
                 s.producer !== (currentData?.credits?.producer || '') ||
                 s.starring !== (currentData?.credits?.starring || ''),
        aiTakes: JSON.stringify(s.aiTakes || null) !== JSON.stringify(currentData?.aiTakes || null),
        structuredScript: JSON.stringify(s.structuredScript || null) !== JSON.stringify(currentData?.structuredScript || null),
        sensoryValues: JSON.stringify(s.sensoryValues || {}) !== JSON.stringify(currentData?.sensory || {}),
        originalHook: (s.originalHook || '') !== (currentData?.originalHook || ''),
        scriptHistory: JSON.stringify(s.scriptHistory || []) !== JSON.stringify(currentData?.scriptHistory || []),
        isProductionLocked: (s.isProductionLocked ?? false) !== (currentData?.isProductionLocked ?? false),
        productionStage: (s.productionStage ?? 0) !== (currentData?.productionStage ?? 0),
        timeframeScope: s.timeframeScope !== (currentData?.timeframeScope || 'Year'),
        narratorAgeAtTime: s.narratorAgeAtTime !== (currentData?.narratorAgeAtTime !== undefined ? currentData.narratorAgeAtTime : 25),
        durationQuantity: s.durationQuantity !== (currentData?.durationQuantity || 1),
        durationUnit: s.durationUnit !== (currentData?.durationUnit || 'years'),
        modality: (() => {
          // Overwrite shield: If new modality is null/undefined but Firestore already has a set modality,
          // ignore it as state-lag during rehydration.
          if (!s.modality && currentData?.modality) return false;
          return (s.modality || null) !== (currentData?.modality || null);
        })(),
        activeVision: (() => {
          // Overwrite shield: If new vision is null/undefined but Firestore already has a set vision,
          // ignore it as state-lag during rehydration.
          if (!s.activeVision && currentData?.activeVision) return false;
          return (s.activeVision || '') !== (currentData?.activeVision || '');
        })(),
        activeVisionLabel: (() => {
          if (!s.activeVisionLabel && currentData?.activeVisionLabel) return false;
          return (s.activeVisionLabel || '') !== (currentData?.activeVisionLabel || '');
        })(),
        productionTakes: JSON.stringify(s.productionTakes || []) !== JSON.stringify(currentData?.productionTakes || []),
        isReviewing: (s.isReviewing ?? false) !== (currentData?.isReviewing ?? false)
      };

      const changedFields = Object.entries(checks)
        .filter(([_, changed]) => changed)
        .map(([field]) => field);

      if (changedFields.length > 0) {
        console.log(`[useMemoryPersistence] Detected Changes in: ${changedFields.join(', ')}`);
      }

      return changedFields.length > 0;
    })();

    if (hasChanged) {
      console.log("[useMemoryPersistence] Manual Flush Triggered (Async Handshake)");
      setIsSaving(true);
      isSavingRef.current = true;
      lastSavedTimestamp.current = now;
      previousDescription.current = description;
      
      try {
        const delta = {
          title: s.title || '',
          description: (s.prose && s.prose.trim().length > 0 && (!s.description || s.description.includes("Your birthplace, family roots") || s.description.includes("Enter the core of your memory"))) ? s.prose : (s.description || ''),
          location: s.location || '',
          country: s.country || '',
          tags: s.tags || [],
          lastEdited: now,
          date: (s.day !== 'none' && s.month !== 'none' && s.year !== 'none') ? `${s.day}-${s.month === 'none' ? '' : s.month}-${s.year}` : '',
          dateComponents: {
             day: s.day === 'none' ? '' : s.day, 
             month: s.month === 'none' ? '' : s.month, 
             year: s.year === 'none' ? '' : s.year 
          },
          scriptBlocks: s.scriptBlocks || [],
          sensory: s.sensoryValues || {},
          chapterTitle: s.chapterTitle || '',
          usePoster: s.usePoster ?? true,
          posterStyle: s.posterStyle || 'cinematic',
          posterImageUrl: s.posterImageUrl || '',
          credits: {
             director: s.director || '',
             producer: s.producer || '',
             starring: s.starring || '',
             billingLine: s.billingLine || ''
          },
          aiTakes: s.aiTakes || null,
          structuredScript: s.structuredScript || null,
          originalHook: s.originalHook || currentData?.originalHook || undefined,
          scriptHistory: s.scriptHistory || currentData?.scriptHistory || undefined,
          isProductionLocked: s.isProductionLocked !== undefined ? s.isProductionLocked : (currentData?.isProductionLocked ?? undefined),
          productionStage: s.productionStage !== undefined ? s.productionStage : (currentData?.productionStage ?? undefined),
          prose: s.prose !== undefined ? s.prose : (currentData?.prose ?? undefined),
          timeframeScope: (s.timeframeScope || currentData?.timeframeScope) as TimeframeScope || undefined,
          narratorAgeAtTime: s.narratorAgeAtTime !== undefined ? s.narratorAgeAtTime : (currentData?.narratorAgeAtTime !== undefined ? currentData.narratorAgeAtTime : undefined),
          durationQuantity: s.durationQuantity !== undefined ? s.durationQuantity : (currentData?.durationQuantity ?? undefined),
          durationUnit: (s.durationUnit || currentData?.durationUnit) as 'days' | 'months' | 'years' || undefined,
          modality: s.modality || currentData?.modality || undefined,
          activeVision: s.activeVision || currentData?.activeVision || undefined,
          activeVisionLabel: s.activeVisionLabel || currentData?.activeVisionLabel || undefined,
          productionTakes: s.productionTakes || currentData?.productionTakes || undefined,
          isReviewing: s.isReviewing ?? false,
          status: 'draft' as const // status is usually managed elsewhere but we keep it safe
        };

        console.log("[useMemoryPersistence] Manual Flush Delta package ready:", {
          id: currentData?.id,
          proseLength: delta.prose?.length,
          proseSnippet: delta.prose ? delta.prose.substring(0, 60) + "..." : null,
          scriptBlocksCount: delta.scriptBlocks?.length,
          isProductionLocked: delta.isProductionLocked,
          productionStage: delta.productionStage
        });

        const result = await updateRef.current(delta);
        console.log("[useMemoryPersistence] Firestore update success:", result);
        return { success: true, result, description: s.description, prose: s.prose, latestState: s };
      } catch (err) {
        console.error("[useMemoryPersistence] Flush failed:", err);
        return { success: false, error: err };
      } finally {
        setIsSaving(false);
        isSavingRef.current = false;
      }
    }

    return { success: true, changed: false, description: s.description, latestState: s };
  }, [
    title, description, location, country, tags, day, month, year,
    sensoryValues, scriptBlocks, chapterTitle, usePoster, 
    posterStyle, posterImageUrl, director, producer, starring, 
    billingLine, aiTakes, structuredScript,
    originalHook, scriptHistory, isProductionLocked,
    timeframeScope, durationQuantity, durationUnit, modality,
    activeVision, activeVisionLabel, productionTakes, isReviewing
  ]);

  // Stable Reference for Auto-Save logic to prevent loop-back cycles
  const autoSaveRef = useRef({
    flush,
    isReviewing,
    isGeneratingDrafts
  });

  useEffect(() => {
    autoSaveRef.current = { flush, isReviewing, isGeneratingDrafts };
  }, [flush, isReviewing, isGeneratingDrafts]);

  // 3. Auto-save effect: Decoupled from volatile props via stable ref
  useEffect(() => {
    if (autoSaveRef.current.isReviewing || autoSaveRef.current.isGeneratingDrafts) return;

    const handler = setTimeout(() => {
      autoSaveRef.current.flush();
    }, 2000); // Increased to 2s to allow for UI breathing room

    return () => clearTimeout(handler);
  }, [
    // We only want to restart the timer when the content actually changes,
    // NOT when the flush callback changes.
    title, description, location, country, day, month, year,
    chapterTitle, posterStyle, director, producer, starring,
    JSON.stringify(structuredScript || null),
    JSON.stringify(aiTakes || null),
    JSON.stringify(sensoryValues || {}),
    JSON.stringify(scriptBlocks || []),
    isProductionLocked,
    timeframeScope,
    narratorAgeAtTime,
    durationQuantity,
    durationUnit,
    modality,
    activeVision,
    activeVisionLabel,
    JSON.stringify(productionTakes || null)
  ]);

  // 4. UNSAVED CHANGES WARNING
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isDirty = description !== (dataRef.current?.description || '');
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [description]);

  return { flush, isSaving };
}
