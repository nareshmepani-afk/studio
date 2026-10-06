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
import { checkAndPolishGrammar, weaveBonusNote } from '@/actions/aiWeaver';
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
  const [isWeaving, setIsWeaving] = useState(false);
  const [originalDraft, setOriginalDraft] = useState<string | null>(null);
  const [wovenDraft, setWovenDraft] = useState<string | null>(null);
  const [preWeaveDraft, setPreWeaveDraft] = useState<string | null>(null);
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
      setIsWeaving(false);
      setOriginalDraft(null);
      setWovenDraft(null);
      setPreWeaveDraft(null);
      setIsPolished(false);
    }
  }, [isOpen, initialPrompt, editingNote]);

  // Non-destructive AI grammar & spell polish handler (Guardrail 3)
  const handlePolishNote = async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 5 || isPolishing || isWeaving) return;

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

  // Creative sensory note weaving handler (MW-110)
  const handleWeaveNote = async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 5 || isWeaving || isPolishing) return;

    setIsWeaving(true);
    const draftSnapshot = text;

    try {
      const woven = await weaveBonusNote(trimmed, {
        sceneTitle,
        promptQuestion: initialPrompt || undefined,
        authorName: authorName || undefined,
      });

      if (woven && woven !== trimmed) {
        setPreWeaveDraft(draftSnapshot);
        setWovenDraft(woven);
        toast.success('Sensory Note Woven!', {
          description: 'Review the poetic expansion below before updating your note.',
        });
      } else {
        toast.info('Note already resonant and complete.', {
          description: 'Your raw recollection carries strong authentic depth.',
        });
      }
    } catch (err: any) {
      console.error('[BonusMemoryDrawer] weaveBonusNote error:', err);
      // Zero-Data-Loss Network Exception Shield (Rule 42)
      toast.error('Narrative weave temporarily unavailable. Your original draft was kept safe.');
    } finally {
      setIsWeaving(false);
    }
  };

  const handleApplyWeaveReplace = () => {
    if (!wovenDraft) return;
    setOriginalDraft(preWeaveDraft || text);
    setText(wovenDraft);
    setWovenDraft(null);
    setIsPolished(true);
    toast.success('Note Replaced with Woven Expansion', {
      description: 'Original draft saved — you can revert at any time.',
    });
  };

  const handleApplyWeaveAppend = () => {
    if (!wovenDraft) return;
    setOriginalDraft(preWeaveDraft || text);
    const combined = `${text.trim()}\n\n---\n\n${wovenDraft.trim()}`;
    setText(combined);
    setWovenDraft(null);
    setIsPolished(true);
    toast.success('Woven Reflection Appended', {
      description: 'Kept your original words and added the sensory expansion below.',
    });
  };

  const handleDismissWeave = () => {
    setWovenDraft(null);
    toast.info('Kept original draft.');
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

            {/* Note Status Bar: Word Count & AI Grammar Polish / Weave Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <span
                  data-testid="HS_NOTE_WORD_COUNT"
                  className="text-[11px] font-mono text-stone-400"
                >
                  {text.trim() ? `${text.trim().split(/\s+/).length} ${text.trim().split(/\s+/).length === 1 ? 'word' : 'words'}` : '0 words'}
                </span>
                {isPolished && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Polished with AI
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {originalDraft !== null && (
                  <button
                    type="button"
                    data-testid="HS_BONUS_NOTE_REVERT_BTN"
                    onClick={handleRevertNote}
                    style={{ minHeight: '44px' }}
                    className="min-h-[44px] px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-mono transition cursor-pointer border border-stone-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 text-stone-400" />
                    <span>Revert to original draft</span>
                  </button>
                )}

                {/* Polish Button (The Editor - Stone Styling) */}
                <button
                  type="button"
                  data-testid="HS_BONUS_NOTE_POLISH_BTN"
                  onClick={handlePolishNote}
                  disabled={isPolishing || isWeaving || text.trim().length < 5}
                  style={{ minHeight: '44px' }}
                  className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer border ${
                    text.trim().length >= 5 && !isPolishing && !isWeaving
                      ? 'bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white border-stone-700/80 shadow-sm'
                      : 'bg-stone-950 text-stone-600 border-stone-800 cursor-not-allowed'
                  }`}
                  title="Check spelling, grammar agreement & British English"
                >
                  {isPolishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
                      <span>Polishing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                      <span>Polish</span>
                    </>
                  )}
                </button>

                {/* Weave Button (The Memoirist - Amber Styling) */}
                <button
                  type="button"
                  data-testid="HS_BONUS_NOTE_WEAVE_BTN"
                  onClick={handleWeaveNote}
                  disabled={isWeaving || isPolishing || text.trim().length < 5}
                  style={{ minHeight: '44px' }}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                    text.trim().length >= 5 && !isWeaving && !isPolishing
                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 hover:border-amber-400/60 shadow-sm shadow-amber-950/30'
                      : 'bg-stone-950 text-stone-600 border-stone-800 cursor-not-allowed'
                  }`}
                  title="Weave raw notes with sensory, atmospheric depth"
                >
                  {isWeaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Weaving...</span>
                    </>
                  ) : (
                    <>
                      <span>🧶</span>
                      <span>Weave Note</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Inline Woven Sensory Expansion Compare Tray (MW-110 Pattern C) */}
            {wovenDraft && (
              <div
                data-testid="HS_BONUS_WEAVE_PREVIEW_TRAY"
                className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-mono text-[11px] uppercase tracking-wider font-bold">
                    <span>🧶</span>
                    <span>Woven Sensory Expansion Preview</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400/70">
                    {wovenDraft.trim().split(/\s+/).length} words
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-stone-900/90 border border-amber-500/20 text-xs sm:text-sm font-serif text-amber-100/95 leading-relaxed italic">
                  &ldquo;{wovenDraft}&rdquo;
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    data-testid="HS_BONUS_WEAVE_REPLACE_BTN"
                    onClick={handleApplyWeaveReplace}
                    style={{ minHeight: '44px' }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer transition shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                    <span>Replace Note</span>
                  </button>

                  <button
                    type="button"
                    data-testid="HS_BONUS_WEAVE_APPEND_BTN"
                    onClick={handleApplyWeaveAppend}
                    style={{ minHeight: '44px' }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 hover:text-white border border-amber-500/30 text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Append to Note</span>
                  </button>

                  <button
                    type="button"
                    data-testid="HS_BONUS_WEAVE_DISMISS_BTN"
                    onClick={handleDismissWeave}
                    style={{ minHeight: '44px' }}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-transparent hover:bg-stone-900 text-stone-400 hover:text-stone-200 text-xs font-mono flex items-center gap-1 cursor-pointer transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Keep Original</span>
                  </button>
                </div>
              </div>
            )}
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
