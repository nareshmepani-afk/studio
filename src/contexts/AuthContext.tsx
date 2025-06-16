
"use client";

import type { User, UserMode, Memory as MemoryType } from '@/types';
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { addMonths, addDays, isBefore, parseISO, format } from 'date-fns';
// import { mockMemories } from '@/lib/mockData'; // No longer primary source for memories
import type { GetPassPriceOutput as GetGuestPassPriceOutput } from '@/ai/flows/get-pass-price-flow';
import { getPassPriceAction as getGuestPassPriceAction } from '@/actions/getPassPriceAction';
import type { GetHostPassPriceOutput } from '@/ai/flows/get-host-pass-price-flow';
import { getHostPassPriceAction } from '@/actions/getHostPassPriceAction';

import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';


interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  pendingRequestCount: number;
  setPendingRequestCount: (count: number) => void;
  userMode: UserMode;
  toggleUserMode: () => void;
  setUserMode: (mode: UserMode) => void;

  activateFreeGuestPass: () => void;
  purchasePaidGuestPass: () => Promise<void>;
  checkAndUpdateGuestPassStatus: () => void;
  hasNewSharedMemories: boolean;
  setHasNewSharedMemories: (status: boolean) => void;
  markSharedMemoryAsViewed: (memoryId: string) => Promise<void>;
  checkIfGuestHasUnviewedMemories: () => Promise<boolean>; // Now async
  guestPassPriceDetails: GetGuestPassPriceOutput | null;
  fetchGuestPassPrice: () => Promise<void>;
  isFetchingGuestPassPrice: boolean;

  activateFreeHostPass: () => void;
  purchasePaidHostPass: () => Promise<void>;
  checkAndUpdateHostPassStatus: () => void;
  hostPassStatus: User['hostPassStatus'];
  hostPassPriceDetails: GetHostPassPriceOutput | null;
  fetchHostPassPrice: () => Promise<void>;
  isFetchingHostPassPrice: boolean;
  resetHostPassForTesting: () => void;

  storageQuotaBytes: number;
  calculateAndUpdateStorageUsage: (userId: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [pendingRequestCount, setPendingRequestCountState] = useState<number>(0);
  const [userMode, setUserModeState] = useState<UserMode>('host');
  const [hasNewSharedMemories, setHasNewSharedMemoriesState] = useState(false);

  const [guestPassPriceDetails, setGuestPassPriceDetails] = useState<GetGuestPassPriceOutput | null>(null);
  const [isFetchingGuestPassPrice, setIsFetchingGuestPassPrice] = useState(false);

  const [hostPassPriceDetails, setHostPassPriceDetails] = useState<GetHostPassPriceOutput | null>(null);
  const [isFetchingHostPassPrice, setIsFetchingHostPassPrice] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const initialLoadDone = useRef(false);


  const updateUserProfileInFirestore = useCallback(async (userId: string, updates: Partial<User>) => {
    if (!userId) return;
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { ...updates, lastUpdated: serverTimestamp() });
      setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
    } catch (error) {
      console.error("Error updating user profile in Firestore:", error);
      // Avoid toasting for every background update unless critical
      // toast({ title: "Update Failed", description: "Could not save profile changes.", variant: "destructive" });
    }
  }, []);


  const calculateAndUpdateStorageUsage = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
        const memoriesColRef = collection(db, "users", userId, "memories");
        const q = query(memoriesColRef);
        const snapshot = await getDocs(q);
        let usedBytes = 0;
        snapshot.forEach(docSnap => {
            const memory = docSnap.data() as MemoryType;
            (memory.mediaAttachments || []).forEach(att => {
                usedBytes += (att.size || 0);
            });
        });

        setUser(prevUser => {
          if (prevUser && prevUser.id === userId && prevUser.storageUsedBytes !== usedBytes) {
            updateUserProfileInFirestore(userId, { storageUsedBytes: usedBytes });
            return { ...prevUser, storageUsedBytes: usedBytes };
          }
          return prevUser;
        });
    } catch (error) {
        console.error("Error calculating storage usage from Firestore:", error);
    }
  }, [updateUserProfileInFirestore]);


  const checkIfGuestHasUnviewedMemories = useCallback(async (): Promise<boolean> => {
    if (!user || userMode !== 'guest') return false;
    // Placeholder: Real logic would query Firestore for memories shared *to* this user.
    return false;
  }, [user, userMode]);

  const checkAndUpdatePassStatus = useCallback(async (currentUser: User): Promise<User> => {
    let updatedUser = { ...currentUser };
    const now = new Date();
    let guestStatusChanged = false;
    let hostStatusChanged = false;

    if (updatedUser.sharedAccessStatus === 'free_pass_active' && updatedUser.freePassActivatedDate) {
      if (isBefore(addMonths(parseISO(updatedUser.freePassActivatedDate), 6), now)) {
        updatedUser.sharedAccessStatus = 'free_pass_expired';
        guestStatusChanged = true;
      }
    } else if (updatedUser.sharedAccessStatus === 'paid_pass_active' && updatedUser.paidPassExpiryDate) {
      if (isBefore(parseISO(updatedUser.paidPassExpiryDate), now)) {
        updatedUser.sharedAccessStatus = 'paid_pass_expired';
        guestStatusChanged = true;
      }
    }

    if (updatedUser.hostPassStatus === 'free_host_pass_active' && updatedUser.freeHostPassActivatedDate) {
      if (isBefore(addMonths(parseISO(updatedUser.freeHostPassActivatedDate), 6), now)) {
        updatedUser.hostPassStatus = 'free_host_pass_expired';
        hostStatusChanged = true;
      }
    } else if (updatedUser.hostPassStatus === 'paid_host_pass_active' && updatedUser.paidHostPassExpiryDate) {
      if (isBefore(parseISO(updatedUser.paidHostPassExpiryDate), now)) {
        updatedUser.hostPassStatus = 'paid_host_pass_expired';
        hostStatusChanged = true;
      }
    }

    if (guestStatusChanged || hostStatusChanged) {
        const updatesToSave: Partial<User> = {};
        if (guestStatusChanged) updatesToSave.sharedAccessStatus = updatedUser.sharedAccessStatus;
        if (hostStatusChanged) updatesToSave.hostPassStatus = updatedUser.hostPassStatus;

        // Perform the update without awaiting it here if it's not critical for the immediate user object state
        updateUserProfileInFirestore(currentUser.id, updatesToSave);
    }
    return updatedUser; // Return the potentially modified user object for immediate use
  }, [updateUserProfileInFirestore]);

  const checkAndUpdateGuestPassStatus = useCallback(async () => {
    if (user) {
      const updatedUser = await checkAndUpdatePassStatus(user);
      setUser(updatedUser);
    }
  }, [user, checkAndUpdatePassStatus]);

  const checkAndUpdateHostPassStatus = useCallback(async () => {
     if (user) {
      const updatedUser = await checkAndUpdatePassStatus(user);
      setUser(updatedUser);
    }
  }, [user, checkAndUpdatePassStatus]);


  const fetchGuestPassPriceLogic = useCallback(async (currentUserForPrice: User | null) => {
    if (isFetchingGuestPassPrice || guestPassPriceDetails) return;
    setIsFetchingGuestPassPrice(true);
    try {
      const cityForPrice = currentUserForPrice?.city || 'London';
      const countryForPrice = currentUserForPrice?.countryOfBirth || 'UK';
      const priceData = await getGuestPassPriceAction({ city: cityForPrice, country: countryForPrice });
      setGuestPassPriceDetails(priceData);
    } catch (error) {
      console.error("Failed to fetch guest pass price:", error);
      toast({ title: "AI Pricing Unavailable", description: "Could not fetch dynamic pricing for Guest Pass. Using standard rates.", variant: "default", duration: 7000 });
      setGuestPassPriceDetails({passPrice: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 7.99 : 9.99, currency: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 'GBP' : 'USD', coffeePrice: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 3.50 : 3.00, justification: 'Enjoy a month of shared memories with our standard access pass.'});
    } finally { setIsFetchingGuestPassPrice(false); }
  }, [isFetchingGuestPassPrice, guestPassPriceDetails]);

  const fetchGuestPassPrice = useCallback(() => { fetchGuestPassPriceLogic(user); }, [user, fetchGuestPassPriceLogic]);

  const fetchHostPassPriceLogic = useCallback(async (currentUserForPrice: User | null) => {
    if (isFetchingHostPassPrice || hostPassPriceDetails) return;
    setIsFetchingHostPassPrice(true);
    try {
      const cityForPrice = currentUserForPrice?.city || 'London';
      const countryForPrice = currentUserForPrice?.countryOfBirth || 'UK';
      const priceData = await getHostPassPriceAction({ city: cityForPrice, country: countryForPrice });
      setHostPassPriceDetails(priceData);
    } catch (error) {
      console.error("Failed to fetch host pass price:", error);
      toast({ title: "AI Pricing Unavailable", description: "Could not fetch dynamic pricing for Host Pass. Using standard rates.", variant: "default", duration: 7000 });
      setHostPassPriceDetails({ passPrice: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 12.99 : 14.99, currency: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 'GBP' : 'USD', coffeePrice: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 3.50 : 3.00, justification: 'Unlock a full month of memory creation tools and preserve your precious moments.'});
    } finally { setIsFetchingHostPassPrice(false); }
  }, [isFetchingHostPassPrice, hostPassPriceDetails]);

  const fetchHostPassPrice = useCallback(() => { fetchHostPassPriceLogic(user); }, [user, fetchHostPassPriceLogic]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let appUserInitial: User;

        if (userDocSnap.exists()) {
          const dbUser = userDocSnap.data();
          appUserInitial = {
            id: firebaseUser.uid,
            email: firebaseUser.email || dbUser.email,
            name: dbUser.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            profileInfo: dbUser.profileInfo,
            avatarUrl: dbUser.avatarUrl,
            dateOfBirth: dbUser.dateOfBirth,
            countryOfBirth: dbUser.countryOfBirth,
            city: dbUser.city,
            townArea: dbUser.townArea,
            sharedAccessStatus: dbUser.sharedAccessStatus || 'no_pass_initiated',
            freePassActivatedDate: dbUser.freePassActivatedDate,
            paidPassExpiryDate: dbUser.paidPassExpiryDate,
            hostPassStatus: dbUser.hostPassStatus || 'no_pass_initiated',
            freeHostPassActivatedDate: dbUser.freeHostPassActivatedDate,
            paidHostPassExpiryDate: dbUser.paidHostPassExpiryDate,
            viewedSharedMemoryIds: dbUser.viewedSharedMemoryIds || [],
            storageUsedBytes: dbUser.storageUsedBytes || 0,
          };
        } else {
          // This case should ideally be handled during registration.
          // If a Firebase user exists but no Firestore doc, create one.
          appUserInitial = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "New User",
            sharedAccessStatus: 'no_pass_initiated',
            hostPassStatus: 'no_pass_initiated',
            viewedSharedMemoryIds: [],
            storageUsedBytes: 0,
          };
          // setDoc won't be awaited here to speed up initial load
          setDoc(userDocRef, { ...appUserInitial, createdAt: serverTimestamp() });
        }

        // Check and update pass status (important for immediate UI)
        const appUserWithPassStatus = await checkAndUpdatePassStatus(appUserInitial);

        // Set essential user state and clear loading
        setUser(appUserWithPassStatus);
        setIsAuthenticated(true);
        setLoading(false); // **Moved setLoading(false) here**

        // Post-load asynchronous updates
        checkIfGuestHasUnviewedMemories().then(hasUnviewed => {
          setHasNewSharedMemoriesState(hasUnviewed);
        });
        calculateAndUpdateStorageUsage(appUserWithPassStatus.id); // This will update user state internally

      } else {
        setUser(null);
        setIsAuthenticated(false);
        setHasNewSharedMemoriesState(false);
        setLoading(false); // Also set loading false if no user
      }

      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
      }
    });
    return () => unsubscribe();
  }, [checkAndUpdatePassStatus, checkIfGuestHasUnviewedMemories, calculateAndUpdateStorageUsage]);


  useEffect(() => {
    if (loading || !initialLoadDone.current) {
      return;
    }

    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    const defaultAuthenticatedHostPath = '/prompts';
    const defaultAuthenticatedGuestPath = '/timeline';

    if (isAuthenticated) {
      if (publicPaths.includes(pathname)) {
        const targetPath = userMode === 'host' ? defaultAuthenticatedHostPath : defaultAuthenticatedGuestPath;
        if (pathname !== targetPath) {
            router.push(targetPath);
            return; 
        }
      }
    } else { 
      if (!publicPaths.includes(pathname)) {
        if (pathname !== '/login') {
            router.push('/login');
            return; 
        }
      }
    }

    if (isAuthenticated && user) {
      if (userMode === 'host') {
        if ((user.hostPassStatus === 'free_host_pass_expired' || user.hostPassStatus === 'paid_host_pass_expired' || user.hostPassStatus === 'no_pass_initiated') && !isFetchingHostPassPrice && !hostPassPriceDetails) {
          fetchHostPassPrice();
        }
      } else if (userMode === 'guest') {
        if ((user.sharedAccessStatus === 'free_pass_expired' || user.sharedAccessStatus === 'paid_pass_expired' || user.sharedAccessStatus === 'no_pass_initiated') && !isFetchingGuestPassPrice && !guestPassPriceDetails) {
          fetchGuestPassPrice();
        }
      }
    }
  }, [isAuthenticated, loading, pathname, router, userMode, user,
      fetchGuestPassPrice, fetchHostPassPrice,
      isFetchingGuestPassPrice, guestPassPriceDetails,
      isFetchingHostPassPrice, hostPassPriceDetails]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true); // Keep setLoading(true) here for the login button's loading state
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful", description: "Welcome back!" });
      // setLoading(false) is handled by onAuthStateChanged
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
      setLoading(false); // Set loading false on error
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    setLoading(true); // Keep setLoading(true) here
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const newUserProfile: Omit<User, 'id'> & { createdAt: any } = { 
        email: firebaseUser.email || "",
        name: name,
        sharedAccessStatus: 'no_pass_initiated',
        hostPassStatus: 'no_pass_initiated',
        viewedSharedMemoryIds: [],
        storageUsedBytes: 0,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);
      toast({ title: "Registration Successful", description: "Welcome! Your account has been created." });
      // setLoading(false) is handled by onAuthStateChanged
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({ title: "Registration Failed", description: error.message || "Could not create account.", variant: "destructive" });
      setLoading(false); // Set loading false on error
      throw error;
    }
  }, []);


  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // State will be reset by onAuthStateChanged listener
      setPendingRequestCountState(0);
      setUserModeState('host');
      setGuestPassPriceDetails(null);
      setHostPassPriceDetails(null);
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", variant: "destructive" });
      setLoading(false); // Ensure loading is false on error
    }
    // setLoading(false) is handled by onAuthStateChanged
  }, [router]);

  const setPendingRequestCount = useCallback((count: number) => { setPendingRequestCountState(count); }, []);
  const handleModeChange = useCallback((newMode: UserMode) => { setUserModeState(newMode); }, []);
  const toggleUserMode = useCallback(() => { handleModeChange(userMode === 'host' ? 'guest' : 'host'); }, [userMode, handleModeChange]);
  const setUserMode = useCallback((mode: UserMode) => { if (userMode !== mode) { handleModeChange(mode); } }, [userMode, handleModeChange]);

  const activateFreeGuestPass = useCallback(async () => {
    if (user && user.sharedAccessStatus === 'no_pass_initiated') {
      const now = new Date();
      const updates: Partial<User> = { sharedAccessStatus: 'free_pass_active', freePassActivatedDate: now.toISOString() };
      await updateUserProfileInFirestore(user.id, updates);
      toast({ title: "Free Guest Pass Activated!", description: `Your 6-month free access to shared memories starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000 });
    }
  }, [user, updateUserProfileInFirestore]);

  const purchasePaidGuestPass = useCallback(async () => {
    if (user) {
      toast({ title: "Initiating Guest Pass Purchase (Simulated)...", description: "Payment processing is mocked.", duration: 5000});
      const now = new Date(); let startDate = now;
      if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(now, parseISO(user.paidPassExpiryDate))) { startDate = parseISO(user.paidPassExpiryDate); }
      const newExpiryDate = addDays(startDate, 31);
      const updates: Partial<User> = { sharedAccessStatus: 'paid_pass_active', paidPassExpiryDate: newExpiryDate.toISOString() };
      await updateUserProfileInFirestore(user.id, updates);
      let currentPassPrice = guestPassPriceDetails;
      if (!currentPassPrice) { try { currentPassPrice = await getGuestPassPriceAction({ city: user.city || 'London', country: user.countryOfBirth || 'UK' }); setGuestPassPriceDetails(currentPassPrice); } catch (e) { /* ignore */ } }
      let priceMsg = "for your pass"; if (currentPassPrice) { priceMsg = `for ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: currentPassPrice.currency }).format(currentPassPrice.passPrice)}`; }
      toast({ title: "Guest Pass Activated (Payment Simulated)!", description: `Your 31-day guest pass ${priceMsg} is now active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000 });
    }
  }, [user, guestPassPriceDetails, updateUserProfileInFirestore]);

  const activateFreeHostPass = useCallback(async () => {
    if (user && user.hostPassStatus === 'no_pass_initiated') {
      const now = new Date();
      const updates: Partial<User> = { hostPassStatus: 'free_host_pass_active', freeHostPassActivatedDate: now.toISOString() };
      await updateUserProfileInFirestore(user.id, updates);
      toast({ title: "Free Host Pass Activated!", description: `Your 6-month free host pass starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000 });
    }
  }, [user, updateUserProfileInFirestore]);

  const purchasePaidHostPass = useCallback(async () => {
    if (user) {
      toast({ title: "Initiating Host Pass Purchase (Simulated)...", description: "Payment processing is mocked.", duration: 5000});
      const now = new Date(); let startDate = now;
      if (user.hostPassStatus === 'paid_host_pass_active' && user.paidHostPassExpiryDate && isBefore(now, parseISO(user.paidHostPassExpiryDate))) { startDate = parseISO(user.paidHostPassExpiryDate); }
      const newExpiryDate = addDays(startDate, 31);
      const updates: Partial<User> = { hostPassStatus: 'paid_host_pass_active', paidHostPassExpiryDate: newExpiryDate.toISOString() };
      await updateUserProfileInFirestore(user.id, updates);
      let currentHostPassPrice = hostPassPriceDetails;
      if (!currentHostPassPrice) { try { currentHostPassPrice = await getHostPassPriceAction({ city: user.city || 'London', country: user.countryOfBirth || 'UK' }); setHostPassPriceDetails(currentHostPassPrice); } catch (e) { /* ignore */ } }
      let priceMsg = "for your host pass"; if (currentHostPassPrice) { priceMsg = `for ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: currentHostPassPrice.currency }).format(currentHostPassPrice.passPrice)}`; }
      toast({ title: "Host Pass Activated (Payment Simulated)!", description: `Your 31-day host pass ${priceMsg} is now active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000 });
    }
  }, [user, hostPassPriceDetails, updateUserProfileInFirestore]);

  const markSharedMemoryAsViewed = useCallback(async (memoryId: string) => {
    if (user) {
      const currentViewedIds = user.viewedSharedMemoryIds || [];
      if (!currentViewedIds.includes(memoryId)) {
        await updateUserProfileInFirestore(user.id, { viewedSharedMemoryIds: [...currentViewedIds, memoryId] });
      }
    }
  }, [user, updateUserProfileInFirestore]);

  const getStorageQuotaBytes = useCallback((): number => (user && (user.hostPassStatus === 'free_host_pass_active' || user.hostPassStatus === 'paid_host_pass_active')) ? STANDARD_HOST_STORAGE_QUOTA_BYTES : 0, [user]);

  const resetHostPassForTesting = useCallback(async () => {
    if (user) {
      const updates: Partial<User> = { hostPassStatus: 'no_pass_initiated', freeHostPassActivatedDate: undefined, paidHostPassExpiryDate: undefined };
      await updateUserProfileInFirestore(user.id, updates);
      setHostPassPriceDetails(null); 
      toast({ title: "Host Pass Reset (Testing)", description: "Host pass status has been reset." });
    }
  }, [user, updateUserProfileInFirestore]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, login, register, logout, loading,
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
