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
  EditingAuthority,
  SurfaceOrigin,
  MemoirReel,
  resolveEditingAuthority,
  MemoirTakeStatus,
} from '@/types/curriculum';

export { resolveEditingAuthority } from '@/types/curriculum';
export type { StoryMoodTag, EditingAuthority, SurfaceOrigin, MemoirReel, MemoirTakeStatus } from '@/types/curriculum';

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
    options?: {
      photos?: any[];
      prose?: string;
      title?: string;
      originalHook?: string;
      description?: string;
      sensoryAnchors?: any;
      sensorySparks?: string[];
      editingAuthority?: EditingAuthority;
    }
  ) => Promise<void>;
  /** Discards a specific take (or active take) universally with Rule 14 prose preservation (MW-88-T5 / MW-88-T7) */
  discardSceneTake: (sceneId: string, takeId?: string) => Promise<void>;
  /** Updates scene narrative prose from Fireside Armchair Script Editor with 0ms optimistic UI and sensoryAnchors preservation (MW-88-T7) */
  updateSceneProse: (sceneId: string, updatedProseText: string) => Promise<void>;
  /** Designates a target take as preferred master reel stream */
  promotePreferredTake: (sceneId: string, takeId: string) => Promise<void>;
  /** Adds a non-destructive additive note or photo without mutating the master reel */
  addBonusMemoryNote: (
    sceneId: string,
    note: Omit<BonusMemoryNote, 'id' | 'createdAt'>
  ) => Promise<void>;
  /** Sets emotional mood resonance tag ('joyful' | 'reflective' | 'nostalgic') */
  setStoryMoodTag: (sceneId: string, mood: StoryMoodTag) => Promise<void>;
  /** Sets provenance metadata to 'desktop_locked' when authored/elevated on Desktop Soundstage (Rule 12 Optimistic UI) */
  elevateToStudioMaster: (sceneId: string) => Promise<void>;
  /** Reorders takes in the selection room and persists visual sequence order (MW-106) */
  reorderSceneTakes: (sceneId: string, orderedTakeIds: string[]) => Promise<void>;
  /** Safely discards a take with active master interlock shield (MW-106) */
  safeDiscardTake: (
    sceneId: string,
    discardTakeId: string,
    fallbackMasterTakeId?: string
  ) => Promise<void>;
  /** Restores a soft-discarded outtake back to alternate takes stack (MW-107) */
  restoreOuttakeTake: (sceneId: string, takeId: string) => Promise<void>;
}

/**
 * Deterministic flat list of all scenes across the 6-part master curriculum spine
 */
export const ALL_CURRICULUM_SCENES = MASTER_STORY_STRUCTURE.flatMap((part) => part.scenes);
export const TOTAL_CURRICULUM_SCENES = ALL_CURRICULUM_SCENES.length;

/**
 * Pure evaluation helper determining whether a scene has achieved captured/mastered completion
 */
