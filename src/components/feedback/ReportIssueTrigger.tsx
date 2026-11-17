'use client';

import React from 'react';
import { Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportIssueTriggerProps {
  variant?: 'icon-pill' | 'footer-link' | 'menu-item';
  className?: string;
  label?: string;
  onTriggered?: () => void;
}

/**
 * Dispatches the global `open-telemetry-report` event listened to by Providers -> BugReportModal,
 * giving mobile (/studio/fireside) and desktop patrons a tactile equivalent to Ctrl + /.
 */
export function ReportIssueTrigger({
  variant = 'icon-pill',
  className,
  label = 'Report Issue',
  onTriggered,
}: ReportIssueTriggerProps) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('open-telemetry-report'));
    }
    onTriggered?.();
  };

  if (variant === 'footer-link') {
    return (
      <button
        type="button"
        onClick={handleClick}
        data-testid="HS_REPORT_ISSUE_BTN"
        className={cn(
          'inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-amber-400 cursor-pointer',
          className
        )}
      >
        <Bug className="w-3.5 h-3.5 text-amber-400/80" />
        <span>{label}</span>
      </button>
    );
  }

  if (variant === 'menu-item') {
    return (
      <button
        type="button"
        onClick={handleClick}
        data-testid="HS_REPORT_ISSUE_BTN"
        className={cn(
          'w-full min-h-[48px] p-3 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer',
          className
        )}
      >
        <div className="flex items-center space-x-3">
          <Bug className="h-5 w-5 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-[11px] text-slate-400">Capture studio diagnostics (Ctrl + /)</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid="HS_REPORT_ISSUE_BTN"
      title="Report an issue or glitch (Shortcut: Ctrl + /)"
      aria-label="Report Studio Issue"
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-mono text-stone-300 hover:text-amber-300 bg-stone-900/75 hover:bg-amber-500/15 border border-stone-700/80 hover:border-amber-500/40 transition-all cursor-pointer shrink-0',
        className
      )}
    >
      <Bug className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
