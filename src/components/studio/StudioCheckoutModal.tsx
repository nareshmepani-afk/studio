'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Coffee, ShieldCheck, CheckCircle2, ArrowRight, Lock, Crown, Award } from 'lucide-react';
import { getHostPassPriceAction } from '@/actions/getHostPassPriceAction';
import type { GetHostPassPriceOutput } from '@/ai/flows/get-host-pass-price-flow';
import { toast } from 'sonner';

interface StudioCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCity?: string;
  userCountry?: string;
}

export const StudioCheckoutModal: React.FC<StudioCheckoutModalProps> = ({
  isOpen,
  onClose,
  userCity = 'London',
  userCountry = 'UK'
}) => {
  const [pricing, setPricing] = useState<GetHostPassPriceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<'pass' | 'vault'>('vault');

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    getHostPassPriceAction({ city: userCity, country: userCountry })
      .then((res) => {
        setPricing(res);
      })
      .catch((err) => console.error('[StudioCheckoutModal] Price fetch error:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen, userCity, userCountry]);

  if (!isOpen) return null;

  const currencySymbol = pricing?.currency === 'GBP' ? '£' : pricing?.currency === 'EUR' ? '€' : '$';
  const passAmount = pricing?.passPrice || 12.99;
  const vaultAmount = pricing?.lifetimeVaultPrice || 195.00;

  const handleCheckout = (tier: 'pass' | 'vault') => {
    const title = tier === 'vault' ? 'Lifetime Heirloom Vault' : '31-Day Host Pass';
    toast.success(`Redirecting to Secure Payment for ${title}...`, {
      description: `Price: ${currencySymbol}${tier === 'vault' ? vaultAmount : passAmount}`,
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />
    });
  };

  return (
    <div className="fixed inset-0 z-[25000] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-4xl bg-slate-900 border-2 border-amber-500/40 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_90px_rgba(245,158,11,0.25)] space-y-8 relative overflow-hidden text-left"
      >
        {/* Modal Top Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Memory Weaver Production Suite</span>
              </span>
            </div>
            <h2 className="text-3xl font-headline italic font-bold text-white">
              Upgrade Your Storytelling Deck
            </h2>
            <p className="text-xs text-white/50 font-mono uppercase tracking-wider">
              Dynamic Localized Pricing Powered by Coffee Index AI ({userCity}, {userCountry})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Side-by-Side Tier Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* OPTION A: 31-DAY HOST PASS */}
          <div
            onClick={() => setSelectedTier('pass')}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative space-y-4 ${
              selectedTier === 'pass'
                ? 'bg-slate-950 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.2)] scale-[1.02]'
                : 'bg-slate-950/60 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                  Pay-As-You-Go Pass
                </span>
                <h3 className="text-xl font-headline font-bold text-white italic">
                  31-Day Host Pass
                </h3>
              </div>
              <Coffee className="w-6 h-6 text-amber-400" />
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-bold text-white font-mono">
                {currencySymbol}{passAmount.toFixed(2)} <span className="text-xs font-normal text-white/50">/ 31 Days</span>
              </div>
              <p className="text-[10px] font-mono text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full inline-block">
                ☕ Cost of ~1 coffee per week (Non-recurring)
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-white/70 pt-2 border-t border-white/10">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlock Parts II–VI & Family Storytelling Suite</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>31 days full studio access — 0 recurring charges</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>4K Exhibition exports & full-resolution downloads</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckout('pass');
              }}
              className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold uppercase tracking-widest rounded-2xl border border-white/10 transition-all cursor-pointer"
            >
              Activate 31-Day Pass
            </button>
          </div>

          {/* OPTION B: LIFETIME HEIRLOOM VAULT (RECOMMENDED) */}
          <div
            onClick={() => setSelectedTier('vault')}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative space-y-4 ${
              selectedTier === 'vault'
                ? 'bg-slate-950 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.3)] scale-[1.02]'
                : 'bg-slate-950/60 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="absolute -top-3.5 right-6 px-3 py-1 bg-emerald-500 text-slate-950 text-[9px] font-mono font-black uppercase tracking-widest rounded-full shadow-lg">
              ✨ RECOMMENDED VALUE
            </div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                  One-Time Family Archival
                </span>
                <h3 className="text-xl font-headline font-bold text-white italic">
                  Lifetime Heirloom Vault
                </h3>
              </div>
              <Award className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-bold text-emerald-300 font-mono">
                {currencySymbol}{vaultAmount.toFixed(2)} <span className="text-xs font-normal text-white/50">one-time</span>
              </div>
              <p className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 rounded-full inline-block">
                ☕ {pricing?.vaultMicrocopy || 'Equivalent to 60 local coffees — zero monthly rent forever'}
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-white/70 pt-2 border-t border-white/10">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Permanent lifetime 4K cloud vault & offline archive zip</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited guest video streaming & zero monthly rent forever</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Includes all future Studio enhancements & AI Directors</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckout('vault');
              }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-black uppercase tracking-widest rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Unlock Lifetime Vault</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>

        </div>

        {/* Footer Security Shield */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-Bit SSL Encrypted Checkout • Purchasing Power Parity (PPP) Active</span>
          </div>
          <span>Memory Weaver Studio v1.1.0</span>
        </div>
      </motion.div>
    </div>
  );
};
