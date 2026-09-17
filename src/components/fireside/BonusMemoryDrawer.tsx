'use client';

/**
 * 📝 Bonus Memory Drawer — Additive Recollection Bottom-Sheet
 *
 * Ergonomic bottom-sheet modal designed for elderly storytellers to contribute
 * additive recollections, bonus thoughts, or family context to a completed scene.
 * Appends non-destructively without mutating the master reel video or duration.
 *
 * Milestone: MW-88-T2 (Ticket #259)
 * Route: /studio/fireside
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English, Rule 26 Elder Ergonomics, Rule 39 Armchair Powerhouse)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  X,
  FileText,
  Plus,
  Mic,
  Check,
  Sparkles,
  Heart,
  Loader2,
} from 'lucide-react';
import { BonusMemoryNote } from '@/types/curriculum';

export interface BonusMemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sceneId: string;
  sceneTitle: string;
  onSaveBonusNote: (note: Omit<BonusMemoryNote, 'id' | 'createdAt'>) => Promise<void>;
  className?: string;
}

export const BonusMemoryDrawer: React.FC<BonusMemoryDrawerProps> = ({
  isOpen,
  onClose,
  sceneId,
  sceneTitle,
  onSaveBonusNote,
  className = '',
}) => {
  const [text, setText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState<'storyteller' | 'producer' | 'family_member'>('storyteller');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setText('');
      setIsSaving(false);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = useCallback(async () => {
    if (!text.trim() || isSaving) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {}
    }

    setIsSaving(true);
    try {
      await onSaveBonusNote({
        authorName: authorName.trim() || 'Elder Storyteller',
        authorRole,
        text: text.trim(),
      });
      onClose();
    } catch (err) {
      console.error('[BonusMemoryDrawer] Error saving bonus note:', err);
    } finally {
      setIsSaving(false);
    }
  }, [text, authorName, authorRole, isSaving, onSaveBonusNote, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Add bonus recollection for ${sceneTitle}`}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      {/* Backdrop Dismiss Area */}
      <div className="flex-1 w-full" onClick={onClose} aria-hidden="true" />

      {/* Bottom Sheet Drawer */}
      <div
        className={`w-full max-w-2xl mx-auto rounded-t-3xl border-t border-x border-stone-800 bg-stone-950 p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 ${className}`}
      >
        {/* Handle Bar */}
        <div className="w-12 h-1.5 rounded-full bg-stone-700 mx-auto mb-6" />

        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Additive Family Note
              </span>
              <span className="text-xs text-stone-500">• Non-Destructive</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif text-white font-normal">
              Add a Bonus Recollection
            </h2>
            <p className="text-xs text-stone-400">
              Preserving extra details for: <strong className="text-stone-200">{sceneTitle}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-hotspot-id="HS_BONUS_DRAWER_CLOSE"
            className="w-10 h-10 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close bonus recollection drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="bonus-note-text"
              className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2"
            >
              Your Additional Memory or Detail
            </label>
            <textarea
              id="bonus-note-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. I remembered Aunt Meena was also there that morning wearing her wedding sari..."
              className="w-full p-4 rounded-2xl bg-stone-900/90 border border-stone-700 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition custom-scrollbar"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="bonus-author-name"
                className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5"
              >
                Contributor Name
              </label>
              <input
                id="bonus-author-name"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Elder Storyteller"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-200 placeholder-stone-500 focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="bonus-author-role"
                className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5"
              >
                Family Role
              </label>
              <select
                id="bonus-author-role"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-200 focus:border-amber-400 outline-none cursor-pointer"
              >
                <option value="storyteller">Original Storyteller</option>
                <option value="family_member">Family Member / Listener</option>
              </select>
            </div>
          </div>

          {/* Action CTAs (Rule 26: 56px Minimum Touch Target) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!text.trim() || isSaving}
              data-hotspot-id="HS_BONUS_DRAWER_SAVE"
              className={`w-full min-h-[56px] rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer select-none active:scale-98 ${
                text.trim() && !isSaving
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Recollection to Vault...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Save Bonus Recollection to Scene</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonusMemoryDrawer;
