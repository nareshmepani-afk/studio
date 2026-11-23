import { describe, it, expect } from 'vitest';
import {
  isProtectedDiasporaTerm,
  checkUKOrthography,
  enforceBritishEnglish,
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

    it('handles punctuation, whitespace, and plural inflections (-s, -es)', () => {
      expect(isProtectedDiasporaTerm('"mandir"')).toBe(true);
      expect(isProtectedDiasporaTerm('chai,')).toBe(true);
      expect(isProtectedDiasporaTerm('samosas')).toBe(true);
      expect(isProtectedDiasporaTerm('rotis')).toBe(true);
      expect(isProtectedDiasporaTerm('diyas')).toBe(true);
      expect(isProtectedDiasporaTerm('mandirs')).toBe(true);
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

  describe('4. Deterministic UK English Enforcement & Prompt Hygiene (MW-420)', () => {
    it('enforceBritishEnglish deterministically converts US spellings while preserving casing and diaspora heritage terms', () => {
      expect(
        enforceBritishEnglish('Innocence, childhood friendships, and the first spark of curiosity. The red color of the sun.')
      ).toBe('Innocence, childhood friendships, and the first spark of curiosity. The red colour of the sun.');

      expect(
        enforceBritishEnglish('Favorite COLOR at the mandir with warm masala chai and gray skies.')
      ).toBe('Favourite COLOUR at the mandir with warm masala chai and grey skies.');
    });

    it('guards aiWeaver.ts and ProductionDeck.tsx against US spelling leakage, hardcoded personal mantras, and age=0 infant hallucinations', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const aiWeaverSrc = fs.readFileSync(path.resolve(__dirname, '../actions/aiWeaver.ts'), 'utf-8');
      const deckSrc = fs.readFileSync(path.resolve(__dirname, '../components/studio/ProductionDeck.tsx'), 'utf-8');

      expect(aiWeaverSrc).toContain('enforceBritishEnglish');
      expect(aiWeaverSrc).not.toContain('Learn, adapt, work hard, keep going.');
      expect(aiWeaverSrc).toContain('narratorAgeAtTime > 0 && narratorAgeAtTime < 4');
      expect(aiWeaverSrc).toContain('PROPER-NOUN & CULTURAL-FRAMING FIDELITY');
      expect(deckSrc).toContain('enforceBritishEnglish(rawOriginalScript)');
    });
  });
});
