
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
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';


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
  const justLoggedOut = useRef(false);
  const isRedirectingFromAuthGuard = useRef(false);


  const updateUserProfileInFirestore = useCallback(async (userId: string, updates: Partial<User>) => {
    if (!userId) {
      console.warn("AuthContext: updateUserProfileInFirestore called with null/undefined userId. Skipping update.");
      return;
    }
    // Defensive check: Ensure the current Firebase auth state aligns with the userId being updated
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      console.warn(`AuthContext: updateUserProfileInFirestore - Attempted to update for ${userId} but current Firebase auth state is for a different user or null. Skipping update to prevent permission errors.`);
      return;
    }
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { ...updates, lastUpdated: serverTimestamp() });
      setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
    } catch (error: any) {
      console.error(`AuthContext: Error updating user profile in Firestore for user ${userId}:`, error);
      // Do not re-throw here, let the caller decide if it's critical.
    }
  }, []);


  const calculateAndUpdateStorageUsage = useCallback(async (userId: string) => {
    if (!userId) {
      console.warn("AuthContext: calculateAndUpdateStorageUsage called with null/undefined userId. Skipping calculation.");
      return;
    }
    // Defensive check: Ensure the current Firebase auth state aligns with the userId
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      console.warn(`AuthContext: calculateAndUpdateStorageUsage - Attempted for ${userId} but current Firebase auth state is for a different user or null. Skipping.`);
      return;
    }
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
            updateUserProfileInFirestore(userId, { storageUsedBytes: usedBytes }); // updateUserProfileInFirestore already has its own auth check
            return { ...prevUser, storageUsedBytes: usedBytes };
          }
          return prevUser;
        });
    } catch (error) {
        console.error(`AuthContext: Error calculating storage usage from Firestore for user ${userId}:`, error);
    }
  }, [updateUserProfileInFirestore]);


  const checkIfGuestHasUnviewedMemories = useCallback(async (): Promise<boolean> => {
    if (!user || userMode !== 'guest') {
      return false;
    }
    // Placeholder: Real logic would query Firestore for memories shared *to* this user.
    return false;
  }, [user, userMode]);

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
        // updateUserProfileInFirestore will be called only if auth.currentUser matches currentUser.id
        await updateUserProfileInFirestore(currentUser.id, updatesToSave);
    }
    return updatedUser;
  }, [updateUserProfileInFirestore]);

  const checkAndUpdateGuestPassStatus = useCallback(async () => {
    if (user && auth.currentUser && auth.currentUser.uid === user.id) { // Ensure current Firebase auth matches context user
      const updatedUser = await checkAndUpdatePassStatus(user);
      setUser(updatedUser);
    }
  }, [user, checkAndUpdatePassStatus]);

  const checkAndUpdateHostPassStatus = useCallback(async () => {
     if (user && auth.currentUser && auth.currentUser.uid === user.id) { // Ensure current Firebase auth matches context user
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
      console.error("AuthContext: Failed to fetch GUEST pass price:", error);
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
      console.error("AuthContext: Failed to fetch HOST pass price:", error);
      toast({ title: "AI Pricing Unavailable", description: "Could not fetch dynamic pricing for Host Pass. Using standard rates.", variant: "default", duration: 7000 });
      setHostPassPriceDetails({ passPrice: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 12.99 : 14.99, currency: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 'GBP' : 'USD', coffeePrice: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 3.50 : 3.00, justification: 'Unlock a full month of memory creation tools and preserve your precious moments.'});
    } finally { setIsFetchingHostPassPrice(false); }
  }, [isFetchingHostPassPrice, hostPassPriceDetails]);

  const fetchHostPassPrice = useCallback(() => { fetchHostPassPriceLogic(user); }, [user, fetchHostPassPriceLogic]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        let userDocSnap;
        try {
          userDocSnap = await getDoc(userDocRef);
        } catch (error: any) {
          console.error(`AuthContext: Firestore getDoc FAILED for user ${firebaseUser.uid}:`, error);
          let description = "Could not load your profile data. Please check your connection and try again.";
          if (error.code === 'permission-denied') {
            description = "Permission denied when trying to load your profile. This can happen if Firestore security rules are not correctly configured or if the Cloud Firestore API is not enabled. Please check your Firebase project settings.";
          } else if (error.message) {
            description = `Error loading profile: ${error.message}. Check connection and Firebase setup.`;
          }
          toast({ title: "Profile Load Error", description, variant: "destructive", duration: 10000 });
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          if (!initialLoadDone.current) {
            initialLoadDone.current = true;
          }
          return;
        }
        
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
          appUserInitial = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "New User",
            sharedAccessStatus: 'no_pass_initiated',
            hostPassStatus: 'no_pass_initiated',
            viewedSharedMemoryIds: [],
            storageUsedBytes: 0,
          };
          try {
            // Ensure we only write if the current auth user is the one we're creating the doc for
            if (auth.currentUser && auth.currentUser.uid === firebaseUser.uid) {
              await setDoc(userDocRef, { ...appUserInitial, createdAt: serverTimestamp() });
            } else {
              console.warn(`AuthContext: onAuthStateChanged - Mismatch between firebaseUser (${firebaseUser.uid}) and auth.currentUser (${auth.currentUser?.uid}). Skipping setDoc for new user profile.`);
            }
          } catch (error) {
            console.error(`AuthContext: Firestore setDoc FAILED for new user ${firebaseUser.uid}:`, error);
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            if (!initialLoadDone.current) {
              initialLoadDone.current = true;
            }
            return;
          }
        }
        
        // Only proceed if current auth state matches firebaseUser, important for pass status updates
        if (auth.currentUser && auth.currentUser.uid === firebaseUser.uid) {
            const appUserWithPassStatus = await checkAndUpdatePassStatus(appUserInitial);
            setUser(appUserWithPassStatus);
            setIsAuthenticated(true);
            
            checkIfGuestHasUnviewedMemories().then(hasUnviewed => {
              setHasNewSharedMemoriesState(hasUnviewed);
            });
            calculateAndUpdateStorageUsage(appUserWithPassStatus.id);
        } else {
             // This case handles a rapid auth state change; treat as if logged out for this specific run
            setUser(null);
            setIsAuthenticated(false);
            setHasNewSharedMemoriesState(false);
            console.warn(`AuthContext: onAuthStateChanged - Stale firebaseUser (${firebaseUser.uid}) detected after potential rapid sign-out/sign-in. Current auth.currentUser is ${auth.currentUser?.uid}. Treating as unauthenticated for this cycle.`);
        }
        
        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
        }
        setLoading(false);

      } else {
        setUser(null);
        setIsAuthenticated(false);
        setHasNewSharedMemoriesState(false);
        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
        }
        setLoading(false);
      }
    });
    return () => {
      unsubscribe();
    }
  }, [checkAndUpdatePassStatus, checkIfGuestHasUnviewedMemories, calculateAndUpdateStorageUsage]);


  useEffect(() => {
    if (loading || !initialLoadDone.current) {
      return;
    }

    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    const defaultAuthenticatedHostPath = '/prompts';
    const defaultAuthenticatedGuestPath = '/timeline';

    if (isAuthenticated) {
      const targetPath = userMode === 'host' ? defaultAuthenticatedHostPath : defaultAuthenticatedGuestPath;
      if (publicPaths.includes(pathname)) {
        if (pathname !== targetPath) {
          if (!isRedirectingFromAuthGuard.current) {
            console.log(`AuthContext: Authenticated user on public path '${pathname}'. Initiating redirect to '${targetPath}'.`);
            isRedirectingFromAuthGuard.current = true;
            router.push(targetPath);
          }
        } else {
          isRedirectingFromAuthGuard.current = false;
        }
      } else {
        isRedirectingFromAuthGuard.current = false;
      }
    } else { 
      isRedirectingFromAuthGuard.current = false;
      if (justLoggedOut.current) {
        justLoggedOut.current = false;
      } else if (!publicPaths.includes(pathname)) {
        if (pathname !== '/login') {
          console.log(`AuthContext: Unauthenticated user on protected path '${pathname}'. Redirecting to '/login'.`);
          router.push('/login');
        }
      }
    }
  }, [isAuthenticated, loading, pathname, router, userMode]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful", description: "Welcome back!" });
    } catch (error: any) {
      console.error("AuthContext: Login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
      setLoading(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const newUserProfile: Omit<User, 'id'> & { createdAt: Timestamp } = {
        email: firebaseUser.email || "",
        name: name,
        sharedAccessStatus: 'no_pass_initiated',
        hostPassStatus: 'no_pass_initiated',
        viewedSharedMemoryIds: [],
        storageUsedBytes: 0,
        createdAt: serverTimestamp() as Timestamp
      };
      // The setDoc operation will be guarded by security rules.
      // onAuthStateChanged will pick up the new user and attempt to load/create their profile.
      // We rely on onAuthStateChanged to handle the profile creation if it doesn't exist.
      // This avoids a race condition if setDoc here is slower than onAuthStateChanged triggering.
      // If onAuthStateChanged finds no doc, it will create one.
      toast({ title: "Registration Successful", description: "Welcome! Your account has been created." });
    } catch (error: any) {
      console.error("AuthContext: Registration error:", error);
      toast({ title: "Registration Failed", description: error.message || "Could not create account.", variant: "destructive" });
      // Ensure loading is false if register fails before onAuthStateChanged completes for the new user
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.email !== email) { // If auth state didn't change to this new user
        setLoading(false);
      }
      throw error;
    }
  }, []);


  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting user to null, isAuthenticated to false,
      // and subsequent redirection via the useEffect for route protection.
      justLoggedOut.current = true;
      router.push('/');
      setPendingRequestCountState(0);
      setUserModeState('host');
      setGuestPassPriceDetails(null);
      setHostPassPriceDetails(null);
    } catch (error) {
      console.error("AuthContext: Logout error:", error);
      toast({ title: "Logout Failed", variant: "destructive" });
    }
  }, [router]);

  const setPendingRequestCount = useCallback((count: number) => { setPendingRequestCountState(count); }, []);
  const handleModeChange = useCallback((newMode: UserMode) => { setUserModeState(newMode); }, []);
  const toggleUserMode = useCallback(() => { handleModeChange(userMode === 'host' ? 'guest' : 'host'); }, [userMode, handleModeChange]);
  const setUserMode = useCallback((mode: UserMode) => { if (userMode !== mode) { handleModeChange(mode); } }, [userMode, handleModeChange]);

  const activateFreeGuestPass = useCallback(async () => {
    if (user && user.sharedAccessStatus === 'no_pass_initiated' && auth.currentUser && auth.currentUser.uid === user.id) {
      const now = new Date();
      const updates: Partial<User> = { sharedAccessStatus: 'free_pass_active', freePassActivatedDate: now.toISOString() };
      await updateUserProfileInFirestore(user.id, updates);
      toast({ title: "Free Guest Pass Activated!", description: `Your 6-month free access to shared memories starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000 });
    } else { console.warn("AuthContext: activateFreeGuestPass - Conditions not met or auth mismatch.");}
  }, [user, updateUserProfileInFirestore]);

  const purchasePaidGuestPass = useCallback(async () => {
    if (user && auth.currentUser && auth.currentUser.uid === user.id) {
        toast({ title: "Initiating Guest Pass Purchase...", description: "Secure payment starting (Simulated for now).", duration: 3000 });
        const now = new Date(); let startDate = now;
        if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(now, parseISO(user.paidPassExpiryDate))) { startDate = parseISO(user.paidPassExpiryDate); }
        const newExpiryDate = addDays(startDate, 31);
        const updates: Partial<User> = { sharedAccessStatus: 'paid_pass_active', paidPassExpiryDate: newExpiryDate.toISOString() };
        await updateUserProfileInFirestore(user.id, updates);
        let currentPassPrice = guestPassPriceDetails;
        if (!currentPassPrice) { try { currentPassPrice = await getGuestPassPriceAction({ city: user.city || 'London', country: user.countryOfBirth || 'UK' }); setGuestPassPriceDetails(currentPassPrice); } catch (e) { /* ignore */ } }
        let priceMsg = "for your pass"; if (currentPassPrice) { priceMsg = `for ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: currentPassPrice.currency }).format(currentPassPrice.passPrice)}`; }
        toast({ title: "Guest Pass Activated (Payment Simulated)!", description: `Your 31-day guest pass ${priceMsg} is now active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000 });
    } else { console.warn("AuthContext: purchasePaidGuestPass - User is null or auth mismatch.");}
  }, [user, guestPassPriceDetails, updateUserProfileInFirestore]);

  const activateFreeHostPass = useCallback(async () => {
    if (user && user.hostPassStatus === 'no_pass_initiated' && auth.currentUser && auth.currentUser.uid === user.id) {
      const now = new Date();
      const updates: Partial<User> = { hostPassStatus: 'free_host_pass_active', freeHostPassActivatedDate: now.toISOString() };
      await updateUserProfileInFirestore(user.id, updates);
      toast({ title: "Free Host Pass Activated!", description: `Your 6-month free host pass starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000 });
    } else { console.warn("AuthContext: activateFreeHostPass - Conditions not met or auth mismatch.");}
  }, [user, updateUserProfileInFirestore]);

  const purchasePaidHostPass = useCallback(async () => {
    if (user && auth.currentUser && auth.currentUser.uid === user.id) {
      toast({ title: "Initiating Host Pass Purchase...", description: "Secure payment starting (Simulated for now).", duration: 3000 });
      const now = new Date(); let startDate = now;
      if (user.hostPassStatus === 'paid_host_pass_active' && user.paidHostPassExpiryDate && isBefore(now, parseISO(user.paidHostPassExpiryDate))) { startDate = parseISO(user.paidHostPassExpiryDate); }
      const newExpiryDate = addDays(startDate, 31);
      const updates: Partial<User> = { hostPassStatus: 'paid_host_pass_active', paidHostPassExpiryDate: newExpiryDate.toISOString() };
      await updateUserProfileInFirestore(user.id, updates);
      let currentHostPassPrice = hostPassPriceDetails;
      if (!currentHostPassPrice) { try { currentHostPassPrice = await getHostPassPriceAction({ city: user.city || 'London', country: user.countryOfBirth || 'UK' }); setHostPassPriceDetails(currentHostPassPrice); } catch (e) { /* ignore */ } }
      let priceMsg = "for your host pass"; if (currentHostPassPrice) { priceMsg = `for ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: currentHostPassPrice.currency }).format(currentHostPassPrice.passPrice)}`; }
      toast({ title: "Host Pass Activated (Payment Simulated)!", description: `Your 31-day host pass ${priceMsg} is now active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000 });
    } else { console.warn("AuthContext: purchasePaidHostPass - User is null or auth mismatch.");}
  }, [user, hostPassPriceDetails, updateUserProfileInFirestore]);


  const markSharedMemoryAsViewed = useCallback(async (memoryId: string) => {
    if (user && auth.currentUser && auth.currentUser.uid === user.id) {
      const currentViewedIds = user.viewedSharedMemoryIds || [];
      if (!currentViewedIds.includes(memoryId)) {
        await updateUserProfileInFirestore(user.id, { viewedSharedMemoryIds: [...currentViewedIds, memoryId] });
      }
    }
  }, [user, updateUserProfileInFirestore]);

  const getStorageQuotaBytes = useCallback((): number => (user && (user.hostPassStatus === 'free_host_pass_active' || user.hostPassStatus === 'paid_host_pass_active')) ? STANDARD_HOST_STORAGE_QUOTA_BYTES : 0, [user]);

  const resetHostPassForTesting = useCallback(async () => {
    if (user && auth.currentUser && auth.currentUser.uid === user.id) {
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
