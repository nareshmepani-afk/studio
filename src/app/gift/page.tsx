'use client';

import { useState, useMemo } from 'react';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
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
  Languages,
  Wand2,
  Undo2,
  CheckCheck,
  AlertCircle,
  PenTool,
  Quote,
  Sparkle
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

type DedicationTone = 'heartfelt' | 'poetic' | 'celebratory' | 'understated';

interface DedicationPreset {
  id: string;
  icon: string;
  label: string;
  category: string;
  template: (name: string) => string;
}

/**
 * Sanitise recipient name for template interpolation:
 * - Trims leading/trailing whitespace
 * - Collapses multiple internal spaces to single space
 * - Title-cases each word (e.g. "mum" → "Mum", "grandad arthur" → "Grandad Arthur")
 */
function sanitiseRecipientName(raw: string): string {
  return raw
    .trim()
    .replace(/\s{2,}/g, ' ')
    .split(' ')
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
}

const DEDICATION_PRESETS: DedicationPreset[] = [
  {
    id: 'milestone',
    icon: '🎂',
    label: 'Milestone 70th / 80th',
    category: 'Milestone',
    template: (name) =>
      `Dear ${name || 'Mum'}, on your milestone birthday, we want to listen to and preserve every chapter of your extraordinary journey for generations to come.`,
  },
  {
    id: 'roots',
    icon: '🌳',
    label: 'Family Roots & Diaspora',
    category: 'Heritage',
    template: (name) =>
      `Dear ${name || 'Storyteller'}, your courage, your traditions, and your wisdom are the roots our family stands on. We want to cherish your voice forever.`,
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

  // AI Dedication Muse State
  const [selectedTone, setSelectedTone] = useState<DedicationTone>('heartfelt');
  const [isPolishing, setIsPolishing] = useState(false);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [lastPolishedTone, setLastPolishedTone] = useState<string | null>(null);

  // Template Replacement Confirmation Popover State
  const [pendingTemplate, setPendingTemplate] = useState<DedicationPreset | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const activeTierConfig = GIFT_TIER_DISPLAY[selectedTier];

  // 4-Stage Card Fit Calculation
  const cardFitInfo = useMemo(() => {
    const len = giftMessage.trim().length;
    if (len === 0) {
      return {
        stage: 'empty',
        badgeColor: 'text-gray-500 bg-gray-900 border-gray-800',
        label: '0/250 Characters • 5"×7" Card Fit',
        description: 'Type a message or select an occasion spark above.',
      };
    }
    if (len <= 50) {
      return {
        stage: 'brief',
        badgeColor: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
        label: `${len}/250 Characters • A bit brief`,
        description: 'A few more sentences will create a richer keepsake layout.',
      };
    }
    if (len <= 240) {
      return {
        stage: 'optimal',
        badgeColor: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30 shadow-sm shadow-emerald-500/20',
        label: `✨ ${len}/250 Characters • Optimal 5"×7" Card Fit`,
        description: 'Perfect typographical proportion for the gold-bordered keepsake.',
      };
    }
    if (len <= 320) {
      return {
        stage: 'dense',
        badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/40',
        label: `⚠️ ${len}/250 Characters • Dense Typography`,
        description: 'Text size will automatically scale down on the printed card.',
      };
    }
    return {
      stage: 'overflow',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/40',
      label: `⛔ ${len}/250 Characters • Exceeds Margin`,
      description: 'Please shorten slightly to prevent margin overflow on physical printouts.',
    };
  }, [giftMessage]);

  // Handle Preset Click
  const handleSelectPreset = (preset: DedicationPreset) => {
    const sanitisedName = sanitiseRecipientName(recipientName);
    const formatted = preset.template(sanitisedName);
    if (giftMessage.trim().length > 0 && giftMessage.trim() !== formatted) {
      setPendingTemplate(preset);
    } else {
      setHistoryStack((prev) => [giftMessage, ...prev]);
      setGiftMessage(formatted);
      setPendingTemplate(null);
      setLastPolishedTone(null);
      toast.success(`Applied ${preset.label} dedication template.`);
    }
  };

  const confirmTemplateReplace = () => {
    if (!pendingTemplate) return;
    setHistoryStack((prev) => [giftMessage, ...prev]);
    const formatted = pendingTemplate.template(sanitiseRecipientName(recipientName));
    setGiftMessage(formatted);
    setPendingTemplate(null);
    setLastPolishedTone(null);
    toast.success(`Applied ${pendingTemplate.label} template.`);
  };

  // Handle Salutation Click
  const handleApplySalutation = (salutation: SalutationPreset) => {
    const prefix = salutation.prefix(sanitiseRecipientName(recipientName));
    setHistoryStack((prev) => [giftMessage, ...prev]);

    // Replace or prepend opening salutation
    const current = giftMessage.trim();
    if (!current) {
      setGiftMessage(prefix);
    } else if (/^(Dear|To|For|Mara|Pujya)\b/i.test(current)) {
      const rest = current.replace(/^(Dear|To|For|Mara|Pujya)[^,\n]*,\s*/i, '');
      setGiftMessage(`${prefix}${rest}`);
    } else {
      setGiftMessage(`${prefix}${current}`);
    }
    toast.success(`Applied ${salutation.culture} salutation.`);
  };

  // AI Polish Execution
  const handleAIPolish = async () => {
    const trimmed = giftMessage.trim();
    if (!trimmed) {
      toast.error('Please type a draft message or select an occasion template first.');
      return;
    }

    setIsPolishing(true);

    try {
      const res = await fetch('/api/gift/polish-dedication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          tone: selectedTone,
          recipientName: sanitiseRecipientName(recipientName) || undefined,
          unboxingLanguage,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.polishedText) {
        throw new Error(data.error || 'Failed to polish dedication.');
      }

      setHistoryStack((prev) => [giftMessage, ...prev]);
      setGiftMessage(data.polishedText);
      setLastPolishedTone(selectedTone);
      toast.success(`Polished with AI Muse (${selectedTone.toUpperCase()} tone).`);
    } catch (err: any) {
      console.error('AI polish error:', err);
      toast.error(err.message || 'Unable to polish dedication right now.');
    } finally {
      setIsPolishing(false);
    }
  };

  // Undo / Revert Execution
  const handleRevert = () => {
    if (historyStack.length === 0) return;
    const [prev, ...rest] = historyStack;
    setGiftMessage(prev);
    setHistoryStack(rest);
    setLastPolishedTone(null);
    toast.info('Reverted to previous draft.');
  };

  // Tidy & Grammar Quick Fix (Punctuation, Curly Quotes, Capitalization)
  const handleTidyText = () => {
    let text = giftMessage.trim();
    if (!text) return;

    setHistoryStack((prev) => [giftMessage, ...prev]);

    // Capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1);

    // Replace straight quotes with typographic quotes
    text = text.replace(/"([^"]*)"/g, '“$1”').replace(/'([^']*)'/g, '‘$1’');

    // Remove double spaces
    text = text.replace(/\s{2,}/g, ' ');

    // Ensure ending punctuation
    if (!/[.!?]$/.test(text)) {
      text += '.';
    }

    setGiftMessage(text);
    toast.success('Punctuation and typography tidied.');
  };

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

        {/* CUSTOMISATION & DEDICATION MUSE FORM */}
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300">
                    Keepsake Delivery Mode *
                  </label>
                  <span className="text-[10px] font-mono text-amber-400/80">
                    {deliveryMode === 'printable_pdf' && '🖨️ Print at home'}
                    {deliveryMode === 'instant_link' && '⚡ Instant digital sharing'}
                    {deliveryMode === 'scheduled_email' && '✉️ Future automated email'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('printable_pdf')}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      deliveryMode === 'printable_pdf'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/60 shadow-lg shadow-amber-500/10'
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Printer className={`w-4 h-4 ${deliveryMode === 'printable_pdf' ? 'text-amber-400' : 'text-gray-400'}`} />
                      {deliveryMode === 'printable_pdf' && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
                      )}
                    </div>
                    <span className="text-xs font-bold block text-white">5&quot;×7&quot; Keepsake PDF</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Print-at-home card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('instant_link')}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      deliveryMode === 'instant_link'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/60 shadow-lg shadow-emerald-500/10'
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <LinkIcon className={`w-4 h-4 ${deliveryMode === 'instant_link' ? 'text-emerald-400' : 'text-gray-400'}`} />
                      {deliveryMode === 'instant_link' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                      )}
                    </div>
                    <span className="text-xs font-bold block text-white">Instant Link</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">WhatsApp / SMS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('scheduled_email')}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      deliveryMode === 'scheduled_email'
                        ? 'border-purple-500 bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/60 shadow-lg shadow-purple-500/10'
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Mail className={`w-4 h-4 ${deliveryMode === 'scheduled_email' ? 'text-purple-400' : 'text-gray-400'}`} />
                      {deliveryMode === 'scheduled_email' && (
                        <span className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400"></span>
                      )}
                    </div>
                    <span className="text-xs font-bold block text-white">Scheduled Email</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Automated dispatch</span>
                  </button>

                </div>

                {/* DYNAMIC MODE GUIDANCE & CONDITIONAL INPUTS */}
                <AnimatePresence mode="wait">
                  {deliveryMode === 'printable_pdf' && (
                    <motion.div
                      key="printable_pdf"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-200">5&quot;×7&quot; Physical Keepsake Voucher (Print-at-Home)</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/40">
                            In-Person Presentation
                          </span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                          You will receive a print-ready vector PDF formatted for standard 5&quot;×7&quot; cardstock with gold filigree, folding guides, and wax seal insignia immediately upon checkout to hand to the storyteller.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {deliveryMode === 'instant_link' && (
                    <motion.div
                      key="instant_link"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3.5"
                    >
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                        <LinkIcon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-200">Instant Link (WhatsApp, SMS & Share Tray)</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/40">
                            Instant Digital Dispatch
                          </span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                          You will get 1-click WhatsApp and SMS dispatch buttons, native device Share Tray, and a direct ceremony URL on the confirmation screen to send immediately from your phone or desktop.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {deliveryMode === 'scheduled_email' && (
                    <motion.div
                      key="scheduled_email"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-3.5"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-purple-200">Automated Time-Capsule Email Dispatch</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] border border-purple-500/40">
                              Future Milestone Dispatch
                            </span>
                          </div>
                          <p className="text-gray-300 leading-relaxed">
                            Memory Weaver will automatically deliver the invitation and unboxing ceremony pass directly to the recipient&apos;s inbox on the morning of your chosen milestone date.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-500/20">
                        <div>
                          <label className="block text-[11px] font-mono text-purple-200 mb-1">
                            Recipient Email *
                          </label>
                          <input
                            type="email"
                            placeholder="storyteller@family.com"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-purple-500/40 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-purple-400 font-sans"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-purple-200 mb-1">
                            Scheduled Delivery Date *
                          </label>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-purple-500/40 text-white text-xs focus:outline-none focus:border-purple-400 font-sans"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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

              {/* ─────────────────────────────────────────────────────────────
                  HEIRLOOM DEDICATION MUSE & OCCASION SPARKS
              ───────────────────────────────────────────────────────────── */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-amber-400" />
                    <span>Personal Gift Dedication Message</span>
                  </label>
                  <span className="text-[10px] font-mono text-amber-400/80">Printed on 5&quot;×7&quot; Keepsake</span>
                </div>

                {/* OCCASION SPARKS CHIP CAROUSEL */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Occasion Sparks (1-Click Presets):</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                    {DEDICATION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="px-2.5 py-1 rounded-lg bg-gray-950 hover:bg-gray-800 border border-gray-800 hover:border-amber-500/40 text-[11px] text-gray-300 hover:text-amber-300 font-sans shrink-0 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SMART SALUTATIONS CHIPS */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono text-gray-400">
                  <span className="shrink-0">Salutations:</span>
                  {SALUTATION_PRESETS.map((sal) => (
                    <button
                      key={sal.id}
                      type="button"
                      onClick={() => handleApplySalutation(sal)}
                      className="px-2 py-0.5 rounded bg-gray-950 hover:bg-gray-800 border border-gray-800/80 text-gray-300 hover:text-amber-300 shrink-0 transition cursor-pointer"
                    >
                      {sal.label}
                    </button>
                  ))}
                </div>

                {/* INLINE REPLACEMENT CONFIRMATION POPOVER */}
                <AnimatePresence>
                  {pendingTemplate && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="text-amber-200">
                        Replace your current draft with the <strong>[{pendingTemplate.label}]</strong> template?
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={confirmTemplateReplace}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold font-mono text-[11px] transition cursor-pointer"
                        >
                          Replace Draft
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingTemplate(null)}
                          className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] transition cursor-pointer"
                        >
                          Keep Current
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* MAIN DEDICATION TEXTAREA */}
                <div className="relative">
                  <textarea
                    rows={4}
                    placeholder="Dear Mum, for your 70th birthday, we want to listen to and preserve every single story of your journey for generations to come..."
                    value={giftMessage}
                    onChange={(e) => {
                      setGiftMessage(e.target.value);
                      if (pendingTemplate) setPendingTemplate(null);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 text-sm font-sans leading-relaxed"
                  />
                </div>

                {/* 4-STAGE CARD FIT INDICATOR BADGE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] border font-bold ${cardFitInfo.badgeColor}`}>
                      {cardFitInfo.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 italic">
                    {cardFitInfo.description}
                  </span>
                </div>

                {/* AI DEDICATION MUSE TOOLBAR */}
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800/80 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    
                    {/* TONE SELECTOR */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-gray-400 uppercase">Tone:</span>
                      <select
                        value={selectedTone}
                        onChange={(e) => setSelectedTone(e.target.value as DedicationTone)}
                        className="px-2 py-1 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                      >
                        <option value="heartfelt">💛 Heartfelt & Warm</option>
                        <option value="poetic">📜 Poetic & Heritage</option>
                        <option value="celebratory">🎉 Celebratory</option>
                        <option value="understated">🖋️ Understated Classic</option>
                      </select>
                    </div>

                    {/* AI POLISH BUTTON */}
                    <button
                      type="button"
                      onClick={handleAIPolish}
                      disabled={isPolishing || !giftMessage.trim()}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                    >
                      {isPolishing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Elevating Draft...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>✨ Polish with AI Muse</span>
                        </>
                      )}
                    </button>

                    {/* TIDY & FORMAT BUTTON */}
                    <button
                      type="button"
                      onClick={handleTidyText}
                      disabled={!giftMessage.trim()}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-mono flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
                      title="Fix capitalization, punctuation & typographic quotes"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                      <span>Tidy</span>
                    </button>
                  </div>

                  {/* UNDO / REVERT AFFORDANCE */}
                  {historyStack.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRevert}
                      className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-amber-400 text-xs font-mono flex items-center gap-1 transition cursor-pointer"
                      title="Revert to previous draft"
                    >
                      <Undo2 className="w-3 h-3" />
                      <span>Undo</span>
                    </button>
                  )}
                </div>

                {/* POST-POLISH NOTIFICATION BANNER */}
                {lastPolishedTone && (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-200">
                    <span>✨ Polished to <strong>{lastPolishedTone.toUpperCase()}</strong> tone with UK English.</span>
                    <button
                      type="button"
                      onClick={handleRevert}
                      className="underline text-amber-400 hover:text-amber-300 text-[11px] font-mono ml-2 cursor-pointer"
                    >
                      Revert to original
                    </button>
                  </div>
                )}

              </div>

            </div>

            {/* RIGHT: REAL-TIME PHYSICAL CARD MICRO-PREVIEW (5"x7" FOLDING CARD) */}
            <div className="flex flex-col justify-between space-y-6">
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5 text-amber-400" />
                    <span>Real-Time 5&quot;×7&quot; Keepsake Micro-Preview</span>
                  </label>
                  <span className="text-[10px] font-mono text-amber-400/80">Playfair Display Serif</span>
                </div>
                
                {/* 5x7 PHYSICAL CARD REPLICA */}
                <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/30 border border-amber-500/40 shadow-2xl relative overflow-hidden space-y-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  {/* CARD HEADER */}
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                    <div className="text-amber-400 font-serif font-bold text-lg tracking-wide">
                      MEMORY WEAVER
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                      {deliveryMode === 'printable_pdf' && (
                        <>
                          <Printer className="w-3 h-3 text-amber-400" />
                          <span>5&quot;×7&quot; PRINTABLE KEEPSAKE</span>
                        </>
                      )}
                      {deliveryMode === 'instant_link' && (
                        <>
                          <LinkIcon className="w-3 h-3 text-emerald-400" />
                          <span>INSTANT DIGITAL PASS</span>
                        </>
                      )}
                      {deliveryMode === 'scheduled_email' && (
                        <>
                          <Mail className="w-3 h-3 text-purple-400" />
                          <span>SCHEDULED EMAIL CEREMONY</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* SALUTATION / RECIPIENT */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">PRESENTED WITH LOVE TO:</div>
                    <div className="text-2xl font-serif font-bold text-white tracking-tight">
                      {recipientName || 'Dear Storyteller'}
                    </div>
                  </div>

                  {/* DEDICATION PROSE (SERIF TYPOGRAPHY) */}
                  <div className="p-4 rounded-xl bg-gray-900/70 border border-amber-500/20 text-gray-200 font-serif text-sm leading-relaxed italic shadow-inner relative">
                    &quot;{giftMessage || 'A gift of living history to capture and preserve your life\'s memories for generations to come...'}&quot;
                  </div>

                  {/* CARD FOOTER & WAX SEAL INSIGNIA */}
                  <div className="pt-2 flex items-center justify-between border-t border-amber-500/10">
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">TIER &amp; DISPATCH</div>
                      <div className="text-xs font-bold text-amber-300 font-serif">{activeTierConfig.editorialName}</div>
                      <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1 mt-0.5">
                        {deliveryMode === 'printable_pdf' && '🖨️ Print-at-Home PDF Card'}
                        {deliveryMode === 'instant_link' && '⚡ Instant WhatsApp / SMS'}
                        {deliveryMode === 'scheduled_email' && `✉️ Scheduled (${scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-GB') : 'Milestone Date'})`}
                      </div>
                    </div>
                    
                    {/* WAX SEAL INSIGNIA */}
                    <div className="w-12 h-12 rounded-full border-2 border-amber-400/60 bg-gradient-to-br from-amber-500/30 via-amber-600/20 to-amber-950/60 flex items-center justify-center text-amber-300 font-serif text-xs font-bold shadow-lg shadow-amber-500/20">
                      <span>MW</span>
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

                <div className="text-[11px] text-gray-400 font-sans text-center px-2">
                  {deliveryMode === 'printable_pdf' && '🖨️ Includes print-ready 5"×7" PDF voucher download & unboxing pass.'}
                  {deliveryMode === 'instant_link' && '⚡ Includes 1-click WhatsApp, SMS & direct shareable unboxing link.'}
                  {deliveryMode === 'scheduled_email' && `✉️ Automated delivery to ${recipientEmail || 'recipient email'} on ${scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-GB') : 'your chosen milestone date'}.`}
                </div>

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
