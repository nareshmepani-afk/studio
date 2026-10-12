'use client';

/**
 * folioTokens.ts — The Heirloom Folio Design Tokens & Typographic System
 * Architecture Reference: ARCH-MW-139 / SPEC-MW-139
 *
 * Constitutional Principles:
 *  • Rule 20: Strict UK English orthography across all labels.
 *  • Rule 26: Elder Typographic Baseline (Strict minimum text-xs / 12px for all metadata).
 *  • Safeguard 1: Safe-area inset bottom calculation for iOS Home Indicator.
 *  • Safeguard 2: Viewport-adaptive spine widths (Micro-Spine w-14 vs Full Ledger w-64).
 *  • Safeguard 4: Protruding tab negative translation (-translate-x-1) with overflow-visible.
 */

export interface FolioSceneToken {
  id: string;
  index: number;
  sceneNumber?: number;
  title: string;
  partNumber: number;
  partTitle?: string;
  hasCompletedReel: boolean;
  hasDraftProse: boolean;
  takesCount: number;
  isNextRecommended?: boolean;
}

export type FolioSceneState = 'completed' | 'draft' | 'empty' | 'active';

const UNICODE_ROMAN: Record<number, string> = {
  1: 'Ⅰ', 2: 'Ⅱ', 3: 'Ⅲ', 4: 'Ⅳ', 5: 'Ⅴ',
  6: 'Ⅵ', 7: 'Ⅶ', 8: 'Ⅷ', 9: 'Ⅸ', 10: 'Ⅹ',
  11: 'Ⅺ', 12: 'Ⅻ',
};

/**
 * Convert numbers (1..31) to classic Roman Numerals for compact Filofax tabs
 */
export function toRomanNumeral(num: number): string {
  if (UNICODE_ROMAN[num]) return UNICODE_ROMAN[num];
  if (num <= 0) return `${num}`;

  let tens = Math.floor(num / 10);
  let rem = num % 10;
  let result = 'Ⅹ'.repeat(tens);
  if (rem > 0 && UNICODE_ROMAN[rem]) {
    result += UNICODE_ROMAN[rem];
  }
  return result || `${num}`;
}

export const PART_ROMAN_NUMERALS: Record<number, string> = {
  1: 'PART I',
  2: 'PART II',
  3: 'PART III',
  4: 'PART IV',
  5: 'PART V',
  6: 'PART VI',
};

export function resolveFolioSceneState(
  scene: FolioSceneToken,
  isActive: boolean
): FolioSceneState {
  if (isActive) return 'active';
  if (scene.hasCompletedReel || scene.takesCount > 0) return 'completed';
  if (scene.hasDraftProse) return 'draft';
  return 'empty';
}

export const FOLIO_LAYOUT = {
  /** Safeguard 1: Dynamic iOS safe-area bottom offset for floating dial */
  SAFE_AREA_DIAL_BOTTOM: 'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]',
  /** Safeguard 2: Tablet Micro-Spine width (768px – 1023px) */
  MICRO_SPINE_WIDTH: 'w-14',
  /** Safeguard 2: Full Desktop Spine width (>= 1024px) */
  FULL_SPINE_WIDTH: 'w-64',
  /** Master workstation in-flow container padding */
  WORKSTATION_CONTAINER_PADDING: 'lg:pr-64',
  /** Minimum touch target size per Rule 26 */
  MIN_TOUCH_TARGET: 'min-h-[48px] min-w-[48px]',
} as const;

export const FOLIO_TYPOGRAPHY = {
  /** Safeguard 3: Strict elder baseline (minimum text-xs / 12px, tracking-widest) */
  METADATA_PILL: 'text-xs font-mono font-bold uppercase tracking-[0.15em]',
  HALLMARK_TITLE: 'text-base sm:text-lg font-serif font-semibold tracking-wide text-white/95',
  CHAPTER_NUMBER: 'text-xs font-mono font-semibold text-amber-400/90',
  TAB_LABEL: 'text-xs font-mono font-medium truncate',
} as const;

export const FOLIO_CHROMA = {
  // Gilded Hallmark & Antique Ledger Accents
  GOLD_ACCENT: '#f59e0b',
  GOLD_BORDER: 'border-amber-500/30',
  GOLD_BG_FAINT: 'bg-amber-500/10',
  GOLD_HOVER_BG: 'hover:bg-amber-500/20',

  // Folio Bed & Surface Materials
  BED_BACKGROUND: 'bg-stone-950/90',
  PARCHMENT_SURFACE: 'bg-stone-900/60',
  SURFACE_BORDER: 'border-stone-800/80',

  // State Dot & Tab Styles
  STATE_STYLES: {
    active: {
      tabBg: 'bg-amber-500/15 border-amber-400/50 text-amber-200',
      dotColor: 'text-amber-400',
      ringColor: 'ring-1 ring-amber-400/50',
      shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    },
    completed: {
      tabBg: 'bg-teal-950/30 border-teal-500/30 text-teal-200',
      dotColor: 'text-teal-400',
      ringColor: 'ring-1 ring-teal-500/30',
      shadow: 'shadow-none',
    },
    draft: {
      tabBg: 'bg-amber-950/20 border-amber-500/20 text-stone-300',
      dotColor: 'text-amber-400/80',
      ringColor: 'ring-1 ring-amber-500/20',
      shadow: 'shadow-none',
    },
    empty: {
      tabBg: 'bg-stone-950/40 border-stone-800/40 text-stone-500',
      dotColor: 'text-stone-600',
      ringColor: 'ring-0',
      shadow: 'shadow-none',
    },
  },
} as const;
