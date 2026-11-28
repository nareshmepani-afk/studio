'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PRODUCTION_APP_URL,
  STAGING_APP_URL,
  isStagingProject,
  resolveProjectId,
} from '@/config/environment';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export interface HostVisibilityInput {
  hostname: string;
  search?: string;
  isStagingEnv?: boolean;
}

const CANONICAL_PROD_HOSTNAME = new URL(PRODUCTION_APP_URL).hostname.toLowerCase();
const CANONICAL_WWW_PROD_HOSTNAME = `www.${CANONICAL_PROD_HOSTNAME}`;
const CANONICAL_STAGING_HOSTNAME = new URL(STAGING_APP_URL).hostname.toLowerCase();

/**
 * MW-436 (Option 1B) — Pure host gate:
 * - True on `memoryweaver.studio` / `www.memoryweaver.studio`.
 * - False on `dev.memoryweaver.studio`, `admin.*`, `localhost`, `127.0.0.1`, and unknown hosts,
 *   EXCEPT when `?preview_install_bar=1` is passed on the Staging host/project for Founder QA preview.
 */
export function isInstallShareBarEligibleHost({
  hostname,
  search = '',
  isStagingEnv = false,
}: HostVisibilityInput): boolean {
  const cleanHost = (hostname || '').trim().toLowerCase();
  if (!cleanHost) return false;

  if (cleanHost === CANONICAL_PROD_HOSTNAME || cleanHost === CANONICAL_WWW_PROD_HOSTNAME) {
    return true;
  }

  // Never render on admin.*, localhost, or 127.0.0.1
  if (
    cleanHost.startsWith('admin.') ||
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1'
  ) {
    return false;
  }

  // Option 1B: Staging-only visual QA override via ?preview_install_bar=1
  if (cleanHost === CANONICAL_STAGING_HOSTNAME || isStagingEnv) {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    return params.get('preview_install_bar') === '1';
  }

  return false;
}

export function isAppleSafariUserAgent(userAgent: string): boolean {
  const ua = userAgent || '';
  const isIOS = /iPad|iPhone|iPod/i.test(ua);
  const isSafariEngine = /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|Edg|OPR|FxiOS/i.test(ua);
  return isIOS || isSafariEngine;
}

export function buildCanonicalShareLinks(baseUrl: string = PRODUCTION_APP_URL) {
  const canonicalUrl = `${baseUrl.replace(/\/$/, '')}/`;
  const shareMessage = `Preserve and watch spoken family memoirs in Family Cinema on Memory Weaver: ${canonicalUrl}`;
  const emailSubject = 'Memory Weaver — Spoken Memoir & Family Cinema';
  const emailBody = `Explore Memory Weaver — record, weave, and share spoken family stories across generations:\n\n${canonicalUrl}`;

  return {
    canonicalUrl,
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    emailUrl: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`,
  };
}

export function usePwaInstallAndShare() {
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSafariGuide, setIsSafariGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eligible = isInstallShareBarEligibleHost({
      hostname: window.location.hostname,
      search: window.location.search,
      isStagingEnv: isStagingProject(resolveProjectId()),
    });
    setIsVisible(eligible);
    if (!eligible) return;

    setIsSafariGuide(isAppleSafariUserAgent(window.navigator?.userAgent || ''));

    const detectStandalone = () => {
      const mql =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(display-mode: standalone)')
          : null;
      const standaloneMatch =
        Boolean(mql?.matches) || Boolean((window.navigator as { standalone?: boolean })?.standalone);
      setIsStandalone(standaloneMatch);
    };
    detectStandalone();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setIsGuideOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const shareLinks = useMemo(() => buildCanonicalShareLinks(PRODUCTION_APP_URL), []);

  const handleInstallClick = useCallback(async (): Promise<'PROMPTED' | 'GUIDE'> => {
    if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice.catch(() => null);
        if (choice?.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
        return 'PROMPTED';
      } catch {
        setIsGuideOpen(true);
        return 'GUIDE';
      }
    }
    setIsGuideOpen(true);
    return 'GUIDE';
  }, [deferredPrompt]);

  const handleCopyLink = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLinks.canonicalUrl);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
      return true;
    } catch {
      return false;
    }
  }, [shareLinks.canonicalUrl]);

  return {
    isVisible,
    isStandalone,
    canPromptNatively: Boolean(deferredPrompt),
    isGuideOpen,
    setIsGuideOpen,
    isSafariGuide,
    copied,
    canonicalUrl: shareLinks.canonicalUrl,
    whatsappUrl: shareLinks.whatsappUrl,
    emailUrl: shareLinks.emailUrl,
    handleInstallClick,
    handleCopyLink,
  };
}
