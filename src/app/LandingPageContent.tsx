'use client';

import { Film, LogIn, UserPlus, Clapperboard } from 'lucide-react';
import Link from 'next/link';
import { CinematicBackground } from '@/components/ui/CinematicBackground';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPageContent() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <CinematicBackground>
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12">
        <div className="w-full max-w-4xl text-center">
          <div className="relative group animate-fade-in">
            {/* Extreme Glassmorphic Card */}
            <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]" />
            
            <div className="relative p-8 md:p-20 flex flex-col items-center">
              <div className="flex justify-center items-center mb-8">
                <div className="p-5 rounded-3xl bg-primary/10 border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
                  <Film className="h-12 w-12 text-primary" />
                </div>
              </div>

              <h1 className="text-5xl md:text-8xl font-headline italic tracking-tighter bg-gradient-to-br from-white via-white/90 to-white/40 bg-clip-text text-transparent mb-6">
                Memory Weaver
              </h1>
              
              <p className="text-lg md:text-xl text-white/40 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                Weave the story of your life, one memory at a time. Record, preserve, and share your most precious moments with loved ones across generations.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 w-full sm:w-auto min-h-[56px]">
                {loading ? (
                  <div className="h-12 w-48 bg-white/5 animate-pulse rounded-full" />
                ) : isAuthenticated ? (
                  <>
                    <Link href="/studio" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 hover:brightness-110 transition-all flex items-center justify-center gap-3">
                        <Clapperboard className="w-4 h-4" /> Enter Memory Studio
                      </button>
                    </Link>
                    
                    <Link href="/cinema" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 backdrop-blur-md">
                        <Film className="w-4 h-4" /> Watch Memory Cinema
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 backdrop-blur-md">
                        <LogIn className="w-4 h-4" /> Login
                      </button>
                    </Link>
                    
                    <Link href="/register" className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 hover:brightness-110 transition-all flex items-center justify-center gap-3">
                        <UserPlus className="w-4 h-4" /> Sign Up
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-white/5 opacity-20">
            <p className="text-[10px] font-black uppercase tracking-[0.8em] text-white">A Chronicle Cinema Production</p>
          </div>
        </div>
      </main>
    </CinematicBackground>
  );
}
