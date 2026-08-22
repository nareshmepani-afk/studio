'use client';

import Link from 'next/link';
import { Film } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Memory Cinema', href: '/cinema' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Cookie Policy', href: '/legal/cookies' },
  ],
  connect: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'Register', href: '/register' },
  ],
};

export function PublicFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#050505]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Film className="h-6 w-6 text-primary" />
              <span className="font-headline text-lg font-bold text-white">
                Memory Weaver
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-white/40">
              Your voice. Your story. Published forever. A spoken memoir
              production suite for preserving family stories across generations.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-widest text-amber-500/80">
              Product
            </h3>
            <nav aria-label="Product navigation">
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-amber-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-widest text-amber-500/80">
              Legal
            </h3>
            <nav aria-label="Legal navigation">
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-amber-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Connect Column */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-widest text-amber-500/80">
              Connect
            </h3>
            <nav aria-label="Connect navigation">
              <ul className="space-y-3">
                {footerLinks.connect.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-amber-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-white/5 pt-8">
          <p className="text-center text-xs text-white/30">
            © 2024–2026 Memory Weaver. All rights reserved. Built in London, United Kingdom.
          </p>
        </div>
      </div>
    </footer>
  );
}
