
"use client";

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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { LogOut, PlusCircle, Settings, BellRing, Users, UserCog, BookOpenText, History, Home, UserCircle2 } from 'lucide-react'; // Changed BookHeart, BookOpen
import { useRouter, usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function Navbar() {
  const { isAuthenticated, user, logout, pendingRequestCount, userMode, toggleUserMode, setUserMode, hasNewSharedMemories } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
  };

  const navLinkClass = "text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center";
  const activeNavLinkClass = "text-primary";

  let logoHref = "/";
  if (isAuthenticated) {
    if (userMode === 'host') {
      logoHref = "/prompts";
    } else { // guest mode
      logoHref = "/timeline";
    }
  }

  // Helper to determine if the avatar URL is a placeholder or effectively empty
  const isEffectivelyEmptyOrPlaceholderAvatar = (url?: string): boolean => {
    if (!url || url.trim() === '') return true;
    if (url.startsWith('blob:')) return true; // blob URLs are temporary previews
    if (url.startsWith('https://avatar.vercel.sh/')) return true; // Vercel default
    return false;
  };

  let avatarSrcToAttempt: string | undefined = undefined;
  let showIconAsFallbackInNavbar = true;

  if (user && user.avatarUrl && !isEffectivelyEmptyOrPlaceholderAvatar(user.avatarUrl)) {
    avatarSrcToAttempt = user.avatarUrl;
    showIconAsFallbackInNavbar = false; // We are attempting to show a persisted custom avatar
  }


  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={logoHref} className="mr-6 flex items-center space-x-2">
                <BookOpenText className="h-6 w-6 text-primary" /> {/* Changed Icon */}
                <span className="font-headline text-xl font-bold">Memory Weaver</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go to {isAuthenticated ? (userMode === 'host' ? 'My Life Journey' : 'Shared Timeline') : 'Homepage'}</p>
            </TooltipContent>
          </Tooltip>
          
          {isAuthenticated && (
            <nav className="flex flex-1 items-center space-x-4 lg:space-x-6">
              {userMode === 'host' ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/prompts" className={`${navLinkClass} ${pathname === '/prompts' || pathname.startsWith('/add-memory') ? activeNavLinkClass : ''}`}> 
                        <BookOpenText className="mr-1.5 h-4 w-4" /> My Life Journey {/* Changed Icon */}
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
                      <Link href="/requests" className={`${navLinkClass} ${pathname === '/requests' ? activeNavLinkClass : ''}`}>
                        <BellRing className="mr-1.5 h-4 w-4" /> Requests
                        {pendingRequestCount > 0 && (
                            <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-destructive-foreground bg-destructive rounded-full">
                                {pendingRequestCount}
                            </span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent><p>View memory requests from guests ({pendingRequestCount} pending)</p></TooltipContent>
                  </Tooltip>
                </>
              ) : ( // Guest mode navigation
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/timeline" className={`${navLinkClass} ${pathname === '/timeline' ? activeNavLinkClass : ''}`}>
                         <History className="mr-1.5 h-4 w-4" /> Shared With Me 
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent><p>View memories shared with you</p></TooltipContent>
                  </Tooltip>
                </>
              )}
            </nav>
          )}

          <div className={`flex items-center space-x-4 ${isAuthenticated ? '' : 'ml-auto'}`}>
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="text-sm text-muted-foreground cursor-pointer flex items-center" onClick={() => setUserMode('host')}>
                        <UserCog className={`h-4 w-4 mr-1 ${userMode === 'host' ? 'text-primary' : ''}`} /> Host
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent><p>Switch to Host mode (record memories)</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       {/* The Switch itself doesn't easily accept TooltipTrigger asChild, so wrap its container or use a descriptive label */}
                       <div className="flex items-center">
                         <Switch
                            checked={userMode === 'guest'}
                            onCheckedChange={toggleUserMode}
                            aria-label="Toggle between Host and Guest mode"
                            id="user-mode-switch"
                          />
                       </div>
                    </TooltipTrigger>
                    <TooltipContent><p>Toggle between Host and Guest modes</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="text-sm text-muted-foreground cursor-pointer flex items-center relative" onClick={() => setUserMode('guest')}>
                        <Users className={`h-4 w-4 mr-1 ${userMode === 'guest' ? 'text-primary' : ''}`} /> Guest
                        {userMode === 'host' && hasNewSharedMemories && (
                          <span
                            className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-destructive ring-1 ring-background"
                            style={{ transform: 'translate(60%, -40%)' }}
                            aria-label="New shared memories"
                          />
                        )}
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent><p>Switch to Guest mode (view shared memories){hasNewSharedMemories && userMode === 'host' ? " - New shared memories available!" : ""}</p></TooltipContent>
                  </Tooltip>
                </div>

                {pendingRequestCount > 0 && userMode === 'host' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative lg:hidden" onClick={() => router.push('/requests')}>
                        <BellRing className="h-5 w-5" />
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-destructive-foreground transform translate-x-1/2 -translate-y-1/2 bg-destructive rounded-full">
                          {pendingRequestCount}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{pendingRequestCount} pending memory requests</p></TooltipContent>
                  </Tooltip>
                )}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={avatarSrcToAttempt} alt={user.name || user.email} />
                            <AvatarFallback>
                              {showIconAsFallbackInNavbar ? 
                                (<UserCircle2 className="h-6 w-6 text-muted-foreground" />) :
                                (user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?'))
                              }
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
                        <p className="text-sm font-medium leading-none">{user.name || user.email}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => router.push('/add-memory')}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span>Add Freeform Memory</span>
                    </DropdownMenuItem>
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

