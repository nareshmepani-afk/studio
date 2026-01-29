'use client';

import { Studio } from '@/components/studio/Studio';
import { StudioProvider } from '@/hooks/studio/useStudioState';
import { useSearchParams } from 'next/navigation';

const AddMemoryPage = () => {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  if (role === 'remote') {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <h1 className="text-white text-2xl">Remote Control UI</h1>
      </div>
    );
  }

  return (
    <StudioProvider>
      <div className="w-full h-screen bg-black">
        <Studio />
      </div>
    </StudioProvider>
  );
};

export default AddMemoryPage;
