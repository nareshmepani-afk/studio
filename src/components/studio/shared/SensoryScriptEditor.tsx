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
import { cn } from '@/lib/utils';
import {
  detectSensoryAnchors,
  filterDominantSensoryAnchors,
  type DetectedAnchor,
} from '@/utils/sensoryAnchors';

export interface SensoryScriptEditorRef {
  pulseAndSelectWord: (word: string, modality?: 'soundscape' | 'visual' | 'aroma') => void;
  focus: (options?: FocusOptions) => void;
  getTextarea: () => HTMLTextAreaElement | null;
}

export interface SensoryScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  typography?: 'serif' | 'typewriter';
  className?: string;
  textareaClassName?: string;
  containerClassName?: string;
  rows?: number;
  minHeight?: string;
  disabled?: boolean;
  readOnly?: boolean;
  lang?: string;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  ariaLabel?: string;
  dataTestId?: string;
  hideAnchors?: boolean;
  onDetectedAnchorsChange?: (anchors: DetectedAnchor[]) => void;
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

export const SensoryScriptEditor = forwardRef<SensoryScriptEditorRef, SensoryScriptEditorProps>(
  (
    {
      value,
      onChange,
      placeholder,
      typography = 'serif',
      className,
      textareaClassName,
      containerClassName,
      rows = 5,
      minHeight = '140px',
      disabled = false,
      readOnly = false,
      lang = 'en-GB',
      onFocus,
      onBlur,
      onKeyDown,
      ariaLabel = 'Edit story script',
      dataTestId = 'sensory-script-editor-textarea',
      hideAnchors = false,
      onDetectedAnchorsChange,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const highlightLayerRef = useRef<HTMLDivElement | null>(null);

    const [pulsedWord, setPulsedWord] = useState<string | null>(null);
    const [pulsedModality, setPulsedModality] = useState<'soundscape' | 'visual' | 'aroma' | null>(null);
    const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resolvedStyles = typography === 'serif' ? SERIF_STYLES : TYPEWRITER_STYLES;
    const caretColor = typography === 'serif' ? '#f59e0b' : '#10b981';

    // 1. Unified Sensory Anchor Detection
    const rawAnchors = useMemo(() => {
      if (!value || hideAnchors) return [];
      return detectSensoryAnchors(value);
    }, [value, hideAnchors]);

    const dominantAnchors = useMemo(() => {
      if (!rawAnchors.length) return [];
      return filterDominantSensoryAnchors(rawAnchors);
    }, [rawAnchors]);

    // Dispatch detected anchors upstream if requested
    useEffect(() => {
      onDetectedAnchorsChange?.(rawAnchors);
    }, [rawAnchors, onDetectedAnchorsChange]);

    // 2. Tokenization Engine: Splits ONLY at anchor boundaries, preserving Indic conjuncts, matras, and non-anchor text as unbroken contiguous runs
    const tokens = useMemo(() => {
      if (!value) return [];
      if (hideAnchors || dominantAnchors.length === 0) {
        return [value];
      }

      const sortedAnchors = [...dominantAnchors].sort((a, b) => b.word.length - a.word.length);
      const anchorPattern = sortedAnchors.map((a) => a.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      // Unicode-aware word boundary regex: matches anchor words while respecting letter/mark clusters across all languages (including Gujarati, Punjabi, and Hindi)
      const regex = new RegExp(`(?<![\\p{L}\\p{N}\\p{M}])(${anchorPattern})(?![\\p{L}\\p{N}\\p{M}])`, 'gui');

      return value.split(regex).filter((t: string) => t !== undefined && t !== '');
    }, [value, hideAnchors, dominantAnchors]);

    // 3. Imperative Ref Contract (Rule 48.2)
    useImperativeHandle(
      ref,
      () => ({
        pulseAndSelectWord: (targetWord: string, modality?: 'soundscape' | 'visual' | 'aroma') => {
          if (!targetWord) return;
          const cleanWord = targetWord.toLowerCase().trim();

          // Determine modality from dominant anchors if not provided
          const matchedAnchor = dominantAnchors.find((a) => a.word.toLowerCase() === cleanWord);
          const resolvedModality = modality || (matchedAnchor?.type as 'soundscape' | 'visual' | 'aroma') || 'soundscape';

          setPulsedWord(cleanWord);
          setPulsedModality(resolvedModality);

          // Focus textarea & native caret selection
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
        focus: (options?: FocusOptions) => {
          textareaRef.current?.focus(options);
        },
        getTextarea: () => textareaRef.current,
      }),
      [dominantAnchors]
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
      <div
        ref={containerRef}
        style={{ minHeight }}
        className={cn(
          'relative grid w-full rounded-xl bg-[#111111] border border-amber-500/35 transition-all overflow-hidden',
          'focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/30',
          containerClassName,
          className
        )}
      >
        {/* UNDERLYING HIGHLIGHT LAYER (Pointer-events-none, strictly synced typography) */}
        <div
          ref={highlightLayerRef}
          aria-hidden="true"
          data-testid="sensory-script-editor-highlight-layer"
          style={{
            ...resolvedStyles,
            gridArea: '1 / 1 / 2 / 2',
          }}
          className="z-10 pointer-events-none text-white w-full select-none custom-scrollbar overflow-y-auto"
        >
          {tokens.length === 0 && placeholder ? (
            <span className="text-stone-500 italic select-none">{placeholder}</span>
          ) : (
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

        {/* TOP INTERACTIVE TEXTAREA (Transparent text so highlights shine through, active cursor) */}
        <textarea
          ref={textareaRef}
          data-testid={dataTestId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={true}
          autoCorrect="on"
          autoCapitalize="sentences"
          lang={lang}
          rows={rows}
          disabled={disabled}
          readOnly={readOnly}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
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
          }}
          className={cn(
            'relative z-20 w-full resize-none bg-transparent outline-none focus:outline-none custom-scrollbar overflow-y-auto',
            'selection:bg-amber-500/30 selection:text-amber-200',
            disabled && 'opacity-50 cursor-not-allowed',
            textareaClassName
          )}
        />
      </div>
    );
  }
);

SensoryScriptEditor.displayName = 'SensoryScriptEditor';
