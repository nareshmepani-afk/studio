"use client";

import type { Memory, MediaAttachment } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, X } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { CalendarDays, Edit3, Trash2, Share2, Video, Mic, Heart, Eye, Layers, MapPin, Archive, CheckSquare, Film } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShareDialog } from './ShareDialog';
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CinemaPoster from './CinemaPoster';

function TrimProgressIndicator({ trimStart, trimEnd, duration }: { trimStart: number; trimEnd: number; duration: number }) {
  const startPct = (trimStart / duration) * 100;
  const endPct = 100 - (trimEnd / duration) * 100;

  return (
    <div className="w-full h-1 bg-black/40 relative flex overflow-hidden">
      <div style={{ width: `${startPct}%` }} className="h-full bg-slate-500/40" />
      <div className="flex-grow h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
      <div style={{ width: `${endPct}%` }} className="h-full bg-slate-500/40" />
    </div>
  );
}

interface MemoryCardProps {
  memory: Memory;
  onEdit?: (memory: Memory) => void;
  onDelete?: (memoryId: string) => void;
  onUnpublish?: (memoryId: string) => void;
  onToggleLegacyStatus?: (memoryId: string) => void;
  isUnread?: boolean;
  onMarkAsViewed?: (memoryId: string) => void;
  onView?: () => void;
}

/**
 * Safely converts various date-like values (Strings, Numbers, Firestore Timestamps)
 * into a valid JavaScript Date object.
 */
function parseSafeDate(dateVal: any): Date | null {
  if (!dateVal) return null;

  // Handle Firestore Timestamps
  if (dateVal && typeof dateVal.toDate === 'function') {
    return dateVal.toDate();
  }

  // Handle objects that look like Timestamps but lost their methods (e.g. from SSR/JSON)
  if (dateVal && typeof dateVal.seconds === 'number') {
    return new Date(dateVal.seconds * 1000 + (dateVal.nanoseconds || 0) / 1000000);
  }

  // If it's already a Date object
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }

  // Handle strings or numbers
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    return d;
  }

  // Final attempt: if it's a string that might be dd-mm-yyyy or similar non-standard format
  // that new Date() failed on, but could be important. 
  // For now, we return null to fall back to other fields.
  
  return null;
}