export function isSceneCompleted(memory?: Partial<UnifiedCurriculumMemory> | null): boolean {
  if (!memory) return false;

  const hasTakes = Array.isArray(memory.takes);
  const activeTakes = hasTakes
    ? memory.takes!.filter((t) => t.status !== 'outtake' && t.status !== 'purged')
    : [];

  // 0. MW-107 Invariant: If takes array was populated but ALL takes are soft-discarded outtakes
  // and no active media URL exists, the scene is reset to an unrecorded slate
  if (hasTakes && memory.takes!.length > 0 && activeTakes.length === 0 && !memory.videoUrl && !memory.audioUrl) {
    return false;
  }

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

  // 3. Multi-take physical presence or direct media URL check (MW-88-T6 / MW-107)
  if (activeTakes.length > 0) {
    return true;
  }
  if (Boolean(memory.videoUrl || memory.audioUrl)) {
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
  const selfHealedDocsRef = useRef<Set<string>>(new Set());

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
            // Amendment 1: Self-Healing Schema Hydration (MW-106)
            // If takes array is empty in cloud doc but videoUrl or audioUrl is present, synthesise and persist an anchor take
            if (rawTakes.length === 0 && (data.videoUrl || data.audioUrl)) {
              const legacyMasterTake: MemoirTake = {
                id: 'take_legacy_desktop_master',
                takeNumber: 1,
                source: data.videoUrl ? 'soundstage_desktop' : 'fireside_mobile',
                mediaMode: data.videoUrl ? 'video' : 'audio',
                mediaUrl: data.videoUrl || data.audioUrl,
                url: data.videoUrl || data.audioUrl,
                durationSeconds: data.duration || 60,
                createdAt: data.updatedAt || data.createdAt || new Date().toISOString(),
                label: data.videoUrl ? 'Desktop Soundstage Master Reel' : 'Fireside Spoken Memoir',
                isPreferred: true,
                order: 1,
                role: 'master_cut',
              };
              rawTakes.push(legacyMasterTake);

              // Background non-blocking self-healing persistence to Firestore
              if (
                !selfHealedDocsRef.current.has(docSnap.id) &&
                db &&
                userId &&
                !userId.startsWith('guest')
              ) {
                selfHealedDocsRef.current.add(docSnap.id);
                void setDoc(
                  docSnap.ref,
                  {
                    takes: [legacyMasterTake],
                    activeTakeId: legacyMasterTake.id,
                    preferredTakeId: legacyMasterTake.id,
                    updatedAt: new Date().toISOString(),
                  },
                  { merge: true }
                ).catch((err) => {
                  console.warn('[useCurriculumVault] Self-healing take hydration write warning:', err);
                });
              }
            }
            // MW-107: Normalize take status (master, alternate, outtake, purged)
            const takes: MemoirTake[] = rawTakes.map((t: any, idx: number) => {
              const inferredStatus: MemoirTakeStatus =
                t.status || (t.isPreferred ? 'master' : 'alternate');
              return {
                ...t,
                status: inferredStatus,
                role: inferredStatus === 'master' ? 'master_cut' : (t.role || 'alternate'),
                isPreferred: inferredStatus === 'master',
                order: t.order ?? idx + 1,
              };
            });

            const activeTakes = takes.filter((t) => t.status !== 'outtake' && t.status !== 'purged');
            const preferredTake =
              activeTakes.find((t) => t.status === 'master') ||
              activeTakes.find((t) => t.id === data.activeTakeId || t.id === data.preferredTakeId) ||
              activeTakes.find((t) => t.isPreferred) ||
              activeTakes[activeTakes.length - 1] ||
              null;

            const normalized: UnifiedCurriculumMemory = {
              id: docSnap.id,
              userId,
              sceneId: canonicalSceneId,
              partNumber: data.partNumber || sceneDef?.partNumber || 1,
              sceneNumber: data.sceneNumber || sceneDef?.sceneNumber || 1,
              sceneTitle: data.title || data.sceneTitle || sceneDef?.title || canonicalSceneId,
              prose: data.prose || data.description || '',
              currentStatus:
                activeTakes.length === 0 && (data.status === 'draft' || !data.videoUrl)
                  ? 'ready_for_action'
                  : data.currentStatus ||
                    (data.status === 'pre-release' || data.status === 'published'
                      ? 'mastered'
                      : computedActs.includes('act2') || activeTakes.length > 0
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
              surfaceOrigin:
                data.surfaceOrigin ||
                (data.originSurface === 'fireside_mobile' ? 'fireside_mobile' : 'desktop_soundstage'),
              editingAuthority: resolveEditingAuthority(data),
              elevatedAt: typeof data.elevatedAt === 'number' ? data.elevatedAt : undefined,
              productionStage: typeof data.productionStage === 'number' ? data.productionStage : undefined,
              activeVision: data.activeVision,
              activeVisionLabel: data.activeVisionLabel,
              originalHook: data.originalHook,
              sensoryAnchors: data.sensoryAnchors,
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
      options?: {
        photos?: any[];
        prose?: string;
        title?: string;
        originalHook?: string;
        description?: string;
        sensoryAnchors?: any;
        sensorySparks?: string[];
        editingAuthority?: EditingAuthority;
      }
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

      const activeTakesBefore = existingTakes.filter(
        (t) => t.status !== 'outtake' && t.status !== 'purged'
      );
      const isFirstActiveTake = activeTakesBefore.length === 0;
      const shouldBePreferred =
        take.isPreferred !== undefined ? Boolean(take.isPreferred) : isFirstActiveTake;

      const inferredStatus: MemoirTakeStatus =
        take.status || (shouldBePreferred ? 'master' : 'alternate');

      const takeWithLabel: MemoirTake = {
        ...take,
        label:
          take.label ||
          `Take ${take.takeNumber} (${take.mediaMode === 'video' ? 'Fireside Video' : 'Fireside Voice'})`,
        isPreferred: shouldBePreferred,
        status: inferredStatus,
        role: shouldBePreferred ? 'master_cut' : (take.role || 'alternate'),
        order: take.order ?? existingTakes.length + 1,
      };

      const takeExists = existingTakes.some((t) => t.id === take.id);
      const updatedTakes: MemoirTake[] = takeExists
        ? existingTakes.map((t) => {
            if (t.id === take.id) return { ...t, ...takeWithLabel };
            if (shouldBePreferred && t.status !== 'outtake' && t.status !== 'purged') {
              return { ...t, isPreferred: false, status: 'alternate' as MemoirTakeStatus, role: 'alternate' as const };
            }
            return t;
          })
        : [
            ...existingTakes.map((t) =>
              shouldBePreferred && t.status !== 'outtake' && t.status !== 'purged'
                ? { ...t, isPreferred: false, status: 'alternate' as MemoirTakeStatus, role: 'alternate' as const }
                : t
            ),
            takeWithLabel,
          ];

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
      const mergedProse = options?.prose ?? current.prose ?? '';

      const resolvedAuthority: EditingAuthority =
        options?.editingAuthority ||
        (current.editingAuthority === 'desktop_locked' ? 'desktop_locked' : 'fireside_flexible');

      const updatedMemory: UnifiedCurriculumMemory = {
        ...current,
        prose: mergedProse,
        title: options?.title ?? current.title ?? current.sceneTitle,
        sceneTitle: options?.title ?? current.sceneTitle,
        originalHook: options?.originalHook ?? current.originalHook,
        description: options?.description ?? current.description ?? mergedProse,
        sensoryAnchors: options?.sensoryAnchors ?? current.sensoryAnchors,
        sensorySparks: options?.sensorySparks ?? current.sensorySparks,
        photos: mergedPhotos,
        takes: updatedTakes,
        activeTakeId: shouldBePreferred ? take.id : current.activeTakeId || take.id,
        videoUrl:
          take.mediaMode === 'video'
            ? take.mediaUrl || (take as any).videoUrl || null
            : current.videoUrl || null,
        audioUrl:
          take.mediaMode === 'audio'
            ? take.mediaUrl || (take as any).audioUrl || null
            : current.audioUrl || null,
        currentStatus: current.currentStatus === 'mastered' ? 'mastered' : 'captured',
        editingAuthority: resolvedAuthority,
        surfaceOrigin: current.surfaceOrigin || 'fireside_mobile',
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
            surfaceOrigin: memToPersist.surfaceOrigin || 'fireside_mobile',
            editingAuthority: resolvedAuthority,
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

  const safeDiscardTake = useCallback(
    async (
      sceneId: string,
      discardTakeId: string,
      fallbackMasterTakeId?: string
    ): Promise<void> => {
      const sceneDef = resolveSceneFromPromptId(sceneId) || getSceneById(sceneId);
      const canonicalSceneId = sceneDef?.id || sceneId;
      const mappedPromptId = sceneDef?.promptId;

      const current =
        scenesRef.current[canonicalSceneId] ||
        scenes[canonicalSceneId] ||
        getSceneMemory(canonicalSceneId);

      const existingTakes = current.takes || [];
      const targetTake = existingTakes.find((t) => t.id === discardTakeId);
      if (!targetTake) return;

      const nowEpoch = Date.now();
      const nowIso = new Date(nowEpoch).toISOString();

      // MW-107: Soft-discard target take by transitioning status to 'outtake' (persisted for Cutting Room Floor)
      const markedTakes: MemoirTake[] = existingTakes.map((t) => {
        if (t.id === discardTakeId) {
          return {
            ...t,
            isPreferred: false,
            status: 'outtake' as MemoirTakeStatus,
            role: 'alternate' as const,
            discardedAt: nowIso,
          };
        }
        return t;
      });

      const remainingActiveTakes = markedTakes.filter(
        (t) => t.status !== 'outtake' && t.status !== 'purged'
      );

      let updatedMemory: UnifiedCurriculumMemory;
      let payload: Record<string, any>;

      if (remainingActiveTakes.length === 0) {
        // Case A: Discarding the sole active take -> Atomically execute resetToDraftPayload (MW-107)
        // Global document downgrade across all queries while preserving Rule 14 prose
        updatedMemory = {
          ...current,
          takes: markedTakes,
          activeTakeId: null,
          videoUrl: null,
          audioUrl: null,
          status: 'draft',
          currentStatus: 'ready_for_action',
          actsCompleted: ['act1'],
          productionStage: 1,
          smartLandingTarget: 'act1',
          lastEditedSurface: 'fireside_mobile',
          updatedAt: nowEpoch,
          lastModified: nowIso,
          // Immutable Rule 14 Invariants strictly preserved:
          prose: current.prose,
          title: current.title ?? current.sceneTitle,
          originalHook: current.originalHook,
          description: current.description ?? current.prose,
          sensoryAnchors: current.sensoryAnchors ?? current.sensorySparks,
          bonusNotes: current.bonusNotes ?? [],
          editingAuthority: current.editingAuthority || 'fireside_flexible',
        };

        payload = {
          takes: markedTakes,
          activeTakeId: null,
          preferredTakeId: null,
          videoUrl: null,
          audioUrl: null,
          status: 'draft',
          currentStatus: 'ready_for_action',
          actsCompleted: ['act1'],
          productionStage: 1,
          smartLandingTarget: 'act1',
          lastEditedSurface: 'fireside_mobile',
          updatedAt: nowEpoch,
          lastModified: nowIso,
          prose: current.prose,
          title: current.title ?? current.sceneTitle,
          originalHook: current.originalHook,
          description: current.description ?? current.prose,
          sensoryAnchors: current.sensoryAnchors ?? current.sensorySparks,
          bonusNotes: current.bonusNotes ?? [],
          editingAuthority: current.editingAuthority || 'fireside_flexible',
        };
      } else {
        // Case B: Multiple active takes exist -> Active Master Discard Interlock (MW-106 / MW-107)
        const wasMaster =
          targetTake.status === 'master' ||
          targetTake.isPreferred ||
          current.activeTakeId === discardTakeId;

        let newMasterId = fallbackMasterTakeId;
        if (wasMaster) {
          if (!newMasterId || !remainingActiveTakes.some((t) => t.id === newMasterId)) {
            const existingPreferred = remainingActiveTakes.find(
              (t) => t.isPreferred || t.status === 'master'
            );
            newMasterId = existingPreferred
              ? existingPreferred.id
              : remainingActiveTakes[remainingActiveTakes.length - 1].id;
          }
        }

        const reconciledTakes: MemoirTake[] = markedTakes.map((t) => {
          if (t.status === 'outtake' || t.status === 'purged') {
            return t;
          }
          if (wasMaster) {
            const isElected = t.id === newMasterId;
            return {
              ...t,
              isPreferred: isElected,
              status: isElected ? 'master' : 'alternate',
              role: isElected ? 'master_cut' : 'alternate',
            };
          }
          return t;
        });

        const activeMaster =
          reconciledTakes.find((t) => t.status === 'master') ||
          reconciledTakes.find((t) => t.isPreferred && t.status !== 'outtake') ||
          remainingActiveTakes[remainingActiveTakes.length - 1];

        const resolvedVideoUrl =
          (activeMaster as any).videoUrl !== undefined
            ? (activeMaster as any).videoUrl || null
            : activeMaster.mediaMode === 'video'
            ? activeMaster.mediaUrl || null
            : null;
        const resolvedAudioUrl =
          (activeMaster as any).audioUrl !== undefined
            ? (activeMaster as any).audioUrl || null
            : activeMaster.mediaMode === 'audio'
            ? activeMaster.mediaUrl || null
            : null;

        updatedMemory = {
          ...current,
          takes: reconciledTakes,
          activeTakeId: activeMaster.id,
          videoUrl: resolvedVideoUrl,
          audioUrl: resolvedAudioUrl,
          lastEditedSurface: 'fireside_mobile',
          updatedAt: nowEpoch,
          lastModified: nowIso,
          prose: current.prose,
          title: current.title ?? current.sceneTitle,
          originalHook: current.originalHook,
          description: current.description ?? current.prose,
          sensoryAnchors: current.sensoryAnchors ?? current.sensorySparks,
          bonusNotes: current.bonusNotes ?? [],
          editingAuthority: current.editingAuthority || 'fireside_flexible',
        };

        payload = {
          takes: reconciledTakes,
          activeTakeId: activeMaster.id,
          preferredTakeId: activeMaster.id,
          videoUrl: resolvedVideoUrl,
          audioUrl: resolvedAudioUrl,
          duration: activeMaster.durationSeconds,
          lastEditedSurface: 'fireside_mobile',
          updatedAt: nowEpoch,
          lastModified: nowIso,
          prose: current.prose,
          title: current.title ?? current.sceneTitle,
          originalHook: current.originalHook,
          description: current.description ?? current.prose,
          sensoryAnchors: current.sensoryAnchors ?? current.sensorySparks,
          bonusNotes: current.bonusNotes ?? [],
          editingAuthority: current.editingAuthority || 'fireside_flexible',
        };
      }

      // Rule 12 Optimistic UI: 0ms synchronous state update before network resolution
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

      const memToPersist = updatedMemory;
      if (db && userId && !userId.startsWith('guest') && memToPersist) {
        try {
          const targetDocId = resolveDocIdForScene(canonicalSceneId);
          const memoryDocRef = doc(db, 'users', userId, 'memories', targetDocId);

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
          console.error('[useCurriculumVault] Failed to persist discarded take to Firestore:', cloudErr);
        }
      }
    },
    [scenes, getSceneMemory, userId, memoirId, resolveDocIdForScene]
  );

  const discardSceneTake = useCallback(
    async (sceneId: string, takeId?: string): Promise<void> => {
      const sceneDef = resolveSceneFromPromptId(sceneId) || getSceneById(sceneId);
      const canonicalSceneId = sceneDef?.id || sceneId;
      const current =
        scenesRef.current[canonicalSceneId] ||
        scenes[canonicalSceneId] ||
        getSceneMemory(canonicalSceneId);
      const targetTakeId =
        takeId ||
        current.activeTakeId ||
        (current.takes && current.takes[current.takes.length - 1]?.id);
      if (!targetTakeId) return;
      await safeDiscardTake(sceneId, targetTakeId);
    },
    [safeDiscardTake, scenes, getSceneMemory]
  );

  const reorderSceneTakes = useCallback(
    async (sceneId: string, orderedTakeIds: string[]): Promise<void> => {
      const sceneDef = resolveSceneFromPromptId(sceneId) || getSceneById(sceneId);
      const canonicalSceneId = sceneDef?.id || sceneId;
      const mappedPromptId = sceneDef?.promptId;

      const nowIso = new Date().toISOString();
      const current =
        scenesRef.current[canonicalSceneId] ||
        scenes[canonicalSceneId] ||
        getSceneMemory(canonicalSceneId);

      const existingTakes = current.takes || [];
      const takeMap = new Map(existingTakes.map((t) => [t.id, t]));
      const reordered: MemoirTake[] = [];
      orderedTakeIds.forEach((id, idx) => {
        const t = takeMap.get(id);
        if (t) {
          reordered.push({ ...t, order: idx + 1 });
          takeMap.delete(id);
        }
      });
      // Append any takes that were omitted
      Array.from(takeMap.values()).forEach((t) => {
        reordered.push({ ...t, order: reordered.length + 1 });
      });

      const updatedMemory: UnifiedCurriculumMemory = {
        ...current,
        takes: reordered,
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

      if (db && userId && !userId.startsWith('guest')) {
        try {
          const targetDocId = resolveDocIdForScene(canonicalSceneId);
          const memoryDocRef = doc(db, 'users', userId, 'memories', targetDocId);
          await setDoc(memoryDocRef, { takes: reordered, updatedAt: nowIso }, { merge: true });
        } catch (cloudErr) {
          console.error('[useCurriculumVault] Failed to persist reordered takes to Firestore:', cloudErr);
        }
      }
    },
    [scenes, getSceneMemory, userId, resolveDocIdForScene]
  );

  const updateSceneProse = useCallback(
    async (sceneId: string, updatedProseText: string): Promise<void> => {
      const sceneDef = resolveSceneFromPromptId(sceneId) || getSceneById(sceneId);
      const canonicalSceneId = sceneDef?.id || sceneId;
      const mappedPromptId = sceneDef?.promptId;

      const current =
        scenesRef.current[canonicalSceneId] ||
        scenes[canonicalSceneId] ||
        getSceneMemory(canonicalSceneId);

      const nowEpoch = Date.now();
      const nowIso = new Date(nowEpoch).toISOString();
      const preservedSensoryAnchors =
        current.sensoryAnchors !== undefined ? current.sensoryAnchors : [];

      const updatedMemory: UnifiedCurriculumMemory = {
        ...current,
        prose: updatedProseText,
        description: updatedProseText,
        sensoryAnchors: preservedSensoryAnchors,
        lastEditedSurface: 'fireside_mobile',
        updatedAt: nowEpoch,
        lastModified: nowIso,
      };

      const payload: Record<string, any> = {
        prose: updatedProseText,
        description: updatedProseText, // Rule 14 dual-sync
        sensoryAnchors: preservedSensoryAnchors,
        lastEditedSurface: 'fireside_mobile',
        updatedAt: nowEpoch,
      };

      // Rule 12 Optimistic UI: 0ms synchronous state update before network resolution
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

      const memToPersist = updatedMemory;
      if (db && userId && !userId.startsWith('guest') && memToPersist) {
        try {
          const targetDocId = resolveDocIdForScene(canonicalSceneId);
          const memoryDocRef = doc(db, 'users', userId, 'memories', targetDocId);

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
          console.error('[useCurriculumVault] Failed to persist updated prose to Firestore:', cloudErr);
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
      const updatedTakes: MemoirTake[] = (current.takes || []).map((t) => {
        if (t.status === 'outtake' || t.status === 'purged') {
          return t; // preserve outtake status
        }
        const isTarget = t.id === takeId;
        return {
          ...t,
          isPreferred: isTarget,
          status: (isTarget ? 'master' : 'alternate') as MemoirTakeStatus,
          role: isTarget ? 'master_cut' : 'alternate',
        };
      });

      const preferredTake = updatedTakes.find((t) => t.id === takeId);
      const resolvedVideoUrl =
        (preferredTake as any)?.videoUrl ||
        (preferredTake?.mediaMode === 'video' ? preferredTake.mediaUrl : null) ||
        preferredTake?.url ||
        null;
      const resolvedAudioUrl =
        (preferredTake as any)?.audioUrl ||
        (preferredTake?.mediaMode === 'audio' ? preferredTake.mediaUrl : null) ||
        null;

      const updatedMemory: UnifiedCurriculumMemory = {
        ...current,
        takes: updatedTakes,
        activeTakeId: takeId,
        videoUrl: resolvedVideoUrl ?? current.videoUrl,
        audioUrl: resolvedAudioUrl ?? current.audioUrl,
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

          if (resolvedVideoUrl) {
            payload.videoUrl = resolvedVideoUrl;
          }
          if (resolvedAudioUrl) {
            payload.audioUrl = resolvedAudioUrl;
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

  const elevateToStudioMaster = useCallback(
    async (sceneId: string): Promise<void> => {
      const sceneDef = resolveSceneFromPromptId(sceneId) || getSceneById(sceneId);
      const canonicalSceneId = sceneDef?.id || sceneId;
      const mappedPromptId = sceneDef?.promptId;

      const elevatedTimestamp = Date.now();
      const nowIso = new Date(elevatedTimestamp).toISOString();
      const current =
        scenesRef.current[canonicalSceneId] ||
        scenes[canonicalSceneId] ||
        getSceneMemory(canonicalSceneId);

      // Rule 12 Optimistic UI: Immediately update local state to 'desktop_locked'
      const updatedMemory: UnifiedCurriculumMemory = {
        ...current,
        editingAuthority: 'desktop_locked',
        elevatedAt: elevatedTimestamp,
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
              editingAuthority: 'desktop_locked',
              elevatedAt: elevatedTimestamp,
              updatedAt: nowIso,
              lastModified: nowIso,
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
              {
                editingAuthority: 'desktop_locked',
                elevatedAt: elevatedTimestamp,
                lastModified: nowIso,
              },
              { merge: true }
            );
          }
        } catch (cloudErr) {
          console.error('[useCurriculumVault] Failed to persist studio elevation to Firestore:', cloudErr);
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

  const restoreOuttakeTake = useCallback(
    async (sceneId: string, takeId: string): Promise<void> => {
      const sceneDef = resolveSceneFromPromptId(sceneId) || getSceneById(sceneId);
      const canonicalSceneId = sceneDef?.id || sceneId;
      const mappedPromptId = sceneDef?.promptId;

      const current =
        scenesRef.current[canonicalSceneId] ||
        scenes[canonicalSceneId] ||
        getSceneMemory(canonicalSceneId);

      const existingTakes = current.takes || [];
      const targetTake = existingTakes.find((t) => t.id === takeId);
      if (!targetTake || targetTake.status !== 'outtake') return;

      const activeTakesBefore = existingTakes.filter(
        (t) => t.status !== 'outtake' && t.status !== 'purged'
      );
      const wasEmpty = activeTakesBefore.length === 0;

      // If active stack was empty, restoring promotes this take to 'master'; otherwise 'alternate'
      const restoredStatus: MemoirTakeStatus = wasEmpty ? 'master' : 'alternate';
      const nowEpoch = Date.now();
      const nowIso = new Date(nowEpoch).toISOString();

      const updatedTakes: MemoirTake[] = existingTakes.map((t) => {
        if (t.id === takeId) {
          const { discardedAt, ...rest } = t;
          return {
            ...rest,
            status: restoredStatus,
            isPreferred: wasEmpty,
            role: wasEmpty ? 'master_cut' : 'alternate',
            order: activeTakesBefore.length + 1,
          };
        }
        return t;
      });

      const activeMaster = wasEmpty
        ? updatedTakes.find((t) => t.id === takeId)!
        : updatedTakes.find((t) => t.status === 'master') ||
          updatedTakes.find((t) => t.isPreferred && t.status !== 'outtake') ||
          targetTake;

      const resolvedVideoUrl =
        activeMaster.mediaMode === 'video'
          ? activeMaster.mediaUrl || (activeMaster as any).url
          : (activeMaster as any).videoUrl || null;
      const resolvedAudioUrl =
        activeMaster.mediaMode === 'audio'
          ? activeMaster.mediaUrl || (activeMaster as any).url
          : (activeMaster as any).audioUrl || null;

      const updatedMemory: UnifiedCurriculumMemory = {
        ...current,
        takes: updatedTakes,
        activeTakeId: activeMaster.id,
        videoUrl: resolvedVideoUrl,
        audioUrl: resolvedAudioUrl,
        ...(wasEmpty
          ? {
              status: 'pre-release',
              currentStatus: 'captured',
              productionStage: 2,
              actsCompleted: ['act1', 'act2'],
              smartLandingTarget: 'act3',
            }
          : {}),
        lastEditedSurface: 'fireside_mobile',
        updatedAt: nowEpoch,
        lastModified: nowIso,
      };

      // Rule 12 Optimistic UI: 0ms synchronous state update
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

      // Persist to Firestore
      if (db && userId && !userId.startsWith('guest')) {
        try {
          const targetDocId = resolveDocIdForScene(canonicalSceneId);
          const memoryDocRef = doc(db, 'users', userId, 'memories', targetDocId);
          const payload: Record<string, any> = {
            takes: updatedTakes,
            activeTakeId: activeMaster.id,
            preferredTakeId: activeMaster.id,
            videoUrl: resolvedVideoUrl,
            audioUrl: resolvedAudioUrl,
            updatedAt: nowEpoch,
            lastModified: nowIso,
            ...(wasEmpty
              ? {
                  status: 'pre-release',
                  currentStatus: 'captured',
                  productionStage: 2,
                  actsCompleted: ['act1', 'act2'],
                  smartLandingTarget: 'act3',
                }
              : {}),
          };
          await setDoc(memoryDocRef, payload, { merge: true });
        } catch (err) {
          console.error('[useCurriculumVault] Failed to persist restored take to Firestore:', err);
        }
      }
    },
    [userId, db, resolveDocIdForScene, getSceneMemory, scenes]
  );

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
    discardSceneTake,
    updateSceneProse,
    promotePreferredTake,
    addBonusMemoryNote,
    setStoryMoodTag,
    elevateToStudioMaster,
    reorderSceneTakes,
    safeDiscardTake,
    restoreOuttakeTake,
  };
}

export default useCurriculumVault;
