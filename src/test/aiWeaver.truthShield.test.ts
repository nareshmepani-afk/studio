import { describe, it, expect } from 'vitest';
import {
  buildAllowedYearSet,
  sanitizeProseTemporalFidelity,
  sanitizeSensoryAnchorTemporalFidelity,
} from '../lib/truthShield';

describe('GOV-MW-162 Truth Shield: Anti-Hallucination Temporal Fidelity Suite', () => {
  describe('buildAllowedYearSet', () => {
    it('extracts years from raw source text and metadata', () => {
      const rawText =
        'In nineteen sixty-five, I was carried onto a plane. My parents moved in 1965 to London.';
      const declaredYear = '1964';
      const durationQuantity = 1;

      const allowedYears = buildAllowedYearSet(rawText, declaredYear, durationQuantity);

      expect(allowedYears.has('1964')).toBe(true);
      expect(allowedYears.has('1965')).toBe(true);
      expect(allowedYears.has('1956')).toBe(false); // Unauthorized year
      expect(allowedYears.has('1970')).toBe(false);
    });

    it('handles null/undefined gracefully without crashing', () => {
      const allowed = buildAllowedYearSet(undefined, null, undefined);
      expect(allowed.size).toBe(0);
    });
  });

  describe('sanitizeProseTemporalFidelity (Narrative Prose Grammar Rule)', () => {
    const allowedYears = new Set(['1964', '1965']);

    it('replaces unauthorized opening year clause with natural relative phrasing', () => {
      const hallucinatedProse =
        'In 1956, a brave family stepped forward across vast oceans to completely rewrite their destiny. By 1965, I was a one-year-old child.';

      const cleaned = sanitizeProseTemporalFidelity(hallucinatedProse, allowedYears);

      // 1956 replaced with "In those early years,"
      expect(cleaned).toContain('In those early years, a brave family stepped forward');
      expect(cleaned).not.toContain('1956');

      // 1965 is in allow-list, so preserved perfectly
      expect(cleaned).toContain('By 1965, I was a one-year-old child');
    });

    it('replaces unauthorized standalone years with "that era"', () => {
      const hallucinatedProse =
        'The voyage began during 1956 when grandfather worked as a mason. Later in 1964, my birth was recorded.';

      const cleaned = sanitizeProseTemporalFidelity(hallucinatedProse, allowedYears);

      expect(cleaned).toContain('The voyage began During that era, when grandfather worked');
      expect(cleaned).not.toContain('1956');
      expect(cleaned).toContain('in 1964, my birth was recorded');
    });

    it('leaves text completely untouched when all years are authorized', () => {
      const truthfulProse =
        'In 1964, our family roots were established, and by 1965 we had landed at Heathrow airport.';

      const result = sanitizeProseTemporalFidelity(truthfulProse, allowedYears);
      expect(result).toBe(truthfulProse);
    });
  });

  describe('sanitizeSensoryAnchorTemporalFidelity (Sensory Chip Rule)', () => {
    const allowedYears = new Set(['1964', '1965']);

    it('cleanly strips unauthorized year suffix from uppercase sensory chips', () => {
      const chip = 'RHYTHMIC SOUND OF SEA WAVES IN 1956';
      const cleaned = sanitizeSensoryAnchorTemporalFidelity(chip, allowedYears);

      expect(cleaned).toBe('RHYTHMIC SOUND OF SEA WAVES');
      expect(cleaned).not.toContain('1956');
      expect(cleaned).not.toContain('IN'); // Stripped cleanly
    });

    it('cleanly strips unauthorized year suffix from title case sensory chips', () => {
      const chip = 'Aroma of festive spices in 1956';
      const cleaned = sanitizeSensoryAnchorTemporalFidelity(chip, allowedYears);

      expect(cleaned).toBe('Aroma of festive spices');
      expect(cleaned).not.toContain('1956');
    });

    it('preserves authorized year in sensory chip', () => {
      const chip = 'HUM OF AIRCRAFT ENGINES IN 1965';
      const cleaned = sanitizeSensoryAnchorTemporalFidelity(chip, allowedYears);

      expect(cleaned).toBe('HUM OF AIRCRAFT ENGINES IN 1965');
    });

    it('does not insert sentence clauses like "In those early years" into chips', () => {
      const chip = 'Sea breeze in 1956';
      const cleaned = sanitizeSensoryAnchorTemporalFidelity(chip, allowedYears);

      expect(cleaned).toBe('Sea breeze');
      expect(cleaned).not.toContain('In those early years');
    });
  });
});
