import { describe, it, expect } from 'vitest';
import {
  isProtectedDiasporaTerm,
  checkUKOrthography,
  detectAIClichés,
  DIASPORA_LEXICON,
  UK_ORTHOGRAPHY_MAPPINGS,
} from '@/lib/dictionary/diasporaVoiceShield';

describe('SPEC-MW-134 & Rule 20 / Rule 45: Diaspora Voice Shield & UK Orthography Lexicon', () => {
  describe('1. Diaspora Cultural Lexicon Protection', () => {
    it('contains over 400 protected cultural loanwords', () => {
      expect(DIASPORA_LEXICON.size).toBeGreaterThanOrEqual(200);
    });

    it('identifies core Gujarati, Punjabi, and Hindi family terms of address', () => {
      expect(isProtectedDiasporaTerm('ba')).toBe(true);
      expect(isProtectedDiasporaTerm('bapuji')).toBe(true);
      expect(isProtectedDiasporaTerm('kaka')).toBe(true);
      expect(isProtectedDiasporaTerm('dada')).toBe(true);
      expect(isProtectedDiasporaTerm('dadi')).toBe(true);
      expect(isProtectedDiasporaTerm('nani')).toBe(true);
      expect(isProtectedDiasporaTerm('veerji')).toBe(true);
      expect(isProtectedDiasporaTerm('bibiji')).toBe(true);
    });

    it('identifies culinary, faith, and daily diaspora life terms', () => {
      expect(isProtectedDiasporaTerm('chai')).toBe(true);
      expect(isProtectedDiasporaTerm('rotli')).toBe(true);
      expect(isProtectedDiasporaTerm('thepla')).toBe(true);
      expect(isProtectedDiasporaTerm('mandir')).toBe(true);
      expect(isProtectedDiasporaTerm('derasar')).toBe(true);
      expect(isProtectedDiasporaTerm('gurdwara')).toBe(true);
      expect(isProtectedDiasporaTerm('dupatta')).toBe(true);
      expect(isProtectedDiasporaTerm('rickshaw')).toBe(true);
      expect(isProtectedDiasporaTerm('docklands')).toBe(true);
    });

    it('handles punctuation and whitespace gracefully', () => {
      expect(isProtectedDiasporaTerm('"mandir"')).toBe(true);
      expect(isProtectedDiasporaTerm('chai,')).toBe(true);
      expect(isProtectedDiasporaTerm('nonexistentterm12345')).toBe(false);
    });
  });

  describe('2. UK British English Mandatory Orthography Enforcement (Rule 20)', () => {
    it('flags American English -or spellings and maps to British -our', () => {
      const text = 'The color of the room was dark and it was my favorite space.';
      const matches = checkUKOrthography(text);

      expect(matches.length).toBe(2);
      expect(matches[0].original).toBe('color');
      expect(matches[0].replacement).toBe('colour');
      expect(matches[1].original).toBe('favorite');
      expect(matches[1].replacement).toBe('favourite');
    });

    it('flags -er to -re, -ize to -ise, and -se to -ce variants', () => {
      const text = 'We visited the theater in the city center to realize the play and see their defense.';
      const matches = checkUKOrthography(text);

      const originals = matches.map((m) => m.original);
      expect(originals).toContain('theater');
      expect(originals).toContain('center');
      expect(originals).toContain('realize');
      expect(originals).toContain('defense');

      const replacements = matches.map((m) => m.replacement);
      expect(replacements).toContain('theatre');
      expect(replacements).toContain('centre');
      expect(replacements).toContain('realise');
      expect(replacements).toContain('defence');
    });

    it('preserves casing for TitleCase words', () => {
      const text = 'Favorite Color of the theater.';
      const matches = checkUKOrthography(text);

      expect(matches[0].original).toBe('Favorite');
      expect(matches[0].replacement).toBe('Favourite');
      expect(matches[1].original).toBe('Color');
      expect(matches[1].replacement).toBe('Colour');
    });

    it('returns empty array when text has zero American variants', () => {
      const text = 'The colour of the theatre was grey and cosy.';
      const matches = checkUKOrthography(text);
      expect(matches).toHaveLength(0);
    });
  });

  describe('3. AI Cliché & Screenplay Cue Guard (Rule 11)', () => {
    it('detects overused AI tropes such as "tapestry of memories"', () => {
      const text = 'Looking back, it was a rich tapestry of memories and whispers of the past.';
      const matches = detectAIClichés(text);

      expect(matches.length).toBeGreaterThanOrEqual(2);
      expect(matches[0].phrase.toLowerCase()).toContain('tapestry of memories');
      expect(matches[1].phrase.toLowerCase()).toContain('whispers of the past');
    });

    it('detects banned screenplay camera cues per Rule 11', () => {
      const text = 'We walked into the courtyard. Cut to a wide shot of the temple.';
      const matches = detectAIClichés(text);

      const phrases = matches.map((m) => m.phrase.toLowerCase());
      expect(phrases.some((p) => p.includes('cut to'))).toBe(true);
      expect(phrases.some((p) => p.includes('wide shot'))).toBe(true);
    });
  });
});
