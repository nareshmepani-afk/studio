'use client';

import React, { useRef, useEffect } from 'react';
import { useStudioState } from '@/hooks/studio/useStudioState';
import { cn } from '@/lib/utils';

export const Teleprompter = () => {
  const { script, isScrolling, scrollSpeed, fontSize, isMirrored } = useStudioState();
  const prompterRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const speedRef = useRef(0);

  useEffect(() => {
    const prompter = prompterRef.current;
    const decelerationFactor = 0.97; // Controls how quickly it slows down

    const scrollLoop = () => {
      if (!prompter) return;

      if (isScrolling) {
        // Smoothly accelerate to the target speed
        const targetSpeed = scrollSpeed / 10;
        speedRef.current += (targetSpeed - speedRef.current) * 0.1; // Easing
      } else {
        // Smoothly decelerate to zero
        speedRef.current *= decelerationFactor;
      }

      prompter.scrollTop += speedRef.current;

      // Stop the loop if the speed is negligible and not trying to scroll
      if (Math.abs(speedRef.current) < 0.01 && !isScrolling) {
        speedRef.current = 0;
        return; // End the animation loop
      }

      animationFrameIdRef.current = requestAnimationFrame(scrollLoop);
    };

    // When isScrolling or scrollSpeed changes, we might need to kickstart the animation
    if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
    }
    animationFrameIdRef.current = requestAnimationFrame(scrollLoop);


    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isScrolling, scrollSpeed]);


  return (
    <div
      className="bg-studio-black/70 backdrop-blur-md text-studio-text p-6 rounded-lg overflow-hidden h-full border border-studio-border"
    >
      <div 
        ref={prompterRef}
        className="overflow-y-auto h-full scrollbar-hide"
      >
        <p
          className={cn(
            'font-prompter whitespace-pre-wrap leading-relaxed',
            { 'scale-x-[-1]': isMirrored }
          )}
          style={{ 
              transition: 'font-size 0.3s, transform 0.3s',
              fontSize: `${fontSize}px`
          }}
        >
          {script}
        </p>
      </div>
    </div>
  );
};
