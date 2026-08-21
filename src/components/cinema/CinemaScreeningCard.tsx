'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Memory } from '@/types';
import { Film, Play, Clapperboard, Users, Cast, Share2, Sparkles, Mail, ShieldCheck } from 'lucide-react';
import { CinemaPoster } from '@/components/memory/CinemaPoster';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CinemaScreeningCardProps {
  memory: Memory;
  isOwner: boolean;
  ownerDisplayName?: string;
  ownerEmail?: string;
  onView: () => void;
  onTvPlay?: () => void;
  onShare?: () => void;
  onManageAccess?: () => void;
}

export function CinemaScreeningCard({
  memory,
  isOwner,
  ownerDisplayName,
  ownerEmail,
  onView,
  onTvPlay,
  onShare,
  onManageAccess,
}: CinemaScreeningCardProps) {
  const sharedCount = Array.isArray((memory as any).sharedWith) ? (memory as any).sharedWith.length : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="group relative aspect-[2/3] w-full rounded-2xl overflow-hidden cursor-pointer shadow-2xl hover:shadow-[0_0_40px_rgba(245,158,11,0.25)] transition-all duration-300 border border-white/10 hover:border-amber-400/40"
      onClick={onView}
    >
      {/* 1. Underlying Theatrical Film Poster (Identical to Studio Act V Showcase) */}
      <CinemaPoster memory={memory} className="w-full h-full border-0 rounded-2xl pointer-events-none" />

      {/* 2. Top Header Badges Bar (Status & Ownership Attribution) */}
      <div className="absolute top-3.5 inset-x-3.5 z-30 flex items-center justify-between gap-2 pointer-events-auto">
        
        {/* Left: Status Badge with Rich Tooltip */}
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="shrink-0 cursor-help">
                {memory.status === 'published' ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 backdrop-blur-md shadow-lg">
                    <Film className="w-3 h-3 text-emerald-400" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider">Premiere</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-950/90 border border-violet-500/40 text-violet-300 backdrop-blur-md shadow-lg">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                      {isOwner ? 'Pre-Release' : 'Private Screener'}
                    </span>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-950/95 border border-white/10 p-2.5 text-xs text-white max-w-xs shadow-2xl z-[10000] rounded-xl font-mono">
              {memory.status === 'published' ? (
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">🎬 Official Premiere</p>
                  <p className="text-[9px] text-white/70">Published and streaming in the Memory Cinema.</p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-0.5">🌟 Private Screener</p>
                  <p className="text-[9px] text-white/70">
                    {isOwner 
                      ? 'Pre-Release screener. Share with family to gather feedback before publishing.' 
                      : 'Shared privately with you for preview and feedback before official premiere.'}
                  </p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Right: Ownership & Attribution Badge with Email Tooltip */}
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          {isOwner ? (
            <>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-500/40 text-amber-300 backdrop-blur-md shadow-lg shrink-0 cursor-help">
                      <Clapperboard className="w-2.5 h-2.5 text-amber-400" />
                      <span className="font-mono text-[8px] font-bold uppercase tracking-wider">My Production</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-slate-950/95 border border-white/10 p-2 text-xs text-white shadow-2xl z-[10000] rounded-xl font-mono">
                    <p className="text-[9px] text-amber-300 font-bold uppercase tracking-wider">Your Story Production</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {onManageAccess && (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onManageAccess();
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-md text-[8px] font-mono font-bold uppercase tracking-wider transition-all shadow-lg pointer-events-auto cursor-pointer active:scale-95 shrink-0 ${
                          sharedCount > 0
                            ? 'bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 hover:border-cyan-400'
                            : 'bg-slate-900/90 border border-white/20 text-white/70 hover:text-amber-300 hover:border-amber-400/50 hover:bg-slate-900'
                        }`}
                      >
                        <Users className="w-2.5 h-2.5" />
                        <span>{sharedCount > 0 ? sharedCount : 'Share'}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-slate-950/95 border border-white/10 p-2 text-xs text-white shadow-2xl z-[10000] rounded-xl font-mono">
                      <p className="text-[9px] text-white/80">
                        {sharedCount > 0 ? `Shared with ${sharedCount} collaborator${sharedCount === 1 ? '' : 's'}. Click to manage access.` : 'Click to share with family & collaborators.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          ) : (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 backdrop-blur-md shadow-lg max-w-[150px] truncate cursor-help">
                    <Users className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider truncate">
                      {ownerDisplayName ? `From ${ownerDisplayName}` : 'Shared'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-slate-950/95 border border-cyan-500/30 p-3 text-xs text-white max-w-xs shadow-2xl z-[10000] rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5" />
                    <span>Story Director & Author</span>
                  </div>
                  <p className="font-bold text-white text-xs">
                    {ownerDisplayName || 'Memory Weaver Director'}
                  </p>
                  {ownerEmail ? (
                    <div className="flex items-center gap-1.5 text-amber-300/90 font-mono text-[10px]">
                      <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{ownerEmail}</span>
                    </div>
                  ) : null}
                  <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-white/50">
                    <span>Access: Collaborator</span>
                    <span className="text-violet-300 capitalize">{memory.status || 'pre-release'}</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* 3. Hover Play Overlay */}
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-950/60 backdrop-blur-sm transition-all duration-300">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.6)] transform scale-90 group-hover:scale-100 transition-transform duration-300">
          <Play className="w-7 h-7 fill-current text-slate-950 ml-1" />
        </div>
        <span className="mt-4 font-mono text-[11px] font-black text-amber-300 uppercase tracking-[0.25em] drop-shadow-md">
          Watch Premiere
        </span>
      </div>

      {/* 4. Quick Action Icons - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-50 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {onTvPlay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTvPlay();
            }}
            className="p-2.5 rounded-full bg-slate-900/90 border border-white/20 text-white hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 backdrop-blur-md transition-all shadow-lg pointer-events-auto cursor-pointer active:scale-95"
            title="Cast to Living Room TV"
          >
            <Cast className="w-4 h-4" />
          </button>
        )}
        {onManageAccess ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onManageAccess();
            }}
            className="p-2.5 rounded-full bg-slate-900/90 border border-white/20 text-white hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 backdrop-blur-md transition-all shadow-lg pointer-events-auto cursor-pointer active:scale-95"
            title={sharedCount > 0 ? `Manage Access (${sharedCount} Collaborators)` : 'Share Story Link'}
          >
            <Users className="w-4 h-4" />
          </button>
        ) : onShare ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="p-2.5 rounded-full bg-slate-900/90 border border-white/20 text-white hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 backdrop-blur-md transition-all shadow-lg pointer-events-auto cursor-pointer active:scale-95"
            title="Share Screener Link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

export default CinemaScreeningCard;
