import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScriptCadence, formatSpokenDuration } from '@/hooks/studio/useScriptCadence';
import {
  applyTheatricalSlashes,
  splitSentenceAtHinge,
  clearCadenceMarkers,
} from '@/utils/scriptFormatter';

describe('SPEC-MW-134 & Option C: Script Cadence & Teleprompter Speakability Hook', () => {
  describe('1. 120 WPM Elder Speech Pace Calculations', () => {
    it('calculates 0 seconds for empty text', () => {
      const { result } = renderHook(() => useScriptCadence(''));
      expect(result.current.metrics.wordCount).toBe(0);
      expect(result.current.metrics.estimatedSpokenSeconds).toBe(0);
      expect(result.current.formatDuration(0)).toBe('0s');
    });

    it('calculates 30 seconds for 60 words (120 WPM standard)', () => {
      const sixtyWords = new Array(60).fill('word').join(' ');
      const { result } = renderHook(() => useScriptCadence(sixtyWords));

      expect(result.current.metrics.wordCount).toBe(60);
      expect(result.current.metrics.estimatedSpokenSeconds).toBe(30);
      expect(result.current.formatDuration(result.current.metrics.estimatedSpokenSeconds)).toBe('30s');
    });

    it('calculates 60 seconds (1m) for 120 words', () => {
      const oneTwentyWords = new Array(120).fill('word').join(' ');
      const { result } = renderHook(() => useScriptCadence(oneTwentyWords));

      expect(result.current.metrics.wordCount).toBe(120);
      expect(result.current.metrics.estimatedSpokenSeconds).toBe(60);
      expect(result.current.formatDuration(result.current.metrics.estimatedSpokenSeconds)).toBe('1m');
    });

    it('formats durations over a minute correctly (e.g. 1m 30s)', () => {
      expect(formatSpokenDuration(45)).toBe('45s');
      expect(formatSpokenDuration(90)).toBe('1m 30s');
      expect(formatSpokenDuration(125)).toBe('2m 5s');
    });
  });

  describe('2. Breath Pause Marker Detection (/ and //)', () => {
    it('counts standalone breath markers without counting them as words', () => {
      const text = 'Walking down the old high street / I remember the bells // ringing clearly.';
      const { result } = renderHook(() => useScriptCadence(text));

      expect(result.current.metrics.breathPauseCount).toBe(2);
      // Ensure "/" and "//" are not counted in word count
      expect(result.current.metrics.wordCount).toBe(12);
    });
  });

  describe('3. Breath Run Detection (> 24 words without pause)', () => {
    it('flags sentences exceeding 24 words without punctuation or breath marks', () => {
      const longSentence = 'Looking back forty years ago to the very first morning we arrived at the cold railway station in London with four heavy wooden suitcases and our bewildered family.';
      // 26 words
      const { result } = renderHook(() => useScriptCadence(longSentence));

      expect(result.current.metrics.longRunSentenceCount).toBe(1);
      const breathSuggestion = result.current.suggestions.find((s) => s.type === 'breathability');
      expect(breathSuggestion).toBeDefined();
      expect(breathSuggestion?.message).toContain('Long breath run');
    });

    it('does not flag short comfortable sentences separated by cadence markers or commas', () => {
      const segmentedText = 'We arrived at the station / with four heavy suitcases // and our bewildered family.';
      const { result } = renderHook(() => useScriptCadence(segmentedText));

      expect(result.current.metrics.longRunSentenceCount).toBe(0);
    });
  });

  describe('4. Scribe Suggestions Integration', () => {
    it('integrates UK orthography suggestions into suggestions array', () => {
      const text = 'The color of the theater was magnificent.';
      const { result } = renderHook(() => useScriptCadence(text));

      const orthSuggestions = result.current.suggestions.filter((s) => s.type === 'orthography');
      expect(orthSuggestions).toHaveLength(2);
      expect(orthSuggestions[0].replacement).toBe('colour');
      expect(orthSuggestions[1].replacement).toBe('theatre');
    });
  });

  describe('5. FEAT-MW-176: Deterministic Midpoint Clause Splitter (splitSentenceAtHinge)', () => {
    it('safeguard 1: preserves original commas non-destructively by inserting marker after comma', () => {
      const text = 'Under the soft golden lamplight, three generations gathered together around the table to turn the delicate pages of the family journal, passing forward our favourite traditions and hard-won memories.';
      // 29 words
      const split = splitSentenceAtHinge(text, 0, '//');

      // Assert that comma is preserved before the // marker
      expect(split).toContain(', //');
      // Assert that both parts are <= 24 words
      const parts = split.split('//').map((p) => p.trim().split(/\s+/).filter(Boolean).length);
      expect(parts[0]).toBeLessThanOrEqual(24);
      expect(parts[1]).toBeLessThanOrEqual(24);
      expect(parts[0] + parts[1]).toBe(29);
    });

    it('safeguard 2: bounded hinge radius prevents early introductory commas from leaving >24 word runs', () => {
      // 28-word sentence with an introductory comma at word 3
      const textWithEarlyComma = 'In July 1968, my grandparents packed everything they owned into two battered tin trunks and boarded the steam train to embark on their long migration across continents.';
      const split = splitSentenceAtHinge(textWithEarlyComma, 0, '//');

      // The early comma at word 3 must NOT be chosen because it would leave 25 words in part 2
      expect(split).not.toContain('In July 1968, //');

      const parts = split.split('//').map((p) => p.trim().split(/\s+/).filter(Boolean).length);
      expect(parts[0]).toBeLessThanOrEqual(24);
      expect(parts[1]).toBeLessThanOrEqual(24);
    });

    it('splits unpunctuated sentences cleanly at natural spoken hinge words', () => {
      const unpunctuated = 'Looking back forty years ago to the very first morning we arrived at the cold railway station in London with four heavy wooden suitcases and our bewildered family.';
      // 26 words
      const split = splitSentenceAtHinge(unpunctuated, 0, '//');

      expect(split).toContain(' // with');
      const parts = split.split('//').map((p) => p.trim().split(/\s+/).filter(Boolean).length);
      expect(parts[0]).toBeLessThanOrEqual(24);
      expect(parts[1]).toBeLessThanOrEqual(24);
    });
  });

  describe('6. FEAT-MW-176: Cadence Marker Clearing (clearCadenceMarkers)', () => {
    it('strips / and // markers while preserving commas and authentic punctuation', () => {
      const splitText = 'Under the soft golden lamplight, three generations gathered together around the table, // passing forward our favourite traditions and hard-won memories.';
      const cleared = clearCadenceMarkers(splitText);

      expect(cleared).not.toContain('//');
      expect(cleared).not.toContain('/');
      expect(cleared).toContain('table, passing');
    });
  });

  describe('7. FEAT-MW-176: Theatrical Slashes Deduplication & Ordering (applyTheatricalSlashes)', () => {
    it('safeguard 3: matches double slashes before single slashes without partial matching', () => {
      // , // should stay as a deep breath, not get broken into / /
      expect(applyTheatricalSlashes('Hello, // world.')).toBe('Hello // world //');
      expect(applyTheatricalSlashes('Hello. // World.')).toBe('Hello // World //');
    });

    it('deduplicates adjacent punctuation and slash combinations into single clean cues', () => {
      expect(applyTheatricalSlashes('Walking home, / talking softly.')).toBe('Walking home / talking softly //');
      expect(applyTheatricalSlashes('Evening fell. / The bells rang.')).toBe('Evening fell // The bells rang //');
      expect(applyTheatricalSlashes('A quiet day // // another year.')).toBe('A quiet day // another year //');
    });
  });
});
