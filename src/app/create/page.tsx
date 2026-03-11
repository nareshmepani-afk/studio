'use client';

import { useState } from 'react';
import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createMemoryAction } from '@/actions';

export default function CreateMemoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!title.trim() || !story.trim()) {
      toast.error("Incomplete Memory", {
        description: "Please provide a title and a story for your memory.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createMemoryAction({ title, description: story });

      if (result.success) {
        toast.success("Memory Saved!", {
          description: "Your new memory has been successfully created.",
        });
        router.push('/timeline');
      } else {
        toast.error("Error Saving Memory", {
          description: result.message,
        });
        setIsSubmitting(false);
      }
    } catch (error) {
        console.error("Unexpected error in handleSubmit:", error);
        toast.error("An Unexpected Error Occurred", {
            description: "Something went wrong on our end. Please try again.",
        });
        setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <AuthenticatedPageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-headline mb-2">Loading...</h2>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  if (!user) {
    return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-8 px-4 text-center">
          <p>Please log in to create a memory.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <h1 className="font-headline text-4xl mb-8">Create a New Memory</h1>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Your Memory</CardTitle>
                <CardDescription>Weave a new thread into your life's tapestry. What moment do you want to remember?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Graduation Day"
                    maxLength={100}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story">Story</Label>
                  <Textarea 
                    id="story"
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="Tell us what happened... the sights, the sounds, the feelings."
                    rows={10}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Memory'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </AuthenticatedPageWrapper>
  );
}