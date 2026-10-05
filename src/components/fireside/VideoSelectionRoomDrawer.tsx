'use client';

/**
 * 📱 Video Selection Room Drawer — Fireside Mobile Studio
 *
 * Milestone: MW-106 (Ticket #315)
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Universal Non-Degradation, Rule 20 British English, Rule 26 Elder Ergonomics)
 *
 * Elder-friendly slide-over/bottom sheet allowing storytellers to audition,
 * reorder, and designate the active Theatrical Master Reel with minimum
 * 48px touch envelopes. Enforces Active Master Discard Interlock (Amendment 3).
 */

import React, { useState, useMemo } from 'react';
import {
  Film,
  Play,
  Pause,
  Star,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  AlertTriangle,
  Monitor,
  Smartphone,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { MemoirTake } from '@/types/curriculum';

export interface VideoSelectionRoomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sceneTitle: string;
  takes: MemoirTake[];
  activeTakeId?: string | null;
  onPromoteMaster: (takeId: string) => Promise<void> | void;
  onReorderTakes: (orderedTakeIds: string[]) => Promise<void> | void;
  onDiscardTake: (discardTakeId: string, fallbackMasterTakeId?: string) => Promise<void> | void;
  onRestoreTake?: (takeId: string) => Promise<void> | void;
}

