
"use client";

import type { User, UserMode, Memory as MemoryType } from '@/types';
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from '@/types'; 
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { addMonths, addDays, isBefore, parseISO, format } from 'date-fns';
import { mockMemories } from '@/lib/mockData';
import type { GetPassPriceOutput as GetGuestPassPriceOutput } from '@/ai/flows/get-pass-price-flow';
import { getPassPriceAction as getGuestPassPriceAction } from '@/actions/getPassPriceAction';
import type { GetHostPassPriceOutput } from '@/ai/flows/get-host-pass-price-flow';
import { getHostPassPriceAction } from '@/actions/getHostPassPriceAction';

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

  // Guest Pass related
  activateFreeGuestPass: () => void;
  purchasePaidGuestPass: () => Promise<void>;
  checkAndUpdateGuestPassStatus: () => void;
  hasNewSharedMemories: boolean;
  setHasNewSharedMemories: (status: boolean) => void;
  markSharedMemoryAsViewed: (memoryId: string) => void;
  checkIfGuestHasUnviewedMemories: () => boolean;
  guestPassPriceDetails: GetGuestPassPriceOutput | null;
  fetchGuestPassPrice: () => Promise<void>;
  isFetchingGuestPassPrice: boolean;

  // Host Pass related
  activateFreeHostPass: () => void;
  purchasePaidHostPass: () => Promise<void>;
  checkAndUpdateHostPassStatus: () => void;
  hostPassPriceDetails: GetHostPassPriceOutput | null;
  fetchHostPassPrice: () => Promise<void>;
  isFetchingHostPassPrice: boolean;
  resetHostPassForTesting: () => void; // New function for testing

  // Storage related
  storageQuotaBytes: number;
  calculateAndUpdateStorageUsage: (userId: string) => Promise<void>;
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

  const [guestPassPriceDetails, setGuestPassPriceDetails] = useState<GetGuestPassPriceOutput | null>(null);
  const [isFetchingGuestPassPrice, setIsFetchingGuestPassPrice] = useState(false);

  const [hostPassPriceDetails, setHostPassPriceDetails] = useState<GetHostPassPriceOutput | null>(null);
  const [isFetchingHostPassPrice, setIsFetchingHostPassPrice] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const updateUserInStateAndStorage = useCallback((updatedUserArg: User | null) => {
    setUser(prevUser => {
      // Only update if the user object has actually changed.
      // A simple JSON.stringify comparison might be too naive for complex objects if order matters,
      // but for this user object, it's generally okay. A deep equality check would be more robust.
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
        userMemories = mockMemories.filter(mem => mem.userId === userId); // Fallback to mock if parse fails
      }
    } else {
      userMemories = mockMemories.filter(mem => mem.userId === userId); // Fallback to mock if not in localStorage
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
        if (prevUser.storageUsedBytes !== usedBytes) {
          const updatedUser = { ...prevUser, storageUsedBytes: usedBytes };
          localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
          return updatedUser;
        }
      }
      return prevUser;
    });
  }, []);


  const checkIfGuestHasUnviewedMemories = useCallback(() => {
    if (!user) return false;
    const potentialSharedMemories = mockMemories.slice(0, 2); // Using the same logic as Timeline for guest's shared view
    if (potentialSharedMemories.length === 0) return false;
    const viewedIds = user.viewedSharedMemoryIds || [];
    return potentialSharedMemories.some(mem => !viewedIds.includes(mem.id));
  }, [user]);

  const checkAndUpdateGuestPassStatus = useCallback(() => {
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
    // Only update if status changed
    if (newStatus !== user.sharedAccessStatus) {
      const updatedUser = { ...user, sharedAccessStatus: newStatus };
      updateUserInStateAndStorage(updatedUser);
    }
  }, [user, updateUserInStateAndStorage]);
  
  const checkAndUpdateHostPassStatus = useCallback(() => {
    if (!user) return;
    let newStatus = user.hostPassStatus;
    const now = new Date();

    if (user.hostPassStatus === 'free_host_pass_active' && user.freeHostPassActivatedDate) {
      const freeHostPassEndDate = addMonths(parseISO(user.freeHostPassActivatedDate), 6); 
      if (isBefore(freeHostPassEndDate, now)) {
        newStatus = 'free_host_pass_expired';
      }
    } else if (user.hostPassStatus === 'paid_host_pass_active' && user.paidHostPassExpiryDate) {
      if (isBefore(parseISO(user.paidHostPassExpiryDate), now)) {
        newStatus = 'paid_host_pass_expired';
      }
    }
    if (newStatus !== user.hostPassStatus) {
      const updatedUser = { ...user, hostPassStatus: newStatus };
      updateUserInStateAndStorage(updatedUser);
    }
  }, [user, updateUserInStateAndStorage]);


  const fetchGuestPassPriceLogic = useCallback(async () => {
    if (isFetchingGuestPassPrice || guestPassPriceDetails) return; // Prevent multiple fetches
    setIsFetchingGuestPassPrice(true);
    try {
      // Use user's city/country if available, otherwise default.
      const cityForPrice = user?.city || 'London';
      const countryForPrice = user?.countryOfBirth || 'UK'; // Assuming countryOfBirth might imply current country for pricing
      const priceData = await getGuestPassPriceAction({ city: cityForPrice, country: countryForPrice });
      setGuestPassPriceDetails(priceData);
    } catch (error) {
      console.error("Failed to fetch guest pass price:", error);
      // Fallback price if AI call fails
      setGuestPassPriceDetails({
        passPrice: 7.99, // Default fallback price
        currency: 'GBP', // Default fallback currency
        coffeePrice: 3.50, // Mock coffee price
        justification: 'Enjoy a month of shared memories with our standard access pass.',
      });
    } finally {
      setIsFetchingGuestPassPrice(false);
    }
  }, [isFetchingGuestPassPrice, guestPassPriceDetails, user?.city, user?.countryOfBirth]);

  const fetchGuestPassPriceRef = useRef(fetchGuestPassPriceLogic);
  useEffect(() => { fetchGuestPassPriceRef.current = fetchGuestPassPriceLogic; }, [fetchGuestPassPriceLogic]);
  const fetchGuestPassPrice = useCallback(async () => fetchGuestPassPriceRef.current(), []);
  
  const fetchHostPassPriceLogic = useCallback(async () => {
    if (isFetchingHostPassPrice || hostPassPriceDetails) return; 
    setIsFetchingHostPassPrice(true);
    try {
      const cityForPrice = user?.city || 'London';
      const countryForPrice = user?.countryOfBirth || 'UK';
      const priceData = await getHostPassPriceAction({ city: cityForPrice, country: countryForPrice });
      setHostPassPriceDetails(priceData);
    } catch (error) {
      console.error("Failed to fetch host pass price:", error);
      setHostPassPriceDetails({
        passPrice: 12.99, 
        currency: 'GBP', 
        coffeePrice: 3.50, 
        justification: 'Unlock a full month of memory creation tools and preserve your precious moments.',
      });
    } finally {
      setIsFetchingHostPassPrice(false);
    }
  }, [isFetchingHostPassPrice, hostPassPriceDetails, user?.city, user?.countryOfBirth]);

  const fetchHostPassPriceRef = useRef(fetchHostPassPriceLogic);
  useEffect(() => { fetchHostPassPriceRef.current = fetchHostPassPriceLogic; }, [fetchHostPassPriceLogic]);
  const fetchHostPassPrice = useCallback(async () => fetchHostPassPriceRef.current(), []);


  useEffect(() => {
    const storedUserJson = localStorage.getItem('memoryWeaverUser');
    if (storedUserJson) {
      try {
        const storedUserData = JSON.parse(storedUserJson);
        // Calculate initial storage used for this user from localStorage memories
        let initialStorageUsedBytes = 0;
        if (storedUserData.id) {
            const memoriesForCalcJson = localStorage.getItem('mockMemories');
            let userMems: MemoryType[] = [];
            if (memoriesForCalcJson) {
                try { userMems = JSON.parse(memoriesForCalcJson).filter((mem: MemoryType) => mem.userId === storedUserData.id); }
                catch(e) { console.error("Error parsing mockMemories for initial calculation:", e); userMems = mockMemories.filter(mem => mem.userId === storedUserData.id); }
            } else {
                userMems = mockMemories.filter(mem => mem.userId === storedUserData.id);
            }
            initialStorageUsedBytes = userMems.reduce((acc, memory) => {
                if (memory.mediaAttachments) {
                    memory.mediaAttachments.forEach(attachment => { if (attachment.size && typeof attachment.size === 'number') acc += attachment.size; });
                }
                return acc;
            }, 0);
        }

        const hydratedUser: User = {
          id: storedUserData.id || '1', // Default ID if missing
          email: storedUserData.email,
          name: storedUserData.name,
          profileInfo: storedUserData.profileInfo,
          avatarUrl: storedUserData.avatarUrl,
          dateOfBirth: storedUserData.dateOfBirth,
          countryOfBirth: storedUserData.countryOfBirth,
          city: storedUserData.city,
          townArea: storedUserData.townArea,
          // Guest Pass
          sharedAccessStatus: storedUserData.sharedAccessStatus || 'no_pass_initiated',
          freePassActivatedDate: storedUserData.freePassActivatedDate,
          paidPassExpiryDate: storedUserData.paidPassExpiryDate,
          viewedSharedMemoryIds: storedUserData.viewedSharedMemoryIds || [],
          // Host Pass
          hostPassStatus: storedUserData.hostPassStatus || 'no_pass_initiated',
          freeHostPassActivatedDate: storedUserData.freeHostPassActivatedDate,
          paidHostPassExpiryDate: storedUserData.paidHostPassExpiryDate,
          storageUsedBytes: initialStorageUsedBytes, // Set calculated initial storage
        };
        setUser(hydratedUser); // Set the user state
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('memoryWeaverUser'); // Clear corrupted data
      }
    }
    setLoading(false);
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    if (!loading && user) {
      checkAndUpdateGuestPassStatus();
      checkAndUpdateHostPassStatus();
      if (userMode === 'host') {
        setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
        if (user.hostPassStatus === 'free_host_pass_expired' ||
            user.hostPassStatus === 'paid_host_pass_expired' ||
            user.hostPassStatus === 'no_pass_initiated') {
          if (!isFetchingHostPassPrice && !hostPassPriceDetails) fetchHostPassPrice();
        }
      } else if (userMode === 'guest') {
         if (user.sharedAccessStatus === 'free_pass_expired' ||
             user.sharedAccessStatus === 'paid_pass_expired' ||
             user.sharedAccessStatus === 'no_pass_initiated') {
           if (!isFetchingGuestPassPrice && !guestPassPriceDetails) fetchGuestPassPrice();
         }
      }
    }
  }, [loading, user, userMode, checkIfGuestHasUnviewedMemories, fetchGuestPassPrice, isFetchingGuestPassPrice, guestPassPriceDetails, checkAndUpdateGuestPassStatus,
      fetchHostPassPrice, isFetchingHostPassPrice, hostPassPriceDetails, checkAndUpdateHostPassStatus]);

  useEffect(() => {
    // This effect handles redirection based on auth state and current path
    if (loading || isLoggingOut) return; // Don't redirect while loading or logging out

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

  // Effect to reset isLoggingOut if user navigates back to a public page after logout
  useEffect(() => {
    if (isLoggingOut && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, pathname]);

  const login = async (email: string) => {
    const storedUserJson = localStorage.getItem('memoryWeaverUser');
    let currentUserData: Partial<User> = {};
    if (storedUserJson) {
      try {
        const parsedUser = JSON.parse(storedUserJson);
        // Important: Only use stored data if email matches, otherwise it's a new login for a different user
        if (parsedUser.email === email) {
          currentUserData = parsedUser;
        }
      } catch (e) { console.error("Error parsing user data on login:", e); }
    }

    const userIdForLogin = currentUserData.id || Date.now().toString(); // Use existing ID or generate new
    
    // Default to 'no_pass_initiated' for a truly new user or if fields are missing
    const finalUser: User = {
      id: userIdForLogin,
      email,
      name: currentUserData.name || email.split('@')[0], // Default name from email
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
      hostPassStatus: currentUserData.hostPassStatus || 'no_pass_initiated',
      freeHostPassActivatedDate: currentUserData.freeHostPassActivatedDate,
      paidHostPassExpiryDate: currentUserData.paidHostPassExpiryDate,
      storageUsedBytes: 0, // Recalculate for this user
    };
    updateUserInStateAndStorage(finalUser); // This also saves to localStorage
    setIsAuthenticated(true);
    setUserModeState('host'); // Default to host mode on login
    setIsLoggingOut(false); // Ensure logging out state is cleared
    await calculateAndUpdateStorageUsage(finalUser.id); // Calculate storage for this user
  };

  const logout = useCallback(() => {
    setIsLoggingOut(true);
    updateUserInStateAndStorage(null);
    setIsAuthenticated(false);
    setPendingRequestCountState(0);
    setHasNewSharedMemoriesState(false);
    setUserModeState('host'); // Reset to default mode
    setGuestPassPriceDetails(null); // Clear price details
    setHostPassPriceDetails(null);
    router.push('/'); // Redirect to landing page
  }, [router, updateUserInStateAndStorage]);

  const setPendingRequestCount = useCallback((count: number) => {
    setPendingRequestCountState(count);
  }, []);

  const handleModeChange = useCallback((newMode: UserMode) => {
    setUserModeState(newMode);
    if (newMode === 'guest' && user) {
      checkAndUpdateGuestPassStatus();
    } else if (newMode === 'host' && user) {
      checkAndUpdateHostPassStatus();
      setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
    }
  }, [user, checkAndUpdateGuestPassStatus, checkAndUpdateHostPassStatus, checkIfGuestHasUnviewedMemories]);

  const toggleUserMode = useCallback(() => {
    handleModeChange(userMode === 'host' ? 'guest' : 'host');
  }, [userMode, handleModeChange]);

  const setUserMode = useCallback((mode: UserMode) => {
    if (userMode !== mode) {
      handleModeChange(mode);
    }
  }, [userMode, handleModeChange]);

  const activateFreeGuestPass = useCallback(() => {
    if (user && user.sharedAccessStatus === 'no_pass_initiated') {
      const now = new Date();
      const updatedUser: User = { ...user, sharedAccessStatus: 'free_pass_active', freePassActivatedDate: now.toISOString() };
      updateUserInStateAndStorage(updatedUser);
      toast({ title: "Free Guest Pass Activated!", description: `Your 6-month free access to shared memories starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000 });
    }
  }, [user, updateUserInStateAndStorage]);

  const purchasePaidGuestPass = useCallback(async () => {
    if (user) {
      const now = new Date();
      let startDate = now;
      // If current paid pass is still active, extend from its expiry.
      if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(now, parseISO(user.paidPassExpiryDate))) {
        startDate = parseISO(user.paidPassExpiryDate);
      }
      const newExpiryDate = addDays(startDate, 31); // 31-day pass
      const updatedUser: User = { ...user, sharedAccessStatus: 'paid_pass_active', paidPassExpiryDate: newExpiryDate.toISOString() };
      updateUserInStateAndStorage(updatedUser);

      let currentPassPrice = guestPassPriceDetails;
      if (!currentPassPrice && !isFetchingGuestPassPrice) { // Fetch if not already available
         currentPassPrice = await getGuestPassPriceAction({ city: user.city || 'London', country: user.countryOfBirth || 'UK' });
         setGuestPassPriceDetails(currentPassPrice);
      }
      let priceMsg = "for your pass";
      if (currentPassPrice) {
          priceMsg = `for ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: currentPassPrice.currency }).format(currentPassPrice.passPrice)}`;
      }
      toast({ title: "Guest Pass Purchased (Mock)!", description: `Your 31-day guest pass ${priceMsg} is active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000 });
    }
  }, [user, guestPassPriceDetails, isFetchingGuestPassPrice, updateUserInStateAndStorage]);

  const activateFreeHostPass = useCallback(() => {
    if (user && user.hostPassStatus === 'no_pass_initiated') {
      const now = new Date();
      const updatedUser: User = { ...user, hostPassStatus: 'free_host_pass_active', freeHostPassActivatedDate: now.toISOString() };
      updateUserInStateAndStorage(updatedUser);
      toast({ title: "Free Host Pass Activated!", description: `Your 6-month free host pass starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000 });
    }
  }, [user, updateUserInStateAndStorage]);

  const purchasePaidHostPass = useCallback(async () => {
    if (user) {
      const now = new Date();
      let startDate = now;
      if (user.hostPassStatus === 'paid_host_pass_active' && user.paidHostPassExpiryDate && isBefore(now, parseISO(user.paidHostPassExpiryDate))) {
        startDate = parseISO(user.paidHostPassExpiryDate);
      }
      const newExpiryDate = addDays(startDate, 31);
      const updatedUser: User = { ...user, hostPassStatus: 'paid_host_pass_active', paidHostPassExpiryDate: newExpiryDate.toISOString() };
      updateUserInStateAndStorage(updatedUser);

      let currentHostPassPrice = hostPassPriceDetails;
      if (!currentHostPassPrice && !isFetchingHostPassPrice) {
         currentHostPassPrice = await getHostPassPriceAction({ city: user.city || 'London', country: user.countryOfBirth || 'UK' });
         setHostPassPriceDetails(currentHostPassPrice);
      }
      let priceMsg = "for your host pass";
      if (currentHostPassPrice) {
          priceMsg = `for ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: currentHostPassPrice.currency }).format(currentHostPassPrice.passPrice)}`;
      }
      toast({ title: "Host Pass Purchased (Mock)!", description: `Your 31-day host pass ${priceMsg} is active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000 });
    }
  }, [user, hostPassPriceDetails, isFetchingHostPassPrice, updateUserInStateAndStorage]);

  const markSharedMemoryAsViewed = useCallback((memoryId: string) => {
    if (user) {
      const currentViewedIds = user.viewedSharedMemoryIds || [];
      if (!currentViewedIds.includes(memoryId)) {
        const updatedUser = { ...user, viewedSharedMemoryIds: [...currentViewedIds, memoryId] };
        updateUserInStateAndStorage(updatedUser);
        // If user is currently in host mode, update the notification badge state
        if (userMode === 'host') {
          setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
        }
      }
    }
  }, [user, userMode, checkIfGuestHasUnviewedMemories, updateUserInStateAndStorage]);
  
  const getStorageQuotaBytes = useCallback((): number => {
    if (user && (user.hostPassStatus === 'free_host_pass_active' || user.hostPassStatus === 'paid_host_pass_active')) {
      return STANDARD_HOST_STORAGE_QUOTA_BYTES;
    }
    return 0; // No active host pass, no quota for new uploads.
  }, [user]);

  const resetHostPassForTesting = useCallback(() => {
    if (user) {
      const updatedUser: User = {
        ...user,
        hostPassStatus: 'no_pass_initiated',
        freeHostPassActivatedDate: undefined,
        paidHostPassExpiryDate: undefined,
      };
      updateUserInStateAndStorage(updatedUser);
      // Clear price details so they refetch if needed
      setHostPassPriceDetails(null);
      toast({ title: "Host Pass Reset (Testing)", description: "Host pass status has been reset to initial state." });
    }
  }, [user, updateUserInStateAndStorage]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, login, logout, loading,
      pendingRequestCount, setPendingRequestCount,
      userMode, toggleUserMode, setUserMode,
      activateFreeGuestPass, purchasePaidGuestPass, checkAndUpdateGuestPassStatus,
      hasNewSharedMemories, setHasNewSharedMemories: setHasNewSharedMemoriesState,
      markSharedMemoryAsViewed, checkIfGuestHasUnviewedMemories,
      guestPassPriceDetails, fetchGuestPassPrice, isFetchingGuestPassPrice,
      activateFreeHostPass, purchasePaidHostPass, checkAndUpdateHostPassStatus,
      hostPassPriceDetails, fetchHostPassPrice, isFetchingHostPassPrice,
      resetHostPassForTesting, // Expose the new function
      storageQuotaBytes: getStorageQuotaBytes(),
      calculateAndUpdateStorageUsage,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

    