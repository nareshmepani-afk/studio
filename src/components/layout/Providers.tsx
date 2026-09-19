"use client";

import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { LanguageProvider } from "@/hooks/useLanguage";
import React from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SplashScreen from "@/components/layout/SplashScreen"; // Import the SplashScreen
import { BugReportModal } from "@/components/studio/overlays/BugReportModal";
import { HardwarePrivacyProvider } from '@/context/HardwarePrivacyContext';

const queryClient = new QueryClient();

// Create a new component to handle the loading state
function AppContent({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        setIsReportModalOpen((prev) => !prev);
      }
    };

    const handleCustomEvent = () => setIsReportModalOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-telemetry-report', handleCustomEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-telemetry-report', handleCustomEvent);
    };
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
            <HardwarePrivacyProvider>
              <AppContent>{children}</AppContent>
            </HardwarePrivacyProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
