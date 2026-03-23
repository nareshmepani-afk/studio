'use client';

/**
 * @fileOverview The entry point for the memory recording session.
 * It wraps the Studio component with the necessary state provider.
 * This version is simplified to avoid module resolution errors.
 */

import { Studio } from '@/components/studio/Studio';
import { StudioProvider } from '@/hooks/studio/useStudioState';

const AddMemoryPage = () => {
  return (
    <StudioProvider>
      <div className="w-full h-screen bg-black">
        <Studio role="Storyteller" />
      </div>
    </StudioProvider>
  );
};

export default AddMemoryPage;
