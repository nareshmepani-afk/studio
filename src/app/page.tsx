
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Film, Users, Lock, BookHeart, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  imageHint: string;
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: 'AI-Powered Memory Cues',
    description: 'Get relevant suggestions based on your profile and the current date to spark your recollections.',
    imageHint: 'brainstorm lightbulb'
  },
  {
    icon: Film,
    title: 'Multimedia Recording',
    description: 'Capture, edit, and store your memories using video and audio directly within the app.',
    imageHint: 'video camera recording'
  },
  {
    icon: Users,
    title: 'Interactive Timeline',
    description: 'Organize and browse your cherished moments in a sortable, filterable timeline.',
    imageHint: 'timeline interface'
  },
  {
    icon: Lock,
    title: 'Secure Sharing',
    description: 'Share selected memories with loved ones through unique, secure links.',
    imageHint: 'secure lock'
  },
];

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/timeline');
    }
  }, [isAuthenticated, loading, router]);

  // Show a simple loading state or null if auth is still loading and user might be redirected.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
         {/* You can add a more sophisticated global loader here if needed */}
      </div>
    );
  }
  
  // If authenticated, router.push will handle redirect, so render nothing until redirect happens.
  if (isAuthenticated) {
    return null;
  }


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center bg-transparent">
          <div className="container mx-auto px-4">
            <BookHeart className="mx-auto h-20 w-20 text-primary mb-6 animate-bounce" />
            <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6">
              Memory Weaver
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Your life's moments, beautifully preserved and effortlessly recalled. Weave together your precious memories with AI assistance.
            </p>
            <div className="space-x-4">
              <Link href="/register" passHref>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login" passHref>
                <Button size="lg" variant="outline">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-headline text-4xl text-center mb-12">
              Why Memory Weaver?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center shadow-xl hover:shadow-2xl transition-shadow">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                       <feature.icon className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                   <CardFooter className="flex justify-center p-4">
                     <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden">
                        <Image
                            src={`https://placehold.co/300x200.png`}
                            alt={feature.title}
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint={feature.imageHint}
                        />
                     </div>
                   </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial/CTA Section (Optional) */}
        <section className="py-20 bg-secondary">
            <div className="container mx-auto px-4 text-center">
                <h2 className="font-headline text-3xl mb-6">Ready to Weave Your Story?</h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                    Join thousands of users who are rediscovering the joy of their past memories and creating a legacy for the future.
                </p>
                <Link href="/register" passHref>
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Sign Up Now
                    </Button>
                </Link>
            </div>
        </section>
      </main>

      <footer className="py-8 border-t bg-background">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} Memory Weaver. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

    