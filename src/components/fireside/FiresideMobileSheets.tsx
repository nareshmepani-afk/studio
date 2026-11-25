'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  BookOpen,
  CheckCircle2,
  Compass,
  Film,
  Globe,
  Lock,
  LogIn,
  LogOut,
  Monitor,
  Sparkles,
  User,
  Coffee,
  MapPin,
} from 'lucide-react';
import { MASTER_STORY_STRUCTURE } from '@/lib/curriculum/masterStoryStructure';
import { FIRESIDE_LANGUAGE_LABELS, type FiresideLanguage } from '@/types/fireside';
import type { UnifiedCurriculumMemory } from '@/types/curriculum';
import type { SceneAccessEvaluation } from '@/lib/curriculum/entitlements';
import { isSceneCompleted } from '@/hooks/useCurriculumVault';
import { OpticsPrivacyShield } from '@/components/studio/OpticsPrivacyShield';
import { ReportIssueTrigger } from '@/components/feedback/ReportIssueTrigger';
import { MemoryCoordinatesBar } from '@/components/studio/MemoryCoordinatesBar';

export const FIRESIDE_WELCOME_DISMISSED_KEY = 'mw_fireside_welcome_dismissed';

export interface FiresideChapterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSceneId: string;
  activeLanguage: FiresideLanguage;
  wovenCount: number;
  totalScenes: number;
  wovenPercent: number;
  premieredCount: number;
  getSceneMemory: (sceneId: string) => UnifiedCurriculumMemory | undefined;
  getSceneAccess: (sceneId: string) => SceneAccessEvaluation;
  onSelectScene: (sceneId: string) => void;
  onOpenUpgradeSheet: () => void;
}

