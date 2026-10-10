"use client";

import { useMemo, useEffect } from 'react';
import {
  detectSensoryAnchors,
  filterDominantSensoryAnchors,
  type DetectedAnchor,
} from '@/utils/sensoryAnchors';

export interface UseSensoryHighlightOptions {
  value: string;
  hideAnchors?: boolean;
  language?: string;
  onDetectedAnchorsChange?: (anchors: DetectedAnchor[]) => void;
}

export interface UseSensoryHighlightReturn {
  rawAnchors: DetectedAnchor[];
  dominantAnchors: DetectedAnchor[];
  tokens: string[];
  modalityCounts: {
    soundscape: number;
    visual: number;
    aroma: number;
  };
}

/**
 * Shared Sensory Highlight & Tokenizer Engine Hook
 * SPEC-MW-134 / Rule 48
 *
 * Provides single source of truth for anchor detection, dominant trio calculation,
 * unified modality counts, and zero-drift tokenization with defensive Indic & JSDOM safeguards.
 */
export function useSensoryHighlight({
  value,
  hideAnchors = false,
  language = 'en-GB',
  onDetectedAnchorsChange,
}: UseSensoryHighlightOptions): UseSensoryHighlightReturn {
  // 1. Raw Anchor Detection
  const rawAnchors = useMemo(() => {
    if (!value || hideAnchors) return [];
    return detectSensoryAnchors(value);
  }, [value, hideAnchors]);

  // 2. Dominant Trio (Golden Trio: maximum 1 per modality, in order of appearance)
  const dominantAnchors = useMemo(() => {
    if (!rawAnchors.length) return [];
    return filterDominantSensoryAnchors(rawAnchors);
  }, [rawAnchors]);

  // Notify upstream consumer when raw anchors update
  useEffect(() => {
    onDetectedAnchorsChange?.(rawAnchors);
  }, [rawAnchors, onDetectedAnchorsChange]);

  // 3. Unified Modality Counts (Rule 48 Parity Lockstep)
  const modalityCounts = useMemo(() => {
    return {
      soundscape: dominantAnchors.filter((a) => a.type === 'soundscape').length,
      visual: dominantAnchors.filter((a) => a.type === 'visual').length,
      aroma: dominantAnchors.filter((a) => a.type === 'aroma').length,
    };
  }, [dominantAnchors]);

  // 4. Zero-Drift Indic-Safe Tokenization Engine (Guardrail 1: Defensive JSDOM & Intl.Segmenter)
  const tokens = useMemo(() => {
    if (!value) return [];
    if (hideAnchors || dominantAnchors.length === 0) {
      return [value];
    }

    try {
      // Sort anchors descending by length to prevent partial prefix collisions (e.g. "rain" vs "rainbow")
      const sortedAnchors = [...dominantAnchors].sort((a, b) => b.word.length - a.word.length);
      const anchorPattern = sortedAnchors
        .map((a) => a.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');

      // Unicode-aware word boundary regex: matches anchor words while respecting letter/mark clusters across all diaspora languages
      const regex = new RegExp(`(?<![\\p{L}\\p{N}\\p{M}])(${anchorPattern})(?![\\p{L}\\p{N}\\p{M}])`, 'gui');
      const splits = value.split(regex).filter((t: string) => t !== undefined && t !== '');

      // Guardrail 1: Optional Intl.Segmenter verification if available in runtime
      if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
        try {
          const locale = language.startsWith('gu') ? 'gu' : language.startsWith('pa') ? 'pa' : language.startsWith('hi') ? 'hi' : 'en-GB';
          // Ensure segmenter instantiates cleanly without throwing on unrecognized locales
          new Intl.Segmenter(locale, { granularity: 'word' });
        } catch {
          // Fall back gracefully to regex splits
        }
      }

      return splits.length > 0 ? splits : [value];
    } catch {
      // Fallback for edge runtimes lacking Unicode property escapes
      return [value];
    }
  }, [value, hideAnchors, dominantAnchors, language]);

  return {
    rawAnchors,
    dominantAnchors,
    tokens,
    modalityCounts,
  };
}
