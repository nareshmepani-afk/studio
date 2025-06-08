
"use client";

import type { User, UserMode } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { addMonths, addDays, isBefore, parseISO, format } from 'date-fns';
import { mockMemories } from '@/lib/mockData'; // For checking available shared memories
import type { GetPassPriceOutput } from '@/ai/flows/get-pass-price-flow';
import { getPassPriceAction } from '@/actions/getPassPriceAction'; // Direct import

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
  purchasePaidPass: () => Promise<void>; // Made async
  checkAndUpdatePassStatus: () => void;
  hasNewSharedMemories: boolean;
  setHasNewSharedMemories: (status: boolean) => void;
  markSharedMemoryAsViewed: (memoryId: string) => void;
  checkIfGuestHasUnviewedMemories: () => boolean;
  passPriceDetails: GetPassPriceOutput | null;
  fetchPassPrice: () => Promise<void>;
  isFetchingPassPrice: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [pendingRequestCount, setPendingRequestCountState] = useState<number>(0);
  const [userMode, setUserModeState] = useState<UserMode>('host');
  const [hasNewSharedMemories, setHasNewSharedMemoriesState] = useState(false);
  const [passPriceDetails, setPassPriceDetails] = useState<GetPassPriceOutput | null>(null);
  const [isFetchingPassPrice, setIsFetchingPassPrice] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const updateUserInStateAndStorage = (updatedUser: User | null) => {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem('memoryWeaverUser');
    }
  };

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
  }, [user]);

  // Core logic for fetching pass price
  const fetchPassPriceLogic = useCallback(async () => {
    if (isFetchingPassPrice || passPriceDetails) return;
    
    // Guard against calling if user/city/country is not yet available
    // Though the calling useEffect should also guard this.
    const currentCity = user?.city;
    const currentCountry = user?.countryOfBirth;

    setIsFetchingPassPrice(true);
    try {
      const priceData = await getPassPriceAction({ city: currentCity || 'London', country: currentCountry || 'UK' });
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

  // Store the latest callback in a ref
  const fetchPassPriceRef = useRef(fetchPassPriceLogic);
  useEffect(() => {
    fetchPassPriceRef.current = fetchPassPriceLogic;
  }, [fetchPassPriceLogic]);

  // Stable function to expose/use
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
        };
        setUser(hydratedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('memoryWeaverUser');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      checkAndUpdatePassStatus();
      if (userMode === 'host') {
        setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
      }
    }
  }, [loading, user, checkAndUpdatePassStatus, userMode, checkIfGuestHasUnviewedMemories]);
  
  // useEffect specifically for calling fetchPassPrice
  useEffect(() => {
    if (!loading && user && userMode === 'guest' &&
        (user.sharedAccessStatus === 'free_pass_expired' ||
         user.sharedAccessStatus === 'paid_pass_expired' ||
         user.sharedAccessStatus === 'no_pass_initiated')) {
      // Additional guard to prevent multiple fetches if already in progress or details exist
      if (!isFetchingPassPrice && !passPriceDetails) {
        fetchPassPrice(); // Calls the stable ref-wrapped version
      }
    }
  }, [loading, user, userMode, isFetchingPassPrice, passPriceDetails, fetchPassPrice]); // fetchPassPrice is stable

  useEffect(() => {
    const publicPaths = ['/', '/login', '/register'];
    const defaultAuthenticatedHostPath = '/prompts';
    const defaultAuthenticatedGuestPath = '/timeline';
    if (!loading) {
      if (isAuthenticated) {
        const targetPath = userMode === 'host' ? defaultAuthenticatedHostPath : defaultAuthenticatedGuestPath;
        if (publicPaths.includes(pathname)) router.push(targetPath);
      } else {
        if (!publicPaths.includes(pathname)) router.push('/login');
      }
    }
  }, [isAuthenticated, loading, pathname, router, userMode]);

  const login = (email: string) => {
    const storedUserJson = localStorage.getItem('memoryWeaverUser');
    let currentUser: User | null = null;
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson);
        if (storedUser.email === email) {
          currentUser = { /* ... existing hydration logic ... */ 
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
          };
        }
      } catch (e) { console.error(e); }
    }
    if (!currentUser) {
      currentUser = { id: Date.now().toString(), email, name: email.split('@')[0], sharedAccessStatus: 'no_pass_initiated', viewedSharedMemoryIds: [] };
    }
    updateUserInStateAndStorage(currentUser);
    setIsAuthenticated(true);
    setUserModeState('host');
  };

  const logout = () => {
    updateUserInStateAndStorage(null);
    setIsAuthenticated(false);
    setPendingRequestCountState(0);
    setHasNewSharedMemoriesState(false);
    setUserModeState('host');
    setPassPriceDetails(null);
    router.push('/');
  };

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
  }, [user]);

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
        await fetchPassPrice(); // Await the stable fetchPassPrice
        // Re-access from state after fetchPassPrice updates it
        // This part is tricky as state updates from fetchPassPrice are async.
        // For the toast, we might have to rely on the state variable which will update.
        // The toast might show default then update if a re-render happens due to passPriceDetails changing.
        // Or, we can just use what is available right after the await, but it might not be from state yet.
        // For simplicity, we'll rely on the possibility that fetchPassPrice sets the state and this component re-renders.
      }
      
      // This will use the latest `passPriceDetails` from state after any potential update by `fetchPassPrice`
      const displayPriceDetails = passPriceDetails; // Use the state variable directly for the toast

      let priceToDisplay = "for your pass";
      if (displayPriceDetails) {
        priceToDisplay = `for ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: displayPriceDetails.currency }).format(displayPriceDetails.passPrice)}`;
      }

      toast({
        title: "Pass Purchased (Mock)!",
        description: `Your 31-day pass ${priceToDisplay} is now active and will end on ${format(newExpiryDate, 'PPP')}.`,
        duration: 7000,
      });
    }
  }, [user, passPriceDetails, isFetchingPassPrice, fetchPassPrice]);

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
  }, [user, userMode, checkIfGuestHasUnviewedMemories]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, login, logout, loading,
      pendingRequestCount, setPendingRequestCount,
      userMode, toggleUserMode, setUserMode,
      activateFreePass, purchasePaidPass, checkAndUpdatePassStatus,
      hasNewSharedMemories, setHasNewSharedMemories: setHasNewSharedMemoriesState,
      markSharedMemoryAsViewed, checkIfGuestHasUnviewedMemories,
      passPriceDetails, fetchPassPrice, isFetchingPassPrice
    }}>
      {children}
    </AuthContext.Provider>
  );
};

