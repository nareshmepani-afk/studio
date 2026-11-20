'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquarePlus,
  RefreshCw,
  Ticket,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  normalisePlaneIssueKey,
  type PlaneCommentItem,
  type PlaneIssueApiResponse,
  type PlaneIssueDetail,
  type PlaneStateOption,
} from '@/lib/planeTypes';

interface PlaneTicketDrawerProps {
  issueKey: string | null;
  onClose: () => void;
  onUpdated?: (issue: PlaneIssueDetail) => void;
}

const STATE_GROUP_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/45',
  started: 'bg-amber-500/20 text-amber-300 border-amber-500/45',
  unstarted: 'bg-sky-500/20 text-sky-300 border-sky-500/45',
  backlog: 'bg-slate-700/40 text-slate-300 border-slate-600/60',
  cancelled: 'bg-rose-500/20 text-rose-300 border-rose-500/45',
};

/**
 * In-app Plane.so ticket inspection & mutation drawer.
 * Keeps the Founder inside the Admin Hub via server-side `/api/admin/plane/issues/[key]` APIs
 * with zero outbound `app.plane.so` tab-hopping and strict plain-text rendering (zero dangerouslySetInnerHTML).
 */
export function PlaneTicketDrawer({ issueKey, onClose, onUpdated }: PlaneTicketDrawerProps) {
  const normalisedKey = normalisePlaneIssueKey(issueKey);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [configured, setConfigured] = useState<boolean>(true);
  const [unconfiguredReason, setUnconfiguredReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issue, setIssue] = useState<PlaneIssueDetail | null>(null);
  const [comments, setComments] = useState<PlaneCommentItem[]>([]);
  const [states, setStates] = useState<PlaneStateOption[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [commentDraft, setCommentDraft] = useState<string>('');

  const loadIssue = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    setUnconfiguredReason(null);
    try {
      const res = await fetch(`/api/admin/plane/issues/${encodeURIComponent(key)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const data = (await res.json().catch(() => ({}))) as PlaneIssueApiResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (!data.configured) {
        setConfigured(false);
        setUnconfiguredReason(
          data.reason || 'PLANE_API_KEY is not configured on this server runtime yet.'
        );
        setIssue(null);
        setComments([]);
        setStates([]);
        return;
      }
      setConfigured(true);
      setIssue(data.issue || null);
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setStates(Array.isArray(data.states) ? data.states : []);
      if (data.issue?.stateId) {
        setSelectedStateId(data.issue.stateId);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load ticket from Plane API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!normalisedKey) {
      setIssue(null);
      setComments([]);
      setStates([]);
      setError(null);
      setCommentDraft('');
      return;
    }
    loadIssue(normalisedKey);
  }, [normalisedKey, loadIssue]);

  useEffect(() => {
    if (!normalisedKey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [normalisedKey, onClose]);

  if (!normalisedKey) return null;

  const handleStateChange = async (targetState: string) => {
    if (!normalisedKey || mutating) return;
    setMutating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/plane/issues/${encodeURIComponent(normalisedKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ state: targetState }),
      });
      const data = (await res.json().catch(() => ({}))) as PlaneIssueApiResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (!data.configured) {
        setConfigured(false);
        setUnconfiguredReason(data.reason || 'Plane API is not configured on this server.');
        return;
      }
      if (data.issue) {
        setIssue(data.issue);
        setSelectedStateId(data.issue.stateId);
        onUpdated?.(data.issue);
      }
      if (Array.isArray(data.comments)) setComments(data.comments);
      if (Array.isArray(data.states)) setStates(data.states);
      toast.success(`Updated ${normalisedKey}`, {
        description: `Plane state is now ${data.issue?.stateName || targetState}.`,
      });
    } catch (err: any) {
      const msg = err?.message || 'Failed to update ticket state.';
      setError(msg);
      toast.error('Plane Update Failed', { description: msg });
    } finally {
      setMutating(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = commentDraft.trim();
    if (!normalisedKey || !clean || mutating) return;
    setMutating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/plane/issues/${encodeURIComponent(normalisedKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ comment: clean }),
      });
      const data = (await res.json().catch(() => ({}))) as PlaneIssueApiResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (!data.configured) {
        setConfigured(false);
        setUnconfiguredReason(data.reason || 'Plane API is not configured on this server.');
        return;
      }
      if (data.issue) setIssue(data.issue);
      if (Array.isArray(data.comments)) setComments(data.comments);
      setCommentDraft('');
      toast.success(`Comment posted to ${normalisedKey}`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to post Plane comment.';
      setError(msg);
      toast.error('Comment Failed', { description: msg });
    } finally {
      setMutating(false);
    }
  };

  const stateBadgeClass =
    STATE_GROUP_STYLES[(issue?.stateGroup || '').toLowerCase()] || STATE_GROUP_STYLES.backlog;
  const isAlreadyCompleted = (issue?.stateGroup || '').toLowerCase() === 'completed';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Plane Ticket ${normalisedKey}`}
      data-testid="PLANE_TICKET_DRAWER"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-800/90 bg-slate-900/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-mono text-xs font-bold shrink-0">
              <Ticket className="h-3.5 w-3.5" />
              {normalisedKey}
            </span>
            {issue && (
              <span
                data-testid="PLANE_DRAWER_STATE_BADGE"
                className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${stateBadgeClass}`}
              >
                {issue.stateName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={loading || mutating}
              onClick={() => loadIssue(normalisedKey)}
              aria-label="Refresh ticket from Plane API"
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close ticket drawer"
              data-testid="PLANE_DRAWER_CLOSE"
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-rose-500/40 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs font-mono text-slate-400 animate-pulse">
              LOADING {normalisedKey} VIA PLANE API...
            </div>
          ) : !configured ? (
            <div
              data-testid="PLANE_DRAWER_UNCONFIGURED"
              className="rounded-xl border border-amber-500/40 bg-amber-950/25 p-5 space-y-2 text-xs text-amber-200"
            >
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>In-App Plane Sync Pending Secret Binding</span>
              </div>
              <p className="leading-relaxed opacity-90">{unconfiguredReason}</p>
              <p className="text-[11px] text-slate-400">
                All Admin Hub actions still save cleanly to Firestore; once the rotated{' '}
                <code className="font-mono text-amber-200">PLANE_API_KEY</code> is bound in Secret
                Manager, this drawer will display live ticket state, comments, and 1-click updates
                without leaving the Admin Hub.
              </p>
            </div>
          ) : error ? (
            <div
              data-testid="PLANE_DRAWER_ERROR"
              className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-4 text-xs text-rose-200 flex items-start gap-2.5"
            >
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : issue ? (
            <>
              {/* Title & Metadata */}
              <div className="space-y-2">
                <h3
                  data-testid="PLANE_DRAWER_TITLE"
                  className="text-base font-bold text-white leading-snug"
                >
                  {issue.name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>Priority: {issue.priority}</span>
                  {issue.updatedAt && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated {issue.updatedAt.slice(0, 19).replace('T', ' ')} UTC
                    </span>
                  )}
                </div>
              </div>

              {/* 1-Click API State Controls */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  In-App Plane API State Controls
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={mutating || isAlreadyCompleted}
                    data-testid="PLANE_DRAWER_MARK_DONE"
                    onClick={() => handleStateChange('done')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-45 transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isAlreadyCompleted ? 'Already Done' : 'Mark Done via API'}
                  </button>

                  {states.length > 0 && (
                    <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                      <select
                        aria-label="Select Plane ticket state"
                        data-testid="PLANE_DRAWER_STATE_SELECT"
                        disabled={mutating}
                        value={selectedStateId}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          setSelectedStateId(nextId);
                          handleStateChange(nextId);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {states.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.group})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Plain-Text Description (strictly no dangerouslySetInnerHTML) */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  Description
                </h4>
                <div
                  data-testid="PLANE_DRAWER_DESCRIPTION"
                  className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap break-words"
                >
                  {issue.descriptionText || 'No description recorded on this ticket.'}
                </div>
              </div>

              {/* Comments & Founder Note Form */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  Activity &amp; Comments ({comments.length})
                </h4>

                {comments.length > 0 ? (
                  <div className="space-y-2.5" data-testid="PLANE_DRAWER_COMMENTS">
                    {comments.map((c) => (
                      <div
                        key={c.id || `${c.createdAt}-${c.bodyText.slice(0, 12)}`}
                        className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                          <span>{c.actor || 'Plane Activity'}</span>
                          <span>{c.createdAt ? c.createdAt.slice(0, 19).replace('T', ' ') : ''}</span>
                        </div>
                        <p className="text-xs text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                          {c.bodyText}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No comments posted yet.</p>
                )}

                <form onSubmit={handlePostComment} className="space-y-2 pt-1">
                  <textarea
                    lang="en-GB"
                    rows={3}
                    value={commentDraft}
                    disabled={mutating}
                    data-testid="PLANE_DRAWER_COMMENT_INPUT"
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder={`Add a founder note or engineering update to ${normalisedKey}...`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={mutating || !commentDraft.trim()}
                    data-testid="PLANE_DRAWER_COMMENT_SUBMIT"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-45 transition cursor-pointer"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    Post Comment via API
                  </button>
                </form>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Headless Plane API • Staying inside Admin Hub</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
