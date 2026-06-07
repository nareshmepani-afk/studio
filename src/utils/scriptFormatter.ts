/**
 * Chronicle Cinema - Oratorical Cadence Suite Formatting Utilities
 */

/**
 * Replaces standard punctuation with theatrical breathing marks (slashes)
 * Commas are replaced with a single slash ' / '
 * Sentence terminals (., !, ?) are replaced with a double slash ' // '
 */
export function applyTheatricalSlashes(text: string): string {
  if (!text) return '';
  return text
    .replace(/,/g, ' /')
    .replace(/(?<!\.)\.(?!\.)/g, ' //') // Avoid breaking ellipses
    .replace(/\?/g, ' //')
    .replace(/!/g, ' //');
}

/**
 * Splits a text block into individual sentences while preserving sentence terminals
 */
export function tokenizeSentences(text: string): string[] {
  if (!text) return [];
  // Leverage boundary-preserving split regex
  return text
    .split(/(?<=[.!?]|\/\/)\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}