export const FiresideChapterSheet: React.FC<FiresideChapterSheetProps> = ({
  open,
  onOpenChange,
  activeSceneId,
  wovenCount,
  totalScenes,
  wovenPercent,
  premieredCount,
  getSceneMemory,
  getSceneAccess,
  onSelectScene,
  onOpenUpgradeSheet,
}) => {
  const memoirParts = MASTER_STORY_STRUCTURE.filter((p) => !p.isDemo);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-testid="HS_FIRESIDE_CHAPTER_SHEET"
        className="max-h-[82dvh] rounded-t-3xl bg-stone-950 border-t border-amber-500/35 text-stone-100 p-0 flex flex-col z-[140]"
      >
        {/* Drag Handle */}
        <div className="w-full pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-stone-700" />
        </div>

        <SheetHeader className="px-5 pb-3 border-b border-stone-800/80 text-left shrink-0">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-base font-serif text-amber-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Chapters &amp; Story Scenes</span>
            </SheetTitle>
            <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              {wovenCount} of {totalScenes} Woven ({wovenPercent}%)
              {premieredCount > 0 ? ` · ${premieredCount} in Cinema` : ''}
            </span>
          </div>
          <SheetDescription className="text-xs text-stone-400">
            Tap any scene to open it in Fireside Studio. Part I is free forever; Parts II–VI unlock with a Director Pass.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {memoirParts.map((part) => {
            const firstSceneAccess = part.scenes[0]
              ? getSceneAccess(part.scenes[0].id)
              : null;
            const isPartLocked = Boolean(
              firstSceneAccess?.isPremium && !firstSceneAccess?.hasEntitlement
            );

            return (
              <div
                key={part.id}
                data-testid={`fireside-chapter-part-${part.id}`}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-2 px-1">
                  <div>
                    <h4 className="text-sm font-serif font-semibold text-white">
                      {part.title}
                    </h4>
                    {part.localizedTitles?.gu && (
                      <p className="text-[11px] text-amber-200/70 font-serif">
                        {part.localizedTitles.gu}
                      </p>
                    )}
                  </div>
                  {isPartLocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        onOpenUpgradeSheet();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Upgrade</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Unlocked
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {part.scenes.map((scene) => {
                    const mem = getSceneMemory(scene.id);
                    const access = getSceneAccess(scene.id);
                    const isSelected = scene.id === activeSceneId;
                    const isPublished = mem?.status === 'published';
                    const completed = isSceneCompleted(mem);

                    return (
                      <button
                        key={scene.id}
                        type="button"
                        data-testid={`HS_FIRESIDE_SHEET_SCENE_${scene.id}`}
                        onClick={() => {
                          onSelectScene(scene.id);
                          onOpenChange(false);
                        }}
                        className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400/60 ring-1 ring-amber-400/30'
                            : access.isLockedPreview
                            ? 'bg-stone-900/40 border-stone-800/70 opacity-60 hover:opacity-90'
                            : 'bg-stone-900/80 hover:bg-stone-900 border-stone-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-400">
                            <span>Scene {scene.sceneNumber}</span>
                            {isPublished && (
                              <span className="text-emerald-300 font-bold">• IN CINEMA</span>
                            )}
                            {!isPublished && completed && (
                              <span className="text-amber-300 font-bold">• WOVEN</span>
                            )}
                            {access.isGrandfathered && (
                              <span className="text-sky-300 font-bold">• SAVED</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-stone-100 truncate">
                            {scene.title}
                          </p>
                        </div>

                        {access.isLockedPreview ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold shrink-0">
                            <Lock className="w-3 h-3" />
                            <span>Preview</span>
                          </span>
                        ) : isPublished ? (
                          <Film className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : completed ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <span className="text-xs font-mono text-sky-400 shrink-0">Open →</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export interface FiresideLangSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeLanguage: FiresideLanguage;
  isHybrid: boolean;
  onSelectLanguage: (lang: FiresideLanguage) => void;
  onToggleHybrid: (next: boolean) => void;
}

export const FiresideLangSheet: React.FC<FiresideLangSheetProps> = ({
  open,
  onOpenChange,
  activeLanguage,
  isHybrid,
  onSelectLanguage,
  onToggleHybrid,
}) => {
  const langs: FiresideLanguage[] = ['en', 'gu', 'pa', 'hi'];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-testid="HS_FIRESIDE_MOBILE_LANG_SHEET"
        className="rounded-t-3xl bg-stone-950 border-t border-amber-500/35 text-stone-100 p-5 space-y-4 z-[140]"
      >
        <div className="w-full flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-stone-700" />
        </div>
        <SheetHeader className="text-left">
          <SheetTitle className="text-base font-serif text-amber-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Storytelling Language &amp; Subtitles</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-stone-400">
            Choose your primary prompt language and optional bilingual mother-tongue subtitles.
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-2.5">
          {langs.map((lang) => {
            const active = activeLanguage === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  onSelectLanguage(lang);
                  onOpenChange(false);
                }}
                className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl border text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                    : 'bg-stone-900 border-stone-800 text-stone-200 hover:bg-stone-800'
                }`}
              >
                <span>{FIRESIDE_LANGUAGE_LABELS[lang]}</span>
                {active && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onToggleHybrid(!isHybrid)}
          className={`w-full min-h-[48px] px-4 py-2.5 rounded-2xl border text-xs font-mono font-bold flex items-center justify-between transition-all cursor-pointer ${
            isHybrid
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
              : 'bg-stone-900 border-stone-800 text-stone-300'
          }`}
        >
          <span>Bilingual Subtitles (HYBRID)</span>
          <span>{isHybrid ? 'ON ✓' : 'OFF'}</span>
        </button>
      </SheetContent>
    </Sheet>
  );
};

export interface FiresideStudioMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAuthenticated: boolean;
  userEmail?: string | null;
  tierLabel: string;
  showStagingBadge: boolean;
  commitSha?: string;
  onLaunchSoundcheck: () => void;
  onSignOut: () => void;
}

export const FiresideStudioMenuSheet: React.FC<FiresideStudioMenuSheetProps> = ({
  open,
  onOpenChange,
  isAuthenticated,
  userEmail,
  tierLabel,
  showStagingBadge,
  commitSha,
  onLaunchSoundcheck,
  onSignOut,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-testid="HS_FIRESIDE_MOBILE_MENU_SHEET"
        className="max-h-[82dvh] rounded-t-3xl bg-stone-950 border-t border-amber-500/35 text-stone-100 p-5 space-y-4 overflow-y-auto z-[140]"
      >
        <div className="w-full flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-stone-700" />
        </div>
        <SheetHeader className="text-left">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-base font-serif text-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Fireside Studio Options</span>
            </SheetTitle>
            {showStagingBadge && (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                Dev Staging{commitSha ? ` · ${commitSha.slice(0, 7)}` : ''}
              </span>
            )}
          </div>
          <SheetDescription className="text-xs text-stone-400">
            Practice soundcheck, camera privacy controls, and account settings.
          </SheetDescription>
        </SheetHeader>

        {/* Account Summary */}
        <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <User className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-stone-100 truncate">
                {isAuthenticated ? userEmail || 'Signed-In Storyteller' : 'Guest Phone Session'}
              </p>
              <p className="text-[11px] font-mono text-emerald-300">{tierLabel}</p>
            </div>
          </div>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onSignOut();
              }}
              className="min-h-[40px] px-3 rounded-xl bg-stone-800 hover:bg-rose-950/60 border border-stone-700 text-xs font-mono text-stone-300 hover:text-rose-200 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              href="/login?redirect=/studio/fireside"
              onClick={() => onOpenChange(false)}
              className="min-h-[40px] px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-mono font-bold inline-flex items-center gap-1.5 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {/* Primary Utility Actions */}
        <div className="space-y-2">
          <button
            type="button"
            data-testid="HS_FIRESIDE_MENU_SOUNDCHECK_BTN"
            onClick={() => {
              onOpenChange(false);
              onLaunchSoundcheck();
            }}
            className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-sm font-medium flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>30-Second Practice &amp; Mic Soundcheck</span>
            </span>
            <span className="text-xs font-mono text-emerald-300">Start →</span>
          </button>

          <Link
            href="/studio"
            onClick={() => onOpenChange(false)}
            className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 text-sm font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2.5">
              <Monitor className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Return to Production Board (/studio)</span>
            </span>
            <span className="text-xs font-mono text-stone-400">↗</span>
          </Link>
        </div>

        {/* Privacy Shield & Issue Trigger */}
        <div className="pt-2 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <OpticsPrivacyShield compact className="min-h-[40px]" />
          <ReportIssueTrigger variant="icon-pill" label="Report Issue" />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export interface FiresideCoordinatesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: string;
  country: string;
  day: string;
  month: string;
  year: string;
  narratorAgeAtTime: number;
  onChangeLocation: (v: string) => void;
  onChangeCountry: (v: string) => void;
  onChangeDay: (v: string) => void;
  onChangeMonth: (v: string) => void;
  onChangeYear: (v: string) => void;
  onChangeAge: (v: number) => void;
}

export const FiresideCoordinatesSheet: React.FC<FiresideCoordinatesSheetProps> = ({
  open,
  onOpenChange,
  location,
  country,
  day,
  month,
  year,
  narratorAgeAtTime,
  onChangeLocation,
  onChangeCountry,
  onChangeDay,
  onChangeMonth,
  onChangeYear,
  onChangeAge,
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="bottom"
      data-testid="HS_FIRESIDE_COORDS_SHEET"
      className="rounded-t-3xl bg-stone-950 border-t border-amber-500/35 text-stone-100 p-5 space-y-4 z-[140]"
    >
      <div className="w-full flex justify-center">
        <div className="w-10 h-1.5 rounded-full bg-stone-700" />
      </div>
      <SheetHeader className="text-left">
        <SheetTitle className="text-base font-serif text-amber-200 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>Where &amp; When Did This Happen?</span>
        </SheetTitle>
        <SheetDescription className="text-xs text-stone-400">
          Set the place, date, and your age for this memory. Changes save automatically.
        </SheetDescription>
      </SheetHeader>

      <MemoryCoordinatesBar
        location={location}
        country={country}
        day={day}
        month={month}
        year={year}
        narratorAgeAtTime={narratorAgeAtTime}
        onChangeLocation={onChangeLocation}
        onChangeCountry={onChangeCountry}
        onChangeDay={onChangeDay}
        onChangeMonth={onChangeMonth}
        onChangeYear={onChangeYear}
        onChangeAge={onChangeAge}
        variant="fireside"
      />

      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="w-full min-h-[48px] rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
      >
        Done
      </button>
    </SheetContent>
  </Sheet>
);

export interface FiresideUpgradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partTitle?: string;
}

export const FiresideUpgradeSheet: React.FC<FiresideUpgradeSheetProps> = ({
  open,
  onOpenChange,
  partTitle,
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="bottom"
      data-testid="HS_FIRESIDE_UPGRADE_SHEET"
      className="rounded-t-3xl bg-stone-950 border-t border-amber-500/40 text-stone-100 p-6 space-y-4 z-[150]"
    >
      <div className="w-full flex justify-center">
        <div className="w-10 h-1.5 rounded-full bg-stone-700" />
      </div>
      <SheetHeader className="text-left space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider w-fit">
          <Lock className="w-3 h-3" />
          <span>Premium Life Journey Chapter</span>
        </div>
        <SheetTitle className="text-lg font-serif text-white">
          Unlock {partTitle || 'Parts II–VI & Family Anthology'}
        </SheetTitle>
        <SheetDescription className="text-xs sm:text-sm text-stone-300 leading-relaxed">
          Your Sandbox Free Forever plan includes all 4 foundational scenes in <strong>Part I: Roots and Foundations</strong>. Upgrade to a Director Pass or Generational Vault to record and weave all 30 chapters across Fireside and Desktop Studio.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-2.5 pt-1">
        <Link
          href="/pricing"
          data-testid="HS_FIRESIDE_UPGRADE_CTA_LINK"
          onClick={() => onOpenChange(false)}
          className="w-full min-h-[52px] px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-mono font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center shadow-lg"
        >
          View Director Pass &amp; Vault Plans →
        </Link>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full min-h-[44px] rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-mono cursor-pointer"
        >
          Continue in Part I (Free Forever)
        </button>
      </div>
    </SheetContent>
  </Sheet>
);

export interface FiresideWelcomeSheetProps {
  open: boolean;
  onDismiss: () => void;
  onStartSoundcheck: () => void;
}

export const FiresideWelcomeSheet: React.FC<FiresideWelcomeSheetProps> = ({
  open,
  onDismiss,
  onStartSoundcheck,
}) => (
  <Sheet
    open={open}
    onOpenChange={(next) => {
      if (!next) onDismiss();
    }}
  >
    <SheetContent
      side="bottom"
      data-testid="HS_FIRESIDE_WELCOME_SHEET"
      className="rounded-t-3xl bg-stone-950 border-t border-amber-500/40 text-stone-100 p-6 space-y-4 z-[145]"
    >
      <div className="w-full flex justify-center">
        <div className="w-10 h-1.5 rounded-full bg-stone-700" />
      </div>
      <SheetHeader className="text-left space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider w-fit">
          <Coffee className="w-3 h-3" />
          <span>Welcome to Fireside Studio</span>
        </div>
        <SheetTitle className="text-lg font-serif text-white">
          Speak Your Family Stories at Your Own Pace
        </SheetTitle>
        <SheetDescription className="text-xs sm:text-sm text-stone-300 leading-relaxed">
          Swipe left or right across the 5 Acts (<strong>Script → Weave → Record → Cut → Premiere</strong>), or warm up first with a zero-pressure 30-second microphone soundcheck.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-2.5 pt-1">
        <button
          type="button"
          data-testid="HS_FIRESIDE_WELCOME_START_BTN"
          onClick={onDismiss}
          className="w-full min-h-[52px] px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer shadow-lg"
        >
          Start Scene 1 →
        </button>
        <button
          type="button"
          data-testid="HS_FIRESIDE_WELCOME_SOUNDCHECK_BTN"
          onClick={() => {
            onDismiss();
            onStartSoundcheck();
          }}
          className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-emerald-950/50 hover:bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 font-mono font-semibold text-xs cursor-pointer"
        >
          Try 30-Second Chai Soundcheck First
        </button>
      </div>
    </SheetContent>
  </Sheet>
);
