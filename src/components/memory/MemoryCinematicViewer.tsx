'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, MapPin, Heart, Share2, Download, Maximize2, Layers } from 'lucide-react';
import type { Memory } from '@/types';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface MemoryCinematicViewerProps {
  memory: Memory | null;
  onClose: () => void;
}

export function MemoryCinematicViewer({ memory, onClose }: MemoryCinematicViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!memory) return null;

  const primaryMedia = memory.mediaAttachments?.[0];
  const locationString = [memory.location, memory.country].filter(Boolean).join(', ');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 md:p-8"
      >
        {/* Backdrop Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[100px] rounded-full" />
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-7xl h-full max-h-[90vh] bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col xl:flex-row"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10 hover:scale-110 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Media Section (Left/Top) */}
          <div className="w-full xl:w-2/3 h-[50vh] xl:h-full bg-black relative group flex items-center justify-center">
            {primaryMedia?.type === 'video' ? (
              <video
                ref={videoRef}
                src={primaryMedia.url}
                controls
                className="w-full h-full object-contain"
                preload="auto"
                autoPlay={false} // Verified: No auto-play
              />
            ) : primaryMedia?.type === 'audio' ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-slate-900 to-black">
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 animate-pulse">
                   <Layers className="w-12 h-12 text-primary" />
                </div>
                <audio src={primaryMedia.url} controls className="w-full max-w-md" />
              </div>
            ) : memory.imageUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={memory.imageUrl}
                  alt={memory.title}
                  fill
                  sizes="(max-width: 1280px) 100vw, 66vw"
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                <Layers className="w-24 h-24 text-white/5" />
              </div>
            )}

            {/* Quick Actions overlay */}
            <div className="absolute bottom-6 left-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
               <Button variant="secondary" size="sm" className="bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20 rounded-full px-4">
                 <Share2 className="w-4 h-4 mr-2" /> Share
               </Button>
               <Button variant="secondary" size="sm" className="bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20 rounded-full px-4">
                 <Download className="w-4 h-4 mr-2" /> Save
               </Button>
            </div>
          </div>

          {/* Narrative Content Section (Right/Bottom) */}
          <div className="w-full xl:w-1/3 h-full overflow-y-auto bg-slate-900/60 backdrop-blur-xl border-l border-white/5 p-8 md:p-10 custom-scrollbar">
            <div className="max-w-xl mx-auto space-y-10">
              
              {/* Header Info */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                   <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-3 py-1 font-bold tracking-wider uppercase text-[10px]">
                     Cinematic Experience
                   </Badge>
                   <h1 className="text-4xl md:text-5xl font-headline leading-tight text-white font-bold mb-4">
                     {memory.title}
                   </h1>
                </motion.div>

                <div className="flex flex-wrap gap-4 text-white/60 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    {(memory.date && !isNaN(new Date(memory.date).getTime()))
                      ? format(new Date(memory.date), 'PPP', { locale: enGB }) 
                      : 'Date Unknown'}
                  </div>
                  {locationString && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {locationString}
                    </div>
                  )}
                </div>
              </div>

              {/* Director's Notepad */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Director's Notes</h3>
                </div>
                
                <div className="relative bg-white/[0.02] border border-white/10 p-6 md:p-8 rounded-2xl shadow-inner group transition-all hover:bg-white/[0.03]">
                   <div className="absolute top-4 left-4 text-6xl text-white/5 font-serif font-black leading-none pointer-events-none group-hover:text-primary/10 transition-colors">"</div>
                   <div className="prose prose-invert prose-slate max-w-none relative z-10 px-2 md:px-4">
                      <p className="text-xl md:text-2xl font-serif leading-relaxed text-slate-200/90 italic">
                        {memory.description}
                      </p>
                   </div>
                </div>
              </div>

              {/* Production Metadata */}
              <div className="space-y-6 pt-10 border-t border-white/5">
                <div className="grid grid-cols-1 gap-6">
                  {memory.emotionTags && memory.emotionTags.length > 0 && (
                     <div>
                       <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-3">Thematic Tones</h4>
                       <div className="flex flex-wrap gap-2 text-white">
                         {memory.emotionTags.map(tag => (
                           <Badge key={tag} variant="outline" className="bg-white/5 border-white/10 hover:border-primary/50 transition-colors py-1.5 px-3 rounded-full text-xs font-medium">
                             <Heart className="w-3 h-3 mr-1.5 text-primary/70" />
                             {tag}
                           </Badge>
                         ))}
                       </div>
                     </div>
                  )}

                  {memory.category && (
                    <div>
                       <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2">Sequence</h4>
                       <span className="text-white font-serif text-lg opacity-80 italic">
                         {typeof memory.category === 'string' ? memory.category : memory.category.label}
                       </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
