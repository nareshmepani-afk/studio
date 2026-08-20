'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Share2, Copy, MessageSquare, Mail, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import type { Memory } from '@/types';

interface CinemaShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory | null;
}

export function CinemaShareModal({ isOpen, onClose, memory }: CinemaShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !memory) return null;

  const cinemaShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/cinema?id=${memory.id}`
    : `https://dev.memoryweaver.studio/cinema?id=${memory.id}`;

  const handleCopyCinemaLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(cinemaShareUrl);
      setIsCopied(true);
      toast.success('Share Link Copied to Clipboard!', {
        description: 'You can now share this direct family story link with loved ones.'
      });
      setTimeout(() => setIsCopied(false), 2000);
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

  const modalContent = (
    <div className="fixed inset-0 z-[25000] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-fade-in">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-[0_0_80px_rgba(245,158,11,0.3)] space-y-6 relative"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black font-headline text-white uppercase tracking-wider">
                Memory Weaver Cinema Portal
              </h3>
              <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                Unique Share Link & Scannable Key Art QR Code
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
            <span className="text-xs font-mono text-amber-400 truncate flex-1 px-2">
              {cinemaShareUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyCinemaLink}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-mono font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Multi-Channel Direct Share Triggers */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Share to WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleShareEmail}
              className="py-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Send via Email</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

export default CinemaShareModal;
