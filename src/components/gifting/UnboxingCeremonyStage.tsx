'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Film, Sparkles, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { playWaxCrackAudio } from '@/lib/audio/unboxingAudio';
import { useAuth } from '@/hooks/useAuth';
import type { GiftTier, VoucherStatus, UnboxingLanguage } from '@/types/gift';

export interface SerializedGiftVoucher {
  code: string;
  tier: GiftTier;
  vaultQuotaGb?: number;
  durationDays?: number | null;
  status: VoucherStatus;
  giverUid?: string;
  giverName: string;
  giverEmail?: string;
  giftMessage: string;
  recipientName: string;
  recipientEmail?: string | null;
  deliveryMode?: string;
  unboxingLanguage?: UnboxingLanguage;
  purchasedAt?: string;
  redeemedAt?: string | null;
}

export interface UnboxingCeremonyStageProps {
  voucher: SerializedGiftVoucher;
  code: string;
}

interface CulturalSalutationConfig {
  badge: string;
  salutation: (name: string) => string;
  subtitle: string;
  envelopeSealText: string;
  dedicationLead: string;
  blessing: string;
  soundstageCta: string;
}

const CULTURAL_CONFIGS: Record<UnboxingLanguage, CulturalSalutationConfig> = {
  en: {
    badge: 'HEIRLOOM PASS',
    salutation: (name: string) => `Welcome, ${name || 'Storyteller'}`,
    subtitle: 'Your memories are the foundation of our family.',
    envelopeSealText: 'Click Wax Seal to Open',
    dedicationLead: 'A Commissioned Living Memoir',
    blessing: 'With enduring love, reverence, and gratitude',
    soundstageCta: 'Step Onto Your Soundstage ↗',
  },
  gu: {
    badge: 'વારસાગત ભેટ',
    salutation: (name: string) => `સ્વાગત છે, ${name || 'દાદા / બા'}`,
    subtitle: 'તમારી જીવનયાત્રા અમારા પરિવારનો અમૂલ્ય વારસો છે.',
    envelopeSealText: 'મુદ્રા તોડીને પ્રવેશ કરો',
    dedicationLead: 'તમારા જીવનની અમૂલ્ય સ્મૃતિઓ',
    blessing: 'અખંડ પ્રેમ, આદર અને કૃતજ્ઞતા સાથે',
    soundstageCta: 'તમારા રંગમંચ પર પધારો ↗',
  },
  pa: {
    badge: 'ਵਿਰਾਸਤੀ ਤੋਹਫ਼ਾ',
    salutation: (name: string) => `ਜੀ ਆਇਆਂ ਨੂੰ, ${name || 'ਬਾਬਾ ਜੀ / ਮਾਤਾ ਜੀ'}`,
    subtitle: 'ਤੁਹਾਡੀਆਂ ਯਾਦਾਂ ਸਾਡੇ ਪਰਿਵਾਰ ਦਾ ਅਨਮੋਲ ਖ਼ਜ਼ਾਨਾ ਹਨ।',
    envelopeSealText: 'ਮੋਹਰ ਤੋੜ ਕੇ ਖੋਲ੍ਹੋ',
    dedicationLead: 'ਤੁਹਾਡੀ ਜ਼ਿੰਦਗੀ ਦਾ ਅਨਮੋਲ ਸਫ਼ਰ',
    blessing: 'ਸਤਿਕਾਰ, ਅਥਾਹ ਪਿਆਰ ਅਤੇ ਅਸੀਸਾਂ ਸਹਿਤ',
    soundstageCta: 'ਆਪਣੇ ਰੰਗਮੰਚ ਵਿੱਚ ਦਾਖ਼ਲ ਹੋਵੋ ↗',
  },
  hi: {
    badge: 'धरोहर उपहार',
    salutation: (name: string) => `हार्दिक स्वागत, ${name || 'दादाजी / माताजी'}`,
    subtitle: 'आपकी यादें और अनुभव हमारे परिवार की अनमोल धरोहर हैं।',
    envelopeSealText: 'मुद्रा तोड़कर खोलें',
    dedicationLead: 'आपके जीवन की अनमोल स्मृतियाँ',
    blessing: 'असीम स्नेह, आदर और कृतज्ञता सहित',
    soundstageCta: 'अपने रंगमंच पर पधारें ↗',
  },
};

