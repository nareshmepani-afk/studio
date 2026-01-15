"use client";

import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import React from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SplashScreen from "@/components/layout/SplashScreen"; // Import the SplashScreen

const queryClient = new QueryClient();

// Create a new component to handle the loading state
function AppContent({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return <>{children}</>;
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
        <AuthProvider>
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
