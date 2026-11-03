'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Memory, PromptGroup, StoryRequest } from '@/types';
import { MASTER_STORY_STRUCTURE, resolveSceneFromPromptId, resolvePromptIdFromSceneId, getSceneById } from '@/lib/curriculum/masterStoryStructure';
import { getQaFixtureDocId, createQaFixtureMemory } from '@/lib/qa/qaFixtureSeeder';
import type { ScriptSyncMessage } from '@/components/studio/shared/NarrativeScriptInput';
import { useLanguage } from '@/hooks/useLanguage';

export interface UnifiedChapter {
  id: string;
  title: string;
  subtitle?: string;
  prompts: CorrelatedPrompt[];
  isCompleted: boolean;
  publishedCount: number;
}

export interface CorrelatedPrompt {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  memory?: Memory;
  requests: StoryRequest[];
}

export function useStudioData(userId: string | undefined) {
  const { user, loading } = useAuth();
  const { mode } = useLanguage();
  useEffect(() => {
    // Mode sync logic could go here if needed, but logging is removed
  }, [mode]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [requests, setRequests] = useState<StoryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cross-Surface Broadcast Listener: Live-update memories when typing in another tab (e.g. Fireside)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('mw_script_sync');
      channel.onmessage = (event: MessageEvent<ScriptSyncMessage>) => {
        const msg = event.data;
        if (!msg || !msg.sceneId || typeof msg.prose !== 'string') return;
        setMemories((prev) => {
          const index = prev.findIndex((m) => m.id === msg.sceneId || (m as any).sceneId === msg.sceneId || m.promptId === msg.sceneId);
          if (index !== -1) {
            const next = [...prev];
            next[index] = {
              ...next[index],
              prose: msg.prose,
              description: msg.prose,
              status: next[index].status || 'draft',
              updatedAt: new Date(msg.timestamp || Date.now()).toISOString(),
            };
            return next;
          } else {
            const resolvedPromptId = resolvePromptIdFromSceneId(msg.sceneId);
            const sceneDef = getSceneById(msg.sceneId);
            const newMem: Memory = {
              id: msg.sceneId,
              promptId: resolvedPromptId || msg.sceneId,
              sceneId: msg.sceneId,
              title: sceneDef?.title || 'Draft Scene',
              prose: msg.prose,
              description: msg.prose,
              status: 'draft',
              productionStage: 0,
              createdAt: new Date(msg.timestamp || Date.now()).toISOString(),
              updatedAt: new Date(msg.timestamp || Date.now()).toISOString(),
            } as any;
            return [newMem, ...prev];
          }
        });
      };
    } catch {}
    return () => {
      try { channel?.close(); } catch {}
    };
  }, []);
  
  // Guard refs to track last known data strings
  const lastMemoriesJSON = useRef<string>('');
  const lastRequestsJSON = useRef<string>('');

  const hasSkippedRef = useRef(false);

  useEffect(() => {
    // If auth is still loading, keep loading state true and wait
    if (loading) {
      setIsLoading(true);
      return;
    }

    if (!userId || userId === 'guest') {
      setMemories([]);
      setRequests([]);
      setIsLoading(false);
      return;
    }
    
    // Reset skip ref if userId becomes valid
    hasSkippedRef.current = false;

    // Auth sync verification logic could go here, but logging is removed

    setIsLoading(true);

    // Subscribe to Memories (Client-side sorted to prevent silent drops on missing createdAt)
    const memoriesRef = collection(db, 'users', userId, 'memories');
    
    const unsubMemories = onSnapshot(memoriesRef, (snapshot) => {
      const mems = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Memory))
        .filter(m => !m.isFlightSimulator && (m as any).sceneId !== 'prologue-flight-simulator' && m.id !== 'first_flight_rehearsal')
        .sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
          return timeB - timeA;
        });
      const memsJSON = JSON.stringify(mems);
      
      if (memsJSON !== lastMemoriesJSON.current) {
        lastMemoriesJSON.current = memsJSON;
        setMemories(mems);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching memories:", error);
      setIsLoading(false);
    });

    // Subscribe to Requests (Host Only)
    let unsubRequests = () => {};
    if (user && user.uid === userId) {
      const requestsRef = collection(db, 'users', userId, 'requests');
      const qRequests = query(requestsRef, orderBy('createdAt', 'desc'));
      
      unsubRequests = onSnapshot(qRequests, (snapshot) => {
        const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoryRequest));
        const reqsJSON = JSON.stringify(reqs);

        if (reqsJSON !== lastRequestsJSON.current) {
          lastRequestsJSON.current = reqsJSON;
          setRequests(reqs);
        }
      }, (error) => {
        console.error("Error fetching requests:", error);
      });
    }

    return () => {
      unsubMemories();
      unsubRequests();
    };
  }, [userId, user?.uid]);

  const chapters = useMemo(() => {
    // Clean Slate & QA Seed Overrides (Staging Testing Shield - GOV-MW-163)
    let cleanSlateSceneId: string | null = null;
    let isGlobalCleanSlate = false;
    let qaSeedItemId: string | null = null;
    let qaTargetSceneId: string | null = null;

    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('clean_slate') === 'true') {
          cleanSlateSceneId = searchParams.get('id') || searchParams.get('prompt') || null;
          isGlobalCleanSlate = !cleanSlateSceneId;
        }
        qaSeedItemId = searchParams.get('qa_seed') || null;
        if (qaSeedItemId) {
          qaTargetSceneId = searchParams.get('id') || searchParams.get('prompt') || null;
        }
      } catch {}
    }

    return MASTER_STORY_STRUCTURE.map((part): UnifiedChapter => {
      // 1. Correlate canonical scenes defined in the master curriculum
      const canonicalPrompts = part.scenes.map((scene): CorrelatedPrompt => {
        // If clean_slate override is active for this scene or globally, return pristine unwritten state
        const isSceneCleanSlate = isGlobalCleanSlate || (cleanSlateSceneId !== null && (cleanSlateSceneId === scene.id || cleanSlateSceneId === scene.promptId));
        if (isSceneCleanSlate) {
          return {
            id: scene.promptId,
            title: scene.title,
            description: scene.subtitle,
            memory: undefined,
            requests: [],
          };
        }

        // QA Sandbox Fixture Override: If qa_seed is active for this scene, bind deterministic sandbox fixture
        if (qaSeedItemId) {
          const isTargetScene = !qaTargetSceneId || qaTargetSceneId === scene.id || qaTargetSceneId === scene.promptId;
          if (isTargetScene) {
            const fixtureId = getQaFixtureDocId(userId || 'guest', qaSeedItemId);
            const existingFixture = memories.find((m) => m.id === fixtureId);
            const boundMemory = existingFixture || createQaFixtureMemory({
              itemId: qaSeedItemId,
              userId: userId || 'anonymous',
              sceneId: scene.id,
              promptId: scene.promptId,
            });
            return {
              id: scene.promptId,
              title: scene.title,
              description: scene.subtitle,
              memory: boundMemory,
              requests: [],
            };
          }
        }

        // Trace forward: Follow the chain of memory pointer documents to find the latest leaf memory.
        // CANDIDATE RESOLUTION SHIELD: If multiple memory documents exist matching the prompt,
        // prioritise authentic non-test memories and completed/in-progress takes over unrecorded stage-0 test drafts.
        const candidateMemories = memories.filter((m) => {
          if (m.id === scene.id || m.id === scene.promptId) {
            return true;
          }
          if (m.promptId === scene.promptId || (m as any).sceneId === scene.id || m.promptId === scene.id) {
            return true;
          }
          if (m.promptId) {
            const resolved = resolveSceneFromPromptId(m.promptId);
            if (resolved && resolved.id === scene.id) return true;
          }
          return false;
        });

        let memory: Memory | undefined = candidateMemories.slice().sort((a, b) => {
          const aIsTest = a.id.includes('test') || (a as any).isTestFixture ? 1 : 0;
          const bIsTest = b.id.includes('test') || (b as any).isTestFixture ? 1 : 0;
          if (aIsTest !== bIsTest) return aIsTest - bIsTest;

          const aCompleted = (a.status === 'published' || a.status === 'pre-release' || (a.productionStage ?? 0) > 0) ? 1 : 0;
          const bCompleted = (b.status === 'published' || b.status === 'pre-release' || (b.productionStage ?? 0) > 0) ? 1 : 0;
          if (aCompleted !== bCompleted) return bCompleted - aCompleted;

          return 0; // retain default ordering (createdAt desc)
        })[0];

        if (memory) {
          const visited = new Set<string>();
          while (memory) {
            const current: Memory = memory as Memory;
            if (visited.has(current.id)) break;
            visited.add(current.id);
            const nextMemory = memories.find(m => m.promptId === current.id);
            if (nextMemory) {
              memory = nextMemory;
            } else {
              break;
            }
          }
        }
        const promptRequests = requests.filter(r => r.promptId === scene.promptId || r.promptId === scene.id);
        
        let promptTitle = scene.title;
        let promptSubtitle: string | undefined = undefined;
        let promptDescription = scene.subtitle;

        if (mode === 'gu') {
          promptTitle = scene.localizedTitles?.gu || scene.title;
          promptDescription = scene.subtitle;
        } else if (mode === 'dual') {
          promptTitle = scene.title;
          promptSubtitle = scene.localizedTitles?.gu || undefined;
          promptDescription = scene.subtitle;
        }

        return {
          id: scene.promptId || scene.id,
          title: promptTitle,
          subtitle: promptSubtitle,
          description: promptDescription,
          memory,
          requests: promptRequests,
        };
      });

      // 2. Correlate custom scenes created via [+ Add Scene] (Personal Production)
      const customMemories = memories.filter((m) => {
        const isCustom = m.promptId === 'custom' || (m as any).isCustom;
        const matchesGroup = (m as any).groupId === part.id;
        return isCustom && matchesGroup;
      });

      const customPrompts: CorrelatedPrompt[] = customMemories.map((cm) => {
        const promptRequests = requests.filter(
          (r) => (r as any).memoryId === cm.id || r.promptId === cm.id || r.promptId === 'custom'
        );
        return {
          id: cm.id,
          title: cm.title || 'Personal Production',
          subtitle: undefined,
          description: cm.description || (cm.prose ? cm.prose.replace(/<[^>]*>/g, '').slice(0, 100) : 'Personal Memoir Scene'),
          memory: cm,
          requests: promptRequests,
        };
      });

      const correlatedPrompts = [...canonicalPrompts, ...customPrompts];

      const publishedCount = correlatedPrompts.filter(p => p.memory?.status === 'published' || p.memory?.status === 'pre-release').length;
      const isCompleted = publishedCount >= part.scenes.length && part.scenes.length > 0;

      // Dynamic Title Logic
      let title = part.title;
      let subtitle: string | undefined = part.localizedTitles?.gu;

      if (mode === 'en') {
        title = part.title;
        subtitle = undefined;
      } else if (mode === 'gu') {
        title = part.localizedTitles?.gu || part.title;
        subtitle = undefined;
      } else if (mode === 'dual') {
        title = part.title;
        subtitle = part.localizedTitles?.gu;
      }

      return {
        id: part.id,
        title,
        subtitle,
        prompts: correlatedPrompts,
        publishedCount,
        isCompleted,
      };
    });
  }, [memories, requests, mode]);

  // Global Publish & Semantic Media Stats (AUDIT-MW-147)
  const stats = useMemo(() => {
    const published = memories.filter(m => m.status === 'published').length;
    const preRelease = memories.filter(m => m.status === 'pre-release').length;
    const drafts = memories.filter(m => m.status === 'draft').length;

    // Media Classification: Video vs Audio vs Text Drafts
    const isVideoMemory = (m: Memory) => {
      if (typeof m.videoUrl === 'string' && m.videoUrl.trim().length > 0) return true;
      if (Array.isArray(m.takes) && m.takes.some((t: any) => 
        (t.mediaMode === 'video' || Boolean(t.videoUrl)) && Boolean(t.mediaUrl || t.videoUrl || t.url)
      )) return true;
      return false;
    };

    const isAudioMemory = (m: Memory) => {
      if (isVideoMemory(m)) return false;
      if (typeof (m as any).audioUrl === 'string' && (m as any).audioUrl.trim().length > 0) return true;
      if (Array.isArray(m.takes) && m.takes.some((t: any) => 
        (t.mediaMode === 'audio' || Boolean((t as any).audioUrl)) && Boolean(t.mediaUrl || (t as any).audioUrl || t.url)
      )) return true;
      return false;
    };

    const videoCount = memories.filter(isVideoMemory).length;
    const audioCount = memories.filter(isAudioMemory).length;
    const recordedCount = videoCount + audioCount;
    const textDraftsCount = memories.filter(m => !isVideoMemory(m) && !isAudioMemory(m)).length;

    // Exclude demo module from total possible personal memoir scenes (31 narrative scenes)
    const totalPossible = MASTER_STORY_STRUCTURE.filter(p => !p.isDemo).reduce((acc, part) => acc + part.scenes.length, 0);

    return {
      published,
      preRelease,
      drafts,
      videoCount,
      audioCount,
      recordedCount,
      textDraftsCount,
      totalPossible,
      completionPercentage: totalPossible > 0 ? Math.round((published / totalPossible) * 100) : 0,
      totalRequests: requests.length
    };
  }, [memories, requests]);

  // Layer 4: Client-Side Anomaly Sentinel (TOOL-MW-145)
  // Compares authentic document count (M) with resolved card count (N) to detect document shadowing in real time.
  useEffect(() => {
    if (isLoading || !memories || memories.length === 0 || chapters.length === 0) return;
    if (typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('clean_slate') === 'true' || new URLSearchParams(window.location.search).get('qa_seed'))) return;

    const evaluation = evaluateDataShadowingAnomaly(memories, chapters);

    if (evaluation.hasAnomaly) {
      console.error('[CRITICAL_DATA_SHADOWING_ANOMALY]', {
        totalAuthenticDocs: evaluation.M,
        totalResolvedCards: evaluation.N,
        orphanedCount: evaluation.orphanedCount,
        unmappedDocIds: evaluation.orphanedDocs,
      });

      // Dispatch client telemetry payload to preserve trace
      if (typeof window !== 'undefined') {
        if ((window as any).mwTelemetry?.track) {
          (window as any).mwTelemetry.track('DATA_SHADOWING_ANOMALY_DETECTED', {
            severity: 'CRITICAL',
            orphanedDocIds: evaluation.orphanedDocs.map((d) => d.id),
            totalAuthenticDocs: evaluation.M,
            totalResolvedCards: evaluation.N,
            timestamp: Date.now(),
          });
        }
        fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'DATA_SHADOWING_ANOMALY_DETECTED',
            severity: 'CRITICAL',
            userId,
            orphanedDocIds: evaluation.orphanedDocs.map((d) => d.id),
            totalAuthenticDocs: evaluation.M,
            totalResolvedCards: evaluation.N,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      }
    }
  }, [isLoading, memories, chapters, userId]);

  const filteredMemories = useMemo(() => {
    if (typeof window === 'undefined') return memories;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('clean_slate') === 'true') {
        const cleanSlateSceneId = searchParams.get('id') || searchParams.get('prompt') || null;
        if (!cleanSlateSceneId) return [];
        return memories.filter((m) => {
          if (m.id === cleanSlateSceneId || (m as any).sceneId === cleanSlateSceneId || m.promptId === cleanSlateSceneId) {
            return false;
          }
          if (m.promptId) {
            const resolved = resolveSceneFromPromptId(m.promptId);
            if (resolved && resolved.id === cleanSlateSceneId) return false;
          }
          return true;
        });
      }
    } catch {}
    return memories;
  }, [memories]);

  return {
    chapters,
    memories: filteredMemories,
    requests,
    stats,
    isLoading
  };
}

