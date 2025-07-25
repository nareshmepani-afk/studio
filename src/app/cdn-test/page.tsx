
"use client";

import { useEffect, useState } from 'react';
import useScript from '@/hooks/useScript';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

export default function CdnTestPage() {
  const cdnUrl = 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js';
  const [status, setStatus] = useState<string[]>(['Page loaded.']);
  const [error, setError] = useState<string | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  
  // 1. Load a script from a different CDN (jsDelivr)
  const scriptLoaded = useScript(cdnUrl);

  useEffect(() => {
    setStatus(prev => [...prev, `useScript hook reports script loaded from ${cdnUrl}: ${scriptLoaded}`]);
    if (scriptLoaded) {
      // Check if the global variable from the script is available
      if (typeof window !== 'undefined' && (window as any).jQuery) {
        setStatus(prev => [...prev, 'SUCCESS: window.jQuery is available.']);
        setIsScriptReady(true);
      } else {
        const errorMessage = 'Script reported loaded, but window.jQuery is not defined.';
        setStatus(prev => [...prev, `ERROR: ${errorMessage}`]);
        setError(errorMessage);
        setIsScriptReady(false);
      }
    }
  }, [scriptLoaded]);


  return (
    <div className="flex min-h-screen flex-col bg-secondary">
        <Navbar />
        <div className="flex flex-grow flex-col items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">External CDN Script Test</CardTitle>
                    <CardDescription>
                        This page attempts to load jQuery from the jsDelivr CDN to test if external scripts can be fetched from the App Hosting environment.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="mt-4 space-y-2 rounded-lg bg-muted p-4">
                        <h3 className="font-semibold">Status Log:</h3>
                        <ul className="list-disc space-y-1 pl-5 text-sm font-mono text-muted-foreground">
                        {status.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                        </ul>
                    </div>

                    {isScriptReady && (
                        <div className="flex items-center space-x-3 rounded-md border border-green-500 bg-green-50 p-4 text-green-700">
                            <CheckCircle className="h-6 w-6" />
                            <div>
                                <p className="font-bold">Success!</p>
                                <p>The external script from jsDelivr was successfully loaded and verified.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                         <div className="flex items-center space-x-3 rounded-md border border-destructive bg-red-50 p-4 text-destructive">
                            <AlertTriangle className="h-6 w-6" />
                            <div>
                                <p className="font-bold">Error During Script Load:</p>
                                <p>{error}</p>
                            </div>
                        </div>
                    )}

                     {!scriptLoaded && !error && (
                         <div className="flex items-center space-x-3 rounded-md border border-amber-500 bg-amber-50 p-4 text-amber-700">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <div>
                                <p className="font-bold">Loading...</p>
                                <p>Attempting to load script from CDN.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
