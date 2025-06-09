
"use client";

import type { User, UserMode, Memory as MemoryType } from '@/types'; // Added MemoryType
import { FREE_TIER_STORAGE_QUOTA_BYTES } from '@/types'; // Import quota
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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // New state for logout process
  const [pendingRequestCount, setPendingRequestCountState] = useState<number>(0);
  const [userMode, setUserModeState] = useState<UserMode>('host');
  const [hasNewSharedMemories, setHasNewSharedMemoriesState] = useState(false);
  const [passPriceDetails, setPassPriceDetails] = useState<GetPassPriceOutput | null>(null);
  const [isFetchingPassPrice, setIsFetchingPassPrice] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const updateUserInStateAndStorage = useCallback((updatedUser: User | null) => {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem('memoryWeaverUser');
    }
  }, []);

  const calculateAndUpdateStorageUsage = useCallback(async (userId: string) => {
    const storedMemoriesJson = localStorage.getItem('mockMemories');
    let userMemories: MemoryType[] = [];
    if (storedMemoriesJson) {
      try {
        userMemories = JSON.parse(storedMemoriesJson).filter((mem: MemoryType) => mem.userId === userId);
      } catch (e) {
        console.error("Error parsing memories for storage calculation:", e);
        userMemories = mockMemories.filter(mem => mem.userId === userId); // Fallback to initial mock
      }
    } else {
      userMemories = mockMemories.filter(mem => mem.userId === userId); // Fallback to initial mock
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
        const updatedUser = { ...prevUser, storageUsedBytes: usedBytes };
        localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser)); // Also update storage
        return updatedUser;
      }
      return prevUser;
    });
  }, []);

  const checkIfGuestHasUnviewedMemories = useCallback(() => {
    if (!user) return false;
    const potentialSharedMemories = mockMemories.slice(0, 2);
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
      const priceData = await getPassPriceAction({ city: user?.city || 'London', country: user?.countryOfBirth || 'UK' });
      setPassPriceDetails(priceData);
    } catch (error) {
      console.error("Failed to fetch pass price:", error);
      setPassPriceDetails({
        passPrice: 7.99,
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
        const storedUser = JSON.parse(storedUserJson);
        const hydratedUser: User = {
          id: storedUser.id || '1',
          email: storedUser.email,
          name: storedUser.name,
          profileInfo: storedUser.profileInfo,
          avatarUrl: storedUser.avatarUrl,
          dateOfBirth: storedUser.dateOfBirth,
          countryOfBirth: storedUser.countryOfBirth,
          city: storedUser.city,
          townArea: storedUser.townArea,
          sharedAccessStatus: storedUser.sharedAccessStatus || 'no_pass_initiated',
          freePassActivatedDate: storedUser.freePassActivatedDate,
          paidPassExpiryDate: storedUser.paidPassExpiryDate,
          viewedSharedMemoryIds: storedUser.viewedSharedMemoryIds || [],
          storageUsedBytes: storedUser.storageUsedBytes || 0,
        };
        setUser(hydratedUser);
        setIsAuthenticated(true);
        // Initial calculation of storage after loading user
        if (hydratedUser.id) {
           calculateAndUpdateStorageUsage(hydratedUser.id);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('memoryWeaverUser');
      }
    }
    setLoading(false);
  }, [calculateAndUpdateStorageUsage]);

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
  }, [loading, user, checkAndUpdatePassStatus, userMode, checkIfGuestHasUnviewedMemories, fetchPassPrice, isFetchingPassPrice, passPriceDetails]);
  
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
    let currentUser: User | null = null;
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson);
        if (storedUser.email === email) {
          currentUser = { 
            id: storedUser.id || Date.now().toString(),
            email: storedUser.email,
            name: storedUser.name,
            profileInfo: storedUser.profileInfo,
            avatarUrl: storedUser.avatarUrl,
            dateOfBirth: storedUser.dateOfBirth,
            countryOfBirth: storedUser.countryOfBirth,
            city: storedUser.city,
            townArea: storedUser.townArea,
            sharedAccessStatus: storedUser.sharedAccessStatus || 'no_pass_initiated',
            freePassActivatedDate: storedUser.freePassActivatedDate,
            paidPassExpiryDate: storedUser.paidPassExpiryDate,
            viewedSharedMemoryIds: storedUser.viewedSharedMemoryIds || [],
            storageUsedBytes: storedUser.storageUsedBytes || 0,
          };
        }
      } catch (e) { console.error(e); }
    }
    if (!currentUser) {
      currentUser = { 
        id: Date.now().toString(), 
        email, 
        name: email.split('@')[0], 
        sharedAccessStatus: 'no_pass_initiated', 
        viewedSharedMemoryIds: [],
        storageUsedBytes: 0,
      };
    }
    updateUserInStateAndStorage(currentUser);
    setIsAuthenticated(true);
    setUserModeState('host');
    setIsLoggingOut(false);
    if (currentUser.id) {
      await calculateAndUpdateStorageUsage(currentUser.id);
    }
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
      if (user) checkAndUpdatePassStatus();
      setHasNewSharedMemoriesState(false);
    } else if (newMode === 'host' && user) {
      setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
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
      
      if (!passPriceDetails && !isFetchingPassPrice) {
        await fetchPassPrice(); 
      }
      
      const currentPassPriceDetails = passPriceDetails || await (async () => {
          const price = await getPassPriceAction({ city: user?.city || 'London', country: user?.countryOfBirth || 'UK' });
          setPassPriceDetails(price);
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
        if (userMode === 'host') {
          setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
        }
      }
    }
  }, [user, userMode, checkIfGuestHasUnviewedMemories, updateUserInStateAndStorage]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, login, logout, loading,
      pendingRequestCount, setPendingRequestCount,
      userMode, toggleUserMode, setUserMode,
      activateFreePass, purchasePaidPass, checkAndUpdatePassStatus,
      hasNewSharedMemories, setHasNewSharedMemories: setHasNewSharedMemoriesState,
      markSharedMemoryAsViewed, checkIfGuestHasUnviewedMemories,
      passPriceDetails, fetchPassPrice, isFetchingPassPrice,
      storageQuotaBytes: FREE_TIER_STORAGE_QUOTA_BYTES,
      calculateAndUpdateStorageUsage
    }}>
      {children}
    </AuthContext.Provider>
  );
};
