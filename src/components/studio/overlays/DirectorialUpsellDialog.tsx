'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lock, ShieldCheck, Sparkles, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { getHostPassPriceAction } from '@/actions/getHostPassPriceAction';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface DirectorialUpsellDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requiredFeature?: string;
}

export function DirectorialUpsellDialog({ isOpen, onClose, requiredFeature = "saving your memory" }: DirectorialUpsellDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [priceInfo, setPriceInfo] = useState<{ passPrice: number; currency: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      getHostPassPriceAction({ city: 'New York', country: 'US' })
        .then((res) => {
          setPriceInfo({
            passPrice: res.passPrice,
            currency: res.currency === 'GBP' ? '£' : '$'
          });
        })
        .catch(() => {
          setPriceInfo({ passPrice: 14.99, currency: '$' });
        });
    }
  }, [isOpen]);

  const handleUpgrade = () => {
    toast.info("Navigating to Licensing Hub...");
    onClose();
    const query = searchParams.toString();
    const fullPath = pathname + (query ? `?${query}` : '');
    router.push(`/settings?returnTo=${encodeURIComponent(fullPath)}`);
  };

  const handleLogin = () => {
    onClose();
    router.push('/login?from=/studio');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-slate-950 border border-amber-500/20 text-white rounded-[2rem] overflow-hidden shadow-2xl p-0">
        {/* Glow Header */}
        <div className="relative p-8 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-black border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] font-mono">
              Directorial Action Blocked
            </span>
          </div>

          <DialogTitle className="text-2xl font-black font-headline italic tracking-tight text-white mb-2 leading-none">
            Unlock the Memory Vault
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-400 leading-relaxed">
            {user ? (
              <>Your **Director Pass** is currently inactive or expired. To perform <span className="text-amber-400 font-bold">{requiredFeature}</span>, please activate or renew your subscription pass.</>
            ) : (
              <>You are currently accessing the studio in **Guest Preview** mode. To perform <span className="text-amber-400 font-bold">{requiredFeature}</span>, you need to activate a Director Pass.</>
            )}
          </DialogDescription>
        </div>

        {/* Feature List */}
        <div className="p-8 space-y-5 bg-black/40">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-wider">Cloud Storage Vault</h4>
                <p className="text-[11px] text-zinc-500 leading-normal">Securely preserve drafts, scripts, and video reels on our remote servers.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-wider">Remote Guest Director</h4>
                <p className="text-[11px] text-zinc-500 leading-normal">Connect mobile camera prompts and collaborate remotely with guest directors.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-wider">High-Fidelity Cinema Exports</h4>
                <p className="text-[11px] text-zinc-500 leading-normal">Access professional transcode, sequential segment stitching, and cinema publishing.</p>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
            <div>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Producer Tier Price</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black font-headline text-white">
                  {priceInfo ? `${priceInfo.currency}${priceInfo.passPrice}` : "Loading..."}
                </span>
                <span className="text-[10px] text-zinc-400">/ month</span>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full shrink-0">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" /> Free Trial Available
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-zinc-900/40 border-t border-white/5 flex flex-col sm:flex-row gap-3">
          {user ? (
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-12 bg-transparent border-white/10 text-white font-extrabold uppercase text-[10px] tracking-widest hover:bg-white/5 rounded-xl"
            >
              Cancel
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleLogin}
              className="flex-1 h-12 bg-transparent border-white/10 text-white font-extrabold uppercase text-[10px] tracking-widest hover:bg-white/5 rounded-xl"
            >
              Log In / Register
            </Button>
          )}
          <Button 
            onClick={handleUpgrade}
            className="flex-grow-[2] h-12 bg-amber-500 hover:bg-amber-600 text-black font-extrabold uppercase text-[10px] tracking-widest rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2"
          >
            {user ? "Renew / Upgrade Pass" : "Claim Free Pass"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
