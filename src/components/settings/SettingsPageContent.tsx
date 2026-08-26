'use client';

import React, { useState, useTransition, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { activateFreeDirectorPass } from '@/actions/userActions';
import {
  Loader2,
  CheckCircle,
  XCircle,
  User,
  Mail,
  ShieldCheck,
  Ticket,
  Zap,
  Info,
  ExternalLink,
  CreditCard,
  Crown,
  Sparkles,
  HardDrive,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { APP_VERSION } from '@/config/version';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

export function SettingsPageContent({ 
  initialDirectorPassStatus, 
  initialDirectorPassActivationDate, 
  membershipTier = 'sandbox',
  vaultQuotaGb = 5,
  hasStripeCustomer = false,
  userEmail, 
  userName 
}: { 
  initialDirectorPassStatus: string;
  initialDirectorPassActivationDate?: string;
  membershipTier?: 'sandbox' | 'director_complimentary' | 'director_monthly' | 'generational_vault';
  vaultQuotaGb?: number;
  hasStripeCustomer?: boolean;
  userEmail: string; 
  userName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  
  const [directorPassStatus, setDirectorPassStatus] = useState(initialDirectorPassStatus);
  const [activationDateStr, setActivationDateStr] = useState(initialDirectorPassActivationDate);
  const [isPending, startTransition] = useTransition();
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [telemetryId, setTelemetryId] = useState('');

  const isEmailVerified = auth.currentUser?.emailVerified ?? false;

  const handleSendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    setIsSendingVerification(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification Email Dispatched", { 
        description: `A secure verification link has been sent to ${auth.currentUser.email}.`,
        icon: <CheckCircle className="h-4 w-4 text-emerald-400" />
      });
    } catch (error: any) {
      console.error("Verification email failed:", error);
      toast.error("Could Not Send Verification Link", { 
        description: error.message || "Please try again later." 
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let tid = sessionStorage.getItem('mw_telemetry_id');
      if (!tid) {
        tid = `mw_telemetry_${Math.random().toString(36).substring(2, 15)}`;
        sessionStorage.setItem('mw_telemetry_id', tid);
      }
      setTelemetryId(tid);
    }
  }, []);

  // Check for successful Stripe checkout return
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    const tier = searchParams.get('tier');
    const sessionId = searchParams.get('session_id');

    if (checkoutStatus === 'success') {
      const tierTitle = tier === 'generational_vault' ? 'Generational Vault Lifetime' : 'Director Pass';
      toast.success('Payment Confirmed!', {
        description: `Your ${tierTitle} is active. Welcome to the director suite.`,
        icon: <CheckCircle className="h-4 w-4 text-amber-400" />,
      });
      // Revalidate route silently
      router.replace('/settings');
    }
  }, [searchParams, router]);

  // Compute active vs expired based on activation date (6 months)
  const isPassExpired = useMemo(() => {
    if (membershipTier === 'generational_vault') return false;
    if (directorPassStatus !== 'free_host_pass_active' || !activationDateStr) return false;
    const activationDate = new Date(activationDateStr);
    const sixMonthsLater = new Date(activationDate);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    return new Date() > sixMonthsLater;
  }, [directorPassStatus, activationDateStr, membershipTier]);

  // Determine the effective status
  const effectiveStatus = useMemo(() => {
    if (membershipTier === 'generational_vault') return 'generational_vault_active';
    if (isPassExpired) return 'free_host_pass_expired';
    return directorPassStatus;
  }, [membershipTier, isPassExpired, directorPassStatus]);

  const passPeriodText = useMemo(() => {
    if (!activationDateStr) return '';
    const start = new Date(activationDateStr);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 6);
    
    const format = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${format(start)} – ${format(end)}`;
  }, [activationDateStr]);

  const handleActivateFreePass = () => {
    startTransition(async () => {
      try {
        const result = await activateFreeDirectorPass();
        if (result.success) {
          setDirectorPassStatus('free_host_pass_active');
          setActivationDateStr(new Date().toISOString());
          toast.success("Pass Activated!", { 
            description: "Your Free Director Pass is now active.",
            icon: <CheckCircle className="h-4 w-4 text-emerald-400" />
          });
          if (returnTo) {
            router.push(returnTo);
          }
        } else {
          toast.error("Activation Failed", { description: result.message });
        }
      } catch (error) {
        toast.error("An Unexpected Error Occurred", { description: "Could not activate the pass. Please try again." });
      }
    });
  };

  const handleCheckout = async (tier: 'director' | 'generational_vault') => {
    try {
      setIsCheckoutLoading(tier);
      toast.loading('Connecting to Stripe Checkout...', { id: 'settings-checkout-toast' });

      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          currency: 'gbp',
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to initialize checkout session');
      }

      toast.success('Redirecting to Stripe...', { id: 'settings-checkout-toast' });
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Settings checkout error:', err);
      toast.error('Checkout Connection Failed', {
        id: 'settings-checkout-toast',
        description: err.message || 'Could not connect to payment gateway.',
      });
      setIsCheckoutLoading(null);
    }
  };

  const handleOpenBillingPortal = async () => {
    try {
      setIsPortalLoading(true);
      toast.loading('Opening Billing & Receipts Portal...', { id: 'portal-toast' });

      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to load billing portal.');
      }

      toast.success('Redirecting to Stripe Billing Portal...', { id: 'portal-toast' });
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Billing portal error:', err);
      toast.error('Could Not Open Billing Portal', {
        id: 'portal-toast',
        description: err.message || 'Please try again later.',
      });
      setIsPortalLoading(false);
    }
  };

  const PassStatusIndicator = () => {
    switch (effectiveStatus) {
      case 'generational_vault_active':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/60 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Crown className="h-3.5 w-3.5 fill-current" />
            Lifetime Vault Active
          </div>
        );
      case 'paid_host_pass_active':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/50 rounded-full text-sky-400 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(14,165,233,0.2)]">
            <ShieldCheck className="h-3 w-3 fill-current" />
            Director Pass Active
          </div>
        );
      case 'free_host_pass_active':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/50 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Zap className="h-3 w-3 fill-current" />
            Complimentary Active
          </div>
        );
      case 'free_host_pass_expired':
      case 'paid_host_pass_expired':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/50 rounded-full text-rose-400 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <XCircle className="h-3 w-3" />
            Pass Expired
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-white/60 text-xs font-bold uppercase tracking-wider">
            <Info className="h-3 w-3" />
            Free Sandbox
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <header className="mb-12">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-white mb-2 italic">Backstage Configuration</h1>
            <p className="text-white/40 text-sm tracking-widest uppercase">Manage your production hub, passes & credentials</p>
        </header>

        <div className="space-y-8">
          {/* Account Section */}
          <section className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />
            
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-wide font-headline">Account Details</h2>
                  <p className="text-xs text-white/30 uppercase tracking-widest">Public profile and contact info</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 group/field">
                  <Label htmlFor="name" className="text-[10px] uppercase tracking-[0.2em] text-white/40 group-focus-within/field:text-primary transition-colors ml-1 font-bold">Producer Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input id="name" value={userName} disabled className="bg-white/5 border-white/5 h-12 pl-12 rounded-xl text-white/60 cursor-not-allowed border-dashed" />
                  </div>
                </div>
                <div className="space-y-2 group/field">
                  <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-white/40 group-focus-within/field:text-primary transition-colors ml-1 font-bold">Studio Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input id="email" value={userEmail} disabled className="bg-white/5 border-white/5 h-12 pl-12 rounded-xl text-white/60 cursor-not-allowed border-dashed" />
                  </div>
                </div>
              </div>

              {/* Soft Verification Banner */}
              {!isEmailVerified && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                        Email Verification Recommended
                      </h4>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        Verify your email (<span className="text-white font-mono">{userEmail}</span>) to secure your master vault and enable instant account recovery.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendVerificationEmail}
                    disabled={isSendingVerification}
                    className="bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300 text-xs font-mono uppercase tracking-wider shrink-0 cursor-pointer"
                  >
                    {isSendingVerification ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                        <span>Send Verification Link</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Membership & Licensing Section */}
          <section className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-amber-500/10 transition-all duration-700" />

            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <Ticket className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white tracking-wide font-headline">Membership & Licensing</h2>
                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <button className="text-white/30 hover:text-white/60 transition-colors p-0.5 rounded-full cursor-help">
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 border border-white/10 text-white p-3 rounded-xl max-w-xs shadow-xl text-xs leading-relaxed">
                            <strong>Licensing Passes</strong> unlock premium studio functionality such as interactive script writing guides, remote mobile camera control, multi-track recording, and custom 4K cinematic video stitching.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xs text-white/30 uppercase tracking-widest">Manage your active subscription plan, generational vault, and billing</p>
                  </div>
                </div>
                <PassStatusIndicator />
              </div>
            </div>

            <div className="p-8 space-y-6">
               {/* Current Plan Specification Box */}
               <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-4">
                 <div className="flex items-start gap-4">
                   <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-amber-400 shrink-0">
                     {effectiveStatus === 'generational_vault_active' ? (
                       <Crown className="h-5 w-5 text-amber-400" />
                     ) : (
                       <ShieldCheck className="h-5 w-5" />
                     )}
                   </div>
                   <div>
                     <span className="text-[9px] uppercase font-black tracking-widest text-white/30">Active Membership Tier</span>
                     <h3 className="text-sm font-bold text-white mt-1">
                       {effectiveStatus === 'generational_vault_active' 
                         ? 'Generational Vault (Perpetual Lifetime)' 
                         : effectiveStatus === 'paid_host_pass_active'
                         ? 'Director Pass (Active Subscription)'
                         : effectiveStatus === 'free_host_pass_active' 
                         ? 'Complimentary 6-Month Director Pass' 
                         : effectiveStatus === 'free_host_pass_expired' || effectiveStatus === 'paid_host_pass_expired'
                         ? 'Pass Expired (Archive Mode)'
                         : 'Free Tier (Guest Preview Sandbox)'}
                     </h3>
                     <div className="flex items-center gap-2 mt-1.5 text-xs text-white/50">
                       <HardDrive className="h-3.5 w-3.5 text-amber-400/70" />
                       <span>Storage Vault Quota: <strong className="text-white font-mono">{vaultQuotaGb} GB</strong> (4K Cloud Preservation)</span>
                     </div>
                     <p className="text-xs text-white/40 mt-2 leading-relaxed">
                       {effectiveStatus === 'inactive' && 'Your account is on the Free Preview. Claim your complimentary pass or unlock the Generational Vault to preserve memories in full 4K.'}
                       {effectiveStatus === 'free_host_pass_active' && `Enjoy full complimentary access to all templates, analysis engines, and video stitching (Active: ${passPeriodText}).`}
                       {effectiveStatus === 'free_host_pass_expired' && `Your 6-month complimentary pass has expired (Period: ${passPeriodText}). Upgrade to Director Pass or Generational Vault to continue recording.`}
                       {effectiveStatus === 'paid_host_pass_active' && 'Verified Director Pass. Full studio access and 15 GB cloud storage active with automated renewal.'}
                       {effectiveStatus === 'generational_vault_active' && 'Permanent Generational Vault. You own 100 GB lifetime archival storage with zero recurring fees forever.'}
                     </p>
                   </div>
                 </div>

                 {hasStripeCustomer && (
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={handleOpenBillingPortal}
                     disabled={isPortalLoading}
                     className="bg-white/5 hover:bg-white/10 border-white/10 text-white text-xs font-mono uppercase tracking-wider shrink-0 cursor-pointer"
                   >
                     {isPortalLoading ? (
                       <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                     ) : (
                       <CreditCard className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                     )}
                     <span>Billing & Invoices ↗</span>
                   </Button>
                 )}
               </div>

               {/* Action / Upgrade Options Box */}
               <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                  {effectiveStatus === 'inactive' && !activationDateStr ? (
                     <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="max-w-md">
                           <h3 className="text-white font-bold mb-1">Activate Complimentary Pass</h3>
                           <p className="text-sm text-white/40 leading-relaxed">Unlock all story prompts and premium cinema exports for 6 months. No credit card required to start.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button 
                            onClick={handleActivateFreePass} 
                            disabled={isPending} 
                            className="bg-amber-500 text-black font-extrabold px-6 h-12 rounded-xl hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0 cursor-pointer"
                          >
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4 fill-current" />} 
                            Claim 6-Month Pass
                          </Button>
                          <Button
                            onClick={() => handleCheckout('generational_vault')}
                            disabled={Boolean(isCheckoutLoading)}
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-300 font-bold px-5 h-12 rounded-xl hover:bg-amber-500/20 shrink-0 cursor-pointer"
                          >
                            {isCheckoutLoading === 'generational_vault' ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Crown className="h-4 w-4 mr-1.5" />}
                            Lifetime Vault (£195)
                          </Button>
                        </div>
                     </div>
                  ) : effectiveStatus === 'free_host_pass_active' ? (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="max-w-md">
                           <h3 className="text-white font-bold mb-1 font-headline">Complimentary Access Active</h3>
                           <p className="text-sm text-white/40 leading-relaxed">Your 6-month pass is active (Period: {passPeriodText}). Upgrade to the Generational Vault to expand your storage to 100 GB and lock in lifetime access forever.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => handleCheckout('generational_vault')}
                            disabled={Boolean(isCheckoutLoading)}
                            className="bg-amber-500 text-black font-bold px-6 h-12 rounded-xl hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0 cursor-pointer"
                          >
                            {isCheckoutLoading === 'generational_vault' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                            Unlock Lifetime Vault (£195)
                          </Button>
                        </div>
                     </div>
                  ) : effectiveStatus === 'free_host_pass_expired' || effectiveStatus === 'paid_host_pass_expired' || activationDateStr ? (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="max-w-md">
                           <h3 className="text-rose-400 font-bold mb-1 font-headline">Pass Expired — Renew Studio Access</h3>
                           <p className="text-sm text-white/40 leading-relaxed">Your prior pass period has ended ({passPeriodText}). Renew with a Director Pass or lock in lifetime access with the Generational Vault.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <Button
                            onClick={() => handleCheckout('director')}
                            disabled={Boolean(isCheckoutLoading)}
                            className="bg-amber-500 text-black font-extrabold px-6 h-12 rounded-xl hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0 cursor-pointer w-full sm:w-auto"
                          >
                            {isCheckoutLoading === 'director' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2 fill-current" />}
                            Renew Pass (£12.99/mo)
                          </Button>
                          <Button
                            onClick={() => handleCheckout('generational_vault')}
                            disabled={Boolean(isCheckoutLoading)}
                            variant="outline"
                            className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold px-6 h-12 rounded-xl hover:bg-amber-500/20 shrink-0 cursor-pointer w-full sm:w-auto"
                          >
                            {isCheckoutLoading === 'generational_vault' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                            Lifetime Vault (£195)
                          </Button>
                        </div>
                     </div>
                  ) : (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-amber-400">
                      <div className="flex items-center gap-3">
                        <Crown className="h-6 w-6 text-amber-400 shrink-0" />
                        <div>
                          <h3 className="font-bold text-white font-headline">Perpetual Generational Vault Verified</h3>
                          <p className="text-xs text-white/40">You have permanent, unrestricted 100 GB archival storage with priority support.</p>
                        </div>
                      </div>
                      {hasStripeCustomer && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleOpenBillingPortal}
                          disabled={isPortalLoading}
                          className="bg-white/5 hover:bg-white/10 border-white/10 text-white text-xs font-mono uppercase tracking-wider shrink-0 cursor-pointer"
                        >
                          {isPortalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CreditCard className="h-3.5 w-3.5 mr-1.5 text-amber-400" />}
                          <span>View Receipts & Tax Invoices ↗</span>
                        </Button>
                      )}
                    </div>
                  )}
               </div>
            </div>
          </section>

          {/* Privacy & Legal Controls */}
          <section className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-2">
              <div>
                <h2 className="text-lg font-bold text-white font-headline">Privacy & Legal Controls</h2>
                <p className="text-xs text-white/40">Review terms, privacy protections, and manage cookie preferences</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Link
                href="/legal/terms"
                className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/20 text-xs text-white/70 hover:text-white transition-all group"
              >
                <span>Terms of Service</span>
                <span className="text-amber-500/60 group-hover:text-amber-400">↗</span>
              </Link>
              <Link
                href="/legal/privacy"
                className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/20 text-xs text-white/70 hover:text-white transition-all group"
              >
                <span>Privacy Policy</span>
                <span className="text-amber-500/60 group-hover:text-amber-400">↗</span>
              </Link>
              <Link
                href="/legal/cookies"
                className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/20 text-xs text-white/70 hover:text-white transition-all group"
              >
                <span>Cookie Preferences</span>
                <span className="text-amber-500/60 group-hover:text-amber-400">⚙</span>
              </Link>
            </div>
          </section>

          {showDiagnostics && (
            <section className="bg-black/40 backdrop-blur-xl border border-rose-500/20 rounded-3xl overflow-hidden shadow-2xl p-8 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-rose-400 font-headline">Telemetry & Diagnostics</h2>
                  <p className="text-xs text-white/30 uppercase tracking-widest">Active session debugging vectors</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/20 rounded-xl"
                  onClick={() => {
                    const diagnostics = {
                      traceId: telemetryId,
                      userId: 'active_session',
                      userEmail: userEmail,
                      userAgent: navigator.userAgent,
                      path: window.location.pathname,
                      timestamp: new Date().toISOString(),
                      version: APP_VERSION
                    };
                    navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2))
                      .then(() => toast.success("Copied to clipboard"));
                  }}
                >
                  Copy Diagnostics
                </Button>
              </div>
              <div className="bg-black/60 rounded-xl p-4 border border-white/5 text-xs font-mono text-zinc-400 space-y-2 overflow-x-auto">
                <p><span className="text-rose-400">traceId:</span> "{telemetryId}"</p>
                <p><span className="text-rose-400">userEmail:</span> "{userEmail}"</p>
                <p><span className="text-rose-400">version:</span> "{APP_VERSION}"</p>
                <p><span className="text-rose-400">userAgent:</span> "{typeof navigator !== 'undefined' ? navigator.userAgent : ''}"</p>
              </div>
            </section>
          )}

          <footer className="text-center pt-4">
            <p 
              onClick={(e) => {
                if (e.ctrlKey) {
                  setShowDiagnostics(prev => !prev);
                  toast.info(showDiagnostics ? "Diagnostics panel hidden" : "Diagnostics panel active");
                } else {
                  const newCount = clickCount + 1;
                  setClickCount(newCount);
                  if (newCount >= 5) {
                    setShowDiagnostics(prev => !prev);
                    setClickCount(0);
                    toast.info(showDiagnostics ? "Diagnostics panel hidden" : "Diagnostics panel active");
                  }
                }
              }}
              className="text-[10px] text-white/10 uppercase tracking-[0.4em] font-medium cursor-pointer hover:text-white/30 transition-colors select-none"
            >
              Memory Weaver Production Hub v1.0
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}
