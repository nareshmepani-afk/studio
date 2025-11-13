
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Film, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-gradient-to-br from-background to-secondary/40">
      <div className="w-full max-w-4xl text-center">
        <Card className="shadow-2xl animate-fade-in">
          <CardContent className="p-8 md:p-16">
            <div className="flex justify-center items-center mb-6">
              <Film className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-headline text-foreground">
              Memory Weaver
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
              Weave the story of your life, one memory at a time. Record, preserve, and share your most precious moments with loved ones across generations.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/register" passHref>
                <Button size="lg" className="w-full sm:w-auto">
                  <UserPlus className="mr-2" /> Get Started for Free
                </Button>
              </Link>
              <Link href="/login" passHref>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <LogIn className="mr-2" /> Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
