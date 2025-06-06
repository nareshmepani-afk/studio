
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { TimelineFilter } from '@/components/memory/TimelineFilter';
import { Button } from '@/components/ui/button';
import { mockMemories } from '@/lib/mockData';
import type { Memory } from '@/types';
import { PlusCircle, BookHeart, Users, ShieldCheck, ShieldOff, CalendarClock, ShoppingCart, Gift, Loader2, Info, Award } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO, addMonths } from 'date-fns';

export default function TimelinePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
  const [isLoading, setIsLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0); // For gamification hint

  const { 
    user, 
    setPendingRequestCount, 
    userMode, 
    activateFreePass, 
    purchasePaidPass, 
    checkAndUpdatePassStatus, 
    setHasNewSharedMemories, 
    hasNewSharedMemories,
    markSharedMemoryAsViewed,
    checkIfGuestHasUnviewedMemories,
    passPriceDetails,
    fetchPassPrice,
    isFetchingPassPrice
  } = useAuth();

  const mockHostPendingRequests = [ 
    { id: 'req1', text: 'Tell us about your first pet!', user: 'Guest123' },
    { id: 'req2', text: 'What was your favorite childhood vacation?', user: 'Guest456' },
  ];

  const isFreePassActive = useMemo(() => {
    return user?.sharedAccessStatus === 'free_pass_active' && user.freePassActivatedDate;
  }, [user]);

  const isPaidPassActive = useMemo(() => {
    return user?.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate;
  }, [user]);

  const canViewSharedMemories = isFreePassActive || isPaidPassActive;

  useEffect(() => {
    checkAndUpdatePassStatus();
    if (userMode === 'guest' && user && 
        (user.sharedAccessStatus === 'free_pass_expired' || user.sharedAccessStatus === 'paid_pass_expired')) {
      fetchPassPrice();
    }
  }, [checkAndUpdatePassStatus, userMode, user, fetchPassPrice]);


  useEffect(() => {
    const timer = setTimeout(() => {
      if (userMode === 'host') {
        setMemories(mockMemories);
        setCurrentStreak(5); // Mock streak
      } else if (userMode === 'guest' && canViewSharedMemories) {
        setMemories(mockMemories.slice(0, 2));
      } else {
        setMemories([]);
      }
      setIsLoading(false);
      if (userMode === 'host') {
        setPendingRequestCount(mockHostPendingRequests.length); 
      } else {
        setPendingRequestCount(0);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [userMode, canViewSharedMemories, setPendingRequestCount]);

  useEffect(() => {
    let notificationSimulationTimer: NodeJS.Timeout;

    if (userMode === 'host' && user && !hasNewSharedMemories) {
      notificationSimulationTimer = setTimeout(() => {
        if (userMode === 'host' && user && !hasNewSharedMemories) { 
          const hasUnviewedNow = checkIfGuestHasUnviewedMemories();
          if (hasUnviewedNow) {
            setHasNewSharedMemories(true);
          }
        }
      }, 7000); 
    }
    return () => {
      clearTimeout(notificationSimulationTimer);
    };
  }, [userMode, user, hasNewSharedMemories, setHasNewSharedMemories, checkIfGuestHasUnviewedMemories]);


  const handleEditMemory = (memory: Memory) => {
    console.log('Edit memory:', memory);
    // In a real app, you'd likely navigate to an edit page:
    // router.push(`/edit-memory/${memory.id}`);
  };

  const handleDeleteMemory = (memoryId: string) => {
    setMemories(prevMemories => prevMemories.filter(m => m.id !== memoryId));
  };

  const filteredAndSortedMemories = useMemo(() => {
    let result = memories;

    if (searchTerm) {
      result = result.filter(memory =>
        memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.emotionTags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        memory.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    result.sort((a, b) => {
      switch (sortCriteria) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
    return result;
  }, [memories, searchTerm, sortCriteria]);


  if (isLoading) {
    return (
      <AuthenticatedPageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-headline mb-2">Loading Your Memories...</h2>
          <p className="text-muted-foreground">Please wait while we gather everything for you.</p>
        </div>
      </AuthenticatedPageWrapper>
    );
  }
  
  const renderPurchaseButton = () => {
    let buttonText = "Purchase 31-Day Pass";
    if (isFetchingPassPrice) {
      buttonText = "Fetching price...";
    } else if (passPriceDetails) {
      const formattedPrice = new Intl.NumberFormat('en-GB', { style: 'currency', currency: passPriceDetails.currency }).format(passPriceDetails.passPrice);
      buttonText = `Purchase 31-Day Pass (${formattedPrice})`;
    }

    const button = (
      <Button onClick={purchasePaidPass} className="mt-4 w-full sm:w-auto" disabled={isFetchingPassPrice}>
        {isFetchingPassPrice ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
        {buttonText}
      </Button>
    );

    if (passPriceDetails && !isFetchingPassPrice && passPriceDetails.justification) {
      return (
        <TooltipProvider>
          <div className="flex flex-col items-start">
            {button}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="mt-2 text-xs text-muted-foreground flex items-center cursor-default">
                  <Info className="h-3 w-3 mr-1" /> {passPriceDetails.justification} (Based on ~{new Intl.NumberFormat('en-GB', { style: 'currency', currency: passPriceDetails.currency }).format(passPriceDetails.coffeePrice)} coffee)
                </span>
              </TooltipTrigger>
              <TooltipContent align="start" className="max-w-xs">
                <p>{passPriceDetails.justification} We estimate the average coffee in London, UK is about {new Intl.NumberFormat('en-GB', { style: 'currency', currency: passPriceDetails.currency }).format(passPriceDetails.coffeePrice)}.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );
    }
    return button;
  };


  const renderGuestModeAccessUI = () => {
    if (userMode !== 'guest' || !user) return null;

    if (canViewSharedMemories) {
      let passInfo = "";
      if (isFreePassActive && user.freePassActivatedDate) {
         const expiry = format(addMonths(parseISO(user.freePassActivatedDate), 6), 'PPP');
         passInfo = `Your 6-month free pass is active until ${expiry}.`;
      } else if (isPaidPassActive && user.paidPassExpiryDate) {
         passInfo = `Your paid pass is active until ${format(parseISO(user.paidPassExpiryDate), 'PPP')}.`;
      }
      return (
        <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-700">Access Granted</AlertTitle>
          <AlertDescription className="text-green-600">
            You can view shared memories. {passInfo}
            {isPaidPassActive && (
              <div className="mt-2">
                {renderPurchaseButton()}
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    let title = "Access Shared Memories";
    let description = "Activate your free pass or purchase a monthly pass to view memories shared with you.";
    let actionContent = null;

    if (user.sharedAccessStatus === 'no_pass_initiated') {
      title = "Welcome to Shared Memories!";
      description = "Activate your 6-month free pass to start viewing memories shared by others.";
      actionContent = (
        <Button onClick={activateFreePass} className="mt-4 w-full sm:w-auto">
          <Gift className="mr-2 h-5 w-5" /> Activate Your 6-Month Free Pass
        </Button>
      );
    } else if (user.sharedAccessStatus === 'free_pass_expired' || user.sharedAccessStatus === 'paid_pass_expired') {
      title = "Your Pass Has Expired";
      description = "To continue viewing shared memories, please purchase a new 31-day pass.";
      actionContent = renderPurchaseButton();
    }

    return (
      <Alert variant="destructive" className="mb-6">
        <ShieldOff className="h-5 w-5" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          {description}
          {actionContent}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="font-headline text-4xl mb-4 md:mb-0">
            {userMode === 'host' ? 'Your Memories' : 'Shared With You'}
          </h1>
          {userMode === 'host' && (
            <div className="flex items-center space-x-4">
              {currentStreak > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-sm text-primary font-medium p-2 rounded-md bg-primary/10">
                        <Award className="mr-1.5 h-5 w-5" />
                        <span>{currentStreak} Day Streak!</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>You've recorded memories for {currentStreak} days in a row. Keep it up!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Link href="/add-memory" passHref>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Memory
                </Button>
              </Link>
            </div>
          )}
        </div>

        {renderGuestModeAccessUI()}

        <TimelineFilter
          onSortChange={setSortCriteria}
          onSearchChange={setSearchTerm}
        />

        {userMode === 'guest' && !canViewSharedMemories && filteredAndSortedMemories.length === 0 && (
             <div className="text-center py-12 bg-card shadow-lg rounded-lg p-8">
                <CalendarClock className="mx-auto h-16 w-16 text-primary mb-6" />
                <h2 className="font-headline text-3xl mb-3">Activate Access</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Please activate your free pass or purchase a pass above to view shared memories.
                </p>
            </div>
        )}

        {userMode === 'guest' && canViewSharedMemories && filteredAndSortedMemories.length === 0 && (
          <div className="text-center py-12 bg-card shadow-lg rounded-lg p-8">
            <Users className="mx-auto h-16 w-16 text-primary mb-6" />
            <h2 className="font-headline text-3xl mb-3">Nothing Shared Yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              When other users share memories with you, they will appear here.
            </p>
          </div>
        )}

        {userMode === 'host' && filteredAndSortedMemories.length === 0 && (
          <div className="text-center py-12 bg-card shadow-lg rounded-lg p-8">
            <BookHeart className="mx-auto h-16 w-16 text-primary mb-6" />
            <h2 className="font-headline text-3xl mb-3">Welcome to Memory Weaver!</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              This is where your life’s moments will live, forever.
            </p>
            <Link href="/add-memory" passHref>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="mr-2 h-5 w-5" />
                Record Your First Memory
              </Button>
            </Link>
          </div>
        )}

        {((userMode === 'host') || (userMode === 'guest' && canViewSharedMemories)) && filteredAndSortedMemories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedMemories.map((memory) => {
              const isUnreadInGuestMode = userMode === 'guest' && user?.viewedSharedMemoryIds ? !user.viewedSharedMemoryIds.includes(memory.id) : false;
              return (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onEdit={userMode === 'host' ? handleEditMemory : undefined}
                  onDelete={userMode === 'host' ? handleDeleteMemory : undefined}
                  isUnread={userMode === 'guest' ? isUnreadInGuestMode : undefined}
                  onMarkAsViewed={userMode === 'guest' ? markSharedMemoryAsViewed : undefined}
                  userMode={userMode}
                />
              );
            })}
          </div>
        )}
      </div>
    </AuthenticatedPageWrapper>
  );
}
    
