'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, LogIn, Ticket, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (error: any) {
      console.error("Login failed from form submission:", error?.message || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group/form">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover/form:bg-primary/20 transition-colors duration-700" />
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black ml-1">Stage Access (Email)</Label>
              <div className="relative group/input">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within/input:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@studio.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl focus:ring-primary/20 focus:border-primary/50 text-white placeholder:text-white/20 transition-all"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Security Key</Label>
                <Link href="/forgot-password" className="text-[10px] uppercase tracking-wider text-primary/60 hover:text-primary transition-colors">
                  Lost Key?
                </Link>
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within/input:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl focus:ring-primary/20 focus:border-primary/50 text-white transition-all"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20 group transition-all" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">Processing...</span>
            ) : (
              <span className="flex items-center gap-2">
                Enter Backstage
                <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </form>
      </div>

      {/* Guest Entrance Shortcut */}
      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative flex justify-center">
          <span className="bg-neutral-950 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">or</span>
        </div>
      </div>

      <Link href="/cinema" className="block group">
        <div className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                <Ticket className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">Guest Entrance</h3>
                <p className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">Heading to a Shared Cinema? Step right in.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default LoginForm;
