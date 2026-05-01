import { useMemo } from 'react';
import { CatalystType } from '@/types';

export interface DetectedAnchor {
  word: string;
  type: CatalystType;
}

// THE SENSORY DICTIONARY (Bespoke Edition with Cinematic Rationale)
export const SENSORY_DICTIONARY_DETAILED: Record<string, { words: string[], reason: string }> = {
  aroma: {
    words: ['soil', 'Madhapur', 'Kutch', 'vegetarian', 'farmers', 'staple', 'food', 'village', 'oregano', 'lavender', 'musk', 'scent', 'aroma', 'spice', 'sweet', 'burnt', 'smoke', 'fresh', 'rain', 'salty', 'perfume', 'cardamom', 'sandalwood', 'petrichor', 'frankincense', 'jasmine', 'turmeric'],
    reason: 'AROMA: Scent-memories like soil, spices, or regional food detected.'
  },
  soundscape: {
    words: ['language', 'Gujarati', 'lessons', 'parents', 'voice', 'culture', 'thunder', 'whisper', 'echo', 'melody', 'rhythm', 'noise', 'loud', 'quiet', 'music', 'ringing', 'crash', 'hum', 'silence', 'clatter', 'clink', 'rustle', 'crescendo', 'monotone', 'thrum', 'chime'],
    reason: 'SOUND: Language, dialects, or environmental sounds detected.'
  },
  visual: {
    words: ['Nairobi', 'Kenya', 'India', 'England', 'heritage', 'traveling', 'journey', 'values', 'neon', 'shadow', 'glow', 'emerald', 'crimson', 'bright', 'dark', 'blue', 'red', 'gold', 'clear', 'blurry', 'huge', 'tiny', 'light', 'sepia', 'monochrome', 'silhouette', 'radiant', 'amber', 'dappled', 'obsidian'],
    reason: 'VISUAL: Geographic locations, lighting cues, or striking visual details detected.'
  },
  clarity: {
    words: ['tapestry', 'odyssey', 'lineage', 'shallows', 'whispers', 'very', 'just', 'actually', 'really', 'simply', 'vibrant', 'testament', 'treasure trove', 'unfolding', 'delve', 'nuanced', 'embrace', 'interwoven', 'symphony', 'embark'],
    reason: 'CLARITY: This word is often overused or an AI cliché. Consider a more precise cinematic alternative.'
  }
};

// Flattened for backward compatibility in some logic if needed
export const SENSORY_DICTIONARY: Record<string, string[]> = {
  aroma: SENSORY_DICTIONARY_DETAILED.aroma.words,
  soundscape: SENSORY_DICTIONARY_DETAILED.soundscape.words,
  visual: SENSORY_DICTIONARY_DETAILED.visual.words,
  clarity: SENSORY_DICTIONARY_DETAILED.clarity.words
};

// Templates for each sensory type
// Templates for each sensory type - Using "Discovery" underlines and reason-tooltips
const TEMPLATES: Record<CatalystType, (word: string) => string> = {
  aroma: (word) => `<span class="sensory-bubble aroma-bubble border-b-2 border-amber-500/40 bg-amber-500/5 rounded-sm transition-all duration-700 cursor-help" data-reason="${SENSORY_DICTIONARY_DETAILED.aroma.reason}">${word}</span>`,
  soundscape: (word) => `<span class="sensory-bubble soundscape-bubble border-b-2 border-sky-500/40 bg-sky-500/5 rounded-sm transition-all duration-700 cursor-help" data-reason="${SENSORY_DICTIONARY_DETAILED.soundscape.reason}">${word}</span>`,
  visual: (word) => `<span class="sensory-bubble visual-bubble border-b-2 border-emerald-500/40 bg-emerald-500/5 rounded-sm transition-all duration-700 cursor-help" data-reason="${SENSORY_DICTIONARY_DETAILED.visual.reason}">${word}</span>`,
  polish: (word) => `<span class="sensory-bubble polish-bubble border-b-2 border-indigo-400/40 bg-indigo-400/5 rounded-sm transition-all duration-700 cursor-help" data-reason="AI Polish: This word has been refined for narrative flow.">${word}</span>`,
  clarity: (word) => `<span class="sensory-bubble clarity-bubble border-b-2 border-red-400/30 bg-red-400/5 rounded-sm transition-all duration-700 cursor-help decoration-dotted" data-reason="${SENSORY_DICTIONARY_DETAILED.clarity.reason}">${word}</span>`
};

export const detectAnchors = (text: string): DetectedAnchor[] => {
  const anchorsMap = new Map<string, CatalystType>();
  
  (Object.entries(SENSORY_DICTIONARY) as [CatalystType, string[]][]).forEach(([type, words]) => {
    words.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      if (regex.test(text)) {
        anchorsMap.set(word.toLowerCase(), type);
      }
    });
  });

  return Array.from(anchorsMap.entries()).map(([word, type]) => ({ word, type }));
};

export const useDirectorInk = (text: string) => {
  const result = useMemo(() => {
    if (!text) return { decoratedHtml: '', detectedAnchors: [], isOverloaded: false };

    const anchorsMap = new Map<string, CatalystType>();
    
    // 1. Create a map of word -> type for quick lookup
    const wordToType = new Map<string, CatalystType>();
    Object.entries(SENSORY_DICTIONARY).forEach(([type, words]) => {
      words.forEach(word => {
        wordToType.set(word.toLowerCase(), type as CatalystType);
      });
    });

    // 2. Build a single regex for all words
    // Sort words by length descending to match longer phrases first (though not strictly necessary here with \b)
    const allWords = Array.from(wordToType.keys()).sort((a, b) => b.length - a.length);
    const combinedRegex = new RegExp(`\\b(${allWords.join('|')})\\b`, 'gi');

    // 3. Escaping for safety (only & and <)
    const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

    // 4. Single-pass replacement
    const decoratedHtml = escapedText.replace(combinedRegex, (match) => {
      const type = wordToType.get(match.toLowerCase());
      if (type) {
        anchorsMap.set(match.toLowerCase(), type);
        return TEMPLATES[type](match);
      }
      return match;
    });

    return {
      decoratedHtml,
      detectedAnchors: Array.from(anchorsMap.entries()).map(([word, type]) => ({ word, type })),
      isOverloaded: anchorsMap.size >= 4
    };
  }, [text]);

  return result;
};

/**
 * Identifies if a given character index in a text falls within a sensory anchor.
 * Returns the anchor details if found.
 */
export const getAnchorAtCaret = (text: string, caretIndex: number) => {
  // 1. Find the word boundaries at the caret
  const left = text.slice(0, caretIndex).search(/\S+$/);
  const right = text.slice(caretIndex).search(/\s/);
  
  const start = left === -1 ? 0 : left;
  const end = right === -1 ? text.length : caretIndex + right;
  
  const word = text.slice(start, end).toLowerCase().replace(/[^\w]/g, '');
  
  // 2. Check if this word is in our dictionary
  for (const [type, data] of Object.entries(SENSORY_DICTIONARY_DETAILED)) {
    if (data.words.some(w => w.toLowerCase() === word)) {
      return {
        word,
        type: type as CatalystType | 'clarity',
        reason: data.reason,
        start,
        end
      };
    }
  }
  
  return null;
};

