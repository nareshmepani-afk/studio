'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type RoomType = 'solo' | 'collaborative' | 'guest' | 'interview' | 'host' | 'story';

interface PerspectiveWrapperProps {
  activeRoom: RoomType;
  children: React.ReactNode;
}

import { CinematicBackground } from '@/components/ui/CinematicBackground';

const themeMap: Record<RoomType, string> = {
  solo: 'theme-host',
  collaborative: 'theme-storyteller',
  host: 'theme-host',
  story: 'theme-storyteller',
  guest: 'theme-guest',
  interview: 'theme-interviewer',
};

const cinematicThemeMap: Record<RoomType, 'amber' | 'blue' | 'default'> = {
  solo: 'amber',
  collaborative: 'blue',
  host: 'amber',
  story: 'blue',
  guest: 'default',
  interview: 'default',
};

export default function PerspectiveWrapper({ activeRoom, children }: PerspectiveWrapperProps) {
  const themeClass = themeMap[activeRoom];
  const cinematicTheme = cinematicThemeMap[activeRoom];

  // The lens blur and slide animation
  const variants = {
    initial: { opacity: 0, filter: 'blur(10px)', x: 30 },
    animate: { opacity: 1, filter: 'blur(0px)', x: 0 },
    exit: { opacity: 0, filter: 'blur(10px)', x: -30 },
  };

  return (
    <CinematicBackground theme={cinematicTheme} className={themeClass}>
      <div className="transition-colors duration-700 ease-in-out min-h-screen w-full text-[var(--room-text)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRoom}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // very cinematic cubic-bezier
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </CinematicBackground>
  );
}
