'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardPaste,
  Globe,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  parseBulkEmailsInput,
  type PrelaunchEntry,
  type PrelaunchMode,
  type PrelaunchStatus,
} from '@/lib/prelaunch-shared';

type FilterTab = 'ALL' | 'TESTER' | 'WAITLIST';

const SOURCE_LABELS: Record<string, { label: string; tone: string }> = {
  SELF_SIGNUP: {
    label: 'Self Signup',
    tone: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  ADMIN_ADD: {
    label: 'Admin Added',
    tone: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  SHEET_IMPORT: {
    label: 'Sheet Import',
    tone: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  GIFT_VOUCHER: {
    label: 'Gift Recipient',
    tone: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
};

export function PrelaunchAccessConsole() {
  const [mode, setMode] = useState<PrelaunchMode>('PUBLIC');
  const [defaultMode, setDefaultMode] = useState<PrelaunchMode>('PUBLIC');
  const [isExplicit, setIsExplicit] = useState(false);
  const [entries, setEntries] = useState<PrelaunchEntry[]>([]);
  const [counts, setCounts] = useState({ total: 0, testers: 0, waitlist: 0 });
  const [loading, setLoading] = useState(true);
  const [modeUpdating, setModeUpdating] = useState(false);

  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Single add form
  const [singleEmail, setSingleEmail] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleAsTester, setSingleAsTester] = useState(true);
  const [addingSingle, setAddingSingle] = useState(false);

  // Bulk Google Sheet / CSV import
  const [bulkText, setBulkText] = useState('');
  const [bulkStatus, setBulkStatus] = useState<PrelaunchStatus>('TESTER');
  const [importingBulk, setImportingBulk] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const bulkPreview = useMemo(() => parseBulkEmailsInput(bulkText), [bulkText]);

  const fetchRoster = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/prelaunch', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load pre-launch roster');
      }
      setMode(data.mode);
      setDefaultMode(data.defaultMode);
      setIsExplicit(Boolean(data.isExplicit));
      setEntries(data.entries || []);
      setCounts(data.counts || { total: 0, testers: 0, waitlist: 0 });
    } catch (err: any) {
      toast.error('Unable to Load Pre-Launch Roster', {
        description: err?.message || 'Check your administrator session and try again.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const handleToggleMode = async () => {
    const nextMode: PrelaunchMode = mode === 'RESTRICTED' ? 'PUBLIC' : 'RESTRICTED';
    setModeUpdating(true);
    try {
      const res = await fetch('/api/admin/prelaunch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: nextMode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update access gate mode');
      }
      setMode(data.mode);
      setIsExplicit(true);
      toast.success(
        nextMode === 'RESTRICTED'
          ? 'Pre-Launch Gate Enabled (RESTRICTED)'
          : 'Public Registration Opened (PUBLIC)',
        {
          description:
            nextMode === 'RESTRICTED'
              ? 'Only active Testers, Admins, and unredeemed Gift recipients can sign in or register.'
              : 'Everyone can now register and sign in without Tester approval.',
        }
      );
    } catch (err: any) {
      toast.error('Mode Switch Failed', { description: err?.message });
    } finally {
      setModeUpdating(false);
    }
  };

  const handleToggleTester = async (entry: PrelaunchEntry) => {
    const nextTester = !entry.isTester;
    setTogglingKey(entry.emailKey);

    // Optimistic update (Rule 12)
    setEntries((prev) =>
      prev.map((item) =>
        item.emailKey === entry.emailKey
          ? {
              ...item,
              isTester: nextTester,
              status: nextTester ? 'TESTER' : 'WAITLIST',
              updatedAt: Date.now(),
            }
          : item
      )
    );
    setCounts((prev) => ({
      ...prev,
      testers: prev.testers + (nextTester ? 1 : -1),
      waitlist: prev.waitlist + (nextTester ? -1 : 1),
    }));

    try {
      const res = await fetch('/api/admin/prelaunch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailKey: entry.emailKey,
          email: entry.email,
          isTester: nextTester,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update Tester status');
      }
      toast.success(
        nextTester
          ? `${entry.email} promoted to active Tester`
          : `${entry.email} moved back to Waitlist`
      );
    } catch (err: any) {
      toast.error('Tester Switch Failed', { description: err?.message });
      fetchRoster();
    } finally {
      setTogglingKey(null);
    }
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleEmail.trim()) return;
    setAddingSingle(true);
    try {
      const res = await fetch('/api/admin/prelaunch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: singleEmail.trim(),
          name: singleName.trim(),
          isTester: singleAsTester,
          status: singleAsTester ? 'TESTER' : 'WAITLIST',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save entry');
      }
      setSingleEmail('');
      setSingleName('');
      toast.success(`Saved ${data.entry.email} as ${data.entry.status}`);
      await fetchRoster();
    } catch (err: any) {
      toast.error('Could Not Add Email', { description: err?.message });
    } finally {
      setAddingSingle(false);
    }
  };

  const handleBulkImport = async () => {
    if (bulkPreview.validEntries.length === 0) {
      toast.error('No valid emails detected in pasted content');
      return;
    }
    setImportingBulk(true);
    try {
      const res = await fetch('/api/admin/prelaunch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulkText,
          asTester: bulkStatus === 'TESTER',
          status: bulkStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Bulk import failed');
      }
      setBulkText('');
      toast.success(
        `Imported ${data.importedCount} ${data.status === 'TESTER' ? 'Tester' : 'Waitlist'} entries`,
        {
          description:
            data.duplicateCount > 0 || data.invalidCount > 0
              ? `Skipped ${data.duplicateCount} duplicates and ${data.invalidCount} invalid tokens.`
              : 'Synced cleanly to Firestore.',
        }
      );
      await fetchRoster();
    } catch (err: any) {
      toast.error('Bulk Import Failed', { description: err?.message });
    } finally {
      setImportingBulk(false);
    }
  };

  const handleDeleteEntry = async (entry: PrelaunchEntry) => {
    try {
      const res = await fetch(
        `/api/admin/prelaunch?emailKey=${encodeURIComponent(entry.emailKey)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Delete failed');
      }
      toast.success(`Removed ${entry.email} from Pre-Launch List`);
      await fetchRoster();
    } catch (err: any) {
      toast.error('Delete Failed', { description: err?.message });
    }
  };

  const visibleEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filterTab === 'TESTER' && !entry.isTester) return false;
      if (filterTab === 'WAITLIST' && entry.isTester) return false;
      if (q) {
        return (
          entry.email.toLowerCase().includes(q) ||
          entry.name.toLowerCase().includes(q) ||
          entry.source.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, filterTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Master Gate Mode Controller */}
      <div
        className={`rounded-2xl border p-6 transition-colors ${
          mode === 'RESTRICTED'
            ? 'border-amber-500/35 bg-amber-950/20'
            : 'border-emerald-500/35 bg-emerald-950/20'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              {mode === 'RESTRICTED' ? (
                <Lock className="h-5 w-5 text-amber-400" />
              ) : (
                <Globe className="h-5 w-5 text-emerald-400" />
              )}
              <span className="text-lg font-bold text-white">
                Access Mode:{' '}
                <span
                  data-testid="PRELAUNCH_MODE_BADGE"
                  className={mode === 'RESTRICTED' ? 'text-amber-300' : 'text-emerald-300'}
                >
                  {mode}
                </span>
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
                {isExplicit ? 'Firestore Override Active' : `Environment Default (${defaultMode})`}
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {mode === 'RESTRICTED'
                ? 'Private Pre-Launch Preview is active. Uninvited visitors attempting /register or /login are warmly captured in this list with status WAITLIST without creating orphan Auth users.'
                : 'Open Public Launch is active. Any visitor may register and enter Studio immediately.'}{' '}
              Shared Chamber I Cinema links (/cinema), Gift Checkout (/gift), and unredeemed Gift Unboxing links (/unboxing/[code]) stay accessible in both modes.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={handleToggleMode}
              disabled={modeUpdating}
              data-testid="PRELAUNCH_TOGGLE_MODE_BTN"
              className={
                mode === 'RESTRICTED'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
              }
            >
              {modeUpdating
                ? 'Updating...'
                : mode === 'RESTRICTED'
                  ? 'Open to PUBLIC Launch'
                  : 'Switch to RESTRICTED Mode'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={fetchRoster}
              disabled={loading}
              className="border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
              title="Refresh Pre-Launch Roster"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Add Individual + Google Sheet Bulk Paste */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Add */}
        <form
          onSubmit={handleAddSingle}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Add Individual Tester or Waitlist Entry</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="email"
              required
              value={singleEmail}
              onChange={(e) => setSingleEmail(e.target.value)}
              placeholder="tester@example.com"
              className="bg-slate-950/70 border-slate-700 text-white"
            />
            <Input
              type="text"
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              placeholder="Full Name (optional)"
              className="bg-slate-950/70 border-slate-700 text-white"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={singleAsTester}
                onChange={(e) => setSingleAsTester(e.target.checked)}
                className="rounded border-slate-600 accent-amber-500"
              />
              <span>Activate as Tester immediately (isTester: true)</span>
            </label>
            <Button
              type="submit"
              disabled={addingSingle}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              {addingSingle ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </form>

        {/* Bulk Sheet Paste */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ClipboardPaste className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Bulk Paste from Google Sheet / CSV</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Import as:</span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as PrelaunchStatus)}
                aria-label="Bulk import target status"
                className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-semibold text-amber-300"
              >
                <option value="TESTER">TESTER (Active)</option>
                <option value="WAITLIST">WAITLIST (Queued)</option>
              </select>
            </div>
          </div>

          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={3}
            lang="en-GB"
            placeholder={'Paste rows copied directly from Google Sheets or CSV:\nAsha Patel\tasha@example.com\nravi@example.com, "Ravi Mehta"'}
            className="w-full rounded-xl bg-slate-950/70 border border-slate-700 p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              Detected: <strong className="text-emerald-300">{bulkPreview.validEntries.length}</strong> valid
              {bulkPreview.duplicateCount > 0 ? `, ${bulkPreview.duplicateCount} duplicates` : ''}
              {bulkPreview.invalidTokens.length > 0 ? `, ${bulkPreview.invalidTokens.length} invalid` : ''}
            </span>
            <Button
              type="button"
              onClick={handleBulkImport}
              disabled={importingBulk || bulkPreview.validEntries.length === 0}
              data-testid="PRELAUNCH_BULK_IMPORT_BTN"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
            >
              {importingBulk ? 'Importing...' : `Import ${bulkPreview.validEntries.length} Entries`}
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search + Unified Roster */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: 'ALL', label: `All (${counts.total})` },
              { id: 'TESTER', label: `Testers (${counts.testers})` },
              { id: 'WAITLIST', label: `Waitlist (${counts.waitlist})` },
            ] as { id: FilterTab; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  filterTab === tab.id
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter email, name, source..."
              className="pl-8 h-8 text-xs bg-slate-950/80 border-slate-800 text-white"
            />
          </div>
        </div>

        {loading && entries.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">Loading prelaunch_list roster...</div>
        ) : visibleEntries.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Users className="h-6 w-6 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No entries match the current filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {visibleEntries.map((entry) => {
              const sourceStyle = SOURCE_LABELS[entry.source] || {
                label: entry.source,
                tone: 'bg-slate-800 text-slate-300 border-slate-700',
              };
              const isBusy = togglingKey === entry.emailKey;
              return (
                <div
                  key={entry.emailKey}
                  data-testid={`PRELAUNCH_ROW_${entry.email}`}
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {entry.name || entry.email}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${sourceStyle.tone}`}
                      >
                        {sourceStyle.label}
                      </span>
                      {entry.isTester ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          TESTER
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25">
                          WAITLIST
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-400 truncate">
                      {entry.email}
                      {entry.updatedBy ? ` · updated by ${entry.updatedBy}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={entry.isTester}
                      aria-label={`Toggle Tester access for ${entry.email}`}
                      disabled={isBusy}
                      onClick={() => handleToggleTester(entry)}
                      data-testid={`PRELAUNCH_TESTER_SWITCH_${entry.email}`}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        entry.isTester
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-200'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{entry.isTester ? 'Tester: ON' : 'Promote to Tester'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry)}
                      title={`Remove ${entry.email}`}
                      aria-label={`Remove ${entry.email}`}
                      className="p-1.5 rounded-lg border border-transparent text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PrelaunchAccessConsole;
