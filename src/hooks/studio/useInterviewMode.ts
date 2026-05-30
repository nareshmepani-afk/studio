'use client';

import { useState, useCallback } from 'react';

export function useInterviewMode(initialMode: 'scripted' | 'interview' = 'scripted') {
  const [modalityMode, setModalityMode] = useState<'scripted' | 'interview'>(initialMode);
  const [activeBeatIndex, setActiveBeatIndex] = useState(0);

  const toggleModalityMode = useCallback(() => {
    setModalityMode(prev => (prev === 'scripted' ? 'interview' : 'scripted'));
  }, []);

  const triggerNextCue = useCallback((container: HTMLDivElement | null) => {
    if (!container) return;

    // Find all readable block-level elements inside the scrolling prompter
    const blocks = Array.from(container.querySelectorAll('p, blockquote, h1, h2, h3, li, div.prose-block'));
    if (blocks.length === 0) return;

    // Find the next block that is currently below the active reading zone (the middle of the container)
    const containerCenter = container.scrollTop + container.clientHeight / 2;
    
    let nextBlockIndex = blocks.findIndex((block: any) => block.offsetTop > containerCenter);

    // If no block is below the center, fallback to wrapping or staying at the last one
    if (nextBlockIndex === -1) {
      nextBlockIndex = 0;
    }

    const nextBlock = blocks[nextBlockIndex] as HTMLElement;
    if (nextBlock) {
      // Calculate target ScrollTop to bring this block into the exact center of the Reading Zone
      const targetScrollTop = nextBlock.offsetTop - (container.clientHeight / 2) + (nextBlock.clientHeight / 2);
      const finalScrollTop = Math.max(0, targetScrollTop);
      
      // Upgrade to custom Framer Motion animate spring transition for a premium smooth vertical slide, with standard scroll in tests
      if (process.env.NODE_ENV === 'test') {
        container.scrollTo({
          top: finalScrollTop,
          behavior: 'smooth'
        });
      } else {
        import('framer-motion')
          .then(({ animate }) => {
            animate(container.scrollTop, finalScrollTop, {
              type: 'spring',
              stiffness: 90,
              damping: 18,
              mass: 0.8,
              onUpdate: (value) => {
                if (container) container.scrollTop = value;
              }
            });
          })
          .catch(() => {
            container.scrollTo({
              top: finalScrollTop,
              behavior: 'smooth'
            });
          });
      }
      
      setActiveBeatIndex(nextBlockIndex);
      
      // Trigger a custom event to notify the BeatSheet of the active beat index
      window.dispatchEvent(new CustomEvent('active-beat-changed', { detail: { index: nextBlockIndex } }));
    }
  }, []);

  return {
    modalityMode,
    setModalityMode,
    toggleModalityMode,
    triggerNextCue,
    activeBeatIndex,
    setActiveBeatIndex
  };
}
