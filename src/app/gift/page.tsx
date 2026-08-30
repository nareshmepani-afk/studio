'use client';

import { useState } from 'react';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Gift,
  Sparkles,
  ShieldCheck,
  Printer,
  Mail,
  Link as LinkIcon,
  Check,
  Loader2,
  Crown,
  Heart,
  Calendar,
  Languages
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  GIFT_TIER_DISPLAY,
  UNBOXING_LANGUAGE_LABELS,
  GiftTier,
  DeliveryMode,
  UnboxingLanguage,
  GiftCheckoutParams
} from '@/types/gift';

export default function GiftPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Tier selection
  const [selectedTier, setSelectedTier] = useState<GiftTier>('generational_vault');
  
  // Customization Form
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('printable_pdf');
  const [scheduledDate, setScheduledDate] = useState('');
  const [unboxingLanguage, setUnboxingLanguage] = useState<UnboxingLanguage>('en');
  const [giftMessage, setGiftMessage] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const activeTierConfig = GIFT_TIER_DISPLAY[selectedTier];

  const handleCheckout = async () => {
    if (!recipientName.trim()) {
      toast.error('Please enter the recipient\'s name.');
      return;
    }

    if (deliveryMode === 'scheduled_email' && !recipientEmail.trim()) {
      toast.error('Please provide the recipient\'s email for scheduled delivery.');
      return;
    }

    if (deliveryMode === 'scheduled_email' && !scheduledDate) {
      toast.error('Please select a scheduled delivery date.');
      return;
    }

    if (!user) {
      toast.info('Please log in or create an account to complete your gift purchase.');
      router.push(`/login?redirect=${encodeURIComponent('/gift')}`);
      return;
    }

    setIsLoading(true);

    try {
      const giftParams: GiftCheckoutParams = {
        isGift: true,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim() || undefined,
        giftMessage: giftMessage.trim() || 'A gift of living history for your family legacy.',
        deliveryMode,
        scheduledDeliveryDate: deliveryMode === 'scheduled_email' ? scheduledDate : undefined,
        unboxingLanguage,
      };

      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          currency: 'gbp',
          giftParams,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to initialize gift checkout.');
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Gift checkout error:', err);
      toast.error(err.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <PublicPageShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
        
        {/* HERO SECTION */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-wider uppercase">
            <Gift className="w-3.5 h-3.5" />
            <span>Act V Heirloom Gifting Suite</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Give the Gift of <span className="text-amber-400">Living History</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Commission a memoir for parents, grandparents, or loved ones. Pair a 5&quot;×7&quot; gold wax-sealed keepsake voucher card with an interactive 2.39:1 widescreen unboxing ceremony.
          </p>
        </div>

        {/* 2-TIER SELECTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* TIER 1: THE MILESTONE DIRECTOR'S EDITION */}
          <div
            onClick={() => setSelectedTier('director')}
            className={`relative rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 border ${
              selectedTier === 'director'
                ? 'bg-gray-900/90 border-amber-500 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500'
                : 'bg-gray-950/60 border-gray-800 hover:border-gray-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Milestone Special
              </span>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedTier === 'director' ? 'border-amber-400 bg-amber-400 text-gray-950' : 'border-gray-600'
              }`}>
                {selectedTier === 'director' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <h3 className="text-xl font-bold text-white">{GIFT_TIER_DISPLAY.director.editorialName}</h3>
            <p className="text-xs text-gray-400 mt-1">{GIFT_TIER_DISPLAY.director.subtitle}</p>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">{GIFT_TIER_DISPLAY.director.priceGbp}</span>
              <span className="text-xs text-gray-400">one-off gift payment</span>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-gray-300">
              {GIFT_TIER_DISPLAY.director.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* TIER 2: THE GENERATIONAL HEIRLOOM (FEATURED) */}
          <div
            onClick={() => setSelectedTier('generational_vault')}
            className={`relative rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 border ${
              selectedTier === 'generational_vault'
                ? 'bg-gradient-to-b from-gray-900 via-gray-900/90 to-amber-950/20 border-amber-400 shadow-2xl shadow-amber-500/20 ring-2 ring-amber-400/80'
                : 'bg-gray-950/60 border-gray-800 hover:border-gray-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
              <span className="px-3.5 py-1 rounded-full bg-amber-500 text-gray-950 text-xs font-bold font-mono tracking-wider uppercase flex items-center gap-1.5 shadow-lg">
                <Crown className="w-3.5 h-3.5" />
                Most Popular Heirloom
              </span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                Lifetime Archival
              </span>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedTier === 'generational_vault' ? 'border-amber-400 bg-amber-400 text-gray-950' : 'border-gray-600'
              }`}>
                {selectedTier === 'generational_vault' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <h3 className="text-xl font-bold text-white">{GIFT_TIER_DISPLAY.generational_vault.editorialName}</h3>
            <p className="text-xs text-gray-400 mt-1">{GIFT_TIER_DISPLAY.generational_vault.subtitle}</p>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-300">{GIFT_TIER_DISPLAY.generational_vault.priceGbp}</span>
              <span className="text-xs text-gray-400">perpetual lifetime gift</span>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-gray-200">
              {GIFT_TIER_DISPLAY.generational_vault.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* CUSTOMISATION & DEDICATION FORM */}
        <div className="bg-gray-900/80 rounded-2xl p-6 sm:p-10 border border-gray-800 space-y-8">
          
          <div className="border-b border-gray-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Heart className="w-5 h-5 text-rose-400" />
              <span>Personalise Your Heirloom Keepsake</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Customise the details that appear on the physical keepsake card and throughout the cinematic unboxing ritual.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT: FORM INPUTS */}
            <div className="space-y-6">
              
              {/* RECIPIENT NAME */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Storyteller / Recipient Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mum, Grandad Arthur, Elena"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 text-sm font-sans"
                  required
                />
              </div>

              {/* DELIVERY MODE SELECTOR */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Keepsake Delivery Mode *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('printable_pdf')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      deliveryMode === 'printable_pdf'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Printer className="w-4 h-4 mb-2" />
                    <span className="text-xs font-bold block text-white">5&quot;×7&quot; Keepsake PDF</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Print at home card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('instant_link')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      deliveryMode === 'instant_link'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 mb-2" />
                    <span className="text-xs font-bold block text-white">Instant Link</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">WhatsApp / SMS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('scheduled_email')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      deliveryMode === 'scheduled_email'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Mail className="w-4 h-4 mb-2" />
                    <span className="text-xs font-bold block text-white">Scheduled Email</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Automated dispatch</span>
                  </button>

                </div>
              </div>

              {/* CONDITIONAL SCHEDULED FIELDS */}
              {deliveryMode === 'scheduled_email' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-950 border border-gray-800">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      placeholder="storyteller@family.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Delivery Date *
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-white text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              {/* UNBOXING LANGUAGE SELECTOR */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unboxing Ceremony Language</span>
                </label>
                <select
                  value={unboxingLanguage}
                  onChange={(e) => setUnboxingLanguage(e.target.value as UnboxingLanguage)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white text-sm font-sans focus:outline-none focus:border-amber-500"
                >
                  {Object.entries(UNBOXING_LANGUAGE_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  The recipient will see their welcoming greeting in this language when unboxing their pass.
                </p>
              </div>

              {/* DEDICATION MESSAGE */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Personal Gift Dedication Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Dear Mum, for your 70th birthday, we want to listen to and preserve every single story of your journey for generations to come..."
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 text-sm font-sans"
                />
              </div>

            </div>

            {/* RIGHT: LIVE CARD PREVIEW */}
            <div className="flex flex-col justify-between space-y-6">
              
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                  Live Keepsake Preview (5&quot;×7&quot; Vector Voucher)
                </label>
                
                <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/30 border border-amber-500/40 shadow-2xl relative overflow-hidden space-y-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                    <div className="text-amber-400 font-serif font-bold text-lg tracking-wide">
                      MEMORY WEAVER
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      HEIRLOOM PASS
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-mono text-gray-400">PRESENTED TO:</div>
                    <div className="text-xl font-serif font-bold text-white">
                      {recipientName || 'Dear Storyteller'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300 italic line-clamp-3">
                    &quot;{giftMessage || 'A gift of living history to capture your life\'s memories for generations to come...'}&quot;
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-mono text-gray-400">TIER</div>
                      <div className="text-xs font-bold text-amber-300">{activeTierConfig.editorialName}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-amber-400/50 bg-amber-500/10 flex items-center justify-center text-amber-300 font-serif text-xs font-bold shadow-inner">
                      SEAL
                    </div>
                  </div>
                </div>
              </div>

              {/* CHECKOUT ACTION BUTTON */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full py-6 text-base font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Preparing Secure Stripe Checkout...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Gift Purchase — {activeTierConfig.priceGbp}</span>
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Secure 256-Bit Encrypted Stripe Checkout • VAT Invoice Provided</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </PublicPageShell>
  );
}
