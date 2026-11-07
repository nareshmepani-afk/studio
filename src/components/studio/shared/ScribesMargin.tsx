"use client";

import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  Wind,
  Check,
  X,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CadenceMetrics, ScribeSuggestion } from '@/hooks/studio/useScriptCadence';
import { formatSpokenDuration } from '@/hooks/studio/useScriptCadence';
import { renderPrompterCadenceHtml } from '@/utils/scriptFormatter';

export interface ScribesMarginProps {
  metrics: CadenceMetrics;
  suggestions: ScribeSuggestion[];
  scriptText?: string;
  onApplySuggestion?: (suggestion: ScribeSuggestion) => void;
  onDismissSuggestion?: (suggestionId: string) => void;
  onInsertCadenceMarker?: (marker: '/' | '//') => void;
  onSplitBreathRun?: (runIndex?: number) => void;
  onClearCadenceMarkers?: () => void;
  variant?: 'dock' | 'drawer' | 'card';
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  testIdPrefix?: string;
}

/**
 * The Scribe's Margin
 * SPEC-MW-134 / SPEC-MW-178 (Live Teleprompter Preview, Active Cadence HUD & Diaspora Voice Shield)
 *
 * Renders an isolated, non-invasive side card (Desktop) or drawer (Mobile)
 * displaying 120 WPM spoken pace, active punctuation + custom breath pauses,
 * Live Teleprompter Cadence Preview, Diaspora & UK Voice Shield badges,
 * British English orthography notes, and AI cliché warnings with 1-click acceptance.
 */
