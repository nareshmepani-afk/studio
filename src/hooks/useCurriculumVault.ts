'use client';

/**
 * 🏛️ Unified Curriculum Vault Hook — The Bi-Directional Memory Bridge
 *
 * Milestone: MW-88 (Ticket #258 / MW-88-T1)
 * Canonical Alignment: C:\Users\home\studio\src\lib\curriculum\masterStoryStructure.ts
 * Type Contract: C:\Users\home\studio\src\types\curriculum.ts
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Universal Non-Degradation, Rule 12 Zero-Latency Optimistic UI, Rule 20 British English Orthography)
 *
 * Connects the Firestore cloud curriculum scenes (/users/{uid}/memoirs/{memoirId}/scenes)
 * to both the mobile armchair studio (/studio/fireside) and desktop soundstage (/studio).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  MASTER_STORY_STRUCTURE,
  getSceneById,
} from '@/lib/curriculum/masterStoryStructure';
import {
  UnifiedCurriculumMemory,
  MemoirTake,
  BonusMemoryNote,
  createEmptyCurriculumMemory,
  ActIdentifier,
} from '@/types/curriculum';

export interface UseCurriculumVaultOptions {
  userId?: string | null;
  memoirId?: string | null;
}

export interface UseCurriculumVaultReturn {
  /** Complete map of recorded curriculum memories indexed by canonical sceneId */
  scenes: Record<string, UnifiedCurriculumMemory>;
  /** Subscription loading state */
  isLoading: boolean;
  /** Total number of canonical scenes across the 6-part narrative structure */
  totalScenes: number;
  /** Count of scenes that have completed Act II capture or reached mastered status */
  completedScenes: number;
  /** Integer percentage (0 to 100) representing overall generational vault completion */
  vaultProgressPercent: number;
  /** The first unrecorded or incomplete scene in chronological order */
  nextPendingSceneId: string | null;
  /** Resolves existing memory or initialises a zero-latency fallback skeleton */
  getSceneMemory: (sceneId: string) => UnifiedCurriculumMemory;
  /** Appends a new video or audio take non-destructively to the scene's multi-take stack */
  saveSceneTake: (sceneId: string, take: MemoirTake) => Promise<void>;
  /** Designates a target take as preferred master reel stream */
  promotePreferredTake: (sceneId: string, takeId: string) => Promise<void>;
  /** Adds a non-destructive additive note or photo without mutating the master reel */
  addBonusMemoryNote: (
    sceneId: string,
    note: Omit<BonusMemoryNote, 'id' | 'createdAt'>
  ) => Promise<void>;
}

/**
 * Deterministic flat list of all scenes across the 6-part master curriculum spine
 */
export const ALL_CURRICULUM_SCENES = MASTER_STORY_STRUCTURE.flatMap((part) => part.scenes);
export const TOTAL_CURRICULUM_SCENES = ALL_CURRICULUM_SCENES.length;

/**
 * Pure evaluation helper determining whether a scene has achieved captured/mastered completion
 */
export function isSceneCompleted(memory: UnifiedCurriculumMemory | undefined): boolean {
  if (!memory) return false;

  // 1. Explicit status machine checks
  if (memory.currentStatus === 'mastered' || memory.currentStatus === 'captured') {
    return true;
  }

  // 2. Act completion array or record checks
  if (Array.isArray(memory.actsCompleted)) {
    if (
      memory.actsCompleted.includes('act2') ||
      memory.actsCompleted.includes('act3') ||
      memory.actsCompleted.includes('act4')
    ) {
      return true;
    }
  } else if (typeof memory.actsCompleted === 'object' && memory.actsCompleted !== null) {
    const acts = memory.actsCompleted as Record<string, boolean>;
    if (acts.act2_capture || acts.act2 || acts.act3 || acts.act4) {
      return true;
    }
  }

  // 3. Multi-take physical presence check
  if (Array.isArray(memory.takes) && memory.takes.length > 0) {
    return true;
  }

  return false;
}

