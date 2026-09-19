'use client';

import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ResetDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isFlightSimulator?: boolean;
  isPending?: boolean;
}

/**
 * 🏛️ ResetDraftModal (Ticket MW-272)
 *
 * Obsidian-themed theatrical confirmation modal guarding draft reset actions.
 * Ensures narrators explicitly acknowledge the erasure of unconfirmed
 * manuscript drafts before executing clean-slate or seed rehydration.
 *
 * Governance:
 * - Rule 7 (Universal Non-Degradation): Curriculum placement preserved.
 * - Rule 20 (Mandatory British English Orthography): Theatrical UK spelling throughout.
 */
export const ResetDraftModal: React.FC<ResetDraftModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isFlightSimulator = false,
  isPending = false,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open && !isPending) onClose(); }}>
      <AlertDialogContent className="bg-slate-950/95 backdrop-blur-3xl border border-amber-500/30 text-stone-200 max-w-md p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] rounded-[2rem]">
        <AlertDialogHeader className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-2 mx-auto sm:mx-0 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <AlertDialogTitle className="text-2xl font-headline text-white italic">
            Reset Draft to Baseline?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-stone-300/80 text-sm leading-relaxed font-sans">
            Reset Draft to Baseline? This will clear your current manuscript and unselected takes so you can begin this memory anew. Your curriculum placement will remain intact.
            {isFlightSimulator && (
              <span className="block mt-2 text-amber-300/90 text-xs font-medium">
                🎭 Rehearsal Note: The canonical seed monologue will be restored to provide an immediate rehearsal baseline.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-8 gap-3 flex items-center justify-end flex-wrap">
          <AlertDialogCancel
            disabled={isPending}
            onClick={onClose}
            className="bg-white/5 border-white/10 text-stone-300 hover:bg-white/10 hover:text-white rounded-xl px-5 py-2.5 h-auto text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Cancel / Keep Working
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-amber-500 hover:bg-amber-400 text-black rounded-xl px-6 py-2.5 h-auto text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isFlightSimulator ? 'Reset to Rehearsal Baseline' : 'Reset to Blank Canvas'}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
