'use client';

import React, { useState, useRef } from 'react';
import { Share2, Copy, Check, MessageSquare, Mail } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Memory } from '@/types';

interface CinemaShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory | null;
}

export function CinemaShareModal({ isOpen, onClose, memory }: CinemaShareModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!memory) return null;

  const cinemaShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/cinema?id=${memory.id}`
    : `https://dev.memoryweaver.studio/cinema?id=${memory.id}`;

  const handleCopyCinemaLink = async () => {
    let copied = false;

    // 1. Try modern async Clipboard API
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(cinemaShareUrl);
        copied = true;
      } catch (err) {
        console.warn('[CinemaShareModal] navigator.clipboard.writeText failed, falling back to input selection', err);
      }
    }

    // 2. Fallback: Select input element inside the active dialog
    if (!copied && inputRef.current) {
      try {
        inputRef.current.focus();
        inputRef.current.select();
        inputRef.current.setSelectionRange(0, 99999);
        copied = document.execCommand('copy');
      } catch (fallbackErr) {
        console.warn('[CinemaShareModal] execCommand copy fallback failed', fallbackErr);
      }
    }

    // 3. Fallback: Offscreen textarea
    if (!copied) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = cinemaShareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (offscreenErr) {
        console.error('[CinemaShareModal] All copy methods failed', offscreenErr);
      }
    }

    if (copied) {
      setIsCopied(true);
      toast.success('🎬 Share Link Copied to Clipboard!', {
        description: cinemaShareUrl
      });
      setTimeout(() => setIsCopied(false), 2500);
    } else {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
      toast.info('Press Ctrl+C to copy the highlighted link');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Watch our family oral history memoir "${memory.title || 'Our Story'}" on Memory Weaver Cinema: ${cinemaShareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Watch "${memory.title || 'Family Memoir'}" on Memory Weaver Cinema`);
    const body = encodeURIComponent(`I've preserved a personal spoken memoir "${memory.title || 'Our Story'}" on Memory Weaver Studio.\n\nWatch the full performance reel and view the master text here:\n${cinemaShareUrl}\n\nPreserved for future generations.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className="sm:max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-[0_0_80px_rgba(245,158,11,0.3)] space-y-6 text-white z-[30000]"
        data-hotspot-id="HS_CINEMA_SHARE_MODAL"
      >
        {/* Modal Header */}
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-black font-headline text-white uppercase tracking-wider text-left">
                Memory Weaver Cinema Portal
              </DialogTitle>
              <DialogDescription className="text-[10px] font-mono text-white/50 uppercase tracking-widest text-left">
                Unique Share Link & Scannable Key Art QR Code
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* QR Code Display Card */}
        <div className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-950/80 rounded-2xl border border-amber-500/30">
          <div className="p-3 bg-white rounded-2xl border-4 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
            <QRCodeCanvas 
              value={cinemaShareUrl} 
              size={180} 
              level="H" 
              includeMargin={false} 
              className="rounded-lg" 
            />
          </div>
          <div className="text-center space-y-1">
            <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest block">
              Scan With Mobile Camera
            </span>
            <span className="text-[10px] font-mono text-white/60 block">
              Instantly opens performance reel on Memory Weaver Cinema
            </span>
          </div>
        </div>

        {/* Unique Link & Multi-Channel Action Bar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-slate-950/90 rounded-xl border border-white/10">
            <input
              ref={inputRef}
              type="text"
              readOnly
              value={cinemaShareUrl}
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.select();
                }
              }}
              className="text-xs font-mono text-amber-400 bg-transparent truncate flex-1 px-2 border-0 outline-none select-all cursor-text"
              data-hotspot-id="HS_CINEMA_SHARE_URL_INPUT"
            />
            <button
              type="button"
              onClick={handleCopyCinemaLink}
              data-hotspot-id="HS_CINEMA_SHARE_COPY_BTN"
              className={`px-3.5 py-2 text-[10px] font-mono font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md ${
                isCopied 
                  ? 'bg-emerald-500 text-slate-950' 
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95'
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5 text-slate-950" />}
              <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Multi-Channel Direct Share Triggers */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              data-hotspot-id="HS_CINEMA_SHARE_WHATSAPP_BTN"
              className="py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Share to WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleShareEmail}
              data-hotspot-id="HS_CINEMA_SHARE_EMAIL_BTN"
              className="py-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Send via Email</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CinemaShareModal;
