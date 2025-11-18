
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
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, loading: authLoading, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords Mismatch", description: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
        toast({ title: "Password Too Short", description: "Password must be at least 6 characters." });
        return;
    }
    if (!name.trim()) {
        toast({ title: "Name Required", description: "Please enter your name." });
        return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      // AuthContext will handle redirection if successful
    } catch (error) {
      // Error is already toasted in AuthContext
      console.error("Register page submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = authLoading || isSubmitting;

  if (!hasMounted) {
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
                  <Skeleton className="h-4 w-24 mb-1" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Input */}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 mb-1" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Input */}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 mb-1" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Input */}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 mb-1" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Input */}
                </div>
                <Skeleton className="h-10 w-full" /> {/* Button */}
              </div>
               <Skeleton className="mt-6 h-4 w-3/4 mx-auto" /> {/* Link to Login */}
               <Skeleton className="mt-4 h-3 w-1/2 mx-auto" /> {/* Link to Homepage */}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <Navbar />
      <div className="flex flex-grow flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex justify-center items-center mb-4">
              <Film className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">Create Account</CardTitle>
            <CardDescription>Join Memory Weaver and start preserving your moments</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning={true}>
              <div className="space-y-2" suppressHydrationWarning={true}>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  suppressHydrationWarning={true}
                />
              </div>
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
                <Label htmlFor="password">Password (min. 6 characters)</Label>
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
              <div className="space-y-2" suppressHydrationWarning={true}>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  suppressHydrationWarning={true}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Login
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
