
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
  console.log("AuthProvider: Mounting or re-rendering.");
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


  const updateUserProfileInFirestore = useCallback(async (userId: string, updates: Partial<User>) => {
    if (!userId) {
      console.warn("updateUserProfileInFirestore: userId is null or undefined. Skipping update.");
      return;
    }
    const userDocRef = doc(db, "users", userId);
    console.log(`AuthContext: Attempting to update user profile in Firestore for user ${userId} at path ${userDocRef.path} with updates:`, updates);
    try {
      await updateDoc(userDocRef, { ...updates, lastUpdated: serverTimestamp() });
      console.log(`AuthContext: User profile updated successfully in Firestore for user ${userId}.`);
      setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
    } catch (error) {
      console.error(`AuthContext: Error updating user profile in Firestore for user ${userId}:`, error);
    }
  }, []);


  const calculateAndUpdateStorageUsage = useCallback(async (userId: string) => {
    if (!userId) {
      console.warn("calculateAndUpdateStorageUsage: userId is null or undefined. Skipping calculation.");
      return;
    }
    console.log(`AuthContext: Calculating storage usage for user ${userId}...`);
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
        console.log(`AuthContext: Calculated storage for ${userId}: ${usedBytes} bytes.`);

        setUser(prevUser => {
          if (prevUser && prevUser.id === userId && prevUser.storageUsedBytes !== usedBytes) {
            console.log(`AuthContext: Updating storageUsedBytes in Firestore for ${userId} from ${prevUser.storageUsedBytes} to ${usedBytes}.`);
            updateUserProfileInFirestore(userId, { storageUsedBytes: usedBytes });
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
      // console.log("AuthContext: checkIfGuestHasUnviewedMemories - Not a guest or no user. Returning false.");
      return false;
    }
    // Placeholder: Real logic would query Firestore for memories shared *to* this user.
    console.log("AuthContext: checkIfGuestHasUnviewedMemories - Placeholder, returning false.");
    return false;
  }, [user, userMode]);

  const checkAndUpdatePassStatus = useCallback(async (currentUser: User): Promise<User> => {
    console.log("AuthContext: Checking and updating pass status for user:", currentUser.id);
    let updatedUser = { ...currentUser };
    const now = new Date();
    let guestStatusChanged = false;
    let hostStatusChanged = false;

    // Guest Pass Check
    if (updatedUser.sharedAccessStatus === 'free_pass_active' && updatedUser.freePassActivatedDate) {
      if (isBefore(addMonths(parseISO(updatedUser.freePassActivatedDate), 6), now)) {
        updatedUser.sharedAccessStatus = 'free_pass_expired';
        guestStatusChanged = true;
        console.log(`AuthContext: Guest free pass for ${currentUser.id} expired.`);
      }
    } else if (updatedUser.sharedAccessStatus === 'paid_pass_active' && updatedUser.paidPassExpiryDate) {
      if (isBefore(parseISO(updatedUser.paidPassExpiryDate), now)) {
        updatedUser.sharedAccessStatus = 'paid_pass_expired';
        guestStatusChanged = true;
        console.log(`AuthContext: Guest paid pass for ${currentUser.id} expired.`);
      }
    }

    // Host Pass Check
    if (updatedUser.hostPassStatus === 'free_host_pass_active' && updatedUser.freeHostPassActivatedDate) {
      if (isBefore(addMonths(parseISO(updatedUser.freeHostPassActivatedDate), 6), now)) {
        updatedUser.hostPassStatus = 'free_host_pass_expired';
        hostStatusChanged = true;
        console.log(`AuthContext: Host free pass for ${currentUser.id} expired.`);
      }
    } else if (updatedUser.hostPassStatus === 'paid_host_pass_active' && updatedUser.paidHostPassExpiryDate) {
      if (isBefore(parseISO(updatedUser.paidHostPassExpiryDate), now)) {
        updatedUser.hostPassStatus = 'paid_host_pass_expired';
        hostStatusChanged = true;
        console.log(`AuthContext: Host paid pass for ${currentUser.id} expired.`);
      }
    }

    if (guestStatusChanged || hostStatusChanged) {
        const updatesToSave: Partial<User> = {};
        if (guestStatusChanged) updatesToSave.sharedAccessStatus = updatedUser.sharedAccessStatus;
        if (hostStatusChanged) updatesToSave.hostPassStatus = updatedUser.hostPassStatus;

        console.log(`AuthContext: Pass status changed for ${currentUser.id}. Updating Firestore with:`, updatesToSave);
        await updateUserProfileInFirestore(currentUser.id, updatesToSave); // Await this critical update
    }
    return updatedUser;
  }, [updateUserProfileInFirestore]);

  const checkAndUpdateGuestPassStatus = useCallback(async () => {
    if (user) {
      // console.log("AuthContext: Manually called checkAndUpdateGuestPassStatus for user:", user.id);
      const updatedUser = await checkAndUpdatePassStatus(user);
      setUser(updatedUser);
    }
  }, [user, checkAndUpdatePassStatus]);

  const checkAndUpdateHostPassStatus = useCallback(async () => {
     if (user) {
      // console.log("AuthContext: Manually called checkAndUpdateHostPassStatus for user:", user.id);
      const updatedUser = await checkAndUpdatePassStatus(user);
      setUser(updatedUser);
    }
  }, [user, checkAndUpdatePassStatus]);


  const fetchGuestPassPriceLogic = useCallback(async (currentUserForPrice: User | null) => {
    if (isFetchingGuestPassPrice || guestPassPriceDetails) return;
    console.log("AuthContext: Attempting to fetch GUEST pass price...");
    setIsFetchingGuestPassPrice(true);
    try {
      const cityForPrice = currentUserForPrice?.city || 'London';
      const countryForPrice = currentUserForPrice?.countryOfBirth || 'UK';
      const priceData = await getGuestPassPriceAction({ city: cityForPrice, country: countryForPrice });
      setGuestPassPriceDetails(priceData);
      console.log("AuthContext: GUEST pass price fetched:", priceData);
    } catch (error) {
      console.error("AuthContext: Failed to fetch GUEST pass price:", error);
      toast({ title: "AI Pricing Unavailable", description: "Could not fetch dynamic pricing for Guest Pass. Using standard rates.", variant: "default", duration: 7000 });
      setGuestPassPriceDetails({passPrice: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 7.99 : 9.99, currency: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 'GBP' : 'USD', coffeePrice: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 3.50 : 3.00, justification: 'Enjoy a month of shared memories with our standard access pass.'});
    } finally { setIsFetchingGuestPassPrice(false); }
  }, [isFetchingGuestPassPrice, guestPassPriceDetails]);

  const fetchGuestPassPrice = useCallback(() => { fetchGuestPassPriceLogic(user); }, [user, fetchGuestPassPriceLogic]);

  const fetchHostPassPriceLogic = useCallback(async (currentUserForPrice: User | null) => {
    if (isFetchingHostPassPrice || hostPassPriceDetails) return;
    console.log("AuthContext: Attempting to fetch HOST pass price...");
    setIsFetchingHostPassPrice(true);
    try {
      const cityForPrice = currentUserForPrice?.city || 'London';
      const countryForPrice = currentUserForPrice?.countryOfBirth || 'UK';
      const priceData = await getHostPassPriceAction({ city: cityForPrice, country: countryForPrice });
      setHostPassPriceDetails(priceData);
      console.log("AuthContext: HOST pass price fetched:", priceData);
    } catch (error) {
      console.error("AuthContext: Failed to fetch HOST pass price:", error);
      toast({ title: "AI Pricing Unavailable", description: "Could not fetch dynamic pricing for Host Pass. Using standard rates.", variant: "default", duration: 7000 });
      setHostPassPriceDetails({ passPrice: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 12.99 : 14.99, currency: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 'GBP' : 'USD', coffeePrice: (currentUserForPrice?.countryOfBirth?.toLowerCase() === 'uk' || currentUserForPrice?.city?.toLowerCase() === 'london') ? 3.50 : 3.00, justification: 'Unlock a full month of memory creation tools and preserve your precious moments.'});
    } finally { setIsFetchingHostPassPrice(false); }
  }, [isFetchingHostPassPrice, hostPassPriceDetails]);

  const fetchHostPassPrice = useCallback(() => { fetchHostPassPriceLogic(user); }, [user, fetchHostPassPriceLogic]);

  useEffect(() => {
    console.log("AuthContext: Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log("AuthContext: onAuthStateChanged triggered. Firebase user:", firebaseUser ? firebaseUser.uid : 'null');
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        console.log(`AuthContext: Firebase user detected (${firebaseUser.uid}). Attempting to get user document from Firestore at path: ${userDocRef.path}`);
        let userDocSnap;
        try {
          userDocSnap = await getDoc(userDocRef);
          console.log(`AuthContext: Firestore getDoc for user ${firebaseUser.uid} successful. Exists: ${userDocSnap.exists()}`);
        } catch (error: any) {
          console.error(`AuthContext: Firestore getDoc FAILED for user ${firebaseUser.uid}:`, error);
          let description = "Could not load your profile data. Please check your connection and try again.";
          if (error.code === 'permission-denied') {
            description = "Permission denied when trying to load your profile. Please check Firestore security rules.";
          } else if (error.message) {
            description = `Error loading profile: ${error.message}. Check connection and Firebase setup.`;
          }
          toast({ title: "Profile Load Error", description, variant: "destructive", duration: 10000 });
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false); // Ensure loading is false on critical error
          if (!initialLoadDone.current) {
            initialLoadDone.current = true; // Mark initial load done even on error to unblock UI
          }
          return; // Stop further processing for this user
        }
        
        let appUserInitial: User;

        if (userDocSnap.exists()) {
          const dbUser = userDocSnap.data();
          console.log(`AuthContext: User document exists for ${firebaseUser.uid}. Data:`, dbUser);
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
          console.log(`AuthContext: User document does NOT exist for ${firebaseUser.uid}. Creating new profile.`);
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
            await setDoc(userDocRef, { ...appUserInitial, createdAt: serverTimestamp() });
            console.log(`AuthContext: New user profile created in Firestore for ${firebaseUser.uid}.`);
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

        const appUserWithPassStatus = await checkAndUpdatePassStatus(appUserInitial);
        setUser(appUserWithPassStatus);
        setIsAuthenticated(true);
        console.log("AuthContext: User set, isAuthenticated set to true. Current user state:", appUserWithPassStatus);
        
        checkIfGuestHasUnviewedMemories().then(hasUnviewed => {
          setHasNewSharedMemoriesState(hasUnviewed);
        });
        calculateAndUpdateStorageUsage(appUserWithPassStatus.id);
        
        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
        }
        setLoading(false); // Moved setLoading to after all initial async ops for the user
        console.log("AuthContext: setLoading(false) after user profile processing.");

      } else {
        console.log("AuthContext: onAuthStateChanged - Firebase user is null.");
        setUser(null);
        setIsAuthenticated(false);
        setHasNewSharedMemoriesState(false);
        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
        }
        setLoading(false);
        console.log("AuthContext: setLoading(false) for null user.");
      }
    });
    return () => {
      console.log("AuthContext: Unsubscribing from onAuthStateChanged listener.");
      unsubscribe();
    }
  }, [checkAndUpdatePassStatus, checkIfGuestHasUnviewedMemories, calculateAndUpdateStorageUsage]);


  useEffect(() => {
    console.log("AuthContext: Route protection useEffect running. isAuthenticated:", isAuthenticated, "loading:", loading, "pathname:", pathname, "initialLoadDone:", initialLoadDone.current, "justLoggedOut:", justLoggedOut.current);
    if (loading || !initialLoadDone.current) {
      console.log("AuthContext: Route protection useEffect - still loading or initial load not done. Skipping.");
      return;
    }

    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    const defaultAuthenticatedHostPath = '/prompts'; // Changed from /timeline for host
    const defaultAuthenticatedGuestPath = '/timeline';

    if (isAuthenticated) {
      if (publicPaths.includes(pathname)) {
        const targetPath = userMode === 'host' ? defaultAuthenticatedHostPath : defaultAuthenticatedGuestPath;
        console.log(`AuthContext: Authenticated user on public path '${pathname}'. Redirecting to '${targetPath}'.`);
        if (pathname !== targetPath) {
          router.push(targetPath);
          return; 
        }
      }
    } else { 
      if (justLoggedOut.current) {
        console.log("AuthContext: Not authenticated, but justLoggedOut is true. Resetting flag. Pathname should be '/' due to logout().");
        justLoggedOut.current = false; // Reset flag
        // No redirect here, logout function handles redirect to '/'
      } else if (!publicPaths.includes(pathname)) {
        console.log(`AuthContext: Unauthenticated user on protected path '${pathname}'. Redirecting to '/login'.`);
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
    console.log(`AuthContext: Attempting login for email: ${email}`);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log(`AuthContext: Login successful for ${email}. onAuthStateChanged will handle user state.`);
      toast({ title: "Login Successful", description: "Welcome back!" });
      // setLoading(false) will be handled by onAuthStateChanged
    } catch (error: any) {
      console.error("AuthContext: Login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
      setLoading(false); 
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    console.log(`AuthContext: Attempting registration for email: ${email}`);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log(`AuthContext: Firebase user created via Auth: ${firebaseUser.uid}. Creating Firestore profile.`);
      const newUserProfile: Omit<User, 'id'> & { createdAt: Timestamp } = {
        email: firebaseUser.email || "",
        name: name,
        sharedAccessStatus: 'no_pass_initiated',
        hostPassStatus: 'no_pass_initiated',
        viewedSharedMemoryIds: [],
        storageUsedBytes: 0,
        createdAt: serverTimestamp() as Timestamp
      };
      await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);
      console.log(`AuthContext: Firestore profile created for ${firebaseUser.uid}. onAuthStateChanged will handle user state.`);
      toast({ title: "Registration Successful", description: "Welcome! Your account has been created." });
      // setLoading(false) will be handled by onAuthStateChanged
    } catch (error: any) {
      console.error("AuthContext: Registration error:", error);
      toast({ title: "Registration Failed", description: error.message || "Could not create account.", variant: "destructive" });
      const currentUser = auth.currentUser;
      // Ensure loading is set to false if user creation fails and onAuthStateChanged doesn't pick up the new user
      if (!currentUser || currentUser.email !== email) {
        setLoading(false);
      }
      throw error;
    }
  }, []);


  const logout = useCallback(async () => {
    console.log("AuthContext: Attempting logout.");
    try {
      await firebaseSignOut(auth);
      console.log("AuthContext: firebaseSignOut successful. Setting justLoggedOut and pushing to '/'.");
      justLoggedOut.current = true; 
      router.push('/'); 
      setPendingRequestCountState(0);
      setUserModeState('host');
      setGuestPassPriceDetails(null);
      setHostPassPriceDetails(null);
      // setUser(null) and setIsAuthenticated(false) will be handled by onAuthStateChanged
      // setLoading(false) will also be handled by onAuthStateChanged
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
    if (user && user.sharedAccessStatus === 'no_pass_initiated') {
      console.log(`AuthContext: Activating free GUEST pass for user ${user.id}.`);
      const now = new Date();
      const updates: Partial<User> = { sharedAccessStatus: 'free_pass_active', freePassActivatedDate: now.toISOString() };
      await updateUserProfileInFirestore(user.id, updates);
      toast({ title: "Free Guest Pass Activated!", description: `Your 6-month free access to shared memories starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000 });
    } else { console.warn("AuthContext: activateFreeGuestPass - Conditions not met (user null or pass not 'no_pass_initiated').");}
  }, [user, updateUserProfileInFirestore]);

  const purchasePaidGuestPass = useCallback(async () => {
    if (user) {
        console.log(`AuthContext: Simulating purchase of paid GUEST pass for user ${user.id}.`);
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
    } else { console.warn("AuthContext: purchasePaidGuestPass - User is null.");}
  }, [user, guestPassPriceDetails, updateUserProfileInFirestore]);

  const activateFreeHostPass = useCallback(async () => {
    if (user && user.hostPassStatus === 'no_pass_initiated') {
      console.log(`AuthContext: Activating free HOST pass for user ${user.id}.`);
      const now = new Date();
      const updates: Partial<User> = { hostPassStatus: 'free_host_pass_active', freeHostPassActivatedDate: now.toISOString() };
      await updateUserProfileInFirestore(user.id, updates);
      toast({ title: "Free Host Pass Activated!", description: `Your 6-month free host pass starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000 });
    } else { console.warn("AuthContext: activateFreeHostPass - Conditions not met (user null or pass not 'no_pass_initiated').");}
  }, [user, updateUserProfileInFirestore]);

  const purchasePaidHostPass = useCallback(async () => {
    if (user) {
      console.log(`AuthContext: Simulating purchase of paid HOST pass for user ${user.id}.`);
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
    } else { console.warn("AuthContext: purchasePaidHostPass - User is null.");}
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
      console.log(`AuthContext: Resetting HOST pass for testing for user ${user.id}.`);
      const updates: Partial<User> = { hostPassStatus: 'no_pass_initiated', freeHostPassActivatedDate: undefined, paidHostPassExpiryDate: undefined };
      await updateUserProfileInFirestore(user.id, updates);
      setHostPassPriceDetails(null); // Reset price details as well
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
