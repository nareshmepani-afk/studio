'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Bug,
  CheckCircle2,
  ClipboardCopy,
  ExternalLink,
  Film,
  Flame,
  Gift,
  GitCommit,
  RefreshCw,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export type DryRunStepStatus = 'PENDING' | 'PASS' | 'SNAG';

export interface DryRunStepState {
  status: DryRunStepStatus;
  note: string;
  loggedReportId?: string | null;
  updatedAtIso?: string | null;
}

export interface DryRunStoredState {
  commitSha: string;
  steps: Record<string, DryRunStepState>;
}

export interface DryRunStepDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  route: string;
  icon: 'soundstage' | 'fireside' | 'gift';
  checks: string[];
}

export const DRY_RUN_STORAGE_KEY = 'mw_founder_dryrun_v1';

export const FOUNDER_DRY_RUN_STEPS: DryRunStepDef[] = [
  {
    id: 'soundstage-e2e',
    order: 1,
    title: 'SoundStage End-to-End Dry Run (Acts I–V)',
    subtitle: 'Primary narrator journey — writing, AI synthesis, teleprompter recording, review & export.',
    route: '/studio',
    icon: 'soundstage',
    checks: [
      'Open or create a memory in Act I Scriptorium and verify UK English prose & auto-save',
      'Trigger Act II AI Weaver takes / Selection Deck and confirm clean spoken monologue (no screenplay cues)',
      'Run Act III Teleprompter & Record, verify Act IV Master Reel playback, and check Act V Export / Share controls',
    ],
  },
  {
    id: 'fireside-e2e',
    order: 2,
    title: 'Fireside Booth End-to-End Dry Run',
    subtitle: 'Guided prompt conversation flow — chapter prompt selection, recording & playback persistence.',
    route: '/studio/fireside',
    icon: 'fireside',
    checks: [
      'Select a Fireside prompt and confirm responsive layout (no clipped navbar items or overlapping badges)',
      'Record a short Fireside recollection and verify upload / save completes cleanly',
      'Reload the page and confirm the recorded Fireside entry persists and plays back smoothly',
    ],
  },
  {
    id: 'gifting-checkout-test',
    order: 3,
    title: 'Heirloom Gift & Checkout Sanity (Stripe Test Mode)',
    subtitle: 'Confirms gift dedication polish, voucher preview, and checkout hand-off before Step 4 Live Mode.',
    route: '/gift',
    icon: 'gift',
    checks: [
      'Draft a gift dedication and test AI Polish Dedication',
      'Verify voucher preview layout and pricing tier copy (£ / $)',
      'Confirm checkout session opens Stripe Test Mode cleanly without console errors',
    ],
  },
];

interface FounderDryRunConsoleProps {
  readyBugsCount?: number;
  onNavigateSuite?: (suite: 'releases' | 'bugs') => void;
}

export function formatDryRunChatPrompt(params: {
  step: DryRunStepDef;
  state: DryRunStepState;
  commitSha: string;
}): string {
  const { step, state, commitSha } = params;
  const statusLine =
    state.status === 'SNAG'
      ? `🔴 SNAG FOUND during Founder Dry Run`
      : state.status === 'PASS'
      ? `✅ PASS — Founder Dry Run verified`
      : `🧭 Dry Run Update`;

  return [
    `### ${statusLine}: ${step.title}`,
    `- **Route:** \`${step.route}\``,
    `- **Staging Commit SHA:** \`${commitSha || 'unknown'}\``,
    `- **Verdict:** ${state.status}`,
    ...(state.loggedReportId ? [`- **Logged Bug Report ID:** \`${state.loggedReportId}\``] : []),
    ...(state.note.trim() ? [`- **Founder Observation:** ${state.note.trim()}`] : []),
    '',
    'Please inspect and advise / stage fix in Walkthrough Batch Mode.',
  ].join('\n');
}