export default function UnboxingCeremonyStage({ voucher, code }: UnboxingCeremonyStageProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Progression: 'entrance' (Phase 1) -> 'crack' (Phase 2) -> 'revealed' (Phases 3 & 4)
  const [phase, setPhase] = useState<'entrance' | 'crack' | 'revealed'>('entrance');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const language = voucher.unboxingLanguage || 'en';
  const cultural = CULTURAL_CONFIGS[language] || CULTURAL_CONFIGS.en;

  // Pre-calculated 12-particle gold ember explosion geometry
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 90 + (i % 3) * 32;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const emberColours = ['#F59E0B', '#D4AF37', '#FDE68A', '#FBBF24'];
      return {
        id: i,
        x,
        y,
        colour: emberColours[i % emberColours.length],
        scale: 1 + (i % 3) * 0.25,
      };
    });
  }, []);

  const handleSealTap = () => {
    if (phase !== 'entrance') return;

    // 1. Procedural acoustics: 528Hz + 792Hz harmonic resonance + noise burst snap
    playWaxCrackAudio();

    // 2. Tactile haptics on mobile devices
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([25, 60, 35]);
      } catch {
        // Haptic feedback ignored when unavailable
      }
    }

    // 3. Phase 2: Seal fracture and ember explosion
    setPhase('crack');

    // 4. Smooth cinematic transition to Phase 3 & 4
    setTimeout(() => {
      setPhase('revealed');
    }, 900);
  };

  const handleRedeem = async () => {
    setIsRedeeming(true);
    setErrorMessage(null);

    // If unauthenticated, route to login preserving redemption return target
    if (!isAuthenticated && !user) {
      router.push(`/login?redirect=${encodeURIComponent(`/unboxing/${code}`)}`);
      return;
    }

    try {
      const res = await fetch('/api/gift/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(`/unboxing/${code}`)}`);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.code === 'VOUCHER_ALREADY_REDEEMED') {
          setErrorMessage('This heirloom pass has already been claimed and activated.');
        } else {
          setErrorMessage(data.message || data.error || 'Unable to claim heirloom pass at this time.');
        }
        setIsRedeeming(false);
        return;
      }

      // Success: Route storyteller directly onto their soundstage
      router.push('/studio?claimed=heirloom');
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error claiming heirloom pass.');
      setIsRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between selection:bg-amber-500 selection:text-gray-950 font-sans relative overflow-x-hidden">
      {/* Top Cinematic Matte Bar */}
      <header className="w-full bg-black/90 border-b border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono tracking-widest text-amber-300/80 uppercase">
            Memory Weaver • Unboxing Ceremony
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-gray-500">
          <span>2.39:1 ANAMORPHIC LETTERBOX</span>
          <span>•</span>
          <span>528Hz HARMONIC ACOUSTIC</span>
        </div>
      </header>

      {/* Main Theatrical Stage (2.39:1 Anamorphic Letterbox Framing) */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
        {/* Soft Ambient Gold/Amber Specular Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-amber-500/10 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[28rem] h-[28rem] bg-amber-700/10 rounded-full blur-[90px] pointer-events-none" />

        {/* 2.39:1 Widescreen Letterbox Enclosure (Expands gracefully when dedication card is revealed) */}
        <div
          className={`w-full max-w-5xl ${
            phase !== 'revealed' ? 'md:aspect-[2.39/1] min-h-[500px]' : 'min-h-[540px] h-auto py-8 sm:py-12'
          } bg-[#0c0d10] border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] p-4 sm:p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-500`}
        >
          
          {/* Subtle Stage Border Glow */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none border border-amber-400/10" />

          <AnimatePresence mode="wait">
            {phase !== 'revealed' ? (
              <motion.div
                key="entrance-stage"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-xl mx-auto flex flex-col items-center justify-center relative z-10"
              >
                {/* Entrance Header: Playfair Display */}
                <div className="space-y-3 mb-8">
                  <p className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400/90">
                    {cultural.dedicationLead}
                  </p>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                    An heirloom production commissioned in your honour by{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">
                      {voucher.giverName || 'Your Family'}
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base text-amber-200/75 font-serif italic max-w-md mx-auto">
                    {cultural.subtitle}
                  </p>
                </div>

                {/* Shared Vertical Axis: Centered Pill Badge + Wax Seal Button */}
                <div className="flex flex-col items-center justify-center text-center mx-auto space-y-5">
                  {/* Optical Centering: Pill Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs tracking-widest uppercase shadow-inner">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{cultural.badge}</span>
                  </div>

                  {/* Wax Seal Container & Fracture Anchor */}
                  <div className="relative flex flex-col items-center justify-center">
                    
                    {/* Phase 2: 12-Particle Gold Ember Explosion */}
                    {phase === 'crack' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                        {particles.map((p) => (
                          <motion.div
                            key={p.id}
                            initial={{ x: 0, y: 0, opacity: 1, scale: p.scale }}
                            animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.15 }}
                            transition={{ duration: 0.85, ease: 'easeOut' }}
                            className="absolute w-2.5 h-2.5 rounded-full pointer-events-none"
                            style={{
                              backgroundColor: p.colour,
                              boxShadow: `0 0 12px ${p.colour}, 0 0 24px rgba(245, 158, 11, 0.7)`,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Wax Seal Tap Button */}
                    <button
                      type="button"
                      onClick={handleSealTap}
                      disabled={phase !== 'entrance'}
                      aria-label="Crack wax seal to open unboxing ceremony"
                      className="group relative flex flex-col items-center justify-center focus:outline-none cursor-pointer"
                    >
                      {/* Outer Wax Disc with Specular Highlights */}
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full relative flex items-center justify-center transition-all duration-300 group-hover:scale-105 active:scale-95 shadow-[0_10px_35px_rgba(217,119,6,0.45)] border-4 border-amber-300/80 bg-gradient-to-br from-[#804200] via-[#D97706] to-[#451A03] ring-4 ring-amber-500/20">
                        
                        {/* Specular curved highlight across upper hemisphere */}
                        <div className="absolute top-1 left-3 right-3 h-1/2 rounded-t-full bg-gradient-to-b from-white/35 via-amber-100/10 to-transparent pointer-events-none" />

                        {/* Inner Embossed Cell with 35mm Film Icon */}
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#3b1704] via-[#5e2707] to-[#1c0a02] flex items-center justify-center border border-amber-400/50 shadow-[inset_0_4px_8px_rgba(0,0,0,0.85)]">
                          <Film className="w-9 h-9 sm:w-10 sm:h-10 text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                        </div>

                        {/* Phase 2: SVG Path Fracture Overlay */}
                        {phase === 'crack' && (
                          <svg
                            viewBox="0 0 140 140"
                            className="absolute inset-0 w-full h-full pointer-events-none z-25"
                          >
                            <motion.path
                              d="M 70 12 L 68 45 L 75 68 L 64 92 L 70 128"
                              stroke="#FDE68A"
                              strokeWidth="3"
                              strokeLinecap="round"
                              fill="none"
                              filter="drop-shadow(0 0 8px #F59E0B)"
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: [0, 1, 0.9, 0] }}
                              transition={{ duration: 0.85, ease: 'easeInOut' }}
                            />
                            <motion.path
                              d="M 75 68 L 45 52 L 20 60"
                              stroke="#FDE68A"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              fill="none"
                              filter="drop-shadow(0 0 6px #F59E0B)"
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: [0, 1, 0.9, 0] }}
                              transition={{ duration: 0.75, delay: 0.08, ease: 'easeInOut' }}
                            />
                            <motion.path
                              d="M 75 68 L 102 82 L 125 76"
                              stroke="#FDE68A"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              fill="none"
                              filter="drop-shadow(0 0 6px #F59E0B)"
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: [0, 1, 0.9, 0] }}
                              transition={{ duration: 0.75, delay: 0.12, ease: 'easeInOut' }}
                            />
                          </svg>
                        )}
                      </div>

                      {/* Optical Centering: Pill Subscript */}
                      <div className="mt-4 px-4 py-1.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-center gap-1.5 shadow-lg group-hover:bg-amber-500 group-hover:text-gray-950 transition duration-200">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:text-gray-950" />
                        <span>{cultural.envelopeSealText}</span>
                      </div>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] font-mono text-gray-500 mt-6">
                  Touch or click the golden wax seal to unseal the unboxing ceremony
                </p>
              </motion.div>
            ) : (
              /* Phase 3 & 4: The Dedication Parchment & Redemption CTA */
              <motion.div
                key="dedication-stage"
                initial={{ opacity: 0, scale: 0.95, y: 25 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center relative z-10 py-2"
              >
                {/* Phase 3: Parchment Unroll Presentation */}
                <motion.div
                  initial={{ scaleY: 0.3, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: 'top center' }}
                  className="w-full rounded-2xl bg-[#FAF6EE] text-[#241C14] p-6 sm:p-10 shadow-2xl border-2 border-[#D4AF37]/50 relative text-left overflow-hidden"
                >
                  {/* Subtle Ornamental Inner Border */}
                  <div className="border border-[#B38F24]/30 rounded-xl p-6 sm:p-8 bg-[#FDFBF7]/90 relative">
                    
                    {/* Top Corner Emblem & Pass Tier Badge */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/30">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-700/15 flex items-center justify-center text-[#804200]">
                          <Film className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-mono uppercase tracking-widest text-[#804200] font-bold">
                          {voucher.tier === 'generational_vault'
                            ? 'Generational Vault • 100 GB Lifetime'
                            : 'Director Pass • 31-Day Access'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">
                        {code}
                      </span>
                    </div>

                    {/* Cultural Salutation & Recipient Greeting */}
                    <div className="pt-6 pb-4">
                      <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#804200]/80">
                        {cultural.dedicationLead}
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1710] mt-1">
                        {cultural.salutation(voucher.recipientName)}
                      </h2>
                    </div>

                    {/* Personal Dedication Message */}
                    <div className="py-4 my-2 relative">
                      <span className="text-4xl sm:text-5xl font-serif text-[#D4AF37]/40 leading-none absolute -top-2 -left-2 select-none">
                        “
                      </span>
                      <p className="font-serif italic text-base sm:text-lg text-[#382C1E] leading-relaxed pl-4 sm:pl-6">
                        {voucher.giftMessage || 'Your voice and experiences are an enduring gift to our family.'}
                      </p>
                    </div>

                    {/* Dedication Closing & Giver Attribution */}
                    <div className="pt-6 border-t border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-mono text-[#804200] uppercase tracking-wider">
                          Commissioned In Your Honour By
                        </p>
                        <p className="text-lg font-serif font-bold text-[#1F1710]">
                          {voucher.giverName}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-serif italic text-gray-600">
                          {cultural.blessing}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Error Banner if Redemption Fails */}
                {errorMessage && (
                  <div className="w-full mt-4 p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs sm:text-sm flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Phase 4: High-Contrast Gold Redemption CTA Button */}
                <div className="mt-8 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRedeem}
                    disabled={isRedeeming}
                    className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-gray-950 font-bold text-base sm:text-lg shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {isRedeeming ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-gray-950" />
                        <span>Claiming Your Soundstage...</span>
                      </>
                    ) : (
                      <>
                        <span>Step Onto Your Soundstage</span>
                        <span className="font-mono text-xl group-hover:translate-x-1 transition-transform">
                          ↗
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-xs font-mono text-gray-400">
                    {language !== 'en' ? (
                      <span>{cultural.soundstageCta} • </span>
                    ) : null}
                    <span>Pass will be permanently linked to your account</span>
                  </p>

                  <a
                    href={`/api/gift/pdf?code=${voucher.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 mt-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 text-xs font-mono text-gray-300 hover:text-amber-300 transition-colors"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download Keepsake PDF (5&quot;×7&quot;)</span>
                    <span className="text-[10px] text-gray-500">↗</span>
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Cinematic Matte Bar */}
      <footer className="w-full bg-black/90 border-t border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30">
        <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>CRYPTOGRAPHIC HEIRLOOM VERIFICATION • MEMORY WEAVER</span>
        </div>
        <div className="text-[11px] font-mono text-amber-300/80">
          HEIRLOOM PASS: {code}
        </div>
      </footer>
    </div>
  );
}
