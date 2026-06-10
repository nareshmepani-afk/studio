"use client";

import React, { Suspense } from "react";
import { Inter } from "next/font/google";
import { StudioProviders } from "./StudioProviders";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function StudioLayout({
  children,
  modal
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  if (pathname === "/studio/remote-camera") {
    return (
      <div className="relative min-h-screen bg-neutral-950 text-white selection:bg-primary/30">
        {children}
      </div>
    );
  }

  if (pathname === "/studio/teleprompter-popout") {
    return (
      <StudioProviders>
        <div className="relative min-h-screen bg-black text-white selection:bg-primary/30">
          {children}
        </div>
      </StudioProviders>
    );
  }

  return (
    <StudioProviders>
      <div className="relative min-h-screen bg-neutral-950 text-white selection:bg-primary/30">
        {/* Persistent Cinematic Backdrop */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-neutral-950" />
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/40 blur-[150px] rounded-full opacity-30 animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-500/20 blur-[150px] rounded-full opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-primary/10 blur-[180px] rounded-full opacity-10" />
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" 
               style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
        </div>
        
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
          <AnimatePresence mode="wait">
            {modal && (
              <div key={pathname?.includes('/production/') ? '/studio/production' : pathname}>
                {modal}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </StudioProviders>
  );
}
