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
  Sparkle,
  Film,
  Maximize2,
  Eye,
  Volume2,
  VolumeX,
  X,
  Play,
  RefreshCw,
  Layers,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { unboxingAudio } from '@/lib/audio/unboxingAudio';
import { checkAndPolishGrammar } from '@/actions/aiWeaver';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import {
  GIFT_TIER_DISPLAY,
  UNBOXING_LANGUAGE_LABELS,
  GiftTier,
  DeliveryMode,
  UnboxingLanguage,
  GiftCheckoutParams
} from '@/types/gift';

type DedicationTone = 'heartfelt' | 'poetic' | 'celebratory' | 'understated';

/**
 * Strips any number of stacked greeting prefixes from dedication prose.
 */
function stripAllSalutations(text: string): string {
  let cleaned = text.trim();
  const greetingTokenPattern = /^(?:(?:Dear|To\s+(?:our|my)\s+(?:dearest|beloved)|To\s+(?:our|my)|To|For|Mara\s+Vhala|Pujya|Honoured|Beloved)\s+[^,:\n]*[,:\n]?\s*)/i;
  let iterations = 0;
  while (greetingTokenPattern.test(cleaned) && iterations < 5) {
    const before = cleaned;
    cleaned = cleaned.replace(greetingTokenPattern, '').trimStart();
    if (cleaned === before) break;
    iterations++;
  }
  return cleaned;
}

interface UnboxingCeremonyContent {
  badge: string;
  welcome: (name: string) => string;
  subtitle: string;
  ceremonyTitle: string;
  envelopeSealText: string;
}

const UNBOXING_CEREMONY_CONTENT: Record<UnboxingLanguage, UnboxingCeremonyContent> = {
  en: {
    badge: 'HEIRLOOM PASS',
    welcome: (name) => `Welcome, ${name || 'Storyteller'}`,
    subtitle: 'Your memories are the foundation of our family.',
    ceremonyTitle: 'A Commissioned Living Memoir',
    envelopeSealText: 'Click Wax Seal to Open'
  },
  gu: {
    badge: 'વારસાગત ભેટ',
    welcome: (name) => `સ્વાગત છે, ${name || 'દાદા / બા'}`,
    subtitle: 'તમારી જીવનયાત્રા અમારા પરિવારનો અમૂલ્ય વારસો છે.',
    ceremonyTitle: 'તમારા જીવનની અમૂલ્ય સ્મૃતિઓ',
    envelopeSealText: 'મુદ્રા તોડીને પ્રવેશ કરો'
  },
  pa: {
    badge: 'ਵਿਰਾਸਤੀ ਤੋਹਫ਼ਾ',
    welcome: (name) => `ਜੀ ਆਇਆਂ ਨੂੰ, ${name || 'ਬਾਬਾ ਜੀ / ਮਾਤਾ ਜੀ'}`,
    subtitle: 'ਤੁਹਾਡੀਆਂ ਯਾਦਾਂ ਸਾਡੇ ਪਰਿਵਾਰ ਦਾ ਅਨਮੋਲ ਖ਼ਜ਼ਾਨਾ ਹਨ।',
    ceremonyTitle: 'ਤੁਹਾਡੀ ਜ਼ਿੰਦਗੀ ਦਾ ਅਨਮੋਲ ਸਫ਼ਰ',
    envelopeSealText: 'ਮੋਹਰ ਤੋੜ ਕੇ ਖੋਲ੍ਹੋ'
  },
  hi: {
    badge: 'धरोहर उपहार',
    welcome: (name) => `हार्दिक स्वागत, ${name || 'दादाजी / माताजी'}`,
    subtitle: 'आपकी यादें और अनुभव हमारे परिवार की अनमोल धरोहर हैं।',
    ceremonyTitle: 'आपके जीवन की अनमोल स्मृतियाँ',
    envelopeSealText: 'मुद्रा तोड़कर खोलें'
  }
};

