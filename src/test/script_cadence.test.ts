import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScriptCadence, formatSpokenDuration } from '@/hooks/studio/useScriptCadence';

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
});
