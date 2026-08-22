'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PenTool, Mic, Wand2, Tv, Archive, Smartphone, Cast, QrCode, ArrowRight } from 'lucide-react';

const acts = [
  {
    id: 1,
    title: 'Act I \u2014 The Scriptorium',
    icon: PenTool,
    description: 'Craft your narrative using guided prompts and AI-assisted prose refinement. Write the story only you can tell.',
    features: [
      'Guided writing prompts tailored to your life',
      'AI prose refinement to polish your narrative',
      'Structurally sound storytelling frameworks'
    ]
  },
  {
    id: 2,
    title: 'Act II \u2014 The Soundstage',
    icon: Mic,
    description: 'Record your spoken voice with cinematic teleprompter guidance, sensory soundscapes, and multi-camera support.',
    features: [
      'Cinematic teleprompter for flawless delivery',
      'Sensory soundscapes for emotional resonance',
      'Multi-camera support for dynamic visuals'
    ]
  },
  {
    id: 3,
    title: 'Act III \u2014 The Editing Suite',
    icon: Wand2,
    description: "Review AI-synthesised narrative options, fine-tune your director's cut, and approve the final cinematic take.",
    features: [
      'AI-synthesised narrative editing',
      "Complete control over the director's cut",
      'Professional audio and visual mastering'
    ]
  },
  {
    id: 4,
    title: 'Act IV \u2014 The Screening Room',
    icon: Tv,
    description: 'Publish to the Family Cinema with a unique QR code poster. Stream on mobile, desktop, or Smart TV with zero login required.',
    features: [
      'Zero-login Family Cinema access',
      'Unique QR code poster generation',
      'Cross-platform Smart TV streaming'
    ]
  },
  {
    id: 5,
    title: 'Act V \u2014 The Archive',
    icon: Archive,
    description: 'Preserve your memoir in a generational cloud vault with vector print booklet exports for physical keepsakes.',
    features: [
      'Generational cloud vault preservation',
      'Vector print booklet exports',
      'Offline physical keepsakes'
    ]
  }
];

export function HowItWorksContent() {
  const [activeAct, setActiveAct] = useState<number>(1);

  return (
    <PublicPageShell>
      <div className="bg-[#050505] min-h-screen text-[#E5E5E5] py-20 px-6 sm:px-8 lg:px-12 font-sans selection:bg-amber-500/30">
        <div className="max-w-5xl mx-auto space-y-32">
          
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-serif text-white tracking-tight"
            >
              The 5-Act Production Pipeline
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto font-light"
            >
              A proven methodology for transforming your memories into a cinematic spoken memoir.
            </motion.p>
          </section>

          {/* Pipeline Stepper */}
          <section className="space-y-8 relative">
            <div className="absolute left-6 md:left-[2.1rem] top-8 bottom-8 w-px bg-white/5" />
            
            {acts.map((act) => {
              const isActive = activeAct === act.id;
              const Icon = act.icon;
              return (
                <div key={act.id} className="relative z-10 pl-16 md:pl-24">
                  <button
                    onClick={() => setActiveAct(act.id)}
                    className="absolute left-0 md:left-4 top-2 w-12 h-12 rounded-full border border-white/10 bg-[#121212] flex items-center justify-center transition-colors group hover:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    aria-expanded={isActive}
                  >
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-amber-500' : 'text-neutral-500 group-hover:text-amber-400'}`} />
                  </button>
                  
                  <div 
                    className={`cursor-pointer group rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isActive 
                        ? 'bg-[#121212] border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.05)]' 
                        : 'bg-transparent border-transparent hover:bg-[#121212]/50'
                    }`}
                    onClick={() => setActiveAct(act.id)}
                  >
                    <div className="p-6 md:p-8">
                      <h3 className={`text-2xl md:text-3xl font-serif transition-colors ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'}`}>
                        {act.title}
                      </h3>
                      
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 space-y-6">
                              <p className="text-lg text-neutral-300 leading-relaxed">
                                {act.description}
                              </p>
                              <ul className="space-y-3">
                                {act.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-start text-neutral-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-3 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Smart TV Flow */}
          <section className="bg-[#121212] rounded-3xl border border-white/5 p-8 md:p-12 text-center">
            <h2 className="text-3xl font-serif text-white mb-12">Seamless Smart TV Screening</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4">
              <div className="flex flex-col items-center space-y-4 max-w-[200px]">
                <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-amber-500 shadow-lg">
                  <QrCode className="w-10 h-10" />
                </div>
                <h4 className="font-medium text-white text-lg">Scan QR</h4>
                <p className="text-sm text-neutral-500">From your unique physical poster</p>
              </div>
              
              <ArrowRight className="w-8 h-8 text-neutral-700 hidden md:block" />
              <div className="h-8 w-px bg-neutral-700 md:hidden" />

              <div className="flex flex-col items-center space-y-4 max-w-[200px]">
                <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-amber-500 shadow-lg">
                  <Smartphone className="w-10 h-10" />
                </div>
                <h4 className="font-medium text-white text-lg">Open on Mobile</h4>
                <p className="text-sm text-neutral-500">Zero login required for family</p>
              </div>

              <ArrowRight className="w-8 h-8 text-neutral-700 hidden md:block" />
              <div className="h-8 w-px bg-neutral-700 md:hidden" />

              <div className="flex flex-col items-center space-y-4 max-w-[200px]">
                <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-amber-500 shadow-lg">
                  <Cast className="w-10 h-10" />
                </div>
                <h4 className="font-medium text-white text-lg">Cast to TV</h4>
                <p className="text-sm text-neutral-500">Cinematic viewing in the living room</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12">
            <h2 className="text-4xl font-serif text-white mb-8">Ready to begin your production?</h2>
            <Link href="/register">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-medium px-8 py-6 text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                Start Your Production
              </Button>
            </Link>
          </section>
          
        </div>
      </div>
    </PublicPageShell>
  );
}
