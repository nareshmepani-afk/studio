import { getMemoryById } from '@/actions/memoryActions';
import { MemoryForm } from '@/components/memory/MemoryForm';

interface AddMemoryPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// This is a Server Component by default
export default async function AddMemoryPage({ searchParams }: AddMemoryPageProps) {
  const editMemoryId = searchParams.editMemoryId as string | undefined;
  const promptId = searchParams.promptId as string | undefined;
  const promptText = searchParams.prompt as string | undefined;

  let memoryToEdit = null;

  if (editMemoryId) {
    const result = await getMemoryById(editMemoryId);
    if (result.success) {
      memoryToEdit = result.data;
    } else {
      // Log the error or handle it as needed. 
      // For now, we'll let the form render in a "new memory" state.
      console.error(`[Page] Failed to fetch memory ${editMemoryId}:`, result.message);
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-headline font-bold mb-8 text-center">
          {editMemoryId ? 'Edit Your Memory' : 'Create a New Memory'}
        </h1>
        
        <MemoryForm 
          memoryToEdit={memoryToEdit}
          promptId={promptId}
          initialCustomPrompt={promptText}
        />
      </div>
    </main>
  );
}