export const ScribesMargin: React.FC<ScribesMarginProps> = ({
  metrics,
  suggestions,
  scriptText,
  onApplySuggestion,
  onDismissSuggestion,
  onInsertCadenceMarker,
  onSplitBreathRun,
  onClearCadenceMarkers,
  variant = 'dock',
  isOpen = true,
  onClose,
  className,
  testIdPrefix = 'scribes-margin',
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(true);

  const activeSuggestions = suggestions.filter((s) => !dismissedIds.has(s.id));
  const activeShortCues = metrics.activeShortCueCount ?? metrics.shortPauseCount;
  const activeDeepCues = metrics.activeDeepCueCount ?? metrics.deepPauseCount;
  const activeTotalCues = metrics.activeTotalCueCount ?? metrics.breathPauseCount;
  const diasporaTerms = metrics.shieldedDiasporaTerms ?? [];
  const ukTerms = metrics.shieldedUkTerms ?? [];
  const hasShieldBadges = diasporaTerms.length > 0 || ukTerms.length > 0;
  const hasScriptPreview = Boolean(scriptText && scriptText.trim().length > 0);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    onDismissSuggestion?.(id);
  };

  const handleApply = (suggestion: ScribeSuggestion) => {
    onApplySuggestion?.(suggestion);
    handleDismiss(suggestion.id);
  };

  if (!isOpen) return null;

  return (
    <aside
      data-testid={testIdPrefix}
      className={cn(
        'flex flex-col bg-[#0e0d0c] border border-stone-800 rounded-2xl p-4 text-xs font-mono text-stone-300 shadow-xl',
        variant === 'dock' && 'w-full lg:w-[280px] shrink-0 space-y-4',
        variant === 'drawer' && 'w-full space-y-4 border-amber-500/30 shadow-2xl',
        variant === 'card' && 'w-full space-y-3',
        className
      )}
    >
      {/* 1. HEADER HUD: Pacing & Title */}
      <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">The Scribe&apos;s Margin</h4>
            <span className="text-[10px] text-stone-400">Act III Spoken Cadence HUD</span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Close Scribe's Margin"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. TELEPROMPTER CADENCE METRICS (120 WPM Standard) */}
      <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800/70 space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-stone-400 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Spoken Duration:</span>
          </span>
          <span
            data-testid={`${testIdPrefix}-spoken-duration`}
            className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20"
          >
            ⏱️ ~{formatSpokenDuration(metrics.estimatedSpokenSeconds)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-400 pt-1 border-t border-stone-800/60">
          <div>
            <span>Words: </span>
            <strong className="text-stone-200">{metrics.wordCount}</strong>
          </div>
          <div>
            <span>Elder Pace: </span>
            <strong className="text-stone-200">120 WPM</strong>
          </div>
          <div className="col-span-2 flex items-center justify-between flex-wrap gap-1 pt-0.5 border-t border-stone-800/40">
            <span>Breath Cues: </span>
            <span data-testid={`${testIdPrefix}-active-cues`} className="flex items-center gap-1.5 flex-wrap">
              <strong className="text-stone-200">{activeTotalCues}</strong>
              <span className="text-stone-500">(</span>
              <span className="text-emerald-300 font-bold" title="Short clause pauses (commas + custom /)">{activeShortCues} /</span>
              <span className="text-stone-500">&middot;</span>
              <span className="text-sky-300 font-bold" title="Deep sentence breaths (full stops + custom //)">{activeDeepCues} //</span>
              <span className="text-stone-500">)</span>
              {metrics.breathPauseCount > 0 && (
                <span
                  data-testid={`${testIdPrefix}-custom-pause-badge`}
                  className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold"
                >
                  +{metrics.breathPauseCount} custom
                </span>
              )}
            </span>
          </div>
          <div className="col-span-2 flex items-center justify-between pt-0.5 border-t border-stone-800/40">
            <span>Long Runs (&gt;24w): </span>
            <strong className={metrics.longRunSentenceCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
              {metrics.longRunSentenceCount}
            </strong>
          </div>
        </div>

        {/* Cadence Marker Quick-Insert Keys & 1-Click Clear Undo */}
        {(onInsertCadenceMarker || onClearCadenceMarkers) && (
          <div className="pt-2 border-t border-stone-800/60 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-stone-400">Insert Breath:</span>
            {onInsertCadenceMarker && (
              <>
                <button
                  type="button"
                  data-testid={`${testIdPrefix}-insert-short-pause`}
                  onClick={() => onInsertCadenceMarker('/')}
                  title="Insert short breath pause (~0.2s pause on teleprompter)"
                  className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <span>/ Short (~0.2s)</span>
                </button>
                <button
                  type="button"
                  data-testid={`${testIdPrefix}-insert-deep-pause`}
                  onClick={() => onInsertCadenceMarker('//')}
                  title="Insert deep breath pause (~0.5s pause on teleprompter)"
                  className="px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <span>// Deep (~0.5s)</span>
                </button>
              </>
            )}
            {onClearCadenceMarkers && metrics.breathPauseCount > 0 && (
              <button
                type="button"
                data-testid={`${testIdPrefix}-clear-pauses`}
                onClick={onClearCadenceMarkers}
                title="Clear all manual breath pauses (/ and //) and restore clean prose"
                className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>↺ Clear</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2B. LIVE TELEPROMPTER CADENCE PREVIEW (SPEC-MW-178) */}
      {hasScriptPreview && scriptText && (
        <div className="rounded-xl bg-stone-950/70 border border-stone-800/70 overflow-hidden">
          <button
            type="button"
            data-testid={`${testIdPrefix}-preview-toggle`}
            onClick={() => setIsPreviewOpen((prev) => !prev)}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-[10px] font-bold text-stone-200 hover:bg-white/5 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Teleprompter Preview</span>
              <span className="text-[9px] font-normal text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                Auto-Breath ON
              </span>
            </span>
            <span className="flex items-center gap-1 text-[9px] text-stone-400">
              <span>{isPreviewOpen ? 'Hide' : 'Show'}</span>
              {isPreviewOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </button>

          {isPreviewOpen && (
            <div
              data-testid={`${testIdPrefix}-teleprompter-preview`}
              spellCheck={false}
              lang="en-GB"
              aria-readonly="true"
              className="px-3 py-2.5 border-t border-stone-800/70 bg-black/50 text-xs font-serif leading-relaxed text-stone-100 max-h-40 overflow-y-auto custom-scrollbar select-none"
              dangerouslySetInnerHTML={{
                __html: renderPrompterCadenceHtml(scriptText, {
                  autoBreath: true,
                  highlightSensory: true,
                }),
              }}
            />
          )}
        </div>
      )}

      {/* 2C. DIASPORA & UK VOICE SHIELD BADGES (SPEC-MW-178) */}
      {hasShieldBadges && (
        <div
          data-testid={`${testIdPrefix}-voice-shield-badges`}
          className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/25 space-y-2"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Diaspora &amp; UK Voice Shield</span>
            </span>
            <span className="text-[9px] font-normal text-emerald-400/80">
              {diasporaTerms.length + ukTerms.length} protected
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {diasporaTerms.map((term) => (
              <span
                key={`diaspora-${term.toLowerCase()}`}
                title="Protected South Asian / Diaspora heritage vocabulary"
                className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/30 text-[9px] font-medium"
              >
                🛡️ {term}
              </span>
            ))}
            {ukTerms.map((term) => (
              <span
                key={`uk-${term.toLowerCase()}`}
                title="Verified British / Commonwealth English spelling (Rule 20)"
                className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-200 border border-purple-500/30 text-[9px] font-medium"
              >
                🇬🇧 {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. SCRIBE SUGGESTIONS & NOTES */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[320px] custom-scrollbar pr-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-300 px-0.5">
          <span>Scribe Notes ({activeSuggestions.length})</span>
          {activeSuggestions.length === 0 && (
            <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-normal">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Voice Protected</span>
            </span>
          )}
        </div>

        {activeSuggestions.length === 0 ? (
          <div
            data-testid={`${testIdPrefix}-clean-status`}
            className="p-3 rounded-xl bg-stone-950/40 border border-dashed border-stone-800 text-center space-y-1"
          >
            <span className="text-base">✨</span>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Your narrative is clean, breathable, and aligned with UK English standards.
            </p>
          </div>
        ) : (
          activeSuggestions.map((suggestion) => {
            const isOrthography = suggestion.type === 'orthography';
            const isBreath = suggestion.type === 'breathability';
            const isCliche = suggestion.type === 'cliche';

            return (
              <div
                key={suggestion.id}
                data-testid={`${testIdPrefix}-suggestion-${suggestion.id}`}
                className={cn(
                  'p-2.5 rounded-xl border text-[11px] space-y-2 transition-all',
                  isOrthography && 'bg-purple-950/20 border-purple-500/30 text-purple-200',
                  isBreath && 'bg-amber-950/20 border-amber-500/30 text-amber-200',
                  isCliche && 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                )}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    {isOrthography && (
                      <>
                        <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-purple-300 uppercase text-[9px] tracking-wider">UK Orthography</span>
                      </>
                    )}
                    {isBreath && (
                      <>
                        <Wind className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-300 uppercase text-[9px] tracking-wider">Breath Run</span>
                      </>
                    )}
                    {isCliche && (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-rose-300 uppercase text-[9px] tracking-wider">AI Cliché</span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismiss(suggestion.id)}
                    className="text-stone-400 hover:text-white p-0.5 transition cursor-pointer"
                    title="Dismiss suggestion"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-[10px] text-stone-300 leading-relaxed">{suggestion.message}</p>

                {/* Diff replacement or suggestion action */}
                {suggestion.replacement ? (
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="line-through text-stone-400">&ldquo;{suggestion.original}&rdquo;</span>
                      <ChevronRight className="w-3 h-3 text-stone-400" />
                      <strong className="text-emerald-300 font-bold">&ldquo;{suggestion.replacement}&rdquo;</strong>
                    </div>

                    <button
                      type="button"
                      data-testid={`${testIdPrefix}-accept-${suggestion.id}`}
                      onClick={() => handleApply(suggestion)}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Accept</span>
                    </button>
                  </div>
                ) : isBreath && (onSplitBreathRun || onInsertCadenceMarker) ? (
                  <div className="pt-1 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      data-testid={`${testIdPrefix}-split-breath-${suggestion.id}`}
                      onClick={() => {
                        if (onSplitBreathRun) {
                          const runIdx = parseInt(suggestion.id.replace(/\D/g, ''), 10);
                          onSplitBreathRun(isNaN(runIdx) ? undefined : runIdx);
                        } else {
                          onInsertCadenceMarker?.('/');
                        }
                        handleDismiss(suggestion.id);
                      }}
                      title="Split long sentence at natural midpoint clause hinge without cursor placement"
                      className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Wind className="w-3 h-3" />
                      <span>+ Add Breath (/)</span>
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
