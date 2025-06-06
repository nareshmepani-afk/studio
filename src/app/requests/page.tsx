
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { BellRing, UserCheck, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Mock data for pending requests, similar to what was on the main page
const mockPendingRequests = [
  { id: 'req1', text: 'Tell us about your first pet!', user: 'Guest123', type: 'prompt_fulfillment' },
  { id: 'req2', text: 'What was your favorite childhood vacation?', user: 'Guest456', type: 'prompt_fulfillment' },
  { id: 'req3', text: 'Share a memory about overcoming a challenge.', user: 'Friend22', type: 'direct_request' },
];

export default function RequestsPage() {
  const { userMode } = useAuth();

  if (userMode !== 'host') {
    return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-8 px-4 text-center">
          <HelpCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="font-headline text-3xl mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            This page is only accessible in Host mode.
          </p>
          <Link href="/" passHref>
            <Button variant="outline">Go to Timeline</Button>
          </Link>
        </div>
      </AuthenticatedPageWrapper>
    );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <BellRing className="h-10 w-10 text-primary mr-4" />
          <div>
            <h1 className="font-headline text-4xl">Incoming Memory Requests</h1>
            <p className="text-muted-foreground text-lg">
              Guests have requested these memories. Click one to start fulfilling it.
            </p>
          </div>
        </div>

        {mockPendingRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockPendingRequests.map(req => (
              <Card key={req.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center">
                    {req.type === 'prompt_fulfillment' ? 
                      <HelpCircle className="mr-2 h-5 w-5 text-accent" /> : 
                      <UserCheck className="mr-2 h-5 w-5 text-secondary-foreground" />
                    }
                    {req.type === 'prompt_fulfillment' ? 'Prompt to Fulfill' : 'Direct Request'}
                  </CardTitle>
                  <CardDescription>From: {req.user}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{req.text}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => alert(`Fulfilling request: ${req.text}`)}>
                    Fulfill Request (Mock)
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card shadow rounded-lg">
            <BellRing className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="font-headline text-2xl mb-2">No Pending Requests</h2>
            <p className="text-muted-foreground">
              You're all caught up! No memory requests from guests at the moment.
            </p>
          </div>
        )}
      </div>
    </AuthenticatedPageWrapper>
  );
}
