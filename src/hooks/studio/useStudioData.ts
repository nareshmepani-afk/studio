'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Memory, PromptGroup, StoryRequest } from '@/types';
import { MASTER_STORY_STRUCTURE } from '@/lib/curriculum/masterStoryStructure';
import { useLanguage } from '@/hooks/useLanguage';
import { resolveSceneFromPromptId } from '@/lib/curriculum/masterStoryStructure';

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

    // Subscribe to Memories
    const memoriesRef = collection(db, 'users', userId, 'memories');
    const qMemories = query(memoriesRef, orderBy('createdAt', 'desc'));
    
    const unsubMemories = onSnapshot(qMemories, (snapshot) => {
      const mems = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Memory))
        .filter(m => !m.isFlightSimulator && (m as any).sceneId !== 'prologue-flight-simulator' && m.id !== 'first_flight_rehearsal');
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
    return MASTER_STORY_STRUCTURE.map((part): UnifiedChapter => {
      const correlatedPrompts = part.scenes.map((scene): CorrelatedPrompt => {
        // Trace forward: Follow the chain of memory pointer documents to find the latest leaf memory.
        // CANDIDATE RESOLUTION SHIELD: If multiple memory documents exist matching the prompt,
        // prioritise authentic non-test memories and completed/in-progress takes over unrecorded stage-0 test drafts.
        const candidateMemories = memories.filter(
          m => m.promptId === scene.promptId || (m as any).sceneId === scene.id || m.promptId === scene.id
        );
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

      const publishedCount = correlatedPrompts.filter(p => p.memory?.status === 'published' || p.memory?.status === 'pre-release').length;
      const isCompleted = publishedCount === part.scenes.length && part.scenes.length > 0;

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

  // Global Publish Stats
  const stats = useMemo(() => {
    const published = memories.filter(m => m.status === 'published').length;
    const preRelease = memories.filter(m => m.status === 'pre-release').length;
    const drafts = memories.filter(m => m.status === 'draft').length;
    const totalPossible = MASTER_STORY_STRUCTURE.reduce((acc, part) => acc + part.scenes.length, 0);

    return {
      published,
      preRelease,
      drafts,
      totalPossible,
      completionPercentage: totalPossible > 0 ? Math.round((published / totalPossible) * 100) : 0,
      totalRequests: requests.length
    };
  }, [memories, requests]);

  return {
    chapters,
    memories,
    requests,
    stats,
    isLoading
  };
}
