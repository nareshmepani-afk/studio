'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { PenTool, Mic, Wand2, Tv, Archive, Smartphone, Cast, QrCode, ArrowRight, Clapperboard, ChevronDown } from 'lucide-react';

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
  const { user } = useAuth();

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
              const isExpanded = activeAct === act.id;
              const Icon = act.icon;
              
              return (
                <div 
                  key={act.id} 
                  className={`relative pl-16 md:pl-20 transition-all duration-300 ${
                    isExpanded ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Step Marker Button */}
                  <button 
                    type="button"
                    aria-expanded={isExpanded}
                    aria-label={`Toggle ${act.title}`}
                    onClick={() => setActiveAct(prev => prev === act.id ? 0 : act.id)}
                    className={`absolute left-0 top-0 w-12 h-12 md:w-[4.2rem] md:h-[4.2rem] rounded-2xl flex items-center justify-center border transition-all duration-300 z-10 cursor-pointer ${
                      isExpanded 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                        : 'bg-neutral-900 border-white/10 text-neutral-400 hover:border-amber-500/40 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </button>

                  {/* Step Content Card */}
                  <div 
                    onClick={() => setActiveAct(prev => prev === act.id ? 0 : act.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveAct(prev => prev === act.id ? 0 : act.id);
                      }
                    }}
                    className={`p-6 sm:p-8 rounded-3xl border cursor-pointer transition-all duration-300 select-none ${
                      isExpanded 
                        ? 'bg-neutral-900/60 border-amber-500/30 backdrop-blur-md shadow-2xl ring-1 ring-amber-500/20' 
                        : 'bg-neutral-950/40 border-white/5 hover:border-white/15 hover:bg-neutral-900/30'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl sm:text-2xl font-serif text-white font-medium">
                          {act.title}
                        </h3>
                        <ChevronDown 
                          className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180 text-amber-400' : 'text-neutral-500'
                          }`} 
                        />
                      </div>
                      <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                        Phase 0{act.id}
                      </span>
                    </div>
                    
                    <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-4 font-light">
                      {act.description}
                    </p>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 border-t border-white/5 grid sm:grid-cols-3 gap-4">
                            {act.features.map((feature, idx) => (
                              <div 
                                key={idx} 
                                className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-start space-x-3 transition-colors hover:bg-white/10 hover:border-amber-500/20"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                <span className="text-xs text-neutral-300 font-light leading-snug">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Smart TV Flow */}
          <section className="bg-neutral-900/40 border border-white/5 rounded-3xl p-8 sm:p-12 backdrop-blur-md space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-serif text-white">Smart TV Living Room Experience</h3>
              <p className="text-sm text-neutral-400 font-light">
                Zero friction, zero logins. Designed specifically for grandparents and family gatherings on the largest screen in the home.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 relative text-center">
              <div className="flex flex-col items-center space-y-4 max-w-[200px]">
                <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-amber-500 shadow-lg">
                  <QrCode className="w-10 h-10" />
                </div>
                <h4 className="font-medium text-white text-lg">Scan QR Code</h4>
                <p className="text-sm text-neutral-500">From the printed memoir poster or digital pass</p>
              </div>

              <ArrowRight className="w-8 h-8 text-neutral-700 hidden md:block" />
              <div className="h-8 w-px bg-neutral-700 md:hidden" />

              <div className="flex flex-col items-center space-y-4 max-w-[200px]">
                <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-amber-500 shadow-lg">
                  <Smartphone className="w-10 h-10" />
                </div>
                <h4 className="font-medium text-white text-lg">Open on Mobile</h4>
                <p className="text-sm text-neutral-500">Instantly loads playback options with no sign-in</p>
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
            <Link href={user ? "/studio" : "/register"}>
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-medium px-8 py-6 text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center gap-2 mx-auto">
                {user ? (
                  <>
                    <Clapperboard className="w-5 h-5" />
                    Enter Your Studio
                  </>
                ) : (
                  "Start Your Production"
                )}
              </Button>
            </Link>
          </section>
          
        </div>
      </div>
    </PublicPageShell>
  );
}
