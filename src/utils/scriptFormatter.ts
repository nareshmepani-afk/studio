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

/**
 * Calculates auto-scroll pause duration for teleprompters:
 * - 500ms for full sentence terminals (., !, ?) or deep breath markers (//)
 * - 200ms for clause hinges (,) or short pause markers (/)
 * - 0ms otherwise
 */
export function getBrakeDuration(text: string): number {
  if (!text) return 0;
  const clean = text.trim();
  if (clean.endsWith('//') || /(?:^|\s|[.?!;:,])\/\/(?:\s|[.?!;:,])*$/.test(clean) || /[.!?]$/.test(clean)) {
    return 500;
  }
  if (clean.endsWith('/') || /(?:^|\s|[.?!;:,])(?<!\/)\/(?!\/)(?:\s|[.?!;:,])*$/.test(clean) || /[,]$/.test(clean)) {
    return 200;
  }
  if (clean.endsWith(':') || clean.endsWith('-') || clean.endsWith(';')) {
    return 300;
  }
  return 0;
}

export interface PrompterRenderOptions {
  autoBreath?: boolean;
  highlightSensory?: boolean;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SOUND_WORDS = [
  'train', 'whistle', 'whistling', 'whistles', 'drumming', 'drummed', 'kettle', 'laughter',
  'crackle', 'ticking', 'bell', 'bells', 'chime', 'chimes', 'voice', 'sound', 'hum', 'whisper',
  'whispers', 'rustle', 'thud', 'language', 'Gujarati', 'lessons', 'parents', 'culture',
  'education', 'mother tongue', 'skills', 'tongue', 'thunder', 'echo', 'melody', 'rhythm',
  'noise', 'loud', 'quiet', 'music', 'ringing', 'crash', 'silence', 'clatter', 'clink',
  'crescendo', 'monotone', 'thrum', 'chorus', 'singing', 'song'
];

const AROMA_WORDS = [
  'soil', 'Madhapur', 'Kutch', 'vegetarian', 'farmers', 'farming', 'staple', 'food',
  'village', 'machinery', 'produce', 'labourers', 'oregano', 'lavender', 'musk', 'scent',
  'aroma', 'spice', 'spices', 'sweet', 'burnt', 'smoke', 'fresh', 'rain', 'salty',
  'perfume', 'cardamom', 'chai', 'sandalwood', 'petrichor', 'frankincense', 'jasmine',
  'turmeric', 'warm', 'fragrant', 'piping', 'coffee', 'books', 'rose', 'roasting'
];

const VISUAL_WORDS = [
  'sun', 'glow', 'light', 'lamplight', 'amber', 'dust', 'gold', 'golden', 'shadow',
  'warmth', 'windowpane', 'ceramic', 'rough', 'damp', 'heat', 'bright', 'dark', 'Nairobi',
  'Kenya', 'India', 'England', 'heritage', 'traveling', 'journey', 'values', 'ancestors',
  'generations', 'Granddad', 'Granddads', 'roots', 'neon', 'emerald', 'crimson', 'blue',
  'red', 'clear', 'blurry', 'huge', 'tiny', 'sepia', 'monochrome', 'silhouette', 'radiant',
  'dappled', 'obsidian', 'cracked', 'glass', 'steaming', 'stove'
];

// Disjoint word classification (Priority: Aroma > Sound > Visual)
const aromaSet = new Set(AROMA_WORDS.map(w => w.toLowerCase()));
const soundList = SOUND_WORDS.filter(w => !aromaSet.has(w.toLowerCase()));
const soundSet = new Set(soundList.map(w => w.toLowerCase()));
const visualList = VISUAL_WORDS.filter(w => !aromaSet.has(w.toLowerCase()) && !soundSet.has(w.toLowerCase()));

const aromaPattern = AROMA_WORDS.map(escapeRegExp).join('|');
const soundPattern = soundList.map(escapeRegExp).join('|');
const visualPattern = visualList.map(escapeRegExp).join('|');

/**
 * Universal Isomorphic Teleprompter Cadence & Sensory Highlighter
 * Produces byte-for-byte identical HTML across Soundstage, Popout Teleprompter, and Fireside Studio.
 */
export function renderPrompterCadenceHtml(text: string, options: PrompterRenderOptions = {}): string {
  if (!text) return '';
  const { autoBreath = false, highlightSensory = true } = options;

  // Safeguard A: Escape raw HTML entities on plain text before slash conversion or tag injection
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let processed = autoBreath ? applyTheatricalSlashes(escaped) : escaped;

  if (highlightSensory) {
    // 1. Aroma Anchors (Amber Gold)
    const aromaRegex = new RegExp(`(<[^>]*>)|\\b(${aromaPattern})\\b`, 'gi');
    processed = processed.replace(aromaRegex, (match, tag, word) => {
      if (tag) return tag;
      return `<span data-sensory-cue="aroma" data-prompter-tooltip-title="SENSORY ANCHOR • AROMA" data-prompter-tooltip-desc="Slow your cadence and breathe in gently as you evoke this scent." data-prompter-tooltip-tone="amber" class="px-0.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold transition-all hover:bg-amber-500/20 cursor-help" title="Scent Anchor: Slow your cadence and breathe in gently as you evoke this scent.">${word}</span>`;
    });

    // 2. Soundscape Anchors (Sky Blue)
    const soundRegex = new RegExp(`(<[^>]*>)|\\b(${soundPattern})\\b`, 'gi');
    processed = processed.replace(soundRegex, (match, tag, word) => {
      if (tag) return tag;
      return `<span data-sensory-cue="sound" data-prompter-tooltip-title="SENSORY ANCHOR • SOUNDSCAPE" data-prompter-tooltip-desc="Drop your vocal register slightly and let the acoustic memory resonate." data-prompter-tooltip-tone="sky" class="px-0.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.25)] font-bold transition-all hover:bg-sky-500/20 cursor-help" title="Sound Anchor: Drop your vocal register slightly and let the acoustic memory resonate.">${word}</span>`;
    });

    // 3. Visual & Texture Anchors (Emerald Green)
    const visualRegex = new RegExp(`(<[^>]*>)|\\b(${visualPattern})\\b`, 'gi');
    processed = processed.replace(visualRegex, (match, tag, word) => {
      if (tag) return tag;
      return `<span data-sensory-cue="visual" data-prompter-tooltip-title="SENSORY ANCHOR • VISUAL &amp; TEXTURE" data-prompter-tooltip-desc="Hold steady eye contact with the lens as you paint this visual detail." data-prompter-tooltip-tone="emerald" class="px-0.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold transition-all hover:bg-emerald-500/20 cursor-help" title="Visual/Texture Anchor: Hold steady eye contact with the lens as you paint this visual detail.">${word}</span>`;
    });
  }

  // 4. Double Slashes (//) Deep Breath - Sky Blue with 2 pulsing dots
  const doubleSlashRegex = /(<[^>]*>)|(\s+\/\/|\/\/)/g;
  processed = processed.replace(doubleSlashRegex, (match, tag) => {
    if (tag) return tag;
    return ` <span data-slash-cue="double" data-prompter-tooltip-title="CADENCE CUE • DEEP BREATH ( // )" data-prompter-tooltip-desc="Full sentence brake (~0.5s). Pause, breathe deeply, and reconnect eye contact with the camera lens." data-prompter-tooltip-tone="sky" title="Cadence Cue ( // ): Deep Breath &amp; Full Sentence Pause (~0.5s) — Pause, breathe deeply, and reconnect eye contact with the lens." class="relative inline-flex flex-col items-center justify-center mx-1.5 px-1 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono font-bold text-xs select-none shadow-[0_0_8px_rgba(56,189,248,0.3)] border border-sky-400/30 hover:bg-sky-500/20 group select-none cursor-help after:content-[''] after:absolute after:-inset-x-1 after:-top-1 after:-bottom-3"><span class="leading-none">//</span><span class="absolute -bottom-2 flex gap-1 items-center justify-center cursor-help"><span class="relative flex items-center justify-center"><span class="absolute w-2 h-2 rounded-full bg-sky-400/80 animate-ping" style="animation-duration: 1.5s;"></span><span class="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span></span><span class="relative flex items-center justify-center"><span class="absolute w-2 h-2 rounded-full bg-sky-400/80 animate-ping" style="animation-duration: 1.5s; animation-delay: 0.3s;"></span><span class="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span></span></span></span>`;
  });

  // 5. Single Slashes (/) Short Breath - Emerald with 1 pulsing dot (disjoint negative lookbehind & lookahead so // is never split)
  const singleSlashRegex = /(<[^>]*>)|(\s+(?<!\/)\/(?!\/)|(?<!\/)\/(?!\/))/g;
  processed = processed.replace(singleSlashRegex, (match, tag) => {
    if (tag) return tag;
    return ` <span data-slash-cue="single" data-prompter-tooltip-title="CADENCE CUE • SHORT BREATH ( / )" data-prompter-tooltip-desc="Clause micro-pause (~0.2s). Take a gentle half-breath and let the phrase settle before continuing." data-prompter-tooltip-tone="emerald" title="Cadence Cue ( / ): Short Breath &amp; Clause Micro-Pause (~0.2s) — Take a gentle half-breath and let the phrase settle." class="relative inline-flex flex-col items-center justify-center mx-1 px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono font-bold text-xs select-none shadow-[0_0_8px_rgba(52,211,153,0.3)] border border-emerald-400/30 hover:bg-emerald-500/20 group select-none cursor-help after:content-[''] after:absolute after:-inset-x-1 after:-top-1 after:-bottom-3"><span class="leading-none">/</span><span class="absolute -bottom-2 flex items-center justify-center cursor-help"><span class="absolute w-2 h-2 rounded-full bg-emerald-400/80 animate-ping" style="animation-duration: 1.5s;"></span><span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span></span></span>`;
  });

  return processed;
}