export function MemoryCard({ memory, onEdit, onDelete, onUnpublish, onToggleLegacyStatus, isUnread, onMarkAsViewed, onView }: MemoryCardProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const primaryMedia = useMemo(() => {
    // Priority 1: videoUrl (Studio recordings) - Use a synthetic media object
    if (memory.videoUrl) {
      return {
        url: memory.videoUrl,
        type: 'video',
        thumbnailUrl: memory.imageUrl, // Map existing image as poster
        duration: 0 // Placeholder
      } as MediaAttachment;
    }
    // Priority 2: mediaAttachments (Legacy/Standard uploads)
    if (memory.mediaAttachments && memory.mediaAttachments.length > 0) {
      return memory.mediaAttachments[0];
    }
    return null;
  }, [memory.mediaAttachments, memory.videoUrl, memory.imageUrl]);

  useEffect(() => {
    if (isUnread && onMarkAsViewed) {
      onMarkAsViewed(memory.id);
    }
  }, [isUnread, onMarkAsViewed, memory.id]);

  useEffect(() => {
    const mediaElement = videoRef.current || audioRef.current;
    if (!mediaElement || !primaryMedia) return;

    const start = primaryMedia.trimStart || 0;
    const end = primaryMedia.trimEnd || primaryMedia.duration || 0;

    const handleLoadedMetadata = () => {
      mediaElement.currentTime = start;
    };

    const handleTimeUpdate = () => {
      if (mediaElement.currentTime >= end) {
        mediaElement.pause();
        mediaElement.currentTime = start;
      }
      if (mediaElement.currentTime < start - 0.5) {
        mediaElement.currentTime = start;
      }
    };

    const handlePlay = () => {
      if (mediaElement.currentTime < start || mediaElement.currentTime >= end) {
        mediaElement.currentTime = start;
      }
    };

    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('play', handlePlay);

    if (mediaElement.readyState >= 1) {
      mediaElement.currentTime = start;
    }

    return () => {
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('play', handlePlay);
    };
  }, [primaryMedia?.url, primaryMedia?.trimStart, primaryMedia?.trimEnd, primaryMedia?.duration]);

  const locationString = [memory.location, memory.country].filter(Boolean).join(', ');
  const isTrimmed = primaryMedia && primaryMedia.duration && 
    ((primaryMedia.trimStart || 0) > 0 || (primaryMedia.trimEnd || primaryMedia.duration) < primaryMedia.duration);

  return (
    <TooltipProvider delayDuration={400}>
      <Card 
        onClick={onView}
        className="flex flex-col overflow-hidden shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1 animate-fade-in h-full relative border-muted/60 group cursor-pointer"
      >
        {!!isUnread && (
          <Badge variant="default" className="absolute top-2 right-2 z-20 bg-primary text-primary-foreground animate-pulse shadow-md">
            <Eye className="h-3 w-3 mr-1" /> New
          </Badge>
        )}

        <div className="relative w-full overflow-hidden bg-muted group">
          {memory.usePoster ? (
             <CinemaPoster memory={memory} className="border-0 rounded-none w-full" />
          ) : primaryMedia?.type === 'video' ? (
            <div className="relative aspect-video bg-slate-900 flex flex-col group/video">
              <video 
                ref={videoRef} 
                src={primaryMedia.url} 
                poster={primaryMedia.thumbnailUrl || memory.imageUrl}
                className="w-full h-full object-cover opacity-90 group-hover/video:opacity-100 transition-opacity" 
                preload="metadata" 
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-black/40 group-hover/video:bg-black/10 transition-colors flex items-center justify-center">
                 <div className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 opacity-0 group-hover/video:opacity-100 transition-all scale-90 group-hover/video:scale-100 shadow-xl">
                    <Maximize2 className="w-6 h-6 text-white" />
                 </div>
              </div>
              {!!primaryMedia.duration && (
                <div className="absolute bottom-0 left-0 right-0 z-10">
                  <TrimProgressIndicator 
                    trimStart={primaryMedia.trimStart || 0} 
                    trimEnd={primaryMedia.trimEnd || primaryMedia.duration} 
                    duration={primaryMedia.duration} 
                  />
                </div>
              )}
            </div>
          ) : primaryMedia?.type === 'audio' ? (
            <div className="p-6 bg-slate-900/50 border-b border-white/5">
              <audio ref={audioRef} src={primaryMedia.url} controls className="w-full h-8" />
              {!!primaryMedia.duration && (
                <div className="mt-4 rounded-full overflow-hidden">
                   <TrimProgressIndicator 
                    trimStart={primaryMedia.trimStart || 0} 
                    trimEnd={primaryMedia.trimEnd || primaryMedia.duration} 
                    duration={primaryMedia.duration} 
                  />
                </div>
              )}
            </div>
          ) : memory.imageUrl || primaryMedia?.type === 'image' ? (
            <div className="relative aspect-video w-full bg-slate-900">
              <Image 
                src={memory.imageUrl || primaryMedia?.url || ''} 
                alt={memory.title} 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
             <div className="aspect-video w-full flex flex-col items-center justify-center bg-slate-900 border-b border-white/5">
                <div className="p-4 rounded-full bg-white/5 mb-3">
                  <Film className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">No Preview Available</span>
             </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="font-headline text-xl line-clamp-1">{memory.title}</CardTitle>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center text-xs text-muted-foreground font-medium">
              <CalendarDays className="mr-1.5 h-3 w-3 text-primary/70" />
              {(() => {
                const { dateComponents } = memory;
                
                // If we have explicit components, use them for partial display
                if (dateComponents && (dateComponents.year || dateComponents.month || dateComponents.day)) {
                  const day = dateComponents.day && dateComponents.day !== 'none' ? dateComponents.day : '';
                  const month = dateComponents.month && dateComponents.month !== 'none' ? dateComponents.month : '';
                  const year = dateComponents.year && dateComponents.year !== 'none' ? dateComponents.year : '';
                  
                  if (day && month && year) {
                    // Try full formatting for precision
                    try {
                      // Note: date-fns format expects a Date object
                      const d = new Date(`${month} ${day}, ${year}`);
                      if (!isNaN(d.getTime())) return format(d, 'PPP', { locale: enGB });
                    } catch (e) {}
                    return `${day} ${month} ${year}`;
                  }
                  
                  if (month && year) return `${month} ${year}`;
                  if (year) return year;
                  if (month) return month;
                }

                // Fallback to existing logic for legacy string dates
                const date = parseSafeDate(memory.date);
                const createdAt = parseSafeDate(memory.createdAt);
                const displayDate = date || createdAt;
                
                return displayDate 
                  ? format(displayDate, 'PPP', { locale: enGB }) 
                  : 'Date unknown';
              })()}
            </div>
            {locationString && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="mr-1.5 h-3 w-3" />
                {locationString}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-grow pb-4">
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {memory.description}
          </p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {memory.category && (
              <Badge variant="secondary" className="text-[10px] h-5 bg-secondary/50">
                <Layers className="h-2.5 w-2.5 mr-1" />
                {typeof memory.category === 'string' ? memory.category : memory.category.label}
              </Badge>
            )}
            {primaryMedia && (
              <Badge variant="outline" className="text-[10px] h-5 border-primary/20 bg-primary/5">
                {primaryMedia.type === 'video' ? <Video className="h-2.5 w-2.5 mr-1" /> : <Mic className="h-2.5 w-2.5 mr-1" />}
                {primaryMedia.type.charAt(0).toUpperCase() + primaryMedia.type.slice(1)}
                {!!isTrimmed && <span className="ml-1 text-[9px] text-primary italic">(Edited Clip)</span>}
              </Badge>
            )}
            {memory.emotionTags?.map((tag, idx) => (
              <Badge variant="outline" key={`${tag}-${idx}`} className="text-[10px] h-5 border border-transparent hover:border-primary/20">
                <Heart className="h-2.5 w-2.5 mr-1 text-primary/70" />
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-2 border-t border-muted/40">
          <div>
             {onToggleLegacyStatus && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onToggleLegacyStatus(memory.id); }}>
                      {memory.isLegacy ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Archive className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{memory.isLegacy ? "Remove from Legacy Chest" : "Add to Legacy Chest"}</p>
                  </TooltipContent>
                </Tooltip>
             )}
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit?.(memory); }}>
                  <Edit3 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Edit Memory</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2.5 text-primary hover:bg-primary/10 gap-1" onClick={(e) => { e.stopPropagation(); onView?.(); }}>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Watch</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Watch Premiere</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setShowShareDialog(true); }}>
                  <Share2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Share</p></TooltipContent>
            </Tooltip>

            {(onUnpublish || onDelete) && (
              <Tooltip>
                <AlertDialog>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        {onUnpublish ? (
                          <Archive className="h-4 w-4 text-muted-foreground hover:text-amber-500 transition-colors" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{onUnpublish ? "Move to Draft" : "Delete Permanently"}</p>
                  </TooltipContent>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {onUnpublish ? "Move to Draft?" : "Delete this memory?"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {onUnpublish 
                          ? `This will remove "${memory.title}" from the Cinema and return it to your Studio drafts.`
                          : `This will permanently remove "${memory.title}" from your Cinema. This cannot be undone.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onUnpublish ? onUnpublish(memory.id) : onDelete?.(memory.id)}
                        className={onUnpublish 
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"}
                      >
                        {onUnpublish ? "Move to Draft" : "Delete Permanently"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Tooltip>
            )}
          </div>
        </CardFooter>
      </Card>

      {showShareDialog && (
        <ShareDialog 
          memory={memory} 
          onClose={() => setShowShareDialog(false)} 
        />
      )}
    </TooltipProvider>
  );
}
