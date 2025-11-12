"use client";
import VideoEditor from '@/components/VideoEditor';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-background">
      <div className="w-full max-w-6xl">
        <VideoEditor />
      </div>
    </main>
  );
}
