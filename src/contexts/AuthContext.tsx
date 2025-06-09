
"use client";

import type { User, UserMode, Memory as MemoryType, HostPlan } from '@/types';
import { FREE_TIER_STORAGE_QUOTA_BYTES, PREMIUM_TIER_STORAGE_QUOTA_BYTES } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { addMonths, addDays, isBefore, parseISO, format } from 'date-fns';
import { mockMemories } from '@/lib/mockData';
import type { GetPassPriceOutput } from '@/ai/flows/get-pass-price-flow';
import { getPassPriceAction } from '@/actions/getPassPriceAction';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  loading: boolean;
  pendingRequestCount: number;
  setPendingRequestCount: (count: number) => void;
  userMode: UserMode;
  toggleUserMode: () => void;
  setUserMode: (mode: UserMode) => void;
  activateFreePass: () => void;
  purchasePaidPass: () => Promise<void>;
  checkAndUpdatePassStatus: () => void;
  hasNewSharedMemories: boolean;
  setHasNewSharedMemories: (status: boolean) => void;
  markSharedMemoryAsViewed: (memoryId: string) => void;
  checkIfGuestHasUnviewedMemories: () => boolean;
  passPriceDetails: GetPassPriceOutput | null;
  fetchPassPrice: () => Promise<void>;
  isFetchingPassPrice: boolean;
  storageQuotaBytes: number;
  calculateAndUpdateStorageUsage: (userId: string) => Promise<void>;
  upgradeToPremium: () => void;
  downgradeToFree: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingRequestCount, setPendingRequestCountState] = useState<number>(0);
  const [userMode, setUserModeState] = useState<UserMode>('host');
  const [hasNewSharedMemories, setHasNewSharedMemoriesState] = useState(false);
  const [passPriceDetails, setPassPriceDetails] = useState<GetPassPriceOutput | null>(null);
  const [isFetchingPassPrice, setIsFetchingPassPrice] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const updateUserInStateAndStorage = useCallback((updatedUserArg: User | null) => {
    setUser(prevUser => {
      // Prevent re-setting state if the object is effectively the same
      // This is a shallow compare, for deeper changes, ensure updatedUserArg is only passed when necessary
      if (JSON.stringify(prevUser) !== JSON.stringify(updatedUserArg)) {
          if (updatedUserArg) {
            localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUserArg));
          } else {
            localStorage.removeItem('memoryWeaverUser');
          }
          return updatedUserArg;
      }
      return prevUser;
    });
  }, []);

  const calculateAndUpdateStorageUsage = useCallback(async (userId: string) => {
    const storedMemoriesJson = localStorage.getItem('mockMemories');
    let userMemories: MemoryType[] = [];
    if (storedMemoriesJson) {
      try {
        userMemories = JSON.parse(storedMemoriesJson).filter((mem: MemoryType) => mem.userId === userId);
      } catch (e) {
        console.error("Error parsing memories for storage calculation:", e);
        userMemories = mockMemories.filter(mem => mem.userId === userId); // Fallback to initial mock data on parse error
      }
    } else {
      userMemories = mockMemories.filter(mem => mem.userId === userId);
    }

    const usedBytes = userMemories.reduce((acc, memory) => {
      if (memory.mediaAttachments) {
        memory.mediaAttachments.forEach(attachment => {
          if (attachment.size && typeof attachment.size === 'number') {
            acc += attachment.size;
          }
        });
      }
      return acc;
    }, 0);

    setUser(prevUser => {
      if (prevUser && prevUser.id === userId) {
        if (prevUser.storageUsedBytes !== usedBytes) { // Only update if different
          const updatedUser = { ...prevUser, storageUsedBytes: usedBytes };
          localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
          return updatedUser;
        }
      }
      return prevUser; // Return previous user reference if no change
    });
  }, []);


  const checkIfGuestHasUnviewedMemories = useCallback(() => {
    if (!user) return false;
    const potentialSharedMemories = mockMemories.slice(0, 2); // Assuming these are the shared ones for guests
    if (potentialSharedMemories.length === 0) return false;
    const viewedIds = user.viewedSharedMemoryIds || [];
    return potentialSharedMemories.some(mem => !viewedIds.includes(mem.id));
  }, [user]);

  const checkAndUpdatePassStatus = useCallback(() => {
    if (!user) return;
    let newStatus = user.sharedAccessStatus;
    const now = new Date();
    if (user.sharedAccessStatus === 'free_pass_active' && user.freePassActivatedDate) {
      const freePassEndDate = addMonths(parseISO(user.freePassActivatedDate), 6);
      if (isBefore(freePassEndDate, now)) newStatus = 'free_pass_expired';
    } else if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate) {
      if (isBefore(parseISO(user.paidPassExpiryDate), now)) newStatus = 'paid_pass_expired';
    }
    if (newStatus !== user.sharedAccessStatus) {
      const updatedUser = { ...user, sharedAccessStatus: newStatus };
      updateUserInStateAndStorage(updatedUser);
    }
  }, [user, updateUserInStateAndStorage]);

  const fetchPassPriceLogic = useCallback(async () => {
    if (isFetchingPassPrice || passPriceDetails) return;
    
    setIsFetchingPassPrice(true);
    try {
      const cityForPrice = user?.city || 'London';
      const countryForPrice = user?.countryOfBirth || 'UK';
      const priceData = await getPassPriceAction({ city: cityForPrice, country: countryForPrice });
      setPassPriceDetails(priceData);
    } catch (error) {
      console.error("Failed to fetch pass price:", error);
      setPassPriceDetails({
        passPrice: 7.99, // Fallback
        currency: 'GBP',
        coffeePrice: 3.50,
        justification: 'Enjoy a month of shared memories with our standard access pass.',
      });
    } finally {
      setIsFetchingPassPrice(false);
    }
  }, [isFetchingPassPrice, passPriceDetails, user?.city, user?.countryOfBirth]);

  const fetchPassPriceRef = useRef(fetchPassPriceLogic);
  useEffect(() => {
    fetchPassPriceRef.current = fetchPassPriceLogic;
  }, [fetchPassPriceLogic]);

  const fetchPassPrice = useCallback(async () => {
    return fetchPassPriceRef.current();
  }, []);

  useEffect(() => {
    const storedUserJson = localStorage.getItem('memoryWeaverUser');
    if (storedUserJson) {
      try {
        const storedUserData = JSON.parse(storedUserJson);
        
        let initialStorageUsedBytes = storedUserData.storageUsedBytes || 0;
        if (storedUserData.id) {
            const memoriesForCalc = localStorage.getItem('mockMemories');
            let userMems: MemoryType[] = [];
            if (memoriesForCalc) {
                try { userMems = JSON.parse(memoriesForCalc).filter((mem: MemoryType) => mem.userId === storedUserData.id); } catch(e){}
            } else { // Fallback to initial mock data if localStorage is empty or corrupted
                userMems = mockMemories.filter(mem => mem.userId === storedUserData.id);
            }
            initialStorageUsedBytes = userMems.reduce((acc, memory) => {
                if (memory.mediaAttachments) {
                    memory.mediaAttachments.forEach(attachment => {
                        if (attachment.size && typeof attachment.size === 'number') acc += attachment.size;
                    });
                }
                return acc;
            }, 0);
        }

        const hydratedUser: User = {
          id: storedUserData.id || '1', // Default ID if not present
          email: storedUserData.email,
          name: storedUserData.name,
          profileInfo: storedUserData.profileInfo,
          avatarUrl: storedUserData.avatarUrl,
          dateOfBirth: storedUserData.dateOfBirth,
          countryOfBirth: storedUserData.countryOfBirth,
          city: storedUserData.city,
          townArea: storedUserData.townArea,
          sharedAccessStatus: storedUserData.sharedAccessStatus || 'no_pass_initiated',
          freePassActivatedDate: storedUserData.freePassActivatedDate,
          paidPassExpiryDate: storedUserData.paidPassExpiryDate,
          viewedSharedMemoryIds: storedUserData.viewedSharedMemoryIds || [],
          storageUsedBytes: initialStorageUsedBytes,
          hostPlan: storedUserData.hostPlan || 'free',
        };
        setUser(hydratedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('memoryWeaverUser');
      }
    }
    setLoading(false);
  }, []); // Empty dependency array: runs only on mount

  useEffect(() => {
    if (!loading && user) {
      checkAndUpdatePassStatus();
      if (userMode === 'host') {
        setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
      }
      if (userMode === 'guest' && 
          (user.sharedAccessStatus === 'free_pass_expired' || 
           user.sharedAccessStatus === 'paid_pass_expired' || 
           user.sharedAccessStatus === 'no_pass_initiated')) {
        if (!isFetchingPassPrice && !passPriceDetails) {
          fetchPassPrice();
        }
      }
    }
  }, [loading, user, userMode, checkIfGuestHasUnviewedMemories, fetchPassPrice, isFetchingPassPrice, passPriceDetails, checkAndUpdatePassStatus]);
  // Added checkAndUpdatePassStatus here as it depends on user and its result might affect other logic.
  
  useEffect(() => {
    if (isLoggingOut && pathname === '/') {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, pathname]);

  useEffect(() => {
    if (loading || isLoggingOut) return; 

    const publicPaths = ['/', '/login', '/register'];
    const defaultAuthenticatedHostPath = '/prompts';
    const defaultAuthenticatedGuestPath = '/timeline';

    if (isAuthenticated) {
      if (publicPaths.includes(pathname)) { 
        const targetPath = userMode === 'host' ? defaultAuthenticatedHostPath : defaultAuthenticatedGuestPath;
        router.push(targetPath);
      }
    } else {
      if (!publicPaths.includes(pathname)) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, pathname, router, userMode, isLoggingOut]);

  const login = async (email: string) => {
    const storedUserJson = localStorage.getItem('memoryWeaverUser');
    let currentUserData: Partial<User> = {};
    if (storedUserJson) {
      try {
        const parsedUser = JSON.parse(storedUserJson);
        if (parsedUser.email === email) {
          currentUserData = parsedUser;
        }
      } catch (e) { console.error(e); }
    }
    
    const userIdForLogin = currentUserData.id || Date.now().toString();
    const finalUser: User = { 
      id: userIdForLogin,
      email, 
      name: currentUserData.name || email.split('@')[0],
      profileInfo: currentUserData.profileInfo,
      avatarUrl: currentUserData.avatarUrl,
      dateOfBirth: currentUserData.dateOfBirth,
      countryOfBirth: currentUserData.countryOfBirth,
      city: currentUserData.city,
      townArea: currentUserData.townArea,
      sharedAccessStatus: currentUserData.sharedAccessStatus || 'no_pass_initiated', 
      freePassActivatedDate: currentUserData.freePassActivatedDate,
      paidPassExpiryDate: currentUserData.paidPassExpiryDate,
      viewedSharedMemoryIds: currentUserData.viewedSharedMemoryIds || [],
      storageUsedBytes: currentUserData.storageUsedBytes || 0, // Will be recalculated
      hostPlan: currentUserData.hostPlan || 'free',
    };
    
    updateUserInStateAndStorage(finalUser); // This sets user state
    setIsAuthenticated(true);
    setUserModeState('host');
    setIsLoggingOut(false);
    await calculateAndUpdateStorageUsage(finalUser.id); // Recalculate and set storage
  };

  const logout = useCallback(() => {
    setIsLoggingOut(true);
    updateUserInStateAndStorage(null);
    setIsAuthenticated(false);
    setPendingRequestCountState(0);
    setHasNewSharedMemoriesState(false);
    setUserModeState('host');
    setPassPriceDetails(null);
    router.push('/'); 
  }, [router, updateUserInStateAndStorage]);

  const setPendingRequestCount = useCallback((count: number) => {
    setPendingRequestCountState(count);
  }, []);

  const handleModeChange = useCallback((newMode: UserMode) => {
    setUserModeState(newMode);
    if (newMode === 'guest') {
      if (user) checkAndUpdatePassStatus(); // Ensure pass status is current for guest
      setHasNewSharedMemoriesState(false); // Clear host-specific notification
    } else if (newMode === 'host' && user) {
      setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories()); // Update for host
    }
  }, [user, checkAndUpdatePassStatus, checkIfGuestHasUnviewedMemories]);

  const toggleUserMode = useCallback(() => {
    const newMode = userMode === 'host' ? 'guest' : 'host';
    handleModeChange(newMode);
  }, [userMode, handleModeChange]);

  const setUserMode = useCallback((mode: UserMode) => {
    if (userMode !== mode) handleModeChange(mode);
  }, [userMode, handleModeChange]);

  const activateFreePass = useCallback(() => {
    if (user && user.sharedAccessStatus === 'no_pass_initiated') {
      const now = new Date();
      const updatedUser: User = { ...user, sharedAccessStatus: 'free_pass_active', freePassActivatedDate: now.toISOString() };
      updateUserInStateAndStorage(updatedUser);
      toast({ title: "Free Pass Activated!", description: `Your 6-month free access to shared memories starts now and will end on ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000 });
    }
  }, [user, updateUserInStateAndStorage]);

  const purchasePaidPass = useCallback(async () => {
    if (user) {
      const now = new Date();
      let startDate = now;
      if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(now, parseISO(user.paidPassExpiryDate))) {
        startDate = parseISO(user.paidPassExpiryDate);
      }
      const newExpiryDate = addDays(startDate, 31);
      const updatedUser: User = { ...user, sharedAccessStatus: 'paid_pass_active', paidPassExpiryDate: newExpiryDate.toISOString() };
      updateUserInStateAndStorage(updatedUser);
      
      let currentPassPriceDetails = passPriceDetails;
      if (!currentPassPriceDetails && !isFetchingPassPrice) {
         await fetchPassPrice(); // This will update passPriceDetails state
         // Need to get the updated value. Since fetchPassPrice is async and updates state,
         // we might need to re-fetch or use a local variable if passPriceDetails isn't updated yet.
         // For this mock, we will assume fetchPassPrice updates it in time or rely on the next render.
         // A more robust way would be for fetchPassPrice to return the details.
      }
       // Re-access from state after potential update by fetchPassPrice
      currentPassPriceDetails = passPriceDetails || await (async () => {
          const price = await getPassPriceAction({ city: user?.city || 'London', country: user?.countryOfBirth || 'UK' });
          setPassPriceDetails(price); // Ensure state is updated
          return price;
      })();


      let priceToDisplay = "for your pass";
      if (currentPassPriceDetails) {
        priceToDisplay = `for ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: currentPassPriceDetails.currency }).format(currentPassPriceDetails.passPrice)}`;
      }

      toast({
        title: "Pass Purchased (Mock)!",
        description: `Your 31-day pass ${priceToDisplay} is now active and will end on ${format(newExpiryDate, 'PPP')}.`,
        duration: 7000,
      });
    }
  }, [user, passPriceDetails, isFetchingPassPrice, fetchPassPrice, updateUserInStateAndStorage]);

  const markSharedMemoryAsViewed = useCallback((memoryId: string) => {
    if (user) {
      const currentViewedIds = user.viewedSharedMemoryIds || [];
      if (!currentViewedIds.includes(memoryId)) {
        const updatedUser = { ...user, viewedSharedMemoryIds: [...currentViewedIds, memoryId] };
        updateUserInStateAndStorage(updatedUser);
        if (userMode === 'host') { // Also update if host is viewing as guest then switches back
          setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
        }
      }
    }
  }, [user, userMode, checkIfGuestHasUnviewedMemories, updateUserInStateAndStorage]);

  const getStorageQuotaBytes = useCallback((): number => {
    if (user?.hostPlan === 'premium') {
      return PREMIUM_TIER_STORAGE_QUOTA_BYTES;
    }
    return FREE_TIER_STORAGE_QUOTA_BYTES;
  }, [user?.hostPlan]);

  const upgradeToPremium = useCallback(() => {
    if (user && user.hostPlan === 'free') {
      const updatedUser = { ...user, hostPlan: 'premium' as HostPlan };
      updateUserInStateAndStorage(updatedUser);
      toast({ title: "Upgraded to Premium!", description: "You now have access to premium features and increased storage." });
    }
  }, [user, updateUserInStateAndStorage]);

  const downgradeToFree = useCallback(() => {
    if (user && user.hostPlan === 'premium') {
      const updatedUser = { ...user, hostPlan: 'free' as HostPlan };
      updateUserInStateAndStorage(updatedUser);
      toast({ title: "Downgraded to Free Plan", description: "Your plan has been changed to Free." });
    }
  }, [user, updateUserInStateAndStorage]);


  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, login, logout, loading,
      pendingRequestCount, setPendingRequestCount,
      userMode, toggleUserMode, setUserMode,
      activateFreePass, purchasePaidPass, checkAndUpdatePassStatus,
      hasNewSharedMemories, setHasNewSharedMemories: setHasNewSharedMemoriesState,
      markSharedMemoryAsViewed, checkIfGuestHasUnviewedMemories,
      passPriceDetails, fetchPassPrice, isFetchingPassPrice,
      storageQuotaBytes: getStorageQuotaBytes(),
      calculateAndUpdateStorageUsage,
      upgradeToPremium,
      downgradeToFree
    }}>
      {children}
    </AuthContext.Provider>
  );
};

    