export function FounderDryRunConsole({
  readyBugsCount = 0,
  onNavigateSuite,
}: FounderDryRunConsoleProps) {
  const [liveSha, setLiveSha] = useState<string>('');
  const [storedSha, setStoredSha] = useState<string>('');
  const [stepsState, setStepsState] = useState<Record<string, DryRunStepState>>({});
  const [loggingStepId, setLoggingStepId] = useState<string | null>(null);

  // SSR-safe localStorage hydration
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(DRY_RUN_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DryRunStoredState>;
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed.commitSha === 'string') setStoredSha(parsed.commitSha);
            if (parsed.steps && typeof parsed.steps === 'object') setStepsState(parsed.steps);
          }
        }
      }
    } catch {
      // Non-fatal storage guard
    }

    fetch('/api/version', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (v?.commitSha) setLiveSha(String(v.commitSha).slice(0, 7));
      })
      .catch(() => null);
  }, []);

  const persistState = useCallback(
    (nextSteps: Record<string, DryRunStepState>, nextSha?: string) => {
      setStepsState(nextSteps);
      const effectiveSha = nextSha !== undefined ? nextSha : storedSha || liveSha;
      if (effectiveSha !== storedSha) setStoredSha(effectiveSha);
      try {
        if (typeof window !== 'undefined') {
          const payload: DryRunStoredState = { commitSha: effectiveSha, steps: nextSteps };
          window.localStorage.setItem(DRY_RUN_STORAGE_KEY, JSON.stringify(payload));
        }
      } catch {
        // Non-fatal storage guard
      }
    },
    [liveSha, storedSha]
  );

  const getStepState = (id: string): DryRunStepState =>
    stepsState[id] || { status: 'PENDING', note: '', loggedReportId: null, updatedAtIso: null };

  const setStepVerdict = (id: string, status: DryRunStepStatus) => {
    const current = getStepState(id);
    const nextSteps: Record<string, DryRunStepState> = {
      ...stepsState,
      [id]: {
        ...current,
        status,
        updatedAtIso: new Date().toISOString(),
      },
    };
    persistState(nextSteps, liveSha || storedSha);
  };

  const setStepNote = (id: string, note: string) => {
    const current = getStepState(id);
    persistState({
      ...stepsState,
      [id]: { ...current, note },
    });
  };

  const handleResetForNewBuild = () => {
    persistState({}, liveSha);
    toast.success('Dry-Run Runway Reset', {
      description: liveSha ? `Fresh dry run started for staging build ${liveSha}.` : 'All steps reset to Pending.',
    });
  };

  const handleCopyPrompt = async (step: DryRunStepDef) => {
    const promptText = formatDryRunChatPrompt({
      step,
      state: getStepState(step.id),
      commitSha: liveSha || storedSha || 'dev',
    });
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(promptText);
      }
      toast.success('Copied Prompt for Chat', {
        description: 'Paste straight into Antigravity / Gemini chat with exact SHA & route.',
      });
    } catch {
      toast.error('Clipboard Copy Blocked');
    }
  };

  const handleLogSnagToBugQueue = async (step: DryRunStepDef) => {
    const state = getStepState(step.id);
    const note = state.note.trim();
    const description = note
      ? `[DRY-RUN SNAG • ${step.title}] ${note}`
      : `[DRY-RUN SNAG • ${step.title}] Snag flagged during Founder staging dry run on ${step.route}.`;

    setLoggingStepId(step.id);
    try {
      const res = await fetch('/api/admin/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          path: step.route,
          description,
          status: 'OPEN',
          appVersion: liveSha ? `v1.1.0-beta.${liveSha}` : 'v1.1.0-beta',
          source: 'FOUNDER_DRY_RUN',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const reportId = data.report?.reportId || null;
      const nextSteps: Record<string, DryRunStepState> = {
        ...stepsState,
        [step.id]: {
          ...state,
          status: 'SNAG',
          loggedReportId: reportId,
          updatedAtIso: new Date().toISOString(),
        },
      };
      persistState(nextSteps, liveSha || storedSha);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('admin-inbox-updated'));
      }
      toast.success('Snag Logged to Bug Queue', {
        description: reportId ? `Saved as ${reportId} in Firestore bug_reports.` : 'Saved in Firestore.',
      });
    } catch (err: any) {
      toast.error('Could Not Log Snag', { description: err?.message || 'API error' });
    } finally {
      setLoggingStepId(null);
    }
  };

  const passedCount = FOUNDER_DRY_RUN_STEPS.filter((s) => getStepState(s.id).status === 'PASS').length;
  const snagCount = FOUNDER_DRY_RUN_STEPS.filter((s) => getStepState(s.id).status === 'SNAG').length;
  const buildChanged = Boolean(liveSha && storedSha && liveSha !== storedSha && Object.keys(stepsState).length > 0);

  return (
    <div className="space-y-6" data-testid="FOUNDER_DRY_RUN_CONSOLE">
      {/* Top Launch Runway Summary Bar */}
      <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/70 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
              <Sparkles className="h-3.5 w-3.5" />
              {passedCount}/{FOUNDER_DRY_RUN_STEPS.length} Journeys Passed
            </span>
            {snagCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40">
                <XCircle className="h-3.5 w-3.5" />
                {snagCount} Snag{snagCount === 1 ? '' : 's'}
              </span>
            )}
            {liveSha && (
              <span className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35">
                <GitCommit className="h-3 w-3" />
                Staging Build: {liveSha}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Guided Founder dry user run on staging. Launch each route in a new tab, mark{' '}
            <strong className="text-emerald-300">PASS</strong> or <strong className="text-rose-300">SNAG</strong>, and use{' '}
            <strong className="text-indigo-300">Log Snag to Bug Queue</strong> or <strong className="text-slate-200">Copy Prompt for Chat</strong> if anything needs fixing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {readyBugsCount > 0 && onNavigateSuite && (
            <button
              type="button"
              onClick={() => onNavigateSuite('bugs')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-sky-500/20 text-sky-200 border border-sky-400/40 hover:bg-sky-500/30 transition cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sign Off {readyBugsCount} Pending Fix{readyBugsCount === 1 ? '' : 'es'} →
            </button>
          )}
          <button
            type="button"
            data-testid="DRY_RUN_RESET_ALL_BTN"
            onClick={handleResetForNewBuild}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500/50 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset for New Build
          </button>
        </div>
      </div>

      {buildChanged && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 px-4 py-2.5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
          <span>
            New staging build <code className="font-mono font-bold">{liveSha}</code> detected (saved verdicts were recorded on{' '}
            <code className="font-mono">{storedSha}</code>).
          </span>
          <button
            type="button"
            onClick={handleResetForNewBuild}
            className="text-xs font-mono font-bold text-amber-300 underline cursor-pointer"
          >
            Reset verdicts for {liveSha}
          </button>
        </div>
      )}

      {/* Dry-Run Journey Cards (unified /admin/qa grammar) */}
      <div className="space-y-4">
        {FOUNDER_DRY_RUN_STEPS.map((step) => {
          const state = getStepState(step.id);
          const isLogging = loggingStepId === step.id;
          const borderTone =
            state.status === 'PASS'
              ? 'border-emerald-500/45 bg-emerald-950/15'
              : state.status === 'SNAG'
              ? 'border-rose-500/45 bg-rose-950/20'
              : 'border-slate-800 bg-slate-900/65';

          return (
            <div
              key={step.id}
              data-testid={`DRY_RUN_CARD_${step.id}`}
              className={`rounded-2xl border p-5 space-y-4 shadow-lg ${borderTone}`}
            >
              {/* Zone 1: Header & Launch Route */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                      STEP {step.order}
                    </span>
                    <span
                      data-testid={`DRY_RUN_STATUS_${step.id}`}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        state.status === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : state.status === 'SNAG'
                          ? 'bg-rose-500/20 text-rose-200 border-rose-500/45'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {state.status}
                    </span>
                    {state.loggedReportId && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/35">
                        Logged: {state.loggedReportId}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    {step.icon === 'soundstage' ? (
                      <Film className="h-4 w-4 text-indigo-400 shrink-0" />
                    ) : step.icon === 'fireside' ? (
                      <Flame className="h-4 w-4 text-amber-400 shrink-0" />
                    ) : (
                      <Gift className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}
                    <span>{step.title}</span>
                  </h4>
                  <p className="text-xs text-slate-400">{step.subtitle}</p>
                </div>

                <a
                  href={step.route}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`DRY_RUN_LAUNCH_${step.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shrink-0 whitespace-nowrap"
                >
                  <span>Launch {step.route}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Zone 2: Checklist Bullets */}
              <ul className="space-y-1.5 text-xs text-slate-200">
                {step.checks.map((item, idx) => (
                  <li key={`${step.id}-chk-${idx}`} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-indigo-400 font-mono shrink-0 mt-0.5">☐</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Zone 3: Horizontal Verdict Row */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                  Dry-Run Verdict:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid={`DRY_RUN_PASS_${step.id}`}
                    onClick={() => setStepVerdict(step.id, 'PASS')}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wide transition cursor-pointer ${
                      state.status === 'PASS'
                        ? 'bg-emerald-600 text-white border border-emerald-400'
                        : 'bg-emerald-600/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    PASS
                  </button>
                  <button
                    type="button"
                    data-testid={`DRY_RUN_SNAG_${step.id}`}
                    onClick={() => setStepVerdict(step.id, 'SNAG')}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wide transition cursor-pointer ${
                      state.status === 'SNAG'
                        ? 'bg-rose-600 text-white border border-rose-400'
                        : 'bg-rose-500/15 text-rose-200 border border-rose-500/45 hover:bg-rose-600 hover:text-white'
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    SNAG
                  </button>
                  <button
                    type="button"
                    disabled={state.status === 'PENDING'}
                    data-testid={`DRY_RUN_RESET_${step.id}`}
                    onClick={() => setStepVerdict(step.id, 'PENDING')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border border-slate-700 bg-slate-900/70 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Zone 4: Observation Note + Direct Bug Queue / Chat Prompt Bridge */}
              <div className="space-y-2">
                <input
                  type="text"
                  lang="en-GB"
                  value={state.note}
                  data-testid={`DRY_RUN_NOTE_${step.id}`}
                  onChange={(e) => setStepNote(step.id, e.target.value)}
                  placeholder="Optional observation or snag detail (included in Bug Queue & Chat Prompt)..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isLogging}
                    data-testid={`DRY_RUN_LOG_SNAG_${step.id}`}
                    onClick={() => handleLogSnagToBugQueue(step)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25 disabled:opacity-50 transition cursor-pointer"
                  >
                    <Bug className="h-3.5 w-3.5" />
                    {isLogging ? 'Logging to Firestore...' : 'Log Snag to Bug Queue'}
                  </button>
                  <button
                    type="button"
                    data-testid={`DRY_RUN_COPY_PROMPT_${step.id}`}
                    onClick={() => handleCopyPrompt(step)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border border-slate-700 bg-slate-900/80 text-slate-200 hover:border-indigo-500/50 hover:text-white transition cursor-pointer"
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                    Copy Prompt for Chat
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 4 Commercial Go-Live Pointer */}
      {onNavigateSuite && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <span>
            <strong className="text-white">Next after Dry Run passes:</strong> Antigravity promotes verified{' '}
            <code className="font-mono text-amber-300">dev → master</code>, then approve Final Step 4 (Stripe Live Mode) inside Founder Inbox.
          </span>
          <button
            type="button"
            onClick={() => onNavigateSuite('releases')}
            className="px-3 py-1.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition cursor-pointer shrink-0"
          >
            Open Founder Inbox →
          </button>
        </div>
      )}
    </div>
  );
}
