
"use client";

import { useState, type FormEvent, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { LockKeyhole, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { resetPasswordAction } from '@/actions/resetPasswordAction';
import { Skeleton } from '@/components/ui/skeleton';

function ResetPasswordFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); // This will be the oobCode from Firebase email link

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
      toast({
        title: "Invalid Token",
        description: "The password reset link is invalid or has expired. Please try requesting a reset again.",
        variant: "destructive",
      });
    }
  }, [token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!token) {
      setError("No reset token found. Please use the link from your email.");
      return;
    }
    // Firebase password minimum is 6 characters
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      toast({ title: "Password Too Short", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      toast({ title: "Passwords Mismatch", description: "The new passwords do not match.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    // ReCAPTCHA simulation removed for this step
    // const mockRecaptchaToken = "mock-recaptcha-token-for-reset-" + Date.now();

    try {
      const result = await resetPasswordAction({ 
        token, 
        newPassword, 
        confirmPassword,
        // recaptchaToken: mockRecaptchaToken // Removed
      });
      if (result.success) {
        setSuccess(true);
        toast({
          title: "Password Reset Successful",
          description: result.message,
        });
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(result.message);
        toast({
          title: "Password Reset Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Reset password error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  if (!hasMounted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive mb-4">{error || "This password reset link is invalid or has expired."}</p>
        <Button variant="outline" asChild>
          <Link href="/forgot-password">Request New Reset Link</Link>
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <p className="text-green-500 mb-2">Your password has been reset successfully!</p>
        <p className="text-muted-foreground mb-4">Redirecting to login page...</p>
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password (min. 6 characters)</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="Enter your new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Reset Password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <Navbar />
      <div className="flex flex-grow flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex justify-center items-center mb-4">
              <LockKeyhole className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your new password below. Make sure it&apos;s strong and memorable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            }>
              <ResetPasswordFormComponent />
            </Suspense>
            {/* Removed reCAPTCHA note as it's not implemented yet in this step
            <p className="mt-4 text-xs text-center text-muted-foreground">
              This site is protected by reCAPTCHA (simulated).
            </p>
            */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remembered your password?{' '}
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
