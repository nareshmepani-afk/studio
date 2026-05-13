import { useEffect, useRef, useState, useCallback } from 'react';
import { Memory, ScriptBlock, StructuredScript } from '@/types';
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
  structuredScript
}: PersistenceProps) {
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedTimestamp = useRef<number>(0);
  const previousDescription = useRef<string>(description);
  
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

  const flush = useCallback(async () => {
    // RIGID GUARDRAIL: Empty-State Shield
    if (description.length === 0 && previousDescription.current.length > 10) {
      console.error("[DIAGNOSTIC: ERROR] Persistence blocked: Attempted to overwrite script with empty string during transition.");
      return { success: false, reason: 'empty_shield' };
    }

    // RIGID GUARDRAIL: Timestamp Validation (Throttle rapid fires)
    const now = Date.now();
    if (now - lastSavedTimestamp.current < 500) {
      return { success: true, reason: 'throttled' };
    }

    const currentData = dataRef.current;

    const hasChanged = 
      title !== (currentData?.title || '') ||
      description !== (currentData?.description || '') ||
      location !== (currentData?.location || '') ||
      country !== (currentData?.country || '') ||
      (day || 'none') !== (currentData?.dateComponents?.day || 'none') ||
      (month || 'none') !== (currentData?.dateComponents?.month || 'none') ||
      (year || 'none') !== (currentData?.dateComponents?.year || 'none') ||
      JSON.stringify(scriptBlocks) !== JSON.stringify(currentData?.scriptBlocks || []) ||
      chapterTitle !== (currentData?.chapterTitle || '') ||
      posterStyle !== (currentData?.posterStyle || 'cinematic') ||
      director !== (currentData?.credits?.director || '') ||
      producer !== (currentData?.credits?.producer || '') ||
      starring !== (currentData?.credits?.starring || '') ||
      JSON.stringify(aiTakes) !== JSON.stringify(currentData?.aiTakes || null) ||
      JSON.stringify(structuredScript) !== JSON.stringify(currentData?.structuredScript || null) ||
      JSON.stringify(sensoryValues) !== JSON.stringify(currentData?.sensory || {});

    if (hasChanged) {
      console.log("[useMemoryPersistence] Manual Flush Triggered (Async Handshake)");
      setIsSaving(true);
      lastSavedTimestamp.current = now;
      previousDescription.current = description;
      
      try {
        const result = await updateRef.current(prev => ({
          ...prev,
          title,
          description,
          location,
          country,
          tags,
          lastEdited: now,
          date: (day !== 'none' && month !== 'none' && year !== 'none') ? `${day}-${month === 'none' ? '' : month}-${year}` : '',
          dateComponents: {
             day: day === 'none' ? '' : day, 
             month: month === 'none' ? '' : month, 
             year: year === 'none' ? '' : year 
          },
          scriptBlocks,
          sensory: sensoryValues,
          chapterTitle,
          usePoster,
          posterStyle,
          posterImageUrl,
          credits: {
             director,
             producer,
             starring,
             billingLine
          },
          aiTakes: aiTakes || null,
          structuredScript: structuredScript || undefined,
          status: prev?.status || 'draft'
        }));
        return { success: true, result };
      } catch (err) {
        console.error("[useMemoryPersistence] Flush failed:", err);
        return { success: false, error: err };
      } finally {
        setIsSaving(false);
      }
    }

    return { success: true, changed: false };
  }, [
    title, description, location, country, tags, day, month, year,
    sensoryValues, scriptBlocks, chapterTitle, usePoster, 
    posterStyle, posterImageUrl, director, producer, starring, 
    billingLine, aiTakes, structuredScript
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
    JSON.stringify(structuredScript)
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
