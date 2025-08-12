
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import { Film, ArrowRight, ListChecks, LayoutList, Share2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  imageSrc: string;
  imageHint: string;
}

const features: Feature[] = [
  {
    icon: ListChecks,
    title: 'Guided Life Journey',
    description: 'Embark on a structured "My Life Journey" with guided chapters. AI helps you brainstorm unique prompts tailored to your story.',
    imageSrc: 'https://images.unsplash.com/photo-1620915283255-ee8fcd215f84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxOHx8cGMlMjB2aWRlb3xlbnwwfHx8fDE3NDk2NTMyNjB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'journal path'
  },
  {
    icon: Film,
    title: 'Rich Multimedia Memories',
    description: 'Capture life\'s moments with video and audio. Easily edit, trim, and store your recordings within the app.',
    imageSrc: 'https://images.unsplash.com/photo-1515846865653-cfda085cca48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxwYyUyMGZpbG18ZW58MHx8fHwxNzQ5NjUzMzEyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'media editing'
  },
  {
    icon: LayoutList,
    title: 'Organized Timeline View',
    description: 'Visually browse, sort, and filter your cherished moments in an interactive and intuitive timeline.',
    imageSrc: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxNHx8b3JnYW5pemUlMjBkaWdpdGFsfGVufDB8fHx8MTc0OTY1MTYwMnww&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'memory timeline'
  },
  {
    icon: Share2,
    title: 'Secure & Easy Sharing',
    description: 'Share selected memories with family and friends through unique, secure links. Guests can easily view what you share.',
    imageSrc: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMXx8U2hhcmUlMjB2aWRlb3xlbnwwfHx8fDE3NDk2NTE3ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'secure sharing'
  },
];

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  console.log(`LandingPage: Initial Render - isAuthenticated=${isAuthenticated}, loading=${loading}`);
  const router = useRouter();

  useEffect(() => {
    // Redirection logic is now primarily handled by AuthContext after all data is loaded.
    // This effect remains as a fallback but won't run while the context is loading.
    if (!loading && isAuthenticated) {
      router.push('/timeline');
 console.log(`LandingPage: useEffect - isAuthenticated=${isAuthenticated}, loading=${loading}. Redirecting.`);
    }
  }, [isAuthenticated, loading, router]);

  // The main loading gate is now in AuthContext, so an authenticated user will see that loader first.
  // If they somehow land here while authenticated, the context will redirect them.
  // Thus, we don't need a separate loading state here for the authenticated case.
  if (isAuthenticated) {
     return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-headline text-muted-foreground">Redirecting...</p>
          </div>
       </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center bg-transparent">
          <div className="container mx-auto px-4">
            <Film className="mx-auto h-20 w-20 text-primary mb-6 animate-bounce" />
            <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6">
              Memory Weaver
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Weave your life's story with guided chapters, rich multimedia, and easy sharing. Preserve your legacy, one memory at a time. 
              Start today with a complimentary 6-month Host Pass to unlock all creation features!
            </p>
            <div className="space-x-4">
              <Link href="/register" passHref>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Start Your Free Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login" passHref>
                <Button size="lg" variant="outline">
                  Login
                </Button>
              </Link>
            </div>
            <p className="text-base text-muted-foreground mt-6 max-w-xl mx-auto">
              After your free access, you can continue creating with flexible 31-day Host Passes (e.g., approx. £12.99/$14.99) – pay only when you need it, no subscription required.
            </p>
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
                <Card key={feature.title} className="flex flex-col h-full text-center shadow-xl hover:shadow-2xl transition-shadow">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                       <feature.icon className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                   <CardFooter className="flex justify-center p-4">
                     <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden">
                        <Image
                            src={feature.imageSrc}
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
                    Join Memory Weaver to rediscover the joy of your past memories and create a lasting legacy for the future.
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
