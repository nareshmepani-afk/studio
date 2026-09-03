'use client';

import React, { useState } from 'react';
import { Film, Mail, Camera, Mic, Check, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendStudioTransitionAction } from '@/actions/sendStudioTransitionAction';

interface MobilePortalOverlayProps {
  onActivateRemoteLens: () => void;
  onExit: () => void;
  userEmail?: string;
  promptId?: string;
  memoryTitle?: string;
}

export const MobilePortalOverlay: React.FC<MobilePortalOverlayProps> = ({
  onActivateRemoteLens,
  onExit,
  userEmail = '',
  promptId,
  memoryTitle
}) => {
  const [emailInput, setEmailInput] = useState(userEmail);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const getStudioLink = () => {
    if (typeof window === 'undefined') return '/studio';
    return window.location.href;
  };

  const handleSendEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSending(true);
    try {
      const targetPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/studio/production/${promptId || ''}`;
      const result = await sendStudioTransitionAction({
        email: emailInput.trim(),
        targetPath,
        memoryTitle
      });

      if (result.success) {
        setIsSent(true);
        toast.success(result.message || 'Studio transition link dispatched!');
      } else {
        toast.error(result.message || 'Unable to send email.');
      }
    } catch (err: any) {
      toast.error('Failed to send email. Please copy the direct link below.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = () => {
    try {
      const link = getStudioLink();
      navigator.clipboard.writeText(link);
      setIsCopied(true);
      toast.success('Soundstage link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      toast.error('Could not copy link automatically.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black/95 backdrop-blur-xl p-4 sm:p-6 text-slate-100 overflow-y-auto">
      <div className="w-full max-w-md mx-auto my-auto py-6 space-y-6">
        
        {/* TOP HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1 shadow-lg shadow-amber-500/10">
            <Film className="h-8 w-8 text-amber-400" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
            THEATRICAL PRODUCTION SOUNDSTAGE
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
            Optimised for Larger Screens
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto font-sans">
            The multi-track soundstage, teleprompter, and recording console are engineered for tablets (iPad), laptops, or desktop computers (screen width 768px+).
          </p>
        </div>

        {/* 3-WAY CHOICE FORK */}
        <div className="space-y-3.5 pt-1">
          
          {/* CHOICE 1 (PRIMARY): EMAIL TRANSITION LINK */}
          <div className="rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-amber-500/40 p-4 shadow-xl shadow-black/60 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                    Choice 1 • Recommended
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Instant
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white font-sans">
                  Email Me a Magic Studio Link
                </h3>
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                  Send a 1-tap link to your inbox so you can seamlessly step onto your soundstage from your iPad, Mac, or PC.
                </p>
              </div>
            </div>

            {isSent ? (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Link sent to <strong>{emailInput}</strong>! Open on your tablet or laptop.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSent(false)}
                  className="text-[10px] text-emerald-400 underline cursor-pointer shrink-0"
                >
                  Resend
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email for iPad/PC"
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-500 font-sans"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0 disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Link ↗</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-gray-800/80">
              <span className="text-[10px] font-mono text-gray-400">Or copy direct link:</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? 'Link Copied!' : 'Copy Soundstage URL'}</span>
              </button>
            </div>
          </div>

          {/* CHOICE 2: PAIR AS WIRELESS 4K CAMERA LENS */}
          <div className="rounded-2xl bg-gray-900/80 border border-indigo-500/30 p-4 shadow-lg space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0 mt-0.5">
                <Camera className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                  Choice 2 • Companion Hardware
                </span>
                <h3 className="text-sm font-bold text-white font-sans">
                  Pair as Wireless 4K Cinema Lens
                </h3>
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                  Use this smartphone as a wireless high-definition optical camera lens while your tablet or laptop displays the teleprompter.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onActivateRemoteLens}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Launch Mobile Lens Mode ↗</span>
            </button>
          </div>

          {/* CHOICE 3: FIRESIDE AUDIO MODE (COMING SOON TEASER) */}
          <div className="rounded-2xl bg-gray-900/60 border border-amber-500/20 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0 mt-0.5">
                <Mic className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300/90 uppercase tracking-wide">
                    Choice 3 • In Production
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    MW-87
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
                  <span>🎙️ Fireside Audio Mode</span>
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                  A couch-friendly voice recorder for your phone is in production. For now, open your soundstage on an iPad, laptop, or PC.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM EXIT ACTION */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onExit}
            className="text-xs text-gray-400 hover:text-white underline font-sans cursor-pointer transition"
          >
            Return to Memories Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
