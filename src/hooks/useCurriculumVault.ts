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

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  MASTER_STORY_STRUCTURE,
  getSceneById,
  resolveSceneFromPromptId,
  resolvePromptIdFromSceneId,
  mapProductionStageToActsCompleted,
  mapActsCompletedToProductionStage,
} from '@/lib/curriculum/masterStoryStructure';
import {
  UnifiedCurriculumMemory,
  MemoirTake,
  BonusMemoryNote,
  createEmptyCurriculumMemory,
  DEFAULT_DIRECTORIAL_POLISH,
  ActIdentifier,
  StoryMoodTag,
} from '@/types/curriculum';

export type { StoryMoodTag } from '@/types/curriculum';

export interface UseCurriculumVaultOptions {
  userId?: string | null;
  memoirId?: string | null;
  initialSceneId?: string;
}

export interface UseCurriculumVaultReturn {
  /** Complete map of recorded curriculum memories indexed by canonical sceneId */
  scenes: Record<string, UnifiedCurriculumMemory>;
  /** Currently selected or active scene identifier */
  activeSceneId: string;
  /** Setter for updating active scene selection */
  setActiveSceneId: (sceneId: string) => void;
  /** Active scene memory object, pre-hydrated or initialised with empty skeleton */
  activeSceneMemory: UnifiedCurriculumMemory;
  /** Smart landing target for soundstage (act3 if takes exist, otherwise act1) */
  smartLandingTarget: ActIdentifier;
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
  saveSceneTake: (
    sceneId: string,
    take: MemoirTake,
    options?: { photos?: any[]; prose?: string }
  ) => Promise<void>;
  /** Designates a target take as preferred master reel stream */
  promotePreferredTake: (sceneId: string, takeId: string) => Promise<void>;
  /** Adds a non-destructive additive note or photo without mutating the master reel */
  addBonusMemoryNote: (
    sceneId: string,
    note: Omit<BonusMemoryNote, 'id' | 'createdAt'>
  ) => Promise<void>;
  /** Sets emotional mood resonance tag ('joyful' | 'reflective' | 'nostalgic') */
  setStoryMoodTag: (sceneId: string, mood: StoryMoodTag) => Promise<void>;
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
  initialSceneId,
}: UseCurriculumVaultOptions = {}): UseCurriculumVaultReturn {
  const [scenes, setScenes] = useState<Record<string, UnifiedCurriculumMemory>>({});
  const scenesRef = useRef<Record<string, UnifiedCurriculumMemory>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSceneId, setActiveSceneId] = useState<string>(
    initialSceneId || ALL_CURRICULUM_SCENES[0].id
  );

  useEffect(() => {
    if (initialSceneId) {
      setActiveSceneId(initialSceneId);
    }
  }, [initialSceneId]);

  const effectiveUserId = userId || 'guest';
  const lastMutatedMemoryRef = useRef<UnifiedCurriculumMemory | null>(null);

  // ---------------------------------------------------------------------------
  // 1. Real-time Firestore Cloud Subscription (/users/{userId}/memories)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // If unauthenticated or running in local guest mode, fallback gracefully
    if (!userId || userId.startsWith('guest') || !db) {
      scenesRef.current = {};
      setScenes({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const memoriesColRef = collection(db, 'users', userId, 'memories');

      const unsubscribe = onSnapshot(
        memoriesColRef,
        (snapshot) => {
          const loadedScenes: Record<string, UnifiedCurriculumMemory> = {};
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data() as any;

            // ZERO-CONTAMINATION SHIELD: Strictly ignore flight simulator micro-onboarding memories
            if (data.isFlightSimulator === true || data.sceneId === 'prologue-flight-simulator' || data.promptId === 'prologue-flight-simulator' || docSnap.id === 'first_flight_rehearsal') {
              return;
            }

            const rawIdentifier = data.sceneId || data.promptId || docSnap.id;
            const sceneDef = resolveSceneFromPromptId(rawIdentifier) || getSceneById(rawIdentifier);
            const canonicalSceneId = data.sceneId || sceneDef?.id || docSnap.id;
            const mappedPromptId = data.promptId || sceneDef?.promptId;

            // Harmonise productionStage <-> actsCompleted
            const computedActs: ActIdentifier[] =
              Array.isArray(data.actsCompleted) && data.actsCompleted.length > 0
                ? data.actsCompleted
                : typeof data.productionStage === 'number'
                ? (mapProductionStageToActsCompleted(data.productionStage) as ActIdentifier[])
                : [];

            const rawTakes: MemoirTake[] = Array.isArray(data.takes) ? [...data.takes] : [];
            // If takes array is empty in cloud doc but videoUrl or audioUrl is present, synthesise a fallback take
            if (rawTakes.length === 0 && (data.videoUrl || data.audioUrl)) {
              rawTakes.push({
                id: `take_cloud_${docSnap.id}`,
                takeNumber: 1,
                source: data.videoUrl ? 'soundstage_desktop' : 'fireside_mobile',
                mediaMode: data.videoUrl ? 'video' : 'audio',
                mediaUrl: data.videoUrl || data.audioUrl,
                durationSeconds: data.duration || 60,
                createdAt: data.createdAt || new Date().toISOString(),
                label: data.videoUrl ? 'Soundstage Master Reel' : 'Fireside Spoken Memoir',
                isPreferred: true,
              });
            }
            const takes = rawTakes;
            const preferredTake =
              takes.find((t) => t.isPreferred) || takes[takes.length - 1] || takes[0];

            const normalized: UnifiedCurriculumMemory = {
              id: docSnap.id,
              userId,
              sceneId: canonicalSceneId,
              partNumber: data.partNumber || sceneDef?.partNumber || 1,
              sceneNumber: data.sceneNumber || sceneDef?.sceneNumber || 1,
              sceneTitle: data.title || data.sceneTitle || sceneDef?.title || canonicalSceneId,
              prose: data.prose || data.description || '',
              currentStatus:
                data.currentStatus ||
                (data.status === 'pre-release' || data.status === 'published'
                  ? 'mastered'
                  : computedActs.includes('act2') || takes.length > 0
                  ? 'captured'
                  : 'ready_for_action'),
              actsCompleted: computedActs,
              smartLandingTarget: computedActs.includes('act3')
                ? 'act4'
                : computedActs.includes('act2')
                ? 'act3'
                : 'act2',
              takes,
              activeTakeId: data.activeTakeId || preferredTake?.id || '',
              photos: Array.isArray(data.photos) ? data.photos : [],
              directorialPolish: data.directorialPolish || { ...DEFAULT_DIRECTORIAL_POLISH },
              bonusNotes: Array.isArray(data.bonusNotes) ? data.bonusNotes : [],
              moodTag: data.moodTag,
              originSurface: data.originSurface || 'desktop_soundstage',
              lastModified: data.updatedAt || data.lastModified || data.createdAt || new Date().toISOString(),
              createdAt: data.createdAt || new Date().toISOString(),
            };

            // Candidate Resolution Shield: if multiple docs exist for the same scene, retain the completed/newest one
            const existing = loadedScenes[canonicalSceneId];
            if (existing) {
              const existingCompleted = isSceneCompleted(existing) ? 1 : 0;
              const newCompleted = isSceneCompleted(normalized) ? 1 : 0;
              if (newCompleted < existingCompleted) return;
              if (newCompleted === existingCompleted) {
                const existingTime = Date.parse(existing.lastModified || existing.createdAt || '') || 0;
                const newTime = Date.parse(normalized.lastModified || normalized.createdAt || '') || 0;
                if (newTime < existingTime) return;
              }
            }

            // Preserve any active local blob URLs or photos from in-flight session takes
            const localCurrent = scenesRef.current[canonicalSceneId];
            if (localCurrent && localCurrent.takes && localCurrent.takes.length > 0) {
              const localPreferred = localCurrent.takes.find((t) => t.isPreferred);
              if (
                localPreferred &&
                localPreferred.mediaUrl?.startsWith('blob:') &&
                !normalized.takes.some((t) => t.id === localPreferred.id)
              ) {
                normalized.takes = [
                  ...normalized.takes.map((t) => ({ ...t, isPreferred: false })),
                  localPreferred,
                ];
                normalized.activeTakeId = localPreferred.id;
              }
              if (
                (!normalized.photos || normalized.photos.length === 0) &&
                localCurrent.photos &&
                localCurrent.photos.length > 0
              ) {
                normalized.photos = localCurrent.photos;
              }
            }

            // Index by canonical scene ID (e.g. "part-1-scene-1")
            loadedScenes[canonicalSceneId] = normalized;

            // Index by Desktop promptId (e.g. "p1") if distinct
            if (mappedPromptId && mappedPromptId !== canonicalSceneId) {
              loadedScenes[mappedPromptId] = normalized;
            }

            // Index by Firestore document ID (e.g. "ey96djU6qR1BrDGnvZwp")
            if (docSnap.id && docSnap.id !== canonicalSceneId && docSnap.id !== mappedPromptId) {
              loadedScenes[docSnap.id] = normalized;
            }
          });

          scenesRef.current = loadedScenes;
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
  }, [userId]);

  // ---------------------------------------------------------------------------
  // 2. Computed Directorial Metrics & Chronological Ingress
  // ---------------------------------------------------------------------------
  const totalScenes = TOTAL_CURRICULUM_SCENES;

  const completedScenes = useMemo(() => {
    return ALL_CURRICULUM_SCENES.filter((scene) => {
      const mem = scenes[scene.id] || (scene.promptId && scenes[scene.promptId]);
      return isSceneCompleted(mem);
    }).length;
  }, [scenes]);

  const vaultProgressPercent = useMemo(() => {
    if (totalScenes === 0) return 0;
    return Math.min(100, Math.round((completedScenes / totalScenes) * 100));
  }, [completedScenes, totalScenes]);

  const nextPendingSceneId = useMemo(() => {
    // Search in strict chronological sequence (Part I Scene 1 through Part VI Scene 1)
    const pendingScene = ALL_CURRICULUM_SCENES.find((scene) => {
      const mem = scenes[scene.id] || (scene.promptId && scenes[scene.promptId]);
      return !isSceneCompleted(mem);
    });
    return pendingScene ? pendingScene.id : null;
  }, [scenes]);

  // ---------------------------------------------------------------------------
  // 3. Hook Actions & Zero-Latency Optimistic Mutations (Rule 12)
  // ---------------------------------------------------------------------------
  const getSceneMemory = useCallback(
    (sceneIdOrPromptId: string): UnifiedCurriculumMemory => {
      const activeMap = Object.keys(scenes).length > 0 ? scenes : scenesRef.current;
      if (activeMap[sceneIdOrPromptId]) {
        return activeMap[sceneIdOrPromptId];
      }

      const sceneDef = resolveSceneFromPromptId(sceneIdOrPromptId) || getSceneById(sceneIdOrPromptId);
      const canonicalSceneId = sceneDef?.id || sceneIdOrPromptId;

      if (activeMap[canonicalSceneId]) {
        return activeMap[canonicalSceneId];
      }

      return createEmptyCurriculumMemory({
        id: `memoir_${canonicalSceneId}`,
        userId: effectiveUserId,
        sceneId: canonicalSceneId,
        partNumber: sceneDef?.partNumber ?? 1,
        sceneNumber: sceneDef?.sceneNumber ?? 1,
        sceneTitle: sceneDef?.title ?? canonicalSceneId,
        originSurface: 'fireside_mobile',
      });
    },
    [scenes, effectiveUserId]
  );

  const resolveDocIdForScene = useCallback(
    (sceneId: string): string => {
      const activeMap = Object.keys(scenesRef.current).length > 0 ? scenesRef.current : scenes;
      const mem = activeMap[sceneId];
      if (mem && mem.id && !mem.id.startsWith('memoir_')) {
        return mem.id;
      }
      const sceneDef = resolveSceneFromPromptId(sceneId) || getSceneById(sceneId);
      if (
        sceneDef?.promptId &&
        activeMap[sceneDef.promptId]?.id &&
        !activeMap[sceneDef.promptId].id.startsWith('memoir_')
      ) {
        return activeMap[sceneDef.promptId].id;
      }
      return sceneId;
    },
    [scenes]
  );

  const saveSceneTake = useCallback(
    async (
      sceneId: string,
      take: MemoirTake,
      options?: { photos?: any[]; prose?: string }
    ): Promise<void> => {
      const sceneDef = resolveSceneFromPromptId(sceneId) || getSceneById(sceneId);
      const canonicalSceneId = sceneDef?.id || sceneId;
      const mappedPromptId = sceneDef?.promptId;

      // ZERO-CONTAMINATION SHIELD: Ignore rehearsal takes
      if (
        sceneId === 'first_flight_rehearsal' ||
        sceneId === 'prologue-flight-simulator' ||
        canonicalSceneId === 'prologue-flight-simulator'
      ) {
        return;
      }

      const nowIso = new Date().toISOString();
      const current =
        scenesRef.current[canonicalSceneId] ||
        scenes[canonicalSceneId] ||
        getSceneMemory(canonicalSceneId);
      const existingTakes = current.takes || [];

      const isFirstTake = existingTakes.length === 0;
      const shouldBePreferred = take.isPreferred !== undefined ? take.isPreferred : isFirstTake;

      const takeWithLabel: MemoirTake = {
        ...take,
        label:
          take.label ||
          `Take ${take.takeNumber} (${take.mediaMode === 'video' ? 'Fireside Video' : 'Fireside Voice'})`,
        isPreferred: shouldBePreferred,
      };

      const takeExists = existingTakes.some((t) => t.id === take.id);
      const updatedTakes = takeExists
        ? existingTakes.map((t) =>
            t.id === take.id
              ? { ...t, ...takeWithLabel }
              : shouldBePreferred
              ? { ...t, isPreferred: false }
              : t
          )
        : existingTakes
            .map((t) => (shouldBePreferred ? { ...t, isPreferred: false } : t))
            .concat(takeWithLabel);

      const existingActs: ActIdentifier[] = Array.isArray(current.actsCompleted)
        ? current.actsCompleted
        : [];
      const updatedActs: ActIdentifier[] = existingActs.includes('act2')
        ? existingActs
        : [...existingActs, 'act2'];

      const mergedPhotos =
        options?.photos && options.photos.length > 0
          ? options.photos
          : current.photos || [];
      const mergedProse = options?.prose || current.prose || '';

      const updatedMemory: UnifiedCurriculumMemory = {
        ...current,
        prose: mergedProse,
        photos: mergedPhotos,
        takes: updatedTakes,
        activeTakeId: shouldBePreferred ? take.id : current.activeTakeId || take.id,
        currentStatus: current.currentStatus === 'mastered' ? 'mastered' : 'captured',
        actsCompleted: updatedActs,
        lastModified: nowIso,
        createdAt: current.createdAt || take.createdAt || nowIso,
      };

      lastMutatedMemoryRef.current = updatedMemory;
      const nextScenes = {
        ...scenesRef.current,
        [canonicalSceneId]: updatedMemory,
      };
      if (mappedPromptId) {
        nextScenes[mappedPromptId] = updatedMemory;
      }
      scenesRef.current = nextScenes;

      setScenes((prev) => {
        const next = { ...prev, [canonicalSceneId]: updatedMemory };
        if (mappedPromptId) next[mappedPromptId] = updatedMemory;
        return next;
      });

      // Cloud persistence directly to /users/{userId}/memories
      const memToPersist = updatedMemory;
      if (db && userId && !userId.startsWith('guest') && memToPersist) {
        try {
          const targetDocId = resolveDocIdForScene(canonicalSceneId);
          const memoryDocRef = doc(db, 'users', userId, 'memories', targetDocId);

          // Ensure Firestore-safe serialisable photos (strip any transient File/Blob objects if present)
          const safePhotos = (memToPersist.photos || []).map((p: any) => ({
            id: p.id || `photo_${Date.now()}`,
            localUri: p.localUri || p.previewUrl || p.storageUrl || p.url || '',
            storageUrl: p.storageUrl || p.url || null,
            storagePath: p.storagePath || null,
            caption: p.caption || '',
            capturedAt: p.capturedAt || nowIso,
          }));

          const primaryPhotoUrl =
            safePhotos[0]?.storageUrl || safePhotos[0]?.localUri || null;

          const narrativeText =
            memToPersist.prose ||
            `Spoken memoir recorded in Fireside Studio (${memToPersist.sceneTitle}).`;

          const payload: Record<string, any> = {
            sceneId: canonicalSceneId,
            promptId: mappedPromptId || canonicalSceneId,
            chapterId: sceneDef ? `part-${sceneDef.partNumber}` : 'part-i',
            partNumber: sceneDef?.partNumber || 1,
            sceneNumber: sceneDef?.sceneNumber || 1,
            title: memToPersist.sceneTitle,
            sceneTitle: memToPersist.sceneTitle,
            prose: narrativeText,
            description: narrativeText,
            actsCompleted: updatedActs,
            productionStage: Math.max(2, mapActsCompletedToProductionStage(updatedActs)),
            takes: updatedTakes,
            activeTakeId: updatedMemory.activeTakeId,
            duration: take.durationSeconds,
            photos: safePhotos,
            bonusNotes: memToPersist.bonusNotes || [],
            moodTag: memToPersist.moodTag || null,
            originSurface: 'fireside_mobile',
            currentStatus: memToPersist.currentStatus,
            status: memToPersist.currentStatus === 'mastered' ? 'pre-release' : 'draft',
            createdAt: memToPersist.createdAt || nowIso,
            updatedAt: nowIso,
            lastModified: nowIso,
          };

          if (primaryPhotoUrl) {
            payload.imageUrl = primaryPhotoUrl;
          }

          if (take.mediaUrl) {
            if (take.mediaMode === 'video') {
              payload.videoUrl = take.mediaUrl;
            } else {
              payload.audioUrl = take.mediaUrl;
            }
          }

          await setDoc(memoryDocRef, payload, { merge: true });

          if (memoirId) {
            const legacyDocRef = doc(
              db,
              'users',
              userId,
              'memoirs',
              memoirId,
              'scenes',
              canonicalSceneId
            );
            await setDoc(legacyDocRef, memToPersist, { merge: true });
          }
        } catch (cloudErr) {
          console.error('[useCurriculumVault] Failed to persist scene take to Firestore:', cloudErr);
        }
      }
    },
    [scenes, getSceneMemory, userId, memoirId, resolveDocIdForScene]
  );

  const promotePreferredTake = useCallback(
    async (sceneId: string, takeId: string): Promise<void> => {
      const sceneDef = resolveSceneFromPromptId(sceneId) || getSceneById(sceneId);
      const canonicalSceneId = sceneDef?.id || sceneId;
      const mappedPromptId = sceneDef?.promptId;

      const nowIso = new Date().toISOString();
      const current =
        scenesRef.current[canonicalSceneId] ||
        scenes[canonicalSceneId] ||
        getSceneMemory(canonicalSceneId);
      const updatedTakes = (current.takes || []).map((t) => ({
        ...t,
        isPreferred: t.id === takeId,
      }));

      const updatedMemory: UnifiedCurriculumMemory = {
        ...current,
        takes: updatedTakes,
        activeTakeId: takeId,
        lastModified: nowIso,
      };

      lastMutatedMemoryRef.current = updatedMemory;
      const nextScenes = {
        ...scenesRef.current,
        [canonicalSceneId]: updatedMemory,
      };
      if (mappedPromptId) nextScenes[mappedPromptId] = updatedMemory;
      scenesRef.current = nextScenes;

      setScenes((prev) => {
        const next = { ...prev, [canonicalSceneId]: updatedMemory };
        if (mappedPromptId) next[mappedPromptId] = updatedMemory;
        return next;
      });

      const memToPersist = updatedMemory;
      if (db && userId && !userId.startsWith('guest') && memToPersist) {
        try {
          const targetDocId = resolveDocIdForScene(canonicalSceneId);
          const memoryDocRef = doc(db, 'users', userId, 'memories', targetDocId);

          const preferredTake = updatedTakes.find((t) => t.id === takeId);
          const payload: Record<string, any> = {
            sceneId: canonicalSceneId,
            promptId: mappedPromptId || canonicalSceneId,
            takes: updatedTakes,
            preferredTakeId: takeId,
            activeTakeId: takeId,
            updatedAt: nowIso,
          };

          if (preferredTake?.durationSeconds) {
            payload.duration = preferredTake.durationSeconds;
          }

          if (preferredTake?.mediaUrl) {
            if (preferredTake.mediaMode === 'video') {
              payload.videoUrl = preferredTake.mediaUrl;
            } else {
              payload.audioUrl = preferredTake.mediaUrl;
            }
          }

          await setDoc(memoryDocRef, payload, { merge: true });

          if (memoirId) {
            const legacyDocRef = doc(
              db,
              'users',
              userId,
              'memoirs',
              memoirId,
              'scenes',
              canonicalSceneId
            );
            await setDoc(legacyDocRef, payload, { merge: true });
          }
        } catch (cloudErr) {
          console.error('[useCurriculumVault] Failed to persist preferred take to Firestore:', cloudErr);
        }
      }
    },
    [scenes, getSceneMemory, userId, memoirId, resolveDocIdForScene]
  );

  const addBonusMemoryNote = useCallback(
    async (
      sceneId: string,
      note: Omit<BonusMemoryNote, 'id' | 'createdAt'>
    ): Promise<void> => {
      const sceneDef = resolveSceneFromPromptId(sceneId) || getSceneById(sceneId);
      const canonicalSceneId = sceneDef?.id || sceneId;
      const mappedPromptId = sceneDef?.promptId;

      const nowIso = new Date().toISOString();
      const newNote: BonusMemoryNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...note,
        createdAt: nowIso,
      };

      const current =
        scenesRef.current[canonicalSceneId] ||
        scenes[canonicalSceneId] ||
        getSceneMemory(canonicalSceneId);
      const updatedBonusNotes = [...(current.bonusNotes || []), newNote];
      const updatedMemory: UnifiedCurriculumMemory = {
        ...current,
        bonusNotes: updatedBonusNotes,
        lastModified: nowIso,
      };

      lastMutatedMemoryRef.current = updatedMemory;
      const nextScenes = {
        ...scenesRef.current,
        [canonicalSceneId]: updatedMemory,
      };
      if (mappedPromptId) nextScenes[mappedPromptId] = updatedMemory;
      scenesRef.current = nextScenes;

      setScenes((prev) => {
        const next = { ...prev, [canonicalSceneId]: updatedMemory };
        if (mappedPromptId) next[mappedPromptId] = updatedMemory;
        return next;
      });

      const memToPersist = updatedMemory;
      if (db && userId && !userId.startsWith('guest') && memToPersist) {
        try {
          const targetDocId = resolveDocIdForScene(canonicalSceneId);
          const memoryDocRef = doc(db, 'users', userId, 'memories', targetDocId);

          await setDoc(
            memoryDocRef,
            {
              sceneId: canonicalSceneId,
              promptId: mappedPromptId || canonicalSceneId,
              bonusNotes: memToPersist.bonusNotes,
              updatedAt: nowIso,
            },
            { merge: true }
          );

          if (memoirId) {
            const legacyDocRef = doc(
              db,
              'users',
              userId,
              'memoirs',
              memoirId,
              'scenes',
              canonicalSceneId
            );
            await setDoc(legacyDocRef, memToPersist, { merge: true });
          }
        } catch (cloudErr) {
          console.error('[useCurriculumVault] Failed to persist bonus note to Firestore:', cloudErr);
        }
      }
    },
    [scenes, getSceneMemory, userId, memoirId, resolveDocIdForScene]
  );

  const setStoryMoodTag = useCallback(
    async (sceneId: string, mood: StoryMoodTag): Promise<void> => {
      const sceneDef = resolveSceneFromPromptId(sceneId) || getSceneById(sceneId);
      const canonicalSceneId = sceneDef?.id || sceneId;
      const mappedPromptId = sceneDef?.promptId;

      const nowIso = new Date().toISOString();
      const current =
        scenesRef.current[canonicalSceneId] ||
        scenes[canonicalSceneId] ||
        getSceneMemory(canonicalSceneId);
      const updatedMemory: UnifiedCurriculumMemory = {
        ...current,
        moodTag: mood,
        lastModified: nowIso,
      };

      lastMutatedMemoryRef.current = updatedMemory;
      const nextScenes = {
        ...scenesRef.current,
        [canonicalSceneId]: updatedMemory,
      };
      if (mappedPromptId) nextScenes[mappedPromptId] = updatedMemory;
      scenesRef.current = nextScenes;

      setScenes((prev) => {
        const next = { ...prev, [canonicalSceneId]: updatedMemory };
        if (mappedPromptId) next[mappedPromptId] = updatedMemory;
        return next;
      });

      const memToPersist = updatedMemory;
      if (db && userId && !userId.startsWith('guest') && memToPersist) {
        try {
          const targetDocId = resolveDocIdForScene(canonicalSceneId);
          const memoryDocRef = doc(db, 'users', userId, 'memories', targetDocId);

          await setDoc(
            memoryDocRef,
            {
              sceneId: canonicalSceneId,
              promptId: mappedPromptId || canonicalSceneId,
              moodTag: mood,
              updatedAt: nowIso,
            },
            { merge: true }
          );

          if (memoirId) {
            const legacyDocRef = doc(
              db,
              'users',
              userId,
              'memoirs',
              memoirId,
              'scenes',
              canonicalSceneId
            );
            await setDoc(
              legacyDocRef,
              { moodTag: mood, lastModified: nowIso },
              { merge: true }
            );
          }
        } catch (cloudErr) {
          console.error('[useCurriculumVault] Failed to persist story mood tag to Firestore:', cloudErr);
        }
      }
    },
    [scenes, getSceneMemory, userId, memoirId, resolveDocIdForScene]
  );

  const activeSceneMemory = useMemo(() => {
    return getSceneMemory(activeSceneId);
  }, [getSceneMemory, activeSceneId]);

  const smartLandingTarget = useMemo((): ActIdentifier => {
    const mem = scenes[activeSceneId];
    if (!mem) return 'act1';
    if (mem.originSurface === 'fireside_mobile' || (mem.takes && mem.takes.length > 0)) {
      return 'act3';
    }
    return mem.smartLandingTarget || 'act1';
  }, [scenes, activeSceneId]);

  return {
    scenes,
    activeSceneId,
    setActiveSceneId,
    activeSceneMemory,
    smartLandingTarget,
    isLoading,
    totalScenes,
    completedScenes,
    vaultProgressPercent,
    nextPendingSceneId,
    getSceneMemory,
    saveSceneTake,
    promotePreferredTake,
    addBonusMemoryNote,
    setStoryMoodTag,
  };
}

export default useCurriculumVault;
