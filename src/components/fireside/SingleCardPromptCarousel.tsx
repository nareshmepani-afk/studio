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

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  Loader2,
  RotateCcw,
} from 'lucide-react';
import type {
  FiresidePromptSpark,
  FiresideLanguage,
  PromptCategory,
  FiresideMediaMode,
} from '@/types/fireside';
import { FIRESIDE_LANGUAGE_LABELS, FIRESIDE_TOUCH_TARGETS } from '@/types/fireside';
import {
  FIRESIDE_PROMPT_SPARKS,
  getRandomPrompt,
  getSensorySeedsForSpark,
  type FiresideSensorySeed,
} from '@/lib/firesidePrompts';
import { getSceneById, getPartForScene } from '@/lib/curriculum/masterStoryStructure';
import type { EditingAuthority, UnifiedCurriculumMemory } from '@/types/curriculum';
import { isSceneCompleted } from '@/types/curriculum';
import { detectSensoryAnchors, filterDominantSensoryAnchors } from '@/utils/sensoryAnchors';
import { FiresideWarmupModal } from '@/components/fireside/FiresideWarmupModal';
import { FiresideWalkthroughCard } from '@/components/fireside/FiresideWalkthroughCard';
import { OrientationSoundcheckDock } from '@/components/fireside/OrientationSoundcheckDock';
import { ChapterSpineRail, type ChapterSpineScene } from '@/components/navigation/ChapterSpineRail';
import { checkAndPolishGrammar } from '@/actions/aiWeaver';
import { FiresideModeSwitch } from '@/components/fireside/FiresideModeSwitch';
import {
  SensoryScriptEditor,
  type SensoryScriptEditorRef,
} from '@/components/studio/shared/SensoryScriptEditor';
import { SensoryModalityKey } from '@/components/studio/shared/SensoryModalityKey';
import { toast } from 'sonner';