interface DedicationPreset {
  id: string;
  icon: string;
  label: string;
  shortLabel?: string;
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
    shortLabel: 'Milestone 70th/80th',
    category: 'Milestone',
    template: (name) =>
      `Dear ${name || 'Mum'}, on your milestone birthday, we want to listen to and preserve every chapter of your extraordinary journey for generations to come.`,
  },
  {
    id: 'roots',
    icon: '🌳',
    label: 'Family Roots & Diaspora',
    shortLabel: 'Family Roots',
    category: 'Heritage',
    template: (name) =>
      `Dear ${name || 'Storyteller'}, your courage, your traditions, and your wisdom are the roots our family stands on. We want to cherish your voice forever.`,
  },
  {
    id: 'retirement',
    icon: '🕊️',
    label: 'Retirement & Wisdom',
    shortLabel: 'Retirement Story',
    category: 'Milestone',
    template: (name) =>
      `Dear ${name || 'Dad'}, after a lifetime of hard work and quiet wisdom, it is time for your stories to take centre stage. Here is your studio to weave your memoir.`,
  },
  {
    id: 'devotion',
    icon: '💍',
    label: 'Decades of Devotion',
    shortLabel: 'Decades of Love',
    category: 'Love',
    template: (name) =>
      `To our beloved ${name || 'Grandmother'}, the memories you have built across the decades are the greatest treasure of our family. This is our gift of remembrance.`,
  },
  {
    id: 'gratitude',
    icon: '💛',
    label: 'Voice of Gratitude',
    shortLabel: 'Voice of Gratitude',
    category: 'Family',
    template: (name) =>
      `Dear ${name || 'Storyteller'}, thank you for every bedtime story, every lesson, and every sacrifice. We are giving you this space so your voice is never forgotten.`,
  },
  {
    id: 'memoir',
    icon: '✨',
    label: 'Living History',
    shortLabel: 'Living History',
    category: 'Legacy',
    template: (name) =>
      `For ${name || 'our beloved family anchor'}: your memories are not just the past—they are the roadmap for our children and grandchildren. Welcome to your memoir.`,
  },
];

interface SalutationPreset {
  id: string;
  label: string;
  shortLabel?: string;
  culture: string;
  prefix: (name: string) => string;
}

