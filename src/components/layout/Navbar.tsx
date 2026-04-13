
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
import { LogOut, Video, Settings, Film, History, Home, UserCircle2, Clapperboard } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { Skeleton } from '@/components/ui/skeleton';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
  const isStudio = pathname === '/studio' || pathname?.startsWith('/add-memory');
  const isInterviewer = pathname?.startsWith('/interviewer');

  // MOBILE REMOTE STEALH: Do not render the navbar AT ALL on the interviewer screen
  // to ensure maximum focus and screen real-estate for the teleprompter.
  if (isInterviewer) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky top-0 z-[100] w-full transition-all duration-300 ease-in-out border-b bg-background/40 backdrop-blur-md border-white/5 shadow-2xl group/nav">
        <div className="container flex h-16 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={isAuthenticated ? "/studio" : "/"} className="mr-6 flex items-center space-x-2" aria-label="Memory Weaver Homepage">
                <Film className="h-6 w-6 text-primary ml-2" /> 
                <span className="font-headline text-xl font-bold">Memory Weaver</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
              Go to {isAuthenticated ? 'My Life Journey' : 'Homepage'}
            </TooltipContent>
          </Tooltip>
          
          {isAuthenticated && (
            <nav className="flex flex-1 items-center space-x-4 lg:space-x-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/studio" className={`${navLinkClass} ${(pathname === '/studio' || pathname?.startsWith('/add-memory')) ? activeNavLinkClass : ''}`}> 
                    <Clapperboard className="mr-1.5 h-4 w-4" strokeWidth={2.5} /> Memory Studio 
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                  Manage your life story production
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/cinema" className={`${navLinkClass} ${pathname === '/cinema' ? activeNavLinkClass : ''}`}>
                    <Film className="mr-1.5 h-4 w-4 text-primary" strokeWidth={2.5} /> Memory Cinema
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                  View your cinematic gallery
                </TooltipContent>
              </Tooltip>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Link href="/director" className={`${navLinkClass} ${pathname === '/director' ? activeNavLinkClass : ''}`}>
                     <Video className="mr-1.5 h-4 w-4" strokeWidth={2.5} /> Memory Collaboration
                   </Link>
                 </TooltipTrigger>
                 <TooltipContent side="bottom" className="bg-neutral-900 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                   Connect cameras and record together
                 </TooltipContent>
              </Tooltip>
            </nav>
          )}

          <div className="flex items-center ml-auto space-x-2 sm:space-x-4">
            <LanguageToggle />
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="User account and settings">
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
