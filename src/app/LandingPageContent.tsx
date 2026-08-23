'use client';

import {
  Film,
  LogIn,
  UserPlus,
  Clapperboard,
  Tv,
  QrCode,
  BookOpen,
  Mic,
  PenTool,
  Wand2,
  Archive,
  Play,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { CinematicBackground } from '@/components/ui/CinematicBackground';
import { useAuth } from '@/hooks/useAuth';
import { PublicFooter } from '@/components/public/PublicFooter';
import { motion } from 'framer-motion';

const acts = [
  {
    icon: PenTool,
    title: 'The Scriptorium',
    description: 'Craft your narrative with guided prompts and AI-assisted prose refinement.',
  },
  {
    icon: Mic,
    title: 'The Soundstage',
    description: 'Record your spoken voice with cinematic teleprompter guidance.',
  },
  {
    icon: Wand2,
    title: 'The Editing Suite',
    description: 'Review AI-synthesised options and approve your director’s cut.',
  },
  {
    icon: Tv,
    title: 'The Screening Room',
    description: 'Publish to Family Cinema with QR poster and Smart TV streaming.',
  },
  {
    icon: Archive,
    title: 'The Archive',
    description: 'Preserve in a generational vault with print booklet exports.',
  },
];

const pillars = [
  {
    icon: BookOpen,
    title: 'Published Autobiography',
    description:
      'Your memoir is published like a book — anyone with the link or QR code can watch. No login walls, no gatekeeping.',
  },
  {
    icon: Tv,
    title: 'Family Cinema',
    description:
      'Stream on mobile, desktop, or Smart TV. Cast to your living room for the ultimate family screening night.',
  },
  {
    icon: QrCode,
    title: 'QR Poster Distribution',
    description:
      'Generate a cinematic 2:3 poster with embedded QR code. Print it, frame it, share it at the reunion.',
  },
];

export default function LandingPageContent() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <>
      <CinematicBackground>
        <main className="flex flex-col items-center justify-center pt-8 pb-10 md:pt-14 md:pb-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]" />

              <div className="relative p-6 sm:p-10 md:p-12 lg:p-14 flex flex-col items-center">
                <div className="flex justify-center items-center mb-5">
                  <div className="p-4 sm:p-5 rounded-3xl bg-primary/10 border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
                    <Film className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                  </div>
                </div>

                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-headline italic tracking-tighter bg-gradient-to-br from-white via-white/90 to-white/40 bg-clip-text text-transparent mb-3">
                  Memory Weaver
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-white/50 mb-2 max-w-2xl mx-auto font-medium leading-relaxed">
                  Your voice. Your story. Published forever.
                </p>

                <p className="text-xs sm:text-sm text-white/30 mb-8 max-w-xl mx-auto leading-relaxed">
                  A 5-Act spoken memoir production suite for preserving family stories as cinematic experiences —
                  streamed on Smart TV, printed as QR posters, and archived for generations.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto min-h-[52px]">
                  {loading ? (
                    <div className="h-12 w-48 bg-white/5 animate-pulse rounded-full" />
                  ) : isAuthenticated ? (
                    <>
                      <Link href="/studio" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-primary text-primary-foreground rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 hover:brightness-110 transition-all flex items-center justify-center gap-3">
                          <Clapperboard className="w-4 h-4" /> Enter Memory Studio
                        </button>
                      </Link>
                      <Link href="/cinema" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 backdrop-blur-md">
                          <Film className="w-4 h-4" /> Watch Memory Cinema
                        </button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/register" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-amber-500 text-black rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 hover:bg-amber-400 transition-all flex items-center justify-center gap-3">
                          <Play className="w-4 h-4" /> Begin Your Story
                        </button>
                      </Link>
                      <Link href="/cinema" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 backdrop-blur-md">
                          <Film className="w-4 h-4" /> Watch a Memory
                        </button>
                      </Link>
                    </>
                  )}
                </div>

                {/* Subtle Scroll Guide to eliminate below-the-fold ambiguity */}
                <a
                  href="#production-pipeline"
                  className="mt-6 sm:mt-8 inline-flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group"
                >
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 group-hover:text-amber-400 transition-colors">
                    Explore the 5-Act Studio
                  </span>
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ChevronDown className="h-4 w-4 text-amber-500" />
                  </motion.div>
                </a>
              </div>
            </motion.div>
          </div>
        </main>
      </CinematicBackground>

      {/* 5-Act Studio Section */}
      <section id="production-pipeline" className="bg-[#050505] pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 md:mb-12"
          >
            <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-white mb-3">
              The 5-Act Production Pipeline
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto text-sm sm:text-base">
              From raw memory to cinematic memoir in five acts. Every step guided,
              every tool crafted for the storyteller, not the technician.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {acts.map((act, i) => (
              <motion.div
                key={act.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center transition-all hover:border-amber-500/20 hover:bg-amber-500/[0.03]"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 transition-all group-hover:bg-amber-500/20 group-hover:scale-110">
                  <act.icon className="h-6 w-6" />
                </div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/60">
                  Act {['I', 'II', 'III', 'IV', 'V'][i]}
                </p>
                <h3 className="mb-2 font-serif text-lg font-semibold text-white">
                  {act.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {act.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-sm font-medium text-amber-500 transition-colors hover:text-amber-400"
            >
              See the full production pipeline <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Distribution Model Section */}
      <section className="border-t border-white/5 bg-neutral-950 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-white mb-3">
              The Published Autobiography
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto text-sm sm:text-base">
              Not a locked file behind a login wall. A published work — like a book on a shelf —
              that anyone in your family can pick up and experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-primary/20"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 font-serif text-xl font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Pass CTA Section */}
      <section className="border-t border-white/5 bg-[#050505] py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
                Complimentary 6-Month Pass
              </span>
            </div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-white mb-3">
              Start Free. No Credit Card.
            </h2>
            <p className="text-white/40 mb-8 max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
              Every new Director receives a complimentary 6-Month Director Host Pass with full
              5-Act studio access, AI narrative synthesis, and 5 GB of 4K cloud storage.
            </p>
            <Link href="/register">
              <button className="px-10 sm:px-12 py-3.5 sm:py-4 bg-amber-500 text-black rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 hover:bg-amber-400 transition-all">
                Claim Your Free Pass
              </button>
            </Link>
            <p className="mt-4 text-xs text-white/20">
              One-time claim per account • Full studio access • 5 GB 4K cloud vault
            </p>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
