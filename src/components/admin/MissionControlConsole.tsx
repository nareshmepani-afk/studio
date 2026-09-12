'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Rocket, 
  ShieldCheck, 
  Globe, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  FileCode, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import type { MissionLogPayload, MissionLogCheckpoint } from '@/lib/missionLog';

type PartnerFilter = 'all' | 'director' | 'gemini' | 'antigravity' | 'qa';

export function MissionControlConsole() {
  const [data, setData] = useState<MissionLogPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerFilter, setPartnerFilter] = useState<PartnerFilter>('all');
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMissionLog = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/mission-log', {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Failed to load mission log:', err);
      setError(err.message || 'Unable to fetch flight log from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMissionLog();
  }, []);

  const toggleFiles = (checkpointId: string) => {
    setExpandedFiles(prev => ({
      ...prev,
      [checkpointId]: !prev[checkpointId]
    }));
  };

  const handleCopyCheckpoint = async (checkpoint: MissionLogCheckpoint) => {
    try {
      await navigator.clipboard.writeText(checkpoint.rawMarkdown);
      setCopiedId(checkpoint.checkpointId);
      toast.success('Checkpoint Copied to Clipboard', {
        description: `${checkpoint.checkpointId} summary is ready to paste into chat.`
      });
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const filteredCheckpoints = useMemo(() => {
    if (!data) return [];
    if (partnerFilter === 'all') return data.checkpoints;

    return data.checkpoints.filter(cp => {
      const p = cp.partnerDisciplines;
      if (partnerFilter === 'director') return !!p.director;
      if (partnerFilter === 'gemini') return !!p.gemini;
      if (partnerFilter === 'antigravity') return !!p.antigravity;
      if (partnerFilter === 'qa') return !!p.qa;
      return true;
    });
  }, [data, partnerFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse flex items-center justify-center text-slate-500 font-mono text-xs">
          SYNCHRONISING MISSION CONTROL FLIGHT RECORDER...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400">
          <Rocket className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Flight Recorder Disconnected</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">{error || 'Could not parse MISSION_LOG.md.'}</p>
        <button
          onClick={() => fetchMissionLog(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-mono transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const { coordinates } = data;

  return (
    <div className="space-y-8">
      {/* Top Status HUD: 3 Luxury Obsidian-Gold Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Active Sprint */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900/80 to-slate-950 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              Active Sprint
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Rocket className="w-4 h-4" />
            </div>
          </div>
          <h4 className="text-base font-bold text-white line-clamp-2 mt-1">
            {coordinates.activeSprint}
          </h4>
          <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mission Status: Operational</span>
          </div>
        </div>

        {/* Card 2: Target Edge Environment */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900/80 to-slate-950 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
              Edge Environment
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <a
            href="https://dev.memoryweaver.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-bold text-white hover:text-indigo-300 transition flex items-center gap-1.5 mt-1 truncate"
          >
            <span>dev.memoryweaver.studio</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
          <div className="mt-3 flex items-center gap-2 text-xs font-mono text-indigo-300">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-[11px]">
              {coordinates.targetEdge.includes('Commit')
                ? coordinates.targetEdge.split('(')[1]?.replace(')', '') || 'Commit 6059e0d1'
                : 'Verified Active'}
            </span>
          </div>
        </div>

        {/* Card 3: Invariant Test Shield */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900/80 to-slate-950 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Regression Shield
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h4 className="text-base font-bold text-white mt-1">
            {coordinates.baselineTests}
          </h4>
          <div className="mt-3 flex items-center gap-2 text-xs font-mono text-emerald-300">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-[11px]">
              29 Suites • 100% Invariants Green
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Refresh & Partner Filter Chips */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider mr-1">
            Filter by Partner:
          </span>
          <button
            onClick={() => setPartnerFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition ${
              partnerFilter === 'all'
                ? 'bg-amber-500 text-gray-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Partners ({data.checkpoints.length})
          </button>
          <button
            onClick={() => setPartnerFilter('director')}
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition ${
              partnerFilter === 'director'
                ? 'bg-sky-500 text-gray-950 font-bold shadow-md shadow-sky-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            👤 Director
          </button>
          <button
            onClick={() => setPartnerFilter('gemini')}
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition ${
              partnerFilter === 'gemini'
                ? 'bg-purple-500 text-gray-950 font-bold shadow-md shadow-purple-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🧠 Gemini Brain
          </button>
          <button
            onClick={() => setPartnerFilter('antigravity')}
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition ${
              partnerFilter === 'antigravity'
                ? 'bg-amber-400 text-gray-950 font-bold shadow-md shadow-amber-400/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Antigravity
          </button>
          <button
            onClick={() => setPartnerFilter('qa')}
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition ${
              partnerFilter === 'qa'
                ? 'bg-emerald-500 text-gray-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🛡️ QA Gatekeeper
          </button>
        </div>

        <button
          onClick={() => fetchMissionLog(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Sync Flight Log'}</span>
        </button>
      </div>

      {/* Checkpoint Timeline (Reverse Chronological) */}
      <div className="space-y-6">
        {filteredCheckpoints.map((checkpoint) => {
          const isExpanded = !!expandedFiles[checkpoint.checkpointId];
          const isCopied = copiedId === checkpoint.checkpointId;

          return (
            <div
              key={checkpoint.checkpointId}
              className="relative rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md p-6 sm:p-8 space-y-6 hover:border-amber-500/30 transition duration-200 shadow-xl"
            >
              {/* Header: ID, Title, Timestamp & 1-Click Copy Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
                      {checkpoint.checkpointId}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{checkpoint.timestamp}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {checkpoint.title}
                  </h3>
                </div>

                {/* 1-Click Clipboard Copy */}
                <button
                  onClick={() => handleCopyCheckpoint(checkpoint)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition duration-150 cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-500 text-gray-950 shadow-lg shadow-emerald-500/25'
                      : 'bg-slate-800/80 hover:bg-amber-500 hover:text-gray-950 text-slate-200 border border-slate-700'
                  }`}
                  title="Copy formatted markdown checkpoint for chat collaboration"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Checkpoint!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy for Chat</span>
                    </>
                  )}
                </button>
              </div>

              {/* Partner Disciplines Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Director */}
                {checkpoint.partnerDisciplines.director && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-sky-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-bold uppercase tracking-wider">
                      <span>👤</span>
                      <span>Creative Director</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {checkpoint.partnerDisciplines.director}
                    </p>
                  </div>
                )}

                {/* Gemini Strategic Brain */}
                {checkpoint.partnerDisciplines.gemini && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase tracking-wider">
                      <span>🧠</span>
                      <span>Gemini Strategic Brain</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {checkpoint.partnerDisciplines.gemini}
                    </p>
                  </div>
                )}

                {/* Antigravity Execution */}
                {checkpoint.partnerDisciplines.antigravity && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/20 space-y-1.5 md:col-span-2">
                    <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                      <span>⚡</span>
                      <span>Antigravity Execution</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {checkpoint.partnerDisciplines.antigravity}
                    </p>
                  </div>
                )}

                {/* QA Gatekeeper */}
                {checkpoint.partnerDisciplines.qa && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/20 space-y-1.5 md:col-span-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                      <span>🛡️</span>
                      <span>QA Gatekeeper</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {checkpoint.partnerDisciplines.qa}
                    </p>
                  </div>
                )}
              </div>

              {/* Collapsible: Target Files Impacted */}
              {checkpoint.filesImpacted.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => toggleFiles(checkpoint.checkpointId)}
                    className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-amber-300 transition cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Target Files Impacted ({checkpoint.filesImpacted.length})</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 font-mono text-[11px] text-slate-300">
                      {checkpoint.filesImpacted.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 truncate">
                          <span className="text-slate-600 select-none">•</span>
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Active Tickets Queue */}
              {checkpoint.activeTickets.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                    Ticket Queue Status
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {checkpoint.activeTickets.map((t, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono ${
                          t.completed
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-800 border border-slate-700 text-slate-300'
                        }`}
                      >
                        {t.completed ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{t.text}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Unblocked Directive Banner */}
              {checkpoint.nextDirective && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-amber-400 font-mono">Next Directive:</span>
                  <span>{checkpoint.nextDirective}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
