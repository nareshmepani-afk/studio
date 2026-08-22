'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Cookie, Shield } from 'lucide-react';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const PROTECTED_PREFIXES = [
  '/studio', '/dashboard', '/admin', '/dev', '/settings',
  '/create', '/review', '/requests', '/add-memory',
];

const CONSENT_COOKIE_NAME = 'mw_consent';
const CONSENT_MAX_AGE = 33696000; // 13 months in seconds

function getConsentCookie(): { analytics: boolean; timestamp: number } | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

function setConsentCookie(analytics: boolean) {
  const value = JSON.stringify({ analytics, timestamp: Date.now() });
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
}

export function CookieConsentDock() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = getConsentCookie();
    if (existing) {
      // Re-apply stored consent on mount
      window.gtag?.('consent', 'update', {
        analytics_storage: existing.analytics ? 'granted' : 'denied',
      });
      return;
    }
    // Show dock if no consent recorded and not on a protected route
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    if (!isProtected) {
      setVisible(true);
    }
  }, [pathname]);

  const handleConsent = (analytics: boolean) => {
    setConsentCookie(analytics);
    window.gtag?.('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
    });
    setVisible(false);
  };

  // Don't render on protected routes at all
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 inset-x-0 z-[9998] border-t border-amber-500/30 bg-[#050505]/95 backdrop-blur-md"
        >
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-amber-500/10 p-2">
                  <Cookie className="h-5 w-5 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/90">
                    We use cookies to improve your experience
                  </p>
                  <p className="text-xs text-white/50">
                    We use essential cookies for authentication and optional analytics cookies to understand how our site is used.{' '}
                    <Link
                      href="/legal/cookies"
                      className="text-amber-500/80 underline underline-offset-2 transition-colors hover:text-amber-400"
                    >
                      Read our Cookie Policy
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => handleConsent(false)}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:border-white/40 hover:text-white"
                >
                  Reject All
                </button>
                <button
                  onClick={() => handleConsent(true)}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
