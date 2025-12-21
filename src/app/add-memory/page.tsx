import { MemoryForm } from '@/components/memory/MemoryForm';
import { getMemoryById } from '@/actions/memoryActions';
import type { Memory } from '@/types';

// Define the async props for Next.js 15
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AddMemoryPage({ searchParams }: PageProps) {
  // 1. MUST await searchParams in Next.js 15
  const resolvedParams = await searchParams;
  const editMemoryId = resolvedParams.editMemoryId as string | undefined;
  const promptId = resolvedParams.promptId as string | undefined;
  const promptText = resolvedParams.prompt as string | undefined;

  let memoryToEdit: Memory | null = null;

  // 2. Fetch memory data if we are in edit mode
  if (editMemoryId) {
    console.log(`[SERVER] Fetching memory: ${editMemoryId}`);
    const result = await getMemoryById(editMemoryId);
    if (result.success && result.data) {
      memoryToEdit = result.data;
    } else {
      // The action itself will log the detailed error
      console.error(`[Page] Failed to fetch memory ${editMemoryId}:`, result.message);
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-8 text-center text-primary">
        {editMemoryId ? 'Edit Your Memory' : 'Create a New Memory'}
      </h1>
      
      <MemoryForm 
        memoryToEdit={memoryToEdit}
        promptId={promptId}
        initialCustomPrompt={promptText}
      />
    </main>
  );
}
