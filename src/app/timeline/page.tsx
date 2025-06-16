
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { TimelineFilter } from '@/components/memory/TimelineFilter';
import { Button } from '@/components/ui/button';
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
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';

export default function TimelinePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
  const [categoryFilter, setCategoryFilter] = useState<MemoryCategory | 'all'>('all');
  const [legacyFilter, setLegacyFilter] = useState<'all' | 'legacy' | 'non-legacy'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0); // Mock streak for now

  const {
    user,
    setPendingRequestCount, // Kept for UI, actual logic needs backend
    userMode,
    activateFreeGuestPass,
    purchasePaidGuestPass,
    guestPassPriceDetails,
    fetchGuestPassPrice,
    isFetchingGuestPassPrice,
    hostPassStatus,
    setHasNewSharedMemories, // Kept for UI
    hasNewSharedMemories, // Kept for UI
    markSharedMemoryAsViewed, // Firestore update needed for this
    checkIfGuestHasUnviewedMemories, // Firestore query needed
  } = useAuth();

  // Mock requests, as this requires a backend/sharing mechanism
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
  
  const isViewingLegacyChest = useMemo(() => legacyFilter === 'legacy', [legacyFilter]);

  useEffect(() => {
    if (userMode === 'guest' && user &&
        (user.sharedAccessStatus === 'free_pass_expired' || 
         user.sharedAccessStatus === 'paid_pass_expired' || 
         user.sharedAccessStatus === 'no_pass_initiated')) {
      if (!isFetchingGuestPassPrice && !guestPassPriceDetails) {
        fetchGuestPassPrice();
      }
    }
  }, [userMode, user, fetchGuestPassPrice, isFetchingGuestPassPrice, guestPassPriceDetails]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setMemories([]);
      return;
    }

    setIsLoading(true);
    // For guest mode, we'll show the host's memories for now.
    // True sharing logic would involve a different query (e.g., memories shared *with* the guest user).
    const memoriesColRef = collection(db, "users", user.id, "memories");
    
    // Build query based on sort order for now. Filtering will be client-side.
    let q = query(memoriesColRef, orderBy('date', sortCriteria.startsWith('date-') ? (sortCriteria.endsWith('desc') ? 'desc' : 'asc') : 'desc'));
    // Firestore doesn't allow ordering by a different field than the one used in a range filter.
    // If title sort is primary, we'd fetch all and sort client-side, or use more complex indexing.
    // For now, primary sort is by date. Client-side sort can refine title.

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMemories = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        // Ensure date is a string, Firestore Timestamps might need conversion if stored differently
        date: (docSnap.data().date as Timestamp)?.toDate ? (docSnap.data().date as Timestamp).toDate().toISOString() : docSnap.data().date as string,
        createdAt: (docSnap.data().createdAt as Timestamp)?.toDate ? (docSnap.data().createdAt as Timestamp).toDate().toISOString() : undefined,
        updatedAt: (docSnap.data().updatedAt as Timestamp)?.toDate ? (docSnap.data().updatedAt as Timestamp).toDate().toISOString() : undefined,

      })) as Memory[];
      setMemories(fetchedMemories);
      setIsLoading(false);
      if (userMode === 'host') {
        setPendingRequestCount(mockHostPendingRequests.length); // Mock
      } else {
        setPendingRequestCount(0);
      }
    }, (error) => {
      console.error("Error fetching memories from Firestore:", error);
      toast({ title: "Error Loading Memories", description: "Could not fetch memories.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, userMode, setPendingRequestCount, sortCriteria]);


  useEffect(() => {
    let notificationSimulationTimer: NodeJS.Timeout;
    if (userMode === 'host' && user && !hasNewSharedMemories) {
      // This simulation will be replaced by actual logic checking shared memories in Firestore
      // notificationSimulationTimer = setTimeout(() => {
      //   if (userMode === 'host' && user && !hasNewSharedMemories && checkIfGuestHasUnviewedMemories()) {
      //       setHasNewSharedMemories(true);
      //   }
      // }, 7000); 
    }
    return () => clearTimeout(notificationSimulationTimer);
  }, [userMode, user, hasNewSharedMemories, setHasNewSharedMemories, checkIfGuestHasUnviewedMemories]);


  const handleDeleteMemory = useCallback(async (memoryId: string) => {
    if (!user) return;
    try {
      const memoryDocRef = doc(db, "users", user.id, "memories", memoryId);
      await deleteDoc(memoryDocRef);
      toast({ title: "Memory Deleted", description: "The memory has been removed from Firestore."});
      // No need to manually update state, onSnapshot will do it.
    } catch (error) {
      console.error("Error deleting memory from Firestore:", error);
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  }, [user]);

  const handleToggleLegacyStatus = useCallback(async (memoryId: string) => {
    if (!user) return;
    const memoryToUpdate = memories.find(mem => mem.id === memoryId);
    if (!memoryToUpdate) return;

    try {
      const memoryDocRef = doc(db, "users", user.id, "memories", memoryId);
      await updateDoc(memoryDocRef, { isLegacy: !memoryToUpdate.isLegacy });
      toast({
        title: !memoryToUpdate.isLegacy ? "Added to Legacy Chest" : "Removed from Legacy Chest",
        description: `"${memoryToUpdate.title}" status updated in Firestore.`,
      });
      // No need to manually update state, onSnapshot will do it.
    } catch (error) {
      console.error("Error updating legacy status in Firestore:", error);
      toast({ title: "Update Failed", variant: "destructive" });
    }
  }, [user, memories]);

  const handleCreateMontage = () => {
    setTimeout(() => {
      toast({ title: "Feature Coming Soon", description: "AI Memory Montages will be available later." });
    }, 0);
  }

  const filteredAndSortedMemories = useMemo(() => {
    let result = memories; // Already sorted by date from Firestore query (primary sort)
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

    // Secondary sort (e.g., by title if date is primary from Firestore)
    if (sortCriteria.startsWith('title-')) {
      result.sort((a, b) => {
        if (sortCriteria === 'title-asc') return a.title.localeCompare(b.title);
        if (sortCriteria === 'title-desc') return b.title.localeCompare(a.title);
        return 0;
      });
    }
    // If sortCriteria is date-based, Firestore already handled it.
    return result;
  }, [memories, searchTerm, sortCriteria, categoryFilter, legacyFilter]);

  if (isLoading && !user) { // Initial load before user is determined
    return (
      <AuthenticatedPageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-headline mb-2">Initializing...</h2>
        </div>
      </AuthenticatedPageWrapper>
    );
  }
  
  if (isLoading && user) { // User determined, loading memories
     return (
      <AuthenticatedPageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-headline mb-2">Loading Memories...</h2>
        </div>
      </AuthenticatedPageWrapper>
    );
  }


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
    
    const button = (<Button onClick={purchasePaidGuestPass} className="mt-2 sm:mt-0 sm:ml-2 w-full sm:w-auto" disabled={isFetchingGuestPassPrice} aria-label={buttonText}>{isFetchingGuestPassPrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}{buttonText}</Button>);
    
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
        <Button onClick={activateFreeGuestPass} className="mt-3 w-full sm:w-auto" aria-label="Activate Free Guest Pass">
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
              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleCreateMontage} aria-label="Create AI Memory Montage (Coming Soon)"><Film className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Create AI Memory Montage (Soon)</p></TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Link href={addMemoryButtonDisabled ? "#" : "/add-memory"} passHref legacyBehavior>
                        <Button disabled={addMemoryButtonDisabled} aria-disabled={addMemoryButtonDisabled} onClick={(e) => { if(addMemoryButtonDisabled) { e.preventDefault(); toast({title: "Host Pass Required", description: addMemoryTooltipContent, variant: "destructive"});} }} aria-label={addMemoryTooltipContent}>
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
        
        {isViewingLegacyChest && userMode === 'host' && (
          <Alert className="mb-6 bg-secondary/50 border-secondary-darker shadow">
            <Archive className="h-5 w-5 text-secondary-foreground" />
            <AlertTitle className="font-headline text-secondary-foreground">Your Legacy Chest</AlertTitle>
            <AlertDescription className="text-secondary-foreground/80">
              You are viewing memories you've marked for your Legacy Chest. These are special moments preserved for the future.
            </AlertDescription>
          </Alert>
        )}

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
        
        {isViewingLegacyChest && userMode === 'host' && filteredAndSortedMemories.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-card shadow-lg rounded-lg p-8">
            <Archive className="mx-auto h-16 w-16 text-primary mb-6" />
            <h2 className="font-headline text-3xl mb-3">Your Legacy Chest is Empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Mark important memories with the <Archive className="inline-block h-4 w-4 mx-1" /> icon on their cards to add them to your Legacy Chest.
            </p>
          </div>
        )}

        {!isViewingLegacyChest && userMode === 'guest' && canGuestViewSharedMemories && filteredAndSortedMemories.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-card shadow-lg rounded-lg p-8">
            <Users className="mx-auto h-16 w-16 text-primary mb-6" />
            <h2 className="font-headline text-3xl mb-3">Nothing Shared Yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">When memories are shared with you, they appear here.</p>
          </div>
        )}
        
        {!isViewingLegacyChest && userMode === 'host' && filteredAndSortedMemories.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-card shadow-lg rounded-lg p-8">
            <Film className="mx-auto h-16 w-16 text-primary mb-6" />
            <h2 className="font-headline text-3xl mb-3">Welcome to Memory Weaver!</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Record your life’s moments. If you need a Host Pass, check Settings.</p>
            <Link href={addMemoryButtonDisabled ? "/settings" : "/add-memory"} passHref>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" aria-label={addMemoryButtonDisabled ? "Go to Settings to activate Host Pass" : "Record your first memory"}>
                <PlusCircle className="mr-2 h-5 w-5" />{addMemoryButtonDisabled ? "Go to Settings" : "Record First Memory"}
              </Button>
            </Link>
          </div>
        )}

        {((userMode === 'host') || (userMode === 'guest' && canGuestViewSharedMemories)) && filteredAndSortedMemories.length > 0 && !isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedMemories.map((memory) => {
              const isUnreadInGuestMode = userMode === 'guest' && user?.viewedSharedMemoryIds ? !user.viewedSharedMemoryIds.includes(memory.id) : false;
              return (<MemoryCard
                          key={memory.id}
                          memory={memory}
                          onEdit={userMode === 'host' ? (mem) => router.push(`/add-memory?editMemoryId=${mem.id}`) : undefined}
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
