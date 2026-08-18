'use client';

import { motion } from 'framer-motion';
import { Memory } from '@/types';
import { Film, Play, Clapperboard, Users, Tv, Share2, Sparkles, MapPin } from 'lucide-react';
import Image from 'next/image';

interface CinemaScreeningCardProps {
  memory: Memory;
  isOwner: boolean;
  ownerDisplayName?: string;
  ownerEmail?: string;
  onView: () => void;
  onTvPlay?: () => void;
  onShare?: () => void;
}

export function CinemaScreeningCard({
  memory,
  isOwner,
  ownerDisplayName,
  ownerEmail,
  onView,
  onTvPlay,
  onShare,
}: CinemaScreeningCardProps) {
  const bgImage = memory.posterImageUrl || memory.imageUrl;
  
  const title = memory.title || (memory.originalHook ? memory.originalHook.slice(0, 40) : '') || 'Untitled Memory';
  const attribution = isOwner 
    ? `Directed by ${memory.credits?.director || 'You'}`
    : `Shared by ${ownerDisplayName || 'Unknown'}`;
    
  const year = memory.dateComponents?.year || (memory.createdAt ? new Date(memory.createdAt).getFullYear().toString() : '');
  const locationString = [memory.location, memory.country].filter(Boolean).join(', ');

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="group relative aspect-[2/3] w-full rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-shadow duration-300"
      onClick={onView}
    >
      {/* Background */}
      {bgImage ? (
        <Image
          src={bgImage}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center">
          <Film className="w-12 h-12 text-slate-700" />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30 pointer-events-none" />

      {/* Top Left Badge */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {memory.status === 'published' && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/90 text-white backdrop-blur-sm shadow-sm">
            <Film className="w-3 h-3" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider">Premiere</span>
          </div>
        )}
        {memory.status === 'pre-release' && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/90 text-white backdrop-blur-sm shadow-sm">
            <Sparkles className="w-3 h-3" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
              {isOwner ? 'Pre-Release' : 'Private Screener'}
            </span>
          </div>
        )}
      </div>

      {/* Top Right Badge */}
      <div className="absolute top-3 right-3 z-10">
        {isOwner ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-white backdrop-blur-sm shadow-sm">
            <Clapperboard className="w-3 h-3" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider">My Production</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/90 text-white backdrop-blur-sm shadow-sm">
            <Users className="w-3 h-3" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider">Shared</span>
          </div>
        )}
      </div>

      {/* Hover Overlay Center Play */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity duration-300">
        <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.5)] transform scale-90 group-hover:scale-100 transition-transform duration-300">
          <Play className="w-6 h-6 text-primary-foreground ml-1" />
        </div>
        <span className="mt-4 font-mono text-[10px] font-bold text-white uppercase tracking-[0.2em] drop-shadow-md">
          Watch Premiere
        </span>
      </div>

      {/* Bottom Info Strip */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-30 pointer-events-none">
        <h3 className="font-serif italic text-2xl font-bold text-white line-clamp-1 drop-shadow-lg mb-1">
          {title}
        </h3>
        
        <p className="text-white/80 text-xs font-medium drop-shadow-md mb-2">
          {attribution}
        </p>

        <div className="flex items-center gap-3 text-[10px] font-mono text-white/60 uppercase tracking-widest drop-shadow-md">
          {year && <span>{year}</span>}
          {year && locationString && <span className="w-1 h-1 rounded-full bg-white/40" />}
          {locationString && (
            <span className="flex items-center gap-1 line-clamp-1">
              <MapPin className="w-3 h-3" />
              {locationString}
            </span>
          )}
        </div>
      </div>

      {/* Quick Action Icons - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {onTvPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTvPlay();
            }}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-primary hover:text-primary-foreground backdrop-blur-md transition-colors pointer-events-auto"
            title="Play on TV"
          >
            <Tv className="w-4 h-4" />
          </button>
        )}
        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-primary hover:text-primary-foreground backdrop-blur-md transition-colors pointer-events-auto"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
