'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  getPartForScene,
  getSceneById,
  resolveSceneFromPromptId,
} from '@/lib/curriculum/masterStoryStructure';
import type { RawCinemaSlateInput } from '@/components/cinema/CinemaTitleOverlays';

export const PROMPTER_SLATE_STORAGE_PREFIX = 'mw_prompter_slate_';
export const PROMPTER_SLATE_PREF_KEY = 'mw_prompter_spoken_slate_enabled';

export interface PersistedPrompterSlatePayload {
  showSpokenSlate: boolean;
  slateMetadata: RawCinemaSlateInput;
}

export function readPrompterSlateFromStorage(
  sessionId?: string | null
): PersistedPrompterSlatePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    if (sessionId) {
      const raw = window.localStorage.getItem(`${PROMPTER_SLATE_STORAGE_PREFIX}${sessionId}`);
      if (raw) {
        return JSON.parse(raw) as PersistedPrompterSlatePayload;
      }
    }
    const pref = window.localStorage.getItem(PROMPTER_SLATE_PREF_KEY);
    if (pref !== null) {
      return {
        showSpokenSlate: pref !== 'false',
        slateMetadata: {},
      };
    }
  } catch {}
  return null;
}

export function writePrompterSlateToStorage(
  sessionId: string | null | undefined,
  payload: PersistedPrompterSlatePayload
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROMPTER_SLATE_PREF_KEY, String(payload.showSpokenSlate));
    if (sessionId) {
      window.localStorage.setItem(
        `${PROMPTER_SLATE_STORAGE_PREFIX}${sessionId}`,
        JSON.stringify(payload)
      );
    }
  } catch {}
}

function buildFallbackCurriculumMeta(
  sessionId?: string | null,
  fallbackAge?: number
): RawCinemaSlateInput {
  let candidateId = sessionId || null;
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    candidateId = params.get('promptId') || params.get('id') || candidateId;
  }

  const matchedScene = candidateId
    ? resolveSceneFromPromptId(candidateId) || getSceneById(candidateId)
    : undefined;
  const matchedPart = matchedScene ? getPartForScene(matchedScene.id) : undefined;

  return {
    title: matchedScene?.title || 'Family Memory',
    chapterTitle: matchedPart?.title || matchedScene?.partTitle || null,
    sceneNumber: matchedScene?.sceneNumber ?? null,
    age: fallbackAge && fallbackAge > 0 ? fallbackAge : null,
  };
}

/**
 * Read-only metadata hook for Soundstage & Popout Teleprompters.
 * Safely uses optional AuthContext (never throws in isolated unit tests without AuthProvider)
 * and keeps all Rule 22.2 Protected Components (ProductionDeck / SoloStage) 100% untouched.
 */
export function useMemorySlateMetadata(
  sessionId?: string | null,
  fallbackAge?: number
): RawCinemaSlateInput {
  const authState = useAuth();
  const uid = authState?.user?.uid || auth?.currentUser?.uid || null;
  const narratorDisplayName = authState?.user?.displayName || null;

  const [meta, setMeta] = useState<RawCinemaSlateInput>(() => {
    const cached = readPrompterSlateFromStorage(sessionId);
    if (cached?.slateMetadata?.title) {
      return cached.slateMetadata;
    }
    return buildFallbackCurriculumMeta(sessionId, fallbackAge);
  });

  useEffect(() => {
    const baseFallback = buildFallbackCurriculumMeta(sessionId, fallbackAge);

    if (!uid || !sessionId || sessionId === 'default') {
      setMeta((prev) => {
        const nextTitle = prev.title || baseFallback.title;
        const nextAge = prev.age ?? baseFallback.age;
        const nextNarrator = prev.narratorName || narratorDisplayName || undefined;
        if (
          prev.title === nextTitle &&
          prev.age === nextAge &&
          prev.narratorName === nextNarrator
        ) {
          return prev;
        }
        return {
          ...baseFallback,
          ...prev,
          title: nextTitle,
          age: nextAge,
          narratorName: nextNarrator,
        };
      });
      return;
    }

    try {
      const memRef = doc(db, 'users', uid, 'memories', sessionId);
      const unsubscribe = onSnapshot(
        memRef,
        (snap) => {
          if (!snap.exists()) {
            setMeta({
              ...baseFallback,
              narratorName: narratorDisplayName,
            });
            return;
          }
          const data = snap.data() as Record<string, any>;
          const promptKey = data.promptId || data.sceneId || sessionId;
          const scene =
            resolveSceneFromPromptId(promptKey) || getSceneById(promptKey);
          const part = scene ? getPartForScene(scene.id) : undefined;

          const year =
            data.dateComponents?.year ||
            data.year ||
            (typeof data.date === 'string' && /^\d{4}/.test(data.date.trim())
              ? data.date.trim().slice(0, 4)
              : null);

          const resolved: RawCinemaSlateInput = {
            title: data.title || data.sceneTitle || scene?.title || baseFallback.title,
            chapterTitle:
              data.chapterTitle || part?.title || scene?.partTitle || baseFallback.chapterTitle,
            sceneNumber: scene?.sceneNumber ?? baseFallback.sceneNumber ?? null,
            location: data.location || data.coordinates?.location || null,
            country: data.country || null,
            year,
            age:
              data.narratorAgeAtTime ||
              data.coordinates?.ageAtTime ||
              (fallbackAge && fallbackAge > 0 ? fallbackAge : null),
            narratorName:
              data.credits?.director ||
              data.credits?.starring ||
              narratorDisplayName ||
              null,
          };

          setMeta(resolved);
        },
        () => {
          setMeta({
            ...baseFallback,
            narratorName: narratorDisplayName,
          });
        }
      );
      return () => unsubscribe();
    } catch {
      setMeta({
        ...baseFallback,
        narratorName: narratorDisplayName,
      });
    }
  }, [uid, sessionId, fallbackAge, narratorDisplayName]);

  return meta;
}
