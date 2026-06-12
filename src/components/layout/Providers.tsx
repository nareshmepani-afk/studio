"use client";

import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { LanguageProvider } from "@/hooks/useLanguage";
import React from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SplashScreen from "@/components/layout/SplashScreen"; // Import the SplashScreen
import { toast } from 'sonner';
import { BugReportModal } from "@/components/studio/overlays/BugReportModal";

const queryClient = new QueryClient();

// Create a new component to handle the loading state
function AppContent({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    
    // Install bulletproof Global Optics Privacy Interception Shield
    if (typeof window !== 'undefined' && window.navigator && window.navigator.mediaDevices && !(window as any).__opticsShieldInstalled) {
      (window as any).__opticsShieldInstalled = true;
      const activeStreams = new Set<MediaStream>();

      const originalGetUserMedia = window.navigator.mediaDevices.getUserMedia.bind(window.navigator.mediaDevices);
      window.navigator.mediaDevices.getUserMedia = async function (constraints) {
        if (localStorage.getItem('privacy_optics_muted') === 'true') {
          console.warn("[Privacy Shield] getUserMedia blocked: Optics are muted by the user.");
          throw new DOMException("Camera and microphone access is muted by the Privacy Shield.", "NotAllowedError");
        }
        
        const stream = await originalGetUserMedia(constraints);
        activeStreams.add(stream);
        
        const checkTracks = () => {
          const allStopped = stream.getTracks().every(t => t.readyState === 'ended');
          if (allStopped) activeStreams.delete(stream);
        };
        stream.getTracks().forEach(t => t.addEventListener('ended', checkTracks));
        
        return stream;
      };

      // Listen to the privacy change and stop ALL active streams instantly!
      window.addEventListener('privacy-optics-changed', () => {
        if (localStorage.getItem('privacy_optics_muted') === 'true') {
          console.log("[Privacy Shield] Optics muted. Shutting down all active tracks across " + activeStreams.size + " streams.");
          activeStreams.forEach(stream => {
            stream.getTracks().forEach(track => {
              if (track.readyState === 'live') {
                track.stop();
                console.log(`[Privacy Shield] Track stopped: ${track.kind} (${track.label})`);
              }
            });
          });
          activeStreams.clear();
        }
      });

      console.log("[Privacy Shield] Global optics interception shield installed successfully.");
    }
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsReportModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!mounted || loading) {
    return <SplashScreen />;
  }

  return (
    <>
      {children}
      <BugReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        user={user} 
      />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <LanguageProvider>
          <AuthProvider>
            <AppContent>{children}</AppContent>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
