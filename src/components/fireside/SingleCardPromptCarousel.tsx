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
  ChevronLeft,
  ChevronRight,
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
  Crown
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

export interface SingleCardPromptCarouselProps {
  prompts?: FiresidePromptSpark[];
  initialPromptId?: string;
  activeLanguage?: FiresideLanguage;
  mediaMode?: FiresideMediaMode;
  onSelectPrompt?: (spark: FiresidePromptSpark, language: FiresideLanguage) => void;
  onActivePromptChange?: (spark: FiresidePromptSpark) => void;
  onLanguageChange?: (language: FiresideLanguage) => void;
  onPhotoPromptClick?: (photoPrompt: string) => void;
  className?: string;
}

const CATEGORY_META: Record<
  PromptCategory,
  { label: string; icon: React.ElementType; colour: string }
> = {
  childhood: { label: 'Childhood & Home', icon: BookOpen, colour: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  roots: { label: 'Origins & Roots', icon: Compass, colour: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  love: { label: 'Courtship & Love', icon: Heart, colour: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  wisdom: { label: 'Wisdom & Courage', icon: Award, colour: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  traditions: { label: 'Festive Traditions', icon: Calendar, colour: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  lessons: { label: 'Honest Labour', icon: Crown, colour: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  humour: { label: 'Family Humour', icon: Smile, colour: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
  legacy: { label: 'Blessing & Legacy', icon: Sparkles, colour: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
};

const LANGUAGES: FiresideLanguage[] = ['en', 'gu', 'pa', 'hi'];

export function SingleCardPromptCarousel({
  prompts = FIRESIDE_PROMPT_SPARKS,
  initialPromptId,
  activeLanguage: controlledLanguage,
  mediaMode,
  onSelectPrompt,
  onActivePromptChange,
  onLanguageChange,
  onPhotoPromptClick,
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
  const [direction, setDirection] = useState<number>(0);
  const [showFollowUps, setShowFollowUps] = useState<boolean>(false);

  const currentLanguage = controlledLanguage || internalLanguage;
  const currentSpark = sparkDeck[currentIndex] || sparkDeck[0];

  useEffect(() => {
    onActivePromptChange?.(currentSpark);
  }, [currentSpark, onActivePromptChange]);
  const categoryMeta = CATEGORY_META[currentSpark.category] || CATEGORY_META.childhood;
  const CategoryIcon = categoryMeta.icon;

  const effectiveMediaMode: FiresideMediaMode = mediaMode || currentSpark.suggestedMediaMode || 'audio';
  const linkedScene = currentSpark.linkedSceneId ? getSceneById(currentSpark.linkedSceneId) : undefined;

  const handleLanguageSelect = (lang: FiresideLanguage) => {
    setInternalLanguage(lang);
    onLanguageChange?.(lang);
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

  const currentText = currentSpark.sparks[currentLanguage] || currentSpark.sparks.en;
  const followUps = currentSpark.followUpQuestions[currentLanguage] || currentSpark.followUpQuestions.en || [];
  const photoPrompt = currentSpark.recommendedPhotoPrompt[currentLanguage] || currentSpark.recommendedPhotoPrompt.en;

  return (
    <div
      className={`w-full max-w-xl mx-auto flex flex-col items-center select-none ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* 1. Language Toggle Pills (Armchair 1-Tap Switching) */}
      <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 mb-4 px-1 overflow-x-auto no-scrollbar">
        {LANGUAGES.map((lang) => {
          const isActive = currentLanguage === lang;
          return (
            <button
              key={lang}
              type="button"
              data-hotspot-id={`HS_FIRESIDE_LANG_${lang.toUpperCase()}`}
              onClick={() => handleLanguageSelect(lang)}
              className={`min-h-[44px] sm:min-h-[48px] px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
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
      </div>

      {/* 2. The Single Interactive Story Spark Card */}
      <div className="w-full relative min-h-[360px] sm:min-h-[400px]">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={`${currentSpark.id}-${currentIndex}`}
            custom={direction}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
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
            className="w-full bg-[#171717]/95 border border-amber-500/25 hover:border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col justify-between transition-colors relative overflow-hidden shrink-0"
          >
            {/* Ambient Background Warmth */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Top Meta Bar: Category Pill + Curriculum Badge + Card Index Counter */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
                <div className="flex items-center flex-wrap gap-1.5">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${categoryMeta.colour}`}
                  >
                    <CategoryIcon className="w-3.5 h-3.5" />
                    <span className="uppercase tracking-wider text-[11px] font-semibold">
                      {categoryMeta.label}
                    </span>
                  </div>

                  {linkedScene && (
                    <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
                      {linkedScene.partTitle.split(':')[0]} • Scene {linkedScene.sceneNumber}
                    </span>
                  )}

                  {currentSpark.suggestedMediaMode && (
                    <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1 font-semibold">
                      {currentSpark.suggestedMediaMode === 'video' ? (
                        <>
                          <Video className="w-3 h-3 text-amber-400" />
                          <span>Video Memo • Recommended</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 text-amber-400" />
                          <span>Voice & Photos • Curriculum</span>
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


              {/* Memory Prompt Heading & Spark Prose */}
              <h3 className="text-sm sm:text-base font-semibold text-amber-400/90 tracking-wide mb-3 flex items-center gap-2">
                <span>{currentSpark.title}</span>
              </h3>

              <p className="text-xl sm:text-2xl font-serif text-white/95 leading-relaxed tracking-wide selection:bg-amber-500/30 selection:text-amber-200">
                "{currentText}"
              </p>
            </div>

            {/* 3. Expandable Follow-Up Inquiries Drawer */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                data-hotspot-id="HS_FIRESIDE_FOLLOWUPS_DRAWER_BTN"
                onClick={() => setShowFollowUps((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-amber-300 hover:text-amber-200 transition-colors py-2 px-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 cursor-pointer"
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
                    <ul className="mt-3 space-y-2.5 pl-2 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                      {followUps.map((question, qIdx) => (
                        <li key={qIdx} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{question}</span>
                        </li>
                      ))}
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
                    className="self-start sm:self-center shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-98 text-amber-200 text-xs font-semibold border border-amber-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
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

      {/* 5. Elder-Ergonomic Touch Controls (Rule 26: min-h-[56px]) */}
      <div className="w-full mt-5 flex flex-col gap-3">
        {/* Navigation Touch Bar: Prev / Next buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            data-hotspot-id="HS_FIRESIDE_PREV_STORY_BTN"
            onClick={handlePrev}
            style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
            className="w-full px-5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 text-white font-medium text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
            aria-label="Previous story spark"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-300" />
            <span>Previous Story</span>
          </button>

          <button
            type="button"
            data-hotspot-id="HS_FIRESIDE_NEXT_STORY_BTN"
            onClick={handleNext}
            style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
            className="w-full px-5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 text-white font-medium text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
            aria-label="Next story spark"
          >
            <span>Next Story</span>
            <ChevronRight className="w-5 h-5 text-neutral-300" />
          </button>
        </div>

        {/* Primary Story Confirmation Button: Speak or Record Video */}
        <button
          type="button"
          data-hotspot-id="HS_FIRESIDE_CONFIRM_STORY_BTN"
          onClick={handleSelectCurrent}
          style={{ minHeight: `${FIRESIDE_TOUCH_TARGETS.MIN_BUTTON_HEIGHT_PX}px` }}
          className="w-full px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-base sm:text-lg shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          aria-label={
            effectiveMediaMode === 'video'
              ? `Record video memo: ${currentSpark.title}`
              : `Speak this memory: ${currentSpark.title}`
          }
        >
          {effectiveMediaMode === 'video' ? (
            <>
              <Video className="w-5 h-5 text-black" />
              <span>Record Video Memo ➔</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 text-black" />
              <span>Speak This Memory ➔</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
}

export default SingleCardPromptCarousel;