export interface SingleCardPromptCarouselProps {
  prompts?: FiresidePromptSpark[];
  initialPromptId?: string;
  activePromptId?: string;
  hideInlineOrientationDock?: boolean;
  hideInlineHeaderStepper?: boolean;
  activeLanguage?: FiresideLanguage;
  isHybrid?: boolean;
  onToggleHybrid?: (nextHybrid: boolean) => void;
  mediaMode?: FiresideMediaMode;
  onMediaModeChange?: (mode: FiresideMediaMode) => void;
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
  activePromptId,
  hideInlineOrientationDock = false,
  hideInlineHeaderStepper = false,
  activeLanguage: controlledLanguage,
  isHybrid: controlledHybrid,
  onToggleHybrid,
  mediaMode,
  onMediaModeChange,
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
    const targetId = activePromptId || initialPromptId;
    if (!targetId) return 0;
    const found = sparkDeck.findIndex((p) => p.id === targetId || p.linkedSceneId === targetId);
    return found !== -1 ? found : 0;
  }, [activePromptId, initialPromptId, sparkDeck]);

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [internalLanguage, setInternalLanguage] = useState<FiresideLanguage>('en');
  const [internalHybrid, setInternalHybrid] = useState<boolean>(false);
  const [direction, setDirection] = useState<number>(0);
  const [showFollowUps, setShowFollowUps] = useState<boolean>(false);
  const [isWarmupOpen, setIsWarmupOpen] = useState<boolean>(false);
  const [warmupCompleted, setWarmupCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (!activePromptId) return;
    const found = sparkDeck.findIndex((p) => p.id === activePromptId || p.linkedSceneId === activePromptId);
    if (found !== -1) {
      setCurrentIndex(found);
    }
  }, [activePromptId, sparkDeck]);
  const [viewMode, setViewMode] = useState<'script' | 'spark'>('script');
  const [isEditingScript, setIsEditingScript] = useState<boolean>(false);
  const [draftProse, setDraftProse] = useState<string>('');
  const [isPolishingScript, setIsPolishingScript] = useState<boolean>(false);
  const [originalScriptDraft, setOriginalScriptDraft] = useState<string | null>(null);
  const [isScriptPolished, setIsScriptPolished] = useState<boolean>(false);
  const [localProseOverride, setLocalProseOverride] = useState<string | null>(null);
  const [selectedActTab, setSelectedActTab] = useState<'act1' | 'act2' | 'act3' | 'act4'>('act1');
  const [highlightedSensoryType, setHighlightedSensoryType] = useState<
    'soundscape' | 'visual' | 'aroma' | null
  >(null);
  const sensoryEditorRef = useRef<SensoryScriptEditorRef | null>(null);

  const currentLanguage = controlledLanguage || internalLanguage;
  const effectiveHybrid = typeof controlledHybrid === 'boolean' ? controlledHybrid : internalHybrid;
  const showSecondarySubtitle = effectiveHybrid || currentLanguage !== 'en';
  const effectiveIndex = useMemo(() => {
    if (activePromptId) {
      const found = sparkDeck.findIndex((p) => p.id === activePromptId || p.linkedSceneId === activePromptId);
      if (found !== -1) return found;
    }
    return currentIndex;
  }, [activePromptId, sparkDeck, currentIndex]);

  const currentSpark = sparkDeck[effectiveIndex] || sparkDeck[0];
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
    // Only fall back to activeSceneMemory if its sceneId or promptId actually matches this spark!
    if (
      activeSceneMemory &&
      (activeSceneMemory.sceneId === currentSpark.linkedSceneId ||
        (activeSceneMemory as any).promptId === currentSpark.id)
    ) {
      return activeSceneMemory;
    }
    return undefined;
  }, [getSceneMemory, currentSpark.linkedSceneId, currentSpark.id, activeSceneMemory]);

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

  // Synchronise selectedActTab when selectedActStage prop changes or when active spark/scene changes
  useEffect(() => {
    if (selectedActStage === 4) {
      setSelectedActTab('act4');
    } else if (selectedActStage === 3) {
      setSelectedActTab('act3');
    } else if (selectedActStage === 2) {
      setSelectedActTab('act2');
    } else if (selectedActStage === 1) {
      setSelectedActTab('act1');
    } else {
      // When selectedActStage is undefined (e.g. on spark/scene switch),
      // default selectedActTab to the current scene's actual production stage
      if (activeProductionStage === 4) setSelectedActTab('act4');
      else if (activeProductionStage === 3) setSelectedActTab('act3');
      else if (activeProductionStage === 2) setSelectedActTab('act2');
      else setSelectedActTab('act1');
    }
  }, [selectedActStage, activeProductionStage, currentSpark.id]);

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
    setOriginalScriptDraft(null);
    setIsScriptPolished(false);
    setIsPolishingScript(false);
    setIsEditingScript(true);
  };

  const handleSaveScript = () => {
    const trimmed = draftProse.trim();
    // Rule 12 Optimistic UI: 0ms synchronous local state update
    setLocalProseOverride(trimmed);
    setIsEditingScript(false);
    setViewMode('script');
    setOriginalScriptDraft(null);
    setIsScriptPolished(false);
    const targetSceneId =
      currentSpark.linkedSceneId || currentSceneMemory?.sceneId || 'part-1-scene-1';
    onSaveProse?.(targetSceneId, trimmed);
  };

  const handleCancelEditScript = () => {
    setIsEditingScript(false);
    setDraftProse(activeProse);
    setOriginalScriptDraft(null);
    setIsScriptPolished(false);
  };

  // Non-destructive AI script proofreader & polish (Guardrails 2 & 3)
  const handlePolishScript = async () => {
    const trimmed = draftProse.trim();
    if (!trimmed || trimmed.length < 5 || isPolishingScript) return;

    setIsPolishingScript(true);
    const draftSnapshot = draftProse;

    try {
      const polished = await checkAndPolishGrammar(trimmed);
      if (polished && polished !== trimmed) {
        setOriginalScriptDraft(draftSnapshot);
        setDraftProse(polished);
        setIsScriptPolished(true);
        toast.success('Script Polished!', {
          description: 'Corrected typos and grammatical agreement while preserving voice.',
        });
      } else {
        toast.success('Script Clean & Ready', {
          description: 'No spelling or grammar errors detected.',
        });
      }
    } catch (err: any) {
      console.error('[SingleCardPromptCarousel] checkAndPolishGrammar error:', err);
      // Zero-Data-Loss Network Exception Shield (Guardrail 3)
      toast.error('AI grammar service temporarily unavailable. Your draft was kept safely.');
    } finally {
      setIsPolishingScript(false);
    }
  };

  const handleRevertScript = () => {
    if (originalScriptDraft !== null) {
      setDraftProse(originalScriptDraft);
      setOriginalScriptDraft(null);
      setIsScriptPolished(false);
      toast.info('Reverted to original script draft.');
    }
  };

  // UNIFIED SENSORY ANCHOR PIPELINE (Identical to MemoryForm.tsx — MW-88-T8 & MW-88-T9 & UX-MW-131 Live Cue Detection):
  const sensoryEvaluationText = isEditingScript ? draftProse : activeProse;
  const rawDetectedAnchors = useMemo(() => {
    if (!sensoryEvaluationText) return [];
    return detectSensoryAnchors(sensoryEvaluationText);
  }, [sensoryEvaluationText]);

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

  // Canonical Sensory Seeds for the active spark (UX-MW-131)
  const sensorySeeds: FiresideSensorySeed[] = useMemo(() => {
    return getSensorySeedsForSpark(currentSpark);
  }, [currentSpark]);

  const brainstormBadgeText = useMemo(() => {
    switch (currentLanguage) {
      case 'gu':
        return 'BRAINSTORM SPARK / વિચાર બિંદુ';
      case 'pa':
        return 'BRAINSTORM SPARK / ਵਿਚਾਰ ਬਿੰਦੂ';
      case 'hi':
        return 'BRAINSTORM SPARK / विचार बिंदु';
      case 'en':
      default:
        return 'BRAINSTORM SPARK';
    }
  }, [currentLanguage]);

  const getSensorySeedChipClasses = (icon: string) => {
    switch (icon) {
      case 'audio':
        return 'bg-sky-950/40 hover:bg-sky-900/50 border-sky-500/30 hover:border-sky-400/60 text-sky-200 hover:text-sky-100';
      case 'aroma':
        return 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/30 hover:border-amber-400/60 text-amber-200 hover:text-amber-100';
      case 'visual':
        return 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/30 hover:border-emerald-400/60 text-emerald-200 hover:text-emerald-100';
      default:
        return 'bg-purple-950/40 hover:bg-purple-900/50 border-purple-500/30 hover:border-purple-400/60 text-purple-200 hover:text-purple-100';
    }
  };

  const sensorySeedsTrayLabel = useMemo(() => {
    switch (currentLanguage) {
      case 'gu':
        return 'SENSORY SEEDS (સંવેદનાત્મક પ્રેરણા)';
      case 'pa':
        return 'SENSORY SEEDS (ਸੰਵੇਦੀ ਪ੍ਰੇਰਣਾ)';
      case 'hi':
        return 'SENSORY SEEDS (संवेदी प्रेरणा)';
      case 'en':
      default:
        return 'SENSORY SEEDS';
    }
  }, [currentLanguage]);

  const textareaPlaceholder = useMemo(() => {
    switch (currentLanguage) {
      case 'gu':
        return "✍️ તમારી અંગત યાદો, લાગણીઓ અથવા મહત્વપૂર્ણ ક્ષણો અહીં નોંધો... (દા.ત. 'ચાળીસ વર્ષ પહેલાંની વાત યાદ કરતાં, મને સૌથી વધુ સ્પર્શી જાય છે કે...')";
      case 'pa':
        return "✍️ ਆਪਣੀਆਂ ਨਿੱਜੀ ਯਾਦਾਂ, ਭਾਵਨਾਵਾਂ ਜਾਂ ਮਹੱਤਵਪੂਰਨ ਪਲਾਂ ਨੂੰ ਇੱਥੇ ਦਰਜ ਕਰੋ... (ਉਦਾਹਰਣ ਵਜੋਂ 'ਚਾਲੀ ਸਾਲ ਪਹਿਲਾਂ ਦੀ ਗੱਲ ਯਾਦ ਕਰਦਿਆਂ, ਮੇਰੇ ਦਿਲ ਵਿੱਚ ਵੱਸਿਆ ਹੈ ਕਿ...')";
      case 'hi':
        return "✍️ अपनी व्यक्तिगत यादें, भावनाएं या महत्वपूर्ण पल यहाँ लिखें... (जैसे 'चालीस साल पहले की बात याद करते हुए, मुझे सबसे ज्यादा याद आता है कि...')";
      case 'en':
      default:
        return "✍️ Note down your memories, feelings, or key moments here... (e.g. 'Looking back forty years ago, what stays with me most is...')";
    }
  }, [currentLanguage]);

  const handleApplySensorySeed = (seed: FiresideSensorySeed) => {
    const starter = seed.sentenceStarter[currentLanguage] || seed.sentenceStarter.en;
    if (!isEditingScript) {
      setIsEditingScript(true);
      setDraftProse(starter);
      setOriginalScriptDraft(null);
      setIsScriptPolished(false);
    } else {
      if (!draftProse.trim()) {
        setDraftProse(starter);
      } else {
        setDraftProse((prev) => `${prev.trim()}\n\n${starter}`);
      }
    }
    const seedLabel = seed.label[currentLanguage] || seed.label.en;
    toast.info(`Sensory seed added: ${seedLabel}`);
  };

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

  // ── Chapter Spine Rail — Unified Responsive Scene Navigation (MW-100 / MW-100-BRUTAL) ────
  const spineScenes: ChapterSpineScene[] = useMemo(() => {
    const rawScenes = sparkDeck.map((spark, idx) => {
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
        sceneNumber: linked?.sceneNumber ?? ((idx % 4) + 1),
        title: spark.title,
        partNumber: linked?.partNumber ?? 1,
        partTitle: linked?.partTitle ?? 'Part I: Roots and Foundations',
        hasCompletedReel: Boolean(takesCount > 0 || (mem && isSceneCompleted(mem))),
        hasDraftProse: Boolean(mem?.prose || mem?.originalHook),
        takesCount,
      };
    });

    const recommendedId =
      rawScenes.find((s) => !s.hasCompletedReel && s.takesCount === 0 && !s.hasDraftProse)?.id ??
      rawScenes.find((s) => !s.hasCompletedReel && s.takesCount === 0)?.id ??
      null;

    return rawScenes.map((s) => ({
      ...s,
      isNextRecommended: s.id === recommendedId,
    }));
  }, [sparkDeck, getSceneMemory, activeSceneMemory]);

  const activeSceneId = currentSpark.linkedSceneId || currentSpark.id;
  const isCurrentSceneRecommended = Boolean(
    spineScenes.find((s) => s.id === activeSceneId)?.isNextRecommended
  );
  const currentTakesCount = currentSceneMemory?.takes?.length ?? 0;
  const hasCurrentTake = currentTakesCount > 0 || hasSceneCompletedReel;
  const hasCurrentDraftProse = Boolean(activeProse || currentSceneMemory?.originalHook);
  const isCurrentDraftState =
    (currentSceneMemory as any)?.status === 'draft' ||
    (!hasCurrentTake && hasCurrentDraftProse);

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
  const activePart = useMemo(
    () => getPartForScene(currentSpark.linkedSceneId),
    [currentSpark.linkedSceneId]
  );
  const activePartHeading =
    currentLanguage === 'en'
      ? activePart.localizedTitles?.en || activePart.title
      : activePart.localizedTitles?.[currentLanguage] || activePart.localizedTitles?.gu || activePart.title;

  const partFirstSceneIndices = useMemo(() => {
    const seenParts = new Set<number>();
    const list: Array<{ partNumber: number; firstIdx: number }> = [];
    sparkDeck.forEach((spark, idx) => {
      const scene = spark.linkedSceneId ? getSceneById(spark.linkedSceneId) : undefined;
      const partNum = scene?.partNumber ?? getPartForScene(spark.linkedSceneId)?.partNumber ?? 1;
      if (!seenParts.has(partNum)) {
        seenParts.add(partNum);
        list.push({ partNumber: partNum, firstIdx: idx });
      }
    });
    return list;
  }, [sparkDeck]);

  const handleNextPart = useCallback(() => {
    if (partFirstSceneIndices.length <= 1) {
      handleNext();
      return;
    }
    const currentPartNum = linkedScene?.partNumber ?? activePart.partNumber ?? 1;
    const currentGroupIdx = partFirstSceneIndices.findIndex((g) => g.partNumber === currentPartNum);
    const nextGroupIdx = ((currentGroupIdx !== -1 ? currentGroupIdx : 0) + 1) % partFirstSceneIndices.length;
    const targetIdx = partFirstSceneIndices[nextGroupIdx].firstIdx;
    setDirection(1);
    setShowFollowUps(false);
    setCurrentIndex(targetIdx);
    onActivePromptChange?.(sparkDeck[targetIdx]);
  }, [partFirstSceneIndices, linkedScene?.partNumber, activePart.partNumber, handleNext, sparkDeck, onActivePromptChange]);

  const handlePrevPart = useCallback(() => {
    if (partFirstSceneIndices.length <= 1) {
      handlePrev();
      return;
    }
    const currentPartNum = linkedScene?.partNumber ?? activePart.partNumber ?? 1;
    const currentGroupIdx = partFirstSceneIndices.findIndex((g) => g.partNumber === currentPartNum);
    const prevGroupIdx =
      ((currentGroupIdx !== -1 ? currentGroupIdx : 0) - 1 + partFirstSceneIndices.length) %
      partFirstSceneIndices.length;
    const targetIdx = partFirstSceneIndices[prevGroupIdx].firstIdx;
    setDirection(-1);
    setShowFollowUps(false);
    setCurrentIndex(targetIdx);
    onActivePromptChange?.(sparkDeck[targetIdx]);
  }, [partFirstSceneIndices, linkedScene?.partNumber, activePart.partNumber, handlePrev, sparkDeck, onActivePromptChange]);

  const canonicalScene = linkedScene || (currentSpark.linkedSceneId ? getSceneById(currentSpark.linkedSceneId) : undefined);
  const canonicalPart = getPartForScene(canonicalScene?.id);
  const activePartRoman = activePartHeading.split(':')[0]?.trim() || `Part ${canonicalScene?.partNumber ?? 1}`;
  const activeSceneNumInPart = canonicalScene?.sceneNumber ?? 1;
  const totalScenesInActivePart = canonicalPart?.scenes?.length || 4;

  return (
    <div
      className={`w-full max-w-xl mx-auto flex flex-col items-center select-none ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* 0a. Unified Studio Orientation & Soundcheck Dock (MW-100-C: anchored across all scenes, zero layout jump) */}
      {!hideInlineOrientationDock && (
        <div className="w-full mb-3">
          <OrientationSoundcheckDock
            activeLanguage={currentLanguage}
            warmupCompleted={warmupCompleted}
            onWarmupComplete={() => {
              setWarmupCompleted(true);
              onWarmupComplete?.();
            }}
          />
        </div>
      )}

      {/* 0b. Synchronised Part Header Stepper (Jumps to Next/Previous Part - Scene 1) */}
      {!hideInlineHeaderStepper && (
        <div className="w-full flex flex-col items-center mb-2.5 text-center">
          <div className="flex items-center justify-center gap-2.5 w-full">
            <button
              type="button"
              data-testid="HS_FIRESIDE_HEADER_PREV_SCENE"
              onClick={handlePrevPart}
              aria-label="Jump to previous Part"
              title="Jump to previous Part (Scene 1)"
              style={{ minHeight: 44, minWidth: 44 }}
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 text-stone-200 hover:text-amber-300 font-mono text-lg font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              ‹
            </button>
            <div className="flex flex-col items-center min-w-0 px-1">
              <span className="text-sm sm:text-base font-serif text-white font-normal leading-tight truncate max-w-full">
                {activePartHeading}
              </span>
              <span
                data-testid="HS_FIRESIDE_HEADER_SCENE_SUBTITLE"
                className="text-[11px] font-mono text-amber-300/90 mt-0.5 leading-snug"
              >
                {activePartRoman} • Scene {activeSceneNumInPart} of {totalScenesInActivePart} • {primaryCardTitle}
              </span>
            </div>
            <button
              type="button"
              data-testid="HS_FIRESIDE_HEADER_NEXT_SCENE"
              onClick={handleNextPart}
              aria-label="Jump to next Part"
              title="Jump to next Part (Scene 1)"
              style={{ minHeight: 44, minWidth: 44 }}
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 text-stone-200 hover:text-amber-300 font-mono text-lg font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* 1. Compact Sub-Header Language & HYBRID Tray (MW-100-BRUTAL Track 3; Rule 26 touch targets) */}
      <div className="w-full flex items-center justify-center gap-1.5 mb-2.5 px-1.5 py-1 rounded-2xl bg-stone-950/60 border border-stone-800/70 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-wrap">
        {LANGUAGES.map((lang) => {
          const isActive = currentLanguage === lang;
          return (
            <button
              key={lang}
              type="button"
              data-hotspot-id={`HS_FIRESIDE_LANG_${lang.toUpperCase()}`}
              onClick={() => handleLanguageSelect(lang)}
              style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
              className={`min-h-[48px] px-3 py-1 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm shadow-amber-500/10'
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
          className={`min-h-[48px] px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
            effectiveHybrid
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
              : 'bg-white/5 text-neutral-300 border-white/15 hover:border-amber-500/40 hover:text-amber-200'
          }`}
        >
          <span>{effectiveHybrid ? '[ 🔤 HYBRID: ON ]' : '[ 🔤 HYBRID: OFF ]'}</span>
        </button>
      </div>

      {/* 1c. Chapter Spine Rail — Unified Responsive Scene Navigation (MW-100 / MW-100-C) */}
      {spineScenes.length > 0 && (
        <div className="w-full max-w-xl mx-auto mb-2.5">
          <ChapterSpineRail
            scenes={spineScenes}
            activeSceneId={activeSceneId}
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
              {/* Crown Badge: First Uncompleted Scene (MW-100-BRUTAL Section 3A) */}
              {isCurrentSceneRecommended && !hasCurrentTake && !hasCurrentDraftProse && (
                <div className="mb-2.5 flex items-center">
                  <span
                    data-testid="HS_FIRESIDE_CROWN_NEXT_RECOMMENDED"
                    className="bg-emerald-500 text-gray-950 font-black text-[10px] tracking-wider px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)] uppercase inline-flex items-center gap-1"
                  >
                    ✨ NEXT RECOMMENDED
                  </span>
                </div>
              )}

              {/* Top Meta Bar: 1:1 Desktop Lifecycle Badges + Curriculum Scene Badge + Card Index Counter */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center flex-wrap gap-1.5">
                  {/* Accessibility metadata hooks preserved as sr-only */}
                  <span
                    data-testid="carousel-category-badge"
                    title={categoryMeta.tooltip}
                    className="sr-only"
                  >
                    <CategoryIcon className="w-3.5 h-3.5" />
                    {categoryMeta.label}
                  </span>

                  {/* 1:1 Desktop Lifecycle Status Badges (MW-100-BRUTAL Section 3B) */}
                  <div
                    data-testid={cardEditingAuthority !== 'desktop_locked' ? 'carousel-mobile-recording-badge' : 'carousel-lifecycle-status-badges'}
                    title={cardEditingAuthority !== 'desktop_locked' ? 'Captured on Fireside Mobile • Full cross-device editing enabled' : undefined}
                    className="inline-flex items-center flex-wrap gap-1.5"
                  >
                    {hasCurrentTake && !isCurrentDraftState ? (
                      <>
                        <span
                          data-testid="HS_FIRESIDE_BADGE_CAPTURED"
                          className="bg-teal-950/80 text-teal-300 border border-teal-500/40 text-[11px] font-mono px-2 py-0.5 rounded-md font-bold"
                        >
                          [ 📹 CAPTURED ]
                        </span>
                        <span
                          data-testid="HS_FIRESIDE_BADGE_PRE_RELEASE"
                          className="bg-purple-950/80 text-purple-300 border border-purple-500/40 text-[11px] font-mono px-2 py-0.5 rounded-md font-bold"
                        >
                          [ 🎞️ PRE-RELEASE ]
                        </span>
                      </>
                    ) : hasCurrentTake || hasCurrentDraftProse ? (
                      <>
                        <span
                          data-testid="HS_FIRESIDE_BADGE_CAPTURED"
                          className="bg-teal-950/80 text-teal-300 border border-teal-500/40 text-[11px] font-mono px-2 py-0.5 rounded-md font-bold"
                        >
                          [ 📹 CAPTURED ]
                        </span>
                        <span
                          data-testid="HS_FIRESIDE_BADGE_STUDIO_DRAFT"
                          className="bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[11px] font-mono px-2 py-0.5 rounded-md font-bold"
                        >
                          [ ✍️ STUDIO DRAFT ]
                        </span>
                      </>
                    ) : (
                      <span
                        data-testid="HS_FIRESIDE_BADGE_READY_FOR_ACTION"
                        className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[11px] font-mono px-2 py-0.5 rounded-md font-bold"
                      >
                        [ 🎬 READY FOR ACTION ]
                      </span>
                    )}
                  </div>

                  {linkedScene && (
                    <span
                      data-testid="carousel-scene-number-badge"
                      title="Curriculum Position: Part I (Roots and Foundations), Scene 1 of 11 in your Generational Vault."
                      className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold cursor-help"
                    >
                      {linkedScene.partTitle.split(':')[0]} • Scene {linkedScene.sceneNumber}
                    </span>
                  )}

                  {cardEditingAuthority === 'desktop_locked' && (
                    <span
                      data-testid="carousel-studio-master-badge"
                      title="Authored in Desktop Studio • Full cross-device editing enabled"
                      className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold shadow-sm cursor-help"
                    >
                      ✨ Studio Master
                    </span>
                  )}

                  {currentSpark.suggestedMediaMode && (
                    <span
                      data-testid="carousel-media-badge"
                      title="Recommended Capture Mode: Intimate selfie video with live teleprompter."
                      className="sr-only"
                    >
                      {currentSpark.suggestedMediaMode === 'video' ? (
                        <>
                          <Video className="w-3 h-3 text-amber-400" />
                          <span>Video Memo</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 text-amber-400" />
                          <span>Voice &amp; Photos</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    data-testid="carousel-story-progress-pill"
                    title={`Scene ${activeSceneNumInPart} of ${totalScenesInActivePart} in ${activePartRoman}`}
                    className="text-xs font-mono text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10"
                  >
                    Scene {activeSceneNumInPart} of {totalScenesInActivePart}
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
                        ? 'border-sky-500/50 bg-sky-950/40 text-sky-300 font-bold ring-1 ring-sky-400/40'
                        : activeProse
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 font-bold hover:bg-sky-500/20'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="sm:hidden truncate">{activeProse ? '✓ ' : '● '}I • SCRIPT</span>
                    <span className="hidden sm:inline truncate">{activeProse ? '✓ ' : '● '}I • SCRIPT</span>
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
                        ? 'border-amber-500/50 bg-amber-950/40 text-amber-300 font-bold ring-1 ring-amber-400/40'
                        : hasSceneCompletedReel || activeProductionStage >= 2
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold hover:bg-amber-500/20'
                        : activeProse
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 font-bold hover:bg-amber-500/25'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="sm:hidden truncate">
                      {hasSceneCompletedReel || activeProductionStage >= 2 ? '✓ ' : activeProse ? '● ' : '○ '}II • WEAVE
                    </span>
                    <span className="hidden sm:inline truncate">
                      {hasSceneCompletedReel || activeProductionStage >= 2 ? '✓ ' : activeProse ? '● ' : '○ '}II • WEAVE
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
                        ? 'border-amber-500/50 bg-amber-950/40 text-amber-300 font-bold ring-1 ring-amber-400/40'
                        : hasSceneCompletedReel || activeProductionStage >= 3
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold hover:bg-amber-500/20'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="sm:hidden truncate">
                      {hasSceneCompletedReel || activeProductionStage >= 3 ? '✓ ' : '○ '}III • RECORD
                    </span>
                    <span className="hidden sm:inline truncate">
                      {hasSceneCompletedReel || activeProductionStage >= 3 ? '✓ ' : '○ '}III • RECORD
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
                      {isMasteredScene || activeProductionStage === 4 ? '✓ ' : '○ '}IV • REEL
                    </span>
                    <span className="hidden sm:inline truncate">
                      {isMasteredScene || activeProductionStage === 4 ? '✓ ' : '○ '}IV • REEL
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    data-testid="HS_FIRESIDE_SPINE_PROGRESS_BTN"
                    data-hotspot-id="HS_FIRESIDE_SPINE_PROGRESS_BTN"
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

                const currentCaptureMode: FiresideMediaMode = mediaMode || currentSpark?.suggestedMediaMode || 'video';

                return (
                  <div
                    data-testid="HS_FIRESIDE_ACT3_CAPTURE_SLATE"
                    className="mb-3 p-4 rounded-xl bg-stone-950/80 border border-amber-500/30 shadow-lg flex flex-col gap-3.5"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                          <span>🎬</span>
                          <span>Act III: The Recording Floor</span>
                        </span>
                        <span className="text-[11px] text-stone-400">
                          Choose capture format:
                        </span>
                      </div>
                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        Ready to capture your voice or selfie video performance with the teleprompter below.
                      </p>
                      <FiresideModeSwitch
                        mode={currentCaptureMode}
                        onModeChange={(nextMode) => {
                          onMediaModeChange?.(nextMode);
                        }}
                        suggestedMode={currentSpark?.suggestedMediaMode}
                        className="w-full my-0.5"
                      />
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        data-testid="HS_FIRESIDE_OPEN_VIEWFINDER_BTN"
                        onClick={() => {
                          handleSelectCurrent();
                          scrollToActiveSoundstage();
                        }}
                        style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-98"
                      >
                        {currentCaptureMode === 'audio'
                          ? '[ 🎙️ Open Voice Studio & Prompter → ]'
                          : '[ 🎬 Ignite Camera & Prompter → ]'}
                      </button>
                    </div>
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

              {/* Live Act I Prose Rendering, Armchair Script Editor & Sensory Modality Counters (MW-88-T4 / MW-88-T7 / MW-88-T9 / Rule 14 / UX-MW-131) */}
              {isEditingScript ? (
                <div
                  data-testid="fireside-armchair-script-editor"
                  className="space-y-3.5 p-4 rounded-2xl bg-black/55 border border-amber-500/40"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                        ARMCHAIR SCRIPT EDITOR
                      </p>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        Changes made here sync automatically to your Desktop Studio.
                      </p>
                    </div>
                  </div>

                  {/* 1. Dedicated Persistent Inspiration Deck Card (UX-MW-131) */}
                  <div
                    data-testid="fireside-inspiration-deck-card"
                    className="p-3.5 rounded-xl bg-stone-950/80 border border-amber-500/30 shadow-md space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          data-testid="fireside-brainstorm-spark-badge"
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 ring-1 ring-amber-400/30 shadow-sm flex items-center gap-1.5"
                        >
                          <span>💡</span>
                          <span>{brainstormBadgeText}</span>
                        </span>
                        {linkedScene && (
                          <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md bg-stone-900 border border-white/10 text-neutral-400">
                            Scene {linkedScene.sceneNumber} • {linkedScene.partTitle.split(':')[0]}
                          </span>
                        )}
                      </div>

                      {/* Persistent Bilingual Language Switcher for Inspiration Deck */}
                      <div className="flex items-center gap-1" data-testid="fireside-inspiration-lang-switcher">
                        {(['en', 'gu', 'pa', 'hi'] as FiresideLanguage[]).map((lang) => {
                          const isCurrent = currentLanguage === lang;
                          return (
                            <button
                              key={lang}
                              type="button"
                              data-testid={`fireside-inspiration-lang-${lang}`}
                              aria-label={`Switch prompt card language to ${FIRESIDE_LANGUAGE_LABELS[lang]}`}
                              onClick={() => handleLanguageSelect(lang)}
                              className={`min-h-[32px] px-2 py-0.5 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer border ${
                                isCurrent
                                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 font-bold ring-1 ring-amber-400/40'
                                  : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                              }`}
                              title={`Switch prompt card language to ${FIRESIDE_LANGUAGE_LABELS[lang]}`}
                            >
                              {lang.toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <p
                      data-testid="fireside-inspiration-deck-prompt"
                      className="text-base sm:text-lg font-serif text-white/95 leading-relaxed tracking-wide selection:bg-amber-500/30 selection:text-amber-200"
                    >
                      &ldquo;{currentText}&rdquo;
                    </p>
                  </div>

                  {/* 2. Dedicated Sensory Seeds Tray (UX-MW-131) */}
                  <div
                    data-testid="fireside-sensory-seeds-tray"
                    className="p-3 rounded-xl bg-stone-900/60 border border-emerald-500/25 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        data-testid="fireside-sensory-seeds-header"
                        className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5"
                      >
                        <span>🌿</span>
                        <span>{sensorySeedsTrayLabel}</span>
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">
                        Tap seed to inspire story starter
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap" data-testid="fireside-sensory-seeds-chips">
                      {sensorySeeds.map((seed) => {
                        const chipIcon =
                          seed.icon === 'audio' ? '👂' : seed.icon === 'aroma' ? '☕' : seed.icon === 'visual' ? '👁️' : '🌿';
                        const chipLabel = seed.label[currentLanguage] || seed.label.en;
                        return (
                          <button
                            key={seed.id}
                            type="button"
                            data-testid={`fireside-sensory-seed-chip-${seed.id}`}
                            onClick={() => handleApplySensorySeed(seed)}
                            title={`Click to inspire: Append starter "${seed.sentenceStarter[currentLanguage] || seed.sentenceStarter.en}..."`}
                            className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-mono font-medium active:scale-98 border transition-all cursor-pointer flex items-center gap-2 shadow-sm ${getSensorySeedChipClasses(seed.icon)}`}
                          >
                            <span className="text-sm">{chipIcon}</span>
                            <span className="font-semibold">{chipLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shared Sensory Modality Key & Dual-Layer Underline Editor (ARCH-MW-132 / Rule 48) */}
                  <SensoryModalityKey
                    editorRef={sensoryEditorRef}
                    detectedAnchors={rawDetectedAnchors}
                    className="pt-0.5"
                    testIdPrefix="fireside-live-sensory-counters"
                  />

                  <SensoryScriptEditor
                    ref={sensoryEditorRef}
                    value={draftProse}
                    onChange={(val) => {
                      setDraftProse(val);
                      if (isScriptPolished && originalScriptDraft !== null && val !== draftProse) {
                        setIsScriptPolished(false);
                      }
                    }}
                    rows={5}
                    placeholder={textareaPlaceholder}
                    typography="serif"
                    textareaClassName="p-3.5 pr-10 pb-4"
                    lang={currentLanguage && currentLanguage !== 'en' ? currentLanguage : 'en-GB'}
                    dataTestId="HS_FIRESIDE_SCRIPT_TEXTAREA"
                    ariaLabel="Edit story script"
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
                      data-testid="HS_FIRESIDE_SCRIPT_POLISH_BTN"
                      onClick={handlePolishScript}
                      disabled={isPolishingScript || draftProse.trim().length < 5}
                      className="min-h-[48px] px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Check spelling, grammar agreement & British English"
                    >
                      {isPolishingScript ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Elevating Script...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>[ ✨ Proofread Script ]</span>
                        </>
                      )}
                    </button>
                    {isScriptPolished && originalScriptDraft !== null && (
                      <button
                        type="button"
                        data-testid="HS_FIRESIDE_SCRIPT_REVERT_BTN"
                        onClick={handleRevertScript}
                        className="min-h-[48px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                        <span>[ ↺ Revert Draft ]</span>
                      </button>
                    )}
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
                        data-testid="HS_FIRESIDE_CAROUSEL_SPARK_TOGGLE_BTN"
                        data-hotspot-id="HS_FIRESIDE_CAROUSEL_SPARK_TOGGLE_BTN"
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
                        data-testid="HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN"
                        data-hotspot-id="HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN"
                        onClick={handleStartEditScript}
                        className="min-h-[48px] sm:min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-950/60 hover:bg-amber-900/70 active:scale-98 text-amber-400 border border-amber-500/30 transition-all cursor-pointer shrink-0"
                      >
                        <span data-testid="HS_FIRESIDE_EDIT_SCRIPT_BTN">✏️ EDIT SCENE</span>
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
                    <div className="space-y-3">
                      <div
                        data-testid="fireside-active-script-body"
                        className="text-base sm:text-lg font-serif text-white/95 leading-relaxed tracking-wide selection:bg-amber-500/30 selection:text-amber-200 max-h-56 overflow-y-auto pr-1"
                      >
                        &ldquo;{renderedScriptContent}&rdquo;
                      </div>

                      {/* Sensory Seeds Tray for easy inspiration */}
                      <div
                        data-testid="fireside-sensory-seeds-tray"
                        className="p-3 rounded-xl bg-stone-900/40 border border-emerald-500/25 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            data-testid="fireside-sensory-seeds-header"
                            className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5"
                          >
                            <span>🌿</span>
                            <span>{sensorySeedsTrayLabel}</span>
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            Tap seed to add starter
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap" data-testid="fireside-sensory-seeds-chips">
                          {sensorySeeds.map((seed) => {
                            const chipIcon =
                              seed.icon === 'audio' ? '👂' : seed.icon === 'aroma' ? '☕' : seed.icon === 'visual' ? '👁️' : '🌿';
                            const chipLabel = seed.label[currentLanguage] || seed.label.en;
                            return (
                              <button
                                key={seed.id}
                                type="button"
                                data-testid={`fireside-sensory-seed-chip-${seed.id}`}
                                onClick={() => handleApplySensorySeed(seed)}
                                title={`Click to inspire: Append starter "${seed.sentenceStarter[currentLanguage] || seed.sentenceStarter.en}..."`}
                                className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-mono font-medium active:scale-98 border transition-all cursor-pointer flex items-center gap-2 shadow-sm ${getSensorySeedChipClasses(seed.icon)}`}
                              >
                                <span className="text-sm">{chipIcon}</span>
                                <span className="font-semibold">{chipLabel}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Persistent Inspiration Deck Card */}
                      <div
                        data-testid="fireside-inspiration-deck-card"
                        className="p-3.5 rounded-xl bg-stone-950/80 border border-amber-500/30 shadow-md space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            data-testid="fireside-brainstorm-spark-badge"
                            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 ring-1 ring-amber-400/30 shadow-sm flex items-center gap-1.5"
                          >
                            <span>💡</span>
                            <span>{brainstormBadgeText}</span>
                          </span>
                        </div>
                        <p
                          data-testid="fireside-prompt-spark-body"
                          className="text-lg sm:text-xl font-serif text-stone-200 leading-relaxed tracking-wide selection:bg-amber-500/30 selection:text-amber-200"
                        >
                          &ldquo;{currentText}&rdquo;
                        </p>
                      </div>

                      {/* Sensory Seeds Tray */}
                      <div
                        data-testid="fireside-sensory-seeds-tray"
                        className="p-3 rounded-xl bg-stone-900/40 border border-emerald-500/25 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            data-testid="fireside-sensory-seeds-header"
                            className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5"
                          >
                            <span>🌿</span>
                            <span>{sensorySeedsTrayLabel}</span>
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            Tap seed to add starter
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap" data-testid="fireside-sensory-seeds-chips">
                          {sensorySeeds.map((seed) => {
                            const chipIcon =
                              seed.icon === 'audio' ? '👂' : seed.icon === 'aroma' ? '☕' : seed.icon === 'visual' ? '👁️' : '🌿';
                            const chipLabel = seed.label[currentLanguage] || seed.label.en;
                            return (
                              <button
                                key={seed.id}
                                type="button"
                                data-testid={`fireside-sensory-seed-chip-${seed.id}`}
                                onClick={() => handleApplySensorySeed(seed)}
                                title={`Click to inspire: Append starter "${seed.sentenceStarter[currentLanguage] || seed.sentenceStarter.en}..."`}
                                className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-mono font-medium active:scale-98 border transition-all cursor-pointer flex items-center gap-2 shadow-sm ${getSensorySeedChipClasses(seed.icon)}`}
                              >
                                <span className="text-sm">{chipIcon}</span>
                                <span className="font-semibold">{chipLabel}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Unwritten Story Canvas / Empty Scene (UX-MW-131) */
                <div className="space-y-3">
                  {/* Dedicated Persistent Inspiration Deck Card */}
                  <div
                    data-testid="fireside-inspiration-deck-card"
                    className="p-4 rounded-xl bg-stone-950/80 border border-amber-500/30 shadow-md space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        data-testid="fireside-brainstorm-spark-badge"
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 ring-1 ring-amber-400/30 shadow-sm flex items-center gap-1.5"
                      >
                        <span>💡</span>
                        <span>{brainstormBadgeText}</span>
                      </span>
                    </div>
                    <p
                      data-testid="fireside-prompt-spark-body"
                      className="text-xl sm:text-2xl font-serif text-white/95 leading-relaxed tracking-wide selection:bg-amber-500/30 selection:text-amber-200"
                    >
                      &ldquo;{currentText}&rdquo;
                    </p>
                  </div>

                  {/* Dedicated Sensory Seeds Tray */}
                  <div
                    data-testid="fireside-sensory-seeds-tray"
                    className="p-3.5 rounded-xl bg-stone-900/60 border border-emerald-500/25 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        data-testid="fireside-sensory-seeds-header"
                        className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5"
                      >
                        <span>🌿</span>
                        <span>{sensorySeedsTrayLabel}</span>
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">
                        Tap seed to inspire story starter
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap" data-testid="fireside-sensory-seeds-chips">
                      {sensorySeeds.map((seed) => {
                        const chipIcon =
                          seed.icon === 'audio' ? '👂' : seed.icon === 'aroma' ? '☕' : seed.icon === 'visual' ? '👁️' : '🌿';
                        const chipLabel = seed.label[currentLanguage] || seed.label.en;
                        return (
                          <button
                            key={seed.id}
                            type="button"
                            data-testid={`fireside-sensory-seed-chip-${seed.id}`}
                            onClick={() => handleApplySensorySeed(seed)}
                            title={`Click to inspire: Start story with "${seed.sentenceStarter[currentLanguage] || seed.sentenceStarter.en}..."`}
                            className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-mono font-medium active:scale-98 border transition-all cursor-pointer flex items-center gap-2 shadow-sm ${getSensorySeedChipClasses(seed.icon)}`}
                          >
                            <span className="text-sm">{chipIcon}</span>
                            <span className="font-semibold">{chipLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      data-testid="HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN"
                      data-hotspot-id="HS_FIRESIDE_CAROUSEL_SCRIPT_EDIT_BTN"
                      onClick={handleStartEditScript}
                      className="min-h-[48px] sm:min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-semibold bg-amber-500/15 hover:bg-amber-500/25 active:scale-98 text-amber-200 border border-amber-500/40 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span data-testid="HS_FIRESIDE_EDIT_SCRIPT_BTN">[ ✏️ Draft Scene / Begin Story ]</span>
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
            className={`w-full min-h-[56px] px-4 py-3 rounded-2xl font-mono font-bold text-xs sm:text-sm active:scale-98 transition-all flex items-center justify-center text-center cursor-pointer ${
              stageProgression.nextTab === 'act4'
                ? 'bg-emerald-950/80 hover:bg-emerald-900/90 border-2 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-950/30'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
            }`}
          >
            {stageProgression.label}
          </button>

          <button
            type="button"
            data-testid="HS_FIRESIDE_DIRECT_RECORD_BTN"
            data-hotspot-id="HS_FIRESIDE_CONFIRM_STORY_BTN"
            onClick={() => {
              handleSelectActTab('act3');
              if (hasCurrentTake) {
                onOpenScreeningRoom?.();
              } else {
                handleSelectCurrent();
                scrollToActiveSoundstage();
              }
            }}
            style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
            className={
              hasCurrentTake
                ? 'w-full min-h-[48px] px-4 py-3 rounded-xl border border-sky-500/40 bg-sky-950/30 text-sky-300 hover:bg-sky-900/40 font-mono font-bold text-xs sm:text-sm shadow-lg shadow-sky-950/20 active:scale-98 transition-all flex items-center justify-center text-center cursor-pointer'
                : 'w-full min-h-[48px] px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-gray-950 font-mono font-black text-xs sm:text-sm shadow-lg shadow-sky-500/20 active:scale-98 transition-all flex items-center justify-center text-center cursor-pointer'
            }
            aria-label={
              effectiveMediaMode === 'video'
                ? `Record performance: ${currentSpark.title}`
                : `Speak this memory: ${currentSpark.title}`
            }
          >
            {hasCurrentTake
              ? '[ ✏️ Edit Scene / Audition Take → ]'
              : '[ 🎬 Action: Record Scene → ]'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SingleCardPromptCarousel;
