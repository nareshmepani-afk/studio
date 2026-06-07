import { describe, it, expect } from 'vitest';
import { applyTheatricalSlashes, tokenizeSentences } from '../scriptFormatter';

describe('scriptFormatter utility', () => {
  describe('applyTheatricalSlashes', () => {
    it('replaces commas with single slash and punctuation with double slashes', () => {
      const input = "Hello, world. How are you? Fantastic!";
      const expected = "Hello / world // How are you // Fantastic //";
      expect(applyTheatricalSlashes(input)).toBe(expected);
    });

    it('does not replace ellipses with double slashes', () => {
      const input = "Loading...";
      const expected = "Loading...";
      expect(applyTheatricalSlashes(input)).toBe(expected);
    });

    it('returns empty string for empty inputs', () => {
      expect(applyTheatricalSlashes('')).toBe('');
    });
  });

  describe('tokenizeSentences', () => {
    it('splits text into sentences preserving boundaries', () => {
      const input = "Hello world. How are you? Fantastic!";
      const result = tokenizeSentences(input);
      expect(result).toEqual([
        "Hello world.",
        "How are you?",
        "Fantastic!"
      ]);
    });

    it('splits text with theatrical slashes correctly', () => {
      const input = "Hello world // How are you //";
      const result = tokenizeSentences(input);
      expect(result).toEqual([
        "Hello world //",
        "How are you //"
      ]);
    });

    it('returns empty array for empty inputs', () => {
      expect(tokenizeSentences('')).toEqual([]);
    });
  });
});
