'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import { Button } from '@/components/ui/button';
import {
  Gift,
  Copy,
  Check,
  Printer,
  Sparkles,
  ArrowRight,
  Loader2,
  Share2,
  MessageCircle,
  MessageSquare,
  Send,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { GIFT_TIER_DISPLAY, GiftTier } from '@/types/gift';

function GiftConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voucherData, setVoucherData] = useState<{
    code: string;
    tier: GiftTier;
    recipientName: string;
    giverName: string;
    giftMessage: string;
  }>({
    code: 'MW-VAULT-LIVE-PASS',
    tier: 'generational_vault',
    recipientName: 'Honoured Storyteller',
    giverName: 'Family Producer',
    giftMessage: 'A special heirloom gift to capture and preserve your memories.',
  });

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Verify session and retrieve real voucher code from backend
    fetch(`/api/checkout/verify-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVoucherData({
            code: data.voucherCode || 'MW-VAULT-LIVE-PASS',
            tier: data.tier || 'generational_vault',
            recipientName: data.recipientName || 'Honoured Storyteller',
            giverName: data.giverName || 'Family Producer',
            giftMessage: data.giftMessage || 'A special heirloom gift to capture and preserve your memories.',
          });
        }
      })
      .catch((err) => {
        console.warn('Session verification fallback:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  const unboxingUrl = `https://dev.memoryweaver.studio/unboxing/${voucherData.code}`;

  const shareText = `Dear ${voucherData.recipientName},\n\nI have commissioned a special heirloom gift for you on Memory Weaver to record and preserve your life story for our family.\n\nOpen your wax-sealed unboxing ceremony here:\n${unboxingUrl}`;

  // WhatsApp Universal Link (works on mobile app + desktop WhatsApp Web)
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  // Universal SMS Link (works on iOS & Android native SMS app)
  const smsUrl = `sms:?&body=${encodeURIComponent(shareText)}`;

  const copyUnboxingLink = () => {
    navigator.clipboard.writeText(unboxingUrl);
    setCopied(true);
    toast.success('Unboxing link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Heirloom Gift for ${voucherData.recipientName}`,
          text: shareText,
          url: unboxingUrl,
        });
        toast.success('Gift invitation shared successfully!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          copyUnboxingLink();
        }
      }
    } else {
      copyUnboxingLink();
    }
  };

  const tierDisplay = GIFT_TIER_DISPLAY[voucherData.tier] || GIFT_TIER_DISPLAY.generational_vault;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      
      {/* CELEBRATION HEADER */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Your Heirloom Gift Has Been Commissioned!
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto">
          Thank you for preserving your family&apos;s living history. Your gift voucher pass is generated and ready for the unboxing ritual.
        </p>
      </div>

      {/* VOUCHER CONTAINER CARD */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/20 border border-amber-500/40 shadow-2xl space-y-8">
        
        {/* CARD TOP BAR */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white font-serif tracking-wide">ACT V HEIRLOOM KEEPSAKE VOUCHER</span>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PAYMENT CONFIRMED</span>
          </span>
        </div>

        {/* VOUCHER DETAILS & RECIPIENT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950/60 p-4 rounded-xl border border-gray-800">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-gray-400">PRESENTED TO</span>
            <div className="text-base font-serif font-bold text-white">{voucherData.recipientName}</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-gray-400">MEMBERSHIP TIER</span>
            <div className="text-sm font-bold text-amber-300">{tierDisplay.editorialName}</div>
          </div>
        </div>

        {/* INSTANT DISPATCH ACTION BAR (PHONE & DESKTOP PARITY) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              <span>Instant Link Dispatch (WhatsApp, SMS & Share)</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">Phone & Desktop Ready</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* WHATSAPP 1-CLICK DISPATCH */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Share on WhatsApp</span>
            </a>

            {/* SMS / MESSAGES 1-CLICK DISPATCH */}
            <a
              href={smsUrl}
              className="px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-sky-600/20 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Send via SMS / Text</span>
            </a>

            {/* NATIVE SHARE TRAY / CLIPBOARD */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Share Tray / Apps</span>
            </button>

          </div>
        </div>

        {/* DIRECT URL BOX WITH 1-CLICK COPY */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            Direct Unboxing Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={unboxingUrl}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-amber-300 font-mono text-xs select-all focus:outline-none"
            />
            <Button
              onClick={copyUnboxingLink}
              className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer border border-gray-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-800">
          <Link
            href={unboxingUrl}
            target="_blank"
            className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition border border-gray-700"
          >
            <span>Preview Unboxing Ceremony</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => window.print()}
            className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition border border-gray-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Keepsake Card</span>
          </button>
        </div>

      </div>

      {/* FOOTER NAVIGATION */}
      <div className="text-center pt-2">
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
