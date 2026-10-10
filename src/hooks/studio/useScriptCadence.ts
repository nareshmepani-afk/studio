"use client";

import { useMemo } from 'react';
import {
  checkUKOrthography,
  detectAIClichés,
  isProtectedDiasporaTerm,
} from '@/lib/dictionary/diasporaVoiceShield';

export interface ScribeSuggestion {
  id: string;
  type: 'orthography' | 'breathability' | 'cliche' | 'spelling';
  original: string;
  replacement?: string;
  message: string;
  range?: [number, number];
}

export interface CadenceMetrics {
  wordCount: number;
  characterCount: number;
  estimatedSpokenSeconds: number; // 120 WPM elder standard
  breathPauseCount: number;       // Total / and // markers
  longRunSentenceCount: number;   // Sentences > 24 words without pauses
}

export interface UseScriptCadenceReturn {
  metrics: CadenceMetrics;
  suggestions: ScribeSuggestion[];
  formatDuration: (seconds: number) => string;
}

/**
 * Format spoken seconds into human-readable duration (e.g. "45s" or "1m 30s")
 */
export function formatSpokenDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.max(seconds, 0)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
}

/**
 * Script Cadence & Teleprompter Speakability Hook
 * SPEC-MW-134 / Option C Differentiator
 *
 * Calculates:
 * - 120 WPM comfortable elder speech duration.
 * - Breath pause counts (`/` short pause, `//` deep breath).
 * - Breath run warnings for sentences exceeding 24 words without punctuation or pause markers.
 * - Scribe suggestions integrating British English orthography and AI cliché defense.
 */
export function useScriptCadence(text: string): UseScriptCadenceReturn {
  const metrics = useMemo<CadenceMetrics>(() => {
    if (!text || text.trim().length === 0) {
      return {
        wordCount: 0,
        characterCount: 0,
        estimatedSpokenSeconds: 0,
        breathPauseCount: 0,
        longRunSentenceCount: 0,
      };
    }

    // Clean out cadence markers when counting words so "//" is not counted as a word
    const textWithoutMarkers = text.replace(/(^|\s)\/\/?(?=\s|$)/g, ' ');
    const rawWords = textWithoutMarkers.trim().split(/\s+/).filter(Boolean);
    const wordCount = rawWords.length;
    const characterCount = text.length;

    // 120 Words Per Minute = 2 words per second
    const estimatedSpokenSeconds = Math.round((wordCount / 120) * 60);

    // Count standalone breath markers: "/" (short pause) or "//" (deep breath)
    const breathPauseMatches = text.match(/(^|\s)\/\/?(?=\s|$)/g);
    const breathPauseCount = breathPauseMatches ? breathPauseMatches.length : 0;

    // Segment text by sentence boundaries, hard breaks, or breath markers
    const sentenceRuns = text.split(/[.?!;:\n]+|(?:\s+\/\/?\s+)/).map((s) => s.trim()).filter(Boolean);
    let longRunSentenceCount = 0;

    for (const run of sentenceRuns) {
      const runWords = run.split(/\s+/).filter(Boolean);
      // If a sentence exceeds 24 words without a comma or breath break, flag it
      if (runWords.length > 24) {
        longRunSentenceCount++;
      }
    }

    return {
      wordCount,
      characterCount,
      estimatedSpokenSeconds,
      breathPauseCount,
      longRunSentenceCount,
    };
  }, [text]);

  const suggestions = useMemo<ScribeSuggestion[]>(() => {
    if (!text || text.trim().length === 0) return [];
    const list: ScribeSuggestion[] = [];

    // 1. UK British English Orthography Suggestions (Rule 20)
    const orthographyMatches = checkUKOrthography(text);
    for (const m of orthographyMatches) {
      // If word is in diaspora lexicon, never flag it
      if (isProtectedDiasporaTerm(m.original)) continue;

      list.push({
        id: m.id,
        type: 'orthography',
        original: m.original,
        replacement: m.replacement,
        message: m.message,
        range: [m.index, m.index + m.original.length],
      });
    }

    // 2. AI Cliché & Screenplay Cue Warnings (Rule 11)
    const clicheMatches = detectAIClichés(text);
    for (const c of clicheMatches) {
      list.push({
        id: c.id,
        type: 'cliche',
        original: c.phrase,
        replacement: c.suggestion || undefined,
        message: c.message,
        range: [c.index, c.index + c.phrase.length],
      });
    }

    // 3. Breathability Warnings (> 24 words without pause)
    const sentenceRuns = text.split(/[.?!;:\n]+|(?:\s+\/\/?\s+)/).map((s) => s.trim()).filter(Boolean);
    let runIndex = 0;
    for (const run of sentenceRuns) {
      const runWords = run.split(/\s+/).filter(Boolean);
      if (runWords.length > 24) {
        const snippet = run.length > 40 ? `${run.slice(0, 37)}...` : run;
        list.push({
          id: `breath-${runIndex}`,
          type: 'breathability',
          original: snippet,
          message: `Long breath run (${runWords.length} words). Consider adding a pause mark (/) or full breath (//) to pace the teleprompter.`,
        });
      }
      runIndex++;
    }

    return list;
  }, [text]);

  return {
    metrics,
    suggestions,
    formatDuration: formatSpokenDuration,
  };
}
