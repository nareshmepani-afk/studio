
'use client';

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
import { LogOut, Video, Settings, Film, History, Home, UserCircle2, Clapperboard, Lock, BookOpen, Coffee, MessageSquare } from 'lucide-react';
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

  const navLinkClass = "text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center";
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
  // A "Guest" is anyone who hasn't activated or paid for a host/director pass.
  const hasDirectorPass = user?.role === 'Director' || 
                          user?.subscriptionStatus === 'trial' ||
                          user?.subscriptionStatus === 'active' ||
                          user?.directorPassStatus === 'free_host_pass_active' || 
                          user?.directorPassStatus === 'paid_host_pass_active';
  const isGuest = isAuthenticated && !hasDirectorPass;

  // Specific Roles Views
  const isGuestDirectorView = pathname === '/director';
  
  // MOBILE REMOTE STEALTH: Do not render the navbar AT ALL on the interviewer or remote camera screens
  // to ensure maximum focus and screen real-estate.
  const isRemoteCamera = pathname?.startsWith('/studio/remote-camera');
  if (isInterviewer || isRemoteCamera) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky top-0 z-[100] w-full transition-all duration-300 ease-in-out border-b bg-background/40 backdrop-blur-md border-white/5 shadow-2xl group/nav">
        <div className="container flex h-16 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={isAuthenticated ? "/studio" : "/"} data-hotspot-id="HS_NAV_LOGO" className="mr-6 flex items-center space-x-2" aria-label="Memory Weaver Homepage">
                <Film className="h-6 w-6 text-primary ml-2" /> 
                <span className="font-headline text-xl font-bold">Memory Weaver</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
              Go to {isAuthenticated ? 'My Life Journey' : 'Homepage'}
            </TooltipContent>
          </Tooltip>
          
          {(isAuthenticated || isGuestDirectorView) ? (
            <nav className="flex flex-1 items-center space-x-3 sm:space-x-4 lg:space-x-6 overflow-x-auto no-scrollbar">
              {isGuestDirectorView ? (
                // Focused Guest Director View
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <div className={`${navLinkClass} ${activeNavLinkClass}`}>
                       <Video className="mr-1.5 h-4 w-4" strokeWidth={2.5} /> Memory Collaboration
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
                           <Clapperboard className="mr-1.5 h-4 w-4" strokeWidth={2.5} /> Memory Studio 
                        </div>
                      ) : (
                        <Link href="/studio" data-hotspot-id="HS_NAV_MEMORY_STUDIO" className={`${navLinkClass} ${(pathname === '/studio' || pathname?.startsWith('/add-memory')) ? activeNavLinkClass : ''}`}> 
                          <Clapperboard className="mr-1.5 h-4 w-4" strokeWidth={2.5} /> Memory Studio 
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
                        <Film className="mr-1.5 h-4 w-4 text-primary" strokeWidth={2.5} /> Memory Cinema
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                      View your cinematic gallery
                    </TooltipContent>
                  </Tooltip>

                  <div className="hidden md:flex items-center space-x-3 sm:space-x-4 lg:space-x-6 pl-2 border-l border-white/10">
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
            <nav className="hidden flex-1 items-center space-x-4 md:flex lg:space-x-6">
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
                href="/contact"
                className={`${navLinkClass} ${pathname === '/contact' ? activeNavLinkClass : ''}`}
              >
                Contact
              </Link>
            </nav>
          )}

          <div className="flex items-center ml-auto space-x-2 sm:space-x-4">
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
              <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                Guest Remote
              </div>
            ) : isAuthenticated ? (
              <>
                {!isStudio && (
                  <Link href="/studio" className="hidden sm:inline-flex">
                    <Button className="h-8 px-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95">
                      <Clapperboard className="w-3.5 h-3.5" /> Enter Studio Stage ↗
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
                    <Button variant="ghost" onClick={() => router.push('/login')}>Login</Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                    Log in to your account
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => router.push('/register')}>Sign Up</Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                    Create a new account
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
