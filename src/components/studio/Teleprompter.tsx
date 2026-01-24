'use client';

import React, { useRef, useEffect } from 'react';

interface TeleprompterProps {
  script: string;
  isScrolling: boolean;
  scrollSpeed: number;
  fontSize: number;
}

export const Teleprompter: React.FC<TeleprompterProps> = ({ script, isScrolling, scrollSpeed, fontSize }) => {
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
      className="bg-black/70 backdrop-blur-md text-white p-6 rounded-lg overflow-hidden h-96 border border-white/20"
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="overflow-y-auto h-full scrollbar-hide">
        <p className="font-serif whitespace-pre-wrap leading-relaxed" style={{ transition: 'font-size 0.3s' }}>
          {script}
        </p>
      </div>
    </div>
  );
};
