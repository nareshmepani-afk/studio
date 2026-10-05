'use client';

/**
 * 🎬 Fireside Completed Reel Card — Celebratory Master Reel Display
 *
 * Designed for elderly storytellers and family archivists resting in armchairs.
 * Renders the golden laurel wreath celebratory state when a scene is completed
 * or mastered. Shields the master performance reel from accidental overwriting,
 * while providing immediate theatrical preview and additive bonus note triggers.
 *
 * Milestone: MW-88-T2 (Ticket #259)
 * Route: /studio/fireside
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English, Rule 26 Elder Ergonomics, Rule 39 Armchair Powerhouse)
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Film,
  Play,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Camera,
  Music,
  Clock,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Award,
  Lock,
  Paperclip,
  X,
  Trash2,
} from 'lucide-react';
import {
  UnifiedCurriculumMemory,
  StoryMoodTag,
  EditingAuthority,
  resolveEditingAuthority,
} from '@/types/curriculum';
import { FiresideLanguage } from '@/types/fireside';
import VideoSelectionRoomDrawer from './VideoSelectionRoomDrawer';

export interface FiresideCompletedReelCardProps {
  sceneId: string;
  sceneTitle: string;
  sceneMemory?: UnifiedCurriculumMemory;
  editingAuthority?: EditingAuthority;
  sessionPhotos?: any[];
  overrideDurationSeconds?: number;
  activeLanguage?: FiresideLanguage;
  onWatchTheatricalReel: () => void;
  onAddBonusNote: () => void;
  onReRecordRequest?: () => void;
  onDiscardTake?: () => void;
  onPromoteMasterTake?: (takeId: string) => Promise<void> | void;
  onReorderTakes?: (orderedTakeIds: string[]) => Promise<void> | void;
  onSafeDiscardTake?: (discardTakeId: string, fallbackMasterTakeId?: string) => Promise<void> | void;
  onRestoreTake?: (takeId: string) => Promise<void> | void;
  className?: string;
}

function formatDurationSeconds(totalSeconds: number): string {
  if (!totalSeconds || !Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0m 00s';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

export const FiresideCompletedReelCard: React.FC<FiresideCompletedReelCardProps> = ({
  sceneId,
  sceneTitle,
  sceneMemory,
  editingAuthority,
  sessionPhotos = [],
  overrideDurationSeconds,
  activeLanguage = 'en',
  onWatchTheatricalReel,
  onAddBonusNote,
  onReRecordRequest,
  onDiscardTake,
  onPromoteMasterTake,
  onReorderTakes,
  onSafeDiscardTake,
  onRestoreTake,
  className = '',
}) => {
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isStudioMasterDrawerOpen, setIsStudioMasterDrawerOpen] = useState(false);
  const [isVideoSelectionRoomOpen, setIsVideoSelectionRoomOpen] = useState(false);

  const resolvedAuthority: EditingAuthority = useMemo(() => {
    if (editingAuthority === 'desktop_locked' || editingAuthority === 'fireside_flexible') {
      return editingAuthority;
    }
    if (sceneMemory?.editingAuthority) {
      return sceneMemory.editingAuthority;
    }
    return resolveEditingAuthority(sceneMemory);
  }, [editingAuthority, sceneMemory]);

  const isDesktopLocked = resolvedAuthority === 'desktop_locked';

  const takes = useMemo(() => {
    return Array.isArray(sceneMemory?.takes) ? sceneMemory.takes : [];
  }, [sceneMemory?.takes]);

  const activeTakes = useMemo(() => {
    return takes.filter((t) => t.status !== 'outtake' && t.status !== 'purged');
  }, [takes]);

  const outtakes = useMemo(() => {
    return takes.filter((t) => t.status === 'outtake');
  }, [takes]);

  // Determine preferred take and metrics across ACTIVE takes (MW-107)
  const preferredTake = useMemo(() => {
    if (activeTakes.length === 0) return null;
    return (
      activeTakes.find((t) => t.status === 'master') ||
      activeTakes.find((t) => t.id === sceneMemory?.activeTakeId) ||
      activeTakes.find((t) => t.isPreferred) ||
      activeTakes[activeTakes.length - 1] ||
      activeTakes[0]
    );
  }, [activeTakes, sceneMemory?.activeTakeId]);

  const effectiveDurationSeconds = useMemo(() => {
    if (
      typeof overrideDurationSeconds === 'number' &&
      Number.isFinite(overrideDurationSeconds) &&
      overrideDurationSeconds > 0
    ) {
      return overrideDurationSeconds;
    }
    if (
      preferredTake?.durationSeconds &&
      Number.isFinite(preferredTake.durationSeconds) &&
      preferredTake.durationSeconds > 0
    ) {
      return preferredTake.durationSeconds;
    }
    return 0;
  }, [overrideDurationSeconds, preferredTake]);

  const durationText = useMemo(() => {
    if (effectiveDurationSeconds > 0) {
      return formatDurationSeconds(effectiveDurationSeconds);
    }
    return '0m 05s';
  }, [effectiveDurationSeconds]);

  const takeNumber = useMemo(() => {
    if (preferredTake?.takeNumber && preferredTake.takeNumber > 0) {
      return preferredTake.takeNumber;
    }
    if (activeTakes.length > 0) {
      return activeTakes.length;
    }
    return 1;
  }, [preferredTake, activeTakes]);

  const recordedTimestampText = useMemo(() => {
    const rawDate =
      preferredTake?.createdAt || sceneMemory?.lastModified || sceneMemory?.createdAt;
    const parsed = rawDate ? new Date(rawDate) : new Date();
    const validDate = isNaN(parsed.getTime()) ? new Date() : parsed;
    return validDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [preferredTake?.createdAt, sceneMemory?.lastModified, sceneMemory?.createdAt]);

  const mergedPhotos = useMemo(() => {
    const vaultPhotos = Array.isArray(sceneMemory?.photos) ? sceneMemory.photos : [];
    const localPhotos = Array.isArray(sessionPhotos) ? sessionPhotos : [];
    if (localPhotos.length > 0) return localPhotos;
    return vaultPhotos;
  }, [sceneMemory?.photos, sessionPhotos]);

  const photosCount = mergedPhotos.length;
  const bonusNotes = Array.isArray(sceneMemory?.bonusNotes) ? sceneMemory.bonusNotes : [];
  const bonusNotesCount = bonusNotes.length;
  const isMastered = sceneMemory?.currentStatus === 'mastered';

  const moodTagDisplay = useMemo(() => {
    const tag = sceneMemory?.moodTag;
    if (tag === 'joyful') return '✨ Joyful';
    if (tag === 'reflective') return '🕊️ Reflective';
    if (tag === 'nostalgic') return '⏳ Nostalgic';
    return null;
  }, [sceneMemory?.moodTag]);

  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {}
    }
  }, []);

  const handleWatchClick = useCallback(() => {
    triggerHaptic();
    onWatchTheatricalReel();
  }, [triggerHaptic, onWatchTheatricalReel]);

  const handleBonusClick = useCallback(() => {
    triggerHaptic();
    onAddBonusNote();
  }, [triggerHaptic, onAddBonusNote]);

  const handleConfirmRetake = useCallback(() => {
    triggerHaptic();
    setShowRetakeConfirm(false);
    onReRecordRequest?.();
  }, [triggerHaptic, onReRecordRequest]);

  return (
    <section
      id="fireside-completed-reel-card"
      data-testid="fireside-completed-reel-card"
      aria-label={`Completed memory scene: ${sceneTitle}`}
      className={`w-full max-w-xl mx-auto rounded-3xl border border-amber-500/40 bg-stone-950/90 shadow-[0_0_50px_rgba(245,158,11,0.15)] backdrop-blur-xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden transition-all ${className}`}
    >
      {/* Golden Ambient Backdrop Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Golden Laurel Wreath Emblem Header */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-amber-400/20 to-amber-600/10 border-2 border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center justify-center mb-4">
          <Award className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" aria-hidden="true" />
        </div>

        {/* Celebratory Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs sm:text-sm font-semibold tracking-wide shadow-sm mb-3">
          <CheckCircle2 className="w-4 h-4 text-amber-300" />
          <span>
            {isMastered || isDesktopLocked
              ? 'Theatrical Master Reel Completed in Soundstage ✓'
              : 'Spoken Memory Secured in Generational Vault ✓'}
          </span>
        </div>

        {/* Studio Provenance Pill: [ ✨ Studio Master ] (MW-88-T2 / MW-88-T7 Informational Provenance) */}
        {isDesktopLocked && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setIsStudioMasterDrawerOpen(true);
            }}
            data-testid="studio-master-badge"
            data-hotspot-id="HS_FIRESIDE_STUDIO_MASTER_BADGE"
            title="Authored in Desktop Studio • Full cross-device editing enabled"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-500/25 to-amber-500/25 border border-amber-400/80 text-amber-200 text-xs sm:text-sm font-bold tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_28px_rgba(245,158,11,0.55)] hover:scale-[1.02] active:scale-98 transition-all cursor-pointer mb-3"
            aria-label="Studio Master reassurance drawer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>[ ✨ Studio Master ]</span>
          </button>
        )}

        <h3 className="text-xl sm:text-2xl font-serif font-normal text-white mb-2 leading-tight">
          {sceneTitle}
        </h3>

        {/* Explicit Take Number & Date Timestamp Pill + Selection Room Trigger (MW-106) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <div
            data-testid="completed-reel-take-timestamp"
            className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1 rounded-full bg-stone-900/90 border border-stone-700/80 text-xs font-mono text-stone-300"
          >
            <span className="text-amber-300 font-bold">Take #{takeNumber}</span>
            <span className="text-stone-500">•</span>
            <span>Recorded {recordedTimestampText}</span>
            <span className="text-stone-500">•</span>
            <span className="text-emerald-300 font-semibold">{durationText}</span>
          </div>

          {(activeTakes.length > 0 || outtakes.length > 0) && (
            <button
              type="button"
              data-testid="HS_FIRESIDE_OPEN_SELECTION_ROOM_BTN"
              onClick={() => {
                triggerHaptic();
                setIsVideoSelectionRoomOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300 hover:text-white text-xs font-mono font-bold transition cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span>Reel Stack ({activeTakes.length}){outtakes.length > 0 ? ` • ${outtakes.length} outtakes` : ''} ▾</span>
            </button>
          )}
        </div>

        <p className="text-xs text-stone-400 max-w-md mb-5 leading-relaxed">
          Your storytelling performance has been captured, preserved, and woven into your master family archive.
        </p>
      </div>

      {/* Directorial Metrics HUD Box */}
      <div className="w-full relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 text-left mb-5">
        <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-amber-400/90 mb-1">
            <Clock className="w-3 h-3" />
            <span>Duration</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-stone-200 font-mono">
            {durationText}
          </span>
          <span className="text-[10px] text-stone-400 font-mono mt-0.5">
            Take #{takeNumber} • {recordedTimestampText}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-amber-400/90 mb-1">
            <Camera className="w-3 h-3" />
            <span>Photos</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-stone-200 font-mono">
            {photosCount} Scanned
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-amber-400/90 mb-1">
            <Music className="w-3 h-3" />
            <span>Resonance</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-stone-200 truncate">
            {moodTagDisplay || 'Warm Amber'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-amber-400/90 mb-1">
            <FileText className="w-3 h-3" />
            <span>Bonus Notes</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-stone-200 font-mono">
            {bonusNotesCount} Added
          </span>
        </div>
      </div>

      {/* Attached Vintage Photos Preview Strip (Test 10: Immediate Visual Confirmation of Uploaded Photo) */}
      {mergedPhotos.length > 0 && (
        <div
          data-testid="completed-reel-photos-strip"
          className="w-full relative z-10 mb-5 p-3.5 rounded-2xl bg-stone-900/90 border border-amber-500/30 text-left"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Attached Vintage Heirloom {mergedPhotos.length === 1 ? 'Photograph' : 'Photographs'}</span>
            </span>
            <button
              type="button"
              onClick={handleWatchClick}
              className="text-[11px] font-mono text-amber-400 hover:text-amber-200 underline cursor-pointer"
            >
              View in Cinema ↗
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {mergedPhotos.map((p: any, idx: number) => {
              const src =
                typeof p === 'string'
                  ? p
                  : p.localUri || p.storageUrl || p.previewUrl || p.url || '';
              return (
                <div
                  key={p.id || idx}
                  onClick={handleWatchClick}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden border border-stone-700 hover:border-amber-400 cursor-pointer group bg-black"
                >
                  <img
                    src={src}
                    alt={p.caption || `Heirloom photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Added Bonus Memory Notes List (Test 11 Step 3 Confirmation) */}
      {bonusNotes.length > 0 && (
        <div
          data-testid="completed-reel-bonus-notes-list"
          className="w-full relative z-10 mb-5 p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 text-left space-y-2"
        >
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
            Saved Bonus Memory Recollections ({bonusNotes.length})
          </span>
          {bonusNotes.map((note) => (
            <div
              key={note.id}
              className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/90 text-xs text-stone-200"
            >
              <p className="leading-relaxed">{note.text}</p>
              <span className="text-[10px] font-mono text-stone-400 mt-1 block">
                — {note.authorName}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Celebratory Action CTAs (Rule 26: 56px Minimum Touch Envelopes) */}
      <div className="w-full relative z-10 flex flex-col gap-3">
        {/* Primary CTA: Watch Theatrical Reel */}
        <button
          type="button"
          onClick={handleWatchClick}
          data-hotspot-id="HS_FIRESIDE_COMPLETED_WATCH_BTN"
          className="w-full min-h-[56px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(245,158,11,0.35)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:scale-[1.01] active:scale-98 transition-all cursor-pointer select-none"
        >
          <Play className="w-5 h-5 fill-stone-950 text-stone-950" />
          <span>Watch Theatrical Reel</span>
        </button>

        {/* Secondary CTA: Add Archival Footnote / Photo (Bonus Memory Drawer) */}
        <button
          type="button"
          onClick={handleBonusClick}
          data-hotspot-id="HS_FIRESIDE_COMPLETED_BONUS_BTN"
          className="w-full min-h-[56px] px-6 py-3.5 rounded-2xl bg-stone-900/90 hover:bg-stone-800/90 border border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98 select-none"
        >
          <PlusCircle className="w-5 h-5 text-amber-400" />
          <span>
            {isDesktopLocked
              ? '📎 Add Archival Footnote / Photo (Open Bonus Memory Drawer)'
              : 'Open Bonus Memory Drawer (+ Add Archival Footnote / Photo)'}
          </span>
        </button>
      </div>

      {/* Universal Retake & 2-Step Discard Take Actions (MW-107 Universal Nomenclature) */}
      <div className="mt-5 relative z-10 flex flex-col items-center gap-3 text-center">
        {/* Discard Current Take Trigger & 2-Step Confirmation */}
        {!showDiscardConfirm ? (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {!showRetakeConfirm && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setShowRetakeConfirm(true);
                }}
                data-testid="HS_FIRESIDE_COMPLETED_RETAKE_BTN"
                data-hotspot-id="HS_FIRESIDE_COMPLETED_RETAKE_BTN"
                className="text-xs text-stone-400 hover:text-amber-400 underline underline-offset-4 transition-colors cursor-pointer py-2 px-3 rounded-lg"
              >
                Record an additional take for this scene
              </button>
            )}

            {activeTakes.length > 1 ? (
              /* Case 1: Multiple Active Takes -> Direct Master Replacement Interlock */
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  data-testid="HS_FIRESIDE_CARD_DISCARD_BTN"
                  data-hotspot-id="HS_FIRESIDE_CARD_DISCARD_BTN"
                  onClick={() => {
                    triggerHaptic();
                    setIsVideoSelectionRoomOpen(true);
                  }}
                  className="min-h-[48px] px-4 py-2 rounded-xl bg-stone-900/80 hover:bg-amber-950/40 border border-amber-500/40 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer active:scale-95"
                >
                  <Film className="w-4 h-4 text-amber-400" />
                  <span>[ ⇄ Replace Master Reel ]</span>
                </button>
                <span className="text-[11px] text-stone-400 font-mono">
                  Opens Selection Room to assign a new Master before retiring this take.
                </span>
              </div>
            ) : (
              /* Case 2: Single Active Take -> Clear Recording & Return to Script */
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  data-testid="HS_FIRESIDE_CARD_DISCARD_BTN"
                  data-hotspot-id="HS_FIRESIDE_CARD_DISCARD_BTN"
                  onClick={() => {
                    triggerHaptic();
                    setShowRetakeConfirm(false);
                    setShowDiscardConfirm(true);
                  }}
                  className="min-h-[48px] px-4 py-2 rounded-xl bg-stone-900/80 hover:bg-rose-950/40 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>[ 🔄 Clear Recording & Return to Script ]</span>
                </button>
                <span className="text-[11px] text-stone-400 font-mono">
                  Moves this recording to outtakes and resets scene to Act I draft.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full p-4 rounded-2xl bg-stone-900/95 border border-rose-500/50 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-2.5 mb-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm text-rose-200 font-bold mb-1">
                  Clear this recording and return to script?
                </p>
                <p className="text-xs text-stone-300 leading-relaxed">
                  This recording will be safely preserved in your Cutting Room Floor drawer. The scene will return to an unrecorded slate so you can refine your script and record fresh takes.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                data-testid="HS_FIRESIDE_DISCARD_CANCEL_BTN"
                data-hotspot-id="HS_FIRESIDE_DISCARD_CANCEL_BTN"
                onClick={() => setShowDiscardConfirm(false)}
                className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 transition cursor-pointer"
              >
                [ Keep Recording ]
              </button>
              <button
                type="button"
                data-testid="HS_FIRESIDE_DISCARD_CONFIRM_BTN"
                data-hotspot-id="HS_FIRESIDE_DISCARD_CONFIRM_BTN"
                onClick={() => {
                  triggerHaptic();
                  setShowDiscardConfirm(false);
                  if (preferredTake?.id && onSafeDiscardTake) {
                    onSafeDiscardTake(preferredTake.id);
                  } else {
                    onDiscardTake?.();
                  }
                }}
                className="min-h-[44px] px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                [ Confirm & Return to Script ]
              </button>
            </div>
          </div>
        )}

        {showRetakeConfirm && !showDiscardConfirm && (
          <div
            data-testid="master-reel-protection-modal"
            className="w-full p-4 rounded-2xl bg-stone-900/95 border border-amber-500/60 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-start gap-2.5 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  ⚠️ Master Reel Protected
                </h5>
                <p className="text-xs text-stone-300 leading-relaxed">
                  You already have a completed Theatrical Master Reel for this scene ready for cinema release. Recording an auxiliary take will add an alternate take to your multi-take stack without altering your active master reel unless you choose to promote it.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRetakeConfirm(false)}
                className="w-full sm:w-auto min-h-[44px] px-3.5 py-1.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 transition cursor-pointer"
              >
                Cancel & Keep Master Reel
              </button>
              <button
                type="button"
                data-testid="HS_FIRESIDE_CONFIRM_RETAKE_BTN"
                onClick={handleConfirmRetake}
                className="w-full sm:w-auto min-h-[44px] px-4 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 transition cursor-pointer"
              >
                Proceed to Record Alternate Take
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Serene Studio Master Reassurance Bottom Drawer (MW-88-T2 / MW-88-T7) */}
      {isStudioMasterDrawerOpen && (
        <div
          data-testid="studio-master-reassurance-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Studio Master Reassurance"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsStudioMasterDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-amber-500/50 bg-stone-950/95 p-6 sm:p-8 text-left shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-4 animate-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 block">
                    Responsive Ergonomic Specialisation • Cross-Surface Sync
                  </span>
                  <h4 className="text-base sm:text-lg font-serif text-white">
                    Authored in Desktop Studio • Full Cross-Device Editing Enabled
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStudioMasterDrawerOpen(false)}
                className="p-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white border border-stone-800 cursor-pointer"
                aria-label="Close Studio Master drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              This memory is synchronised across your Desktop Soundstage and Fireside Mobile Studio. You can edit your script, record additional takes, discard rehearsal takes, or attach heirloom photographs from any device while your prioritised sensory anchors remain intact.
            </p>
            <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
              Universal playback and editing remain active across all your devices.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsStudioMasterDrawerOpen(false);
                  handleBonusClick();
                }}
                className="flex-1 min-h-[52px] px-4 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Paperclip className="w-4 h-4 text-amber-400" />
                <span>📎 Add Archival Footnote / Photo</span>
              </button>
              <button
                type="button"
                onClick={() => setIsStudioMasterDrawerOpen(false)}
                className="min-h-[52px] px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm cursor-pointer transition"
              >
                Understood ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Selection Room Drawer (MW-106) */}
      <VideoSelectionRoomDrawer
        isOpen={isVideoSelectionRoomOpen}
        onClose={() => setIsVideoSelectionRoomOpen(false)}
        sceneTitle={sceneTitle}
        takes={takes}
        activeTakeId={sceneMemory?.activeTakeId}
        onPromoteMaster={async (takeId) => {
          await onPromoteMasterTake?.(takeId);
        }}
        onReorderTakes={async (orderedTakeIds) => {
          await onReorderTakes?.(orderedTakeIds);
        }}
        onDiscardTake={async (discardTakeId, fallbackMasterTakeId) => {
          if (onSafeDiscardTake) {
            await onSafeDiscardTake(discardTakeId, fallbackMasterTakeId);
          } else {
            onDiscardTake?.();
          }
        }}
        onRestoreTake={async (takeId) => {
          await onRestoreTake?.(takeId);
        }}
      />
    </section>
  );
};

export default FiresideCompletedReelCard;
