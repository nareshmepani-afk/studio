
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BookOpenText } from 'lucide-react'; // Changed from BookHeart
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/layout/Navbar'; // Import Navbar


export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login } = useAuth(); // Using login for mock registration for now
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!"); // Simple validation
      return;
    }
    // In a real app, you'd call a registration API
    login(email); // Mock registration uses login flow, redirects via AuthContext
  };

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <Navbar /> {/* Add Navbar here */}
      <div className="flex flex-grow flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex justify-center items-center mb-4">
              <BookOpenText className="h-10 w-10 text-primary" /> {/* Changed Icon */}
            </div>
            <CardTitle className="font-headline text-3xl">Create Account</CardTitle>
            <CardDescription>Join Memory Weaver and start preserving your moments</CardDescription>
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
                <div className="space-y-2" suppressHydrationWarning={true}>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    suppressHydrationWarning={true}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Sign Up
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
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 mb-1" /> {/* Label for Confirm Password */}
                  <Skeleton className="h-10 w-full" />   {/* Input */}
                </div>
                <Skeleton className="h-10 w-full" />       {/* Button */}
              </div>
            )}
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

    
