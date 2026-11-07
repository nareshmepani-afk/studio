/**
 * Chronicle Cinema - Oratorical Cadence Suite Formatting Utilities
 */

/**
 * Replaces standard punctuation with theatrical breathing marks (slashes)
 * Commas are replaced with a single slash ' / '
 * Sentence terminals (., !, ?) are replaced with a double slash ' // '
 * Incorporates Safeguard 3: deduplicates adjacent punctuation + slash combinations
 * and orders double-slash replacements before single-slash replacements to prevent partial matches.
 */
export function applyTheatricalSlashes(text: string): string {
  if (!text) return '';
  return text
    // 1. First, normalize double slashes combined with punctuation
    .replace(/\s*,\s*\/\/\s*/g, ' // ')
    .replace(/\s*\/\/\s*,\s*/g, ' // ')
    .replace(/\s*[.!?]\s*\/\/\s*/g, ' // ')
    .replace(/\s*\/\/\s*[.!?]\s*/g, ' // ')
    // 2. Normalize single slashes combined with punctuation
    .replace(/\s*[.!?]\s*\/(?!\/)\s*/g, ' // ') // period + single slash defaults to full stop brake
    .replace(/\s*\/(?!\/)\s*[.!?]\s*/g, ' // ')
    .replace(/\s*,\s*\/(?!\/)\s*/g, ' / ')      // comma + single slash collapses to single slash
    .replace(/\s*\/(?!\/)\s*,\s*/g, ' / ')
    // 3. Convert standard punctuation
    .replace(/(?<!\.)\.(?!\.)/g, ' //')
    .replace(/\?/g, ' //')
    .replace(/!/g, ' //')
    .replace(/,/g, ' /')
    // 4. Deduplicate multiple slashes
    .replace(/\s*\/\/\s*\/\/\s*/g, ' // ')
    .replace(/\s*\/\/\s*\/(?!\/)\s*/g, ' // ')
    .replace(/\s*\/(?!\/)\s*\/\/\s*/g, ' // ')
    .replace(/\s*\/(?!\/)\s*\/(?!\/)\s*/g, ' // ')
    .replace(/\s{2,}/g, ' ')
    .trim();
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

/**
 * Deterministic Midpoint Clause Splitter (FEAT-MW-176)
 *
 * Scans a sentence exceeding 24 words and inserts a breath marker ('//' or '/')
 * at the nearest natural spoken clause hinge near the word midpoint ($M = \lfloor W / 2 \rfloor$).
 *
 * Safeguards:
 * 1. Non-Destructive Comma Split: If splitting at a comma, inserts marker AFTER the comma (e.g. ', // ')
 *    so clearCadenceMarkers preserves the narrator's original punctuation.
 * 2. Bounded Hinge Radius: Constrains search window strictly to ensure both resulting segments have <= 24 words.
 */
export function splitSentenceAtHinge(
  text: string,
  targetRunIndex: number = 0,
  marker: '/' | '//' = '//'
): string {
  if (!text || text.trim().length === 0) return text;

  // Break text into runs preserving delimiters
  const rawRuns = text.split(/(?<=[.?!;:\n]+|(?:\s+\/\/?\s+))/);
  let accumulatedIndex = 0;
  const runsWithPos = rawRuns.map((r) => {
    const start = text.indexOf(r, accumulatedIndex);
    accumulatedIndex = start + r.length;
    const words = r.trim().split(/\s+/).filter(Boolean);
    return { text: r, start, end: accumulatedIndex, words, wordCount: words.length };
  });

  const longRuns = runsWithPos.filter((r) => r.wordCount > 24);
  if (longRuns.length === 0) return text;

  const targetRun =
    targetRunIndex >= 0 && targetRunIndex < longRuns.length
      ? longRuns[targetRunIndex]
      : longRuns[0];

  const words = targetRun.words;
  const W = words.length;
  const M = Math.floor(W / 2);

  // Bounded window: both resulting halves must be <= 23 words (safely under 24-word threshold)
  // This prevents early introductory commas (words 1-3) or trailing commas from leaving a >24-word run.
  const minIdx = Math.max(4, W - 23);
  const maxIdx = Math.min(23, W - 4);

  // Word tokens with character offsets inside targetRun.text
  const wordTokens: Array<{ word: string; index: number }> = [];
  let wSearchStart = 0;
  for (const w of words) {
    const pos = targetRun.text.indexOf(w, wSearchStart);
    wordTokens.push({ word: w, index: pos });
    wSearchStart = pos + w.length;
  }

  // Priority 1: Comma within [minIdx, maxIdx] closest to M
  let bestHinge: { type: 'comma' | 'word' | 'fallback'; wordIdx: number; charOffset: number } | null = null;
  let minDistance = Infinity;

  for (let i = minIdx; i <= maxIdx; i++) {
    const token = wordTokens[i - 1];
    if (token && token.word.endsWith(',')) {
      const dist = Math.abs(i - M);
      if (dist < minDistance) {
        minDistance = dist;
        // Non-destructive: insert AFTER the comma
        bestHinge = { type: 'comma', wordIdx: i, charOffset: token.index + token.word.length };
      }
    }
  }

  // Priority 2: Natural spoken hinge words within [minIdx, maxIdx] closest to M
  const hingeWordRegex = /^(and|but|while|because|when|where|to|with|feeling|passing|turning|filling|drifting|gathering|listening|watching|holding|standing|walking)$/i;
  if (!bestHinge) {
    for (let i = minIdx; i <= maxIdx; i++) {
      const token = wordTokens[i - 1];
      if (token) {
        const cleanW = token.word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (hingeWordRegex.test(cleanW)) {
          const dist = Math.abs(i - M);
          if (dist < minDistance) {
            minDistance = dist;
            bestHinge = { type: 'word', wordIdx: i, charOffset: token.index };
          }
        }
      }
    }
  }

  // Priority 3: Fallback word gap at M
  if (!bestHinge) {
    const fallbackIdx = Math.min(Math.max(M, minIdx), maxIdx);
    const token = wordTokens[fallbackIdx - 1];
    if (token) {
      bestHinge = { type: 'fallback', wordIdx: fallbackIdx, charOffset: token.index + token.word.length };
    }
  }

  if (!bestHinge) return text;

  const absSplitPos = targetRun.start + bestHinge.charOffset;
  const before = text.slice(0, absSplitPos);
  const after = text.slice(absSplitPos);

  const spacerBefore = before.endsWith(' ') ? '' : ' ';
  const spacerAfter = after.startsWith(' ') ? '' : ' ';

  return before + spacerBefore + marker + spacerAfter + after;
}

/**
 * Clears all manual cadence slashes ('/' and '//') from prose,
 * collapsing multiple whitespace spaces into single spaces.
 */
export function clearCadenceMarkers(text: string): string {
  if (!text) return '';
  return text
    .replace(/(^|\s)\/\/?(?=\s|$)/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
