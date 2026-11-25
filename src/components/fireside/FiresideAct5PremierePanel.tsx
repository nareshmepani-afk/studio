'use client';

import React, { useState } from 'react';
import { Rocket, Share2, Copy, Check, Film, Lock, Video } from 'lucide-react';
import { toast } from 'sonner';

export interface FiresideAct5PremierePanelProps {
  sceneTitle: string;
  hasRecordedTake: boolean;
  isPublished: boolean;
  isLockedPreview?: boolean;
  shareDocId?: string | null;
  onPublishToCinema: () => Promise<boolean> | void;
  onOpenFiresideCinema: () => void;
  onGoToRecord: () => void;
  onOpenUpgrade?: () => void;
}

export const FiresideAct5PremierePanel: React.FC<FiresideAct5PremierePanelProps> = ({
  sceneTitle,
  hasRecordedTake,
  isPublished,
  isLockedPreview = false,
  shareDocId,
  onPublishToCinema,
  onOpenFiresideCinema,
  onGoToRecord,
  onOpenUpgrade,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const shareUrl =
    typeof window !== 'undefined' && shareDocId
      ? `${window.location.origin}/cinema?id=${encodeURIComponent(shareDocId)}`
      : shareDocId
      ? `https://memoryweaver.studio/cinema?id=${encodeURIComponent(shareDocId)}`
      : '';

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Family Cinema link copied to clipboard.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.info(shareUrl);
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${sceneTitle} — Memory Weaver Family Cinema`,
          text: `Watch "${sceneTitle}" in our Family Cinema:`,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    await handleCopyLink();
  };

  const handlePublishClick = async () => {
    if (isLockedPreview) {
      onOpenUpgrade?.();
      return;
    }
    setIsPublishing(true);
    try {
      const ok = await onPublishToCinema();
      if (ok !== false) {
        toast.success(`"${sceneTitle}" premiered in Family Cinema!`);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLockedPreview) {
    return (
      <div
        data-testid="fireside-act5-premiere-panel"
        className="mb-3 p-4 rounded-2xl bg-stone-950/90 border border-amber-500/35 space-y-3"
      >
        <div className="flex items-center gap-2 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Act V: Family Premiere (Premium Chapter)</span>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed">
          Unlock a Director Pass or Generational Vault to record and premiere this chapter for your family.
        </p>
        <button
          type="button"
          onClick={onOpenUpgrade}
          className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
        >
          Unlock Full Life Journey →
        </button>
      </div>
    );
  }

  if (!hasRecordedTake) {
    return (
      <div
        data-testid="fireside-act5-premiere-panel"
        className="mb-3 p-4 rounded-2xl bg-stone-950/85 border border-stone-800 space-y-3"
      >
        <div className="flex items-center gap-2 text-stone-300 text-xs font-mono font-bold uppercase tracking-wider">
          <Rocket className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Act V: Family Premiere</span>
        </div>
        <p className="text-xs text-stone-400 leading-relaxed">
          Record your voice or selfie video take in Act III first — then return here to premiere and share a private link with your family.
        </p>
        <button
          type="button"
          data-testid="HS_FIRESIDE_ACT5_GOTO_RECORD_BTN"
          onClick={onGoToRecord}
          className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-stone-950 font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Video className="w-4 h-4" />
          <span>Go to Act III: Record Performance →</span>
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="fireside-act5-premiere-panel"
      className="mb-3 p-4 rounded-2xl bg-gradient-to-b from-emerald-950/45 via-stone-950/90 to-stone-950 border border-emerald-500/40 space-y-3.5 shadow-lg"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-300">
          <Rocket className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            {isPublished ? 'Premiered in Family Cinema ✓' : 'Act V: Ready for Family Premiere'}
          </span>
        </span>
      </div>

      <p className="text-xs text-stone-200 leading-relaxed">
        {isPublished
          ? `"${sceneTitle}" is live in your Family Cinema. Share the private screening link directly via WhatsApp, Messages, or email.`
          : `Publish "${sceneTitle}" to your Family Cinema with one tap so loved ones can watch it on any phone, tablet, or TV.`}
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        {!isPublished && (
          <button
            type="button"
            data-testid="HS_FIRESIDE_ACT5_PUBLISH_BTN"
            disabled={isPublishing}
            onClick={handlePublishClick}
            className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-mono font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Rocket className="w-4 h-4" />
            <span>{isPublishing ? 'Publishing...' : 'Publish to Family Cinema'}</span>
          </button>
        )}

        {shareDocId && (
          <button
            type="button"
            data-testid="HS_FIRESIDE_ACT5_SHARE_BTN"
            onClick={handleNativeShare}
            className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Share2 className="w-4 h-4" />
            <span>Share with Family</span>
          </button>
        )}

        {shareDocId && (
          <button
            type="button"
            data-testid="HS_FIRESIDE_ACT5_COPY_LINK_BTN"
            onClick={handleCopyLink}
            className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-mono font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
        )}
      </div>

      <button
        type="button"
        data-testid="HS_FIRESIDE_ACT5_OPEN_CINEMA_BTN"
        onClick={onOpenFiresideCinema}
        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/35 text-amber-200 font-mono font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
      >
        <Film className="w-4 h-4 text-amber-400" />
        <span>Open in Fireside Cinema →</span>
      </button>
    </div>
  );
};

export default FiresideAct5PremierePanel;
