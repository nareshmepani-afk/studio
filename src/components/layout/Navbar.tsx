
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
import { BookHeart, LogOut, PlusCircle, Settings, Sparkles, Grip, BellRing } from 'lucide-react'; // Added BellRing
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { isAuthenticated, user, logout, pendingRequestCount } = useAuth(); // Added pendingRequestCount
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <BookHeart className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold">Memory Weaver</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4 lg:space-x-6">
          {isAuthenticated && (
            <>
              <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Timeline
              </Link>
              <Link href="/add-memory" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Add Memory
              </Link>
              <Link href="/prompts" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Prompts
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center space-x-2"> {/* Reduced space-x for tighter group */}
          {isAuthenticated && user ? (
            <>
              {pendingRequestCount > 0 && (
                <Button variant="ghost" size="icon" className="relative" onClick={() => router.push('/#incoming-requests')}> {/* Simple navigation for now */}
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
                      <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name || user.email} />
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
