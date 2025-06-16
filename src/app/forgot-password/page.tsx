
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { KeyRound, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { requestPasswordResetAction } from '@/actions/requestPasswordResetAction';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setSubmitted(false);

    try {
      const result = await requestPasswordResetAction(email);
      if (result.success) {
        toast({
          title: 'Password Reset Requested',
          description: result.message,
        });
        setSubmitted(true);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Could not process your request. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: 'Request Failed',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <Navbar />
      <div className="flex flex-grow flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex justify-center items-center mb-4">
              <KeyRound className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">Forgot Password</CardTitle>
            <CardDescription>
              {submitted
                ? "If an account exists for this email, instructions to reset your password have been (notionally) sent."
                : "Enter your email address and we'll (notionally) send you a link to reset your password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasMounted ? (
              submitted ? (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Please check your inbox (this is a simulation).</p>
                  <Button variant="outline" onClick={() => router.push('/login')} asChild>
                    <Link href="/login">Back to Login</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning={true}>
                  <div className="space-y-2" suppressHydrationWarning={true}>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      suppressHydrationWarning={true}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Request Reset Link
                  </Button>
                </form>
              )
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
