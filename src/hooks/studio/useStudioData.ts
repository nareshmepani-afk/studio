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
  description: string;
  memory?: Memory;
  requests: StoryRequest[];
}

export function useStudioData(userId: string | undefined) {
  const { user } = useAuth();
  const { mode } = useLanguage();
  useEffect(() => {
    console.log("[useStudioData] Current Language Mode:", mode);
  }, [mode]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [requests, setRequests] = useState<StoryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Guard refs to track last known data strings
  const lastMemoriesJSON = useRef<string>('');
  const lastRequestsJSON = useRef<string>('');

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    if (user) {
      console.log("[useStudioData] Checking Auth Sync:", {
        userIdParam: userId,
        currentUserUid: user.uid,
        isMatch: user.uid === userId
      });
    }

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
        const memory = memories.find(m => m.promptId === p.id);
        const promptRequests = requests.filter(r => r.promptId === p.id);
        
        return {
          id: p.id,
          title: mode === 'gu' ? (p.text.gu.split(' – ')[0] || p.title) : p.title,
          description: mode === 'gu' ? (p.text.gu.split(' – ')[1] || p.description) : p.description,
          memory,
          requests: promptRequests,
        };
      });

      const publishedCount = correlatedPrompts.filter(p => p.memory?.status === 'published').length;
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
    const drafts = memories.filter(m => m.status === 'draft').length;
    const totalPossible = mockPromptGroups.reduce((acc, g) => acc + g.prompts.length, 0);

    return {
      published,
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
