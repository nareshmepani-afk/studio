import { mockPrompts } from '@/lib/mockData';
import { teleprompterScripts } from '@/lib/teleprompterScripts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function PromptPage({ params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;

  const prompt = mockPrompts.find(p => p.id === promptId);

  if (!prompt) {
    notFound();
  }

  // Find the parent prompt if the current one is a sub-prompt, to display the main title
  const parentPrompt = mockPrompts.find(p => p.subPrompts?.some(sp => sp.id === promptId));
  const displayPrompt = parentPrompt || prompt;

  const script = teleprompterScripts[prompt.id];

  if (!script) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Link href="/prompts">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Prompts
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{displayPrompt.title}</CardTitle>
          {parentPrompt && <CardDescription>Sub-prompt: {prompt.title}</CardDescription>}
          <CardDescription>{prompt.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-lg max-w-none">
            <h2 className="flex items-center">
              <BookOpen className="mr-2 h-6 w-6" />
              Your Story Script
            </h2>
            {script.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <Link href={`/record?promptId=${promptId}`}>
              <Button size="lg">Start Recording</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