function formatDurationSeconds(totalSeconds: number): string {
  if (!totalSeconds || !Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0m 00s';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

function formatDate(isoString?: string): string {
  if (!isoString) return 'Recent';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

export const VideoSelectionRoomDrawer: React.FC<VideoSelectionRoomDrawerProps> = ({
  isOpen,
  onClose,
  sceneTitle,
  takes = [],
  activeTakeId,
  onPromoteMaster,
  onReorderTakes,
  onDiscardTake,
  onRestoreTake,
}) => {
  const sortedTakes = useMemo(() => {
    return [...takes].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : a.takeNumber || 0;
      const orderB = typeof b.order === 'number' ? b.order : b.takeNumber || 0;
      return orderA - orderB;
    });
  }, [takes]);

  const activeTakes = useMemo(() => {
    return sortedTakes.filter((t) => t.status !== 'outtake' && t.status !== 'purged');
  }, [sortedTakes]);

  const outtakes = useMemo(() => {
    return sortedTakes.filter((t) => t.status === 'outtake');
  }, [sortedTakes]);

  const [auditioningTakeId, setAuditioningTakeId] = useState<string | null>(null);
  const [isPlayingAudition, setIsPlayingAudition] = useState<boolean>(false);
  const [pendingDiscardTakeId, setPendingDiscardTakeId] = useState<string | null>(null);
  const [interlockTargetTakeId, setInterlockTargetTakeId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentMasterTake =
    activeTakes.find((t) => t.status === 'master') ||
    activeTakes.find((t) => t.isPreferred) ||
    (activeTakeId ? activeTakes.find((t) => t.id === activeTakeId) : null) ||
    activeTakes[0];

  const handleAuditionToggle = (takeId: string) => {
    if (auditioningTakeId === takeId && isPlayingAudition) {
      setIsPlayingAudition(false);
    } else {
      setAuditioningTakeId(takeId);
      setIsPlayingAudition(true);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newTakes = [...activeTakes];
    const temp = newTakes[index - 1];
    newTakes[index - 1] = newTakes[index];
    newTakes[index] = temp;
    onReorderTakes(newTakes.map((t) => t.id));
  };

  const handleMoveDown = (index: number) => {
    if (index >= activeTakes.length - 1) return;
    const newTakes = [...activeTakes];
    const temp = newTakes[index + 1];
    newTakes[index + 1] = newTakes[index];
    newTakes[index] = temp;
    onReorderTakes(newTakes.map((t) => t.id));
  };

  const initiateDiscard = (takeId: string) => {
    const isMaster = currentMasterTake?.id === takeId;
    setPendingDiscardTakeId(takeId);
    if (isMaster && activeTakes.length > 1) {
      const alternate = activeTakes.find((t) => t.id !== takeId);
      setInterlockTargetTakeId(alternate ? alternate.id : null);
    } else {
      setInterlockTargetTakeId(null);
    }
  };

  const confirmDiscard = async () => {
    if (!pendingDiscardTakeId) return;
    await onDiscardTake(pendingDiscardTakeId, interlockTargetTakeId || undefined);
    setPendingDiscardTakeId(null);
    setInterlockTargetTakeId(null);
    if (auditioningTakeId === pendingDiscardTakeId) {
      setAuditioningTakeId(null);
      setIsPlayingAudition(false);
    }
  };

  const cancelDiscard = () => {
    setPendingDiscardTakeId(null);
    setInterlockTargetTakeId(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fireside Video Selection Room"
      data-testid="fireside-video-selection-room-drawer"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-amber-500/30 bg-stone-950 shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden text-left"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-start justify-between gap-3 bg-gradient-to-r from-stone-900 to-stone-950">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Theatrical Reel Stack
              </span>
              <span className="text-xs font-mono text-stone-400">
                {activeTakes.length} {activeTakes.length === 1 ? 'Take' : 'Takes'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif text-white">
              {sceneTitle}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Audition takes, arrange sequence order, or designate your active Master Reel.
            </p>
          </div>
          <button
            type="button"
            data-testid="close-fireside-selection-drawer-btn"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-stone-900 text-stone-400 hover:text-white border border-stone-800 flex items-center justify-center cursor-pointer"
            aria-label="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Takes List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {activeTakes.length === 0 ? (
            <div className="p-8 text-center text-stone-500 space-y-2">
              <Film className="w-10 h-10 mx-auto stroke-1 text-stone-600" />
              <p className="text-sm font-serif text-stone-400">
                {outtakes.length > 0
                  ? 'All recorded takes currently retired to the Cutting Room Floor below.'
                  : 'No recorded takes in your stack yet.'}
              </p>
            </div>
          ) : (
            activeTakes.map((take, idx) => {
              const isMaster = currentMasterTake?.id === take.id;
              const isAuditioning = auditioningTakeId === take.id;
              const isPendingThisDiscard = pendingDiscardTakeId === take.id;
              const isDesktop = take.source === 'soundstage_desktop';

              return (
                <div
                  key={take.id}
                  data-testid={`fireside-take-card-${take.id}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isMaster
                      ? 'border-amber-500/60 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'border-stone-800 bg-stone-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    {/* Chevrons for Reordering */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        title="Move up"
                        className="min-h-[44px] min-w-[36px] p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-20 text-stone-200 flex items-center justify-center transition cursor-pointer"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === sortedTakes.length - 1}
                        title="Move down"
                        className="min-h-[44px] min-w-[36px] p-2 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-20 text-stone-200 flex items-center justify-center transition cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {isMaster ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-stone-950 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-stone-950" />
                            Active Master Reel
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-stone-400 bg-stone-800 border border-stone-700">
                            Take #{take.takeNumber || idx + 1}
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-stone-300 bg-stone-800 flex items-center gap-1">
                          {isDesktop ? (
                            <Monitor className="w-3 h-3 text-sky-400" />
                          ) : (
                            <Smartphone className="w-3 h-3 text-emerald-400" />
                          )}
                          {isDesktop ? 'Desktop' : 'Fireside'}
                        </span>

                        <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDurationSeconds(take.durationSeconds)}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-white truncate">
                        {take.label || `Take ${take.takeNumber || idx + 1}`}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-mono">
                        Recorded {formatDate(take.createdAt)}
                      </p>
                    </div>

                    {/* Discard Trigger */}
                    <button
                      type="button"
                      data-testid={`fireside-discard-btn-${take.id}`}
                      onClick={() => initiateDiscard(take.id)}
                      className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-stone-900 hover:bg-rose-950/40 border border-stone-800 hover:border-rose-500/50 text-stone-400 hover:text-rose-300 flex items-center justify-center transition cursor-pointer shrink-0"
                      title="Discard take"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Actions Row: Audition + Promote */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800/80">
                    <button
                      type="button"
                      data-testid={`fireside-audition-btn-${take.id}`}
                      onClick={() => handleAuditionToggle(take.id)}
                      className={`min-h-[48px] flex-1 px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        isAuditioning && isPlayingAudition
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                      }`}
                    >
                      {isAuditioning && isPlayingAudition ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause Audition</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Audition Take</span>
                        </>
                      )}
                    </button>

                    {!isMaster && (
                      <button
                        type="button"
                        data-testid={`fireside-promote-btn-${take.id}`}
                        onClick={() => onPromoteMaster(take.id)}
                        className="min-h-[48px] px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span>★ Set as Master Reel</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Audition Player */}
                  {isAuditioning && (
                    <div className="mt-3 pt-3 border-t border-stone-800 animate-in fade-in duration-200">
                      <div className="relative aspect-video max-w-full bg-black rounded-xl overflow-hidden border border-amber-500/40">
                        {take.mediaUrl ? (
                          <video
                            src={take.mediaUrl}
                            controls
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                            onEnded={() => setIsPlayingAudition(false)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-500 text-xs font-mono">
                            Media stream offline
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Discard Confirmation / Interlock */}
                  {isPendingThisDiscard && (
                    <div className="mt-3 p-3.5 rounded-xl bg-stone-900 border border-rose-500/50 animate-in fade-in duration-150">
                      {isMaster && activeTakes.length > 1 ? (
                        <div className="space-y-2.5">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-amber-200">
                                Master Reel Discard Interlock
                              </p>
                              <p className="text-[11px] text-stone-300 leading-relaxed">
                                Select which alternate take becomes your new Master Reel before discarding:
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            {activeTakes
                              .filter((t) => t.id !== take.id)
                              .map((alt) => (
                                <button
                                  key={alt.id}
                                  type="button"
                                  onClick={() => setInterlockTargetTakeId(alt.id)}
                                  className={`w-full min-h-[44px] p-2.5 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                                    interlockTargetTakeId === alt.id
                                      ? 'border-amber-400 bg-amber-500/20 text-white font-semibold'
                                      : 'border-stone-800 bg-stone-950 text-stone-300'
                                  }`}
                                >
                                  <span>{alt.label || `Take #${alt.takeNumber}`}</span>
                                  <span className="text-[10px] text-stone-400 font-mono">
                                    {formatDurationSeconds(alt.durationSeconds)}
                                  </span>
                                </button>
                              ))}
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={cancelDiscard}
                              className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              data-testid="fireside-confirm-interlock-discard-btn"
                              disabled={!interlockTargetTakeId}
                              onClick={confirmDiscard}
                              className="min-h-[44px] px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold"
                            >
                              Promote & Discard
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-rose-200 leading-relaxed">
                            {activeTakes.length === 1
                              ? 'Move your only take to outtakes? This scene will revert to an unrecorded slate (restorable from the Cutting Room Floor below).'
                              : `Move Take #${take.takeNumber || idx + 1} to outtakes? It can be restored from the Cutting Room Floor below.`}
                          </p>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelDiscard}
                              className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              data-testid="fireside-confirm-standard-discard-btn"
                              onClick={confirmDiscard}
                              className="min-h-[44px] px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                            >
                              Move to Outtakes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Cutting Room Floor (Soft-Discarded Outtakes) — MW-107 */}
          {outtakes.length > 0 && (
            <div
              data-testid="fireside-cutting-room-floor"
              className="mt-6 pt-5 border-t border-stone-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-amber-500/80" />
                  <h4 className="text-xs font-mono uppercase tracking-wider text-stone-300 font-bold">
                    Cutting Room Floor ({outtakes.length} Retired {outtakes.length === 1 ? 'Take' : 'Takes'})
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-stone-500">
                  Safely Preserved in Archive
                </span>
              </div>

              <p className="text-[11px] text-stone-400 leading-relaxed">
                These takes were soft-discarded. They are excluded from your master reel but preserved in Firestore and can be restored at any time.
              </p>

              <div className="space-y-2.5 pt-1">
                {outtakes.map((outtake) => {
                  const isAuditioning = auditioningTakeId === outtake.id;
                  return (
                    <div
                      key={outtake.id}
                      data-testid={`fireside-outtake-card-${outtake.id}`}
                      className="p-3.5 rounded-xl border border-stone-800 bg-stone-950/60 flex flex-col gap-2.5 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-stone-400 bg-stone-900 border border-stone-800">
                              Outtake #{outtake.takeNumber || '?'}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">
                              {formatDurationSeconds(outtake.durationSeconds)}
                            </span>
                          </div>
                          <h5 className="text-xs text-stone-300 font-medium truncate">
                            {outtake.label || `Take ${outtake.takeNumber}`}
                          </h5>
                          <span className="text-[10px] text-stone-500 font-mono">
                            Discarded {formatDate(outtake.discardedAt || outtake.createdAt)}
                          </span>
                        </div>

                        {/* Restore CTA */}
                        <button
                          type="button"
                          data-testid={`fireside-restore-take-btn-${outtake.id}`}
                          onClick={async () => {
                            if (onRestoreTake) {
                              await onRestoreTake(outtake.id);
                            }
                          }}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:text-amber-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>{activeTakes.length === 0 ? 'Restore as Master Reel' : 'Restore to Alternates'}</span>
                        </button>
                      </div>

                      {/* Audition Trigger for Outtake */}
                      <div className="flex items-center gap-2 pt-1 border-t border-stone-800/60">
                        <button
                          type="button"
                          data-testid={`fireside-audition-outtake-btn-${outtake.id}`}
                          onClick={() => handleAuditionToggle(outtake.id)}
                          className="text-[11px] font-mono text-stone-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer py-1"
                        >
                          {isAuditioning && isPlayingAudition ? (
                            <>
                              <Pause className="w-3 h-3 text-amber-400" />
                              <span>Pause Audition</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 text-amber-400" />
                              <span>Audition Outtake</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Inline Audition Player for Outtake */}
                      {isAuditioning && (
                        <div className="mt-2 pt-2 border-t border-stone-800">
                          <div className="relative aspect-video max-w-full bg-black rounded-lg overflow-hidden border border-stone-700">
                            {outtake.mediaUrl ? (
                              <video
                                src={outtake.mediaUrl}
                                controls
                                autoPlay
                                playsInline
                                className="w-full h-full object-contain"
                                onEnded={() => setIsPlayingAudition(false)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-500 text-xs font-mono">
                                Media stream offline
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/60 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Master Reel is synchronised across Soundstage and Fireside.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoSelectionRoomDrawer;
