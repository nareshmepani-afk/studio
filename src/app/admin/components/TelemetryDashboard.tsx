'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, startAfter, getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Loader2, Zap, Clock, ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';

interface TelemetryData {
  durationMs: number;
  threads: number;
  resolution: string;
  fps: number;
  transcoder: string;
  completedAt: string;
}

interface VideoJob {
  id: string;
  inviteId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'stalled';
  videoUrl?: string;
  telemetry?: TelemetryData;
  logs?: string[];
  memoryWarning?: boolean; // Instantly flagged near-threshold marker
  updatedAt?: string;
}

export function TelemetryDashboard() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedJobLogs, setSelectedJobLogs] = useState<VideoJob | null>(null);
  
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const PAGE_SIZE = 15;

  // Process logs dynamically to detect memory warnings exceeding 85% utilization and container timeouts
  const preprocessJob = (docId: string, data: DocumentData): VideoJob => {
    const logs: string[] = data.logs || [];
    const memoryWarning = logs.some(log => 
      log.toLowerCase().includes('memory limit') || 
      log.toLowerCase().includes('exceeded') || 
      /memory.*(?:8[5-9]|9[0-9]|100)%/.test(log.toLowerCase())
    );

    // OOM HEARTBEAT TIMEOUT: Check if processing is stuck past 600s
    let status = data.status || 'queued';
    const lastUpdate = data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now();
    const isStalled = status === 'processing' && (Date.now() - lastUpdate > 600 * 1000);
    if (isStalled) {
      status = 'stalled';
    }

    return {
      id: docId,
      inviteId: data.inviteId || '',
      status,
      videoUrl: data.videoUrl,
      telemetry: data.telemetry,
      logs,
      memoryWarning
    };
  };

  const fetchJobs = useCallback(async (isFirstLoad = false) => {
    try {
      if (isFirstLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const jobsRef = collection(db, 'video_jobs');
      let q = query(
        jobsRef, 
        orderBy('telemetry.completedAt', 'desc'), 
        limit(PAGE_SIZE)
      );

      if (!isFirstLoad && lastDocRef.current) {
        q = query(
          jobsRef, 
          orderBy('telemetry.completedAt', 'desc'), 
          startAfter(lastDocRef.current), 
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        
        const newJobs = snapshot.docs.map(doc => preprocessJob(doc.id, doc.data()));
        
        setJobs(prev => {
          if (isFirstLoad) return newJobs;
          // Filter duplicates to prevent index offset collision during scroll-triggered paginations
          const existingIds = new Set(prev.map(j => j.id));
          return [...prev, ...newJobs.filter(j => !existingIds.has(j.id))];
        });

        if (snapshot.docs.length < PAGE_SIZE) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("[TelemetryDashboard] Ingestion error stream failed:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(true);
  }, [fetchJobs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mr-3" />
        <span className="text-slate-400 font-medium">Streaming Telemetry Ingestion...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white">Transcoder Telemetry Monitor</h2>
          <p className="text-sm text-slate-400">Real-time multi-core GCF container processing performance stats</p>
        </div>
        <div className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full text-indigo-400 text-xs font-mono">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>Cursor Pagination Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {jobs.slice(0, 4).map((job) => (
          <div key={job.id} className={`bg-slate-900/60 border p-4 rounded-xl space-y-3 transition-all ${
            job.memoryWarning ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">JOB ID: {job.id.substring(0, 8)}</span>
              <div className="flex items-center space-x-2">
                {job.memoryWarning && (
                  <button 
                    onClick={() => setSelectedJobLogs(job)}
                    className="text-amber-500 hover:text-amber-400 flex items-center transition-colors" 
                    title="Memory Warning: Past 85% Utilization limit. Click to view logs."
                  >
                    <AlertTriangle className="h-4 w-4 animate-bounce" />
                  </button>
                )}
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                  job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                  job.status === 'stalled' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' :
                  job.status === 'failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {job.status}
                </span>
              </div>
            </div>

            {job.telemetry ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center"><Clock className="h-3.5 w-3.5 mr-1" /> Latency</span>
                  <span className="font-semibold text-white">{job.telemetry.durationMs}ms</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center"><Cpu className="h-3.5 w-3.5 mr-1" /> Threads</span>
                  <span className="font-semibold text-white">{job.telemetry.threads} vCPUs</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center"><Zap className="h-3.5 w-3.5 mr-1" /> Format</span>
                  <span className="font-semibold text-white">{job.telemetry.resolution} @ {job.telemetry.fps}fps</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4 text-xs text-slate-500 italic">
                {job.status === 'stalled' ? (
                  <span className="flex items-center text-rose-400/80"><ShieldAlert className="h-4 w-4 mr-1" /> Container Stalled / OOM</span>
                ) : job.status === 'failed' ? (
                  <span className="flex items-center text-rose-400/80"><ShieldAlert className="h-4 w-4 mr-1" /> Interpolation Failure</span>
                ) : 'Processing Ingestion...'}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedJobLogs && (
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white">FFmpeg Logs: Job {selectedJobLogs.id}</h3>
              <p className="text-xs text-slate-400">Diagnostic logging traces for active transcoder segment processing</p>
            </div>
            <button 
              onClick={() => setSelectedJobLogs(null)}
              className="text-slate-500 hover:text-white text-xs font-semibold uppercase transition-colors"
            >
              Dismiss Console
            </button>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto space-y-1.5 border border-slate-900">
            {selectedJobLogs.logs && selectedJobLogs.logs.length > 0 ? (
              selectedJobLogs.logs.map((log, index) => (
                <div key={index} className={`py-0.5 ${
                  log.toLowerCase().includes('warning') || log.toLowerCase().includes('corrupt') ? 'text-amber-400' :
                  log.toLowerCase().includes('error') || log.toLowerCase().includes('fail') ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {log}
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic">No diagnostic logs recorded for this task.</div>
            )}
          </div>
        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
            <tr>
              <th className="p-4">Job ID</th>
              <th className="p-4">Status</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Allocation</th>
              <th className="p-4">Specs</th>
              <th className="p-4">Warning</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
            {jobs.map((job) => (
              <tr key={job.id} className={`hover:bg-slate-900/20 transition-all ${
                job.memoryWarning ? 'bg-amber-500/5 hover:bg-amber-500/10' : ''
              }`}>
                <td className="p-4 text-slate-400">{job.id}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-md ${
                    job.status === 'completed' ? 'text-emerald-400 bg-emerald-500/5' :
                    job.status === 'stalled' ? 'text-rose-500 bg-rose-500/5 font-semibold' :
                    job.status === 'failed' ? 'text-rose-400 bg-rose-500/5' : 'text-amber-400 bg-amber-500/5'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="p-4 font-semibold text-white">
                  {job.telemetry ? `${job.telemetry.durationMs}ms` : '—'}
                </td>
                <td className="p-4">
                  {job.telemetry ? `${job.telemetry.threads} vCPUs` : '—'}
                </td>
                <td className="p-4 text-slate-400">
                  {job.telemetry ? `${job.telemetry.resolution} (${job.telemetry.transcoder})` : '—'}
                </td>
                <td className="p-4">
                  {job.memoryWarning ? (
                    <button 
                      onClick={() => setSelectedJobLogs(job)}
                      className="text-amber-500 hover:text-amber-400 flex items-center font-bold text-[10px] uppercase space-x-1 transition-colors"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Memory Thrash</span>
                    </button>
                  ) : (
                    <span className="text-slate-500">Nominal</span>
                  )}
                </td>
                <td className="p-4 text-slate-500">
                  {job.telemetry ? new Date(job.telemetry.completedAt).toLocaleTimeString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => fetchJobs(false)}
            disabled={loadingMore}
            className="flex items-center px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Syncing Pages...</span>
              </>
            ) : (
              <span>Load More Records</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
