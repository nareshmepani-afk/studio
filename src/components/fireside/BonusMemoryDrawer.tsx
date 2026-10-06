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
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { BonusMemoryNote } from '@/types/curriculum';
import { checkAndPolishGrammar } from '@/actions/aiWeaver';
import { toast } from 'sonner';

export interface BonusMemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sceneId: string;
  sceneTitle: string;
  initialPrompt?: string | null;
  editingNote?: BonusMemoryNote | null;
  onSaveBonusNote: (note: Omit<BonusMemoryNote, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateBonusNote?: (noteId: string, updatedFields: Partial<Omit<BonusMemoryNote, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteBonusNote?: (noteId: string) => Promise<void>;
  className?: string;
  activeLanguage?: string;
  lang?: string;
}

export const BonusMemoryDrawer: React.FC<BonusMemoryDrawerProps> = ({
  isOpen,
  onClose,
  sceneId,
  sceneTitle,
  initialPrompt = null,
  editingNote = null,
  onSaveBonusNote,
  onUpdateBonusNote,
  onDeleteBonusNote,
  className = '',
  activeLanguage,
  lang,
}) => {
  const [text, setText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState<'storyteller' | 'producer' | 'family_member'>('storyteller');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [originalDraft, setOriginalDraft] = useState<string | null>(null);
  const [isPolished, setIsPolished] = useState(false);

  // Dynamic diaspora locale binding (Guardrail 2)
  const effectiveLang = lang || (activeLanguage && activeLanguage !== 'en' ? activeLanguage : 'en-GB');

  // Reset or pre-seed form when opened (MW-88-T6 / MW-110 Edit Mode)
  useEffect(() => {
    if (isOpen) {
      if (editingNote) {
        setText(editingNote.text || '');
        setAuthorName(editingNote.authorName || '');
        setAuthorRole(editingNote.authorRole || 'storyteller');
      } else {
        setText(initialPrompt ? `${initialPrompt}\n\n` : '');
        setAuthorName('');
        setAuthorRole('storyteller');
      }
      setIsSaving(false);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setIsPolishing(false);
      setOriginalDraft(null);
      setIsPolished(false);
    }
  }, [isOpen, initialPrompt, editingNote]);

  // Non-destructive AI grammar & spell polish handler (Guardrail 3)
  const handlePolishNote = async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 5 || isPolishing) return;

    setIsPolishing(true);
    // Snapshot original draft for non-destructive revert guarantee
    const draftSnapshot = text;

    try {
      const polished = await checkAndPolishGrammar(trimmed);
      if (polished && polished !== trimmed) {
        setOriginalDraft(draftSnapshot);
        setText(polished);
        setIsPolished(true);
        toast.success('Spelling & Grammar Polished!', {
          description: 'Corrected typos and grammatical agreement while preserving voice.',
        });
      } else {
        toast.success('Note Clean & Ready', {
          description: 'No spelling or grammar errors detected.',
        });
      }
    } catch (err: any) {
      console.error('[BonusMemoryDrawer] checkAndPolishGrammar error:', err);
      // Zero-Data-Loss Network Exception Shield (Guardrail 3)
      toast.error('AI grammar service temporarily unavailable. Your draft was kept safely.');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleRevertNote = () => {
    if (originalDraft !== null) {
      setText(originalDraft);
      setOriginalDraft(null);
      setIsPolished(false);
      toast.info('Reverted to original draft.');
    }
  };

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
      if (editingNote && onUpdateBonusNote) {
        await onUpdateBonusNote(editingNote.id, {
          authorName: authorName.trim() || 'Elder Storyteller',
          authorRole,
          text: text.trim(),
        });
      } else {
        await onSaveBonusNote({
          authorName: authorName.trim() || 'Elder Storyteller',
          authorRole,
          text: text.trim(),
        });
      }
      onClose();
    } catch (err) {
      console.error('[BonusMemoryDrawer] Error saving bonus note:', err);
    } finally {
      setIsSaving(false);
    }
  }, [text, authorName, authorRole, isSaving, editingNote, onUpdateBonusNote, onSaveBonusNote, onClose]);

  const handleDelete = useCallback(async () => {
    if (!editingNote || !onDeleteBonusNote || isDeleting) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch {}
    }

    setIsDeleting(true);
    try {
      await onDeleteBonusNote(editingNote.id);
      onClose();
    } catch (err) {
      console.error('[BonusMemoryDrawer] Error deleting bonus note:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [editingNote, onDeleteBonusNote, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editingNote ? `Edit bonus recollection for ${sceneTitle}` : `Add bonus recollection for ${sceneTitle}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Centered Modal Card on Desktop / Bottom Sheet on Mobile */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border-t sm:border border-x border-stone-800 bg-stone-950 p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 overflow-y-auto custom-scrollbar select-text ${className}`}
      >
        {/* Handle Bar (mobile only) */}
        <div className="w-12 h-1.5 rounded-full bg-stone-700 mx-auto mb-6 sm:hidden" />

        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {editingNote ? 'Edit Family Note' : 'Additive Family Note'}
              </span>
              <span className="text-xs text-stone-500">• Non-Destructive</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif text-white font-normal">
              {editingNote ? 'Edit Bonus Recollection' : 'Add a Bonus Recollection'}
            </h2>
            <p className="text-xs text-stone-400">
              {editingNote ? 'Updating extra details for: ' : 'Preserving extra details for: '}
              <strong className="text-stone-200">{sceneTitle}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-hotspot-id="HS_BONUS_DRAWER_CLOSE"
            className="w-10 h-10 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
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
              onChange={(e) => {
                setText(e.target.value);
                if (isPolished && originalDraft !== null && e.target.value !== text) {
                  setIsPolished(false);
                }
              }}
              placeholder="e.g. I remembered Aunt Meena was also there that morning wearing her wedding sari..."
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang={effectiveLang}
              className="w-full p-4 pr-10 pb-4 rounded-2xl bg-stone-900/90 border border-stone-700 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition custom-scrollbar"
            />

            {/* Note Status Bar: Word Count & AI Grammar Polish Action */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <span
                  data-testid="HS_NOTE_WORD_COUNT"
                  className="text-[11px] font-mono text-stone-400"
                >
                  {text.trim() ? `${text.trim().split(/\s+/).length} ${text.trim().split(/\s+/).length === 1 ? 'word' : 'words'}` : '0 words'}
                </span>
                {isPolished && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Polished with AI Proofreader
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isPolished && originalDraft !== null && (
                  <button
                    type="button"
                    data-testid="HS_BONUS_NOTE_REVERT_BTN"
                    onClick={handleRevertNote}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-mono transition cursor-pointer border border-stone-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 text-stone-400" />
                    <span>Revert to original draft</span>
                  </button>
                )}

                <button
                  type="button"
                  data-testid="HS_BONUS_NOTE_POLISH_BTN"
                  onClick={handlePolishNote}
                  disabled={isPolishing || text.trim().length < 5}
                  className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                    text.trim().length >= 5 && !isPolishing
                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                      : 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed'
                  }`}
                  title="Check spelling, grammar agreement & British English"
                >
                  {isPolishing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                      <span>Elevating Draft...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Polish Note</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="words"
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
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {editingNote && onDeleteBonusNote && (
              <button
                type="button"
                onClick={() => {
                  if (showDeleteConfirm) {
                    handleDelete();
                  } else {
                    setShowDeleteConfirm(true);
                  }
                }}
                disabled={isDeleting || isSaving}
                className={`min-h-[56px] px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none border order-2 sm:order-1 ${
                  showDeleteConfirm
                    ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse sm:flex-1'
                    : 'bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-400 hover:text-rose-400 hover:border-rose-500/40'
                }`}
                title={showDeleteConfirm ? 'Confirm permanent removal' : 'Delete this bonus recollection'}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>{showDeleteConfirm ? 'Confirm Delete Recollection?' : 'Delete Note'}</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={!text.trim() || isSaving || isDeleting}
              data-hotspot-id="HS_BONUS_DRAWER_SAVE"
              className={`w-full sm:flex-1 min-h-[56px] rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer select-none active:scale-98 order-1 sm:order-2 ${
                text.trim() && !isSaving && !isDeleting
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{editingNote ? 'Saving Changes...' : 'Saving Recollection to Vault...'}</span>
                </>
              ) : editingNote ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Update Bonus Recollection</span>
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
