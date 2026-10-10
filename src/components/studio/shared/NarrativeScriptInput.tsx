"use client";

import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DetectedAnchor } from '@/utils/sensoryAnchors';
import { useSensoryHighlight } from '@/hooks/studio/useSensoryHighlight';
import {
  useScriptCadence,
  type CadenceMetrics,
  type ScribeSuggestion,
} from '@/hooks/studio/useScriptCadence';
import { ScribesMargin } from './ScribesMargin';

export type InputTypography = 'typewriter' | 'serif';
export type ScriptLanguage = 'en-GB' | 'gu' | 'pa' | 'hi';

export interface NarrativeScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  typography?: InputTypography;
  language?: ScriptLanguage | string;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  minRows?: number;
  rows?: number;
  minHeight?: string;
  showScribesMargin?: boolean;
  marginVariant?: 'dock' | 'drawer' | 'card';
  onSensoryMatchCountChange?: (counts: { soundscape: number; visual: number; aroma: number }) => void;
  onCadenceChange?: (metrics: CadenceMetrics) => void;
  onDetectedAnchorsChange?: (anchors: DetectedAnchor[]) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  textareaClassName?: string;
  containerClassName?: string;
  dataTestId?: string;
  ariaLabel?: string;
  hideAnchors?: boolean;
}

export interface NarrativeScriptInputRef {
  pulseAndSelectWord: (word: string, modality?: 'soundscape' | 'visual' | 'aroma') => void;
  applySuggestion: (suggestion: ScribeSuggestion) => void;
  insertCadenceMarker: (marker: '/' | '//') => void;
  focus: (options?: FocusOptions) => void;
  getTextarea: () => HTMLTextAreaElement | null;
}

/**
 * Shared typography styles guaranteeing 1:1 character geometry parity
 * between the interactive transparent <textarea> and the underlying sensory underline layer.
 */
const SERIF_STYLES: React.CSSProperties = {
  fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  fontSize: '1.125rem', // 18px (text-lg)
  lineHeight: '1.625', // leading-relaxed
  letterSpacing: 'normal',
  wordSpacing: 'normal',
  fontWeight: 400,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  padding: '0.875rem 2.5rem 1rem 0.875rem', // p-3.5 pr-10 pb-4
  margin: '0px',
  border: 'none',
  outline: 'none',
  boxSizing: 'border-box',
};

const TYPEWRITER_STYLES: React.CSSProperties = {
  fontFamily: '"Courier Prime", monospace',
  fontSize: '1.125rem', // 18px
  lineHeight: '1.6',
  letterSpacing: '0.025em',
  wordSpacing: 'normal',
  fontWeight: 400,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  padding: '0.875rem 1rem',
  margin: '0px',
  border: 'none',
  outline: 'none',
  boxSizing: 'border-box',
};

