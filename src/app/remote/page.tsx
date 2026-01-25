'use client';

import { RemoteControl } from "@/components/studio/remote/RemoteControl";
import { StudioProvider } from "@/hooks/studio/useStudioState";

const RemotePage = () => {
  return (
    <StudioProvider>
      <main className="w-full h-screen bg-studio-black p-4">
        <h1 className="text-2xl font-bold text-center text-white mb-4">Remote Control</h1>
        <RemoteControl />
      </main>
    </StudioProvider>
  )
}

export default RemotePage;
