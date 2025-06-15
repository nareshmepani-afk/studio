
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { TimelineFilter } from '@/components/memory/TimelineFilter';
import { Button } from '@/components/ui/button';
import { mockMemories } from '@/lib/mockData';
import type { Memory, MemoryCategory } from '@/types';
import { PlusCircle, Film, Users, ShieldCheck, ShieldOff, CalendarClock, ShoppingCart, Gift, Loader2, Info, Award, Archive } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO, addMonths } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

export default function TimelinePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
  const [categoryFilter, setCategoryFilter] = useState<MemoryCategory | 'all'>('all');
  const [legacyFilter, setLegacyFilter] = useState<'all' | 'legacy' | 'non-legacy'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);

  const {
    user,
    setPendingRequestCount,
    userMode,
    activateFreeGuestPass,
    purchasePaidGuestPass,
    checkAndUpdateGuestPassStatus,
    guestPassPriceDetails,
    fetchGuestPassPrice,
    isFetchingGuestPassPrice,
    hostPassStatus,
    setHasNewSharedMemories,
    hasNewSharedMemories,
    markSharedMemoryAsViewed,
    checkIfGuestHasUnviewedMemories,
  } = useAuth();

  const mockHostPendingRequests = [
    { id: 'req1', text: 'Tell us about your first pet!', user: 'Guest123' },
    { id: 'req2', text: 'What was your favorite childhood vacation?', user: 'Guest456' },
  ];

  const canGuestViewSharedMemories = useMemo(() => {
    return user?.sharedAccessStatus === 'free_pass_active' || user?.sharedAccessStatus === 'paid_pass_active';
  }, [user?.sharedAccessStatus]);

  const canHostCreateMemories = useMemo(() => {
    return hostPassStatus === 'free_host_pass_active' || hostPassStatus === 'paid_host_pass_active';
  }, [hostPassStatus]);


  useEffect(() => {
    // Fetch guest pass price if in guest mode and pass is not active or price details are missing
    if (userMode === 'guest' && user &&
        (user.sharedAccessStatus === 'free_pass_expired' || 
         user.sharedAccessStatus === 'paid_pass_expired' || 
         user.sharedAccessStatus === 'no_pass_initiated')) {
      if (!isFetchingGuestPassPrice && !guestPassPriceDetails) {
        fetchGuestPassPrice();
      }
    }
    // AuthContext now handles initial pass status checks on load, so only need to fetch price here if conditions are met.
  }, [userMode, user, fetchGuestPassPrice, isFetchingGuestPassPrice, guestPassPriceDetails]);


  useEffect(() => {
    const timer = setTimeout(() => {
      const storedMemoriesJson = localStorage.getItem('mockMemories');
      let loadedMemories: Memory[] = [];
      if (storedMemoriesJson) {
        try {
          loadedMemories = JSON.parse(storedMemoriesJson);
        } catch (e) {
          console.error("Failed to parse memories from localStorage, using default mocks.", e);
          loadedMemories = mockMemories;
          localStorage.setItem('mockMemories', JSON.stringify(loadedMemories));
        }
      } else {
        loadedMemories = mockMemories;
        localStorage.setItem('mockMemories', JSON.stringify(loadedMemories));
      }

      if (userMode === 'host') {
        setMemories(loadedMemories);
        setCurrentStreak(5); // Mock streak
      } else if (userMode === 'guest') { // Removed canGuestViewSharedMemories check here, will control display later
        setMemories(loadedMemories.slice(0, 2)); // Guests see only first two mock memories
      } else {
        setMemories([]);
      }
      setIsLoading(false);
      if (userMode === 'host') setPendingRequestCount(mockHostPendingRequests.length);
      else setPendingRequestCount(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [userMode, setPendingRequestCount]);

  useEffect(() => {
    let notificationSimulationTimer: NodeJS.Timeout;
    if (userMode === 'host' && user && !hasNewSharedMemories) {
      notificationSimulationTimer = setTimeout(() => {
        if (userMode === 'host' && user && !hasNewSharedMemories && checkIfGuestHasUnviewedMemories()) {
            setHasNewSharedMemories(true);
        }
      }, 7000); // Simulates a delay before "notifying" host
    }
    return () => clearTimeout(notificationSimulationTimer);
  }, [userMode, user, hasNewSharedMemories, setHasNewSharedMemories, checkIfGuestHasUnviewedMemories]);

  const handleEditMemory = (memory: Memory) => console.log('Edit memory:', memory); // Mock, redirect in actual app

  const handleDeleteMemory = useCallback((memoryId: string) => {
    setMemories(prevMemories => {
        const updatedMemories = prevMemories.filter(m => m.id !== memoryId);
        localStorage.setItem('mockMemories', JSON.stringify(updatedMemories));
        return updatedMemories;
    });
    setTimeout(() => {
      toast({ title: "Memory Deleted", description: "The memory has been removed."});
    }, 0);
  }, [setMemories]);

  const handleToggleLegacyStatus = useCallback((memoryId: string) => {
    let toggledMemory: Memory | undefined;
    setMemories(prevMemories => {
      const updatedMemories = prevMemories.map(mem =>
        mem.id === memoryId ? { ...mem, isLegacy: !mem.isLegacy } : mem
      );
      localStorage.setItem('mockMemories', JSON.stringify(updatedMemories));
      toggledMemory = updatedMemories.find(mem => mem.id === memoryId);
      return updatedMemories;
    });

    setTimeout(() => {
      if (toggledMemory) {
        toast({
          title: toggledMemory.isLegacy ? "Added to Legacy Chest" : "Removed from Legacy Chest",
          description: `"${toggledMemory.title}" status updated.`,
        });
      }
    }, 0);
  }, [setMemories]);

  const handleCreateMontage = () => {
    setTimeout(() => {
      toast({ title: "Feature Coming Soon", description: "AI Memory Montages will be available later." });
    }, 0);
  }

  const filteredAndSortedMemories = useMemo(() => {
    let result = memories;
    if (searchTerm) {
      result = result.filter(memory =>
        memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.emotionTags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        memory.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(memory => memory.category === categoryFilter);
    }
    if (legacyFilter !== 'all') {
      result = result.filter(memory => legacyFilter === 'legacy' ? memory.isLegacy === true : memory.isLegacy !== true);
    }
    result.sort((a, b) => {
      switch (sortCriteria) {
        case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title-asc': return a.title.localeCompare(b.title);
        case 'title-desc': return b.title.localeCompare(a.title);
        default: return 0;
      }
    });
    return result;
  }, [memories, searchTerm, sortCriteria, categoryFilter, legacyFilter]);

  if (isLoading) return (<AuthenticatedPageWrapper><div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><h2 className="text-2xl font-headline mb-2">Loading Memories...</h2></div></AuthenticatedPageWrapper>);

  const renderGuestPurchaseButton = () => {
    let buttonText = "Purchase 31-Day Guest Pass";
    let priceString = "";
    if (isFetchingGuestPassPrice) {
        buttonText = "Fetching price...";
    } else if (guestPassPriceDetails) {
        priceString = ` (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: guestPassPriceDetails.currency }).format(guestPassPriceDetails.passPrice)})`;
        buttonText += priceString;
    } else {
         buttonText += ` (£7.99 - Mock)`;
    }
    
    const button = (<Button onClick={purchasePaidGuestPass} className="mt-2 sm:mt-0 sm:ml-2 w-full sm:w-auto" disabled={isFetchingGuestPassPrice}>{isFetchingGuestPassPrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}{buttonText}</Button>);
    
    if (guestPassPriceDetails && !isFetchingGuestPassPrice && guestPassPriceDetails.justification) {
      return (<TooltipProvider><div className="flex flex-col sm:flex-row items-start sm:items-center mt-2">{button}<Tooltip><TooltipTrigger asChild><span className="mt-1 sm:mt-0 sm:ml-2 text-xs text-muted-foreground flex items-center cursor-default"><Info className="h-3 w-3 mr-1" /> {guestPassPriceDetails.justification}</span></TooltipTrigger><TooltipContent align="start" className="max-w-xs"><p>{guestPassPriceDetails.justification} (Based on avg coffee: ~{new Intl.NumberFormat('en-GB', { style: 'currency', currency: guestPassPriceDetails.currency }).format(guestPassPriceDetails.coffeePrice)})</p></TooltipContent></Tooltip></div></TooltipProvider>);
    }
    return <div className="mt-2">{button}</div>;
  };

  const renderGuestModeAccessUI = () => {
    if (userMode !== 'guest' || !user) return null;

    if (canGuestViewSharedMemories) {
      let passInfo = "";
      if (user.sharedAccessStatus === 'free_pass_active' && user.freePassActivatedDate) {
        passInfo = `Your 6-month free guest pass is active until ${format(addMonths(parseISO(user.freePassActivatedDate), 6), 'PPP', { locale: enGB })}.`;
      } else if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate) {
        passInfo = `Your paid guest pass is active until ${format(parseISO(user.paidPassExpiryDate), 'PPP', { locale: enGB })}.`;
      }
      return (
        <Alert variant="default" className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700">
          <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-700 dark:text-green-300">Access Granted</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-500">
            {passInfo} You can view memories shared with you.
            {user.sharedAccessStatus === 'paid_pass_active' && (
              <div className="mt-2">{renderGuestPurchaseButton()}</div>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    let title = "Access Shared Memories";
    let description = "Activate your free pass or purchase a pass to view shared memories.";
    let actionContent = null;

    if (user.sharedAccessStatus === 'no_pass_initiated') {
      title = "Welcome, Guest!";
      description = "To view memories shared with you by hosts, please activate your complimentary 6-month free Guest Pass.";
      actionContent = (
        <Button onClick={activateFreeGuestPass} className="mt-3 w-full sm:w-auto">
          <Gift className="mr-2 h-5 w-5" /> Activate Free Guest Pass
        </Button>
      );
    } else if (user.sharedAccessStatus === 'free_pass_expired' || user.sharedAccessStatus === 'paid_pass_expired') {
      title = "Guest Pass Expired";
      description = "Your Guest Pass has expired. To continue viewing shared memories, please purchase a new 31-day pass.";
      actionContent = renderGuestPurchaseButton();
    }

    return (
      <Alert variant="destructive" className="mb-6">
        <ShieldOff className="h-5 w-5" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex flex-col items-start">
          {description}
          {actionContent}
        </AlertDescription>
      </Alert>
    );
  };
  
  let guestAccessPlaceholderMessage = "Activate or purchase a guest pass to view shared memories.";
  if (userMode === 'guest' && !canGuestViewSharedMemories && user) {
    if (user.sharedAccessStatus === 'free_pass_expired' || user.sharedAccessStatus === 'paid_pass_expired') {
      if (isFetchingGuestPassPrice) guestAccessPlaceholderMessage = "Purchase pass (fetching price...) to view shared memories.";
      else if (guestPassPriceDetails) guestAccessPlaceholderMessage = `Purchase pass (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: guestPassPriceDetails.currency }).format(guestPassPriceDetails.passPrice)}) to view shared memories.`;
      else guestAccessPlaceholderMessage = "Purchase pass to view shared memories.";
    } else if (user.sharedAccessStatus === 'no_pass_initiated') {
      guestAccessPlaceholderMessage = "Activate your free guest pass to view shared memories.";
    }
  }

  const addMemoryButtonDisabled = userMode === 'host' && !canHostCreateMemories;
  let addMemoryTooltipContent = "Add a new memory to your timeline.";
  if (addMemoryButtonDisabled) {
      if (hostPassStatus === 'no_pass_initiated') addMemoryTooltipContent = "Activate your Free Host Pass in Settings to add memories.";
      else if (hostPassStatus === 'free_host_pass_expired' || hostPassStatus === 'paid_host_pass_expired') addMemoryTooltipContent = "Your Host Pass has expired. Renew in Settings to add memories.";
      else addMemoryTooltipContent = "An active Host Pass is required to add memories. Check Settings.";
  }


  return (
    <AuthenticatedPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="font-headline text-4xl mb-4 md:mb-0">{userMode === 'host' ? 'Your Memories' : 'Shared With You'}</h1>
          {userMode === 'host' && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              {currentStreak > 0 && (<TooltipProvider><Tooltip><TooltipTrigger asChild><div className="flex items-center text-sm text-primary font-medium p-2 rounded-md bg-primary/10"><Award className="mr-1.5 h-5 w-5" /><span>{currentStreak} Day Streak!</span></div></TooltipTrigger><TooltipContent><p>Recorded memories for {currentStreak} days. Keep it up!</p></TooltipContent></Tooltip></TooltipProvider>)}
              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleCreateMontage} aria-label="Create AI Memory Montage"><Film className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Create AI Memory Montage (Soon)</p></TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Link href={addMemoryButtonDisabled ? "#" : "/add-memory"} passHref legacyBehavior>
                        <Button disabled={addMemoryButtonDisabled} aria-disabled={addMemoryButtonDisabled} onClick={(e) => { if(addMemoryButtonDisabled) { e.preventDefault(); toast({title: "Host Pass Required", description: addMemoryTooltipContent, variant: "destructive"});} }}>
                          <PlusCircle className="mr-2 h-5 w-5" /> Add New Memory
                        </Button>
                      </Link>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p>{addMemoryTooltipContent}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {renderGuestModeAccessUI()}
        <TimelineFilter
          onSortChange={setSortCriteria}
          onSearchChange={setSearchTerm}
          onCategoryFilterChange={setCategoryFilter}
          onLegacyFilterChange={setLegacyFilter}
        />

        {userMode === 'guest' && !canGuestViewSharedMemories && (
          <div className="text-center py-12 bg-card shadow-lg rounded-lg p-8">
            <CalendarClock className="mx-auto h-16 w-16 text-primary mb-6" />
            <h2 className="font-headline text-3xl mb-3">Activate Guest Access</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">{guestAccessPlaceholderMessage}</p>
          </div>
        )}
        {userMode === 'guest' && canGuestViewSharedMemories && filteredAndSortedMemories.length === 0 && (
          <div className="text-center py-12 bg-card shadow-lg rounded-lg p-8">
            <Users className="mx-auto h-16 w-16 text-primary mb-6" />
            <h2 className="font-headline text-3xl mb-3">Nothing Shared Yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">When memories are shared with you, they appear here.</p>
          </div>
        )}
        {userMode === 'host' && filteredAndSortedMemories.length === 0 && (
          <div className="text-center py-12 bg-card shadow-lg rounded-lg p-8">
            <Film className="mx-auto h-16 w-16 text-primary mb-6" />
            <h2 className="font-headline text-3xl mb-3">Welcome to Memory Weaver!</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Record your life’s moments. If you need a Host Pass, check Settings.</p>
            <Link href={addMemoryButtonDisabled ? "/settings" : "/add-memory"} passHref>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="mr-2 h-5 w-5" />{addMemoryButtonDisabled ? "Go to Settings" : "Record First Memory"}
              </Button>
            </Link>
          </div>
        )}

        {((userMode === 'host') || (userMode === 'guest' && canGuestViewSharedMemories)) && filteredAndSortedMemories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedMemories.map((memory) => {
              const isUnreadInGuestMode = userMode === 'guest' && user?.viewedSharedMemoryIds ? !user.viewedSharedMemoryIds.includes(memory.id) : false;
              return (<MemoryCard
                          key={memory.id}
                          memory={memory}
                          onEdit={userMode === 'host' ? handleEditMemory : undefined}
                          onDelete={userMode === 'host' ? handleDeleteMemory : undefined}
                          onToggleLegacyStatus={userMode === 'host' ? handleToggleLegacyStatus : undefined}
                          isUnread={userMode === 'guest' ? isUnreadInGuestMode : undefined}
                          onMarkAsViewed={userMode === 'guest' ? markSharedMemoryAsViewed : undefined}
                          userMode={userMode}
                      />);
            })}
          </div>
        )}
      </div>
    </AuthenticatedPageWrapper>
  );
}

