
"use client";

import type { User, UserMode, Memory as MemoryType } from '@/types';
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { addMonths, addDays, isBefore, parseISO, format } from 'date-fns';
import { mockMemories } from '@/lib/mockData'; // Will be removed later
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
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';


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
  checkAndUpdateGuestPassStatus: () => void; // Remains for manual checks if needed
  hasNewSharedMemories: boolean;
  setHasNewSharedMemories: (status: boolean) => void;
  markSharedMemoryAsViewed: (memoryId: string) => Promise<void>;
  checkIfGuestHasUnviewedMemories: () => boolean;
  guestPassPriceDetails: GetGuestPassPriceOutput | null;
  fetchGuestPassPrice: () => Promise<void>;
  isFetchingGuestPassPrice: boolean;

  activateFreeHostPass: () => void;
  purchasePaidHostPass: () => Promise<void>;
  checkAndUpdateHostPassStatus: () => void; // Remains for manual checks
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
      await updateDoc(userDocRef, updates);
      setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null); // Optimistic update
    } catch (error) {
      console.error("Error updating user profile in Firestore:", error);
      toast({ title: "Update Failed", description: "Could not save profile changes.", variant: "destructive" });
    }
  }, []);


  const calculateAndUpdateStorageUsage = useCallback(async (userId: string) => {
    // This will be replaced with Firestore queries for memories later
    const storedMemoriesJson = localStorage.getItem('mockMemories');
    let userMemories: MemoryType[] = [];
    if (storedMemoriesJson) {
      try {
        userMemories = JSON.parse(storedMemoriesJson).filter((mem: MemoryType) => mem.userId === userId);
      } catch (e) { console.error("Error parsing memories for storage calculation:", e); userMemories = mockMemories.filter(mem => mem.userId === userId); }
    } else {
      userMemories = mockMemories.filter(mem => mem.userId === userId);
      localStorage.setItem('mockMemories', JSON.stringify(mockMemories));
    }
    const usedBytes = userMemories.reduce((acc, memory) => (memory.mediaAttachments || []).reduce((sum, att) => sum + (att.size || 0), acc), 0);

    if (user && user.id === userId && user.storageUsedBytes !== usedBytes) {
      await updateUserProfileInFirestore(userId, { storageUsedBytes: usedBytes });
    }
  }, [user, updateUserProfileInFirestore]);


  const checkIfGuestHasUnviewedMemories = useCallback(() => {
    if (!user) return false;
    // This logic will need to be updated when memories are in Firestore
    const potentialSharedMemories = mockMemories.slice(0, 2);
    if (potentialSharedMemories.length === 0) return false;
    const viewedIds = user.viewedSharedMemoryIds || [];
    return potentialSharedMemories.some(mem => !viewedIds.includes(mem.id));
  }, [user]);

  const checkAndUpdatePassStatus = useCallback(async (currentUser: User): Promise<User> => {
    let updatedUser = { ...currentUser };
    const now = new Date();
    let guestStatusChanged = false;
    let hostStatusChanged = false;

    // Guest Pass Check
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

    // Host Pass Check
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
        
        await updateUserProfileInFirestore(currentUser.id, updatesToSave);
    }
    return updatedUser;
  }, [updateUserProfileInFirestore]);

  // Wrapper functions to expose, now they primarily ensure user exists.
  const checkAndUpdateGuestPassStatus = useCallback(async () => {
    if (user) {
      const updatedUser = await checkAndUpdatePassStatus(user);
      setUser(updatedUser); // Update local state after check
    }
  }, [user, checkAndUpdatePassStatus]);

  const checkAndUpdateHostPassStatus = useCallback(async () => {
     if (user) {
      const updatedUser = await checkAndUpdatePassStatus(user);
      setUser(updatedUser); // Update local state after check
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
        let appUser: User;

        if (userDocSnap.exists()) {
          const dbUser = userDocSnap.data() as User;
          appUser = await checkAndUpdatePassStatus({ // check and potentially update pass status from DB data
            ...dbUser, // spread DB data first
            id: firebaseUser.uid, // ensure Firebase UID is primary ID
            email: firebaseUser.email || dbUser.email, // prefer Firebase email
            name: dbUser.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0], // ensure name
          });
        } else {
          // New user, create profile in Firestore
          appUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            sharedAccessStatus: 'no_pass_initiated',
            hostPassStatus: 'no_pass_initiated',
            viewedSharedMemoryIds: [],
            storageUsedBytes: 0,
          };
          await setDoc(userDocRef, { ...appUser, createdAt: serverTimestamp() });
        }
        setUser(appUser);
        setIsAuthenticated(true);
        setHasNewSharedMemoriesState(checkIfGuestHasUnviewedMemories()); // Recheck for this user
        await calculateAndUpdateStorageUsage(appUser.id); // Recalculate for this user

      } else {
        setUser(null);
        setIsAuthenticated(false);
        setHasNewSharedMemoriesState(false);
      }
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [checkAndUpdatePassStatus, checkIfGuestHasUnviewedMemories, calculateAndUpdateStorageUsage]);


  useEffect(() => {
    if (loading || !initialLoadDone.current) return;

    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    const defaultAuthenticatedHostPath = '/prompts';
    const defaultAuthenticatedGuestPath = '/timeline';

    if (isAuthenticated) {
      if (user) { // Ensure user object exists before pass status check
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
      if (publicPaths.includes(pathname)) {
        const targetPath = userMode === 'host' ? defaultAuthenticatedHostPath : defaultAuthenticatedGuestPath;
        router.push(targetPath);
      }
    } else {
      if (!publicPaths.includes(pathname)) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, pathname, router, userMode, user,
      fetchGuestPassPrice, fetchHostPassPrice,
      isFetchingGuestPassPrice, guestPassPriceDetails,
      isFetchingHostPassPrice, hostPassPriceDetails]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user state and redirecting
      // No need to manually set isAuthenticated or user here
      toast({ title: "Login Successful", description: "Welcome back!" });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
      setLoading(false); // Ensure loading is false on error
      throw error; // Re-throw for the form to handle
    }
    // setLoading(false) will be handled by onAuthStateChanged's effect
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const newUserProfile: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: name,
        sharedAccessStatus: 'no_pass_initiated',
        hostPassStatus: 'no_pass_initiated',
        viewedSharedMemoryIds: [],
        storageUsedBytes: 0,
      };
      await setDoc(doc(db, "users", firebaseUser.uid), { ...newUserProfile, createdAt: serverTimestamp() });
      // onAuthStateChanged will set user state and redirect.
      toast({ title: "Registration Successful", description: "Welcome! Your account has been created." });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({ title: "Registration Failed", description: error.message || "Could not create account.", variant: "destructive" });
      setLoading(false);
      throw error;
    }
  }, []);


  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will set user to null and handle redirect.
      setPendingRequestCountState(0);
      setUserModeState('host'); // Reset mode on logout
      setGuestPassPriceDetails(null);
      setHostPassPriceDetails(null);
      router.push('/'); // Explicitly redirect to home after sign out
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", variant: "destructive" });
    } finally {
      setLoading(false); // Ensure loading is set to false after sign out attempt
    }
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
      toast({ title: "Initiating Secure Guest Pass Purchase...", description: "You would be redirected to Stripe for payment.", duration: 5000});
      const now = new Date(); let startDate = now;
      if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(now, parseISO(user.paidPassExpiryDate))) { startDate = parseISO(user.paidPassExpiryDate); }
      const newExpiryDate = addDays(startDate, 31);
      const updates: Partial<User> = { sharedAccessStatus: 'paid_pass_active', paidPassExpiryDate: newExpiryDate.toISOString() };
      await updateUserProfileInFirestore(user.id, updates);
      // Fetch price for toast message if not already available
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
      toast({ title: "Initiating Secure Host Pass Purchase...", description: "You will be redirected to Stripe for payment.", duration: 5000});
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
