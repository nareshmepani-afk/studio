'use client';

import { Studio } from '@/components/studio/Studio';
import { StudioProvider } from '@/hooks/studio/useStudioState';

const AddMemoryPage = () => {
  return (
    <StudioProvider>
      <div className="w-full h-screen bg-black">
        <Studio />
      </div>
    </StudioProvider>
  );
};

export default AddMemoryPage;
