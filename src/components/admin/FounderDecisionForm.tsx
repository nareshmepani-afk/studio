'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Layers,
  RefreshCw,
  Save,
  Send,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type {
  FounderDecisionRecord,
  FounderDecisionStatus,
} from '@/lib/founderDecisions';

interface DraftDecisionState {
  selectedOptionId: string;
  deferredToPlane: boolean;
  notes: string;
}

const STATUS_BADGES: Record<
  FounderDecisionStatus,
  { label: string; classes: string }
> = {
  PENDING: {
    label: 'Awaiting Confirmation',
    classes: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
  },
  DECIDED: {
    label: 'Decided & Locked',
    classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  },
  DEFERRED_TO_PLANE: {
    label: 'Deferred to Plane Ticket',
    classes: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
  },
};

export function FounderDecisionForm() {
  const [decisions, setDecisions] = useState<FounderDecisionRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftDecisionState>>({});
  const [counts, setCounts] = useState({ total: 0, decided: 0, pending: 0, deferred: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const hydrateDrafts = (list: FounderDecisionRecord[]) => {
    const nextDrafts: Record<string, DraftDecisionState> = {};
    for (const item of list) {
      nextDrafts[item.id] = {
        selectedOptionId: item.selectedOptionId || item.recommendedOptionId,
        deferredToPlane: Boolean(item.deferredToPlane),
        notes: item.notes || '',
      };
    }
    setDrafts(nextDrafts);
    setHasUnsavedChanges(false);
  };

  const fetchDecisions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/decisions', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load founder decisions');
      }
      const loaded: FounderDecisionRecord[] = data.decisions || [];
      setDecisions(loaded);
      setCounts(
        data.counts || {
          total: loaded.length,
          decided: 0,
          pending: loaded.length,
          deferred: 0,
        }
      );
      hydrateDrafts(loaded);
    } catch (err: any) {
      toast.error('Unable to Load Founder Decisions', {
        description: err?.message || 'Check your administrator session and try again.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  const updateDraft = (id: string, patch: Partial<DraftDecisionState>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { selectedOptionId: '', deferredToPlane: false, notes: '' }),
        ...patch,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = decisions.map((card) => {
        const draft = drafts[card.id];
        const deferred = Boolean(draft?.deferredToPlane);
        return {
          id: card.id,
          selectedOptionId:
            draft?.selectedOptionId || card.selectedOptionId || card.recommendedOptionId,
          deferredToPlane: deferred,
          status: deferred ? ('DEFERRED_TO_PLANE' as const) : ('DECIDED' as const),
          notes: draft?.notes || '',
        };
      });

      const res = await fetch('/api/admin/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisions: payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save founder decisions');
      }

      const updated: FounderDecisionRecord[] = data.decisions || [];
      setDecisions(updated);
      setCounts(data.counts || counts);
      hydrateDrafts(updated);
      toast.success('Founder Decisions Saved', {
        description: `Synchronised ${updated.length} cutover decisions to Firestore. Agents can pull via npm run qa:decisions.`,
      });
    } catch (err: any) {
      toast.error('Save Failed', { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary & Action Header */}
      <div className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Cutover Decisions Queue ({counts.total})
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {counts.decided} Decided
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {counts.pending} Pending
            </span>
            {counts.deferred > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {counts.deferred} Deferred
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Recommended answers are pre-selected. Adjust any option, add notes, or click{' '}
            <strong className="text-slate-200">Defer to Plane Ticket</strong>, then click{' '}
            <strong className="text-amber-300">Save Decisions</strong>. Antigravity reads your selections directly via{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 font-mono">npm run qa:decisions</code>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={fetchDecisions}
            disabled={loading || saving}
            className="border-slate-700 bg-slate-950/70 text-slate-200 hover:bg-slate-800"
            title="Reload decisions from Firestore"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || loading || decisions.length === 0}
            data-testid="FOUNDER_SAVE_DECISIONS_BTN"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 h-10 rounded-xl shadow-lg shadow-amber-500/20"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving Decisions...' : 'Save Decisions'}
          </Button>
        </div>
      </div>

      {/* Decision Cards */}
      {loading && decisions.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center text-xs text-slate-400">
          Loading pre-seeded cutover decisions...
        </div>
      ) : (
        <div className="space-y-5">
          {decisions.map((card) => {
            const draft = drafts[card.id] || {
              selectedOptionId: card.selectedOptionId || card.recommendedOptionId,
              deferredToPlane: Boolean(card.deferredToPlane),
              notes: card.notes || '',
            };
            const effectiveStatus: FounderDecisionStatus = draft.deferredToPlane
              ? 'DEFERRED_TO_PLANE'
              : card.status;
            const statusMeta = STATUS_BADGES[effectiveStatus];

            return (
              <section
                key={card.id}
                data-testid={`FOUNDER_DECISION_CARD_${card.id}`}
                className={`rounded-2xl border p-6 space-y-4 transition-colors ${
                  draft.deferredToPlane
                    ? 'border-indigo-500/40 bg-indigo-950/15'
                    : card.status === 'DECIDED'
                      ? 'border-emerald-500/30 bg-slate-900/55'
                      : 'border-slate-800 bg-slate-900/55'
                }`}
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {card.ticketRef}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        <Layers className="inline h-3 w-3 mr-1" />
                        {card.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${statusMeta.classes}`}
                      >
                        {effectiveStatus === 'DECIDED' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {statusMeta.label}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white">{card.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      {card.summary}
                    </p>
                  </div>

                  {/* Direct External Console Links */}
                  {card.externalLinks && card.externalLinks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {card.externalLinks.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 text-[11px] font-semibold text-amber-300 transition-colors"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Radio Options */}
                <div className="space-y-2.5 pt-1">
                  {card.options.map((opt) => {
                    const isChecked =
                      !draft.deferredToPlane && draft.selectedOptionId === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'border-amber-500/60 bg-amber-500/10'
                            : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`decision-${card.id}`}
                          value={opt.id}
                          checked={isChecked}
                          onChange={() =>
                            updateDraft(card.id, {
                              selectedOptionId: opt.id,
                              deferredToPlane: false,
                            })
                          }
                          className="mt-1 h-4 w-4 accent-amber-500 cursor-pointer shrink-0"
                        />
                        <div className="space-y-0.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {opt.label}
                            </span>
                            {opt.recommended && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <Sparkles className="h-2.5 w-2.5" />
                                Recommended
                              </span>
                            )}
                          </div>
                          {opt.description && (
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {opt.description}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Defer Toggle + Notes */}
                <div className="pt-2 border-t border-slate-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <button
                      type="button"
                      aria-pressed={draft.deferredToPlane}
                      data-testid={`DECISION_DEFER_${card.id}`}
                      onClick={() =>
                        updateDraft(card.id, {
                          deferredToPlane: !draft.deferredToPlane,
                        })
                      }
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer self-start ${
                        draft.deferredToPlane
                          ? 'bg-indigo-500/25 border-indigo-400/60 text-indigo-200'
                          : 'bg-slate-950/70 border-slate-700 text-slate-300 hover:border-indigo-400/40 hover:text-indigo-200'
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>
                        {draft.deferredToPlane
                          ? 'Deferred to Plane Ticket (Click to Undo)'
                          : 'Defer to Plane Ticket'}
                      </span>
                    </button>

                    {card.updatedAtIso && (
                      <span className="text-[11px] font-mono text-slate-500">
                        Last saved: {new Date(card.updatedAtIso).toLocaleString()}
                        {card.decidedBy ? ` by ${card.decidedBy}` : ''}
                      </span>
                    )}
                  </div>

                  <textarea
                    value={draft.notes}
                    onChange={(e) => updateDraft(card.id, { notes: e.target.value })}
                    rows={2}
                    lang="en-GB"
                    placeholder="Optional founder notes, caveats, or instructions for Antigravity..."
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Bottom Sticky Save Footer */}
      {decisions.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-xs text-slate-300">
            {hasUnsavedChanges
              ? 'You have unsaved adjustments ready to persist to Firestore.'
              : 'Displayed selections reflect Firestore state.'}
          </span>
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || loading}
            data-testid="FOUNDER_SAVE_DECISIONS_BOTTOM_BTN"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-6 h-10 rounded-xl"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving Decisions...' : 'Save Decisions'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default FounderDecisionForm;
