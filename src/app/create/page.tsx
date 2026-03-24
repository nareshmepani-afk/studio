'use client';

import { Studio } from '@/components/studio/Studio';
import { StudioProvider } from '@/hooks/studio/useStudioState';

/**
 * @fileoverview
 * This is the primary entry point for the studio session creation.
 * It sets up the main layout and context for the entire application.
 * The Studio component is rendered within a StudioProvider to ensure
 * that all child components have access to the shared state.
 */
const CreatePage = () => {
  return (
    <StudioProvider>
      <div className="w-full h-screen bg-black">
        {/* The `role` prop is essential for determining the user's permissions and capabilities */}
        <Studio role="host" />
      </div>
    </StudioProvider>
  );
};

export default CreatePage;
