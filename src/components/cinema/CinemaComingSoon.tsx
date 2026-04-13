'use client';

import { motion } from 'framer-motion';
import { Film, Lock, Sparkles, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CinemaComingSoonProps {
  title: string;
  description: string;
  onRequest: () => void;
  requestCount?: number;
}

export function CinemaComingSoon({ title, description, onRequest, requestCount = 0 }: CinemaComingSoonProps) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group relative aspect-[2/3] w-full rounded-[32px] overflow-hidden bg-neutral-900 border border-white/5 flex flex-col items-center justify-center p-8 text-center"
    >
      {/* Background Decorative Patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 border border-white/20 rounded-full" />
      </div>

      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 space-y-6 flex flex-col items-center">
        <div className="relative">
          <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 backdrop-blur-sm group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
            <Film className="h-8 w-8 text-white/20 group-hover:text-primary transition-colors duration-500" />
          </div>
          <div className="absolute -top-1 -right-1">
             <div className="relative h-6 w-6">
                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20" />
                <div className="relative h-6 w-6 bg-primary/20 backdrop-blur-md border border-primary/40 rounded-full flex items-center justify-center">
                  <Lock className="h-3 w-3 text-primary" />
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.3em] bg-white/5 border-white/10 text-white/40 mb-2">
            Coming Soon
          </Badge>
          <h3 className="font-headline italic text-2xl tracking-tight text-white/90 group-hover:text-white transition-colors">
            {title}
          </h3>
          <p className="text-xs text-white/30 line-clamp-2 px-4 group-hover:text-white/50 transition-colors">
            {description}
          </p>
        </div>

        <div className="pt-4 w-full">
          <Button 
            onClick={(e) => { e.stopPropagation(); onRequest(); }}
            variant="ghost" 
            className="w-full h-12 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-500 group/btn"
          >
            <MessageSquarePlus className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Request Story</span>
          </Button>
          
          {requestCount > 0 && (
            <p className="mt-3 text-[9px] text-primary/60 font-medium uppercase tracking-tighter">
                {requestCount} fans have requested this
            </p>
          )}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[80px]" />
      </div>
    </motion.div>
  );
}
