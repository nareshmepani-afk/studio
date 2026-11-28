'use client';

import React from 'react';
import { Check, Copy, Download, Mail, MessageCircle, Share, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePwaInstallAndShare } from '@/hooks/usePwaInstallAndShare';

export interface ProductionInstallShareBarProps {
  variant: 'hero' | 'footer';
}

export function ProductionInstallShareBar({ variant }: ProductionInstallShareBarProps) {
  const {
    isVisible,
    isStandalone,
    isGuideOpen,
    setIsGuideOpen,
    isSafariGuide,
    copied,
    canonicalUrl,
    whatsappUrl,
    emailUrl,
    handleInstallClick,
    handleCopyLink,
  } = usePwaInstallAndShare();

  if (!isVisible) {
    return null;
  }

  const onCopy = async () => {
    const ok = await handleCopyLink();
    if (ok) {
      toast.success('Link copied to clipboard', {
        description: canonicalUrl,
      });
    } else {
      toast.error('Could not copy link automatically');
    }
  };

  const prefix = variant === 'hero' ? 'PWA_HERO' : 'PWA_FOOTER';

  return (
    <>
      {variant === 'hero' ? (
        <div
          data-testid="PRODUCTION_INSTALL_SHARE_HERO"
          className="mt-5 flex flex-wrap items-center justify-center gap-2"
        >
          {!isStandalone && (
            <button
              type="button"
              data-testid={`${prefix}_INSTALL_BTN`}
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 hover:border-amber-400/60 transition cursor-pointer"
            >
              <Smartphone className="h-3.5 w-3.5 text-amber-400" />
              <span>Add to Home Screen</span>
            </button>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`${prefix}_WHATSAPP_LINK`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/80 hover:bg-emerald-500/15 hover:border-emerald-500/35 hover:text-emerald-200 transition"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Share on WhatsApp</span>
          </a>

          <a
            href={emailUrl}
            data-testid={`${prefix}_EMAIL_LINK`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <Mail className="h-3.5 w-3.5 text-sky-300" />
            <span>Email Family</span>
          </a>

          <button
            type="button"
            data-testid={`${prefix}_COPY_BTN`}
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-white/60" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <section
          data-testid="PRODUCTION_INSTALL_SHARE_FOOTER"
          aria-label="Keep Memory Weaver on your device and share with family"
          className="border-t border-white/5 bg-neutral-950/90 py-10 px-4 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-5xl rounded-3xl border border-amber-500/20 bg-white/[0.02] p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left space-y-1.5 max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                App Shortcut &amp; Family Sharing
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-white">
                Keep Memory Weaver on Your Home Screen &amp; Share with Family
              </h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                Pin Memory Weaver for instant one-tap access on phone, tablet, or desktop, or send an
                invitation link to relatives on WhatsApp or email.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
              {!isStandalone && (
                <button
                  type="button"
                  data-testid={`${prefix}_INSTALL_BTN`}
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-md transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Install App</span>
                </button>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`${prefix}_WHATSAPP_LINK`}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 text-xs font-semibold text-emerald-200 transition"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>

              <a
                href={emailUrl}
                data-testid={`${prefix}_EMAIL_LINK`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition"
              >
                <Mail className="h-3.5 w-3.5 text-sky-300" />
                <span>Email</span>
              </a>

              <button
                type="button"
                data-testid={`${prefix}_COPY_BTN`}
                onClick={onCopy}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-white/70" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent
          data-testid="PWA_INSTALL_GUIDE_MODAL"
          className="max-w-md rounded-3xl border border-amber-500/35 bg-neutral-950 text-white p-6"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-amber-400" />
              <span>Add Memory Weaver to Your Home Screen</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-white/60 pt-1">
              {isSafariGuide
                ? 'Install Memory Weaver from Safari in two quick taps:'
                : 'Pin Memory Weaver from your browser menu in two quick steps:'}
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-3 text-xs sm:text-sm text-white/85 py-2">
            <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                1
              </span>
              <span>
                {isSafariGuide ? (
                  <>
                    Tap the <strong className="text-amber-300 inline-flex items-center gap-1">Share <Share className="h-3.5 w-3.5 inline" /></strong> button in Safari&apos;s address or bottom bar.
                  </>
                ) : (
                  <>
                    Open your browser&apos;s <strong className="text-amber-300">menu (⋮ or ⋯)</strong> or address-bar install icon.
                  </>
                )}
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                2
              </span>
              <span>
                Select <strong className="text-emerald-300">&ldquo;Add to Home Screen&rdquo;</strong> (or{' '}
                <strong className="text-emerald-300">&ldquo;Install App&rdquo;</strong>) and confirm.
              </span>
            </li>
          </ol>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              data-testid="PWA_INSTALL_GUIDE_CLOSE_BTN"
              onClick={() => setIsGuideOpen(false)}
              className="rounded-full bg-amber-500 hover:bg-amber-400 text-black px-5 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Got It
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
