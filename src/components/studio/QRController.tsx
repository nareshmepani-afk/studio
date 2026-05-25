'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, Loader2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QRControllerProps {
  memoryId: string;
  peerState: 'idle' | 'syncing' | 'authorised';
}

export function QRController({ memoryId, peerState }: QRControllerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [host, setHost] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHost(window.location.hostname);
    }
  }, []);

  const pairingUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${host || window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/remote?sessionId=${memoryId}`
    : '';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
          peerState === 'authorised'
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-500/20"
            : peerState === 'syncing'
            ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:bg-amber-500/20"
            : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
        )}
        title="Pair Mobile Remote Controller"
      >
        <Smartphone className={cn("w-3.5 h-3.5", peerState === 'syncing' && "animate-bounce")} />
        <span>
          {peerState === 'authorised'
            ? 'Remote Active'
            : peerState === 'syncing'
            ? 'Syncing Remote'
            : 'Pair Remote'}
        </span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-headline text-lg uppercase tracking-wide text-white">
              Tactile Remote Bridge
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Scan this QR code with your mobile device to pair it as a distraction-free physical controller.
            </DialogDescription>
          </DialogHeader>

          {/* Local network configuration input to solve phone Wi-Fi mapping (Only visible in local dev) */}
          {typeof window !== 'undefined' && (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname.startsWith('10.') ||
            window.location.hostname.startsWith('172.')
          ) && (
            <div className="space-y-1 bg-white/5 p-3.5 rounded-xl border border-white/10 my-1 animate-fadeIn">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                Local IP Address / Hostname
              </label>
              <input 
                type="text" 
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                placeholder="e.g. 192.168.1.50"
              />
              <p className="text-[9px] text-zinc-500 leading-relaxed mt-1">
                Change <span className="text-zinc-300 font-bold">"localhost"</span> to your computer's local LAN IP (e.g. 192.168.x.x) so your phone can locate this computer over Wi-Fi.
              </p>
            </div>
          )}

          <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10 gap-4 my-1">
            <div className="relative p-3 bg-white rounded-xl">
              {pairingUrl ? (
                <QRCodeCanvas value={pairingUrl} size={200} level="H" includeMargin={false} className="rounded" />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center text-zinc-800">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              )}
            </div>

            <div className="w-full flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  peerState === 'authorised'
                    ? "bg-emerald-500 animate-pulse"
                    : peerState === 'syncing'
                    ? "bg-amber-500 animate-bounce"
                    : "bg-zinc-600"
                )} />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                  {peerState === 'authorised'
                    ? 'REMOTE AUTHORISED'
                    : peerState === 'syncing'
                    ? 'SYNCHRONISING CONSOLE'
                    : 'WAITING FOR CUE'}
                </span>
              </div>
              
              <p className="text-[10px] text-zinc-500 text-center max-w-xs leading-relaxed">
                {peerState === 'authorised'
                  ? 'Your physical controller is locked and active. You can now control the prompter from your phone.'
                  : 'Ensure your phone is on the same local network as this computer to establish P2P bridge channels.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-zinc-500 text-[9px] tracking-widest uppercase border-t border-white/5 pt-4">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/40" />
              <span>Sealed P2P Pipeline</span>
            </div>
            <button
              onClick={() => {
                if (pairingUrl) {
                  navigator.clipboard.writeText(pairingUrl);
                  toast.success("Pairing URL copied to clipboard!");
                }
              }}
              className="text-[9px] font-black text-sky-400 hover:text-sky-300 transition-colors uppercase tracking-wider cursor-pointer bg-transparent border-0 outline-none"
            >
              Copy Link
            </button>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-zinc-300 text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
