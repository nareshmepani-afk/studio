"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Memory } from '@/types';

interface CinemaPosterProps {
  memory: Memory;
  className?: string;
}

/**
 * CinemaPoster Component
 * Renders a professional 2:3 vertical film poster for a memory.
 */
export function CinemaPoster({ memory, className = "" }: CinemaPosterProps) {
  const credits = memory.credits;
  
  // Determine the best source for the poster image
  // Ensure we don't try to use a .webm or .mp4 as a static image source
  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.match(/\.(webm|mp4|mov|ogg)$/);
  };
  
  const primaryImage = (memory as any)?.posterImageUrl || 
    (memory as any)?.posterUrl ||
    (memory as any)?.localPosterUrl ||
    (memory as any)?.selfieUrl ||
    (memory as any)?.heroImageUrl ||
    (memory as any)?.narratorPhotoUrl ||
    (!isVideoUrl(memory.imageUrl) ? memory.imageUrl : null) || 
    memory.mediaAttachments?.find(m => m.type === 'image')?.url || 
    memory.mediaAttachments?.find(m => !isVideoUrl(m.url))?.url ||
    memory.mediaAttachments?.find(m => m.thumbnailUrl)?.thumbnailUrl;

  const hasBackground = !!primaryImage;

  // Construct the Billing Block text
  const director = credits?.director || 'A STORYTELLER';
  const producer = credits?.producer || 'HOUSE OF MEMORIES';
  const starring = credits?.starring || 'THE SOUL OF THE STORY';

  return (
    <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-slate-950 shadow-2xl border border-white/10 group ${className}`}>
      {/* 1. Underlying Image with Filmic Filter Stack */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'brightness(0.85) contrast(1.15) saturate(0.95)' }}
      >
        {hasBackground ? (
          <Image 
            src={primaryImage} 
            alt={memory.title || "Memory Poster"} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-[2000ms] group-hover:scale-105" 
            priority
            unoptimized={primaryImage.startsWith('blob:')}
          />
        ) : (
          /* Fallback Gradient if no image exists */
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
             <div className="w-28 h-28 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                <span className="text-3xl">🎬</span>
             </div>
             <span className="font-serif italic text-base text-amber-200/80">Cinematic Memory Archive</span>
          </div>
        )}
      </div>

      {/* 2. Film Grain & Gradient Vignette Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60 pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.7)] pointer-events-none" />

      {/* 3. Gold-tinted Chapter Header (Top Focus) */}
      <div className="absolute top-6 inset-x-0 text-center px-4 z-10 pointer-events-none">
        <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex flex-col items-center gap-1.5"
        >
          <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {memory.chapterTitle || "AN ORIGINAL MEMORY"}
          </span>
          <div className="h-0.5 w-8 bg-amber-400/50 rounded-full" />
        </motion.div>
      </div>

      {/* 4 & 5. Unified Bottom Billing & Title Block (Eliminates text overlapping and cramped lines) */}
      <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 flex flex-col items-center gap-2.5 text-center bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-14 z-10 pointer-events-none">
        {/* Film Title */}
        <motion.h2 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-serif italic text-xl sm:text-2xl lg:text-3xl text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] tracking-wider leading-tight uppercase max-w-[92%]"
        >
          {memory.title || "UNTITLED MEMORY"}
        </motion.h2>
        
        {/* Memory Coordinates (Location & Year) */}
        {(memory.location || memory.dateComponents?.year) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.35em] text-amber-300/90 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
          >
            {memory.location} {memory.location && memory.dateComponents?.year ? '•' : ''} {memory.dateComponents?.year}
          </motion.p>
        )}

        {/* Decorative Divider */}
        <div className="h-px w-16 bg-white/20 my-0.5" />

        {/* Theatrical Billing Credits */}
        <div className="flex flex-col items-center gap-1 text-white/90">
           <span className="text-[8px] sm:text-[9px] font-sans tracking-[0.2em] text-amber-100/90 font-medium uppercase leading-relaxed text-center drop-shadow-md">
              DIRECTED BY <strong className="text-white font-bold">{director.toUpperCase()}</strong> • PRODUCED BY <strong className="text-white font-bold">{producer.toUpperCase()}</strong>
           </span>
           <span className="text-[8px] sm:text-[9px] font-sans tracking-[0.25em] text-emerald-300 font-semibold uppercase leading-relaxed text-center drop-shadow-md">
              STARRING <strong className="text-white font-bold">{starring.toUpperCase()}</strong>
           </span>
          
          {/* Custom Billing Line */}
          {credits?.billingLine && (
            <p className="text-[7.5px] uppercase tracking-widest text-center mt-1 text-white/70 line-clamp-2">
              {credits.billingLine}
            </p>
          )}

          {/* Theatrical Branding Release Badge */}
          <div className="flex items-center gap-2 mt-1.5 opacity-90">
             <div className="h-px w-4 bg-amber-400/40" />
             <span className="font-serif italic text-[8.5px] sm:text-[9.5px] tracking-[0.25em] uppercase text-amber-300 font-medium">
                Chronicle Cinema Release
             </span>
             <div className="h-px w-4 bg-amber-400/40" />
          </div>
        </div>
      </div>

      {/* Decorative Border Frame */}
      <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none group-hover:border-amber-400/30 transition-colors z-20" />
    </div>
  );
}

export default CinemaPoster;
