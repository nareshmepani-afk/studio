import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase-admin';
import { normaliseVoucherCode } from '@/lib/voucherTokens';
import UnboxingCeremonyStage, { type SerializedGiftVoucher } from '@/components/gifting/UnboxingCeremonyStage';
import type { GiftVoucherDocument } from '@/types/gift';
import { Film, ShieldAlert, Archive, Sparkles, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ code: string }>;
}

async function fetchVoucherFromDb(rawCode: string): Promise<{ voucher: GiftVoucherDocument | null; normalisedCode: string }> {
  const normalisedCode = normaliseVoucherCode(rawCode);
  if (!adminDb) {
    return { voucher: null, normalisedCode };
  }

  try {
    const snap = await adminDb.collection('gift_vouchers').doc(normalisedCode).get();
    if (!snap.exists) {
      return { voucher: null, normalisedCode };
    }
    return { voucher: snap.data() as GiftVoucherDocument, normalisedCode };
  } catch (error) {
    console.error('Error reading voucher from Firestore:', error);
    return { voucher: null, normalisedCode };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const { voucher } = await fetchVoucherFromDb(code);

  const giverName = voucher?.giverName;
  const title = giverName
    ? `An heirloom commissioned in your honour by ${giverName}`
    : 'Heirloom Unboxing Ceremony | Memory Weaver';

  const description = giverName
    ? `An heirloom production pass commissioned in your honour by ${giverName}. Step onto your family soundstage.`
    : 'Step into your family soundstage with a commissioned heirloom pass.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Memory Weaver',
      locale: 'en_GB',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function UnboxingPage({ params }: PageProps) {
  const { code } = await params;
  const { voucher, normalisedCode } = await fetchVoucherFromDb(code);

  // ── STATE A: VALID & UNREDEEMED ──────────────────────────────────────────
  if (voucher && voucher.status === 'unredeemed') {
    const serializedVoucher: SerializedGiftVoucher = {
      code: voucher.code || normalisedCode,
      tier: voucher.tier,
      vaultQuotaGb: voucher.vaultQuotaGb,
      durationDays: voucher.durationDays,
      status: voucher.status,
      giverUid: voucher.giverUid,
      giverName: voucher.giverName,
      giverEmail: voucher.giverEmail,
      giftMessage: voucher.giftMessage,
      recipientName: voucher.recipientName,
      recipientEmail: voucher.recipientEmail,
      deliveryMode: voucher.deliveryMode,
      unboxingLanguage: voucher.unboxingLanguage || 'en',
      purchasedAt: typeof voucher.purchasedAt === 'string' ? voucher.purchasedAt : '',
      redeemedAt: typeof voucher.redeemedAt === 'string' ? voucher.redeemedAt : null,
    };

    return <UnboxingCeremonyStage voucher={serializedVoucher} code={normalisedCode} />;
  }

  // ── STATE B: ALREADY REDEEMED ────────────────────────────────────────────
  if (voucher && voucher.status === 'redeemed') {
    const formattedRedeemedDate = voucher.redeemedAt
      ? new Date(voucher.redeemedAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'an earlier date';

    const claimSummary = voucher.redeemedByEmail
      ? `Claimed on ${formattedRedeemedDate} by ${voucher.redeemedByEmail}`
      : `Claimed on ${formattedRedeemedDate}`;

    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-gray-950">
        {/* Top Matte Bar */}
        <header className="w-full bg-black/90 border-b border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-mono tracking-widest text-amber-300/80 uppercase">
              Memory Weaver • Archival Slate
            </span>
          </div>
          <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">
            ARCHIVE LEDGER
          </span>
        </header>

        {/* 2.39:1 Anamorphic Framing Container */}
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
          <div className="w-full max-w-4xl md:aspect-[2.39/1] min-h-[460px] bg-[#0c0d10] border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] p-6 sm:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="space-y-6 max-w-xl mx-auto">
              {/* Slate Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs tracking-widest uppercase">
                <Archive className="w-3.5 h-3.5 text-amber-400" />
                <span>Archival Pass Record</span>
              </div>

              {/* Slate Title */}
              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
                Heirloom Pass Claimed
              </h1>

              {/* Claim Details */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-200/90 text-sm sm:text-base space-y-1">
                <p className="font-semibold text-amber-100">{claimSummary}</p>
                <p className="text-xs font-mono text-gray-400">
                  Pass Code: {normalisedCode} • {voucher.tier === 'generational_vault' ? 'Generational Vault (100 GB)' : 'Director Pass (31-Day)'}
                </p>
              </div>

              <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto">
                This pass was originally commissioned in your honour by{' '}
                <span className="text-amber-300 font-semibold">{voucher.giverName}</span>{' '}
                and is active in the studio.
              </p>

              {/* Direct Studio Link */}
              <div className="pt-2">
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-gray-950 font-bold text-base shadow-xl shadow-amber-500/25 transition-all duration-200"
                >
                  <span>Enter Memory Studio</span>
                  <span className="font-mono text-lg">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Matte Bar */}
        <footer className="w-full bg-black/90 border-t border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30">
          <span className="text-[11px] font-mono text-gray-500">
            AUTHENTICATED ARCHIVE STATE
          </span>
          <span className="text-[11px] font-mono text-amber-300/80">
            {normalisedCode}
          </span>
        </footer>
      </div>
    );
  }

  // ── STATE C: INVALID / NOT FOUND ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-gray-950">
      {/* Top Matte Bar */}
      <header className="w-full bg-black/90 border-b border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-xs font-mono tracking-widest text-gray-400 uppercase">
            Memory Weaver • Pass Verification
          </span>
        </div>
        <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">
          SECURITY PROTOCOL
        </span>
      </header>

      {/* 2.39:1 Obsidian Slate Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
        <div className="w-full max-w-4xl md:aspect-[2.39/1] min-h-[460px] bg-[#0c0d10] border border-red-900/30 rounded-2xl sm:rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] p-6 sm:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="space-y-6 max-w-xl mx-auto">
            {/* Slate Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/50 border border-red-500/30 text-red-300 font-mono text-xs tracking-widest uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Verification Failed</span>
            </div>

            {/* Obsidian Slate Title */}
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
              Heirloom Pass Not Found
            </h1>

            <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-md mx-auto">
              We could not locate an active heirloom pass matching the code{' '}
              <span className="font-mono text-amber-400 font-semibold">{normalisedCode}</span>.
              Please check the code on your 5&quot;×7&quot; keepsake card or contact the family member who gifted it to you.
            </p>

            {/* Action CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-semibold text-sm transition"
              >
                <span>Return to Memory Weaver</span>
                <span className="font-mono text-base">↗</span>
              </Link>
              <Link
                href="/gift"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-sm transition"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Gift an Heirloom Pass</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Matte Bar */}
      <footer className="w-full bg-black/90 border-t border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30">
        <span className="text-[11px] font-mono text-gray-500">
          INVALID OR EXPIRED ENTRY
        </span>
        <span className="text-[11px] font-mono text-gray-500">
          {normalisedCode}
        </span>
      </footer>
    </div>
  );
}
