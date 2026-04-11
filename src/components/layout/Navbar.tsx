
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
import { LogOut, PlusCircle, Settings, Film, History, Home, UserCircle2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from './ThemeToggle';
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
      <header className={`sticky top-0 z-[100] w-full transition-all duration-500 ease-in-out border-b
        ${isStudio 
          ? 'translate-y-[-90%] opacity-0 hover:translate-y-0 hover:opacity-100 bg-background/80 backdrop-blur-xl border-white/10 shadow-2xl' 
          : 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm'
        }
      `}>
        <div className="container flex h-16 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={isAuthenticated ? "/prompts" : "/"} className="mr-6 flex items-center space-x-2" aria-label="Memory Weaver Homepage">
                <Film className="h-6 w-6 text-primary ml-2" /> 
                <span className="font-headline text-xl font-bold">Memory Weaver</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go to {isAuthenticated ? 'My Life Journey' : 'Homepage'}</p>
            </TooltipContent>
          </Tooltip>
          
          {isAuthenticated && (
            <nav className="flex flex-1 items-center space-x-4 lg:space-x-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/prompts" className={`${navLinkClass} ${pathname === '/prompts' || pathname.startsWith('/add-memory') ? activeNavLinkClass : ''}`}> 
                    <Film className="mr-1.5 h-4 w-4" /> My Life Journey 
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p>Record and view your life story chapters</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/timeline" className={`${navLinkClass} ${pathname === '/timeline' ? activeNavLinkClass : ''}`}>
                    <History className="mr-1.5 h-4 w-4" /> Timeline 
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p>View all your recorded memories</p></TooltipContent>
              </Tooltip>
               <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/create" className={`${navLinkClass} ${pathname === '/create' ? activeNavLinkClass : ''}`}>
                    <PlusCircle className="mr-1.5 h-4 w-4" /> Create Memory
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p>Create a new freeform memory</p></TooltipContent>
              </Tooltip>
            </nav>
          )}

          <div className="flex items-center ml-auto space-x-2 sm:space-x-4">
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
                    <TooltipContent><p>User Account Options</p></TooltipContent>
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
                  <TooltipContent><p>Log in to your account</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => router.push('/register')}>Sign Up</Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Create a new account</p></TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
