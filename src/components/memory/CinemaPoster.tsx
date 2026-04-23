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
  // We check before the query parameters for the file extension
  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.match(/\.(webm|mp4|mov|ogg)$/);
  };
  
  const primaryImage = memory.posterImageUrl || 
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
    <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-950 shadow-2xl border border-white/5 group ${className}`}>
      {/* 1. Underlying Image with Filmic Filter Stack */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'brightness(0.85) contrast(1.15) saturate(0.8)' }}
      >
        {hasBackground ? (
          <Image 
            src={primaryImage} 
            alt={memory.title} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
            priority
          />
        ) : (
          /* Fallback Gradient if no image exists */
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center">
             <div className="w-24 h-24 rounded-full bg-amber-500/5 blur-2xl animate-pulse" />
          </div>
        )}
      </div>

      {/* 2. Cinematic Shadows & Depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/40" />
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.6)] pointer-events-none" />

      {/* 3. Gold-tinted Chapter Header (Top Focus) */}
      <div className="absolute top-8 left-0 w-full text-center px-4">
        <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-block"
        >
          <span className="text-[10px] sm:text-xs font-sans font-medium uppercase tracking-[0.4em] text-amber-200/80 drop-shadow-md">
            {memory.chapterTitle || "An Original Memory"}
          </span>
          <div className="h-px w-8 bg-amber-500/30 mx-auto mt-2" />
        </motion.div>
      </div>

      {/* 4. Film Title (Bottom Third Focus) */}
      <div className="absolute inset-x-0 bottom-[22%] px-6 text-center pointer-events-none">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-serif italic text-2xl sm:text-3xl lg:text-4xl text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] tracking-widest leading-tight uppercase"
        >
          {memory.title}
        </motion.h2>
      </div>

      {/* 5. Billing Block (Theatrical Credits) */}
      <div className="absolute bottom-6 inset-x-0 px-8">
        <div className="flex flex-col items-center gap-1 opacity-60 group-hover:opacity-90 transition-opacity duration-700">
          <div className="flex flex-col items-center gap-0.5 max-w-full">
             <span className="text-[0.5rem] font-sans tracking-[0.25em] text-white/80 leading-tight font-light text-center">
                DIRECTED BY {director.toUpperCase()} • PRODUCED BY {producer.toUpperCase()}
             </span>
             <span className="text-[0.6rem] font-sans tracking-[0.35em] text-white font-medium text-center uppercase">
                STARRING {starring.toUpperCase()}
             </span>
          </div>
          
          {/* Custom Billing Line */}
          {credits?.billingLine && (
            <p className="text-[0.5rem] uppercase tracking-widest text-center mt-2 border-t border-white/10 pt-2 w-full text-white/50 px-4 line-clamp-2">
              {credits.billingLine}
            </p>
          )}

          {/* Theatrical Branding */}
          <div className="flex items-center gap-3 mt-3 opacity-60">
             <div className="h-px w-6 bg-white/10" />
             <span className="font-serif italic text-[0.6rem] tracking-[0.3em] uppercase whitespace-nowrap text-amber-200/80">
                Chronicle Cinema Release
             </span>
             <div className="h-px w-6 bg-white/10" />
          </div>
        </div>
      </div>

      {/* Decorative Border Glow */}
      <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none group-hover:border-white/10 transition-colors" />
    </div>
  );
}

export default CinemaPoster;