export interface DataShadowingAnomalyResult {
  hasAnomaly: boolean;
  M: number;
  N: number;
  orphanedCount: number;
  orphanedDocs: Array<{
    id: string;
    sceneId?: string;
    promptId?: string;
    title?: string;
  }>;
}

/**
 * Evaluates whether any authentic user memories exist in Firestore that failed to correlate with active curriculum scene cards (M > N).
 * Exported for deterministic unit testing and live telemetry reporting.
 */
export function evaluateDataShadowingAnomaly(
  rawMemories: Memory[],
  chapters: UnifiedChapter[]
): DataShadowingAnomalyResult {
  // 1. Calculate raw user memories containing authentic work
  const authenticDocs = rawMemories.filter((doc) => {
    const hasProse = typeof doc.prose === 'string' && doc.prose.trim().length > 0;
    const hasVideo = typeof doc.videoUrl === 'string' && doc.videoUrl.trim().length > 0;
    const hasTakes = Array.isArray(doc.takes) && doc.takes.length > 0;
    return hasProse || hasVideo || hasTakes;
  });

  // 2. Calculate resolved dashboard card count (N)
  const allPrompts = chapters.flatMap((c) => c.prompts);
  const resolvedSceneCards = allPrompts.filter((p) => !!p.memory);
  const resolvedDocIds = new Set(resolvedSceneCards.map((p) => p.memory?.id).filter(Boolean));

  const M = authenticDocs.length;
  const N = resolvedDocIds.size;

  const hasAnomaly = M > N;
  const orphanedDocs = hasAnomaly
    ? authenticDocs
        .filter((d) => !resolvedDocIds.has(d.id))
        .map((d) => ({
          id: d.id,
          sceneId: (d as any).sceneId,
          promptId: d.promptId,
          title: d.title,
        }))
    : [];

  return {
    hasAnomaly,
    M,
    N,
    orphanedCount: orphanedDocs.length,
    orphanedDocs,
  };
}

