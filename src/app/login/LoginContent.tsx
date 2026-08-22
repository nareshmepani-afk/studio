'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Clapperboard, AlertCircle } from 'lucide-react';

export default function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Brand/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-6 shadow-2xl shadow-primary/20">
            <Clapperboard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-headline italic tracking-tighter text-white mb-2">Memory Weaver</h1>
          <p className="text-white/40 text-sm font-medium tracking-widest uppercase mb-8">Production Studio</p>
        </div>

        {/* Expired Session Alert */}
        <AnimatePresence>
          {reason === 'expired' && (
            <motion.div 
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-1">Session Expired</h4>
                  <p className="text-xs text-red-200/60 leading-relaxed">
                    For your security, your studio session has timed out. Please sign in to re-enter the backstage area.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form Container */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000" />
          <div className="relative">
            <LoginForm />
          </div>
        </div>

        {/* Footer Credit & Legal Links */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-white/40">
            <Link href="/legal/terms" className="hover:text-white/70 transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/legal/privacy" className="hover:text-white/70 transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/legal/cookies" className="hover:text-white/70 transition-colors">
              Cookies
            </Link>
          </div>
          <p className="text-center text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">
            © 2024–2026 Memory Weaver
          </p>
        </div>
      </motion.div>
    </div>
  );
}
