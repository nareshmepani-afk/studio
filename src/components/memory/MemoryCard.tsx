
"use client";

import type { Memory, MediaAttachment, EmotionTag } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { CalendarDays, Edit3, Trash2, Share2, Video, Mic, Heart } from 'lucide-react'; // Added Heart for emotion tags
import { Badge } from '@/components/ui/badge';
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
import { useState, useRef, useEffect } from 'react';

interface MemoryCardProps {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onDelete: (memoryId: string) => void;
}

export function MemoryCard({ memory, onEdit, onDelete }: MemoryCardProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const primaryMedia = memory.mediaAttachments?.[0];

  useEffect(() => {
    const mediaElement = videoRef.current || audioRef.current;
    if (mediaElement && primaryMedia) {
      const { startTime, endTime } = primaryMedia;

      const handleLoadedMetadata = () => {
        if (startTime !== undefined && isFinite(startTime)) {
          mediaElement.currentTime = startTime;
        }
      };

      const handleTimeUpdate = () => {
        if (endTime !== undefined && isFinite(endTime) && mediaElement.currentTime >= endTime) {
          mediaElement.pause();
           if (startTime !== undefined && isFinite(startTime)) {
            mediaElement.currentTime = startTime;
          }
        }
      };
      
      const handlePlay = () => {
        if (startTime !== undefined && isFinite(startTime) && mediaElement.currentTime < startTime) {
            mediaElement.currentTime = startTime;
        }
        if (endTime !== undefined && isFinite(endTime) && mediaElement.currentTime > endTime) {
             if (startTime !== undefined && isFinite(startTime)) {
                mediaElement.currentTime = startTime;
             } else {
                mediaElement.currentTime = 0; 
             }
        }
      };

      mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.addEventListener('timeupdate', handleTimeUpdate);
      mediaElement.addEventListener('play', handlePlay);

      if (mediaElement.readyState >= 1 && startTime !== undefined && isFinite(startTime)) { 
         mediaElement.currentTime = startTime;
      }


      return () => {
        mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
        mediaElement.removeEventListener('play', handlePlay);
      };
    }
  }, [primaryMedia]);

  return (
    <>
      <Card className="flex flex-col overflow-hidden shadow-lg transition-all hover:shadow-xl animate-fade-in h-full">
        {primaryMedia && primaryMedia.type === 'video' && primaryMedia.url && (
          <div className="relative w-full aspect-video bg-muted">
            <video ref={videoRef} src={primaryMedia.url} controls className="w-full h-full object-cover" preload="metadata" />
          </div>
        )}
        {primaryMedia && primaryMedia.type === 'audio' && primaryMedia.url && (
          <div className="p-4 bg-muted">
            <audio ref={audioRef} src={primaryMedia.url} controls className="w-full" preload="metadata" />
          </div>
        )}
        {!primaryMedia && memory.imageUrl && (
          <div className="relative w-full h-48">
            <Image
              src={memory.imageUrl}
              alt={memory.title}
              layout="fill"
              objectFit="cover"
              data-ai-hint="memory moment"
            />
          </div>
        )}
        
        <CardHeader>
          <CardTitle className="font-headline text-xl">{memory.title}</CardTitle>
          <div className="flex items-center text-xs text-muted-foreground pt-1">
            <CalendarDays className="mr-1.5 h-3 w-3" />
            {format(new Date(memory.date), 'PPP', { locale: enGB })}
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">{memory.description}</p>
          
          {(memory.mediaAttachments && memory.mediaAttachments.length > 0) || (memory.emotionTags && memory.emotionTags.length > 0) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {memory.mediaAttachments?.map((item) => (
                <Badge variant="secondary" key={item.id} className="text-xs">
                  {item.type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <Mic className="h-3 w-3 mr-1" />}
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  {item.startTime !== undefined && item.endTime !== undefined && item.duration && Math.abs(item.duration - (item.endTime - item.startTime)) > 1 && (
                     <span className="ml-1">(Trimmed)</span>
                  )}
                </Badge>
              ))}
              {memory.emotionTags?.map((tag) => (
                <Badge variant="outline" key={tag} className="text-xs">
                  <Heart className="h-3 w-3 mr-1 text-primary/70" />
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

        </CardContent>
        <CardFooter className="flex justify-between items-center pt-4">
          {/* Placeholder for potential future primary badge if needed, or remove entirely */}
          <div></div> 
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(memory)} aria-label="Edit memory">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowShareDialog(true)} aria-label="Share memory">
              <Share2 className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Delete memory">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this memory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(memory.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardFooter>
      </Card>
      {showShareDialog && <ShareDialog memory={memory} onClose={() => setShowShareDialog(false)} />}
    </>
  );
}
