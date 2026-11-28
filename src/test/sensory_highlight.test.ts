import { describe, it, expect } from 'vitest';
import { 
  detectAnchors, 
  filterDominantSensoryAnchors, 
  DetectedAnchor,
  SENSORY_DICTIONARY_DETAILED
} from '@/hooks/studio/useDirectorInk';

describe('MW-266 / Sensory Highlight & Golden Trio Modal Filter Suite', () => {
  it('1. filters dominant sensory anchors to maximum 3 distinct modalities (Golden Trio)', () => {
    // 6 anchors spanning multiple modalities
    const rawAnchors: DetectedAnchor[] = [
      { word: 'cardamom', type: 'aroma' },
      { word: 'rain', type: 'aroma' },
      { word: 'whistling', type: 'soundscape' },
      { word: 'chime', type: 'soundscape' },
      { word: 'emerald', type: 'visual' },
      { word: 'ruby', type: 'visual' },
    ];

    const filtered = filterDominantSensoryAnchors(rawAnchors);

    // Strict cap of at most 3 distinct anchors
    expect(filtered.length).toBeLessThanOrEqual(3);
    expect(filtered.length).toBe(3);

    // Each anchor must belong to a distinct modality
    const modalities = filtered.map(a => a.type);
    const uniqueModalities = new Set(modalities);
    expect(uniqueModalities.size).toBe(filtered.length);

    // First appearance prioritisation
    expect(filtered[0]).toEqual({ word: 'cardamom', type: 'aroma' });
    expect(filtered[1]).toEqual({ word: 'whistling', type: 'soundscape' });
    expect(filtered[2]).toEqual({ word: 'emerald', type: 'visual' });
  });

  it('2. prioritises distinct modalities in text order and ignores duplicate modalities', () => {
    const rawAnchors: DetectedAnchor[] = [
      { word: 'lavender', type: 'aroma' },
      { word: 'jasmine', type: 'aroma' },
      { word: 'sandalwood', type: 'aroma' },
      { word: 'melody', type: 'soundscape' },
    ];

    const filtered = filterDominantSensoryAnchors(rawAnchors);

    expect(filtered.length).toBe(2);
    expect(filtered[0].word).toBe('lavender');
    expect(filtered[0].type).toBe('aroma');
    expect(filtered[1].word).toBe('melody');
    expect(filtered[1].type).toBe('soundscape');
  });

  it('3. handles empty or single-modality lists gracefully', () => {
    expect(filterDominantSensoryAnchors([])).toEqual([]);

    const single: DetectedAnchor[] = [{ word: 'spice', type: 'aroma' }];
    expect(filterDominantSensoryAnchors(single)).toEqual(single);
  });

  it('4. detects anchors in text and enforces <= 3 distinct modalities when filtered', () => {
    // Passage with words in aroma, soundscape, visual
    const passage = "Warm cardamom and fresh rain in the air as music played across London roots.";
    const detected = detectAnchors(passage);
    const filtered = filterDominantSensoryAnchors(detected);

    expect(filtered.length).toBeLessThanOrEqual(3);
    const types = new Set(filtered.map(a => a.type));
    expect(types.size).toBe(filtered.length);
  });

  it('5. invariant: passing anchors across soundscape, visual, aroma yields array of length 3 (not 1)', () => {
    const mixedAnchors: DetectedAnchor[] = [
      { word: 'whistling', type: 'soundscape' },
      { word: 'windowpane', type: 'visual' },
      { word: 'cardamom', type: 'aroma' },
    ];

    const result = filterDominantSensoryAnchors(mixedAnchors);
    expect(result.length).toBe(3);
    expect(result.map(a => a.type)).toEqual(['soundscape', 'visual', 'aroma']);

    // Also assert First Flight fixture text detects 3 distinct modalities
    const fixtureText = "The Sunday kettle whistling on the stove, rain drumming against the windowpane, and warm cardamom chai served in cracked ceramic cups.";
    const detected = detectAnchors(fixtureText);
    const filtered = filterDominantSensoryAnchors(detected);
    expect(filtered.length).toBe(3);
    const distinctTypes = new Set(filtered.map(a => a.type));
    expect(distinctTypes.size).toBe(3);
  });

  it('6. provides cinematic rationale for all Golden Trio modalities in SENSORY_DICTIONARY_DETAILED', () => {
    expect(SENSORY_DICTIONARY_DETAILED.aroma.reason).toContain('AROMA:');
    expect(SENSORY_DICTIONARY_DETAILED.soundscape.reason).toContain('SOUND:');
    expect(SENSORY_DICTIONARY_DETAILED.visual.reason).toContain('VISUAL:');
  });

  it('7. MW-440 REGRESSION SHIELD: excludes clarity filler words (just, simply, very) from stealing Golden Trio slots and detects plural/culinary aroma anchors (spices, masala, chapatis, curries, aromas)', () => {
    const hendonPassage =
      'Long before my own clear recollections began, my father journeyed ahead from Nairobi, determined to secure work and a shelter before the four of us crossed the sea. He managed to find a single room over a shop in Chalk Farm, London, accommodating all of us together. Being only about one year old and just learning to walk, there was simply no stopping my constant movement. The restless sound of my tumbling and playing above proved far too disruptive for the shopkeeper below, and eventually, the noise became too much, and we were asked to vacate. That departure brought us to 45 Dartmouth Road in Hendon, the house where I truly grew up. Looking back on 1969 and the years right after, my memories remain deeply fond, even though my parents had very little money and the house was thoroughly basic. Wholesome home-cooked meals layered with Indian spices, from morning masala chai through to evening fresh chapatis and simmering vegetarian curries, filled every corner. Those rich aromas kept me warm, weaving an enduring comfort that cold weather could never touch.';

    const detected = detectAnchors(hendonPassage);
    // Plural & culinary inflections must be recognised as aroma anchors
    const aromaWords = detected.filter((a) => a.type === 'aroma').map((a) => a.word);
    expect(aromaWords).toEqual(expect.arrayContaining(['spices', 'masala', 'chai', 'chapatis', 'curries', 'aromas']));

    // Golden Trio dominant filter must yield all 3 sensory modalities (never letting 'just'/'simply'/'very' steal Aroma's slot)
    const dominant = filterDominantSensoryAnchors(detected);
    expect(dominant.length).toBe(3);
    expect(dominant.map((a) => a.type).sort()).toEqual(['aroma', 'soundscape', 'visual']);
    expect(dominant.some((a) => (a.type as string) === 'clarity')).toBe(false);
  });
});
