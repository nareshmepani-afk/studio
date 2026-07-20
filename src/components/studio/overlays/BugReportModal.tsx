'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Bug, ChevronDown, ChevronUp, Loader2, Send } from 'lucide-react';
import { sendBugReportAction } from '@/actions/sendBugReportAction';
import { APP_VERSION } from '@/config/version';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function BugReportModal({ isOpen, onClose, user }: BugReportModalProps) {
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [telemetryId, setTelemetryId] = useState<string | null>(null);
  const [diagnosticsPayload, setDiagnosticsPayload] = useState<{
    traceId: string;
    userId: string;
    userEmail: string;
    userAgent: string;
    path: string;
    timestamp: string;
    version: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      let tid = sessionStorage.getItem('mw_telemetry_id');
      if (!tid) {
        tid = `mw_telemetry_${Math.random().toString(36).substring(2, 15)}`;
        sessionStorage.setItem('mw_telemetry_id', tid);
      }
      setTelemetryId(tid);

      setDiagnosticsPayload({
        traceId: tid,
        userId: user?.uid || 'guest_preview',
        userEmail: user?.email || 'unauthenticated',
        userAgent: navigator.userAgent,
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
        version: APP_VERSION
      });
    }
  }, [isOpen, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Description Required", { description: "Please describe what happened." });
      return;
    }

    startTransition(async () => {
      try {
        const res = await sendBugReportAction({
          description,
          diagnostics: diagnosticsPayload || {
            traceId: telemetryId || `mw_telemetry_${Math.random().toString(36).substring(2, 15)}`,
            userId: user?.uid || 'guest_preview',
            userEmail: user?.email || 'unauthenticated',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            path: typeof window !== 'undefined' ? window.location.pathname : '',
            timestamp: new Date().toISOString(),
            version: APP_VERSION
          }
        });

        if (res.success) {
          toast.success("Issue Reported", { description: "Diagnostics sent directly to our support queue." });
          setDescription('');
          onClose();
        } else {
          toast.error("Submission Failed", { description: res.message });
        }
      } catch (err) {
        toast.error("Network Error", { description: "Could not establish connection with support services." });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-slate-950 border border-amber-500/20 text-white rounded-[2rem] overflow-hidden shadow-2xl p-0">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="relative p-8 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-black border-b border-white/5 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Bug className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] font-mono">
                Studio Telemetry Link
              </span>
            </div>

            <DialogTitle className="text-2xl font-black font-headline italic tracking-tight text-white mb-2 leading-none">
              Report Studio Issue
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 leading-relaxed">
              Describe the issue or error you encountered. Telemetry details will be appended automatically.
            </DialogDescription>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-4 bg-black/40">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">
                Issue Description
              </label>
              <Textarea
                placeholder="What action did you perform, and what went wrong?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                className="bg-white/5 border-white/10 rounded-xl min-h-[100px] text-sm text-white placeholder-zinc-500 focus-visible:ring-amber-500/50"
              />
            </div>

            {/* Collapsible Diagnostics Drawer */}
            <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
              <button
                type="button"
                onClick={() => setShowDiagnostics(prev => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                <span className="font-mono">Trace: {telemetryId || 'Loading...'}</span>
                {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showDiagnostics && diagnosticsPayload && (
                <div className="p-4 bg-black/60 border-t border-white/5 max-h-[150px] overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-1">
                  <p><span className="text-amber-500">traceId:</span> "{diagnosticsPayload.traceId}"</p>
                  <p><span className="text-amber-500">userId:</span> "{diagnosticsPayload.userId}"</p>
                  <p><span className="text-amber-500">userEmail:</span> "{diagnosticsPayload.userEmail}"</p>
                  <p><span className="text-amber-500">path:</span> "{diagnosticsPayload.path}"</p>
                  <p><span className="text-amber-500">version:</span> "{diagnosticsPayload.version}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-zinc-900/40 border-t border-white/5 flex gap-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              disabled={isPending}
              className="flex-1 h-12 bg-transparent border-white/10 text-white font-extrabold uppercase text-[10px] tracking-widest hover:bg-white/5 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isPending}
              className="flex-grow-[2] h-12 bg-amber-500 hover:bg-amber-600 text-black font-extrabold uppercase text-[10px] tracking-widest rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  Send Report <Send className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
