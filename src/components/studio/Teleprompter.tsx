'use client';

import React, { useRef, useEffect } from 'react';
import { useStudio } from '@/hooks/studio/useStudio';
import { cn } from '@/lib/utils';

export const Teleprompter = () => {
  const { script, isScrolling, scrollSpeed, fontSize, isMirrored } = useStudio();
  const prompterRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const prompter = prompterRef.current;

    const scroll = () => {
      if (prompter) {
        prompter.scrollTop += scrollSpeed / 10;
        animationFrameIdRef.current = requestAnimationFrame(scroll);
      }
    };

    if (isScrolling) {
      animationFrameIdRef.current = requestAnimationFrame(scroll);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isScrolling, scrollSpeed]);

  return (
    <div
      ref={prompterRef}
      className="bg-studio-black/70 backdrop-blur-md text-white p-6 rounded-lg overflow-hidden h-full border border-white/20"
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="overflow-y-auto h-full scrollbar-hide">
        <p
          className={cn(
            'font-prompter whitespace-pre-wrap leading-relaxed',
            { 'scale-x-[-1]': isMirrored }
          )}
          style={{ transition: 'font-size 0.3s, transform 0.3s' }}
        >
          {script}
        </p>
      </div>
    </div>
  );
};
