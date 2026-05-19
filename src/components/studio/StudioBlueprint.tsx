'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Hash, Copy, Check, Info, MousePointer2, Layers, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BlueprintTag {
  id: string;
  name: string;
  rect: DOMRect;
  el: HTMLElement;
}

interface InspectedElement {
  tag: string;
  id: string;
  classes: string;
  zIndex: string;
  pointerEvents: string;
  rect: DOMRect;
  path: string[];
}

export const StudioBlueprint = () => {
  const [isActive, setIsActive] = useState(false);
  const [tags, setTags] = useState<BlueprintTag[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);
  
  // INSPECTOR STATE
  const [inspected, setInspected] = useState<InspectedElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const lastTargetRef = useRef<HTMLElement | null>(null);

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

  const isActiveRef = useRef(false);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // REAL-TIME AUDIT LOGIC
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isActiveRef.current) return;

      setMousePos({ x: e.clientX, y: e.clientY });
      
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!target || target === lastTargetRef.current) return;
      
      lastTargetRef.current = target;
      
      const style = window.getComputedStyle(target);
      const rect = target.getBoundingClientRect();
      
      const path: string[] = [];
      let curr: HTMLElement | null = target;
      while (curr && curr !== document.body) {
        let name = curr.tagName.toLowerCase();
        if (curr.id) name += `#${curr.id}`;
        else if (curr.className && typeof curr.className === 'string') {
          const cls = curr.className.split(' ').filter(c => !c.includes('motion')).slice(0, 2).join('.');
          if (cls) name += `.${cls}`;
        }
        path.push(name);
        curr = curr.parentElement;
      }

      setInspected({
        tag: target.tagName.toLowerCase(),
        id: target.id,
        classes: typeof target.className === 'string' ? target.className : '',
        zIndex: style.zIndex,
        pointerEvents: style.pointerEvents,
        rect,
        path: path.reverse()
      });
    };

    const handleClick = (e: MouseEvent) => {
      if (!isActiveRef.current) return;

      const target = document.elementFromPoint(e.clientX, e.clientY);
      console.group('%c [STUDIO LAYER AUDIT] ', 'background: #2563eb; color: white; padding: 2px 5px; border-radius: 3px;');
      console.log('Coordinates:', { x: e.clientX, y: e.clientY });
      console.log('Topmost Element Hit:', target);
      
      if (target) {
        const style = window.getComputedStyle(target);
        console.log('--- STYLES ---');
        console.log('Z-Index:', style.zIndex);
        console.log('Pointer-Events:', style.pointerEvents);
        console.log('Position:', style.position);
        console.log('Display:', style.display);
        console.log('Opacity:', style.opacity);
        
        console.log('--- HIERARCHY ---');
        let curr: HTMLElement | null = target as HTMLElement;
        const fullPath = [];
        while (curr) {
          const s = window.getComputedStyle(curr);
          fullPath.push({
            el: curr,
            tag: curr.tagName,
            id: curr.id,
            zIndex: s.zIndex,
            pointer: s.pointerEvents,
            opacity: s.opacity
          });
          curr = curr.parentElement;
        }
        console.table(fullPath);
      }
      console.groupEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick, true); 
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick, true);
    };
  }, []); // No dependencies, use refs!

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLocalhost) return;
      
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setIsActive(prev => !prev);
        if (!isActive) {
          toast.info("Layer Audit Mode Active", {
            description: "Move mouse to inspect layers. Click to log full stack trace.",
            icon: <Layers className="w-4 h-4" />
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocalhost, isActive]);

  useEffect(() => {
    if (isActive) {
      scanComponents();
      window.addEventListener('resize', scanComponents);
      window.addEventListener('scroll', scanComponents, true);
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
    <div className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden">
      {/* Dim Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-blue-500/5 backdrop-blur-[0.5px]"
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
          className="border border-dashed border-blue-500/30 rounded-lg pointer-events-none"
        >
          <div 
            className={cn(
              "pointer-events-auto cursor-pointer group flex items-center gap-2 px-2 py-0.5",
              "bg-blue-600 text-white rounded shadow-lg -translate-y-full -translate-x-px",
              "hover:bg-blue-500 transition-colors duration-200"
            )}
            onClick={() => copyToClipboard(tag.name)}
          >
            <Hash className="w-2.5 h-2.5 opacity-70" />
            <span className="text-[9px] font-black uppercase tracking-widest">{tag.name}</span>
            {copiedId === tag.name ? (
              <Check className="w-2.5 h-2.5 text-emerald-300" />
            ) : (
              <Copy className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </motion.div>
      ))}

      {/* REAL-TIME INSPECTOR HIGHLIGHT */}
      {inspected && (
        <div 
          style={{
            position: 'absolute',
            top: inspected.rect.top,
            left: inspected.rect.left,
            width: inspected.rect.width,
            height: inspected.rect.height,
          }}
          className="border-2 border-red-500/50 bg-red-500/5 rounded pointer-events-none animate-pulse z-[10001]"
        >
          {/* Target Info Tooltip */}
          <div className="absolute top-0 right-0 translate-x-full bg-slate-950 text-white p-4 rounded-xl border border-red-500/30 shadow-2xl backdrop-blur-xl min-w-[240px] ml-4">
             <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
               <MousePointer2 className="w-4 h-4 text-red-400" />
               <span className="text-[11px] font-black uppercase tracking-widest">Active Target</span>
             </div>
             
             <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <span className="text-[10px] text-white/50 uppercase">Tag</span>
                 <span className="text-[11px] font-mono text-emerald-400">{inspected.tag}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[10px] text-white/50 uppercase">Z-Index</span>
                 <span className={cn("text-[11px] font-mono", inspected.zIndex === 'auto' ? "text-white/30" : "text-amber-400 font-bold")}>
                   {inspected.zIndex}
                 </span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[10px] text-white/50 uppercase">Pointer</span>
                 <span className={cn("text-[11px] font-mono", inspected.pointerEvents === 'none' ? "text-red-400 font-bold" : "text-emerald-400")}>
                   {inspected.pointerEvents}
                 </span>
               </div>
             </div>

             <div className="mt-4 pt-3 border-t border-white/10">
               <div className="text-[9px] text-white/30 uppercase mb-1">Hierarchy</div>
               <div className="text-[10px] font-mono text-blue-400 flex flex-wrap gap-1">
                 {inspected.path.slice(-3).map((p, i) => (
                   <span key={i} className="flex items-center gap-1">
                     {i > 0 && <span className="opacity-30">&gt;</span>}
                     {p}
                   </span>
                 ))}
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Floating Cursor HUD (Optional, following mouse) */}
      <div 
        style={{
          position: 'fixed',
          top: mousePos.y + 20,
          left: mousePos.x + 20,
        }}
        className="bg-black/90 text-white px-2 py-1 rounded border border-white/10 text-[9px] font-mono shadow-2xl"
      >
        x: {mousePos.x} y: {mousePos.y}
      </div>

      {/* Mode Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-2xl flex items-center gap-3 border border-blue-400/30">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Layer Audit Active</span>
        <div className="h-4 w-px bg-white/20" />
        <span className="text-[9px] font-bold text-blue-100">Ctrl + / to Toggle</span>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur-md text-white/60 rounded-xl flex items-center gap-3 border border-white/10">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-[9px] font-medium italic">Hover to see blocking layers. Click to log DOM details to Console.</span>
      </div>
    </div>
  );
};

