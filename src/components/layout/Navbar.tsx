
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
import { BookHeart, LogOut, PlusCircle, Settings, BellRing, Users, UserCog, BookOpen, Timeline } from 'lucide-react'; // Added Timeline
import { useRouter, usePathname } from 'next/navigation';

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href={logoHref} className="mr-6 flex items-center space-x-2">
          <BookHeart className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold">Memory Weaver</span>
        </Link>
        
        {isAuthenticated && (
          <nav className="flex flex-1 items-center space-x-4 lg:space-x-6">
            {userMode === 'host' ? (
              <>
                <Link href="/prompts" className={`${navLinkClass} ${pathname === '/prompts' || pathname.startsWith('/add-memory') ? activeNavLinkClass : ''}`}> 
                  <BookOpen className="mr-1.5 h-4 w-4" /> My Life Journey
                </Link>
                <Link href="/timeline" className={`${navLinkClass} ${pathname === '/timeline' ? activeNavLinkClass : ''}`}>
                  <Timeline className="mr-1.5 h-4 w-4" /> Timeline
                </Link>
                <Link href="/requests" className={`${navLinkClass} ${pathname === '/requests' ? activeNavLinkClass : ''}`}>
                  <BellRing className="mr-1.5 h-4 w-4" /> Requests
                  {pendingRequestCount > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-destructive-foreground bg-destructive rounded-full">
                          {pendingRequestCount}
                      </span>
                  )}
                </Link>
              </>
            ) : ( // Guest mode navigation
              <>
                <Link href="/timeline" className={`${navLinkClass} ${pathname === '/timeline' ? activeNavLinkClass : ''}`}>
                   <Timeline className="mr-1.5 h-4 w-4" /> Shared With Me
                </Link>
              </>
            )}
          </nav>
        )}

        <div className={`flex items-center space-x-4 ${isAuthenticated ? '' : 'ml-auto'}`}>
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center space-x-2">
                <Label className="text-sm text-muted-foreground cursor-pointer flex items-center" onClick={() => setUserMode('host')}>
                  <UserCog className={`h-4 w-4 mr-1 ${userMode === 'host' ? 'text-primary' : ''}`} /> Host
                </Label>
                <Switch
                  checked={userMode === 'guest'}
                  onCheckedChange={toggleUserMode}
                  aria-label="Toggle between Host and Guest mode"
                />
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
              </div>

              {pendingRequestCount > 0 && userMode === 'host' && (
                <Button variant="ghost" size="icon" className="relative lg:hidden" onClick={() => router.push('/requests')}>
                  <BellRing className="h-5 w-5" />
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-destructive-foreground transform translate-x-1/2 -translate-y-1/2 bg-destructive rounded-full">
                    {pendingRequestCount}
                  </span>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name || user.email} />
                      <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
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
              <Button variant="ghost" onClick={() => router.push('/login')}>Login</Button>
              <Button onClick={() => router.push('/register')}>Sign Up</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
