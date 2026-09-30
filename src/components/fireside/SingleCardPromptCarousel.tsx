'use client';

/**
 * 🎙️ Fireside Voice Studio — Single-Card Prompt Carousel
 *
 * Armchair-first, mobile-optimised storytelling surface designed for elderly narrators.
 * Presents one memory spark at a time, supports instant bilingual switching (English,
 * Gujarati, Punjabi, Hindi), Framer Motion swipe gestures, high-contrast typography,
 * expandable follow-up inquiry drawer, and physical album photo digitisation cues.
 *
 * Milestone: MW-87 (Ticket #245 / MW-244)
 * Target Route: /studio/fireside
 * Constitutional Governance: C:\\Users\\home\\studio\\.agents\\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English, Rule 26 Elder Ergonomics, Rule 8 Mobile Viewport)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Camera,
  Shuffle,
  Mic,
  Video,
  BookOpen,
  Heart,
  Globe,
  Compass,
  Award,
  Calendar,
  Smile,
  Crown,
  Headphones,
  Eye,
  Coffee,
} from 'lucide-react';
import type {
  FiresidePromptSpark,
  FiresideLanguage,
  PromptCategory,
  FiresideMediaMode,
} from '@/types/fireside';
import { FIRESIDE_LANGUAGE_LABELS, FIRESIDE_TOUCH_TARGETS } from '@/types/fireside';
import { FIRESIDE_PROMPT_SPARKS, getRandomPrompt } from '@/lib/firesidePrompts';
import { getSceneById } from '@/lib/curriculum/masterStoryStructure';
import type { EditingAuthority, UnifiedCurriculumMemory } from '@/types/curriculum';
import { isSceneCompleted } from '@/types/curriculum';
import { detectSensoryAnchors, filterDominantSensoryAnchors } from '@/utils/sensoryAnchors';
import { FiresideWarmupModal } from '@/components/fireside/FiresideWarmupModal';
import { FiresideWalkthroughCard } from '@/components/fireside/FiresideWalkthroughCard';
import { ChapterSpineRail, type ChapterSpineScene } from '@/components/navigation/ChapterSpineRail';

export interface SingleCardPromptCarouselProps {
  prompts?: FiresidePromptSpark[];
  initialPromptId?: string;
  activeLanguage?: FiresideLanguage;
  isHybrid?: boolean;
  onToggleHybrid?: (nextHybrid: boolean) => void;
  mediaMode?: FiresideMediaMode;
  editingAuthority?: EditingAuthority;
  resolveSceneAuthority?: (sceneId?: string) => EditingAuthority;
  activeSceneMemory?: Partial<UnifiedCurriculumMemory> | null;
  getSceneMemory?: (sceneId?: string) => Partial<UnifiedCurriculumMemory> | undefined;
  onSaveProse?: (sceneId: string, updatedProseText: string) => void | Promise<void>;
  pinnedPrompterQuestion?: string | null;
  onPinQuestionToPrompter?: (question: string) => void;
  onAnswerFollowUpNote?: (question: string) => void;
  onSelectPrompt?: (spark: FiresidePromptSpark, language: FiresideLanguage) => void;
  onActivePromptChange?: (spark: FiresidePromptSpark) => void;
  onLanguageChange?: (language: FiresideLanguage) => void;
  onPhotoPromptClick?: (photoPrompt: string) => void;
  onWarmupComplete?: () => void;
  selectedActStage?: 1 | 2 | 3 | 4;
  onSelectActStage?: (stage: 1 | 2 | 3 | 4) => void;
  onOpenScreeningRoom?: () => void;
  className?: string;
}

const CATEGORY_META: Record<
  PromptCategory,
  { label: string; icon: React.ElementType; colour: string; tooltip: string }
> = {
  childhood: {
    label: 'Childhood & Home',
    icon: BookOpen,
    colour: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    tooltip: 'Story Theme: Childhood & Home — Early memories of household warmth, neighbours, and growing up.',
  },
  roots: {
    label: 'Origins & Roots',
    icon: Compass,
    colour: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    tooltip: 'Story Theme: Origins & Roots — Exploring ancestral homeland, family foundations, and heritage.',
  },
  love: {
    label: 'Courtship & Love',
    icon: Heart,
    colour: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    tooltip: 'Story Theme: Courtship & Love — Cherished moments of companionship, partnership, and devotion.',
  },
  wisdom: {
    label: 'Wisdom & Courage',
    icon: Award,
    colour: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    tooltip: 'Story Theme: Wisdom & Courage — Turning points, resilience, and life-shaping guidance.',
  },
  traditions: {
    label: 'Festive Traditions',
    icon: Calendar,
    colour: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    tooltip: 'Story Theme: Festive Traditions — Celebrations, recipes, songs, and seasonal family rituals.',
  },
  lessons: {
    label: 'Honest Labour',
    icon: Crown,
    colour: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    tooltip: 'Story Theme: Honest Labour — Work ethic, craft, perseverance, and building a livelihood.',
  },
  humour: {
    label: 'Family Humour',
    icon: Smile,
    colour: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
    tooltip: 'Story Theme: Family Humour — Light-hearted mischief, shared laughter, and unforgettable stories.',
  },
  legacy: {
    label: 'Blessing & Legacy',
    icon: Sparkles,
    colour: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    tooltip: 'Story Theme: Blessing & Legacy — Enduring messages, values, and blessings for future generations.',
  },
};

const LANGUAGES: FiresideLanguage[] = ['en', 'gu', 'pa', 'hi'];

export function SingleCardPromptCarousel({
  prompts = FIRESIDE_PROMPT_SPARKS,
  initialPromptId,
  activeLanguage: controlledLanguage,
  isHybrid: controlledHybrid,
  onToggleHybrid,
  mediaMode,
  editingAuthority,
  resolveSceneAuthority,
  activeSceneMemory,
  getSceneMemory,
  onSaveProse,
  pinnedPrompterQuestion,
  onPinQuestionToPrompter,
  onAnswerFollowUpNote,
  onSelectPrompt,
  onActivePromptChange,
  onLanguageChange,
  onPhotoPromptClick,
  onWarmupComplete,
  selectedActStage,
  onSelectActStage,
  onOpenScreeningRoom,
  className = '',
}: SingleCardPromptCarouselProps) {
  const sparkDeck = useMemo(() => {
    return prompts.length > 0 ? prompts : FIRESIDE_PROMPT_SPARKS;
  }, [prompts]);

  const initialIndex = useMemo(() => {
    if (!initialPromptId) return 0;
    const found = sparkDeck.findIndex((p) => p.id === initialPromptId);
    return found !== -1 ? found : 0;
  }, [initialPromptId, sparkDeck]);

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [internalLanguage, setInternalLanguage] = useState<FiresideLanguage>('en');
  const [internalHybrid, setInternalHybrid] = useState<boolean>(false);
  const [direction, setDirection] = useState<number>(0);
  const [showFollowUps, setShowFollowUps] = useState<boolean>(false);
  const [isWarmupOpen, setIsWarmupOpen] = useState<boolean>(false);
  const [warmupCompleted, setWarmupCompleted] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'script' | 'spark'>('script');
  const [isEditingScript, setIsEditingScript] = useState<boolean>(false);
  const [draftProse, setDraftProse] = useState<string>('');
  const [localProseOverride, setLocalProseOverride] = useState<string | null>(null);
  const [selectedActTab, setSelectedActTab] = useState<'act1' | 'act2' | 'act3' | 'act4'>('act1');
  const [highlightedSensoryType, setHighlightedSensoryType] = useState<
    'soundscape' | 'visual' | 'aroma' | null
  >(null);

  const currentLanguage = controlledLanguage || internalLanguage;
  const effectiveHybrid = typeof controlledHybrid === 'boolean' ? controlledHybrid : internalHybrid;
  const showSecondarySubtitle = effectiveHybrid || currentLanguage !== 'en';

  const currentSpark = sparkDeck[currentIndex] || sparkDeck[0];
  const onActivePromptChangeRef = React.useRef(onActivePromptChange);
  onActivePromptChangeRef.current = onActivePromptChange;

  useEffect(() => {
    onActivePromptChangeRef.current?.(currentSpark);
  }, [currentSpark]);
  const categoryMeta = CATEGORY_META[currentSpark.category] || CATEGORY_META.childhood;
  const CategoryIcon = categoryMeta.icon;

  const effectiveMediaMode: FiresideMediaMode = mediaMode || currentSpark.suggestedMediaMode || 'audio';
  const linkedScene = currentSpark.linkedSceneId ? getSceneById(currentSpark.linkedSceneId) : undefined;
  const cardEditingAuthority: EditingAuthority =
    editingAuthority ?? (resolveSceneAuthority ? resolveSceneAuthority(currentSpark.linkedSceneId) : 'fireside_flexible');

  // Resolve active scene memory and live Act I prose (Rule 14 Story Hook Fallback Hierarchy)
  const currentSceneMemory = useMemo(() => {
    if (getSceneMemory && currentSpark.linkedSceneId) {
      const mem = getSceneMemory(currentSpark.linkedSceneId);
      if (mem) return mem;
    }
    return activeSceneMemory;
  }, [getSceneMemory, currentSpark.linkedSceneId, activeSceneMemory]);

  useEffect(() => {
    setLocalProseOverride(null);
    setIsEditingScript(false);
    setHighlightedSensoryType(null);
  }, [currentSpark.id, currentSceneMemory?.prose]);

  const rawSceneProse = currentSceneMemory?.prose?.trim() || '';
  const activeProse =
    localProseOverride !== null ? localProseOverride.trim() : rawSceneProse;
  const hasSceneCompletedReel = isSceneCompleted(currentSceneMemory);
  const isMasteredScene =
    currentSceneMemory?.currentStatus === 'mastered' ||
    Boolean(currentSceneMemory?.directorialPolish?.masterReelUrl);

  const activeProductionStage = useMemo(() => {
    const stage = currentSceneMemory?.productionStage;
    if (stage === 4 || isMasteredScene) return 4;
    if (stage === 3 || hasSceneCompletedReel) return 3;
    if (stage === 2) return 2;
    return 1;
  }, [currentSceneMemory?.productionStage, isMasteredScene, hasSceneCompletedReel]);

  useEffect(() => {
    if (selectedActStage === 4) setSelectedActTab('act4');
    else if (selectedActStage === 3) setSelectedActTab('act3');
    else if (selectedActStage === 2) setSelectedActTab('act2');
    else if (selectedActStage === 1) setSelectedActTab('act1');
  }, [selectedActStage]);

  const handleSelectActTab = useCallback(
    (tab: 'act1' | 'act2' | 'act3' | 'act4') => {
      setSelectedActTab(tab);
      const stageMap: Record<'act1' | 'act2' | 'act3' | 'act4', 1 | 2 | 3 | 4> = {
        act1: 1,
        act2: 2,
        act3: 3,
        act4: 4,
      };
      onSelectActStage?.(stageMap[tab]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('mw:fireside-act-changed', {
            detail: { stage: stageMap[tab], tab },
          })
        );
      }
    },
    [onSelectActStage]
  );

  const scrollToActiveSoundstage = useCallback(() => {
    if (typeof document !== 'undefined') {
      const target =
        document.getElementById('fireside-active-studio') ||
        document.getElementById('fireside-completed-reel-section');
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  const stageProgression = useMemo(() => {
    const effectiveStage =
      selectedActTab === 'act4'
        ? 4
        : selectedActTab === 'act3'
        ? 3
        : selectedActTab === 'act2'
        ? 2
        : activeProductionStage;

    if (effectiveStage >= 3) {
      return {
        label: '[ 🎞️ Watch Master Reel in Screening Room ▶ ]',
        spineLabel: '[ 🎞️ Watch Master Reel in Screening Room ▶ ]',
        title: 'Open this memory directly in the in-place Fireside Screening Room.',
        nextTab: 'act4' as const,
      };
    }
    if (effectiveStage === 2) {
      return {
        label: '[ 🎬 Progress to Act III: Record Performance → ]',
        spineLabel: '[ 🎬 Progress to Act III: Record Performance → ]',
        title: 'Advance in-place to Act III (Record Performance) inside Fireside Studio.',
        nextTab: 'act3' as const,
      };
    }
    return {
      label: '[ ✨ Progress to Act II: Sensory Weave → ]',
      spineLabel: '[ ✨ Progress to Act II: Sensory Weave → ]',
      title: 'Advance in-place to Act II (Sensory Weave Inspector) inside Fireside Studio.',
      nextTab: 'act2' as const,
    };
  }, [activeProductionStage, selectedActTab]);

  const activeWeaveLabel = useMemo(() => {
    const rawVision =
      currentSceneMemory?.activeVisionLabel || currentSceneMemory?.activeVision || '';
    return rawVision ? rawVision.toUpperCase().replace(/-/g, ' ') : 'THE MEMORY WEAVE';
  }, [currentSceneMemory?.activeVisionLabel, currentSceneMemory?.activeVision]);

  const handleStartEditScript = () => {
    setDraftProse(activeProse);
    setIsEditingScript(true);
  };

  const handleSaveScript = () => {
    const trimmed = draftProse.trim();
    // Rule 12 Optimistic UI: 0ms synchronous local state update
    setLocalProseOverride(trimmed);
    setIsEditingScript(false);
    setViewMode('script');
    const targetSceneId =
      currentSpark.linkedSceneId || currentSceneMemory?.sceneId || 'part-1-scene-1';
    onSaveProse?.(targetSceneId, trimmed);
  };

  const handleCancelEditScript = () => {
    setIsEditingScript(false);
    setDraftProse(activeProse);
  };

  // UNIFIED SENSORY ANCHOR PIPELINE (Identical to MemoryForm.tsx — MW-88-T8 & MW-88-T9):
  const rawDetectedAnchors = useMemo(() => {
    if (!activeProse) return [];
    return detectSensoryAnchors(activeProse);
  }, [activeProse]);

  const sensoryCounts = useMemo(() => {
    if (!rawDetectedAnchors.length) return { soundscape: 0, visual: 0, aroma: 0 };
    const dominantAnchors = filterDominantSensoryAnchors(rawDetectedAnchors);

    const soundscapeCount = dominantAnchors.filter((a) => a.type === 'soundscape').length;
    const visualCount = dominantAnchors.filter((a) => a.type === 'visual').length;
    const aromaCount = dominantAnchors.filter((a) => a.type === 'aroma').length;

    return {
      soundscape: soundscapeCount,
      visual: visualCount,
      aroma: aromaCount,
    };
  }, [rawDetectedAnchors]);

  const handleToggleSensoryPulse = (type: 'soundscape' | 'visual' | 'aroma') => {
    setHighlightedSensoryType((prev) => (prev === type ? null : type));
    setViewMode('script');
  };

  const sensoryHighlightToastText = useMemo(() => {
    if (highlightedSensoryType === 'soundscape') {
      return 'Highlighting acoustic soundscape cues.';
    }
    if (highlightedSensoryType === 'visual') {
      return 'Highlighting visual atmosphere cues.';
    }
    if (highlightedSensoryType === 'aroma') {
      return 'Highlighting culinary and aroma cues.';
    }
    return null;
  }, [highlightedSensoryType]);

  const renderedScriptContent = useMemo(() => {
    if (!activeProse || !highlightedSensoryType) {
      return activeProse;
    }
    const targetWords = Array.from(
      new Set(
        rawDetectedAnchors
          .filter((a) => a.type === highlightedSensoryType)
          .map((a) => a.word.toLowerCase())
      )
    );
    if (targetWords.length === 0) {
      return activeProse;
    }
    const escaped = targetWords
      .sort((a, b) => b.length - a.length)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(\\b(?:${escaped.join('|')})\\b)`, 'gi');
    const parts = activeProse.split(regex);
    const wordSet = new Set(targetWords);

    return parts.map((part, idx) => {
      if (wordSet.has(part.toLowerCase())) {
        return (
          <span
            key={idx}
            data-testid="fireside-sensory-highlighted-word"
            className="bg-amber-400/30 text-amber-200 border-b border-amber-400 px-1 rounded animate-pulse"
          >
            {part}
          </span>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  }, [activeProse, highlightedSensoryType, rawDetectedAnchors]);

  // Resolve bilingual card titles (Golden Thread: dynamically prioritise mother tongue when selected)
  const englishTitle = currentSpark.localizedTitles?.en || currentSpark.title || linkedScene?.localizedTitles?.en || '';
  const motherTongueLang: FiresideLanguage = currentLanguage === 'en' ? 'gu' : currentLanguage;
  const motherTongueTitle =
    currentSpark.localizedTitles?.[motherTongueLang] ||
    currentSpark.localizedTitles?.gu ||
    linkedScene?.localizedTitles?.[motherTongueLang] ||
    linkedScene?.localizedTitles?.gu ||
    '';

  const primaryCardTitle =
    currentLanguage === 'en' ? englishTitle : motherTongueTitle || englishTitle;
  const secondaryCardTitle =
    currentLanguage === 'en' ? motherTongueTitle : englishTitle;

  const handleLanguageSelect = (lang: FiresideLanguage) => {
    setInternalLanguage(lang);
    onLanguageChange?.(lang);
  };

  const handleHybridToggle = () => {
    const next = !effectiveHybrid;
    setInternalHybrid(next);
    onToggleHybrid?.(next);
  };

  const handleNext = useCallback(() => {
    setDirection(1);
    setShowFollowUps(false);
    setCurrentIndex((prev) => {
      const nextIdx = (prev + 1) % sparkDeck.length;
      onActivePromptChange?.(sparkDeck[nextIdx]);
      return nextIdx;
    });
  }, [sparkDeck, onActivePromptChange]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setShowFollowUps(false);
    setCurrentIndex((prev) => {
      const prevIdx = (prev - 1 + sparkDeck.length) % sparkDeck.length;
      onActivePromptChange?.(sparkDeck[prevIdx]);
      return prevIdx;
    });
  }, [sparkDeck, onActivePromptChange]);

  const handleRandom = useCallback(() => {
    const randomSpark = getRandomPrompt(currentSpark.id);
    const newIdx = sparkDeck.findIndex((p) => p.id === randomSpark.id);
    if (newIdx !== -1) {
      setDirection(1);
      setShowFollowUps(false);
      setCurrentIndex(newIdx);
      onActivePromptChange?.(sparkDeck[newIdx]);
    }
  }, [currentSpark.id, sparkDeck, onActivePromptChange]);

  const handleSelectCurrent = () => {
    onSelectPrompt?.(currentSpark, currentLanguage);
  };

  // ── Chapter Spine Rail — Unified Responsive Scene Navigation (MW-100) ────
  const spineScenes: ChapterSpineScene[] = useMemo(() => {
    return sparkDeck.map((spark, idx) => {
      const sceneId = spark.linkedSceneId || spark.id;
      const linked = spark.linkedSceneId ? getSceneById(spark.linkedSceneId) : undefined;
      const mem =
        getSceneMemory && spark.linkedSceneId
          ? getSceneMemory(spark.linkedSceneId)
          : spark.linkedSceneId === activeSceneMemory?.sceneId
            ? activeSceneMemory
            : undefined;
      const takesCount = mem?.takes?.length ?? 0;
      return {
        id: sceneId,
        index: idx,
        title: spark.title,
        partNumber: linked?.partNumber ?? 1,
        partTitle: linked?.partTitle ?? 'Part I: Roots and Foundations',
        hasCompletedReel: Boolean(takesCount > 0 || (mem && isSceneCompleted(mem))),
        hasDraftProse: Boolean(mem?.prose || mem?.originalHook),
        takesCount,
      };
    });
  }, [sparkDeck, getSceneMemory, activeSceneMemory]);

  const handleSelectScene = useCallback(
    (sceneId: string) => {
      const targetIdx = sparkDeck.findIndex(
        (s) => (s.linkedSceneId || s.id) === sceneId
      );
      if (targetIdx !== -1 && targetIdx !== currentIndex) {
        setDirection(targetIdx > currentIndex ? 1 : -1);
        setShowFollowUps(false);
        setCurrentIndex(targetIdx);
        onActivePromptChange?.(sparkDeck[targetIdx]);
      }
    },
    [sparkDeck, currentIndex, onActivePromptChange]
  );

  const currentText = currentSpark.sparks[currentLanguage] || currentSpark.sparks.en;
  const followUps = currentSpark.followUpQuestions[currentLanguage] || currentSpark.followUpQuestions.en || [];
  const photoPrompt = currentSpark.recommendedPhotoPrompt[currentLanguage] || currentSpark.recommendedPhotoPrompt.en;

  return (
    <div
      className={`w-full max-w-xl mx-auto flex flex-col items-center select-none ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* 1. Language Toggle Pills + Synchronised HYBRID Bilingual Toggle (Rule 26: 56px touch targets) */}
      <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 mb-4 px-1 overflow-x-auto no-scrollbar flex-wrap">
        {LANGUAGES.map((lang) => {
          const isActive = currentLanguage === lang;
          return (
            <button
              key={lang}
              type="button"
              data-hotspot-id={`HS_FIRESIDE_LANG_${lang.toUpperCase()}`}
              onClick={() => handleLanguageSelect(lang)}
              style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
              className={`min-h-[56px] px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm shadow-amber-500/10 scale-102'
                  : 'bg-white/5 text-neutral-400 border-white/10 hover:border-white/20 hover:text-neutral-200'
              }`}
              aria-label={`Switch storytelling language to ${FIRESIDE_LANGUAGE_LABELS[lang]}`}
              aria-pressed={isActive}
            >
              <Globe className="w-3.5 h-3.5 opacity-70" />
              <span>{FIRESIDE_LANGUAGE_LABELS[lang].split(' ')[0]}</span>
            </button>
          );
        })}

        <button
          type="button"
          data-testid="HS_FIRESIDE_HYBRID_TOGGLE_BTN"
          data-hotspot-id="HS_FIRESIDE_HYBRID_TOGGLE_BTN"
          onClick={handleHybridToggle}
          title="Focus: Bilingual (Subtitled) — Show or hide mother-tongue subtitles alongside English."
          aria-label="Focus: Bilingual (Subtitled) — Show or hide mother-tongue subtitles alongside English."
          aria-pressed={effectiveHybrid}
          style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
          className={`min-h-[56px] px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
            effectiveHybrid
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
              : 'bg-white/5 text-neutral-300 border-white/15 hover:border-amber-500/40 hover:text-amber-200'
          }`}
        >
          <span>{effectiveHybrid ? '[ 🔤 HYBRID: ON ]' : '[ 🔤 HYBRID: OFF ]'}</span>
        </button>
      </div>

      {/* 1b. Fireside Free Walkthrough & 30-Second Soundcheck Card (Index 0 of Carousel — MW-88-T3 / MW-88-T5) */}
      {currentIndex === 0 && (
        <div className="w-full max-w-xl mx-auto mb-4 flex flex-col gap-2">
          {!isWarmupOpen && (
            <FiresideWalkthroughCard
              activeLanguage={currentLanguage}
              warmupCompleted={warmupCompleted}
              onLaunchWalkthrough={() => setIsWarmupOpen(true)}
            />
          )}

          {warmupCompleted && !isWarmupOpen && (
            <div
              data-testid="warmup-exit-banner"
              className="w-full px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-xs sm:text-sm font-medium text-center"
              role="status"
            >
              Soundcheck complete. Entering Part I: Roots and Foundations.
            </div>
          )}

          {isWarmupOpen && (
            <FiresideWarmupModal
              isOpen={isWarmupOpen}
              activeLanguage={currentLanguage}
              onClose={() => setIsWarmupOpen(false)}
              onComplete={() => {
                setWarmupCompleted(true);
                setIsWarmupOpen(false);
                onWarmupComplete?.();
              }}
            />
          )}
        </div>
      )}

      {/* 1c. Chapter Spine Rail — Unified Responsive Scene Navigation (MW-100) */}
      {spineScenes.length > 0 && (
        <div className="w-full max-w-xl mx-auto mb-3">
          <ChapterSpineRail
            scenes={spineScenes}
            activeSceneId={currentSpark.linkedSceneId || currentSpark.id}
            onSelectScene={handleSelectScene}
            orientation="horizontal"
            className="rounded-xl"
          />
        </div>
      )}

      {/* 2. The Single Interactive Story Spark Card */}
      <div className="w-full max-w-xl mx-auto relative min-h-[360px] sm:min-h-[400px]">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={`${currentSpark.id}-${currentIndex}`}
            data-testid="HS_FIRESIDE_PROMPT_CAROUSEL_CARD"
            custom={direction}
            drag="x"
            dragSnapToOrigin={true}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_e, { offset, velocity }) => {
              const swipeThreshold = 50;
              if (offset.x < -swipeThreshold || velocity.x < -300) {
                handleNext();
              } else if (offset.x > swipeThreshold || velocity.x > 300) {
                handlePrev();
              }
            }}
            initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="w-full max-w-xl mx-auto bg-[#171717]/95 border border-amber-500/25 hover:border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col justify-between transition-colors relative overflow-hidden shrink-0"
          >
            {/* Ambient Background Warmth */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Top Meta Bar: Category Pill + Curriculum Badge + Card Index Counter */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center flex-wrap gap-1.5">
                  <div
                    data-testid="carousel-category-badge"
                    title={categoryMeta.tooltip}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border cursor-help ${categoryMeta.colour}`}
                  >
                    <CategoryIcon className="w-3.5 h-3.5" />
                    <span className="uppercase tracking-wider text-[11px] font-semibold">
                      {categoryMeta.label}
                    </span>
                  </div>

                  {linkedScene && (
                    <span
                      data-testid="carousel-scene-number-badge"
                      title="Curriculum Position: Part I (Roots and Foundations), Scene 1 of 11 in your Generational Vault."
                      className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold cursor-help"
                    >
                      {linkedScene.partTitle.split(':')[0]} • Scene {linkedScene.sceneNumber}
                    </span>
                  )}

                  {cardEditingAuthority === 'desktop_locked' ? (
                    <span
                      data-testid="carousel-studio-master-badge"
                      title="Authored in Desktop Studio • Full cross-device editing enabled"
                      className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold shadow-sm cursor-help"
                    >
                      ✨ Studio Master
                    </span>
                  ) : (
                    <span
                      data-testid="carousel-mobile-recording-badge"
                      title="Captured on Fireside Mobile • Full cross-device editing enabled"
                      className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 font-semibold shadow-sm cursor-help"
                    >
                      📱 Fireside Mobile
                    </span>
                  )}

                  {currentSpark.suggestedMediaMode && (
                    <span
                      data-testid="carousel-media-badge"
                      title="Recommended Capture Mode: Intimate selfie video with live teleprompter."
                      className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1 font-semibold cursor-help"
                    >
                      {currentSpark.suggestedMediaMode === 'video' ? (
                        <>
                          <Video className="w-3 h-3 text-amber-400" />
                          <span>Video Memo • Recommended</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 text-amber-400" />
                          <span>Voice &amp; Photos • Curriculum</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                    {currentIndex + 1} of {sparkDeck.length}
                  </span>
                  <button
                    type="button"
                    data-hotspot-id="HS_FIRESIDE_RANDOM_SPARK_BTN"
                    onClick={handleRandom}
                    title="Surprise me with a random memory prompt"
                    className="p-1.5 text-neutral-400 hover:text-amber-300 transition-colors bg-white/5 hover:bg-white/10 rounded-full border border-white/10 cursor-pointer"
                    aria-label="Pick random prompt"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4-Act Production Status Spine & In-Place Progression (MW-88-T9 Surface Containment) */}
              <div
                data-testid="HS_FIRESIDE_ACT_SPINE"
                className="mb-4 p-2 rounded-2xl bg-black/40 border border-white/10 space-y-2"
              >
                {/* MW-88-T10: grid-cols-4 (all viewports) + overflow-hidden — no more whitespace-nowrap bleed */}
                <div className="w-full grid grid-cols-4 gap-1 p-0.5 font-mono">
                  <button
                    type="button"
                    data-testid="HS_FIRESIDE_ACT_TAB_1"
                    onClick={() => handleSelectActTab('act1')}
                    aria-pressed={selectedActTab === 'act1'}
                    aria-label="Act I: Script — Review or edit your story hook and narrative prose in-place."
                    title="Act I: Script — Review or edit your story hook and narrative prose in-place."
                    className={`min-h-[44px] px-1 py-1.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center overflow-hidden text-xs font-mono ${
                      selectedActTab === 'act1'
                        ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 font-bold ring-1 ring-emerald-400/40'
                        : activeProse
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-500/20'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-semibold hover:bg-amber-500/20'
                    }`}
                  >
                    <span className="sm:hidden truncate">{activeProse ? '✓ ' : '● '}I: Script</span>
                    <span className="hidden sm:inline truncate">{activeProse ? '✓ ' : '● '}Act I: Script</span>
                  </button>
                  <button
                    type="button"
                    data-testid="HS_FIRESIDE_ACT_TAB_2"
                    onClick={() => handleSelectActTab('act2')}
                    aria-pressed={selectedActTab === 'act2'}
                    aria-label="Act II: Weave — Inspect and pulse-highlight sensory anchor cues in-place."
                    title="Act II: Weave — Inspect and pulse-highlight sensory anchor cues in-place."
                    className={`min-h-[44px] px-1 py-1.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center overflow-hidden text-xs font-mono ${
                      selectedActTab === 'act2'
                        ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 font-bold ring-1 ring-emerald-400/40'
                        : hasSceneCompletedReel || activeProductionStage >= 2
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-500/20'
                        : activeProse
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 font-bold hover:bg-amber-500/25'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="sm:hidden truncate">
                      {hasSceneCompletedReel || activeProductionStage >= 2 ? '✓ ' : activeProse ? '● ' : '○ '}II: Weave
                    </span>
                    <span className="hidden sm:inline truncate">
                      {hasSceneCompletedReel || activeProductionStage >= 2 ? '✓ ' : activeProse ? '● ' : '○ '}Act II: Weave
                    </span>
                  </button>
                  <button
                    type="button"
                    data-testid="HS_FIRESIDE_ACT_TAB_3"
                    onClick={() => handleSelectActTab('act3')}
                    aria-pressed={selectedActTab === 'act3'}
                    aria-label="Act III: Record — Capture your spoken voice or selfie video performance in-place."
                    title="Act III: Record — Capture your spoken voice or selfie video performance in-place."
                    className={`min-h-[44px] px-1 py-1.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center overflow-hidden text-xs font-mono ${
                      selectedActTab === 'act3'
                        ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 font-bold ring-1 ring-emerald-400/40'
                        : hasSceneCompletedReel || activeProductionStage >= 3
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-500/20'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="sm:hidden truncate">
                      {hasSceneCompletedReel || activeProductionStage >= 3 ? '✓ ' : '○ '}III: Record
                    </span>
                    <span className="hidden sm:inline truncate">
                      {hasSceneCompletedReel || activeProductionStage >= 3 ? '✓ ' : '○ '}Act III: Record
                    </span>
                  </button>
                  <button
                    type="button"
                    data-testid="HS_FIRESIDE_ACT_TAB_4"
                    onClick={() => handleSelectActTab('act4')}
                    aria-pressed={selectedActTab === 'act4'}
                    aria-label="Act IV: Screening — Watch your completed Master Reel in the in-place Fireside Screening Room."
                    title="Act IV: Screening — Watch your completed Master Reel in the in-place Fireside Screening Room."
                    className={`min-h-[44px] px-1 py-1.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center overflow-hidden text-xs font-mono ${
                      selectedActTab === 'act4'
                        ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 font-bold ring-1 ring-emerald-400/40'
                        : isMasteredScene || activeProductionStage === 4
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-500/20'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="sm:hidden truncate">
                      {isMasteredScene || activeProductionStage === 4 ? '✓ ' : '○ '}IV: Reel
                    </span>
                    <span className="hidden sm:inline truncate">
                      {isMasteredScene || activeProductionStage === 4 ? '✓ ' : '○ '}Act IV: Screening
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    data-testid="HS_FIRESIDE_INPLACE_PROGRESS_BTN"
                    data-hotspot-id="HS_FIRESIDE_INPLACE_PROGRESS_BTN"
                    onClick={() => {
                      if (stageProgression.nextTab === 'act4') {
                        handleSelectActTab('act4');
                        onOpenScreeningRoom?.();
                      } else if (stageProgression.nextTab === 'act3') {
                        handleSelectActTab('act3');
                        handleSelectCurrent();
                        scrollToActiveSoundstage();
                      } else {
                        handleSelectActTab('act2');
                      }
                    }}
                    title={stageProgression.title}
                    className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 text-[11px] font-mono font-semibold text-center transition-colors cursor-pointer"
                  >
                    {stageProgression.spineLabel}
                  </button>
                </div>
              </div>

              {/* Memory Prompt Heading (Bilingual Hierarchy — MW-88-T3 & MW-88-T6 HYBRID Gate) & Spark Prose */}
              <div className="mb-3">
                <h3
                  data-testid="carousel-card-primary-title"
                  className="text-base sm:text-lg font-semibold text-amber-400/95 tracking-wide flex items-center gap-2 leading-snug"
                >
                  <span>{primaryCardTitle}</span>
                </h3>
                {showSecondarySubtitle && secondaryCardTitle && secondaryCardTitle !== primaryCardTitle && (
                  <p
                    data-testid="carousel-card-secondary-title"
                    className="text-xs sm:text-sm font-medium text-amber-200/75 tracking-wide mt-0.5 leading-snug"
                  >
                    {secondaryCardTitle}
                  </p>
                )}
              </div>

              {/* Mobile-Lite In-Place Stage Contextual Banner (Act II Weave / Act III Record / Act IV Screening — MW-88-T9) */}
              {selectedActTab === 'act2' && (
                <div
                  data-testid="fireside-weave-helper-cue"
                  className="mb-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 font-sans flex items-center justify-between gap-2"
                >
                  <span>Tap a sensory pill to highlight anchor cues in your script.</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 shrink-0">
                    Act II: Weave
                  </span>
                </div>
              )}


              {selectedActTab === 'act3' && (() => {
                // MW-88-T10: Branch Act III on vault take availability (Rule 14 safe — prose untouched)
                const hasRecordedTake = Boolean(
                  activeSceneMemory?.takes && activeSceneMemory.takes.length > 0
                );

                if (hasRecordedTake) {
                  return (
                    <div
                      data-testid="HS_FIRESIDE_ACT3_RECORDED_VIEW"
                      className="mb-3 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2"
                    >
                      <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                        TAKE RECORDED • READY FOR SCREENING
                      </p>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        A master performance take is recorded and saved safely in your vault.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          data-testid="HS_FIRESIDE_AUDITION_TAKE_BTN"
                          onClick={() => onOpenScreeningRoom?.()}
                          className="min-h-[48px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs font-mono flex items-center gap-2 cursor-pointer transition-all shadow-md"
                        >
                          ▶ Audition Master Take
                        </button>
                        <button
                          type="button"
                          data-testid="HS_FIRESIDE_RETAKE_SCROLL_BTN"
                          onClick={() => {
                            handleSelectCurrent();
                            scrollToActiveSoundstage();
                          }}
                          className="min-h-[48px] px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono flex items-center gap-2 cursor-pointer transition-all"
                        >
                          🔄 Record Additional Take ↓
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    data-testid="HS_FIRESIDE_ACT3_CAPTURE_SLATE"
                    className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                  >
                    <p className="text-xs text-amber-200 leading-relaxed">
                      Ready to capture your voice or selfie video performance with the teleprompter below.
                    </p>
                    <button
                      type="button"
                      data-testid="HS_FIRESIDE_OPEN_VIEWFINDER_BTN"
                      onClick={() => {
                        handleSelectCurrent();
                        scrollToActiveSoundstage();
                      }}
                      className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold shrink-0 cursor-pointer transition-all"
                    >
                      [ 📹 Open Live Camera Viewfinder ↓ ]
                    </button>
                  </div>
                );
              })()}



              {selectedActTab === 'act4' && (
                <div
                  data-testid="fireside-act4-screening-panel"
                  className="mb-3 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                >
                  <p className="text-xs text-emerald-200 leading-relaxed">
                    Screen your woven story and recorded performance in the 2.39:1 Fireside Screening Room.
                  </p>
                  <button
                    type="button"
                    data-testid="HS_FIRESIDE_INPLACE_SCREENING_BTN"
                    onClick={() => onOpenScreeningRoom?.()}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-mono font-bold shrink-0 cursor-pointer transition-all shadow-md"
                  >
                    [ 🎞️ Watch Master Reel in Screening Room ▶ ]
                  </button>
                </div>
              )}

              {/* Live Act I Prose Rendering, Armchair Script Editor & Sensory Modality Counters (MW-88-T4 / MW-88-T7 / MW-88-T9 / Rule 14) */}
              {isEditingScript ? (
                <div
                  data-testid="fireside-armchair-script-editor"
                  className="space-y-3 p-4 rounded-2xl bg-black/55 border border-amber-500/40"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="space-y-1">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      ARMCHAIR SCRIPT EDITOR
                    </p>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Changes made here sync automatically to your Desktop Studio.
                    </p>
                  </div>
                  <textarea
                    data-testid="HS_FIRESIDE_SCRIPT_TEXTAREA"
                    value={draftProse}
                    onChange={(e) => setDraftProse(e.target.value)}
                    rows={5}
                    placeholder={currentText}
                    className="w-full rounded-xl bg-[#111111] border border-amber-500/35 focus:border-amber-400 text-base sm:text-lg font-serif text-white p-3.5 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    aria-label="Edit story script"
                  />
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      data-testid="HS_FIRESIDE_SAVE_SCRIPT_BTN"
                      data-hotspot-id="HS_FIRESIDE_SAVE_SCRIPT_BTN"
                      onClick={handleSaveScript}
                      className="min-h-[48px] px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      [ ✓ Save Script ]
                    </button>
                    <button
                      type="button"
                      data-testid="HS_FIRESIDE_CANCEL_SCRIPT_BTN"
                      data-hotspot-id="HS_FIRESIDE_CANCEL_SCRIPT_BTN"
                      onClick={handleCancelEditScript}
                      className="min-h-[48px] px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-semibold bg-white/5 hover:bg-white/10 border border-white/20 text-stone-200 transition-all cursor-pointer"
                    >
                      [ Cancel ]
                    </button>
                  </div>
                </div>
              ) : activeProse ? (
                <div className="space-y-3">
                  {/* Dominant Sensory Counters (Interactive Word-Pulse Pills — MW-88-T9), Weave Provenance Pill, Original Spark Pill & Edit Script Pill */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-white/10">
                    <div
                      className="flex items-center gap-1.5 flex-wrap"
                      data-testid="HS_FIRESIDE_DOMINANT_SENSORY_COUNTERS"
                      title="Sensory Anchors Detected — Acoustic, visual, and aroma cues woven into your Act I script."
                    >
                      <span
                        data-testid="fireside-sensory-counters"
                        title="Sensory Anchors Detected — Acoustic, visual, and aroma cues woven into your Act I script."
                        className="inline-flex items-center gap-1.5 flex-wrap"
                      >
                        <button
                          type="button"
                          data-testid="HS_FIRESIDE_PULSE_PILL_SOUNDSCAPE"
                          onClick={() => handleToggleSensoryPulse('soundscape')}
                          aria-pressed={highlightedSensoryType === 'soundscape'}
                          title="Tap to highlight acoustic soundscape cues in your script."
                          className={`min-h-[44px] inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium border transition-all cursor-pointer ${
                            highlightedSensoryType === 'soundscape'
                              ? 'bg-sky-500/25 text-sky-100 border-sky-400 ring-1 ring-sky-400/50'
                              : 'bg-sky-500/10 text-sky-300 border-sky-500/25 hover:bg-sky-500/20'
                          }`}
                        >
                          <Headphones className="w-3 h-3 text-sky-400" />
                          <span>Soundscape ({sensoryCounts.soundscape})</span>
                        </button>
                        <button
                          type="button"
                          data-testid="HS_FIRESIDE_PULSE_PILL_VISUAL"
                          onClick={() => handleToggleSensoryPulse('visual')}
                          aria-pressed={highlightedSensoryType === 'visual'}
                          title="Tap to highlight visual atmosphere cues in your script."
                          className={`min-h-[44px] inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium border transition-all cursor-pointer ${
                            highlightedSensoryType === 'visual'
                              ? 'bg-emerald-500/25 text-emerald-100 border-emerald-400 ring-1 ring-emerald-400/50'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20'
                          }`}
                        >
                          <Eye className="w-3 h-3 text-emerald-400" />
                          <span>Visual ({sensoryCounts.visual})</span>
                        </button>
                        <button
                          type="button"
                          data-testid="HS_FIRESIDE_PULSE_PILL_AROMA"
                          onClick={() => handleToggleSensoryPulse('aroma')}
                          aria-pressed={highlightedSensoryType === 'aroma'}
                          title="Tap to highlight culinary and aroma cues in your script."
                          className={`min-h-[44px] inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium border transition-all cursor-pointer ${
                            highlightedSensoryType === 'aroma'
                              ? 'bg-amber-500/25 text-amber-100 border-amber-400 ring-1 ring-amber-400/50'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/25 hover:bg-amber-500/20'
                          }`}
                        >
                          <Coffee className="w-3 h-3 text-amber-400" />
                          <span>Aroma ({sensoryCounts.aroma})</span>
                        </button>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        data-testid="HS_FIRESIDE_WEAVE_PROVENANCE_PILL"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 shrink-0"
                        title="Active AI Cinematic Weave Vision"
                      >
                        🎬 CINEMATIC WEAVE: {activeWeaveLabel}
                      </span>

                      <button
                        type="button"
                        data-testid="HS_FIRESIDE_VIEW_SPARK_PILL"
                        data-hotspot-id="fireside-script-toggle-btn"
                        onClick={() => setViewMode((prev) => (prev === 'script' ? 'spark' : 'script'))}
                        className="min-h-[48px] sm:min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-sky-950/60 hover:bg-sky-900/70 active:scale-98 text-sky-400 border border-sky-500/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                        aria-label="Toggle between active script and original prompt spark"
                      >
                        <span data-testid="fireside-script-toggle-btn">
                          {viewMode === 'script' ? '👁️ VIEW ORIGINAL SPARK' : '✨ VIEW WOVEN SCRIPT'}
                        </span>
                      </button>

                      <button
                        type="button"
                        data-testid="HS_FIRESIDE_EDIT_SCRIPT_PILL"
                        data-hotspot-id="HS_FIRESIDE_EDIT_SCRIPT_BTN"
                        onClick={handleStartEditScript}
                        className="min-h-[48px] sm:min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-950/60 hover:bg-amber-900/70 active:scale-98 text-amber-400 border border-amber-500/30 transition-all cursor-pointer shrink-0"
                      >
                        <span data-testid="HS_FIRESIDE_EDIT_SCRIPT_BTN">✏️ EDIT SCRIPT</span>
                      </button>
                    </div>
                  </div>

                  {sensoryHighlightToastText && (
                    <div
                      data-testid="fireside-sensory-highlight-toast"
                      role="status"
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-mono"
                    >
                      {sensoryHighlightToastText}
                    </div>
                  )}

                  {viewMode === 'script' ? (
                    <div
                      data-testid="fireside-active-script-body"
                      className="text-base sm:text-lg font-serif text-white/95 leading-relaxed tracking-wide selection:bg-amber-500/30 selection:text-amber-200 max-h-56 overflow-y-auto pr-1"
                    >
                      &ldquo;{renderedScriptContent}&rdquo;
                    </div>
                  ) : (
                    <p
                      data-testid="fireside-prompt-spark-body"
                      className="text-lg sm:text-xl font-serif text-stone-200 leading-relaxed tracking-wide selection:bg-amber-500/30 selection:text-amber-200"
                    >
                      &ldquo;{currentText}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p
                    data-testid="fireside-prompt-spark-body"
                    className="text-xl sm:text-2xl font-serif text-white/95 leading-relaxed tracking-wide selection:bg-amber-500/30 selection:text-amber-200"
                  >
                    &ldquo;{currentText}&rdquo;
                  </p>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      data-testid="HS_FIRESIDE_EDIT_SCRIPT_BTN"
                      data-hotspot-id="HS_FIRESIDE_EDIT_SCRIPT_BTN"
                      onClick={handleStartEditScript}
                      className="min-h-[48px] sm:min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-amber-500/15 hover:bg-amber-500/25 active:scale-98 text-amber-200 border border-amber-500/40 transition-all cursor-pointer"
                    >
                      [ ✏️ Edit Script ]
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Expandable Follow-Up Inquiries Drawer (MW-88-T6 Two-Action Model) */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                data-hotspot-id="HS_FIRESIDE_FOLLOWUPS_DRAWER_BTN"
                onClick={() => setShowFollowUps((prev) => !prev)}
                style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
                className="w-full min-h-[56px] flex items-center justify-between text-xs sm:text-sm font-semibold text-amber-300 hover:text-amber-200 transition-colors py-2 px-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 cursor-pointer"
                aria-expanded={showFollowUps}
                aria-label="Deepen this memory (Follow-up questions)"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Follow-Up Questions (Deepen This Memory)</span>
                </span>
                {showFollowUps ? (
                  <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {showFollowUps && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p
                      data-testid="fireside-followup-instruction"
                      className="mt-3 px-2 text-xs text-amber-200/90 font-sans leading-relaxed"
                    >
                      Choose a prompt below to jot down a quick memory note, or pin it to your teleprompter to answer aloud during your recording.
                    </p>
                    <ul className="mt-2.5 space-y-3 pl-1 text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans">
                      {followUps.map((question, qIdx) => {
                        const isPinned = pinnedPrompterQuestion === question;
                        return (
                          <li
                            key={qIdx}
                            className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{question}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                data-testid="HS_FIRESIDE_PIN_PROMPTER_BTN"
                                data-hotspot-id="HS_FIRESIDE_PIN_PROMPTER_BTN"
                                onClick={() => onPinQuestionToPrompter?.(question)}
                                className={`min-h-[48px] px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                                  isPinned
                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                                    : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-200'
                                }`}
                              >
                                {isPinned ? '✓ [ 📌 Pinned to Prompter ]' : '[ 📌 Pin to Prompter ]'}
                              </button>
                              <button
                                type="button"
                                data-testid="HS_FIRESIDE_ANSWER_NOTE_BTN"
                                data-hotspot-id="HS_FIRESIDE_ANSWER_NOTE_BTN"
                                onClick={() => onAnswerFollowUpNote?.(question)}
                                className="min-h-[48px] px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-white/5 hover:bg-white/10 border border-white/15 text-stone-200 transition-all cursor-pointer"
                              >
                                [ ✍️ Answer / Add Note ]
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 4. Recommended Physical Album Photo Digitisation Cue */}
              {photoPrompt && (
                <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/15 rounded-xl text-amber-400 shrink-0 mt-0.5">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                      <span className="font-semibold text-amber-300 block mb-0.5">
                        Archival Photo Idea:
                      </span>
                      <span className="text-neutral-300/90">{photoPrompt}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-hotspot-id="HS_FIRESIDE_PHOTO_DIGITISE_BTN"
                    onClick={() => {
                      if (onPhotoPromptClick) {
                        onPhotoPromptClick(photoPrompt);
                      } else {
                        alert(`Archival photo digitisation selected: "${photoPrompt}"`);
                      }
                    }}
                    style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
                    className="self-start sm:self-center shrink-0 min-h-[56px] px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-98 text-amber-200 text-xs font-semibold border border-amber-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    aria-label="Digitise physical album photo"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-300" />
                    <span>Digitise Photo</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 5. Elder-Ergonomic Primary Action Dock (Rule 26: min-h-[56px])
          Navigation between scenes is handled by ChapterSpineRail (MW-100) above. */}
      <div className="w-full mt-5 flex flex-col gap-3">
        {/* Dual-Action Synchronised In-Place Footer Dock (MW-88-T8 & MW-88-T9: 100% Surface Containment) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            data-testid="HS_FIRESIDE_STAGE_PROGRESSION_BTN"
            data-hotspot-id="HS_FIRESIDE_STAGE_PROGRESSION_BTN"
            onClick={() => {
              if (stageProgression.nextTab === 'act4') {
                handleSelectActTab('act4');
                onOpenScreeningRoom?.();
              } else if (stageProgression.nextTab === 'act3') {
                handleSelectActTab('act3');
                handleSelectCurrent();
                scrollToActiveSoundstage();
              } else {
                handleSelectActTab('act2');
              }
            }}
            title={stageProgression.title}
            style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
            className="w-full min-h-[56px] px-4 py-3 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900/90 border-2 border-emerald-500/50 text-emerald-300 font-mono font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/30 active:scale-98 transition-all flex items-center justify-center text-center cursor-pointer"
          >
            {stageProgression.label}
          </button>

          <button
            type="button"
            data-testid="HS_FIRESIDE_DIRECT_RECORD_BTN"
            data-hotspot-id="HS_FIRESIDE_CONFIRM_STORY_BTN"
            onClick={() => {
              handleSelectActTab('act3');
              handleSelectCurrent();
              scrollToActiveSoundstage();
            }}
            style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
            className="w-full min-h-[56px] px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center text-center cursor-pointer"
            aria-label={
              effectiveMediaMode === 'video'
                ? `Record performance: ${currentSpark.title}`
                : `Speak this memory: ${currentSpark.title}`
            }
          >
            [ 🎙️ RECORD PERFORMANCE (ACT III) → ]
          </button>
        </div>
      </div>
    </div>
  );
}

export default SingleCardPromptCarousel;
