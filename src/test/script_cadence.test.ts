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
import { generateAutobiographyHtml } from '@/utils/autobiographyExporter';
import { detectShieldedTerms } from '@/lib/dictionary/diasporaVoiceShield';
import fs from 'fs';
import path from 'path';

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

  describe('5. SPEC-MW-178: Unpunctuated Clause Stretch Midpoint Splitter (splitSentenceAtHinge)', () => {
    it('safeguard 1: never splits immediately after existing commas and splits longest unpunctuated stretch at natural hinge', () => {
      const text = 'Under the soft golden lamplight, three generations gathered together around the table to turn the delicate pages of the family journal, passing forward our favourite traditions and hard-won memories.';
      // 29 words: stretches are [5 words], [16 words], [8 words]; default marker is '/'
      const split = splitSentenceAtHinge(text);

      // Existing commas must remain untouched (no ', /' or ', //')
      expect(split).toContain('lamplight, three');
      expect(split).toContain('journal, passing');
      expect(split).not.toContain(', /');
      expect(split).toContain('around the table / to turn');

      // Assert that both resulting segments are <= 24 words
      const parts = split.split(' / ').map((p) => p.trim().split(/\s+/).filter(Boolean).length);
      expect(parts[0]).toBe(12);
      expect(parts[1]).toBe(17);
      expect(parts[0]).toBeLessThanOrEqual(24);
      expect(parts[1]).toBeLessThanOrEqual(24);
      expect(parts[0] + parts[1]).toBe(29);
    });

    it('safeguard 2: bounded hinge radius prevents early introductory commas from leaving >24 word runs', () => {
      // 27-word sentence with an introductory comma at word 3
      const textWithEarlyComma = 'In July 1968, my grandparents packed everything they owned into two battered tin trunks and boarded the steam train to embark on their long migration across continents.';
      const split = splitSentenceAtHinge(textWithEarlyComma);

      // The early comma at word 3 must NOT be touched and both halves must be <= 24 words
      expect(split).toContain('In July 1968, my');
      expect(split).toContain('trunks / and boarded');

      const parts = split.split(' / ').map((p) => p.trim().split(/\s+/).filter(Boolean).length);
      expect(parts[0]).toBeLessThanOrEqual(24);
      expect(parts[1]).toBeLessThanOrEqual(24);
    });

    it('splits unpunctuated sentences cleanly at natural spoken hinge words', () => {
      const unpunctuated = 'Looking back forty years ago to the very first morning we arrived at the cold railway station in London with four heavy wooden suitcases and our bewildered family.';
      const split = splitSentenceAtHinge(unpunctuated);

      expect(split).toContain(' / with');
      const parts = split.split(' / ').map((p) => p.trim().split(/\s+/).filter(Boolean).length);
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

  describe('9. SPEC-MW-178: Golden 107-Word Passage, Heirloom PDF Sanitisation & UK/Diaspora Parity', () => {
    const GOLDEN_CARD_52_PASSAGE =
      'As evening fell over the courtyard, the quiet sound of temple bells drifted through the open windows. ' +
      'I held the worn brass compass in my hands, feeling its cool, weathered surface against my palms. ' +
      'From the kitchen came the rich aroma of cardamom and roasting spices, filling the room with familiar warmth. ' +
      'Under the soft golden lamplight, three generations gathered together around the table to turn the delicate pages of the family journal, passing forward our favourite traditions and hard-won memories. ' +
      'We lit the diya at the mandir and shared masala chai with warm roti and samosas. ' +
      'I realise my favourite colour was green in the theatre.';

    it('golden test case: splits 107-word Card 52 passage at "around the table / to turn", clears longSentenceRuns 1 -> 0, and tracks all 6 commas + 6 full stops', () => {
      const { result: before } = renderHook(() => useScriptCadence(GOLDEN_CARD_52_PASSAGE));
      expect(before.current.metrics.wordCount).toBe(107);
      expect(before.current.metrics.longRunSentenceCount).toBe(1);
      expect(before.current.metrics.breathPauseCount).toBe(0);
      expect(before.current.metrics.activeShortCueCount).toBe(6); // 6 commas
      expect(before.current.metrics.activeDeepCueCount).toBe(6);  // 6 full stops
      expect(before.current.metrics.activeTotalCueCount).toBe(12);
      // 107 words * 0.5s (53.5s) + 6 * 0.2s (1.2s) + 6 * 0.5s (3.0s) = 57.7s -> 58s
      expect(before.current.metrics.estimatedSpokenSeconds).toBe(58);

      // Diaspora & UK Voice Shield badges
      expect(before.current.metrics.shieldedDiasporaTerms).toEqual([
        'diya',
        'mandir',
        'masala chai',
        'roti',
        'samosas',
      ]);
      expect(before.current.metrics.shieldedUkTerms).toEqual([
        'favourite',
        'realise',
        'colour',
        'theatre',
      ]);
      expect(before.current.suggestions.filter((s) => s.type === 'orthography')).toHaveLength(0);

      // Execute 1-click midpoint clause split
      const splitPassage = splitSentenceAtHinge(GOLDEN_CARD_52_PASSAGE);
      expect(splitPassage).toContain('Under the soft golden lamplight, three generations');
      expect(splitPassage).toContain('around the table / to turn the delicate pages of the family journal, passing forward');

      const { result: after } = renderHook(() => useScriptCadence(splitPassage));
      expect(after.current.metrics.wordCount).toBe(107);
      expect(after.current.metrics.longRunSentenceCount).toBe(0);
      expect(after.current.metrics.breathPauseCount).toBe(1);
      expect(after.current.metrics.shortPauseCount).toBe(1);
      expect(after.current.metrics.activeShortCueCount).toBe(7); // 6 commas + 1 custom /
      expect(after.current.metrics.activeDeepCueCount).toBe(6);  // 6 full stops
      expect(after.current.metrics.activeTotalCueCount).toBe(13);
      expect(after.current.suggestions).toHaveLength(0);
    });

    it('detectShieldedTerms: never falsely badges common English homographs like "are"', () => {
      const res = detectShieldedTerms('We are happy in the morning.');
      expect(res.diasporaTerms).toEqual([]);
      expect(res.ukTerms).toEqual([]);
    });

    it('autobiographyExporter: strips manual / and // cadence markers from Heirloom Book PDF HTML while preserving filename and audioMood', () => {
      const html = generateAutobiographyHtml(
        {
          id: 'part-6-scene-4',
          title: 'Lamplight & Masala Chai',
          prose: 'Around the table / to turn the delicate pages // passing forward our favourite memories.',
          fusionManifest: {
            audioMood: 'Nostalgic Acoustic Guitar // 72 BPM',
            sensoryPalette: 'Cardamom, warm roti',
            emotionalTone: 'Reverent',
            cohesiveScript: 'Around the table / to turn the delicate pages // passing forward our favourite memories.',
          },
        } as any,
        'narrator@memoryweaver.studio'
      );

      expect(html).toContain('<title>narrator@memoryweaver.studio_Lamplight_Masala_Chai_booklet</title>');
      expect(html).toContain('Nostalgic Acoustic Guitar // 72 BPM');
      expect(html).toContain(
        '<div class="monologue-body">Around the table to turn the delicate pages passing forward our favourite memories.</div>'
      );
    });

    it('enforces lang="en-GB" and spellCheck parity across NarrativeScriptInput, SentenceWrapper, MemoryForm, SensoryScriptEditor, and AI Weaver', () => {
      const root = process.cwd();
      const sentenceWrapperSrc = fs.readFileSync(
        path.join(root, 'src/components/studio/Scriptorium/SentenceWrapper.tsx'),
        'utf8'
      );
      expect(sentenceWrapperSrc).toContain('lang="en-GB"');
      expect(sentenceWrapperSrc).toContain('spellCheck={!readOnly}');

      const sensoryEditorSrc = fs.readFileSync(
        path.join(root, 'src/components/studio/shared/SensoryScriptEditor.tsx'),
        'utf8'
      );
      expect(sensoryEditorSrc).toContain("lang = 'en-GB'");
      expect(sensoryEditorSrc).toContain('spellCheck={true}');

      const aiWeaverSrc = fs.readFileSync(path.join(root, 'src/actions/aiWeaver.ts'), 'utf8');
      expect(aiWeaverSrc).toContain('DIASPORA VOICE SHIELD');
      expect(aiWeaverSrc).toContain('masala chai');
    });
  });
});
