'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReviewPage({ params }: any) {
  const videoSrc = `https://storage.googleapis.com/memory-weaver-8rk9t.appspot.com/memories/${params.id}.webm`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-studio-black text-studio-text p-8">
      <h1 className="text-4xl font-bold mb-8">Review & Publish</h1>
      <Card className="w-full max-w-4xl overflow-hidden">
        <video src={videoSrc} controls autoPlay className="w-full" />
      </Card>
      <div className="flex space-x-4 mt-8">
        <Button variant="outline">Discard</Button>
        <Button>Publish</Button>
      </div>
    </div>
  );
}
