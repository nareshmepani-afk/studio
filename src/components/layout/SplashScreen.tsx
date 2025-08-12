import React from 'react';
import { Loader2 } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-headline text-muted-foreground">Loading Memory Weaver...</p>
      </div>
    </div>
  );
};

export default SplashScreen;