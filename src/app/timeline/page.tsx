
"use client";

import { AuthenticatedPageWrapper } from '@/components/layout/AuthenticatedPageWrapper';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { TimelineFilter } from '@/components/memory/TimelineFilter';
import { Button } from '@/components/ui/button';
import { mockMemories } from '@/lib/mockData';
import type { Memory } from '@/types';
import { PlusCircle, BookHeart, Users, ShieldCheck, ShieldOff, CalendarClock, ShoppingCart, Gift, Loader2, Info, Award, Film } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO, addMonths } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function TimelinePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
  const [isLoading, setIsLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);

  const { 
    user, 
    setPendingRequestCount, 
    userMode, 
    // Guest Pass
    activateFreePass: activateFreeGuestPass, 
    purchasePaidPass: purchasePaidGuestPass, 
    checkAndUpdateGuestPassStatus,
    guestPassPriceDetails,
    fetchGuestPassPrice,
    isFetchingGuestPassPrice,
    // Host Pass
    hostPassStatus, // Use hostPassStatus to determine if host can create
    // Shared memory notifications
    setHasNewSharedMemories, 
    hasNewSharedMemories,
    markSharedMemoryAsViewed,
    checkIfGuestHasUnviewedMemories,
  } = useAuth();

  const mockHostPendingRequests = [ 
    { id: 'req1', text: 'Tell us about your first pet!', user: 'Guest123' },
    { id: 'req2', text: 'What was your favorite childhood vacation?', user: 'Guest456' },
  ];

  // Guest can view shared memories if their guest pass is active
  const canGuestViewSharedMemories = useMemo(() => {
    return user?.sharedAccessStatus === 'free_pass_active' || user?.sharedAccessStatus === 'paid_pass_active';
  }, [user]);

  // Host can create/add memories if their host pass is active
  const canHostCreateMemories = useMemo(() => {
    return user?.hostPassStatus === 'free_host_pass_active' || user?.hostPassStatus === 'paid_host_pass_active';
  }, [user]);


  useEffect(() => {
    checkAndUpdateGuestPassStatus(); // For guest viewing logic
    // checkAndUpdateHostPassStatus(); // Already called in settings/prompts or context effect
    if (userMode === 'guest' && user && 
        (user.sharedAccessStatus === 'free_pass_expired' || user.sharedAccessStatus === 'paid_pass_expired' || user.sharedAccessStatus === 'no_pass_initiated')) {
      fetchGuestPassPrice();
    }
  }, [checkAndUpdateGuestPassStatus, userMode, user, fetchGuestPassPrice]);


  useEffect(() => {
    const timer = setTimeout(() => {
      if (userMode === 'host') {
        setMemories(mockMemories); // Host sees all their memories regardless of pass status for viewing on timeline
        setCurrentStreak(5); 
      } else if (userMode === 'guest' && canGuestViewSharedMemories) {
        setMemories(mockMemories.slice(0, 2)); // Guests see limited shared memories if their pass is active
      } else {
        setMemories([]);
      }
      setIsLoading(false);
      if (userMode === 'host') setPendingRequestCount(mockHostPendingRequests.length); 
      else setPendingRequestCount(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [userMode, canGuestViewSharedMemories, setPendingRequestCount]);

  useEffect(() => {
    let notificationSimulationTimer: NodeJS.Timeout;
    if (userMode === 'host' && user && !hasNewSharedMemories) {
      notificationSimulationTimer = setTimeout(() => {
        if (userMode === 'host' && user && !hasNewSharedMemories) { 
          if (checkIfGuestHasUnviewedMemories()) setHasNewSharedMemories(true);
        }
      }, 7000); 
    }
    return () => clearTimeout(notificationSimulationTimer);
  }, [userMode, user, hasNewSharedMemories, setHasNewSharedMemories, checkIfGuestHasUnviewedMemories]);

  const handleEditMemory = (memory: Memory) => console.log('Edit memory:', memory);
  const handleDeleteMemory = (memoryId: string) => setMemories(prevMemories => prevMemories.filter(m => m.id !== memoryId));
  const handleCreateMontage = () => toast({ title: "Feature Coming Soon", description: "AI Memory Montages will be available later." });

  const filteredAndSortedMemories = useMemo(() => {
    let result = memories;
    if (searchTerm) result = result.filter(memory => memory.title.toLowerCase().includes(searchTerm.toLowerCase()) || memory.description?.toLowerCase().includes(searchTerm.toLowerCase()) || memory.emotionTags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) || memory.location?.toLowerCase().includes(searchTerm.toLowerCase()) || memory.country?.toLowerCase().includes(searchTerm.toLowerCase()));
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
  }, [memories, searchTerm, sortCriteria]);

  if (isLoading) return (<AuthenticatedPageWrapper><div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><h2 className="text-2xl font-headline mb-2">Loading Memories...</h2></div></AuthenticatedPageWrapper>);
  
  const renderGuestPurchaseButton = () => {
    let buttonText = "Purchase 31-Day Guest Pass";
    if (isFetchingGuestPassPrice) buttonText = "Fetching price...";
    else if (guestPassPriceDetails) buttonText = `Purchase 31-Day Guest Pass (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: guestPassPriceDetails.currency }).format(guestPassPriceDetails.passPrice)})`;
    const button = (<Button onClick={purchasePaidGuestPass} className="mt-4 w-full sm:w-auto" disabled={isFetchingGuestPassPrice}>{isFetchingGuestPassPrice ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}{buttonText}</Button>);
    if (guestPassPriceDetails && !isFetchingGuestPassPrice && guestPassPriceDetails.justification) {
      return (<TooltipProvider><div className="flex flex-col items-start">{button}<Tooltip><TooltipTrigger asChild><span className="mt-2 text-xs text-muted-foreground flex items-center cursor-default"><Info className="h-3 w-3 mr-1" /> {guestPassPriceDetails.justification} (Based on ~{new Intl.NumberFormat('en-GB', { style: 'currency', currency: guestPassPriceDetails.currency }).format(guestPassPriceDetails.coffeePrice)} coffee)</span></TooltipTrigger><TooltipContent align="start" className="max-w-xs"><p>{guestPassPriceDetails.justification} (Avg coffee in London, UK is ~{new Intl.NumberFormat('en-GB', { style: 'currency', currency: guestPassPriceDetails.currency }).format(guestPassPriceDetails.coffeePrice)})</p></TooltipContent></Tooltip></div></TooltipProvider>);
    }
    return button;
  };

  const renderGuestModeAccessUI = () => {
    if (userMode !== 'guest' || !user) return null;
    if (canGuestViewSharedMemories) {
      let passInfo = "";
      if (user.sharedAccessStatus === 'free_pass_active' && user.freePassActivatedDate) passInfo = `Your 6-month free guest pass is active until ${format(addMonths(parseISO(user.freePassActivatedDate), 6), 'PPP')}.`;
      else if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate) passInfo = `Your paid guest pass is active until ${format(parseISO(user.paidPassExpiryDate), 'PPP')}.`;
      return (<Alert variant="default" className="mb-6 bg-green-50 border-green-200"><ShieldCheck className="h-5 w-5 text-green-600" /><AlertTitle className="text-green-700">Access Granted</AlertTitle><AlertDescription className="text-green-600">You can view shared memories. {passInfo}{user.sharedAccessStatus === 'paid_pass_active' && (<div className="mt-2">{renderGuestPurchaseButton()}</div>)}</AlertDescription></Alert>);
    }
    let title = "Access Shared Memories"; let description = "Activate your free pass or purchase a pass to view shared memories."; let actionContent = null;
    if (user.sharedAccessStatus === 'no_pass_initiated') { title = "Welcome!"; description = "Activate your 6-month free guest pass."; actionContent = (<Button onClick={activateFreeGuestPass} className="mt-4 w-full sm:w-auto"><Gift className="mr-2 h-5 w-5" /> Activate Free Guest Pass</Button>); }
    else if (user.sharedAccessStatus === 'free_pass_expired' || user.sharedAccessStatus === 'paid_pass_expired') { title = "Guest Pass Expired"; description = "Purchase a 31-day guest pass."; actionContent = renderGuestPurchaseButton(); }
    return (<Alert variant="destructive" className="mb-6"><ShieldOff className="h-5 w-5" /><AlertTitle>{title}</AlertTitle><AlertDescription>{description}{actionContent}</AlertDescription></Alert>);
  };
  
  let guestAccessPlaceholderMessage = "Activate or purchase a guest pass to view shared memories.";
  if (userMode === 'guest' && !canGuestViewSharedMemories) {
    if (user?.sharedAccessStatus === 'free_pass_expired' || user?.sharedAccessStatus === 'paid_pass_expired') {
      if (isFetchingGuestPassPrice) guestAccessPlaceholderMessage = "Purchase pass (fetching price...) to view.";
      else if (guestPassPriceDetails) guestAccessPlaceholderMessage = `Purchase pass (${new Intl.NumberFormat('en-GB', { style: 'currency', currency: guestPassPriceDetails.currency }).format(guestPassPriceDetails.passPrice)}) to view.`;
      else guestAccessPlaceholderMessage = "Purchase pass to view shared memories.";
    } else if (user?.sharedAccessStatus === 'no_pass_initiated') guestAccessPlaceholderMessage = "Activate your free guest pass to view shared memories.";
  }

  const addMemoryButtonDisabled = userMode === 'host' && !canHostCreateMemories;
  let addMemoryTooltipContent = "Add a new memory to your timeline.";
  if (addMemoryButtonDisabled) {
      if (user?.hostPassStatus === 'no_pass_initiated') addMemoryTooltipContent = "Activate your Free Host Pass in Settings to add memories.";
      else if (user?.hostPassStatus === 'free_host_pass_expired' || user?.hostPassStatus === 'paid_host_pass_expired') addMemoryTooltipContent = "Your Host Pass has expired. Renew in Settings to add memories.";
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
                    {/* The Button component will be the direct child for TooltipTrigger */}
                    <span> {/* Required for Tooltip with disabled button */}
                      <Link href={addMemoryButtonDisabled ? "#" : "/add-memory"} passHref legacyBehavior>
                        <Button disabled={addMemoryButtonDisabled} aria-disabled={addMemoryButtonDisabled} onClick={(e) => { if(addMemoryButtonDisabled) e.preventDefault();}}>
                          <PlusCircle className="mr-2 h-5 w-5" /> Add New Memory
                        </Button>
                      </Link>
                    </span>
                  </TooltipTrigger>
                  {/* TooltipContent always renders, Tooltip controls visibility */}
                  <TooltipContent><p>{addMemoryTooltipContent}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {renderGuestModeAccessUI()}
        <TimelineFilter onSortChange={setSortCriteria} onSearchChange={setSearchTerm} />

        {userMode === 'guest' && !canGuestViewSharedMemories && filteredAndSortedMemories.length === 0 && (<div className="text-center py-12 bg-card shadow-lg rounded-lg p-8"><CalendarClock className="mx-auto h-16 w-16 text-primary mb-6" /><h2 className="font-headline text-3xl mb-3">Activate Guest Access</h2><p className="text-muted-foreground mb-8 max-w-md mx-auto">{guestAccessPlaceholderMessage}</p></div>)}
        {userMode === 'guest' && canGuestViewSharedMemories && filteredAndSortedMemories.length === 0 && (<div className="text-center py-12 bg-card shadow-lg rounded-lg p-8"><Users className="mx-auto h-16 w-16 text-primary mb-6" /><h2 className="font-headline text-3xl mb-3">Nothing Shared Yet</h2><p className="text-muted-foreground mb-8 max-w-md mx-auto">When memories are shared with you, they appear here.</p></div>)}
        {userMode === 'host' && filteredAndSortedMemories.length === 0 && (<div className="text-center py-12 bg-card shadow-lg rounded-lg p-8"><BookHeart className="mx-auto h-16 w-16 text-primary mb-6" /><h2 className="font-headline text-3xl mb-3">Welcome to Memory Weaver!</h2><p className="text-muted-foreground mb-8 max-w-md mx-auto">Record your life’s moments. If you need a Host Pass, check Settings.</p><Link href={addMemoryButtonDisabled ? "/settings" : "/add-memory"} passHref><Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-5 w-5" />{addMemoryButtonDisabled ? "Go to Settings" : "Record First Memory"}</Button></Link></div>)}

        {((userMode === 'host') || (userMode === 'guest' && canGuestViewSharedMemories)) && filteredAndSortedMemories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedMemories.map((memory) => {
              const isUnreadInGuestMode = userMode === 'guest' && user?.viewedSharedMemoryIds ? !user.viewedSharedMemoryIds.includes(memory.id) : false;
              return (<MemoryCard key={memory.id} memory={memory} onEdit={userMode === 'host' ? handleEditMemory : undefined} onDelete={userMode === 'host' ? handleDeleteMemory : undefined} isUnread={userMode === 'guest' ? isUnreadInGuestMode : undefined} onMarkAsViewed={userMode === 'guest' ? markSharedMemoryAsViewed : undefined} userMode={userMode} />);
            })}
          </div>
        )}
      </div>
    </AuthenticatedPageWrapper>
  );
}
