
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { activateFreeHostPass } from '@/actions/userActions';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface SettingsPageContentProps {
  initialHostPassStatus: string;
  userEmail: string;
  userName: string;
}

export function SettingsPageContent({ initialHostPassStatus, userEmail, userName }: SettingsPageContentProps) {
  const [hostPassStatus, setHostPassStatus] = useState(initialHostPassStatus);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    console.log('SETTINGS_CONTENT: Component mounted with props:', { initialHostPassStatus, userEmail, userName });
  }, []);

  const handleActivateFreePass = () => {
    console.log('SETTINGS_CONTENT: Activating free pass...');
    startTransition(async () => {
      try {
        const result = await activateFreeHostPass();
        console.log('SETTINGS_CONTENT: Activation result:', result);
        if (result.success) {
          setHostPassStatus('free_host_pass_active');
          toast({ title: "Pass Activated!", description: "Your Free Host Pass is now active.", variant: 'success' });
        } else {
          toast({ title: "Activation Failed", description: result.message, variant: 'destructive' });
        }
      } catch (error) {
        console.error('SETTINGS_CONTENT: Error activating free pass:', error);
        toast({ title: "An Unexpected Error Occurred", description: "Could not activate the pass. Please try again.", variant: 'destructive' });
      }
    });
  };

  const PassStatusIndicator = () => {
    console.log('SETTINGS_CONTENT: Rendering PassStatusIndicator with status:', hostPassStatus);
    switch (hostPassStatus) {
      case 'free_host_pass_active':
        return <span className="flex items-center text-green-500"><CheckCircle className="mr-2 h-4 w-4" /> Free Pass Active</span>;
      case 'paid_host_pass_active':
        return <span className="flex items-center text-blue-500"><CheckCircle className="mr-2 h-4 w-4" /> Premium Pass Active</span>;
      default:
        return <span className="flex items-center text-red-500"><XCircle className="mr-2 h-4 w-4" /> Inactive</span>;
    }
  };

  console.log('SETTINGS_CONTENT: Rendering component with state:', { hostPassStatus, isPending });

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <h1 className="font-headline text-4xl mb-8">Settings</h1>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal and contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={userName} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={userEmail} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Host Pass</CardTitle>
            <CardDescription>Manage your access to the full Life Journey feature set.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-md">
                <p className="font-medium">Your Current Status:</p>
                <PassStatusIndicator />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
             {hostPassStatus === 'inactive' && (
                <div className="w-full">
                  <p className="text-sm text-muted-foreground mb-4">Unlock all story prompts by activating your complimentary Host Pass.</p>
                  <Button onClick={handleActivateFreePass} disabled={isPending} className="w-full sm:w-auto">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                    Activate Free Host Pass
                  </Button>
                </div>
             )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