const SALUTATION_PRESETS: SalutationPreset[] = [
  {
    id: 'british',
    label: 'To our dearest...',
    shortLabel: 'To our dearest...',
    culture: 'Classic British',
    prefix: (name) => `To our dearest ${name || 'Mum'}, `,
  },
  {
    id: 'gujarati',
    label: 'Mara Vhala... (મારા વ્હાલા)',
    shortLabel: 'Mara Vhala (ગુજરાતી)',
    culture: 'Gujarati',
    prefix: (name) => `Mara Vhala ${name || 'Ba'}, `,
  },
  {
    id: 'punjabi',
    label: 'Pujya... Ji (ਪੂਜਨੀਕ)',
    shortLabel: 'Pujya... Ji (ਪੰਜਾਬੀ)',
    culture: 'Punjabi',
    prefix: (name) => `Pujya ${name || 'Pitaji'} Ji, `,
  },
  {
    id: 'hindi',
    label: 'Pujya... Ji (पूज्य)',
    shortLabel: 'Pujya... Ji (हिन्दी)',
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

  // Dual-View Preview & Audition Modal State
  const [previewTab, setPreviewTab] = useState<'keepsake' | 'unboxing'>('keepsake');
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [showAuditionModal, setShowAuditionModal] = useState(false);
  const [isAuditionSealBroken, setIsAuditionSealBroken] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isMicroSealBroken, setIsMicroSealBroken] = useState(false);

  // AI Dedication Muse State
  const [selectedTone, setSelectedTone] = useState<DedicationTone>('heartfelt');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [lastPolishedTone, setLastPolishedTone] = useState<string | null>(null);

  // Template Replacement Confirmation Popover State
  const [pendingTemplate, setPendingTemplate] = useState<DedicationPreset | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const activeTierConfig = GIFT_TIER_DISPLAY[selectedTier];

  const ceremonyContent = useMemo(() => {
    return UNBOXING_CEREMONY_CONTENT[unboxingLanguage] || UNBOXING_CEREMONY_CONTENT.en;
  }, [unboxingLanguage]);

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

  // Handle Salutation Click (Clean Compositional Replacement per MW-86)
  const handleApplySalutation = (salutation: SalutationPreset) => {
    const prefix = salutation.prefix(sanitiseRecipientName(recipientName));
    setHistoryStack((prev) => [giftMessage, ...prev]);

    const current = giftMessage.trim();
    if (!current) {
      setGiftMessage(prefix);
    } else {
      const strippedText = stripAllSalutations(current);
      setGiftMessage(`${prefix}${strippedText}`);
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

  // Dictionary & Grammar Proofreading Execution
  const handleCheckGrammar = async () => {
    const trimmed = giftMessage.trim();
    if (!trimmed) {
      toast.error('Please type a draft message first.');
      return;
    }

    setIsCheckingGrammar(true);
    setHistoryStack((prev) => [giftMessage, ...prev]);

    toast('Proofreading Dedication...', {
      description: 'Checking dictionary spelling, grammar agreement & UK English.',
      icon: <BookOpen className="w-4 h-4 text-amber-400" />
    });

    try {
      const corrected = await checkAndPolishGrammar(trimmed);
      if (corrected && corrected !== trimmed) {
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
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 space-y-10 sm:space-y-16 pb-36 lg:pb-16">
        
        {/* HERO SECTION */}
        <div className="text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-wider uppercase">
            <Gift className="w-3.5 h-3.5" />
            <span>Act V Heirloom Gifting Suite</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Give the Gift of <span className="text-amber-400">Living History</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed">
            Commission a memoir for parents, grandparents, or loved ones. Pair a 5&quot;×7&quot; gold wax-sealed keepsake voucher card with an interactive 2.39:1 widescreen unboxing ceremony.
          </p>
        </div>

        {/* 2-TIER SELECTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* TIER 1: THE MILESTONE DIRECTOR'S EDITION */}
          <div
            onClick={() => setSelectedTier('director')}
            className={`relative rounded-2xl p-5 sm:p-8 cursor-pointer transition-all duration-300 border ${
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

            <h3 className="text-lg sm:text-xl font-bold text-white">{GIFT_TIER_DISPLAY.director.editorialName}</h3>
            <p className="text-xs text-gray-400 mt-1">{GIFT_TIER_DISPLAY.director.subtitle}</p>

            <div className="mt-5 sm:mt-6 flex items-baseline gap-2">
              <span className="text-2xl sm:text-4xl font-extrabold text-white">{GIFT_TIER_DISPLAY.director.priceGbp}</span>
              <span className="text-xs text-gray-400">one-off gift payment</span>
            </div>

            <ul className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-gray-300">
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
            className={`relative rounded-2xl p-5 sm:p-8 cursor-pointer transition-all duration-300 border ${
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

            <h3 className="text-lg sm:text-xl font-bold text-white">{GIFT_TIER_DISPLAY.generational_vault.editorialName}</h3>
            <p className="text-xs text-gray-400 mt-1">{GIFT_TIER_DISPLAY.generational_vault.subtitle}</p>

            <div className="mt-5 sm:mt-6 flex items-baseline gap-2">
              <span className="text-2xl sm:text-4xl font-extrabold text-amber-300">{GIFT_TIER_DISPLAY.generational_vault.priceGbp}</span>
              <span className="text-xs text-gray-400">perpetual lifetime gift</span>
            </div>

            <ul className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-gray-200">
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
        <div className="bg-gray-900/80 rounded-2xl p-4 sm:p-8 lg:p-10 border border-gray-800 space-y-6 sm:space-y-8">
          
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
                    onClick={() => {
                      setDeliveryMode('printable_pdf');
                      setPreviewTab('keepsake');
                    }}
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
                    onClick={() => {
                      setDeliveryMode('instant_link');
                      setPreviewTab('unboxing');
                    }}
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
                    onClick={() => {
                      setDeliveryMode('scheduled_email');
                      setPreviewTab('unboxing');
                    }}
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
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unboxing Ceremony Language</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuditionSealBroken(false);
                      setShowAuditionModal(true);
                    }}
                    className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition underline"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Audition in {UNBOXING_LANGUAGE_LABELS[unboxingLanguage].split(' ')[0]}</span>
                  </button>
                </div>

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
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-amber-400" />
                    <span>Personal Gift Dedication Message</span>
                  </label>
                  <span className="text-[10px] font-mono text-amber-400/80">Printed on 5&quot;×7&quot; Keepsake</span>
                </div>

                {/* OCCASION SPARKS GRID */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Occasion Sparks (1-Click Presets):</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {DEDICATION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="px-2.5 sm:px-3 py-2 min-h-[42px] rounded-xl bg-gray-950 hover:bg-gray-800 border border-gray-800 hover:border-amber-500/40 text-xs text-gray-300 hover:text-amber-300 font-sans flex items-center gap-1.5 sm:gap-2 transition cursor-pointer active:scale-95 shadow-sm text-left w-full"
                      >
                        <span className="text-sm sm:text-base leading-none shrink-0">{preset.icon}</span>
                        <span className="font-medium text-[11px] sm:text-xs leading-tight line-clamp-1">{preset.shortLabel || preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SMART SALUTATIONS GRID */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                    <span>Cultural Salutations:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-gray-400">
                    {SALUTATION_PRESETS.map((sal) => (
                      <button
                        key={sal.id}
                        type="button"
                        onClick={() => handleApplySalutation(sal)}
                        className="px-2.5 sm:px-3 py-2 min-h-[40px] rounded-xl bg-gray-950 hover:bg-gray-800 border border-gray-800/80 text-xs text-gray-300 hover:text-amber-300 transition cursor-pointer active:scale-95 flex items-center justify-center font-sans shadow-sm text-center w-full"
                      >
                        <span className="text-[11px] sm:text-xs leading-tight line-clamp-1">{sal.shortLabel || sal.label}</span>
                      </button>
                    ))}
                  </div>
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
                          className="px-3 py-1.5 min-h-[36px] rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold font-mono text-xs transition cursor-pointer"
                        >
                          Replace Draft
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingTemplate(null)}
                          className="px-3 py-1.5 min-h-[36px] rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition cursor-pointer"
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
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800/80 space-y-2.5">
                  {/* Top Row: Tone & AI Polish */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* TONE SELECTOR */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <span className="text-[10px] font-mono text-gray-400 uppercase shrink-0">Tone:</span>
                      <select
                        value={selectedTone}
                        onChange={(e) => setSelectedTone(e.target.value as DedicationTone)}
                        className="flex-1 sm:flex-initial h-9 px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
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
                      className="w-full sm:w-auto px-3.5 py-2 min-h-[38px] rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 active:scale-95 shadow-sm"
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
                  </div>

                  {/* Actions Row: Tidy, Proofreader, Undo */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-800/60 flex-wrap sm:flex-nowrap">
                    {/* TIDY & FORMAT BUTTON */}
                    <button
                      type="button"
                      onClick={handleTidyText}
                      disabled={!giftMessage.trim()}
                      className="flex-1 sm:flex-initial px-3 py-1.5 min-h-[36px] rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-mono flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-40 active:scale-95 border border-gray-800"
                      title="Fix capitalization, punctuation & typographic quotes"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                      <span>Tidy</span>
                    </button>

                    {/* GRAMMAR & SPELLING PROOFREADER */}
                    <button
                      type="button"
                      onClick={handleCheckGrammar}
                      disabled={isCheckingGrammar || isPolishing || !giftMessage.trim()}
                      className="flex-[2] sm:flex-initial px-3 py-1.5 min-h-[36px] rounded-lg bg-gray-900 hover:bg-gray-800 text-amber-300 border border-slate-700/50 text-xs font-mono flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 active:scale-95 shadow-sm"
                      title="Check dictionary spelling, grammar agreement & UK English"
                    >
                      {isCheckingGrammar ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                          <span>Grammar &amp; Spelling</span>
                        </>
                      )}
                    </button>

                    {/* UNDO / REVERT AFFORDANCE */}
                    {historyStack.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRevert}
                        className="px-3 py-1.5 min-h-[36px] rounded-lg bg-gray-900 hover:bg-gray-800 text-amber-400 text-xs font-mono flex items-center justify-center gap-1 transition cursor-pointer active:scale-95 border border-gray-800"
                        title="Revert to previous draft"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Undo</span>
                      </button>
                    )}
                  </div>
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

            {/* RIGHT: DUAL-VIEW REAL-TIME PREVIEW CANVAS (Desktop >= 1024px) */}
            <div className="hidden lg:flex flex-col justify-between space-y-6">
              
              <div>
                {/* DUAL-VIEW SEGMENTED TOGGLE BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center p-1 rounded-xl bg-gray-950 border border-gray-800">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('keepsake')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        previewTab === 'keepsake'
                          ? 'bg-amber-500 text-gray-950 font-bold shadow-md shadow-amber-500/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>5&quot;×7&quot; Keepsake Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('unboxing')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        previewTab === 'unboxing'
                          ? 'bg-amber-500 text-gray-950 font-bold shadow-md shadow-amber-500/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Cinematic Unboxing</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAuditionSealBroken(false);
                      setShowAuditionModal(true);
                    }}
                    className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 transition cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Audition Fullscreen</span>
                  </button>
                </div>
                
                {/* TAB 1: 5x7 PHYSICAL CARD REPLICA */}
                {previewTab === 'keepsake' && (
                  <motion.div
                    key="keepsake"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/30 border border-amber-500/40 shadow-2xl relative overflow-hidden space-y-6"
                  >
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
                        {sanitiseRecipientName(recipientName) || 'Dear Storyteller'}
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
                      <div className="w-12 h-12 rounded-full border-2 border-amber-400/60 bg-gradient-to-br from-blue-950/80 via-indigo-950/70 to-slate-950/90 flex items-center justify-center text-amber-300 shadow-lg shadow-blue-950/40 ring-1 ring-amber-500/20">
                        <Film className="w-5 h-5 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: 2.39:1 CINEMATIC UNBOXING DIGITAL PREVIEW */}
                {previewTab === 'unboxing' && (
                  <motion.div
                    key="unboxing"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl bg-black border border-amber-500/40 shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 sm:p-8 space-y-6"
                  >
                    {/* Cinematic Ambient Glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-700/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Ceremony HUD */}
                    <div className="relative z-10 flex items-center justify-between border-b border-amber-500/20 pb-3">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>2.39:1 CINEMATIC CEREMONY</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {ceremonyContent.badge}
                      </span>
                    </div>

                    {/* Main Stage Content */}
                    <div className="relative z-10 text-center py-2 space-y-4">
                      {!isMicroSealBroken ? (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400/80 block">
                              {ceremonyContent.ceremonyTitle}
                            </span>
                            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                              {ceremonyContent.welcome(sanitiseRecipientName(recipientName))}
                            </h3>
                            <p className="text-xs text-amber-200/70 font-serif italic max-w-sm mx-auto">
                              {ceremonyContent.subtitle}
                            </p>
                          </div>

                          {/* Optical & Mathematical Vertical Center Alignment */}
                          <div className="flex flex-col items-center justify-center mx-auto text-center pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                unboxingAudio.playWaxSealBreak();
                                setIsMicroSealBroken(true);
                              }}
                              className="group relative flex flex-col items-center justify-center cursor-pointer focus:outline-none"
                            >
                              {/* Wax Seal Circle */}
                              <div className="w-16 h-16 rounded-full border-2 border-amber-400/90 bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 flex items-center justify-center shadow-xl shadow-blue-950/60 group-hover:scale-105 transition ring-2 ring-amber-500/30">
                                <Film className="w-7 h-7 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                              </div>
                              {/* Centered Pill Subscript */}
                              <div className="mt-2.5 px-3 py-1 rounded-full bg-blue-950/60 border border-amber-500/40 text-amber-300 text-[10px] font-mono flex items-center justify-center gap-1 shadow-sm group-hover:bg-amber-500 group-hover:text-gray-950 transition">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>{ceremonyContent.envelopeSealText}</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-3 text-left p-4 rounded-xl bg-gray-900/80 border border-amber-500/30"
                        >
                          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                              {ceremonyContent.welcome(sanitiseRecipientName(recipientName))}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsMicroSealBroken(false)}
                              className="text-[10px] font-mono text-gray-400 hover:text-amber-300 underline cursor-pointer"
                            >
                              Reset Seal
                            </button>
                          </div>
                          <p className="text-xs font-serif italic text-gray-200 leading-relaxed">
                            &quot;{giftMessage || 'A gift of living history to capture and preserve your life\'s memories for generations to come...'}&quot;
                          </p>
                          <p className="text-[10px] font-serif text-amber-300/80 italic border-t border-amber-500/10 pt-2">
                            {ceremonyContent.subtitle}
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Ceremony Footer */}
                    <div className="relative z-10 flex items-center justify-between border-t border-amber-500/10 pt-3 text-[10px] font-mono text-gray-400">
                      <span className="flex items-center gap-1">
                        <Languages className="w-3 h-3 text-amber-400" />
                        <span>{UNBOXING_LANGUAGE_LABELS[unboxingLanguage]}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAuditionSealBroken(false);
                          setShowAuditionModal(true);
                        }}
                        className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Launch Fullscreen Audition</span>
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
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

      {/* ─────────────────────────────────────────────────────────────
          MOBILE FLOATING PREVIEW PILL (< 1024px / < lg)
      ───────────────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <Button
          type="button"
          onClick={() => setMobilePreviewOpen(true)}
          className="h-11 px-4 rounded-full bg-neutral-900/95 hover:bg-neutral-800 text-amber-300 text-xs font-bold border border-amber-500/40 backdrop-blur-md shadow-2xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95 ring-1 ring-amber-500/20"
          aria-label="Preview Keepsake & Ceremony"
        >
          <Eye className="w-4 h-4 text-amber-400" />
          <span>Preview Keepsake &amp; Ceremony</span>
        </Button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE PREVIEW BOTTOM SHEET DRAWER (< 1024px / < lg)
      ───────────────────────────────────────────────────────────── */}
      <Sheet open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
        <SheetContent side="bottom" className="h-[88vh] max-h-[88vh] bg-[#0A0A0A] border-t border-amber-500/30 text-white p-4 sm:p-6 rounded-t-3xl overflow-y-auto custom-scrollbar flex flex-col justify-between">
          <div className="space-y-4">
            <SheetHeader className="text-left pb-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-amber-400" />
                  <SheetTitle className="font-headline text-lg font-bold text-white">Live Keepsake &amp; Ceremony Preview</SheetTitle>
                </div>
              </div>
              <p className="text-xs text-slate-400">Real-time reactive simulation of your card and unboxing experience.</p>
            </SheetHeader>

            {/* Segmented Tab Controls */}
            <div className="flex items-center p-1 rounded-xl bg-gray-950 border border-gray-800 w-full">
              <button
                type="button"
                onClick={() => setPreviewTab('keepsake')}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  previewTab === 'keepsake'
                    ? 'bg-amber-500 text-gray-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>5&quot;×7&quot; Keepsake Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('unboxing')}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  previewTab === 'unboxing'
                    ? 'bg-amber-500 text-gray-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Cinematic Unboxing</span>
              </button>
            </div>

            {/* PREVIEW CONTENT IN SHEET */}
            {previewTab === 'keepsake' ? (
              <div className="rounded-2xl p-5 bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/30 border border-amber-500/40 shadow-2xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div className="text-amber-400 font-serif font-bold text-base tracking-wide">
                    MEMORY WEAVER
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    5&quot;×7&quot; KEEPSAKE
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">PRESENTED WITH LOVE TO:</div>
                  <div className="text-xl font-serif font-bold text-white">
                    {sanitiseRecipientName(recipientName) || 'Dear Storyteller'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-900/70 border border-amber-500/20 text-gray-200 font-serif text-xs leading-relaxed italic shadow-inner">
                  &quot;{giftMessage || 'A gift of living history to capture and preserve your life\'s memories for generations to come...'}&quot;
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-amber-500/10">
                  <div>
                    <div className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">TIER &amp; DISPATCH</div>
                    <div className="text-xs font-bold text-amber-300 font-serif">{activeTierConfig.editorialName}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      unboxingAudio.playAmbientChime();
                      toast.success('✨ 35mm Gold Film Insignia audio verified.');
                    }}
                    className="w-11 h-11 rounded-full border-2 border-amber-400/60 bg-gradient-to-br from-blue-950/80 via-indigo-950/70 to-slate-950/90 flex items-center justify-center text-amber-300 shadow-lg ring-1 ring-amber-500/20 active:scale-95 transition cursor-pointer"
                  >
                    <Film className="w-5 h-5 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-black border border-amber-500/40 shadow-2xl p-5 space-y-4 text-center">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">2.39:1 CINEMATIC CEREMONY</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {ceremonyContent.badge}
                  </span>
                </div>
                {!isMicroSealBroken ? (
                  <div className="space-y-3 py-2">
                    <h3 className="text-lg font-serif font-bold text-white">
                      {ceremonyContent.welcome(sanitiseRecipientName(recipientName))}
                    </h3>
                    <p className="text-xs text-amber-200/70 font-serif italic">
                      {ceremonyContent.subtitle}
                    </p>
                    <div className="flex flex-col items-center justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          unboxingAudio.playWaxSealBreak();
                          setIsMicroSealBroken(true);
                        }}
                        className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition"
                      >
                        <div className="w-14 h-14 rounded-full border-2 border-amber-400/90 bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 flex items-center justify-center shadow-xl ring-2 ring-amber-500/30">
                          <Film className="w-6 h-6 text-amber-300" />
                        </div>
                        <div className="mt-2 px-3 py-0.5 rounded-full bg-blue-950/60 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
                          {ceremonyContent.envelopeSealText}
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-left p-3.5 rounded-xl bg-gray-900/80 border border-amber-500/30">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {ceremonyContent.welcome(sanitiseRecipientName(recipientName))}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsMicroSealBroken(false)}
                        className="text-[10px] font-mono text-gray-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        Reset Seal
                      </button>
                    </div>
                    <p className="text-xs font-serif italic text-gray-200 leading-relaxed">
                      &quot;{giftMessage || 'A gift of living history to capture and preserve your life\'s memories for generations to come...'}&quot;
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setMobilePreviewOpen(false)}
              className="flex-1 h-11 border-white/20 text-white hover:bg-white/10 text-xs font-semibold rounded-xl"
            >
              Return to Form
            </Button>
            <Button
              onClick={() => {
                setMobilePreviewOpen(false);
                handleCheckout();
              }}
              disabled={isLoading}
              className="flex-1 h-11 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20"
            >
              {isLoading ? 'Connecting...' : `Buy ${activeTierConfig.priceGbp} ↗`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─────────────────────────────────────────────────────────────
          STICKY MOBILE PURCHASE BAR (< 1024px / < lg)
      ───────────────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-amber-500/20 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl shadow-black">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-amber-300 font-sans">{activeTierConfig.priceGbp}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {selectedTier === 'generational_vault' ? 'Lifetime' : '31 Days'}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 truncate max-w-[130px] sm:max-w-none">
              {activeTierConfig.editorialName}
            </span>
          </div>
          <Button
            onClick={handleCheckout}
            disabled={isLoading}
            className="h-11 px-5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span>Commission Heirloom ↗</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          FULLSCREEN THEATRICAL UNBOXING AUDITION MODAL (MW-86)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAuditionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 overflow-y-auto"
          >
            {/* Top HUD */}
            <div className="flex items-center justify-between w-full max-w-5xl mx-auto border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>UNBOXING CEREMONY AUDITION</span>
                </span>
                <span className="text-xs font-mono text-gray-400 hidden sm:inline">
                  Pre-Purchase Simulation • {UNBOXING_LANGUAGE_LABELS[unboxingLanguage]}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Audio Gating Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isAudioEnabled;
                    setIsAudioEnabled(nextState);
                    if (nextState) {
                      unboxingAudio.playAmbientChime();
                      toast.success('🔊 Ceremony sound enabled (Web Audio acoustic engine).');
                    } else {
                      toast.info('Ceremony audio muted.');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition cursor-pointer ${
                    isAudioEnabled
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{isAudioEnabled ? 'Sound On' : 'Play With Sound'}</span>
                </button>

                {/* Close Modal Button */}
                <button
                  type="button"
                  onClick={() => setShowAuditionModal(false)}
                  className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Center 2.39:1 Theatrical Letterbox Stage */}
            <div className="w-full max-w-4xl mx-auto my-auto py-6">
              <div className="relative rounded-3xl bg-gradient-to-b from-gray-950 via-black to-gray-950 border border-amber-500/40 shadow-2xl shadow-amber-500/10 p-8 sm:p-12 text-center overflow-hidden">
                
                {/* Ambient Lighting Orbs */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-700/10 rounded-full blur-3xl pointer-events-none" />

                {!isAuditionSealBroken ? (
                  <div className="space-y-6 relative z-10 py-8">
                    <div className="space-y-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-amber-400/80">
                        {ceremonyContent.ceremonyTitle}
                      </span>
                      <h3 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                        {ceremonyContent.welcome(sanitiseRecipientName(recipientName))}
                      </h3>
                      <p className="text-sm text-amber-200/70 font-serif italic max-w-md mx-auto">
                        {ceremonyContent.subtitle}
                      </p>
                    </div>

                    {/* Royal Midnight Sapphire & Gold Interactive Wax Seal with 35mm Film Icon */}
                    <div className="relative flex flex-col items-center justify-center mx-auto py-6">
                      <button
                        type="button"
                        onClick={() => {
                          unboxingAudio.playWaxSealBreak();
                          setIsAuditionSealBroken(true);
                        }}
                        className="group relative flex flex-col items-center justify-center cursor-pointer focus:outline-none"
                      >
                        {/* Wax Seal Circle */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-amber-400/90 bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 flex items-center justify-center shadow-2xl shadow-blue-950/80 group-hover:scale-110 transition duration-300 ring-4 ring-amber-500/30">
                          <Film className="w-11 h-11 sm:w-13 sm:h-13 text-amber-300 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
                        </div>
                        {/* Centered Pill Subscript */}
                        <div className="mt-4 px-4 py-1.5 rounded-full bg-blue-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-center gap-1.5 shadow-lg group-hover:bg-amber-500 group-hover:text-gray-950 transition">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>{ceremonyContent.envelopeSealText}</span>
                        </div>
                      </button>
                    </div>

                    <p className="text-xs font-mono text-gray-500">
                      Click the royal sapphire wax seal to audition the unboxing ritual
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6 relative z-10 py-6"
                  >
                    {/* Sapphire & Gold Particle Burst Scatter (14 particles) */}
                    <div className="relative flex justify-center h-0">
                      {[...Array(14)].map((_, i) => {
                        const angle = (i / 14) * Math.PI * 2;
                        const distance = 80 + (i % 3) * 30;
                        const x = Math.cos(angle) * distance;
                        const y = Math.sin(angle) * distance;
                        const isGold = i % 3 !== 0;
                        const color = isGold ? (i % 2 === 0 ? '#F59E0B' : '#D4AF37') : '#3B82F6';
                        const shadow = isGold ? 'rgba(245, 158, 11, 0.9)' : 'rgba(59, 130, 246, 0.9)';
                        return (
                          <motion.div
                            key={i}
                            initial={{ x: 0, y: 0, opacity: 1, scale: 1.3 }}
                            animate={{ x, y, opacity: 0, scale: 0.2 }}
                            transition={{ duration: 0.75, ease: 'easeOut' }}
                            className="absolute w-2.5 h-2.5 rounded-full pointer-events-none"
                            style={{
                              backgroundColor: color,
                              boxShadow: `0 0 10px ${shadow}`
                            }}
                          />
                        );
                      })}
                    </div>

                    <div className="space-y-2">
                      <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                        {ceremonyContent.badge}
                      </div>
                      <h3 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                        {ceremonyContent.welcome(sanitiseRecipientName(recipientName))}
                      </h3>
                      <p className="text-sm font-serif text-amber-200/80 italic max-w-lg mx-auto">
                        {ceremonyContent.subtitle}
                      </p>
                    </div>

                    {/* Revealed Dedication Card Replica */}
                    <div className="p-6 sm:p-8 rounded-2xl bg-gray-900/90 border border-amber-500/30 max-w-2xl mx-auto shadow-2xl text-left space-y-4">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                        <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                          PERSONAL DEDICATION MESSAGE
                        </span>
                        <span className="text-xs font-mono text-amber-400">
                          {activeTierConfig.editorialName}
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-serif italic text-gray-100 leading-relaxed">
                        &quot;{giftMessage || 'A gift of living history to capture and preserve your life\'s memories for generations to come...'}&quot;
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsAuditionSealBroken(false)}
                        className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-mono border border-gray-800 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-Seal Ceremony</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAuditionModal(false)}
                        className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-mono font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
                      >
                        Return to Customisation
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>
            </div>

            {/* Bottom HUD */}
            <div className="w-full max-w-5xl mx-auto flex items-center justify-between border-t border-amber-500/20 pt-4 text-xs font-mono text-gray-500">
              <span>MEMORY WEAVER ACT V CINEMATIC UNBOXING</span>
              <span>2.39:1 THEATRICAL WIDESCREEN LETTERBOX</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PublicPageShell>
  );
}
