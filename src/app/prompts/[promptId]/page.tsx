
import { mockPrompts } from '@/lib/mockData';
import { teleprompterScripts } from '@/lib/teleprompterScripts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function PromptPage({ params }: { params: { promptId: string } }) {
  const { promptId } = params;

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
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12 bg-secondary">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
            <Link href="/prompts">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Prompts
                </Button>
            </Link>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center border-b pb-4">
            <div className="inline-flex justify-center items-center mb-4">
                <BookOpen className="h-12 w-12 text-primary" />
            </div>
            {/* Display the main chapter title */}
            <CardTitle className="font-headline text-3xl md:text-4xl">{displayPrompt.text.en}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-2">{displayPrompt.text.gu}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 lg:p-10">
            {/* Display the specific sub-prompt question and its script */}
            <h2 className="font-headline text-2xl mb-4 text-primary">{prompt.text.en}</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap text-base md:text-lg leading-relaxed space-y-4">
              {script.split('\n').map((paragraph, pIndex) => (
                <p key={pIndex}>{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
