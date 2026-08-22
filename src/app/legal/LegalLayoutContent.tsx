'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import { Scale, Shield, Cookie, ChevronRight, Home } from 'lucide-react';

const LEGAL_LAST_UPDATED = '21 August 2026';

const legalPages = [
  { href: '/legal/terms', label: 'Terms of Service', icon: Scale },
  { href: '/legal/privacy', label: 'Privacy Policy', icon: Shield },
  { href: '/legal/cookies', label: 'Cookie Policy', icon: Cookie },
];

export function LegalLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <PublicPageShell narrowWidth>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-white/40" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-white/70">
          <Home className="h-3.5 w-3.5" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white/60">Legal</span>
        {pathname !== '/legal' && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/80 font-medium">
              {legalPages.find((p) => p.href === pathname)?.label || 'Policy'}
            </span>
          </>
        )}
      </nav>

      {/* Header Badges & Audio Summary Hook */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
          <span className="text-xs font-medium text-amber-500/80">
            Last Updated: {LEGAL_LAST_UPDATED}
          </span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 cursor-not-allowed opacity-80" title="Audio overview generated with NotebookLLM — Coming Soon">
          <span>🎧 Listen to Policy (Audio Overview)</span>
          <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-400">Soon</span>
        </div>
      </div>

      {/* Sidebar + Content */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Navigation */}
        <aside className="lg:sticky lg:top-24 lg:w-56 lg:shrink-0 lg:self-start">
          <nav aria-label="Legal pages" className="space-y-1">
            {legalPages.map((page) => {
              const isActive = pathname === page.href;
              const Icon = page.icon;
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-white/50 hover:bg-white/5 hover:text-white/70 border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {page.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <article className="min-w-0 flex-1 prose prose-invert prose-amber max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white/90 prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline">
          {children}
        </article>
      </div>
    </PublicPageShell>
  );
}
