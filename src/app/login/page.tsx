
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Film } from 'lucide-react'; // Changed from BookOpenText
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/layout/Navbar'; // Import Navbar

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // In a real app, you'd validate and call an API
    login(email); // Mock login just uses email for now, redirects via AuthContext
  };

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <Navbar /> {/* Add Navbar here */}
      <div className="flex flex-grow flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex justify-center items-center mb-4">
              <Film className="h-10 w-10 text-primary" /> {/* Changed Icon */}
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
                    suppressHydrationWarning={true}
                  />
                </div>
                <div className="space-y-2" suppressHydrationWarning={true}>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    suppressHydrationWarning={true}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 mb-1" /> {/* Label */}
                  <Skeleton className="h-10 w-full" />   {/* Input */}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 mb-1" /> {/* Label */}
                  <Skeleton className="h-10 w-full" />   {/* Input */}
                </div>
                <Skeleton className="h-10 w-full" />       {/* Button */}
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

    
