
import { getMemory } from '@/actions/memoryActions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ReviewPageProps {
  params: { id: string };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const memoryId = params.id;
  const memory = await getMemory(memoryId);

  if (!memory) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="aspect-video w-full">
          {memory.videoUrl ? (
            <video src={memory.videoUrl} controls className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <p className="text-gray-500">No video available.</p>
            </div>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{memory.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{memory.description}</p>
          <div className="flex justify-end">
            <Link href="/timeline">
              <Button size="lg">Done</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
