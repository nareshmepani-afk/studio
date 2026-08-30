'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Gift,
  Copy,
  Check,
  Printer,
  Sparkles,
  ArrowRight,
  Loader2,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function GiftConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voucherData, setVoucherData] = useState<{
    code: string;
    tier: string;
    recipientName: string;
    giverName: string;
  } | null>(null);

  useEffect(() => {
    // In production, poll or fetch session details; for now simulate resolved session
    const timer = setTimeout(() => {
      setLoading(false);
      setVoucherData({
        code: 'MW-VAULT-LIVE-PASS',
        tier: 'generational_vault',
        recipientName: 'Honoured Storyteller',
        giverName: 'Family Producer',
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [sessionId]);

  const unboxingUrl = `https://dev.memoryweaver.studio/unboxing/${voucherData?.code || 'MW-VAULT-LIVE-PASS'}`;

  const copyUnboxingLink = () => {
    navigator.clipboard.writeText(unboxingUrl);
    setCopied(true);
    toast.success('Unboxing link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      
      {/* CELEBRATION HEADER */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Your Heirloom Gift Has Been Commissioned!
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto">
          Thank you for preserving your family&apos;s living history. Your gift voucher pass is generated and ready for the unboxing ritual.
        </p>
      </div>

      {/* VOUCHER CARD CONTAINER */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/20 border border-amber-500/40 shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white font-serif">ACT V HEIRLOOM KEEPSAKE VOUCHER</span>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            PAYMENT CONFIRMED
          </span>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-gray-400">DIRECT UNBOXING CEREMONY URL</div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={unboxingUrl}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-amber-300 font-mono text-xs select-all focus:outline-none"
            />
            <Button
              onClick={copyUnboxingLink}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </Button>
          </div>
          <p className="text-[11px] text-gray-400">
            Send this private link to your storyteller via WhatsApp, SMS, or email to invite them to the ceremony.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Link
            href={unboxingUrl}
            className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition border border-gray-700"
          >
            <span>Preview Unboxing Ceremony</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => window.print()}
            className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition border border-gray-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Keepsake Card</span>
          </button>
        </div>

      </div>

      {/* FOOTER ACTIONS */}
      <div className="text-center pt-4">
        <Link
          href="/dashboard"
          className="text-xs font-mono text-gray-400 hover:text-amber-400 transition"
        >
          ← Return to Studio Dashboard
        </Link>
      </div>

    </div>
  );
}

export default function GiftConfirmationPage() {
  return (
    <PublicPageShell>
      <Suspense fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      }>
        <GiftConfirmationContent />
      </Suspense>
    </PublicPageShell>
  );
}