export function useCurriculumVault({
  userId,
  memoirId,
}: UseCurriculumVaultOptions = {}): UseCurriculumVaultReturn {
  const [scenes, setScenes] = useState<Record<string, UnifiedCurriculumMemory>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const effectiveUserId = userId || 'guest';
  const effectiveMemoirId = memoirId || 'default_memoir';

  // ---------------------------------------------------------------------------
  // 1. Real-time Firestore Cloud Subscription
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // If unauthenticated or running in local guest mode, fallback gracefully
    if (!userId || userId.startsWith('guest') || !memoirId || !db) {
      setScenes({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const scenesColRef = collection(db, 'users', userId, 'memoirs', memoirId, 'scenes');

      const unsubscribe = onSnapshot(
        scenesColRef,
        (snapshot) => {
          const loadedScenes: Record<string, UnifiedCurriculumMemory> = {};
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data() as UnifiedCurriculumMemory;
            const sceneKey = data.sceneId || docSnap.id;
            loadedScenes[sceneKey] = {
              ...data,
              id: docSnap.id,
            };
          });

          setScenes(loadedScenes);
          setIsLoading(false);
        },
        (error) => {
          console.warn('[useCurriculumVault] Real-time cloud synchronisation warning:', error);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('[useCurriculumVault] Subscription setup error:', err);
      setIsLoading(false);
    }
  }, [userId, memoirId]);

  // ---------------------------------------------------------------------------
  // 2. Computed Directorial Metrics & Chronological Ingress
  // ---------------------------------------------------------------------------
  const totalScenes = TOTAL_CURRICULUM_SCENES;

  const completedScenes = useMemo(() => {
    return Object.values(scenes).filter((mem) => isSceneCompleted(mem)).length;
  }, [scenes]);

  const vaultProgressPercent = useMemo(() => {
    if (totalScenes === 0) return 0;
    return Math.min(100, Math.round((completedScenes / totalScenes) * 100));
  }, [completedScenes, totalScenes]);

  const nextPendingSceneId = useMemo(() => {
    // Search in strict chronological sequence (Part I Scene 1 through Part VI Scene 1)
    const pendingScene = ALL_CURRICULUM_SCENES.find((scene) => {
      const mem = scenes[scene.id];
      return !isSceneCompleted(mem);
    });
    return pendingScene ? pendingScene.id : null;
  }, [scenes]);

  // ---------------------------------------------------------------------------
  // 3. Hook Actions & Zero-Latency Optimistic Mutations (Rule 12)
  // ---------------------------------------------------------------------------

  const getSceneMemory = useCallback(
    (sceneId: string): UnifiedCurriculumMemory => {
      if (scenes[sceneId]) {
        return scenes[sceneId];
      }

      const sceneDef = getSceneById(sceneId);
      return createEmptyCurriculumMemory({
        id: `memoir_${sceneId}`,
        userId: effectiveUserId,
        sceneId,
        partNumber: sceneDef?.partNumber ?? 1,
        sceneNumber: sceneDef?.sceneNumber ?? 1,
        sceneTitle: sceneDef?.title ?? sceneId,
        originSurface: 'fireside_mobile',
      });
    },
    [scenes, effectiveUserId]
  );

  const saveSceneTake = useCallback(
    async (sceneId: string, take: MemoirTake): Promise<void> => {
      let updatedMemoryToPersist: UnifiedCurriculumMemory | null = null;

      setScenes((prev) => {
        const current = prev[sceneId] || getSceneMemory(sceneId);
        const existingTakes = current.takes || [];

        // Non-destructive multi-take invariant:
        // If this take is marked preferred or is the sole take, make it preferred and un-prefer others
        const isFirstTake = existingTakes.length === 0;
        const shouldBePreferred = take.isPreferred || isFirstTake;

        const updatedTakes = existingTakes
          .map((t) => (shouldBePreferred ? { ...t, isPreferred: false } : t))
          .concat({ ...take, isPreferred: shouldBePreferred });

        const existingActs: ActIdentifier[] = Array.isArray(current.actsCompleted)
          ? current.actsCompleted
          : [];
        const updatedActs: ActIdentifier[] = existingActs.includes('act2')
          ? existingActs
          : [...existingActs, 'act2'];

        const updatedMemory: UnifiedCurriculumMemory = {
          ...current,
          takes: updatedTakes,
          activeTakeId: shouldBePreferred ? take.id : current.activeTakeId || take.id,
          currentStatus: current.currentStatus === 'mastered' ? 'mastered' : 'captured',
          actsCompleted: updatedActs,
          lastModified: new Date().toISOString(),
        };

        updatedMemoryToPersist = updatedMemory;
        return { ...prev, [sceneId]: updatedMemory };
      });

      // 2. Cloud persistence if authenticated
      if (db && userId && effectiveMemoirId && !userId.startsWith('guest') && updatedMemoryToPersist) {
        try {
          const sceneDocRef = doc(db, 'users', userId, 'memoirs', effectiveMemoirId, 'scenes', sceneId);
          await setDoc(sceneDocRef, updatedMemoryToPersist, { merge: true });
        } catch (cloudErr) {
          console.error('[useCurriculumVault] Failed to persist scene take to Firestore:', cloudErr);
        }
      }
    },
    [getSceneMemory, userId, effectiveMemoirId]
  );

  const promotePreferredTake = useCallback(
    async (sceneId: string, takeId: string): Promise<void> => {
      let updatedMemoryToPersist: UnifiedCurriculumMemory | null = null;

      setScenes((prev) => {
        const current = prev[sceneId] || getSceneMemory(sceneId);
        const updatedTakes = (current.takes || []).map((t) => ({
          ...t,
          isPreferred: t.id === takeId,
        }));

        const updatedMemory: UnifiedCurriculumMemory = {
          ...current,
          takes: updatedTakes,
          activeTakeId: takeId,
          lastModified: new Date().toISOString(),
        };

        updatedMemoryToPersist = updatedMemory;
        return { ...prev, [sceneId]: updatedMemory };
      });

      // 2. Cloud persistence if authenticated
      if (db && userId && effectiveMemoirId && !userId.startsWith('guest') && updatedMemoryToPersist) {
        try {
          const sceneDocRef = doc(db, 'users', userId, 'memoirs', effectiveMemoirId, 'scenes', sceneId);
          await setDoc(sceneDocRef, updatedMemoryToPersist, { merge: true });
        } catch (cloudErr) {
          console.error('[useCurriculumVault] Failed to persist preferred take to Firestore:', cloudErr);
        }
      }
    },
    [getSceneMemory, userId, effectiveMemoirId]
  );

  const addBonusMemoryNote = useCallback(
    async (
      sceneId: string,
      note: Omit<BonusMemoryNote, 'id' | 'createdAt'>
    ): Promise<void> => {
      let updatedMemoryToPersist: UnifiedCurriculumMemory | null = null;
      const newNote: BonusMemoryNote = {
        ...note,
        id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      };

      setScenes((prev) => {
        const current = prev[sceneId] || getSceneMemory(sceneId);
        const updatedMemory: UnifiedCurriculumMemory = {
          ...current,
          bonusNotes: [...(current.bonusNotes || []), newNote],
          lastModified: new Date().toISOString(),
        };

        updatedMemoryToPersist = updatedMemory;
        return { ...prev, [sceneId]: updatedMemory };
      });

      // 2. Cloud persistence if authenticated
      if (db && userId && effectiveMemoirId && !userId.startsWith('guest') && updatedMemoryToPersist) {
        try {
          const sceneDocRef = doc(db, 'users', userId, 'memoirs', effectiveMemoirId, 'scenes', sceneId);
          await setDoc(sceneDocRef, updatedMemoryToPersist, { merge: true });
        } catch (cloudErr) {
          console.error('[useCurriculumVault] Failed to persist bonus note to Firestore:', cloudErr);
        }
      }
    },
    [getSceneMemory, userId, effectiveMemoirId]
  );

  return {
    scenes,
    isLoading,
    totalScenes,
    completedScenes,
    vaultProgressPercent,
    nextPendingSceneId,
    getSceneMemory,
    saveSceneTake,
    promotePreferredTake,
    addBonusMemoryNote,
  };
}

export default useCurriculumVault;
