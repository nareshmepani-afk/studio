'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Memory, PromptGroup, StoryRequest } from '@/types';
import { mockPromptGroups } from '@/lib/mockData';
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
  const [isLoading, setIsLoading] = useState(userId !== 'guest' && userId !== undefined);
  
  // Guard refs to track last known data strings
  const lastMemoriesJSON = useRef<string>('');
  const lastRequestsJSON = useRef<string>('');

  const hasSkippedRef = useRef(false);

  useEffect(() => {
    // If auth is still loading, wait before making any 'guest' decisions
    if (loading) return;

    if (!userId || userId === 'guest') {
      setMemories([]);
      setRequests([]);
      if (!hasSkippedRef.current) {
        hasSkippedRef.current = true;
        setIsLoading(false);
      }
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
      const mems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Memory));
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
    return mockPromptGroups.map((group): UnifiedChapter => {
      const correlatedPrompts = group.prompts.map((p): CorrelatedPrompt => {
        // Trace forward: Follow the chain of memory pointer documents to find the latest leaf memory
        let memory: Memory | undefined = memories.find(m => m.promptId === p.id);
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
        const promptRequests = requests.filter(r => r.promptId === p.id);
        
        let promptTitle = p.title;
        let promptSubtitle: string | undefined = undefined;
        let promptDescription = p.description;

        if (mode === 'gu') {
          promptTitle = p.text.gu.split(' – ')[0] || p.title;
          promptDescription = p.text.gu.split(' – ')[1] || p.description;
        } else if (mode === 'dual') {
          promptTitle = p.title;
          promptSubtitle = p.text.gu.split(' – ')[0] || undefined;
          promptDescription = p.description;
        }

        return {
          id: p.id,
          title: promptTitle,
          subtitle: promptSubtitle,
          description: promptDescription,
          memory,
          requests: promptRequests,
        };
      });

      const publishedCount = correlatedPrompts.filter(p => p.memory?.status === 'published' || p.memory?.status === 'pre-release').length;
      const isCompleted = publishedCount === group.prompts.length && group.prompts.length > 0;

      // Dynamic Title Logic
      let title = group.title.en;
      let subtitle: string | undefined = group.title.gu;

      if (mode === 'en') {
        title = group.title.en;
        subtitle = undefined;
      } else if (mode === 'gu') {
        title = group.title.gu;
        subtitle = undefined;
      } else if (mode === 'dual') {
        title = group.title.en;
        subtitle = group.title.gu;
      }

      return {
        id: group.id,
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
    const totalPossible = mockPromptGroups.reduce((acc, g) => acc + g.prompts.length, 0);

    return {
      published,
      preRelease,
      drafts,
      totalPossible,
      completionPercentage: Math.round((published / totalPossible) * 100),
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
