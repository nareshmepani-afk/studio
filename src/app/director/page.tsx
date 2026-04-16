'use client';

import { Studio } from '@/components/studio/Studio';
import { StudioProvider } from '@/hooks/studio/useStudioState';

/**
 * @fileoverview
 * The Director's Soundstage.
 * This is the primary entry point for live production sessions.
 */
const DirectorPage = () => {
  return (
    <StudioProvider>
      <div className="w-full h-screen bg-black">
        {/* The Director role controls the Story Script and production flow */}
        <Studio role="director" />
      </div>
    </StudioProvider>
  );
};

export default DirectorPage;
