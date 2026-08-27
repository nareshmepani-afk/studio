'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function StagingLockContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const destination = searchParams.get('from') || '/studio';

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the staging access passcode.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/staging-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid passcode. Access denied.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Brief delay for visual feedback before seamless redirect
      setTimeout(() => {
        window.location.href = destination;
      }, 500);
    } catch (err: any) {
      console.error('[StagingLock] Network error:', err);
      setError('Network error validating passcode. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 flex flex-col justify-between p-4 sm:p-8 font-sans relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <span className="text-amber-400 font-serif font-bold text-lg">M</span>
          </div>
          <div>
            <span className="font-serif font-bold tracking-tight text-white text-base">Memory Weaver</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block -mt-1 font-semibold">Staging Sandbox</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>Perimeter Protected</span>
        </div>
      </header>

      {/* Main Lock Card */}
      <main className="max-w-md w-full mx-auto my-auto relative z-10">
        <div className="bg-[#0C0C0C]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80 relative overflow-hidden">
          {/* Subtle top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"></div>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400 text-2xl shadow-inner">
              🔒
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Authorised Access Only
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
              This preview environment is restricted to verified studio directors and core development team members.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label htmlFor="passcode" className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Studio Access Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (e.g. MW-STAGE-2026)..."
                autoFocus
                disabled={loading || success}
                className="w-full bg-black/70 border border-white/15 focus:border-amber-500/70 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all font-mono tracking-wider"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono">
                <span>✓</span>
                <span>Passcode verified. Unlocking studio...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Verifying Passcode...</span>
                </>
              ) : (
                <span>Unlock Staging Sandbox →</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-[11px] text-neutral-500 font-mono">
              Unlocks 30-day authenticated session for this browser.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-neutral-600 font-mono relative z-10 py-2">
        <span>Memory Weaver © 2026 • Confidential Staging Node</span>
      </footer>
    </div>
  );
}
