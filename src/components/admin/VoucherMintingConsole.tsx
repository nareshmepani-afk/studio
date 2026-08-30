'use client';

import React, { useState } from 'react';
import {
  Gift,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
  Crown,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Languages
} from 'lucide-react';
import { toast } from 'sonner';
import {
  GiftTier,
  DeliveryMode,
  UnboxingLanguage,
  UNBOXING_LANGUAGE_LABELS,
  GIFT_TIER_DISPLAY
} from '@/types/gift';

interface MintedVoucherItem {
  code: string;
  tier: GiftTier;
  recipientName: string;
  giverName: string;
  status: 'unredeemed' | 'redeemed';
  purchasedAt: string;
  giftMessage: string;
}

export function VoucherMintingConsole() {
  const [tier, setTier] = useState<GiftTier>('generational_vault');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [vanityCode, setVanityCode] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('instant_link');
  const [unboxingLanguage, setUnboxingLanguage] = useState<UnboxingLanguage>('en');
  const [giftMessage, setGiftMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [mintedList, setMintedList] = useState<MintedVoucherItem[]>([
    {
      code: 'MW-VAULT-7K8P-9Q2M',
      tier: 'generational_vault',
      recipientName: 'Albert Einstein (Demo)',
      giverName: 'Hermann Einstein',
      status: 'unredeemed',
      purchasedAt: new Date().toISOString(),
      giftMessage: 'Remember the mystery behind all things.',
    },
  ]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleMint = async (overrideTier?: GiftTier, overrideRecipient?: string) => {
    const targetTier = overrideTier || tier;
    const targetRecipient = overrideRecipient || recipientName || 'Honoured Storyteller';

    setIsLoading(true);

    try {
      const res = await fetch('/api/gift/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: targetTier,
          giverUid: 'admin_founder',
          giverName: 'Memory Weaver Founder',
          giverEmail: 'founder@memoryweaver.studio',
          giftMessage: giftMessage || 'With love and reverence for your life story.',
          recipientName: targetRecipient,
          recipientEmail: recipientEmail || undefined,
          deliveryMode,
          unboxingLanguage,
          vanityCode: vanityCode.trim() || undefined,
          amountPaid: 0,
          currency: 'gbp',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.code) {
        throw new Error(data.error || 'Failed to mint voucher pass');
      }

      const newItem: MintedVoucherItem = {
        code: data.code,
        tier: targetTier,
        recipientName: targetRecipient,
        giverName: 'Memory Weaver Founder',
        status: 'unredeemed',
        purchasedAt: new Date().toISOString(),
        giftMessage: giftMessage || 'With love and reverence for your life story.',
      };

      setMintedList((prev) => [newItem, ...prev]);
      toast.success(`Voucher ${data.code} minted successfully!`);

      // Reset form
      setVanityCode('');
      setRecipientName('');
      setRecipientEmail('');
      setGiftMessage('');
    } catch (err: any) {
      console.error('Minting error:', err);
      toast.error(err.message || 'Error minting voucher pass');
    } finally {
      setIsLoading(false);
    }
  };

  const copyUnboxingLink = (code: string) => {
    const url = `https://dev.memoryweaver.studio/unboxing/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast.success('Unboxing URL copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8">
      
      {/* HEADER & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Gift className="w-4 h-4" />
            <span>Act V Heirloom Gifting Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Voucher Minting & Heirloom Pass Console
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mint complimentary founder passes, test vouchers, and vanity codes for manual redemption testing.
          </p>
        </div>

        {/* 1-CLICK QUICK MINT PRESETS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleMint('director', 'Test Director Storyteller')}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono border border-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Quick Mint: Director (31d)</span>
          </button>

          <button
            onClick={() => handleMint('generational_vault', 'Test Heirloom Storyteller')}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>+ Quick Mint: Heirloom (Lifetime)</span>
          </button>
        </div>
      </div>

      {/* MINTING FORM CONTAINER */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Manual Voucher Minting Suite</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* TIER SELECTOR */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Membership Tier
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTier('director')}
                className={`p-3 rounded-xl border text-left transition ${
                  tier === 'director'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white">Director Edition</div>
                <div className="text-[10px] text-slate-400 mt-0.5">31-Day Pass • 15 GB Vault</div>
              </button>

              <button
                type="button"
                onClick={() => setTier('generational_vault')}
                className={`p-3 rounded-xl border text-left transition ${
                  tier === 'generational_vault'
                    ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white">Generational Heirloom</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Lifetime • 100 GB Vault</div>
              </button>
            </div>
          </div>

          {/* VANITY CODE (OPTIONAL) */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Custom Vanity Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. MW-FOUNDER-MUM"
              value={vanityCode}
              onChange={(e) => setVanityCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Must start with &quot;MW-&quot; followed by 3–18 uppercase letters/digits/hyphens.
            </p>
          </div>

          {/* RECIPIENT NAME */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Recipient Name
            </label>
            <input
              type="text"
              placeholder="e.g. Arthur Pendelton"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* UNBOXING LANGUAGE */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>Unboxing Ceremony Language</span>
            </label>
            <select
              value={unboxingLanguage}
              onChange={(e) => setUnboxingLanguage(e.target.value as UnboxingLanguage)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
            >
              {Object.entries(UNBOXING_LANGUAGE_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* DEDICATION MESSAGE */}
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
            Personal Gift Message (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="A special heirloom gift to capture and preserve your memories..."
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>

        {/* MINT ACTION BUTTON */}
        <button
          onClick={() => handleMint()}
          disabled={isLoading}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase font-mono flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/10"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Minting Voucher In Firestore...</span>
            </>
          ) : (
            <>
              <Gift className="w-4 h-4" />
              <span>Mint Custom Voucher Pass</span>
            </>
          )}
        </button>

      </div>

      {/* MINTED VOUCHERS LIST */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Active / Recently Minted Vouchers ({mintedList.length})
          </h3>
          <span className="text-[11px] font-mono text-slate-500">Live Staging Context</span>
        </div>

        <div className="space-y-3">
          {mintedList.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {item.code}
                  </code>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    item.tier === 'generational_vault' ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.tier === 'generational_vault' ? '👑 Lifetime Vault (100 GB)' : '🎬 Director (31 Days)'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  <span>Storyteller: </span>
                  <strong className="text-white">{item.recipientName}</strong>
                  <span className="text-slate-500"> • </span>
                  <span className="text-slate-400 italic">&quot;{item.giftMessage}&quot;</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <button
                  onClick={() => copyUnboxingLink(item.code)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedCode === item.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === item.code ? 'Copied' : 'Copy URL'}</span>
                </button>

                <a
                  href={`https://dev.memoryweaver.studio/unboxing/${item.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30 flex items-center gap-1.5 transition"
                >
                  <span>Open Unboxing</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
