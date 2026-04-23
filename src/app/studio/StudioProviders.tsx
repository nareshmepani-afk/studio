import { AuthProvider } from "@/hooks/useAuth";
import { StudioProvider } from "@/hooks/studio/useStudioState";
import React, { Suspense } from "react";

export function StudioProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StudioProvider>
        {children}
      </StudioProvider>
    </AuthProvider>
  );
}
