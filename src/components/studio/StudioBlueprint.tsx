'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Hash, Copy, Check, Info } from 'lucide-react';
import { toast } from 'sonner';

interface BlueprintTag {
  id: string;
  name: string;
  rect: DOMRect;
  el: HTMLElement;
}

export const StudioBlueprint = () => {
  const [isActive, setIsActive] = useState(false);
  const [tags, setTags] = useState<BlueprintTag[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    setIsLocalhost(
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('0.0.0.0')
    );
  }, []);

  const scanComponents = useCallback(() => {
    const elements = document.querySelectorAll('[data-blueprint]');
    const newTags: BlueprintTag[] = [];
    
    elements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      const name = el.getAttribute('data-blueprint') || 'Unknown';
      newTags.push({
        id: `${name}-${idx}`,
        name,
        rect,
        el: el as HTMLElement
      });
    });
    
    setTags(newTags);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLocalhost) return;
      
      // Ctrl + / or Ctrl + ? (which is / on most layouts)
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setIsActive(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocalhost]);

  useEffect(() => {
    if (isActive) {
      scanComponents();
      // Rescan on resize/scroll to keep tags aligned
      window.addEventListener('resize', scanComponents);
      window.addEventListener('scroll', scanComponents, true);
      
      // Interval scan for dynamic content
      const interval = setInterval(scanComponents, 1000);
      
      return () => {
        window.removeEventListener('resize', scanComponents);
        window.removeEventListener('scroll', scanComponents, true);
        clearInterval(interval);
      };
    }
  }, [isActive, scanComponents]);

  const copyToClipboard = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedId(name);
    toast.success(`Copied Component ID: ${name}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isLocalhost || !isActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dim Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-blue-500/5 backdrop-blur-[1px]"
      />

      {/* Blueprint Tags */}
      {tags.map((tag) => (
        <motion.div
          key={tag.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            top: tag.rect.top,
            left: tag.rect.left,
            width: tag.rect.width,
            height: tag.rect.height,
          }}
          className="border-2 border-dashed border-blue-500/40 rounded-lg pointer-events-none flex items-start justify-start p-1"
        >
          <div 
            className={cn(
              "pointer-events-auto cursor-pointer group flex items-center gap-2 px-2 py-1",
              "bg-blue-600 text-white rounded shadow-lg -translate-y-full -translate-x-1",
              "hover:bg-blue-500 transition-colors duration-200"
            )}
            onClick={() => copyToClipboard(tag.name)}
          >
            <Hash className="w-3 h-3 opacity-70" />
            <span className="text-[10px] font-black uppercase tracking-widest">{tag.name}</span>
            {copiedId === tag.name ? (
              <Check className="w-3 h-3 text-emerald-300" />
            ) : (
              <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </motion.div>
      ))}

      {/* Mode Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-2xl flex items-center gap-3 border border-blue-400/30">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Studio Blueprint Mode Active</span>
        <div className="h-4 w-px bg-white/20" />
        <span className="text-[9px] font-bold text-blue-100">Ctrl + / to Toggle</span>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur-md text-white/60 rounded-xl flex items-center gap-3 border border-white/10">
        <Info className="w-4 h-4 text-blue-400" />
        <span className="text-[9px] font-medium italic">Click any tag to copy its Component ID for your Requirements Template.</span>
      </div>
    </div>
  );
};
