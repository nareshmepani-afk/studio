
"use client";

import { useEffect, useState } from 'react';
import useScript from '@/hooks/useScript';
import { getFFmpegInstance } from '@/lib/ffmpeg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

export default function FFmpegTestPage() {
  const [status, setStatus] = useState<string[]>(['Page loaded.']);
  const [error, setError] = useState<string | null>(null);
  const [isInstanceReady, setIsInstanceReady] = useState(false);
  const [isLoadingInstance, setIsLoadingInstance] = useState(false);

  // 1. Load the FFmpeg script from the CDN
  const scriptLoaded = useScript('https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js');

  useEffect(() => {
    setStatus(prev => [...prev, `useScript hook reports script loaded: ${scriptLoaded}`]);
  }, [scriptLoaded]);

  // 2. Attempt to initialize FFmpeg once the script is loaded
  const initializeFFmpeg = async () => {
    if (!scriptLoaded) {
      setStatus(prev => [...prev, "Initialization skipped: Script not loaded yet."]);
      return;
    }
    if (isInstanceReady || isLoadingInstance) {
      setStatus(prev => [...prev, "Initialization skipped: Already ready or in progress."]);
      return;
    }

    setIsLoadingInstance(true);
    setError(null);
    setStatus(prev => [...prev, "Attempting to initialize FFmpeg instance..."]);

    try {
      const ffmpeg = await getFFmpegInstance();
      if (ffmpeg.isLoaded()) {
        setStatus(prev => [...prev, "SUCCESS: getFFmpegInstance() resolved and ffmpeg.isLoaded() is true."]);
        setIsInstanceReady(true);
      } else {
        throw new Error("getFFmpegInstance() resolved, but ffmpeg.isLoaded() is false.");
      }
    } catch (err: any) {
      console.error("FFmpegTestPage: Initialization failed", err);
      setStatus(prev => [...prev, `ERROR: FFmpeg initialization failed. See console for details.`]);
      setError(err.message || 'An unknown error occurred during initialization.');
    } finally {
      setIsLoadingInstance(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
        <Navbar />
        <div className="flex flex-grow flex-col items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">FFmpeg Initialization Test</CardTitle>
                    <CardDescription>
                        This page attempts to load and initialize the FFmpeg library to isolate any environment-specific issues.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={initializeFFmpeg} disabled={isLoadingInstance || isInstanceReady || !scriptLoaded}>
                        {isLoadingInstance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isInstanceReady ? "Initialization Successful" : "Start FFmpeg Initialization"}
                    </Button>
                    
                    <div className="mt-4 space-y-2 rounded-lg bg-muted p-4">
                        <h3 className="font-semibold">Status Log:</h3>
                        <ul className="list-disc space-y-1 pl-5 text-sm font-mono text-muted-foreground">
                        {status.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                        </ul>
                    </div>

                    {isInstanceReady && (
                        <div className="flex items-center space-x-3 rounded-md border border-green-500 bg-green-50 p-4 text-green-700">
                            <CheckCircle className="h-6 w-6" />
                            <div>
                                <p className="font-bold">Success!</p>
                                <p>The FFmpeg instance has been successfully initialized.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                         <div className="flex items-center space-x-3 rounded-md border border-destructive bg-red-50 p-4 text-destructive">
                            <AlertTriangle className="h-6 w-6" />
                            <div>
                                <p className="font-bold">Error During Initialization:</p>
                                <p>{error}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
