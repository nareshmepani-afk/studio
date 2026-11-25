'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  Globe,
  MoreHorizontal,
  Lock,
  Loader2,
  CheckCircle2,
  CloudOff,
} from 'lucide-react';
import type { FiresideLanguage } from '@/types/fireside';

export interface FiresideMobileTopBarProps {
  partRoman: string;
  sceneNumberInPart: number;
  totalScenesInPart: number;
  isLockedPreview?: boolean;
  activeLanguage: FiresideLanguage;
  isHybrid: boolean;
  isSaving?: boolean;
  isSynced?: boolean;
  isOffline?: boolean;
  onOpenChapterSheet: () => void;
  onOpenLangSheet: () => void;
  onOpenMenuSheet: () => void;
}

const SHORT_LANG_CODE: Record<FiresideLanguage, string> = {
  en: 'EN',
  gu: 'ગુ',
  pa: 'ਪੰ',
  hi: 'हि',
};

/**
 * Fireside 2.0 Single 52px Mobile Top Bar (< 768px)
 * Replaces 7 stacked desktop chrome bands with one calm, elder-friendly bar:
 *   ← | Part I · Scene 1 ▾ | 🌐 | ⋯
 */
export const FiresideMobileTopBar: React.FC<FiresideMobileTopBarProps> = ({
  partRoman,
  sceneNumberInPart,
  totalScenesInPart,
  isLockedPreview = false,
  activeLanguage,
  isHybrid,
  isSaving = false,
  isSynced = false,
  isOffline = false,
  onOpenChapterSheet,
  onOpenLangSheet,
  onOpenMenuSheet,
}) => {
  return (
    <div
      data-testid="HS_FIRESIDE_MOBILE_TOP_BAR"
      className="md:hidden sticky top-0 z-40 w-full h-[52px] px-2.5 bg-stone-950/95 backdrop-blur-lg border-b border-stone-800/80 flex items-center justify-between gap-1.5"
    >
      {/* 1. Back to Studio Board */}
      <Link
        href="/studio"
        data-testid="HS_FIRESIDE_MOBILE_BACK_BTN"
        aria-label="Return to Production Board"
        title="Return to Production Board"
        className="min-h-[40px] min-w-[40px] rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-amber-300 flex items-center justify-center shrink-0 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </Link>

      {/* 2. Chapter & Scene Bottom-Sheet Trigger */}
      <button
        type="button"
        data-testid="HS_FIRESIDE_MOBILE_CHAPTER_TRIGGER"
        onClick={onOpenChapterSheet}
        aria-label={`Current chapter: ${partRoman}, Scene ${sceneNumberInPart} of ${totalScenesInPart}. Tap to browse all chapters and scenes.`}
        className="flex-1 min-w-0 min-h-[40px] px-3 py-1 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/30 text-stone-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        {isSaving ? (
          <Loader2 className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
        ) : isOffline ? (
          <CloudOff className="w-3 h-3 text-stone-400 shrink-0" />
        ) : isSynced ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
        )}

        <span className="text-xs font-mono font-semibold text-amber-200 truncate">
          {partRoman} · Scene {sceneNumberInPart}
          <span className="text-stone-400 font-normal">/{totalScenesInPart}</span>
        </span>

        {isLockedPreview && (
          <Lock className="w-3 h-3 text-amber-400 shrink-0" aria-label="Locked premium chapter" />
        )}

        <ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      </button>

      {/* 3. Compact Language & Hybrid Trigger */}
      <button
        type="button"
        data-testid="HS_FIRESIDE_MOBILE_LANG_TRIGGER"
        onClick={onOpenLangSheet}
        aria-label="Change storytelling language or bilingual subtitle mode"
        className={`min-h-[40px] px-2.5 rounded-xl border text-[11px] font-mono font-bold inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${
          isHybrid || activeLanguage !== 'en'
            ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
            : 'bg-stone-900/90 border-stone-800 text-stone-200 hover:border-amber-500/40'
        }`}
      >
        <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>{SHORT_LANG_CODE[activeLanguage]}</span>
      </button>

      {/* 4. Studio Overflow Menu Trigger (30s Soundcheck, Desktop Studio, Optics, Account) */}
      <button
        type="button"
        data-testid="HS_FIRESIDE_MOBILE_MENU_TRIGGER"
        onClick={onOpenMenuSheet}
        aria-label="Open Fireside Studio menu and 30-second soundcheck"
        className="min-h-[40px] min-w-[40px] rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-200 hover:text-amber-300 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FiresideMobileTopBar;
