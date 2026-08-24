'use client';

import { PublicPageShell } from '@/components/public/PublicPageShell';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { Check, Coffee, Sparkles } from 'lucide-react';
import { StorageCalculator } from '@/components/public/StorageCalculator';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

const PRICING_TIERS = [
  {
    name: 'Sandbox',
    price: 'Free forever',
    description: 'Perfect for trying out the storytelling experience.',
    features: [
      'Part I guided prompts',
      'Einstein demo script',
      '2,500 guest views',
      'Basic voice capture',
    ],
    cta: 'Try Free',
    href: '/register',
    ctaVariant: 'outline' as const,
    microcopy: 'No time limit',
  },
  {
    name: '6-Month Director Host Pass',
    price: '£0 — Complimentary',
    description: 'Everything you need to capture and publish a complete family memoir.',
    badge: 'Start Here',
    isFeatured: true,
    features: [
      'Full 5-Act studio access',
      'All prompt chapters (Parts I–VI)',
      'AI narrative synthesis',
      'Video stitching & cinema publishing',
      '5 GB 4K cloud vault',
      'Smart TV streaming & QR posters',
    ],
    cta: 'Claim Your Free Pass',
    href: '/register',
    ctaVariant: 'default' as const,
    microcopy: 'One-time claim per account • No credit card required',
  },
  {
    name: '31-Day Director Pass',
    price: '£12.99 / ~3.5× ☕',
    description: 'Extend your studio access to polish and add more stories.',
    features: [
      'Everything in Free Pass',
      'Family Storytelling Suite',
      '4K exhibition exports',
      'Unlimited streaming',
      'Custom scene creation',
    ],
    cta: 'Coming Soon',
    href: '#',
    disabled: true,
    ctaVariant: 'secondary' as const,
    microcopy: '~3.5 local coffees per month',
  },
  {
    name: 'Generational Vault',
    price: '£195 / ~60× ☕',
    description: 'Secure your family legacy with permanent, lifetime archival storage.',
    badge: 'Lifetime',
    features: [
      'Everything in Director Pass',
      '100 GB generational cloud vault',
      'Offline archive zip package',
      'All future Studio enhancements',
      'Priority production support',
    ],
    cta: 'Coming Soon',
    href: '#',
    disabled: true,
    ctaVariant: 'secondary' as const,
    microcopy: '~60 local coffees — zero monthly rent forever',
  },
];

const FAQS = [
  {
    question: 'Is Memory Weaver free to use?',
    answer:
      'Yes. Every new Director receives a complimentary 6-Month Director Host Pass with full studio access and 5 GB of 4K cloud storage. No credit card required.',
  },
  {
    question: 'How does dynamic pricing work?',
    answer:
      'Memory Weaver uses a Coffee Index AI to calculate fair local pricing based on Purchasing Power Parity (PPP). Your price is approximately 3.5 local coffees per month for the Director Pass, ensuring affordability worldwide.',
  },
  {
    question: 'Can I stream my memoir on a Smart TV?',
    answer:
      'Yes. Published memoirs generate a unique QR code and streaming link. Anyone scanning the QR or opening the link can watch on mobile, desktop, or Smart TV with zero account creation required.',
  },
  {
    question: 'Who owns my voice recordings and content?',
    answer:
      'You retain 100% copyright ownership of your spoken voice, transcripts, and uploaded media. Memory Weaver never uses your content to train AI models.',
  },
  {
    question: 'What happens when my pass expires?',
    answer:
      'Your stories remain safely stored and viewable. You simply cannot create new recordings or publish new memoirs until you renew. No data is ever deleted upon expiry.',
  },
];

export function PricingContent() {
  const { user } = useAuth();

  return (
    <PublicPageShell>
      <div className="bg-[#050505] min-h-screen text-[#E5E5E5] py-20 px-6 sm:px-8 lg:px-12 font-sans selection:bg-amber-500/30">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-amber-400 mb-6">
              <Coffee className="w-3.5 h-3.5" />
              <span>Purchasing Power Parity Active • Prices shown for United Kingdom</span>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-serif text-4xl sm:text-6xl font-medium text-white mb-6 tracking-tight">
                Preserve Your Story for Generations
              </h1>
              
              <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                Start for free with comprehensive studio access. Upgrade to affordable, 
                inflation-resistant archival plans when you are ready to secure your legacy.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-24">
            {PRICING_TIERS.map((tier, index) => {
              const targetHref = tier.disabled ? '#' : (user ? '/studio' : tier.href);
              const buttonText = tier.disabled 
                ? tier.cta 
                : (user ? (tier.isFeatured ? 'Enter Your Studio' : 'Open Studio') : tier.cta);

              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex flex-col rounded-2xl p-8 backdrop-blur-sm bg-neutral-900/50 border transition-all ${
                    tier.isFeatured
                      ? 'border-amber-500/50 shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)] scale-100 xl:scale-105 z-10'
                      : 'border-white/10'
                  }`}
                >
                  {tier.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold ${
                      tier.isFeatured ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-300 border border-white/10'
                    }`}>
                      {tier.isFeatured && <Sparkles className="inline-block w-3 h-3 mr-1 mb-0.5" />}
                      {tier.badge}
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <h3 className="font-serif text-2xl font-medium text-white mb-2">{tier.name}</h3>
                    <div className="text-xl font-medium text-neutral-200 mb-4">{tier.price}</div>
                    <p className="text-sm text-neutral-400 h-10">{tier.description}</p>
                  </div>
                  
                  <ul className="flex-1 space-y-4 mb-8">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex gap-3 text-sm text-neutral-300">
                        <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-auto">
                    <Button
                      asChild={!tier.disabled}
                      disabled={tier.disabled}
                      variant={tier.isFeatured ? 'default' : tier.ctaVariant}
                      className={`w-full mb-3 ${
                        tier.isFeatured ? 'bg-amber-500 hover:bg-amber-400 text-black font-semibold' : ''
                      }`}
                    >
                      {tier.disabled ? (
                        <span>{tier.cta}</span>
                      ) : (
                        <Link href={targetHref}>{buttonText}</Link>
                      )}
                    </Button>
                    <p className="text-xs text-center text-neutral-500">{tier.microcopy}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mb-24">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-medium text-white mb-4">Storage Estimator</h2>
              <p className="text-neutral-400">Calculate how much space your family stories might need</p>
            </div>
            <div className="max-w-4xl mx-auto">
              <StorageCalculator />
            </div>
          </div>

          <div className="mb-24 max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-medium text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-neutral-400">Everything you need to know about our plans and archival preservation</p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-white/10">
                  <AccordionTrigger className="text-left text-lg font-medium hover:text-amber-400 hover:no-underline py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-400 leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="text-center">
            <div className="inline-block p-12 rounded-3xl bg-neutral-900/50 border border-white/10 backdrop-blur-sm w-full max-w-4xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-6 relative z-10">
                Ready to weave your family&apos;s history?
              </h2>
              <p className="text-lg text-neutral-400 mb-8 max-w-2xl mx-auto relative z-10">
                Join Memory Weaver today and ensure your stories are never lost to time. 
                Your first 6 months of comprehensive studio access are on us.
              </p>
              <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-lg px-8 h-14 relative z-10">
                <Link href={user ? "/studio" : "/register"}>
                  {user ? "Enter Memory Studio" : "Start Free — Claim Your 6-Month Director Host Pass"}
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </PublicPageShell>
  );
}
