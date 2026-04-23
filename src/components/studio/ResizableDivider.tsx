'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface ResizableDividerProps {
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onDoubleClick?: () => void;
  isDragging?: boolean;
  isSnapActive?: boolean; // Trigger pulse when snapping
}

export const ResizableDivider = ({ 
  onDragStart, 
  onDoubleClick, 
  isDragging,
  isSnapActive 
}: ResizableDividerProps) => {
  return (
    <div
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      onDoubleClick={onDoubleClick}
      className={cn(
        "relative w-1.5 h-full cursor-col-resize group z-50 transition-colors duration-300",
        isDragging ? "bg-[var(--room-accent)]/40" : "bg-white/5 hover:bg-[var(--room-accent)]/20"
      )}
    >
      {/* Magnetic Pulse Aura */}
      <AnimatePresence>
        {isSnapActive && (
          <motion.div
            initial={{ opacity: 0, scaleX: 1 }}
            animate={{ opacity: [0, 0.5, 0], scaleX: [1, 10, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-[var(--room-accent)] blur-md pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Visual Handle */}
      <div className={cn(
        "absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 transition-all duration-300",
        isDragging || isSnapActive ? "bg-[var(--room-accent)]" : "bg-white/10 group-hover:bg-[var(--room-accent)]/50"
      )} />

      {/* Grip Icon */}
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full border bg-slate-950 transition-all duration-500",
        isDragging ? "opacity-100 scale-110 border-[var(--room-accent)] text-[var(--room-accent)]" : "opacity-0 group-hover:opacity-100 scale-100 border-white/10 text-white/20"
      )}>
        <GripVertical className="w-3 h-3" />
      </div>

      {/* Interaction Surface (Wider than visual) */}
      <div className="absolute inset-y-0 -left-2 -right-2 bg-transparent" />
    </div>
  );
};
