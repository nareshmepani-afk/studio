
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  LogOut, Video, Settings, Film, History, Home, UserCircle2, 
  Clapperboard, Lock, BookOpen, Coffee, MessageSquare, Gift, 
  Menu, Compass, ChevronDown, ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { OpticsPrivacyShield } from './OpticsPrivacyShield';
import { StudioUpgradeBadge } from './StudioUpgradeBadge';
import { Skeleton } from '@/components/ui/skeleton';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Standalone popouts, full-screen production suites, and administrative portals should be distraction-free without consumer app Navbar
  if (
    pathname === '/studio/teleprompter-popout' || 
    pathname === '/studio/remote-camera' ||
    pathname?.startsWith('/studio/production') ||
    pathname?.startsWith('/studio/chapter') ||
    pathname?.startsWith('/cinema/tv') ||
    pathname?.startsWith('/admin')
  ) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const navLinkClass = "text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center whitespace-nowrap shrink-0";
  const activeNavLinkClass = "text-primary";

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
           <Link href="/" className="mr-6 flex items-center space-x-2" aria-label="Memory Weaver Homepage">
              <Film className="h-6 w-6 text-primary ml-2" /> 
              <span className="font-headline text-xl font-bold">Memory Weaver</span>
            </Link>
          <div className="flex items-center ml-auto space-x-2 sm:space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </header>
    );
  }

  const isAuthenticated = !!user;
  const isStudio = pathname?.startsWith('/studio') || pathname?.startsWith('/add-memory');
  const isStudioWorkspace = 
    pathname?.startsWith('/studio') || 
    pathname?.startsWith('/dashboard') || 
    pathname?.startsWith('/create') || 
    pathname?.startsWith('/add-memory') ||
    pathname?.startsWith('/review') ||
    pathname?.startsWith('/requests') ||
    pathname?.startsWith('/interviewer');
  const isInterviewer = pathname?.startsWith('/interviewer');
  
  // PREMIUM ACCESS LOGIC: Check if the user has a valid Director Pass
  const hasDirectorPass = user?.role === 'Director' || 
                          user?.subscriptionStatus === 'trial' ||
                          user?.subscriptionStatus === 'active' ||
                          user?.directorPassStatus === 'free_host_pass_active' || 
                          user?.directorPassStatus === 'paid_host_pass_active';

  // Specific Roles Views
  const isGuestDirectorView = pathname === '/director';
  
  // MOBILE REMOTE STEALTH: Do not render the navbar AT ALL on the interviewer or remote camera screens
  const isRemoteCamera = pathname?.startsWith('/studio/remote-camera');
  if (isInterviewer || isRemoteCamera) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky top-0 z-[100] w-full transition-all duration-300 ease-in-out border-b bg-background/40 backdrop-blur-md border-white/5 shadow-2xl group/nav">
        <div className="container flex h-16 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={isAuthenticated ? "/studio" : "/"} data-hotspot-id="HS_NAV_LOGO" className="mr-3 sm:mr-4 lg:mr-6 flex items-center space-x-2 shrink-0" aria-label="Memory Weaver Homepage">
                <Film className="h-6 w-6 text-primary ml-1 sm:ml-2 shrink-0" /> 
                <span className="font-headline text-lg sm:text-xl font-bold whitespace-nowrap">Memory Weaver</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
              Go to {isAuthenticated ? 'My Life Journey' : 'Homepage'}
            </TooltipContent>
          </Tooltip>
          
          {(isAuthenticated || isGuestDirectorView) ? (
            <nav className="flex flex-1 items-center space-x-2 sm:space-x-3 lg:space-x-4 xl:space-x-6 overflow-x-auto no-scrollbar">
              {isGuestDirectorView ? (
                // Focused Guest Director View
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <div className={`${navLinkClass} ${activeNavLinkClass}`}>
                       <Video className="mr-1.5 h-4 w-4 shrink-0" strokeWidth={2.5} /> Memory Collaboration
                     </div>
                   </TooltipTrigger>
                   <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                     Connect cameras and record together
                   </TooltipContent>
                </Tooltip>
              ) : (
                // Standard Host View
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {!hasDirectorPass ? (
                        <div 
                          data-hotspot-id="HS_NAV_MEMORY_STUDIO"
                          onClick={() => toast.info("Premium Feature", { 
                            description: "Memory Studio belongs to the Director. Upgrade your account to start your own cinematic journey!",
                            action: {
                              label: "Upgrade",
                              onClick: () => router.push('/settings')
                            }
                          })}
                          className={`${navLinkClass} opacity-30 cursor-pointer grayscale group-hover:grayscale-0 transition-all`}
                        >
                           <Clapperboard className="mr-1.5 h-4 w-4 shrink-0" strokeWidth={2.5} /> Memory Studio 
                        </div>
                      ) : (
                        <Link href="/studio" data-hotspot-id="HS_NAV_MEMORY_STUDIO" className={`${navLinkClass} ${(pathname === '/studio' || pathname?.startsWith('/add-memory')) ? activeNavLinkClass : ''}`}> 
                          <Clapperboard className="mr-1.5 h-4 w-4 shrink-0" strokeWidth={2.5} /> Memory Studio 
                        </Link>
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                      {!hasDirectorPass ? 'Upgrade to Unlock Studio' : 'Manage your life story production'}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link 
                        href="/cinema" 
                        data-hotspot-id="HS_NAV_MEMORY_CINEMA"
                        onClick={() => {
                          if (pathname === '/cinema') {
                            router.push('/cinema');
                          }
                        }}
                        className={`${navLinkClass} ${pathname === '/cinema' ? activeNavLinkClass : ''}`}
                      >
                        <Film className="mr-1.5 h-4 w-4 text-primary shrink-0" strokeWidth={2.5} /> Memory Cinema
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                      View your cinematic gallery
                    </TooltipContent>
                  </Tooltip>

                  {/* Tablet Contextual Explore Pill (768px–1279px) */}
                  <div className="hidden md:flex xl:hidden items-center pl-1 border-l border-white/10 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="h-8 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-200/90 flex items-center gap-1.5 transition-all shadow-sm shadow-amber-500/10 focus:outline-none"
                          aria-label="Explore more pages"
                        >
                          <Compass className="w-3.5 h-3.5 text-amber-400" />
                          <span>Explore</span>
                          <ChevronDown className="w-3 h-3 text-amber-300/70" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 bg-[#0A0A0A]/95 backdrop-blur-md border border-amber-500/20 shadow-2xl p-1.5 text-white" align="start">
                        <DropdownMenuItem onClick={() => router.push('/gift')} className="rounded-lg px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 focus:bg-amber-500/20 cursor-pointer mb-1 text-amber-300">
                          <Gift className="mr-2.5 h-4 w-4 text-amber-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-amber-300">Gift a Memoir</span>
                            <span className="text-[10px] text-amber-400/80 font-normal">5"×7" Keepsake Card &amp; Pass</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/how-it-works')} className="rounded-lg px-3 py-2 text-xs text-slate-300 hover:text-white focus:text-white cursor-pointer">
                          <BookOpen className="mr-2.5 h-4 w-4 text-slate-400 shrink-0" />
                          <span>How It Works</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-lg px-3 py-2 text-xs text-slate-300 hover:text-white focus:text-white cursor-pointer">
                          <Coffee className="mr-2.5 h-4 w-4 text-slate-400 shrink-0" />
                          <span>Pricing &amp; Plans</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/contact')} className="rounded-lg px-3 py-2 text-xs text-slate-300 hover:text-white focus:text-white cursor-pointer">
                          <MessageSquare className="mr-2.5 h-4 w-4 text-slate-400 shrink-0" />
                          <span>Contact Support</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Desktop Secondary Links (≥ 1280px) */}
                  <div className="hidden xl:flex items-center space-x-3 xl:space-x-5 pl-2 border-l border-white/10 shrink-0">
                    <Link
                      href="/how-it-works"
                      className={`${navLinkClass} ${pathname === '/how-it-works' ? activeNavLinkClass : ''}`}
                    >
                      How It Works
                    </Link>
                    <Link
                      href="/pricing"
                      className={`${navLinkClass} ${pathname === '/pricing' ? activeNavLinkClass : ''}`}
                    >
                      Pricing
                    </Link>
                    <Link
                      href="/gift"
                      className={`${navLinkClass} ${pathname === '/gift' ? 'text-amber-400 font-semibold drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'hover:text-amber-300'}`}
                    >
                      Gift a Memoir
                    </Link>
                    <Link
                      href="/contact"
                      className={`${navLinkClass} ${pathname === '/contact' ? activeNavLinkClass : ''}`}
                    >
                      Contact
                    </Link>
                  </div>
                </>
              )}
            </nav>
          ) : (
            <nav className="hidden md:flex flex-1 items-center space-x-3 lg:space-x-6 shrink-0">
              <Link
                href="/how-it-works"
                className={`${navLinkClass} ${pathname === '/how-it-works' ? activeNavLinkClass : ''}`}
              >
                How It Works
              </Link>
              <Link
                href="/pricing"
                className={`${navLinkClass} ${pathname === '/pricing' ? activeNavLinkClass : ''}`}
              >
                Pricing
              </Link>
              <Link
                href="/gift"
                className={`${navLinkClass} ${pathname === '/gift' ? 'text-amber-400 font-semibold drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'hover:text-amber-300'}`}
              >
                Gift a Memoir
              </Link>
              <Link
                href="/contact"
                className={`${navLinkClass} ${pathname === '/contact' ? activeNavLinkClass : ''}`}
              >
                Contact
              </Link>
            </nav>
          )}

          <div className="flex items-center ml-auto space-x-1.5 sm:space-x-3 shrink-0">
            <StudioUpgradeBadge />
            {isStudio && <OpticsPrivacyShield />}
            {isStudioWorkspace && (
              <div data-hotspot-id="HS_NAV_LANGUAGE_TOGGLE">
                <LanguageToggle />
              </div>
            )}
            <div data-hotspot-id="HS_NAV_THEME_TOGGLE">
              <ThemeToggle />
            </div>
            {isGuestDirectorView ? (
              <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest rounded-full whitespace-nowrap">
                Guest Remote
              </div>
            ) : isAuthenticated ? (
              <>
                {!isStudio && (
                  <Link href="/studio" className="inline-flex shrink-0">
                    <Button className="h-8 px-2.5 sm:px-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
                      <Clapperboard className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden lg:inline">Enter Studio Stage ↗</span>
                      <span className="hidden sm:inline lg:hidden">Studio ↗</span>
                      <span className="sm:hidden text-[11px]">Studio</span>
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" data-hotspot-id="HS_NAV_USER_PROFILE" className="relative h-8 w-8 rounded-full" aria-label="User account and settings">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                            <AvatarFallback>
                              {user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : <UserCircle2 className="h-6 w-6 text-muted-foreground" />)}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                      User Account Options
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
                        {user.displayName && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/how-it-works')}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>How It Works</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/pricing')}>
                      <Coffee className="mr-2 h-4 w-4" />
                      <span>Pricing & Plans</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/gift')}>
                      <Gift className="mr-2 h-4 w-4 text-amber-400" />
                      <span>Gift a Memoir</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/contact')}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Contact Support</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/')}>
                      <Home className="mr-2 h-4 w-4" />
                      <span>View Landing Page</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="hidden sm:inline-flex h-8 px-3 text-xs" onClick={() => router.push('/login')}>Login</Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                    Log in to your account
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="h-8 px-3 text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold" onClick={() => router.push('/register')}>Sign Up</Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                    Create a new account
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Mobile Slide-Over Drawer (< 768px / < md:) */}
            <div className="md:hidden">
              <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/5" aria-label="Open Navigation Menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-4/5 max-w-sm bg-[#0A0A0A] border-l border-amber-500/20 text-white p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between">
                  <div className="space-y-6">
                    <SheetHeader className="text-left pb-4 border-b border-white/10">
                      <div className="flex items-center space-x-2">
                        <Film className="h-6 w-6 text-primary" />
                        <SheetTitle className="font-headline text-xl font-bold text-white">Memory Weaver</SheetTitle>
                      </div>
                      <p className="text-xs text-slate-400">Cinematic Family Living History</p>
                    </SheetHeader>

                    {/* Stage & Production Links */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Stage &amp; Archive</p>
                      <button
                        onClick={() => { setMobileDrawerOpen(false); router.push(isAuthenticated ? '/studio' : '/login'); }}
                        className="w-full min-h-[48px] p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center space-x-3">
                          <Clapperboard className="h-5 w-5 text-amber-400" />
                          <div>
                            <p className="text-sm font-semibold text-white">Memory Studio</p>
                            <p className="text-[11px] text-slate-400">Narrate &amp; record life chapters</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </button>

                      <button
                        onClick={() => { setMobileDrawerOpen(false); router.push('/cinema'); }}
                        className="w-full min-h-[48px] p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center space-x-3">
                          <Film className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-semibold text-white">Memory Cinema</p>
                            <p className="text-[11px] text-slate-400">Screen your cinematic gallery</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>

                    {/* Discover & Gifting */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Discover &amp; Gifting</p>
                      
                      {/* Featured Gift Card */}
                      <button
                        onClick={() => { setMobileDrawerOpen(false); router.push('/gift'); }}
                        className="w-full min-h-[48px] p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-left transition-all active:scale-[0.98] shadow-lg shadow-amber-500/5"
                      >
                        <div className="flex items-center space-x-3">
                          <Gift className="h-5 w-5 text-amber-400" />
                          <div>
                            <p className="text-sm font-bold text-amber-300">Gift an Heirloom</p>
                            <p className="text-[11px] text-amber-400/80">5"×7" Keepsake Card &amp; Pass</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-amber-400" />
                      </button>

                      <button
                        onClick={() => { setMobileDrawerOpen(false); router.push('/how-it-works'); }}
                        className="w-full min-h-[48px] p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center space-x-3">
                          <BookOpen className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-sm font-semibold text-white">How It Works</p>
                            <p className="text-[11px] text-slate-400">The 5-Act storytelling process</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </button>

                      <button
                        onClick={() => { setMobileDrawerOpen(false); router.push('/pricing'); }}
                        className="w-full min-h-[48px] p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center space-x-3">
                          <Coffee className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-sm font-semibold text-white">Pricing &amp; Plans</p>
                            <p className="text-[11px] text-slate-400">Transparent tiers &amp; lifetime access</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </button>

                      <button
                        onClick={() => { setMobileDrawerOpen(false); router.push('/contact'); }}
                        className="w-full min-h-[48px] p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-sm font-semibold text-white">Contact Support</p>
                            <p className="text-[11px] text-slate-400">Direct studio assistance</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="pt-6 border-t border-white/10 space-y-3">
                    {isAuthenticated ? (
                      <>
                        <Button
                          onClick={() => { setMobileDrawerOpen(false); router.push('/studio'); }}
                          className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                        >
                          <Clapperboard className="w-4 h-4" /> Enter Studio Stage ↗
                        </Button>
                        <div className="flex items-center justify-between pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setMobileDrawerOpen(false); router.push('/settings'); }}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            <Settings className="w-3.5 h-3.5 mr-1.5" /> Settings
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setMobileDrawerOpen(false); handleLogout(); }}
                            className="text-xs text-rose-400 hover:text-rose-300"
                          >
                            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Log out
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => { setMobileDrawerOpen(false); router.push('/login'); }}
                          className="h-11 border-white/20 text-white hover:bg-white/10 text-sm font-semibold rounded-xl"
                        >
                          Login
                        </Button>
                        <Button
                          onClick={() => { setMobileDrawerOpen(false); router.push('/register'); }}
                          className="h-11 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20"
                        >
                          Sign Up
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
