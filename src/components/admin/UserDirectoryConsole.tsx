'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  Download,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  filterAdminUsers,
  formatAdminUsersCsv,
  getExpectedDeleteConfirmationToken,
  matchesDeleteConfirmation,
  type AdminUserDirectoryCounts,
  type AdminUserDirectoryEntry,
  type AdminUserSegment,
} from '@/lib/adminUsers';

type SegmentFilter = AdminUserSegment | 'ALL' | 'DISABLED';

interface DirectoryApiResponse {
  success: boolean;
  projectId?: string;
  environment?: 'PRODUCTION' | 'STAGING';
  actorUid?: string;
  actorEmail?: string;
  counts?: AdminUserDirectoryCounts;
  users?: AdminUserDirectoryEntry[];
  error?: string;
}

const SEGMENT_META: Record<
  AdminUserSegment,
  { label: string; badgeClass: string }
> = {
  ADMIN: {
    label: 'Admin / Founder',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  CUSTOMER: {
    label: 'Customer',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  TEST_ALIAS: {
    label: 'Test / Alias',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  ANONYMOUS: {
    label: 'Anonymous',
    badgeClass: 'bg-slate-700/50 text-slate-300 border-slate-600/60',
  },
};

function formatDateShort(raw: string | null): string {
  if (!raw) return '—';
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(parsed));
}

export function UserDirectoryConsole() {
  const [users, setUsers] = useState<AdminUserDirectoryEntry[]>([]);
  const [counts, setCounts] = useState<AdminUserDirectoryCounts>({
    total: 0,
    admins: 0,
    customers: 0,
    testAliases: 0,
    anonymous: 0,
    disabled: 0,
    totalMemories: 0,
  });
  const [projectId, setProjectId] = useState<string>('');
  const [environment, setEnvironment] = useState<'PRODUCTION' | 'STAGING' | ''>('');
  const [actorUid, setActorUid] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [busyUid, setBusyUid] = useState<string | null>(null);

  // Guarded delete modal state
  const [deleteTarget, setDeleteTarget] = useState<AdminUserDirectoryEntry | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>('');
  const [deleteFirestoreData, setDeleteFirestoreData] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadDirectory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = (await res.json()) as DirectoryApiResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
      if (data.counts) setCounts(data.counts);
      setProjectId(data.projectId || '');
      setEnvironment(data.environment || '');
      setActorUid(data.actorUid || '');
    } catch (err: any) {
      const msg = err?.message || 'Failed to load user directory.';
      setError(msg);
      toast.error('User Directory Error', { description: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDirectory(false);
  }, [loadDirectory]);

  const visibleUsers = useMemo(
    () => filterAdminUsers(users, { segment: segmentFilter, query: searchQuery }),
    [users, segmentFilter, searchQuery]
  );

  const handleCopy = (value: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      toast.success(`Copied ${label}`, { description: value });
    }
  };

  const handleExportCsv = () => {
    const csv = formatAdminUsersCsv(visibleUsers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `memory-weaver-users-${projectId || 'directory'}-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV Exported', {
      description: `Exported ${visibleUsers.length} account${visibleUsers.length === 1 ? '' : 's'}.`,
    });
  };

  const handleToggleDisable = async (entry: AdminUserDirectoryEntry) => {
    if (entry.isProtectedAdmin || entry.uid === actorUid) return;
    const action = entry.disabled ? 'ENABLE' : 'DISABLE';
    setBusyUid(entry.uid);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ uid: entry.uid, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      toast.success(action === 'DISABLE' ? 'Account Disabled' : 'Account Re-enabled', {
        description: `${entry.email || entry.uid} has been ${action === 'DISABLE' ? 'disabled and tokens revoked' : 're-enabled'}.`,
      });
      await loadDirectory(true);
    } catch (err: any) {
      toast.error('Update Failed', { description: err?.message || 'Unable to update user status.' });
    } finally {
      setBusyUid(null);
    }
  };

  const openDeleteModal = (entry: AdminUserDirectoryEntry) => {
    if (entry.isProtectedAdmin || entry.uid === actorUid) return;
    setDeleteTarget(entry);
    setDeleteConfirmInput('');
    setDeleteFirestoreData(true);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;

    if (!matchesDeleteConfirmation(deleteTarget, deleteConfirmInput)) {
      toast.error('Confirmation Mismatch', {
        description: 'Please type the exact confirmation text shown below.',
      });
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          uid: deleteTarget.uid,
          confirmation: deleteConfirmInput.trim(),
          deleteFirestoreData,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      toast.success('Account Deleted', {
        description: `Removed ${deleteTarget.email || deleteTarget.uid}${data.deletedFirestore ? ' + Firestore /users subtree' : ''}.`,
      });
      setDeleteTarget(null);
      setDeleteConfirmInput('');
      await loadDirectory(true);
    } catch (err: any) {
      toast.error('Deletion Failed', { description: err?.message || 'Unable to delete account.' });
    } finally {
      setDeleting(false);
    }
  };

  const expectedDeleteToken = deleteTarget
    ? getExpectedDeleteConfirmationToken(deleteTarget)
    : '';
  const canSubmitDelete = Boolean(
    deleteTarget && !deleting && matchesDeleteConfirmation(deleteTarget, deleteConfirmInput)
  );

  return (
    <div className="space-y-6">
      {/* Environment Isolation Header */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              User Directory &amp; Basic CRM
            </h3>
            {projectId && (
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  environment === 'PRODUCTION'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                }`}
              >
                {environment || 'ENV'}: {projectId}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Live Firebase Authentication directory joined with Firestore vault counts for this environment only. Administrator accounts and your active session are hard-locked against disabling or deletion.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadDirectory(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800/70 text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={visibleUsers.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV ({visibleUsers.length})
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'ALL' as SegmentFilter, label: 'Total Accounts', value: counts.total, tone: 'text-white border-slate-800' },
          { key: 'ADMIN' as SegmentFilter, label: 'Admins', value: counts.admins, tone: 'text-indigo-300 border-indigo-500/30' },
          { key: 'CUSTOMER' as SegmentFilter, label: 'Customers', value: counts.customers, tone: 'text-emerald-300 border-emerald-500/30' },
          { key: 'TEST_ALIAS' as SegmentFilter, label: 'Test / Aliases', value: counts.testAliases, tone: 'text-amber-300 border-amber-500/30' },
          { key: 'ANONYMOUS' as SegmentFilter, label: 'Anonymous', value: counts.anonymous, tone: 'text-slate-300 border-slate-700' },
          { key: 'DISABLED' as SegmentFilter, label: 'Disabled', value: counts.disabled, tone: 'text-rose-300 border-rose-500/30' },
        ].map((card) => {
          const isActive = segmentFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setSegmentFilter(card.key)}
              className={`rounded-xl border p-3.5 text-left transition cursor-pointer ${
                isActive
                  ? 'bg-slate-800/90 ring-1 ring-amber-400/60 border-amber-500/40'
                  : `bg-slate-900/50 hover:bg-slate-900/80 ${card.tone}`
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                {card.label}
              </div>
              <div className={`text-2xl font-extrabold mt-1 ${card.tone.split(' ')[0]}`}>
                {card.value}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            lang="en-GB"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email, display name, UID, or provider..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-mono flex items-center gap-2 px-1">
          <Database className="h-3.5 w-3.5 text-indigo-400" />
          <span>{counts.totalMemories.toLocaleString('en-GB')} total memories across listed users</span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* User Directory Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400 animate-pulse font-mono">
            LOADING AUTHENTICATION &amp; VAULT DIRECTORY...
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No user accounts match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 font-semibold">Identity</th>
                  <th className="py-3 px-3 font-semibold">Segment</th>
                  <th className="py-3 px-3 font-semibold">Vault</th>
                  <th className="py-3 px-3 font-semibold">Activity</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {visibleUsers.map((entry) => {
                  const meta = SEGMENT_META[entry.segment];
                  const isSelf = entry.uid === actorUid;
                  const isLocked = entry.isProtectedAdmin || isSelf;
                  const isRowBusy = busyUid === entry.uid;

                  return (
                    <tr
                      key={entry.uid}
                      className={`hover:bg-slate-800/30 transition ${entry.disabled ? 'opacity-65' : ''}`}
                    >
                      {/* Identity */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-100 break-all">
                                {entry.email || 'Anonymous Session'}
                              </span>
                              {entry.email && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(entry.email!, 'email')}
                                  title="Copy email address"
                                  className="text-slate-500 hover:text-slate-200 cursor-pointer"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                              {entry.emailVerified && (
                                <span
                                  title="Email verified in Firebase Auth"
                                  className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                </span>
                              )}
                              {entry.disabled && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                  DISABLED
                                </span>
                              )}
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-200 border border-indigo-400/40">
                                  YOU
                                </span>
                              )}
                            </div>

                            {entry.displayName && (
                              <div className="text-[11px] text-slate-400">{entry.displayName}</div>
                            )}

                            <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-slate-500">
                              <button
                                type="button"
                                onClick={() => handleCopy(entry.uid, 'UID')}
                                title="Click to copy UID"
                                className="hover:text-slate-300 cursor-pointer"
                              >
                                {entry.uid}
                              </button>
                              {entry.providers.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                                  {entry.providers.join(', ')}
                                </span>
                              )}
                              {entry.isAdminClaim && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                  isAdmin{entry.mfaVerifiedClaim ? ' + MFA' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Segment */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        {entry.subscriptionTier && (
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            Tier: {entry.subscriptionTier}
                          </div>
                        )}
                      </td>

                      {/* Vault */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <div className="font-mono text-slate-200">
                          <span className={entry.memoriesCount > 0 ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                            {entry.memoriesCount}
                          </span>{' '}
                          <span className="text-slate-500">memories</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {entry.chroniclesCount} chronicles
                          {entry.firestoreUserDocExists ? ' · profile doc' : ''}
                        </div>
                      </td>

                      {/* Activity */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap text-[11px] text-slate-400">
                        <div>Created: {formatDateShort(entry.createdAt)}</div>
                        <div className="text-slate-500">
                          Last login: {formatDateShort(entry.lastSignInAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap text-right">
                        {isLocked ? (
                          <span
                            title="Protected administrator account — cannot be disabled or deleted from User CRM"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/70 text-[11px] text-slate-400"
                          >
                            <Lock className="h-3 w-3 text-indigo-400" />
                            Protected
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleDisable(entry)}
                              disabled={isRowBusy}
                              title={entry.disabled ? 'Re-enable account' : 'Disable account and revoke sessions'}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer disabled:opacity-50 ${
                                entry.disabled
                                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                                  : 'border-amber-500/35 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                              }`}
                            >
                              {entry.disabled ? (
                                <>
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Re-enable
                                </>
                              ) : (
                                <>
                                  <UserMinus className="h-3.5 w-3.5" />
                                  Disable
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(entry)}
                              disabled={isRowBusy}
                              title="Permanently delete user account (requires typed confirmation)"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guarded Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-slate-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30">
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <h4 id="delete-user-modal-title" className="text-base font-bold text-white">
                    Confirm Permanent Account Deletion
                  </h4>
                  <p className="text-xs text-slate-400">
                    Target environment: <span className="font-mono text-rose-300">{projectId || 'active project'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 text-xs space-y-1.5">
              <div className="text-slate-200 font-semibold break-all">
                {deleteTarget.email || 'Anonymous Session'}
              </div>
              <div className="font-mono text-[11px] text-slate-400">UID: {deleteTarget.uid}</div>
              <div className="text-amber-300">
                Firestore footprint: {deleteTarget.memoriesCount} memories · {deleteTarget.chroniclesCount} chronicles
              </div>
            </div>

            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteFirestoreData}
                  onChange={(e) => setDeleteFirestoreData(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-rose-500"
                />
                <span>
                  Also recursively purge <code className="text-amber-300">/users/{deleteTarget.uid}</code> Firestore documents, memories, and chronicles
                </span>
              </label>

              <div className="space-y-1.5">
                <label className="block text-xs text-slate-300">
                  Type <code className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-300 font-mono">{expectedDeleteToken}</code> to confirm:
                </label>
                <input
                  type="text"
                  lang="en-GB"
                  autoFocus
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder={expectedDeleteToken}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmitDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
