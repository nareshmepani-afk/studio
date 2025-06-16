
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Film, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      // AuthContext will handle redirection
    } catch (error) {
      // Error is already toasted in AuthContext, no need to double toast
      console.error("Login page submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = authLoading || isSubmitting;

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <Navbar />
      <div className="flex flex-grow flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex justify-center items-center mb-4">
              <Film className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue to Memory Weaver</CardDescription>
          </CardHeader>
          <CardContent>
            {hasMounted ? (
              <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning={true}>
                <div className="space-y-2" suppressHydrationWarning={true}>
                  <Label htmlFor="email">Email</Label>
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
                <div className="space-y-2" suppressHydrationWarning={true}>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    suppressHydrationWarning={true}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link href="/" className="hover:underline">
                Back to homepage
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
