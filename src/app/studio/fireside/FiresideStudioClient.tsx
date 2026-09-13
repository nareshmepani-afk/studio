'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { FiresideLanguage, FiresidePromptSpark } from '@/types/fireside';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';
import { Sparkles, ArrowLeft, HeartHandshake, CheckCircle2 } from 'lucide-react';

export default function FiresideStudioClient() {
  const searchParams = useSearchParams();
  
  // Resolve URL parameters
  const initialLangParam = searchParams.get('lang') as FiresideLanguage | null;
  const initialPromptParam = searchParams.get('prompt') || undefined;

  const validLangs: FiresideLanguage[] = ['en', 'gu', 'pa', 'hi'];
  const resolvedLang: FiresideLanguage = initialLangParam && validLangs.includes(initialLangParam) 
    ? initialLangParam 
    : 'en';

  const [activeLanguage, setActiveLanguage] = useState<FiresideLanguage>(resolvedLang);
  const [selectedSpark, setSelectedSpark] = useState<FiresidePromptSpark | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync state if URL searchParams change
  useEffect(() => {
    if (initialLangParam && validLangs.includes(initialLangParam)) {
      setActiveLanguage(initialLangParam);
    }
  }, [initialLangParam]);

  const handleSelectPrompt = (spark: FiresidePromptSpark, language: FiresideLanguage) => {
    setSelectedSpark(spark);
    const title = spark.title;
    setNotification(`"${title}" selected. Ready for Voice Recording (MW-246).`);
    
    // Auto-clear notification after 4 seconds
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleLanguageChange = (lang: FiresideLanguage) => {
    setActiveLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-stone-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Ambient Navigation Header */}
      <header className="w-full border-b border-stone-800/80 bg-stone-950/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-stone-400 hover:text-amber-300 transition-colors py-1.5 px-2 rounded-lg hover:bg-stone-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
            <span className="text-xs sm:text-sm font-serif font-semibold tracking-wide text-amber-300">
              Fireside Voice Studio
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="hidden sm:inline text-stone-500">Living Memoir</span>
          </div>
        </div>
      </header>

      {/* Primary Armchair Storytelling Surface */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-2xl mx-auto">
        {/* Intro Subhead */}
        <div className="text-center mb-6 max-w-md">
          <p className="text-xs uppercase tracking-widest text-amber-400/80 font-medium mb-1">
            Armchair Storytelling Surface
          </p>
          <h1 className="text-xl sm:text-2xl font-serif text-white font-normal">
            Choose a Memory Spark
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            One memory at a time. Select your mother tongue or swipe to browse.
          </p>
        </div>

        {/* The Carousel */}
        <div className="w-full">
          <SingleCardPromptCarousel
            prompts={FIRESIDE_PROMPT_SPARKS}
            initialPromptId={initialPromptParam}
            activeLanguage={activeLanguage}
            onSelectPrompt={handleSelectPrompt}
            onLanguageChange={handleLanguageChange}
          />
        </div>

        {/* Selected Spark Confirmation Toast */}
        {notification && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-stone-900/95 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">
              {notification}
            </p>
          </div>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="w-full py-4 border-t border-stone-900 text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
        <HeartHandshake className="w-3.5 h-3.5 text-stone-600" />
        <span>Designed for multi-generational storytelling & elder ergonomics</span>
      </footer>
    </div>
  );
}
