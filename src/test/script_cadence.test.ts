import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScriptCadence, formatSpokenDuration } from '@/hooks/studio/useScriptCadence';
import {
  applyTheatricalSlashes,
  splitSentenceAtHinge,
  clearCadenceMarkers,
  renderPrompterCadenceHtml,
  getBrakeDuration,
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

  describe('8. SPEC-MW-177: Universal Prompter Cadence Engine & Disjoint Duration Maths', () => {
    it('guardrail 1: computes pause durations disjointly without double-counting // as two single slashes', () => {
      // 10 words + one // (0.5s)
      const tenWordsDeep = 'One two three four five six seven eight nine ten //';
      const { result: resDeep } = renderHook(() => useScriptCadence(tenWordsDeep));
      expect(resDeep.current.metrics.wordCount).toBe(10);
      expect(resDeep.current.metrics.deepPauseCount).toBe(1);
      expect(resDeep.current.metrics.shortPauseCount).toBe(0);
      expect(resDeep.current.metrics.breathPauseCount).toBe(1);
      // Speech: (10 / 120) * 60 = 5.0s. Deep pause: +0.5s. Total: 5.5s -> round to 6s
      expect(resDeep.current.metrics.estimatedSpokenSeconds).toBe(6);

      // 10 words + one / (0.2s)
      const tenWordsShort = 'One two three four five six seven eight nine ten /';
      const { result: resShort } = renderHook(() => useScriptCadence(tenWordsShort));
      expect(resShort.current.metrics.wordCount).toBe(10);
      expect(resShort.current.metrics.deepPauseCount).toBe(0);
      expect(resShort.current.metrics.shortPauseCount).toBe(1);
      expect(resShort.current.metrics.breathPauseCount).toBe(1);
      // Speech: 5.0s. Short pause: +0.2s. Total: 5.2s -> round to 5s
      expect(resShort.current.metrics.estimatedSpokenSeconds).toBe(5);

      // 60 words (30s) + four // (2.0s) + five / (1.0s) = 33s
      const sixtyWords = new Array(60).fill('word').join(' ');
      const mixedText = `${sixtyWords} // // // // / / / / /`;
      const { result: resMixed } = renderHook(() => useScriptCadence(mixedText));
      expect(resMixed.current.metrics.wordCount).toBe(60);
      expect(resMixed.current.metrics.deepPauseCount).toBe(4);
      expect(resMixed.current.metrics.shortPauseCount).toBe(5);
      expect(resMixed.current.metrics.breathPauseCount).toBe(9);
      // 30s speech + 2.0s deep + 1.0s short = 33s
      expect(resMixed.current.metrics.estimatedSpokenSeconds).toBe(33);
    });

    it('guardrail 2: word count purity excludes standalone / and // and punctuation-attached markers', () => {
      const text = 'First word, // second word, / third word.';
      const { result } = renderHook(() => useScriptCadence(text));
      expect(result.current.metrics.wordCount).toBe(6);
    });

    it('getBrakeDuration: accurately calculates auto-scroll brake times without cross-matching', () => {
      expect(getBrakeDuration('This is the end //')).toBe(500);
      expect(getBrakeDuration('Sentence completed.')).toBe(500);
      expect(getBrakeDuration('What happened?')).toBe(500);
      expect(getBrakeDuration('Look there!')).toBe(500);
      expect(getBrakeDuration('A gentle clause /')).toBe(200);
      expect(getBrakeDuration('Walking through the meadow,')).toBe(200);
      expect(getBrakeDuration('Chapter title:')).toBe(300);
      expect(getBrakeDuration('Mid sentence without pause')).toBe(0);
    });

    it('renderPrompterCadenceHtml: generates unified sensory anchors and cadence beacons', () => {
      const prose = 'As evening fell, the quiet bells drifted. Kitchen aroma of cardamom and chai filled the room // generations gathered.';
      const html = renderPrompterCadenceHtml(prose, { autoBreath: false, highlightSensory: true });

      // Cadence beacon assertions
      expect(html).toContain('data-slash-cue="double"');
      expect(html).toContain('text-sky-300'); // Sky Blue for //

      // Sensory anchor assertions
      expect(html).toContain('data-sensory-cue="sound"');
      expect(html).toContain('quiet');
      expect(html).toContain('data-sensory-cue="aroma"');
      expect(html).toContain('cardamom');
      expect(html).toContain('chai');
      expect(html).toContain('data-sensory-cue="visual"');
      expect(html).toContain('generations');
    });

    it('renderPrompterCadenceHtml: autoBreath mode replaces punctuation with pulsing slashes', () => {
      const prose = 'Evening fell. The bells rang.';
      const html = renderPrompterCadenceHtml(prose, { autoBreath: true, highlightSensory: true });

      expect(html).toContain('data-slash-cue="double"');
    });

    it('renderPrompterCadenceHtml: preserves intact // in textContent without splitting second slash and escapes HTML entities', () => {
      const html = renderPrompterCadenceHtml('Hello / world <1968> & memories //', {
        autoBreath: false,
        highlightSensory: true,
      });
      const textOnly = html.replace(/<[^>]*>/g, '');

      expect(textOnly).toContain('//');
      expect(textOnly).not.toContain('/ /');
      expect(html).toContain('&lt;1968&gt;');
      expect(html).toContain('&amp;');
    });
  });
});
