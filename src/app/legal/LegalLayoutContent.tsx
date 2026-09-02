'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import { Scale, Shield, Cookie, ChevronRight, Home } from 'lucide-react';
import { getLegalMetaForPath, LEGAL_CONFIG } from '@/lib/legalConfig';

const legalPages = [
  { href: LEGAL_CONFIG.terms.route, label: LEGAL_CONFIG.terms.title, shortLabel: LEGAL_CONFIG.terms.shortTitle, icon: Scale },
  { href: LEGAL_CONFIG.privacy.route, label: LEGAL_CONFIG.privacy.title, shortLabel: LEGAL_CONFIG.privacy.shortTitle, icon: Shield },
  { href: LEGAL_CONFIG.cookies.route, label: 'Cookie Policy', shortLabel: LEGAL_CONFIG.cookies.shortTitle, icon: Cookie },
];

export function LegalLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentMeta = getLegalMetaForPath(pathname);

  return (
    <PublicPageShell narrowWidth className="py-8 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center gap-2 text-xs sm:text-sm text-white/40" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-white/70">
          <Home className="h-3.5 w-3.5" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white/60">Legal</span>
        {pathname !== '/legal' && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/80 font-medium">
              {currentMeta.shortTitle}
            </span>
          </>
        )}
      </nav>

      {/* Header Badges & Audio Summary Hook */}
      <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 sm:px-3 py-1">
          <span className="text-[11px] sm:text-xs font-medium text-amber-500/90">
            Last Updated: {currentMeta.lastUpdated}
          </span>
          <span className="text-[10px] font-mono font-semibold text-amber-400/60 bg-amber-500/10 px-1.5 py-0.2 rounded-full">
            {currentMeta.version}
          </span>
        </div>
        <div 
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs text-white/50 cursor-not-allowed opacity-80 select-none" 
          title="Audio overview generated with NotebookLLM — Coming Soon"
        >
          <span>🎧 Listen to Policy (Audio Overview)</span>
          <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-400">Soon</span>
        </div>
      </div>

      {/* Top Segmented Legal Navigation */}
      <nav aria-label="Legal document navigation" className="mb-8 sm:mb-10 w-full">
        <div className="grid grid-cols-3 sm:flex sm:inline-flex items-center gap-1 sm:gap-1.5 rounded-2xl border border-white/10 bg-neutral-900/80 p-1 sm:p-1.5 shadow-2xl backdrop-blur-md w-full sm:w-auto">
          {legalPages.map((page) => {
            const isActive = pathname === page.href;
            const Icon = page.icon;
            return (
              <Link
                key={page.href}
                href={page.href}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 select-none text-center ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span className="sm:hidden">{page.shortLabel}</span>
                <span className="hidden sm:inline whitespace-nowrap">{page.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Legal Content Article */}
      <article className="min-w-0 flex-1 prose prose-invert prose-amber max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-headings:text-white prose-p:leading-relaxed prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white/95 prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline">
        {children}
      </article>
    </PublicPageShell>
  );
}
