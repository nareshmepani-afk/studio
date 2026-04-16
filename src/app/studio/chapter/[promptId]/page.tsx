import { mockPrompts } from '@/lib/mockData';
import { storyScripts } from '@/lib/storyScripts';
import { notFound } from 'next/navigation';
import { Prompt } from '@/types';
import StudioChapterContent from '@/components/studio/StudioChapterContent';

export default async function StudioChapterPage({ params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;

  const prompt = mockPrompts.find(p => p.id === promptId);

  if (!prompt) {
    notFound();
  }

  // Find the parent prompt if the current one is a sub-prompt, to display the main title
  const parentPrompt = mockPrompts.find(p => p.subPrompts?.some((sp: Prompt) => sp.id === promptId));
  
  const script = storyScripts[prompt.id];

  if (!script) {
    notFound();
  }

  return (
    <StudioChapterContent 
      prompt={prompt} 
      parentPrompt={parentPrompt} 
      script={script} 
    />
  );
}
