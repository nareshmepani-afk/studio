'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export const ACT_TO_QUERY = ['hook', 'weave', 'capture', 'cut', 'premiere'];
export type ModalityType = 'pen' | 'voice' | null;

export function useStudioState(initialProse: string) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // -- ACT LOGIC --
  const actParam = searchParams.get('act');
  const currentStage = actParam ? Math.max(0, ACT_TO_QUERY.indexOf(actParam)) : 0;

  // We compute the true word count from the initial prose to avoid the 0-count hydration bug
  const initialWordCount = useRef(0);
  useEffect(() => {
      if (initialProse) {
          const text = initialProse.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ');
          initialWordCount.current = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      }
  }, [initialProse]);

  // Guard Logic on URL change
  useEffect(() => {
    if (currentStage > 1 && initialWordCount.current < 150) {
       toast.error('Stage Locked', { 
           description: 'Act II must be fully scripted (150+ words) before moving to Capture.',
           id: 'stage-lock-toast' // prevent duplicate toasts
       });
       
       // Fallback to Weave
       const params = new URLSearchParams(searchParams.toString());
       params.set('act', 'weave');
       router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [currentStage, searchParams, pathname, router]);

  const setStage = useCallback((index: number) => {
    const newQuery = ACT_TO_QUERY[index] || 'hook';
    const params = new URLSearchParams(searchParams.toString());
    params.set('act', newQuery);
    
    // Use replace to keep history clean (Commander's recommendation)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // -- MODALITY LOGIC --
  const modalityParam = searchParams.get('modality');
  const currentModality: ModalityType = modalityParam === 'scribe' ? 'pen' : (modalityParam === 'vocal' ? 'voice' : null);

  const setModality = useCallback((mod: ModalityType) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mod === 'pen') {
        params.set('modality', 'scribe');
    } else if (mod === 'voice') {
        params.set('modality', 'vocal');
    } else {
        params.delete('modality');
    }
    // Use replace to keep history clean
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  return { currentStage, setStage, modality: currentModality, setModality };
}
