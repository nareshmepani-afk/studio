
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
  hostPassStatus: User['hostPassStatus']; 
  hostPassPriceDetails: GetHostPassPriceOutput | null;
  fetchHostPassPrice: () => Promise<void>;
  isFetchingHostPassPrice: boolean;
  resetHostPassForTesting: () => void; 

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
      let significantChange = false;
      if (!prevUser && updatedUserArg) {
        significantChange = true;
      } else if (prevUser && !updatedUserArg) {
        significantChange = true;
      } else if (prevUser && updatedUserArg) {
        // Compare key fields that affect UI or logic
        if (
          prevUser.name !== updatedUserArg.name ||
          prevUser.email !== updatedUserArg.email ||
          prevUser.avatarUrl !== updatedUserArg.avatarUrl ||
          prevUser.dateOfBirth !== updatedUserArg.dateOfBirth ||
          prevUser.countryOfBirth !== updatedUserArg.countryOfBirth ||
          prevUser.city !== updatedUserArg.city ||
          prevUser.townArea !== updatedUserArg.townArea ||
          prevUser.profileInfo !== updatedUserArg.profileInfo ||
          prevUser.sharedAccessStatus !== updatedUserArg.sharedAccessStatus ||
          prevUser.freePassActivatedDate !== updatedUserArg.freePassActivatedDate ||
          prevUser.paidPassExpiryDate !== updatedUserArg.paidPassExpiryDate ||
          prevUser.hostPassStatus !== updatedUserArg.hostPassStatus ||
          prevUser.freeHostPassActivatedDate !== updatedUserArg.freeHostPassActivatedDate ||
          prevUser.paidHostPassExpiryDate !== updatedUserArg.paidHostPassExpiryDate ||
          prevUser.storageUsedBytes !== updatedUserArg.storageUsedBytes ||
          JSON.stringify(prevUser.viewedSharedMemoryIds) !== JSON.stringify(updatedUserArg.viewedSharedMemoryIds) // Array comparison
        ) {
          significantChange = true;
        }
      }

      if (significantChange) {
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
        userMemories = mockMemories.filter(mem => mem.userId === userId); 
      }
    } else {
      userMemories = mockMemories.filter(mem => mem.userId === userId); 
      localStorage.setItem('mockMemories', JSON.stringify(mockMemories));
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
    const potentialSharedMemories = mockMemories.slice(0, 2); 
    if (potentialSharedMemories.length === 0) return false;
    const viewedIds = user.viewedSharedMemoryIds || [];
    return potentialSharedMemories.some(mem => !viewedIds.includes(mem.id));
  }, [user]);

  const checkAndUpdateGuestPassStatus = useCallback(() => {
    setUser(currentUser => {
      if (!currentUser) return null;
      let newStatus = currentUser.sharedAccessStatus;
      const now = new Date();

      if (currentUser.sharedAccessStatus === 'free_pass_active' && currentUser.freePassActivatedDate) {
        const freePassEndDate = addMonths(parseISO(currentUser.freePassActivatedDate), 6);
        if (isBefore(freePassEndDate, now)) {
          newStatus = 'free_pass_expired';
        }
      } else if (currentUser.sharedAccessStatus === 'paid_pass_active' && currentUser.paidPassExpiryDate) {
        if (isBefore(parseISO(currentUser.paidPassExpiryDate), now)) {
          newStatus = 'paid_pass_expired';
        }
      }
      
      if (newStatus !== currentUser.sharedAccessStatus) {
        const updatedUser = { ...currentUser, sharedAccessStatus: newStatus };
        localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return currentUser;
    });
  }, []);
  
  const checkAndUpdateHostPassStatus = useCallback(() => {
    setUser(currentUser => {
      if (!currentUser) return null;
      let newStatus = currentUser.hostPassStatus;
      const now = new Date();

      if (currentUser.hostPassStatus === 'free_host_pass_active' && currentUser.freeHostPassActivatedDate) {
        const freeHostPassEndDate = addMonths(parseISO(currentUser.freeHostPassActivatedDate), 6); 
        if (isBefore(freeHostPassEndDate, now)) {
          newStatus = 'free_host_pass_expired';
        }
      } else if (currentUser.hostPassStatus === 'paid_host_pass_active' && currentUser.paidHostPassExpiryDate) {
        if (isBefore(parseISO(currentUser.paidHostPassExpiryDate), now)) {
          newStatus = 'paid_host_pass_expired';
        }
      }
      if (newStatus !== currentUser.hostPassStatus) {
        const updatedUser = { ...currentUser, hostPassStatus: newStatus };
        localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return currentUser;
    });
  }, []);


  const fetchGuestPassPriceLogic = useCallback(async () => {
    if (isFetchingGuestPassPrice || guestPassPriceDetails) return; 
    setIsFetchingGuestPassPrice(true);
    try {
      const cityForPrice = user?.city || 'London';
      const countryForPrice = user?.countryOfBirth || 'UK'; 
      const priceData = await getGuestPassPriceAction({ city: cityForPrice, country: countryForPrice });
      setGuestPassPriceDetails(priceData);
    } catch (error) {
      console.error("Failed to fetch guest pass price:", error);
      setGuestPassPriceDetails({
        passPrice: (user?.countryOfBirth?.toLowerCase() === 'uk' || user?.city?.toLowerCase() === 'london') ? 7.99 : 9.99,
        currency: (user?.countryOfBirth?.toLowerCase() === 'uk' || user?.city?.toLowerCase() === 'london') ? 'GBP' : 'USD',
        coffeePrice: (user?.countryOfBirth?.toLowerCase() === 'uk' || user?.city?.toLowerCase() === 'london') ? 3.50 : 3.00,
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
        passPrice: (user?.countryOfBirth?.toLowerCase() === 'uk' || user?.city?.toLowerCase() === 'london') ? 12.99 : 14.99,
        currency: (user?.countryOfBirth?.toLowerCase() === 'uk' || user?.city?.toLowerCase() === 'london') ? 'GBP' : 'USD',
        coffeePrice: (user?.countryOfBirth?.toLowerCase() === 'uk' || user?.city?.toLowerCase() === 'london') ? 3.50 : 3.00,
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
    let initialUser: User | null = null;
    if (storedUserJson) {
      try {
        const storedUserData = JSON.parse(storedUserJson);
        
        let initialStorageUsedBytes = 0;
        if (storedUserData.id) {
            const memoriesForCalcJson = localStorage.getItem('mockMemories');
            let userMems: MemoryType[] = [];
            if (memoriesForCalcJson) {
                try { userMems = JSON.parse(memoriesForCalcJson).filter((mem: MemoryType) => mem.userId === storedUserData.id); }
                catch(e) { console.error("Error parsing mockMemories for initial calculation:", e); userMems = mockMemories.filter(mem => mem.userId === storedUserData.id); }
            } else {
                userMems = mockMemories.filter(mem => mem.userId === storedUserData.id);
                localStorage.setItem('mockMemories', JSON.stringify(mockMemories));
            }
            initialStorageUsedBytes = userMems.reduce((acc, memory) => {
                if (memory.mediaAttachments) {
                    memory.mediaAttachments.forEach(attachment => { if (attachment.size && typeof attachment.size === 'number') acc += attachment.size; });
                }
                return acc;
            }, 0);
        }

        initialUser = {
          id: storedUserData.id || '1', 
          email: storedUserData.email,
          name: storedUserData.name,
          avatarUrl: storedUserData.avatarUrl,
          dateOfBirth: storedUserData.dateOfBirth,
          countryOfBirth: storedUserData.countryOfBirth,
          city: storedUserData.city,
          townArea: storedUserData.townArea,
          profileInfo: storedUserData.profileInfo,
          
          sharedAccessStatus: storedUserData.sharedAccessStatus || 'no_pass_initiated',
          freePassActivatedDate: storedUserData.freePassActivatedDate,
          paidPassExpiryDate: storedUserData.paidPassExpiryDate,
          viewedSharedMemoryIds: storedUserData.viewedSharedMemoryIds || [],
          
          hostPassStatus: storedUserData.hostPassStatus || 'no_pass_initiated',
          freeHostPassActivatedDate: storedUserData.freeHostPassActivatedDate,
          paidHostPassExpiryDate: storedUserData.paidHostPassExpiryDate,
          storageUsedBytes: initialStorageUsedBytes, 
        };
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('memoryWeaverUser'); 
      }
    }
    
    if (initialUser) {
      setUser(initialUser);
      setIsAuthenticated(true);
      // Immediately check and update pass statuses upon loading the user
      // This is wrapped in a timeout to allow initial state to settle if needed,
      // but direct calls should also work fine as setUser in checkAndUpdate... will queue re-render.
      setTimeout(() => {
          checkAndUpdateGuestPassStatus();
          checkAndUpdateHostPassStatus();
          setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
      }, 0);
    }
    setLoading(false);
  }, [checkAndUpdateGuestPassStatus, checkAndUpdateHostPassStatus, checkIfGuestHasUnviewedMemories]); 

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
        if (parsedUser.email === email) {
          currentUserData = parsedUser;
        }
      } catch (e) { console.error("Error parsing user data on login:", e); }
    }

    const userIdForLogin = currentUserData.id || Date.now().toString(); 
    
    const finalUser: User = {
      id: userIdForLogin,
      email,
      name: currentUserData.name || email.split('@')[0], 
      avatarUrl: currentUserData.avatarUrl,
      dateOfBirth: currentUserData.dateOfBirth,
      countryOfBirth: currentUserData.countryOfBirth,
      city: currentUserData.city,
      townArea: currentUserData.townArea,
      profileInfo: currentUserData.profileInfo,
      sharedAccessStatus: currentUserData.sharedAccessStatus || 'no_pass_initiated',
      freePassActivatedDate: currentUserData.freePassActivatedDate,
      paidPassExpiryDate: currentUserData.paidPassExpiryDate,
      viewedSharedMemoryIds: currentUserData.viewedSharedMemoryIds || [],
      hostPassStatus: currentUserData.hostPassStatus || 'no_pass_initiated',
      freeHostPassActivatedDate: currentUserData.freeHostPassActivatedDate,
      paidHostPassExpiryDate: currentUserData.paidHostPassExpiryDate,
      storageUsedBytes: currentUserData.storageUsedBytes || 0,
    };
    updateUserInStateAndStorage(finalUser); 
    setIsAuthenticated(true);
    setUserModeState('host'); 
    setIsLoggingOut(false); 
    await calculateAndUpdateStorageUsage(finalUser.id); 
    // Initial checks after login
    checkAndUpdateGuestPassStatus();
    checkAndUpdateHostPassStatus();
    setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
  };

  const logout = useCallback(() => {
    setIsLoggingOut(true);
    updateUserInStateAndStorage(null);
    setIsAuthenticated(false);
    setPendingRequestCountState(0);
    setHasNewSharedMemoriesState(false);
    setUserModeState('host'); 
    setGuestPassPriceDetails(null); 
    setHostPassPriceDetails(null);
    router.push('/'); 
  }, [router, updateUserInStateAndStorage]);

  const setPendingRequestCount = useCallback((count: number) => {
    setPendingRequestCountState(count);
  }, []);

  const handleModeChange = useCallback((newMode: UserMode) => {
    setUserModeState(newMode);
    if (user) { // Ensure user exists before calling dependent functions
        if (newMode === 'guest') {
            checkAndUpdateGuestPassStatus();
        } else { // host mode
            checkAndUpdateHostPassStatus();
            setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
        }
    }
  }, [user, checkAndUpdateGuestPassStatus, checkAndUpdateHostPassStatus, checkIfGuestHasUnviewedMemories, setHasNewSharedMemoriesState]);

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
      
      if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(now, parseISO(user.paidPassExpiryDate))) {
        startDate = parseISO(user.paidPassExpiryDate);
      }
      const newExpiryDate = addDays(startDate, 31); 
      const updatedUser: User = { ...user, sharedAccessStatus: 'paid_pass_active', paidPassExpiryDate: newExpiryDate.toISOString() };
      updateUserInStateAndStorage(updatedUser);

      let currentPassPrice = guestPassPriceDetails;
      if (!currentPassPrice && !isFetchingGuestPassPrice) { 
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
    setUser(currentUser => {
      if (currentUser) {
        const currentViewedIds = currentUser.viewedSharedMemoryIds || [];
        if (!currentViewedIds.includes(memoryId)) {
          const updatedUser = { ...currentUser, viewedSharedMemoryIds: [...currentViewedIds, memoryId] };
          localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
          setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories()); // Re-check after marking as viewed
          return updatedUser;
        }
      }
      return currentUser;
    });
  }, [checkIfGuestHasUnviewedMemories, setHasNewSharedMemoriesState]);
  
  const getStorageQuotaBytes = useCallback((): number => {
    if (user && (user.hostPassStatus === 'free_host_pass_active' || user.hostPassStatus === 'paid_host_pass_active')) {
      return STANDARD_HOST_STORAGE_QUOTA_BYTES;
    }
    return 0; 
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
      setHostPassPriceDetails(null); 
      toast({ title: "Host Pass Reset (Testing)", description: "Host pass status has been reset to initial state." });
    }
  }, [user, updateUserInStateAndStorage]);

  useEffect(() => {
    if (!loading && user) {
      // These are now also called within the initial user loading logic for immediate effect
      // Keeping them here as a fallback or for re-checks if user object changes externally
      checkAndUpdateGuestPassStatus();
      checkAndUpdateHostPassStatus();

      if (userMode === 'host') {
        setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories());
        if ((user.hostPassStatus === 'free_host_pass_expired' ||
            user.hostPassStatus === 'paid_host_pass_expired' ||
            user.hostPassStatus === 'no_pass_initiated') && !isFetchingHostPassPrice && !hostPassPriceDetails) {
          fetchHostPassPrice();
        }
      } else if (userMode === 'guest') {
         if ((user.sharedAccessStatus === 'free_pass_expired' ||
             user.sharedAccessStatus === 'paid_pass_expired' ||
             user.sharedAccessStatus === 'no_pass_initiated') && !isFetchingGuestPassPrice && !guestPassPriceDetails) {
           fetchGuestPassPrice();
         }
      }
    }
  }, [loading, user, userMode, checkIfGuestHasUnviewedMemories, 
      fetchGuestPassPrice, isFetchingGuestPassPrice, guestPassPriceDetails, checkAndUpdateGuestPassStatus,
      fetchHostPassPrice, isFetchingHostPassPrice, hostPassPriceDetails, checkAndUpdateHostPassStatus,
      setHasNewSharedMemoriesState 
    ]);

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
      hostPassStatus: user?.hostPassStatus || 'no_pass_initiated', 
      hostPassPriceDetails, fetchHostPassPrice, isFetchingHostPassPrice,
      resetHostPassForTesting, 
      storageQuotaBytes: getStorageQuotaBytes(),
      calculateAndUpdateStorageUsage,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

