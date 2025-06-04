
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';
import { Loader2 } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';

export default function SettingsPage() {
  const { user, login, loading: authLoading } = useAuth(); // Re-using login to update user in mock
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileInfo, setProfileInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setProfileInfo(user.profileInfo || '');
    }
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Mock update user
    const updatedUser: User = {
      ...user!,
      id: user!.id, // Add null check for user
      name: name,
      email: email, // In real app, email change might need verification
      profileInfo: profileInfo,
    };
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update user in AuthContext (mock)
    // In a real app, this would likely involve re-fetching user or updating token
    localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
    login(updatedUser.email); // Re-login to refresh user state in context

    setIsSubmitting(false);
    toast({
      title: "Settings Saved!",
      description: "Your profile information has been updated.",
    });
  };

  if (authLoading) {
    return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-8 px-4">Loading settings...</div>
      </AuthenticatedPageWrapper>
    );
  }
  
  if (!user) {
     // This should ideally be handled by AuthenticatedPageWrapper redirecting,
     // but as a fallback:
    return (
      <AuthenticatedPageWrapper>
        <div className="container mx-auto py-8 px-4">Please log in to view settings.</div>
      </AuthenticatedPageWrapper>
    );
  }

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <h1 className="font-headline text-4xl mb-8">Settings</h1>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">User Profile</CardTitle>
              <CardDescription>Manage your account information. This helps AI generate relevant memory cues.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed in this demo.</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="profile-info">Profile for AI Cues</Label>
                  <Textarea 
                    id="profile-info" 
                    value={profileInfo} 
                    onChange={(e) => setProfileInfo(e.target.value)} 
                    placeholder="Tell us about your interests, significant life events, favorite places, etc. The more details, the better the AI cues!" 
                    rows={5} 
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedPageWrapper>
  );
}
