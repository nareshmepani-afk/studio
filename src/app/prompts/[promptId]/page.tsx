
import { mockPromptGroups } from '@/lib/mockData';
import { teleprompterScripts } from '@/lib/teleprompterScripts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function PromptPage({ params }: { params: { promptId: string } }) {
  const { promptId } = params;

  const prompt = mockPromptGroups.flatMap(group => group.prompts).find(p => p.id === promptId);

  if (!prompt) {
    notFound();
  }

  // Check for sub-prompts and gather the relevant scripts
  const scriptsToDisplay = prompt.subPrompts && prompt.subPrompts.length > 0
    ? prompt.subPrompts.map(subPrompt => ({
        id: subPrompt.id,
        text: subPrompt.text.en, // Or handle localization as needed
        script: teleprompterScripts[subPrompt.id]
      })).filter(item => item.script) // Filter out any with no script
    : [{
        id: prompt.id,
        text: prompt.text.en,
        script: teleprompterScripts[prompt.id]
      }];

  if (scriptsToDisplay.length === 0) {
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
            <CardTitle className="font-headline text-3xl md:text-4xl">{prompt.text.en}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-2">{prompt.text.gu}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 lg:p-10">
            <h2 className="font-headline text-2xl mb-4 text-primary">Interviewer Questions (Teleprompter)</h2>
            {scriptsToDisplay.map((item, index) => (
              <div key={item.id} className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap text-base md:text-lg leading-relaxed space-y-4 mb-6">
                <h3 className="font-semibold text-xl">{item.text}</h3>
                {item.script.split('\n').map((paragraph, pIndex) => (
                  <p key={pIndex}>{paragraph}</p>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
