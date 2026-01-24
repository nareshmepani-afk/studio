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

  useEffect(() => {
    const prompter = prompterRef.current;
    let animationFrameId: number;

    const scroll = () => {
      if (prompter) {
        prompter.scrollTop += scrollSpeed / 10;
        animationFrameId = requestAnimationFrame(scroll);
      }
    };

    if (isScrolling) {
      animationFrameId = requestAnimationFrame(scroll);
    } else {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
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
