
"use client";

import type { User, UserMode } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { addMonths, addDays, isBefore, parseISO, format } from 'date-fns';
import { mockMemories } from '@/lib/mockData'; // For checking available shared memories
import type { GetPassPriceOutput } from '@/ai/flows/get-pass-price-flow'; // Import for pass price type

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string) => void; // Simplified login
  logout: () => void;
  loading: boolean;
  pendingRequestCount: number;
  setPendingRequestCount: (count: number) => void;
  userMode: UserMode;
  toggleUserMode: () => void;
  setUserMode: (mode: UserMode) => void;
  activateFreePass: () => void;
  purchasePaidPass: () => void;
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
    const potentialSharedMemories = mockMemories.slice(0, 2); // Assuming these are 'shareable'
    if (potentialSharedMemories.length === 0) return false;

    const viewedIds = user.viewedSharedMemoryIds || [];
    const hasUnviewed = potentialSharedMemories.some(mem => !viewedIds.includes(mem.id));
    return hasUnviewed;
  }, [user]);

  const checkAndUpdatePassStatus = useCallback(() => {
    if (!user) return;

    let newStatus = user.sharedAccessStatus;
    const now = new Date();

    if (user.sharedAccessStatus === 'free_pass_active' && user.freePassActivatedDate) {
      const freePassEndDate = addMonths(parseISO(user.freePassActivatedDate), 6);
      if (isBefore(freePassEndDate, now)) {
        newStatus = 'free_pass_expired';
      }
    } else if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate) {
      if (isBefore(parseISO(user.paidPassExpiryDate), now)) {
        newStatus = 'paid_pass_expired';
      }
    }

    if (newStatus !== user.sharedAccessStatus) {
      const updatedUser = { ...user, sharedAccessStatus: newStatus };
      updateUserInStateAndStorage(updatedUser);
    }
  }, [user]);


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
  }, [loading, user, checkAndUpdatePassStatus, pathname, userMode, checkIfGuestHasUnviewedMemories]);

  useEffect(() => {
    const publicPaths = ['/', '/login', '/register'];
    const defaultAuthenticatedHostPath = '/prompts'; // For hosts
    const defaultAuthenticatedGuestPath = '/timeline'; // For guests

    if (!loading) {
      if (isAuthenticated) {
        const targetPath = userMode === 'host' ? defaultAuthenticatedHostPath : defaultAuthenticatedGuestPath;
        // If user is authenticated and on a public page (like /, /login, or /register), redirect them to their appropriate dashboard
        if (publicPaths.includes(pathname)) {
          router.push(targetPath);
        }
      } else {
        // User is NOT authenticated
        // If trying to access a protected path (not in publicPaths), redirect to login
        if (!publicPaths.includes(pathname)) {
          router.push('/login');
        }
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
                };
            }
        } catch (e) {
            console.error("Failed to parse user from localStorage during login", e);
        }
    }

    if (!currentUser) {
        currentUser = { 
            id: Date.now().toString(), 
            email, 
            name: email.split('@')[0],
            sharedAccessStatus: 'no_pass_initiated', 
            viewedSharedMemoryIds: [],
        };
    }
    
    updateUserInStateAndStorage(currentUser);
    setIsAuthenticated(true);
    setUserModeState('host'); 
    // Redirection to the correct default path (/prompts for host) is handled by the useEffect above
  };

  const logout = () => {
    updateUserInStateAndStorage(null);
    setIsAuthenticated(false);
    setPendingRequestCountState(0);
    setHasNewSharedMemoriesState(false);
    setUserModeState('host');
    setPassPriceDetails(null); 
    router.push('/'); // Changed from '/login' to '/'
  };

  const setPendingRequestCount = useCallback((count: number) => {
    setPendingRequestCountState(count);
  }, []);

  const handleModeChange = (newMode: UserMode) => {
    setUserModeState(newMode);
    if (newMode === 'guest') {
        if (user) checkAndUpdatePassStatus();
        setHasNewSharedMemoriesState(false); 
    } else if (newMode === 'host' && user) {
        setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
    }
  };

  const toggleUserMode = useCallback(() => {
    const newMode = userMode === 'host' ? 'guest' : 'host';
    handleModeChange(newMode);
  }, [userMode, handleModeChange]);
  
  const setUserMode = useCallback((mode: UserMode) => {
    if (userMode !== mode) {
        handleModeChange(mode);
    }
  }, [userMode, handleModeChange]);


  const activateFreePass = useCallback(() => {
    if (user && user.sharedAccessStatus === 'no_pass_initiated') {
      const now = new Date();
      const updatedUser: User = {
        ...user,
        sharedAccessStatus: 'free_pass_active',
        freePassActivatedDate: now.toISOString(),
      };
      updateUserInStateAndStorage(updatedUser);
      toast({
        title: "Free Pass Activated!",
        description: `Your 6-month free access to shared memories starts now and will end on ${format(addMonths(now, 6), 'PPP')}.`,
        duration: 7000,
      });
    }
  }, [user]);

  const purchasePaidPass = useCallback(() => {
    if (user) {
      const now = new Date();
      let startDate = now;
      
      if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(now, parseISO(user.paidPassExpiryDate))) {
        startDate = parseISO(user.paidPassExpiryDate);
      }
      
      const newExpiryDate = addDays(startDate, 31);
      const updatedUser: User = {
        ...user,
        sharedAccessStatus: 'paid_pass_active',
        paidPassExpiryDate: newExpiryDate.toISOString(),
      };
      updateUserInStateAndStorage(updatedUser);
      const priceString = passPriceDetails ? `${new Intl.NumberFormat('en-GB', { style: 'currency', currency: passPriceDetails.currency }).format(passPriceDetails.passPrice)}` : '';
      toast({
        title: "Pass Purchased (Mock)!",
        description: `Your 31-day pass ${priceString ? 'for ' + priceString + ' ' : ''}is now active and will end on ${format(newExpiryDate, 'PPP')}.`,
        duration: 7000,
      });
    }
  }, [user, passPriceDetails]);

  const markSharedMemoryAsViewed = useCallback((memoryId: string) => {
    if (user) {
      const currentViewedIds = user.viewedSharedMemoryIds || [];
      if (!currentViewedIds.includes(memoryId)) {
        const updatedUser = {
          ...user,
          viewedSharedMemoryIds: [...currentViewedIds, memoryId],
        };
        updateUserInStateAndStorage(updatedUser);
         if (userMode === 'host') { 
           setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
         }
      }
    }
  }, [user, userMode, checkIfGuestHasUnviewedMemories]);

  const fetchPassPrice = useCallback(async () => {
    if (isFetchingPassPrice || passPriceDetails) return; 

    setIsFetchingPassPrice(true);
    try {
      // Dynamically import the server action
      const { getPassPriceAction } = await import('@/actions/getPassPriceAction');
      const priceData = await getPassPriceAction({ city: 'London', country: 'UK' }); // Example location
      setPassPriceDetails(priceData);
    } catch (error) {
      console.error("Failed to fetch pass price:", error);
      // Set a default/fallback if AI call fails
      setPassPriceDetails({
        passPrice: 7.99, // Default price
        currency: 'GBP', // Default currency
        coffeePrice: 3.50, // Mock coffee price
        justification: 'Enjoy a month of shared memories with our standard access pass.',
      });
    } finally {
      setIsFetchingPassPrice(false);
    }
  }, [isFetchingPassPrice, passPriceDetails]);


  return (
    <AuthContext.Provider value={{ 
        isAuthenticated, 
        user, 
        login, 
        logout, 
        loading, 
        pendingRequestCount, 
        setPendingRequestCount, 
        userMode, 
        toggleUserMode, 
        setUserMode,
        activateFreePass,
        purchasePaidPass,
        checkAndUpdatePassStatus,
        hasNewSharedMemories,
        setHasNewSharedMemories: setHasNewSharedMemoriesState,
        markSharedMemoryAsViewed,
        checkIfGuestHasUnviewedMemories,
        passPriceDetails,
        fetchPassPrice,
        isFetchingPassPrice
    }}>
      {children}
    </AuthContext.Provider>
  );
};
