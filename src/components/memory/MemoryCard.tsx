"use client";

import type { Memory, MediaAttachment } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { CalendarDays, Edit3, Trash2, Share2, Video, Mic, Heart, Eye, Layers, MapPin, Archive, CheckSquare } from 'lucide-react';
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
  onToggleLegacyStatus?: (memoryId: string) => void;
  isUnread?: boolean;
  onMarkAsViewed?: (memoryId: string) => void;
}

export function MemoryCard({ memory, onEdit, onDelete, onToggleLegacyStatus, isUnread, onMarkAsViewed }: MemoryCardProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const primaryMedia = useMemo(() => memory.mediaAttachments?.[0], [memory.mediaAttachments]);

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
    <>
      <Card className="flex flex-col overflow-hidden shadow-lg transition-all hover:shadow-xl animate-fade-in h-full relative border-muted/60">
        {isUnread && (
          <Badge variant="default" className="absolute top-2 right-2 z-20 bg-primary text-primary-foreground animate-pulse shadow-md">
            <Eye className="h-3 w-3 mr-1" /> New
          </Badge>
        )}

        <div className="relative w-full overflow-hidden bg-muted group">
          {primaryMedia?.type === 'video' ? (
            <div className="relative aspect-video bg-black flex flex-col">
              <video 
                ref={videoRef} 
                src={primaryMedia.url} 
                controls 
                className="w-full h-full object-contain" 
                preload="metadata" 
              />
              {primaryMedia.duration && (
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
            <div className="p-4 bg-muted/50">
              <audio ref={audioRef} src={primaryMedia.url} controls className="w-full" />
              {primaryMedia.duration && (
                <div className="mt-2 rounded-full overflow-hidden">
                   <TrimProgressIndicator 
                    trimStart={primaryMedia.trimStart || 0} 
                    trimEnd={primaryMedia.trimEnd || primaryMedia.duration} 
                    duration={primaryMedia.duration} 
                  />
                </div>
              )}
            </div>
          ) : memory.imageUrl ? (
            <div className="relative h-48 w-full">
              <Image src={memory.imageUrl} alt={memory.title} fill className="object-cover" />
            </div>
          ) : (
             <div className="h-48 w-full flex items-center justify-center bg-secondary/20">
                <Layers className="h-12 w-12 text-muted-foreground/30" />
             </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="font-headline text-xl line-clamp-1">{memory.title}</CardTitle>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarDays className="mr-1.5 h-3 w-3" />
              {format(new Date(memory.date), 'PPP', { locale: enGB })}
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
                {isTrimmed && <span className="ml-1 text-[9px] text-primary italic">(Edited Clip)</span>}
              </Badge>
            )}
            {memory.emotionTags?.map((tag) => (
              <Badge variant="outline" key={tag} className="text-[10px] h-5 border border-transparent hover:border-primary/20">
                <Heart className="h-2.5 w-2.5 mr-1 text-primary/70" />
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-2 border-t border-muted/40">
          <div>
             {onToggleLegacyStatus && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleLegacyStatus(memory.id)}>
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
                </TooltipProvider>
             )}
          </div>

          <div className="flex items-center gap-1">
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit?.(memory)}>
                      <Edit3 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Edit Memory</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowShareDialog(true)}>
                      <Share2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Share</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this memory?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove "{memory.title}" from your timeline. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete?.(memory.id)}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          </div>
        </CardFooter>
      </Card>

      {showShareDialog && (
        <ShareDialog 
          memory={memory} 
          onClose={() => setShowShareDialog(false)} 
        />
      )}
    </>
  );
}
