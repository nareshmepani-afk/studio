
"use client";

import type { Memory } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { format } from 'date-fns';
import { CalendarDays, Tag, Edit3, Trash2, Share2, Video, Mic } from 'lucide-react';
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
import { ShareDialog } from './ShareDialog'; // To be created
import { useState } from 'react';

interface MemoryCardProps {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onDelete: (memoryId: string) => void;
}

export function MemoryCard({ memory, onEdit, onDelete }: MemoryCardProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  return (
    <>
      <Card className="flex flex-col overflow-hidden shadow-lg transition-all hover:shadow-xl animate-fade-in h-full">
        {memory.imageUrl && (
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
            {format(new Date(memory.date), 'PPP')}
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">{memory.description}</p>
          {memory.media && memory.media.length > 0 && (
            <div className="mt-2 flex space-x-2">
              {memory.media.map((item, index) => (
                <Badge variant="secondary" key={index} className="text-xs">
                  {item.type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <Mic className="h-3 w-3 mr-1" />}
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Badge variant="outline" className="flex items-center">
            <Tag className="mr-1.5 h-3 w-3" />
            {memory.category}
          </Badge>
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