export const NarrativeScriptInput = forwardRef<NarrativeScriptInputRef, NarrativeScriptInputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      typography = 'serif',
      language = 'en-GB',
      rows = 5,
      minHeight = '140px',
      disabled = false,
      readOnly = false,
      showScribesMargin = false,
      marginVariant = 'dock',
      onSensoryMatchCountChange,
      onCadenceChange,
      onDetectedAnchorsChange,
      onFocus,
      onBlur,
      onKeyDown,
      className,
      textareaClassName,
      containerClassName,
      dataTestId = 'narrative-script-input-textarea',
      ariaLabel = 'Edit story script',
      hideAnchors = false,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const highlightLayerRef = useRef<HTMLDivElement | null>(null);

    const [pulsedWord, setPulsedWord] = useState<string | null>(null);
    const [pulsedModality, setPulsedModality] = useState<'soundscape' | 'visual' | 'aroma' | null>(null);
    const [isMarginOpen, setIsMarginOpen] = useState(showScribesMargin);
    const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resolvedStyles = typography === 'serif' ? SERIF_STYLES : TYPEWRITER_STYLES;
    const caretColor = typography === 'serif' ? '#f59e0b' : '#10b981';

    // 1. Sensory Highlight Hook (Single Source of Truth)
    const { dominantAnchors, tokens, modalityCounts } = useSensoryHighlight({
      value,
      hideAnchors,
      language,
      onDetectedAnchorsChange,
    });

    useEffect(() => {
      onSensoryMatchCountChange?.(modalityCounts);
    }, [modalityCounts, onSensoryMatchCountChange]);

    // 2. Script Cadence Hook (120 WPM Elder Pacing & Breathability)
    const { metrics, suggestions } = useScriptCadence(value);

    useEffect(() => {
      onCadenceChange?.(metrics);
    }, [metrics, onCadenceChange]);

    // 3. Cadence Marker Insertion Helper
    const insertCadenceMarker = useCallback(
      (marker: '/' | '//') => {
        const textarea = textareaRef.current;
        if (!textarea) {
          onChange(value ? `${value} ${marker} ` : `${marker} `);
          return;
        }

        const start = textarea.selectionStart ?? value.length;
        const end = textarea.selectionEnd ?? value.length;
        const before = value.substring(0, start);
        const after = value.substring(end);

        const spacerBefore = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
        const spacerAfter = after.length > 0 && !after.startsWith(' ') ? ' ' : '';
        const insertion = `${spacerBefore}${marker}${spacerAfter}`;

        const newValue = `${before}${insertion}${after}`;
        onChange(newValue);

        // Position cursor right after insertion
        setTimeout(() => {
          const newPos = start + insertion.length;
          textarea.focus();
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      },
      [value, onChange]
    );

    // 4. Suggestion Replacement Helper
    const applySuggestion = useCallback(
      (suggestion: ScribeSuggestion) => {
        if (!suggestion.replacement) return;

        if (suggestion.range) {
          const [start, end] = suggestion.range;
          const before = value.substring(0, start);
          const after = value.substring(end);
          onChange(`${before}${suggestion.replacement}${after}`);
        } else {
          // Fallback replacement via word match
          const rx = new RegExp(`\\b${suggestion.original}\\b`, 'i');
          const replaced = value.replace(rx, suggestion.replacement);
          onChange(replaced);
        }
      },
      [value, onChange]
    );

    // 5. Imperative Ref Contract (Rule 48.2 & SPEC-MW-134)
    useImperativeHandle(
      ref,
      () => ({
        pulseAndSelectWord: (targetWord: string, modality?: 'soundscape' | 'visual' | 'aroma') => {
          if (!targetWord) return;
          const cleanWord = targetWord.toLowerCase().trim();

          const matchedAnchor = dominantAnchors.find((a) => a.word.toLowerCase() === cleanWord);
          const resolvedModality = modality || (matchedAnchor?.type as 'soundscape' | 'visual' | 'aroma') || 'soundscape';

          setPulsedWord(cleanWord);
          setPulsedModality(resolvedModality);

          const textarea = textareaRef.current;
          if (textarea) {
            const idx = textarea.value.toLowerCase().indexOf(cleanWord);
            if (idx !== -1) {
              textarea.focus();
              textarea.setSelectionRange(idx, idx + cleanWord.length);
            }
          }

          if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
          pulseTimerRef.current = setTimeout(() => {
            setPulsedWord(null);
            setPulsedModality(null);
          }, 2200);
        },
        applySuggestion,
        insertCadenceMarker,
        focus: (options?: FocusOptions) => {
          textareaRef.current?.focus(options);
        },
        getTextarea: () => textareaRef.current,
      }),
      [dominantAnchors, applySuggestion, insertCadenceMarker]
    );

    useEffect(() => {
      return () => {
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      };
    }, []);

    // Sync textarea height smoothly
    useLayoutEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.max(
          textareaRef.current.scrollHeight,
          parseInt(minHeight, 10) || 140
        )}px`;
      }
    }, [value, minHeight]);

    return (
      <div className={cn('w-full flex flex-col lg:flex-row items-start gap-4', className)}>
        {/* MAIN DUAL-LAYER ZERO-DRIFT CANVAS */}
        <div className="flex-1 w-full space-y-2">
          <div
            ref={containerRef}
            style={{ minHeight }}
            className={cn(
              'relative grid w-full rounded-xl bg-[#111111] border border-amber-500/35 transition-all overflow-hidden',
              'focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/30',
              containerClassName
            )}
          >
            {/* UNDERLYING HIGHLIGHT LAYER (Pointer-events-none, strictly synced typography) */}
            <div
              ref={highlightLayerRef}
              aria-hidden="true"
              data-testid="narrative-script-input-highlight-layer"
              style={{
                ...resolvedStyles,
                gridArea: '1 / 1 / 2 / 2',
              }}
              className="z-10 pointer-events-none text-white w-full select-none custom-scrollbar overflow-y-auto"
            >
              {tokens.length === 0 ? null : (
                tokens.map((token: string, idx: number) => {
                  const clean = token.toLowerCase();
                  const matchingAnchor = !hideAnchors
                    ? dominantAnchors.find((a) => a.word.toLowerCase() === clean)
                    : null;
                  const isAnchor = Boolean(matchingAnchor);
                  const anchorModality = matchingAnchor?.type;
                  const isPulsed =
                    isAnchor &&
                    pulsedWord !== null &&
                    matchingAnchor?.word.toLowerCase() === pulsedWord;

                  return (
                    <span
                      key={`${token}-${idx}`}
                      data-token-index={idx}
                      data-anchor-word={isAnchor ? clean : undefined}
                      data-anchor-modality={anchorModality}
                      className={cn(
                        'px-0 mx-0 font-normal',
                        isAnchor && 'border-b-2 transition-colors duration-300',
                        isAnchor &&
                          anchorModality === 'soundscape' &&
                          'border-sky-400/80 bg-sky-500/15 text-sky-100',
                        isAnchor &&
                          anchorModality === 'visual' &&
                          'border-emerald-400/80 bg-emerald-500/15 text-emerald-100',
                        isAnchor &&
                          anchorModality === 'aroma' &&
                          'border-amber-400/80 bg-amber-500/15 text-amber-100',
                        isPulsed && 'z-30 ring-2 ring-offset-0 transition-all duration-200',
                        isPulsed &&
                          pulsedModality === 'soundscape' &&
                          'ring-sky-400 bg-sky-400/30 text-white shadow-[0_0_20px_rgba(56,189,248,0.8)]',
                        isPulsed &&
                          pulsedModality === 'visual' &&
                          'ring-emerald-400 bg-emerald-400/30 text-white shadow-[0_0_20px_rgba(16,185,129,0.8)]',
                        isPulsed &&
                          pulsedModality === 'aroma' &&
                          'ring-amber-400 bg-amber-400/30 text-white shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                      )}
                    >
                      {token}
                    </span>
                  );
                })
              )}
            </div>

            {/* TOP INTERACTIVE TEXTAREA (Guardrail 2: iOS inertial scroll & Extension Shields) */}
            <textarea
              ref={textareaRef}
              data-testid={dataTestId}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang={language}
              rows={rows}
              disabled={disabled}
              readOnly={readOnly}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              data-enable-grammarly="false"
              data-gramm="false"
              data-gramm_editor="false"
              onScroll={(e) => {
                if (highlightLayerRef.current) {
                  highlightLayerRef.current.scrollTop = e.currentTarget.scrollTop;
                  highlightLayerRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
              aria-label={ariaLabel}
              style={{
                ...resolvedStyles,
                gridArea: '1 / 1 / 2 / 2',
                color: value ? 'transparent' : 'inherit',
                caretColor,
                overscrollBehavior: 'contain',
              }}
              className={cn(
                'relative z-20 w-full resize-none bg-transparent outline-none focus:outline-none custom-scrollbar overflow-y-auto',
                'selection:bg-amber-500/30 selection:text-amber-200',
                'placeholder:text-stone-500 placeholder:italic',
                disabled && 'opacity-50 cursor-not-allowed',
                textareaClassName
              )}
            />
          </div>

          {/* Collapsible Mobile Scribe Badge */}
          {marginVariant === 'drawer' && (
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <button
                type="button"
                data-testid="toggle-scribes-margin-btn"
                onClick={() => setIsMarginOpen(!isMarginOpen)}
                className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {suggestions.length > 0
                    ? `✨ ${suggestions.length} Scribe Note${suggestions.length > 1 ? 's' : ''}`
                    : '✨ Scribe Clean'}
                </span>
              </button>

              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>~{Math.max(metrics.estimatedSpokenSeconds, 0)}s spoken</span>
              </span>
            </div>
          )}
        </div>

        {/* SIDE-BY-SIDE SCRIBE'S MARGIN (Desktop Dock or Active Drawer) */}
        {(showScribesMargin || (marginVariant === 'drawer' && isMarginOpen)) && (
          <ScribesMargin
            metrics={metrics}
            suggestions={suggestions}
            onApplySuggestion={applySuggestion}
            onInsertCadenceMarker={insertCadenceMarker}
            variant={marginVariant}
            isOpen={isMarginOpen}
            onClose={marginVariant === 'drawer' ? () => setIsMarginOpen(false) : undefined}
          />
        )}
      </div>
    );
  }
);

NarrativeScriptInput.displayName = 'NarrativeScriptInput';
