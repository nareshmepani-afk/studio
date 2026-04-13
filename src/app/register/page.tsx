
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Film, Info, Loader2, UserPlus, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CinematicBackground } from '@/components/ui/CinematicBackground';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords Mismatch", { description: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
        toast.error("Password Too Short", { description: "Password must be at least 6 characters." });
        return;
    }
    if (!name.trim()) {
        toast.error("Name Required", { description: "Please enter your name." });
        return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
    } catch (error) {
      console.error("Register page submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = authLoading || isSubmitting;

  if (!hasMounted) {
    return (
      <CinematicBackground theme="blue">
        <div className="flex flex-grow flex-col items-center justify-center p-4 min-h-[calc(100vh-64px)]">
           <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              <Skeleton className="h-8 w-3/4 mx-auto mb-6 bg-white/5" />
              <div className="space-y-4">
                <Skeleton className="h-12 w-full bg-white/5" />
                <Skeleton className="h-12 w-full bg-white/5" />
                <Skeleton className="h-12 w-full bg-white/5" />
                <Skeleton className="h-12 w-full bg-white/5" />
                <Skeleton className="h-12 w-full bg-white/5" />
              </div>
           </div>
        </div>
      </CinematicBackground>
    );
  }

  return (
    <CinematicBackground theme="blue">
      <div className="flex flex-grow flex-col items-center justify-center p-4 min-h-[calc(100vh-64px)]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            
            {/* Ambient inner glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />

            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="inline-flex justify-center items-center mb-4 p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <h1 className="font-headline text-3xl font-bold tracking-tight text-white mb-2">Stage Registration</h1>
                <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                  <span>Activate your 6-month Host Pass</span>
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <button type="button" className="inline-block transition-colors hover:text-primary">
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={8} className="bg-slate-950 border-white/10 text-white max-w-xs p-3">
                        <p className="leading-relaxed">Your complimentary Host Pass allows full cinematic production access. After 6 months, it remains remarkably affordable—roughly the cost of one coffee per month.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning={true}>
                <div className="space-y-2 group/field">
                  <Label htmlFor="name" className="text-[10px] uppercase tracking-[0.2em] text-white/40 group-focus-within/field:text-primary transition-colors ml-1 font-bold">Full Name</Label>
                  <div className="relative">
                    <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-primary transition-colors" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Producer Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 h-12 pl-12 rounded-xl focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-white/10"
                      suppressHydrationWarning={true}
                    />
                  </div>
                </div>

                <div className="space-y-2 group/field">
                  <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-white/40 group-focus-within/field:text-primary transition-colors ml-1 font-bold">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="producer@studio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 h-12 pl-12 rounded-xl focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-white/10"
                      suppressHydrationWarning={true}
                    />
                  </div>
                </div>

                <div className="space-y-2 group/field">
                  <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.2em] text-white/40 group-focus-within/field:text-primary transition-colors ml-1 font-bold">Access Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-primary transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 h-12 pl-12 rounded-xl focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-white/10"
                      suppressHydrationWarning={true}
                    />
                  </div>
                </div>

                <div className="space-y-2 group/field">
                  <Label htmlFor="confirm-password" className="text-[10px] uppercase tracking-[0.2em] text-white/40 group-focus-within/field:text-primary transition-colors ml-1 font-bold">Verify Password</Label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-primary transition-colors" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 h-12 pl-12 rounded-xl focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-white/10"
                      suppressHydrationWarning={true}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-primary text-slate-900 font-bold text-base hover:brightness-110 shadow-[0_0_20px_rgba(var(--primary),0.2)] transition-all flex items-center justify-center gap-2 mt-4" 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Film className="h-5 w-5" />}
                  Register Production Hub
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                <p className="text-sm text-white/40">
                  Already a Studio Member?{' '}
                  <Link href="/login" className="font-bold text-primary hover:text-sky-400 underline underline-offset-4 transition-colors">
                    Enter Stage Door
                  </Link>
                </p>
                <Link href="/" className="text-xs text-white/20 hover:text-white/40 transition-colors uppercase tracking-[0.3em] font-medium">
                  Return to Lobby
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </CinematicBackground>
  );
}
