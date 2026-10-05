'use client';

/**
 * 👤 Fireside Profile Drawer — Mobile Navigation & Director Account Drawer
 *
 * Directive: MW-105-A (Ticket #314)
 * Governing Rules:
 *   - Rule 7: Non-Degradation Across All Features
 *   - Rule 20: British English Orthography (Centred, Colour, Synchronised)
 *   - Rule 26: Elder Ergonomics (min 44px trigger, min 48px drawer action rows)
 * Target Route: /studio/fireside
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  ShieldCheck,
  Settings,
  BookOpen,
  Coffee,
  Gift,
  MessageSquare,
  Home,
  Clapperboard,
  LogOut,
  LogIn,
  ChevronRight,
  Sparkles,
  Smartphone,
} from 'lucide-react';

export interface FiresideProfileDrawerProps {
  className?: string;
}

export function FiresideProfileDrawer({ className = '' }: FiresideProfileDrawerProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isAuthenticated = !!(user && !user.isAnonymous);
  const userEmail = user?.email || null;
  const displayName = user?.displayName || userEmail?.split('@')[0] || (isAuthenticated ? 'Director' : 'Guest Storyteller');
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'G';

  // Determine Director Pass tier badge
  const passStatus = (user as any)?.directorPassStatus;
  const isGenerationalVault = (user as any)?.membershipTier === 'generational_vault';
  const hasActivePass =
    passStatus === 'free_host_pass_active' ||
    passStatus === 'paid_host_pass_active' ||
    user?.subscriptionStatus === 'active' ||
    user?.subscriptionStatus === 'trial';

  const tierBadge = isGenerationalVault
    ? 'Generational Vault'
    : hasActivePass
    ? '6-Month Director Pass'
    : isAuthenticated
    ? 'Sandbox Tier'
    : 'Local Phone Session';

  const handleLogout = async () => {
    try {
      setOpen(false);
      await logout(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          data-testid="HS_FIRESIDE_USER_PROFILE_BTN"
          aria-label={isAuthenticated ? `User menu for ${displayName}` : 'Guest session menu'}
          title={isAuthenticated ? `Profile & Settings (${displayName})` : 'Guest Menu & Options'}
          style={{ minHeight: 44, minWidth: 44 }}
          className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 hover:border-amber-500/50 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0 ${className}`}
        >
          {isAuthenticated ? (
            <>
              <Avatar className="h-7 w-7 ring-2 ring-emerald-500/50">
                <AvatarImage src={(user as any)?.photoURL || undefined} alt={displayName} />
                <AvatarFallback className="bg-amber-500/20 text-amber-300 font-bold text-xs">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-xs font-mono text-stone-200 font-medium truncate max-w-[120px]">
                {displayName}
              </span>
              <span className="text-[10px] text-amber-400">▾</span>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-mono text-stone-300">
              <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-medium text-amber-300">Menu ▾</span>
            </div>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        data-testid="HS_FIRESIDE_PROFILE_DRAWER"
        className="w-full sm:max-w-md bg-stone-950/98 border-l border-stone-800 text-stone-100 p-0 flex flex-col justify-between overflow-y-auto z-[150]"
      >
        <div className="p-6 space-y-6">
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <SheetTitle className="text-lg font-serif text-white tracking-wide">
                Fireside Studio Account
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-stone-400">
              Manage your recording studio preferences, Director Pass, and learning guides.
            </SheetDescription>
          </SheetHeader>

          {/* Identity & Plan Badge Card */}
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800/90 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 ring-2 ring-amber-500/40">
                <AvatarImage src={(user as any)?.photoURL || undefined} alt={displayName} />
                <AvatarFallback className="bg-amber-500/20 text-amber-300 font-bold text-base">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-white truncate">{displayName}</h4>
                <p className="text-xs text-stone-400 truncate">{userEmail || 'Local Phone Storage'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
              <span className="text-stone-400 font-mono text-[11px]">Active Tier</span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-semibold">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{tierBadge}</span>
              </span>
            </div>
          </div>

          {/* Quick Switch to Desktop Soundstage */}
          <div>
            <SheetClose asChild>
              <Link
                href="/studio"
                data-testid="HS_DRAWER_LINK_DESKTOP_STUDIO"
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Clapperboard className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-bold uppercase tracking-wider">Desktop Soundstage ↗</div>
                    <div className="text-[11px] text-amber-300/70">Theatrical Acts I–IV for Large Displays</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400/80 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </SheetClose>
          </div>

          {/* Utility Navigation Links (min 48px touch targets) */}
          <nav className="space-y-1.5 pt-1">
            <SheetClose asChild>
              <Link
                href="/settings?returnTo=/studio/fireside"
                data-testid="HS_DRAWER_LINK_SETTINGS"
                className="w-full min-h-[48px] px-3.5 py-3 rounded-xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800/60 text-stone-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="text-xs font-medium">Settings & Device Audio</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-500" />
              </Link>
            </SheetClose>

            <SheetClose asChild>
              <Link
                href="/how-it-works"
                data-testid="HS_DRAWER_LINK_HOW_IT_WORKS"
                className="w-full min-h-[48px] px-3.5 py-3 rounded-xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800/60 text-stone-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="text-xs font-medium">How It Works & Story Guide</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-500" />
              </Link>
            </SheetClose>

            <SheetClose asChild>
              <Link
                href="/pricing"
                data-testid="HS_DRAWER_LINK_PRICING"
                className="w-full min-h-[48px] px-3.5 py-3 rounded-xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800/60 text-stone-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Coffee className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="text-xs font-medium">Pricing & Director Plans</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-500" />
              </Link>
            </SheetClose>

            <SheetClose asChild>
              <Link
                href="/gift"
                data-testid="HS_DRAWER_LINK_GIFT"
                className="w-full min-h-[48px] px-3.5 py-3 rounded-xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800/60 text-stone-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-medium">Gift a Memoir</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-500" />
              </Link>
            </SheetClose>

            <SheetClose asChild>
              <Link
                href="/contact"
                data-testid="HS_DRAWER_LINK_SUPPORT"
                className="w-full min-h-[48px] px-3.5 py-3 rounded-xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800/60 text-stone-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="text-xs font-medium">Concierge Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-500" />
              </Link>
            </SheetClose>

            <SheetClose asChild>
              <Link
                href="/"
                className="w-full min-h-[48px] px-3.5 py-3 rounded-xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800/60 text-stone-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="text-xs font-medium">View Landing Page</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-500" />
              </Link>
            </SheetClose>
          </nav>
        </div>

        {/* Footer Session Action */}
        <div className="p-6 border-t border-stone-800 bg-stone-950 space-y-3">
          {isAuthenticated ? (
            <button
              type="button"
              data-testid="HS_DRAWER_SESSION_BTN"
              onClick={handleLogout}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-stone-900 hover:bg-rose-950/60 border border-stone-800 hover:border-rose-500/40 text-stone-300 hover:text-rose-200 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Session</span>
            </button>
          ) : (
            <SheetClose asChild>
              <Link
                href="/login?redirect=/studio/fireside"
                data-testid="HS_DRAWER_SESSION_BTN"
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </Link>
            </SheetClose>
          )}

          <p className="text-[10px] text-center font-mono text-stone-600 uppercase tracking-widest">
            Memory Weaver &bull; Fireside Studio
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default FiresideProfileDrawer;
