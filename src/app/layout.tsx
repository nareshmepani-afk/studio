
"use client"; // This component now uses a client-side hook, so this is required.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";
import React, { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

const inter = Inter({ subsets: ["latin"] });

// Metadata can still be exported from a client component in the app router.
export const metadata: Metadata = {
  title: "Memory Weaver",
  description: "Record and share your life's most precious moments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // This useEffect hook will run once on the client when the app loads.
  // It dynamically adds the FFmpeg script to the document head.
  useEffect(() => {
    if (!document.getElementById('ffmpeg-script')) {
      console.log('RootLayout: Loading ffmpeg.js script...');
      const script = document.createElement('script');
      script.id = 'ffmpeg-script';
      script.src = '/ffmpeg.js'; // Points to the file in the public directory
      script.async = true;
      script.onload = () => {
        console.log('RootLayout: ffmpeg.js script loaded successfully.');
        // You could potentially set a global state or fire an event here
        // to notify the rest of the app, but getFFmpegInstance handles waiting.
      };
      script.onerror = () => {
        console.error('RootLayout: Failed to load the ffmpeg.js script.');
        toast({
          title: "Critical Error",
          description: "Media processing tools failed to load. Please refresh the page.",
          variant: "destructive",
          duration: Infinity, // Keep it visible until dismissed
        });
      };
      document.head.appendChild(script);
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
