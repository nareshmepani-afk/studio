import { describe, it, expect } from 'vitest';
import { 
  detectAnchors, 
  filterDominantSensoryAnchors, 
  DetectedAnchor 
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
});
