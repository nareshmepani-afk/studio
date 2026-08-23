'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Pause, 
  Play, 
  XSquare, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw,
  Mail,
  Check,
  Filter,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { EmailTemplateId, EMAIL_TEMPLATES_CATALOG } from '@/lib/emailTemplates';
import { ParsedAudienceRow, generateBatchAuditCsv } from '@/lib/audienceCsvParser';
import { 
  sendAdminBatchChunkAction, 
  EmailDispatchReceipt 
} from '@/app/admin/emailActions';
import { toast } from 'sonner';

export interface BulkEmailDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: EmailTemplateId;
  audienceRows: ParsedAudienceRow[];
  pacingIntervalMs: number; // e.g. 500ms, 200ms, 100ms
  chunkSize: number; // 5 to 10
  onBatchUpdated?: (updatedRows: ParsedAudienceRow[]) => void;
}

export type BatchTransmissionState = 'IDLE' | 'TRANSMITTING' | 'PAUSED' | 'COMPLETED' | 'ABORTED';

export function BulkEmailDispatchModal({
  isOpen,
  onClose,
  templateId,
  audienceRows,
  pacingIntervalMs,
  chunkSize = 5,
  onBatchUpdated
}: BulkEmailDispatchModalProps) {
  const [rows, setRows] = useState<ParsedAudienceRow[]>([]);
  const [transmissionState, setTransmissionState] = useState<BatchTransmissionState>('IDLE');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'PENDING'>('ALL');
  const [downloadingReport, setDownloadingReport] = useState(false);

  // References for pause/abort loop control
  const isPausedRef = useRef(false);
  const isAbortedRef = useRef(false);
  const isRunningRef = useRef(false);
  const rowsRef = useRef<ParsedAudienceRow[]>([]);

  // Synchronise rows state to ref for resilient async state reading
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Initialise rows when modal opens
  useEffect(() => {
    if (isOpen && audienceRows.length > 0) {
      // Deep clone audience rows to maintain local tracking
      const initial = audienceRows.map(r => ({ ...r }));
      setRows(initial);
      setTransmissionState('IDLE');
      setElapsedSeconds(0);
      isPausedRef.current = false;
      isAbortedRef.current = false;
      isRunningRef.current = false;
    }
  }, [isOpen, audienceRows]);

  // Elapsed timer ticker
  useEffect(() => {
    let interval: any = null;
    if (transmissionState === 'TRANSMITTING') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [transmissionState]);

  const templateMeta = useMemo(() => {
    return EMAIL_TEMPLATES_CATALOG.find(t => t.id === templateId) || EMAIL_TEMPLATES_CATALOG[0];
  }, [templateId]);

  // Metrics computation
  const totalCount = rows.length;
  const deliveredCount = rows.filter(r => r.status === 'DELIVERED').length;
  const simulatedCount = rows.filter(r => r.status === 'SIMULATED' || (r.receipt?.status === 'SIMULATED')).length;
  const successfulCount = deliveredCount + simulatedCount;
  const failedCount = rows.filter(r => r.status === 'FAILED').length;
  const skippedCount = rows.filter(r => r.status === 'SKIPPED').length;
  const pendingCount = rows.filter(r => r.status === 'PENDING' || r.status === 'QUEUED' || r.status === 'IN_FLIGHT').length;
  const processedCount = totalCount - pendingCount;
  const progressPercent = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  // Estimated Time Remaining (ETA)
  const remainingCount = pendingCount;
  const estimatedSecondsRemaining = Math.ceil(
    (remainingCount / Math.max(1, chunkSize)) * ((pacingIntervalMs * chunkSize + 300) / 1000)
  );

  /**
   * Directive 1 & 2: Chunked batch loop with resume idempotency and queue pacing
   */
  const startTransmissionLoop = async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    isPausedRef.current = false;
    isAbortedRef.current = false;
    setTransmissionState('TRANSMITTING');

    try {
      while (isRunningRef.current) {
        if (isAbortedRef.current) {
          setTransmissionState('ABORTED');
          break;
        }

        if (isPausedRef.current) {
          setTransmissionState('PAUSED');
          break;
        }

        // Get current snapshot of rows and find the next pending slice
        const currentRows = rowsRef.current;
        const pendingItems = currentRows.filter(
          r => r.isValid && (r.status === 'PENDING' || r.status === 'QUEUED')
        );

        if (pendingItems.length === 0) {
          // All valid items have been processed
          setTransmissionState('COMPLETED');
          toast.success('Batch Transmission Complete', {
            description: `Processed ${processedCount + 1} audience contacts.`
          });
          break;
        }

        // Slice chunk bounded to chunkSize (5-10 items)
        const chunk = pendingItems.slice(0, chunkSize);
        const chunkIds = new Set(chunk.map(c => c.id));

        // Optimistically set status to IN_FLIGHT
        setRows(prev => {
          const next = prev.map(item => chunkIds.has(item.id) ? { ...item, status: 'IN_FLIGHT' as const } : item);
          rowsRef.current = next;
          return next;
        });

        // Pacing delay between chunk dispatches
        if (pacingIntervalMs > 0) {
          await new Promise(resolve => setTimeout(resolve, pacingIntervalMs));
        }

        // Check again after pacing delay
        if (isAbortedRef.current || isPausedRef.current) continue;

        // Execute server action for chunk
        const dispatchChunkPayload = chunk.map(c => ({
          id: c.id,
          email: c.email,
          props: c.props
        }));

        const chunkResult = await sendAdminBatchChunkAction({
          templateId,
          recipients: dispatchChunkPayload,
          delayMsBetweenEmails: Math.min(100, Math.floor(pacingIntervalMs / chunkSize))
        });

        if (chunkResult.success && chunkResult.results) {
          // Merge receipts idempotently
          const receiptsMap = new Map<string, EmailDispatchReceipt>();
          chunkResult.results.forEach(res => {
            receiptsMap.set(res.id, res.receipt);
          });

          setRows(prev => {
            const next = prev.map(item => {
              if (receiptsMap.has(item.id)) {
                const receipt = receiptsMap.get(item.id)!;
                const rowStatus: ParsedAudienceRow['status'] = receipt.status === 'FAILED' ? 'FAILED' : receipt.status === 'SIMULATED' ? 'SIMULATED' : 'DELIVERED';
                return {
                  ...item,
                  status: rowStatus,
                  receipt
                };
              }
              return item;
            });
            rowsRef.current = next;
            if (onBatchUpdated) onBatchUpdated(next);
            return next;
          });
        } else {
          // Mark this chunk as failed due to action error
          const errorMsg = chunkResult.error || 'Batch chunk execution failure.';
          setRows(prev => {
            const next: ParsedAudienceRow[] = prev.map(item => {
              if (chunkIds.has(item.id)) {
                const failedReceipt: EmailDispatchReceipt = {
                  success: false,
                  status: 'FAILED',
                  templateId,
                  targetEmail: item.email,
                  subject: '',
                  timestamp: new Date().toISOString(),
                  spfValid: false,
                  dkimValid: false,
                  dmarcValid: false,
                  error: errorMsg
                };
                return {
                  ...item,
                  status: 'FAILED' as const,
                  errorReason: errorMsg,
                  receipt: failedReceipt
                };
              }
              return item;
            });
            rowsRef.current = next;
            if (onBatchUpdated) onBatchUpdated(next);
            return next;
          });
        }
      }
    } catch (err: any) {
      console.error('[BulkEmailDispatchModal] Batch loop error:', err);
      toast.error('Batch Loop Interrupted', { description: err?.message || 'Transmission encountered an error.' });
      setTransmissionState('ABORTED');
    } finally {
      isRunningRef.current = false;
    }
  };

  const handlePause = () => {
    isPausedRef.current = true;
    toast.info('Pausing Batch Transmission...', { description: 'Completing in-flight chunk then pausing.' });
  };

  const handleResume = () => {
    isPausedRef.current = false;
    startTransmissionLoop();
  };

  const handleAbort = () => {
    isAbortedRef.current = true;
    isPausedRef.current = false;
    isRunningRef.current = false;
    setTransmissionState('ABORTED');
    toast.warning('Batch Transmission Cancelled', { description: 'Unsent recipients retained as PENDING.' });
  };

  const handleExportCsvReport = async () => {
    setDownloadingReport(true);
    try {
      const csvReport = await generateBatchAuditCsv(rows.map(r => ({ id: r.id, receipt: r.receipt })));
      const blob = new Blob([csvReport], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `memoryweaver_batch_report_${templateId}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Transmission Report Exported', { description: 'CSV audit report saved.' });
    } catch (err) {
      toast.error('Export Failed', { description: 'Could not generate report CSV.' });
    } finally {
      setDownloadingReport(false);
    }
  };

  // Filtered rows for the live stream feed
  const filteredRows = useMemo(() => {
    switch (activeFilter) {
      case 'SUCCESS':
        return rows.filter(r => r.status === 'DELIVERED' || r.status === 'SIMULATED' || r.receipt?.status === 'SIMULATED');
      case 'FAILED':
        return rows.filter(r => r.status === 'FAILED');
      case 'PENDING':
        return rows.filter(r => r.status === 'PENDING' || r.status === 'QUEUED' || r.status === 'IN_FLIGHT');
      default:
        return rows;
    }
  }, [rows, activeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] border-amber-500/30">
        
        {/* Modal Top Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Live Batch Transmission Engine
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {templateMeta.name}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Rate-limited queue pacing with real-time Resend API delivery receipts &amp; SPF/DKIM verification.
              </p>
            </div>
          </div>

          {/* Status Indicator & Close */}
          <div className="flex items-center gap-3">
            {transmissionState === 'TRANSMITTING' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                TRANSMITTING ({pacingIntervalMs}ms pace)
              </div>
            )}

            {transmissionState === 'PAUSED' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <Pause className="h-3 w-3" />
                PAUSED
              </div>
            )}

            {transmissionState === 'COMPLETED' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Check className="h-3.5 w-3.5" />
                BATCH COMPLETED
              </div>
            )}

            {transmissionState === 'ABORTED' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                <AlertCircle className="h-3.5 w-3.5" />
                CANCELLED
              </div>
            )}

            {transmissionState === 'IDLE' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                READY TO LAUNCH
              </div>
            )}

            <button
              onClick={onClose}
              disabled={transmissionState === 'TRANSMITTING'}
              className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & KPI Metrics Ribbon */}
        <div className="p-6 bg-slate-950/40 border-b border-slate-800 space-y-4">
          
          {/* Animated Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Transmission Velocity &amp; Queue Progress
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {processedCount} / {totalCount} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">Total Audience</span>
              <span className="text-lg font-extrabold text-white font-mono">{totalCount}</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400/80 block">
                {simulatedCount > 0 && deliveredCount === 0 ? 'Simulated' : 'Delivered'}
              </span>
              <span className="text-lg font-extrabold text-emerald-400 font-mono">{successfulCount}</span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/20">
              <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400/80 block">Failed</span>
              <span className="text-lg font-extrabold text-rose-400 font-mono">{failedCount}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">In Queue / Remaining</span>
              <span className="text-lg font-extrabold text-amber-400 font-mono">{pendingCount}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                {transmissionState === 'COMPLETED' ? 'Total Time' : 'Time / ETA'}
              </span>
              <span className="text-xs font-semibold text-slate-300 font-mono block mt-1">
                {elapsedSeconds}s {transmissionState === 'TRANSMITTING' && remainingCount > 0 ? `(~${estimatedSecondsRemaining}s left)` : ''}
              </span>
            </div>
          </div>

        </div>

        {/* Live Stream Receipt Feed Header & Filter Tabs */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Individual Delivery Receipts Stream
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              ({filteredRows.length} showing)
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setActiveFilter('SUCCESS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeFilter === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Success ({successfulCount})
            </button>
            <button
              onClick={() => setActiveFilter('FAILED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeFilter === 'FAILED' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Failed ({failedCount})
            </button>
            <button
              onClick={() => setActiveFilter('PENDING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeFilter === 'PENDING' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Pending ({pendingCount})
            </button>
          </div>
        </div>

        {/* Live Stream Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 min-h-[260px] max-h-[360px] bg-slate-950/20 font-sans">
          {filteredRows.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No contacts matching the selected filter.
            </div>
          ) : (
            filteredRows.map((row) => {
              const receipt = row.receipt;
              const isSimulated = row.status === 'SIMULATED' || receipt?.status === 'SIMULATED';
              const isDelivered = row.status === 'DELIVERED' || receipt?.status === 'DELIVERED';
              const isFailed = row.status === 'FAILED' || receipt?.status === 'FAILED';
              const isPending = row.status === 'PENDING' || row.status === 'QUEUED';
              const isInFlight = row.status === 'IN_FLIGHT';

              return (
                <div
                  key={row.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDelivered || isSimulated
                      ? 'bg-slate-900/40 border-slate-800/90'
                      : isFailed
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : isInFlight
                      ? 'bg-amber-950/20 border-amber-500/40 animate-pulse'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-70'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate max-w-[280px]">
                        {row.name || 'Storyteller Director'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 truncate">
                        &lt;{row.email}&gt;
                      </span>
                    </div>
                    {receipt?.subject && (
                      <p className="text-[10px] text-slate-500 truncate max-w-md">
                        {receipt.subject}
                      </p>
                    )}
                    {row.errorReason && (
                      <p className="text-[10px] text-rose-400">
                        {row.errorReason}
                      </p>
                    )}
                  </div>

                  {/* Receipt Verification & Status Tag */}
                  <div className="flex items-center gap-3 shrink-0">
                    
                    {/* SPF/DKIM verification badge */}
                    {(isDelivered || isSimulated) && receipt && (
                      <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="h-3 w-3" /> SPF
                        </span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="h-3 w-3" /> DKIM
                        </span>
                      </div>
                    )}

                    {/* Message ID / Timestamp */}
                    {receipt?.messageId && (
                      <span className="text-[10px] font-mono text-slate-500 hidden md:inline select-all">
                        {receipt.messageId.slice(0, 16)}...
                      </span>
                    )}

                    {/* Status Pill */}
                    {isDelivered && (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        DELIVERED
                      </span>
                    )}

                    {isSimulated && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        SIMULATED
                      </span>
                    )}

                    {isFailed && (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                        FAILED
                      </span>
                    )}

                    {isInFlight && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3 animate-spin" /> DISPATCHING
                      </span>
                    )}

                    {isPending && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        QUEUED
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Bottom Control Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left Action: Export Report */}
          <button
            onClick={handleExportCsvReport}
            disabled={processedCount === 0 || downloadingReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Download Transmission Report (.csv)
          </button>

          {/* Right Controls: Start, Pause, Resume, Abort */}
          <div className="flex items-center gap-3">
            {transmissionState === 'IDLE' && (
              <button
                onClick={startTransmissionLoop}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition"
              >
                <Play className="h-4 w-4 fill-current" />
                Launch Batch ({totalCount} Recipients)
              </button>
            )}

            {transmissionState === 'TRANSMITTING' && (
              <>
                <button
                  onClick={handlePause}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition"
                >
                  <Pause className="h-4 w-4" />
                  Pause Transmission
                </button>
                <button
                  onClick={handleAbort}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition"
                >
                  <XSquare className="h-4 w-4" />
                  Abort Batch
                </button>
              </>
            )}

            {transmissionState === 'PAUSED' && (
              <>
                <button
                  onClick={handleResume}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Resume Transmission ({pendingCount} Left)
                </button>
                <button
                  onClick={handleAbort}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition"
                >
                  <XSquare className="h-4 w-4" />
                  Abort Batch
                </button>
              </>
            )}

            {(transmissionState === 'COMPLETED' || transmissionState === 'ABORTED') && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Close &amp; Return to Console
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
