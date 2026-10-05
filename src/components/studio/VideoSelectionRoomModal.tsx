'use client';

/**
 * 🎬 Video Selection Room Modal — Desktop Soundstage (Act IV & Act V)
 *
 * Milestone: MW-106 (Ticket #315)
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Universal Non-Degradation, Rule 20 British English Orthography, Rule 12 Zero-Latency Optimistic UI)
 *
 * Provides a darkroom screening suite for reviewing, auditioning, reordering,
 * and designating the Theatrical Master Reel across all recorded takes.
 * Enforces the Active Master Discard Interlock (MW-106 Amendment 3).
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
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { MemoirTake } from '@/types/curriculum';

export interface VideoSelectionRoomModalProps {
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

export const VideoSelectionRoomModal: React.FC<VideoSelectionRoomModalProps> = ({
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
  // Sort takes by order or default array sequence
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
      // Find the first alternate take as default fallback
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
      aria-label="Video Selection Room"
      data-testid="video-selection-room-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-amber-500/30 bg-stone-950/95 shadow-[0_0_60px_rgba(245,158,11,0.2)] overflow-hidden text-left"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-800 flex items-start justify-between gap-4 bg-gradient-to-r from-stone-900/80 to-stone-950">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Theatrical Multi-Take Suite
              </span>
              <span className="text-xs font-mono text-stone-400">
                {activeTakes.length} {activeTakes.length === 1 ? 'Take' : 'Takes'} Recorded
              </span>
            </div>
            <h3 className="text-xl font-serif text-white flex items-center gap-2">
              <span>Theatrical Reel Stack: {sceneTitle}</span>
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Audition takes, arrange sequence order, and designate your active Theatrical Master Reel for cinema premiere.
            </p>
          </div>
          <button
            type="button"
            data-testid="close-video-selection-room-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white border border-stone-800 hover:border-stone-700 transition cursor-pointer"
            aria-label="Close Selection Room"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Takes Filmstrip / Stack View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTakes.length === 0 ? (
            <div className="p-12 text-center text-stone-500 space-y-3">
              <Film className="w-12 h-12 mx-auto stroke-1 text-stone-600" />
              <p className="text-sm font-serif text-stone-400">
                {outtakes.length > 0
                  ? 'All recorded takes currently retired to the Cutting Room Floor below.'
                  : 'No recorded takes in the stack yet.'}
              </p>
              <p className="text-xs text-stone-500">Record a performance take in Act III to populate this room.</p>
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
                  data-testid={`take-card-${take.id}`}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isMaster
                      ? 'border-amber-500/60 bg-gradient-to-r from-amber-950/20 via-stone-900/60 to-stone-900/60 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                      : 'border-stone-800 bg-stone-900/50 hover:border-stone-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Take Info & Badges */}
                    <div className="flex items-start gap-3.5">
                      <div className="flex flex-col gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          title="Move up in stack"
                          className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none text-stone-300 transition"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === sortedTakes.length - 1}
                          title="Move down in stack"
                          className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none text-stone-300 transition"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {isMaster ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-stone-950 flex items-center gap-1 shadow-sm">
                              <Star className="w-3 h-3 fill-stone-950" />
                              Active Master Reel
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-stone-400 bg-stone-800/80 border border-stone-700">
                              Alternate Take #{take.takeNumber || idx + 1}
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-stone-300 bg-stone-800 flex items-center gap-1">
                            {isDesktop ? (
                              <Monitor className="w-3 h-3 text-sky-400" />
                            ) : (
                              <Smartphone className="w-3 h-3 text-emerald-400" />
                            )}
                            {isDesktop ? 'Desktop Soundstage' : 'Fireside Mobile'}
                          </span>

                          <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDurationSeconds(take.durationSeconds)}
                          </span>

                          <span className="text-[10px] font-mono text-stone-500">
                            Recorded {formatDate(take.createdAt)}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-semibold text-white">
                          {take.label || `Take ${take.takeNumber || idx + 1}`}
                        </h4>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                      {/* Audition Play Button */}
                      <button
                        type="button"
                        data-testid={`audition-btn-${take.id}`}
                        onClick={() => handleAuditionToggle(take.id)}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                          isAuditioning && isPlayingAudition
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                        }`}
                      >
                        {isAuditioning && isPlayingAudition ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause Audition</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Audition Take</span>
                          </>
                        )}
                      </button>

                      {/* Promote Master Button */}
                      {!isMaster && (
                        <button
                          type="button"
                          data-testid={`promote-master-btn-${take.id}`}
                          onClick={() => onPromoteMaster(take.id)}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          <span>★ Set as Master Reel</span>
                        </button>
                      )}

                      {/* Discard Button */}
                      <button
                        type="button"
                        data-testid={`discard-take-btn-${take.id}`}
                        onClick={() => initiateDiscard(take.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-rose-950/40 border border-stone-800 hover:border-rose-500/50 text-stone-400 hover:text-rose-300 text-xs transition cursor-pointer"
                        title="Discard this take"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Audition Player View */}
                  {isAuditioning && (
                    <div className="mt-4 pt-4 border-t border-stone-800/80 animate-in fade-in duration-200">
                      <div className="relative aspect-video max-w-lg mx-auto bg-black rounded-xl overflow-hidden border border-amber-500/30 shadow-lg">
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
                            Media stream offline or processing
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Active Master Discard Interlock / Inline Discard Confirmation */}
                  {isPendingThisDiscard && (
                    <div className="mt-4 p-4 rounded-xl bg-stone-900 border border-rose-500/50 animate-in fade-in duration-150">
                      {isMaster && activeTakes.length > 1 ? (
                        /* Interlock: Discarding active master requires explicit fallback designation */
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-amber-200">
                                Active Master Discard Interlock
                              </p>
                              <p className="text-xs text-stone-300 leading-relaxed mt-0.5">
                                You are discarding your active Theatrical Master Reel. Please select which alternate take should become the new Master Reel:
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {activeTakes
                              .filter((t) => t.id !== take.id)
                              .map((alt) => (
                                <button
                                  key={alt.id}
                                  type="button"
                                  onClick={() => setInterlockTargetTakeId(alt.id)}
                                  className={`p-2.5 rounded-lg border text-left text-xs transition cursor-pointer ${
                                    interlockTargetTakeId === alt.id
                                      ? 'border-amber-400 bg-amber-500/20 text-white font-semibold'
                                      : 'border-stone-800 bg-stone-950 text-stone-300 hover:border-stone-700'
                                  }`}
                                >
                                  <div className="font-medium text-amber-200">
                                    {alt.label || `Take #${alt.takeNumber}`}
                                  </div>
                                  <div className="text-[10px] text-stone-400">
                                    {formatDurationSeconds(alt.durationSeconds)} • {formatDate(alt.createdAt)}
                                  </div>
                                </button>
                              ))}
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={cancelDiscard}
                              className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              data-testid="confirm-interlock-discard-btn"
                              disabled={!interlockTargetTakeId}
                              onClick={confirmDiscard}
                              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
                            >
                              Promote Selected & Discard Old Master
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Standard discard confirmation */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-rose-300 text-xs">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>
                              {activeTakes.length === 1
                                ? 'Move your only take to outtakes? This will revert this scene to an unrecorded slate (restorable from the Cutting Room Floor below).'
                                : 'Move this take to outtakes? It can be restored from the Cutting Room Floor below.'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={cancelDiscard}
                              className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              data-testid="confirm-standard-discard-btn"
                              onClick={confirmDiscard}
                              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
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
              data-testid="desktop-cutting-room-floor"
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
                      data-testid={`desktop-outtake-card-${outtake.id}`}
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
                        {onRestoreTake && (
                          <button
                            type="button"
                            data-testid={`desktop-restore-take-btn-${outtake.id}`}
                            onClick={async () => {
                              await onRestoreTake(outtake.id);
                            }}
                            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:text-amber-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                            <span>{activeTakes.length === 0 ? 'Restore as Master Reel' : 'Restore to Alternates'}</span>
                          </button>
                        )}
                      </div>

                      {/* Audition Trigger for Outtake */}
                      <div className="flex items-center gap-2 pt-1 border-t border-stone-800/60">
                        <button
                          type="button"
                          data-testid={`desktop-audition-outtake-btn-${outtake.id}`}
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

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-800/80 bg-stone-900/60 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>The designated Master Reel is automatically synchronised across all devices.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoSelectionRoomModal;
