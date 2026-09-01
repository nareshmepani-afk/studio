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
  Languages,
  Wand2,
  RotateCcw,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { checkAndPolishGrammar } from '@/actions/aiWeaver';
import {
  GiftTier,
  DeliveryMode,
  UnboxingLanguage,
  UNBOXING_LANGUAGE_LABELS,
  GIFT_TIER_DISPLAY,
  DedicationTone
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

interface DedicationPreset {
  id: string;
  icon: string;
  label: string;
  category: string;
  template: (name: string) => string;
}

const OCCASION_SPARKS: DedicationPreset[] = [
  {
    id: 'milestone',
    icon: '🎂',
    label: 'Milestone 70th / 80th',
    category: 'Birthday',
    template: (name) =>
      `Dear ${name || 'Mum'}, for your milestone celebration, we want to listen to and preserve every single story of your remarkable journey for generations to come.`,
  },
  {
    id: 'roots',
    icon: '🌳',
    label: 'Family Roots & Diaspora',
    category: 'Heritage',
    template: (name) =>
      `To our dearest ${name || 'Ba'}, your courage in crossing oceans built the life we have today. This is our gift to ensure your voice and wisdom echo forever.`,
  },
  {
    id: 'retirement',
    icon: '🕊️',
    label: 'Retirement & Wisdom',
    category: 'Milestone',
    template: (name) =>
      `Dear ${name || 'Dad'}, after a lifetime of hard work and quiet wisdom, it is time for your stories to take centre stage. Here is your studio to weave your memoir.`,
  },
  {
    id: 'devotion',
    icon: '💍',
    label: 'Decades of Devotion',
    category: 'Love',
    template: (name) =>
      `To our beloved ${name || 'Grandmother'}, the memories you have built across the decades are the greatest treasure of our family. This is our gift of remembrance.`,
  },
  {
    id: 'gratitude',
    icon: '💛',
    label: 'Voice of Gratitude',
    category: 'Family',
    template: (name) =>
      `Dear ${name || 'Storyteller'}, thank you for every bedtime story, every lesson, and every sacrifice. We are giving you this space so your voice is never forgotten.`,
  },
  {
    id: 'memoir',
    icon: '✨',
    label: 'Living History',
    category: 'Legacy',
    template: (name) =>
      `For ${name || 'our beloved family anchor'}: your memories are not just the past—they are the roadmap for our children and grandchildren. Welcome to your memoir.`,
  },
];

interface SalutationPreset {
  id: string;
  label: string;
  culture: string;
  prefix: (name: string) => string;
}

const SALUTATION_PRESETS: SalutationPreset[] = [
  {
    id: 'british',
    label: 'To our dearest...',
    culture: 'Classic British',
    prefix: (name) => `To our dearest ${name || 'Mum'}, `,
  },
  {
    id: 'gujarati',
    label: 'Mara Vhala... (મારા વ્હાલા)',
    culture: 'Gujarati',
    prefix: (name) => `Mara Vhala ${name || 'Ba'}, `,
  },
  {
    id: 'punjabi',
    label: 'Pujya... Ji (ਪੂਜਨੀਕ)',
    culture: 'Punjabi',
    prefix: (name) => `Pujya ${name || 'Pitaji'} Ji, `,
  },
  {
    id: 'hindi',
    label: 'Pujya... Ji (पूज्य)',
    culture: 'Hindi',
    prefix: (name) => `Pujya ${name || 'Mataji'} Ji, `,
  },
];

/**
 * Strips all common salutation prefixes iteratively to prevent stacked greetings
 */
function stripAllSalutations(raw: string): string {
  let cleaned = raw;
  const SALUTATION_STRIP_REGEX = /^(?:To\s+(?:our|my)\s+(?:dearest|beloved)\s+[^,:\n]+[,:\s-]+|To\s+(?:our|my)\s+[^,:\n]+[,:\s-]+|Dear\s+[^,:\n]+[,:\s-]+|Dearest\s+[^,:\n]+[,:\s-]+|For\s+(?:our|my)\s+[^,:\n]+[,:\s-]+|For\s+[^,:\n]+[,:\s-]+|Mara\s+Vhala\s+[^,:\n]+[,:\s-]+|Pujya\s+[^,:\n]+(?:\s+Ji)?[,:\s-]+|Pujneek\s+[^,:\n]+(?:\s+Ji)?[,:\s-]+|Honoured\s+[^,:\n]+[,:\s-]+|Beloved\s+[^,:\n]+[,:\s-]+)/i;
  for (let i = 0; i < 5; i++) {
    const next = cleaned.replace(SALUTATION_STRIP_REGEX, '').trim();
    if (next === cleaned) break;
    cleaned = next;
  }
  return cleaned;
}

export function VoucherMintingConsole() {
  const [tier, setTier] = useState<GiftTier>('generational_vault');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [vanitySuffix, setVanitySuffix] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('instant_link');
  const [unboxingLanguage, setUnboxingLanguage] = useState<UnboxingLanguage>('en');
  const [giftMessage, setGiftMessage] = useState('');

  // AI Dedication Muse State
  const [selectedTone, setSelectedTone] = useState<DedicationTone>('heartfelt');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [historyStack, setHistoryStack] = useState<string[]>([]);

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

  // Apply Occasion Spark preset
  const handleSelectSpark = (preset: DedicationPreset) => {
    if (giftMessage.trim()) {
      setHistoryStack((prev) => [...prev, giftMessage]);
    }
    setGiftMessage(preset.template(recipientName.trim()));
    toast.success(`Applied "${preset.label}" dedication spark!`);
  };

  // Apply Salutation prefix
  const handleApplySalutation = (salutation: SalutationPreset) => {
    const baseText = stripAllSalutations(giftMessage);
    const newPrefix = salutation.prefix(recipientName.trim());
    if (giftMessage.trim()) {
      setHistoryStack((prev) => [...prev, giftMessage]);
    }
    setGiftMessage(`${newPrefix}${baseText}`.trim());
    toast.info(`Updated salutation to ${salutation.label}`);
  };

  // Dictionary & Grammar Proofreading Handler
  const handleCheckGrammar = async () => {
    if (!giftMessage.trim()) {
      toast.error('Please enter a draft message first.');
      return;
    }

    setIsCheckingGrammar(true);
    setHistoryStack((prev) => [...prev, giftMessage]);

    toast('Proofreading Dedication...', {
      description: 'Checking dictionary spelling, grammar agreement & UK English.',
      icon: <BookOpen className="w-4 h-4 text-amber-400" />
    });

    try {
      const corrected = await checkAndPolishGrammar(giftMessage);
      if (corrected && corrected !== giftMessage) {
        setGiftMessage(corrected);
        toast.success('Spelling & Grammar Polished!', {
          description: 'Corrected typos and grammatical agreement while preserving voice.'
        });
      } else {
        toast.success('Dedication Clean & Print Ready', {
          description: 'No spelling or grammar errors detected.'
        });
      }
    } catch (err: any) {
      console.error('Grammar check error:', err);
      toast.error('Grammar proofreader unavailable. Draft preserved.');
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  // AI Muse Polish handler
  const handlePolishMessage = async () => {
    if (!giftMessage.trim()) {
      toast.error('Please enter a draft message or select an occasion spark first.');
      return;
    }

    setIsPolishing(true);
    setHistoryStack((prev) => [...prev, giftMessage]);

    try {
      const res = await fetch('/api/gift/polish-dedication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: giftMessage,
          tone: selectedTone,
          recipientName: recipientName.trim() || undefined,
          unboxingLanguage,
        }),
      });

      const data = await res.json();
      const polishedResult = data.polishedText || data.polished;
      if (polishedResult) {
        setGiftMessage(polishedResult);
        toast.success(`✨ Dedication polished with ${selectedTone} tone!`);
      } else {
        toast.info('Message already in optimal heirloom format.');
      }
    } catch (err) {
      console.error('AI Polish error:', err);
      toast.error('AI Muse is temporarily resting. Draft preserved.');
    } finally {
      setIsPolishing(false);
    }
  };

  // Undo last polish/preset edit
  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setGiftMessage(previous);
    toast.info('Reverted to previous draft.');
  };

  // Tidy message formatting
  const handleTidy = () => {
    if (!giftMessage.trim()) return;
    setHistoryStack((prev) => [...prev, giftMessage]);
    const cleaned = giftMessage
      .replace(/\s+/g, ' ')
      .replace(/["'“”]/g, '')
      .trim();
    setGiftMessage(cleaned.slice(0, 250));
    toast.success('Cleaned formatting and whitespace.');
  };

  const handleMint = async (overrideTier?: GiftTier, overrideRecipient?: string) => {
    const targetTier = overrideTier || tier;
    const targetRecipient = overrideRecipient || recipientName || 'Honoured Storyteller';
    const computedVanityCode = vanitySuffix.trim() ? `MW-${vanitySuffix.trim()}` : undefined;

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
          vanityCode: computedVanityCode,
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
      setVanitySuffix('');
      setRecipientName('');
      setRecipientEmail('');
      setGiftMessage('');
      setHistoryStack([]);
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

          {/* FIXED [ MW- ] PREFIX VANITY CODE INPUT */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Custom Vanity Code (Optional)
            </label>
            <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 focus-within:border-amber-500 overflow-hidden">
              <span className="px-3.5 py-2.5 bg-slate-900 border-r border-slate-800 text-amber-400 font-mono text-xs font-bold shrink-0 select-none">
                MW-
              </span>
              <input
                type="text"
                placeholder="FOUNDER-MUM or VIP-STORYTELLER"
                value={vanitySuffix}
                onChange={(e) => setVanitySuffix(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                className="w-full px-3 py-2.5 bg-transparent text-amber-300 font-mono text-xs placeholder-slate-600 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Prefix <code className="text-amber-400/90 font-bold">MW-</code> is locked. Enter 3–18 uppercase letters, digits, or hyphens.
            </p>
          </div>

          {/* RECIPIENT NAME */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Recipient Name
            </label>
            <input
              type="text"
              placeholder="e.g. Mum, Grandad Arthur, Elena"
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

        {/* FULL DEDICATION MUSE & OCCASION SPARKS */}
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                Personal Gift Dedication Message
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Printed on 5&quot;×7&quot; Keepsake &amp; Unboxing Ceremony
            </span>
          </div>

          {/* Occasion Sparks (1-Click Presets) */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-400 block">
              Occasion Sparks (1-Click Presets):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {OCCASION_SPARKS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectSpark(preset)}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-amber-500/50 hover:bg-amber-500/5 text-left transition group cursor-pointer"
                >
                  <span className="text-lg block mb-1 group-hover:scale-110 transition duration-200">
                    {preset.icon}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 block truncate group-hover:text-amber-300">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Multilingual Salutation Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 block">
              Salutations:
            </span>
            <div className="flex flex-wrap gap-2">
              {SALUTATION_PRESETS.map((salutation) => (
                <button
                  key={salutation.id}
                  type="button"
                  onClick={() => handleApplySalutation(salutation)}
                  className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:border-amber-500/50 hover:text-amber-300 text-xs font-mono transition cursor-pointer"
                >
                  {salutation.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dedication Textarea & Character Meter */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Dear Storyteller, we want to listen to and preserve every single memory for generations to come..."
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value.slice(0, 250))}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded">
                <span className={giftMessage.length > 230 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {giftMessage.length}
                </span>
                /250 Characters • 5&quot;×7&quot; Card Fit
              </div>
            </div>

            {/* AI Dedication Muse Polish Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Tone Selection */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-slate-400">Tone:</span>
                {[
                  { id: 'heartfelt', label: '💛 Heartfelt & Warm' },
                  { id: 'poetic', label: '📜 Poetic & Heritage' },
                  { id: 'celebratory', label: '🎉 Celebratory' },
                  { id: 'understated', label: '🏛️ Understated' },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setSelectedTone(tone.id as DedicationTone)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition cursor-pointer ${
                      selectedTone === tone.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {historyStack.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Undo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleTidy}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                  title="Fix punctuation, curly quotes and whitespace"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Tidy</span>
                </button>

                <button
                  type="button"
                  onClick={handleCheckGrammar}
                  disabled={isCheckingGrammar || isPolishing || !giftMessage.trim()}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-mono border border-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                  title="Check dictionary spelling, grammar agreement & UK English"
                >
                  {isCheckingGrammar ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3 h-3 text-amber-400" />
                      <span>Grammar &amp; Spelling</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePolishMessage}
                  disabled={isPolishing || isCheckingGrammar || !giftMessage.trim()}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-[10px] font-mono flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  {isPolishing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Polishing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>✨ Polish with AI Muse</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
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
                  title="Unboxing ceremonial route (Sprint 3 / Ticket #225)"
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
