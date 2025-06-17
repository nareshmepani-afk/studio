
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Film, Loader2, UserCheck } from 'lucide-react'; // Added UserCheck
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // Added useRouter

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter(); // Added router

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

  if (authLoading || !hasMounted) {
    // Show skeleton if auth state is loading or component hasn't mounted
    return (
      <div className="flex min-h-screen flex-col bg-secondary">
        <Navbar />
        <div className="flex flex-grow flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
              <div className="inline-flex justify-center items-center mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-8 w-3/4 mx-auto mb-2" /> {/* CardTitle */}
              <Skeleton className="h-4 w-1/2 mx-auto" /> {/* CardDescription */}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 mb-1" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Input */}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 mb-1" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Input */}
                </div>
                <Skeleton className="h-10 w-full" /> {/* Button */}
              </div>
              <Skeleton className="mt-6 h-4 w-3/4 mx-auto" /> {/* Link to Register */}
              <Skeleton className="mt-4 h-3 w-1/2 mx-auto" /> {/* Link to Homepage */}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Show message if user is already authenticated (AuthContext will redirect shortly)
    return (
      <div className="flex min-h-screen flex-col bg-secondary">
        <Navbar />
        <div className="flex flex-grow flex-col items-center justify-center p-4 text-center">
          <Card className="w-full max-w-md shadow-xl p-6">
             <UserCheck className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-headline mb-2">Already Logged In</h1>
            <p className="text-muted-foreground mb-4">
              You are already authenticated. Redirecting to your dashboard...
            </p>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-6" />
            <p className="text-sm text-muted-foreground">
              Want to use a different account? Please{' '}
              <Button variant="link" className="p-0 h-auto" onClick={async () => { await logout(); router.push('/login'); }}>log out</Button> first.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // If not loading and not authenticated, show the login form
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
