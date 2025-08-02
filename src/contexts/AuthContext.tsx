
"use client";

import type { User, UserMode, Memory as MemoryType } from '@/types';
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { addMonths, addDays, isBefore, parseISO, format } from 'date-fns';
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
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, Timestamp, onSnapshot, Unsubscribe, orderBy } from 'firebase/firestore';


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
  updateUserProfileInFirestore: (userId: string, updates: Partial<User>) => Promise<void>;
  
  // New properties for centralized data
  memories: MemoryType[];
  completedPromptIds: Set<string>;
  flaggedPromptIds: Set<string>;
  isDataLoading: boolean;
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
  
  // New state for centralized data
  const [memories, setMemories] = useState<MemoryType[]>([]);
  const [completedPromptIds, setCompletedPromptIds] = useState<Set<string>>(new Set());
  const [flaggedPromptIds, setFlaggedPromptIds] = useState<Set<string>>(new Set());
  const [isDataLoading, setIsDataLoading] = useState(true);


  const router = useRouter();
  const pathname = usePathname();
  const isRedirectingFromAuthGuard = useRef(false);

  // STABLE: This function updates Firestore and is wrapped in useCallback.
  const updateUserProfileInFirestore = useCallback(async (userId: string, updates: Partial<User>) => {
    if (!userId) return;
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { ...updates, lastUpdated: serverTimestamp() });
      setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
    } catch (error: any) {
      console.error(`AuthContext: Error updating user profile in Firestore for user ${userId}:`, error);
    }
  }, []);

  // STABLE: This function checks pass statuses and is wrapped in useCallback.
  const checkAndUpdatePassStatus = useCallback(async (currentUser: User): Promise<User> => {
    let updatedUser = { ...currentUser };
    const now = new Date();
    let updatesToSave: Partial<User> = {};

    if (updatedUser.sharedAccessStatus === 'free_pass_active' && updatedUser.freePassActivatedDate) {
      if (isBefore(addMonths(parseISO(updatedUser.freePassActivatedDate), 6), now)) {
        updatesToSave.sharedAccessStatus = 'free_pass_expired';
      }
    } else if (updatedUser.sharedAccessStatus === 'paid_pass_active' && updatedUser.paidPassExpiryDate) {
      if (isBefore(parseISO(updatedUser.paidPassExpiryDate), now)) {
        updatesToSave.sharedAccessStatus = 'paid_pass_expired';
      }
    }

    if (updatedUser.hostPassStatus === 'free_host_pass_active' && updatedUser.freeHostPassActivatedDate) {
      if (isBefore(addMonths(parseISO(updatedUser.freeHostPassActivatedDate), 6), now)) {
        updatesToSave.hostPassStatus = 'free_host_pass_expired';
      }
    } else if (updatedUser.hostPassStatus === 'paid_host_pass_active' && updatedUser.paidHostPassExpiryDate) {
      if (isBefore(parseISO(updatedUser.paidHostPassExpiryDate), now)) {
        updatesToSave.hostPassStatus = 'paid_host_pass_expired';
      }
    }

    if (Object.keys(updatesToSave).length > 0) {
        await updateUserProfileInFirestore(currentUser.id, updatesToSave);
        return { ...updatedUser, ...updatesToSave };
    }
    return updatedUser;
  }, [updateUserProfileInFirestore]);


  // STABLE: onAuthChange is wrapped in useCallback.
  const onAuthChange = useCallback(async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let appUserInitial: User;
        if (userDocSnap.exists()) {
          const dbUser = userDocSnap.data();
          appUserInitial = {
            id: firebaseUser.uid,
            email: firebaseUser.email || dbUser.email,
            name: dbUser.name || firebaseUser.displayName || "New User",
            profileInfo: dbUser.profileInfo, avatarUrl: dbUser.avatarUrl, dateOfBirth: dbUser.dateOfBirth, countryOfBirth: dbUser.countryOfBirth, city: dbUser.city, townArea: dbUser.townArea,
            sharedAccessStatus: dbUser.sharedAccessStatus || 'no_pass_initiated', freePassActivatedDate: dbUser.freePassActivatedDate, paidPassExpiryDate: dbUser.paidPassExpiryDate,
            hostPassStatus: dbUser.hostPassStatus || 'no_pass_initiated', freeHostPassActivatedDate: dbUser.freeHostPassActivatedDate, paidHostPassExpiryDate: dbUser.paidHostPassExpiryDate,
            viewedSharedMemoryIds: dbUser.viewedSharedMemoryIds || [], storageUsedBytes: dbUser.storageUsedBytes || 0,
          };
        } else {
          appUserInitial = {
            id: firebaseUser.uid, email: firebaseUser.email || "", name: firebaseUser.displayName || "New User",
            sharedAccessStatus: 'no_pass_initiated', hostPassStatus: 'no_pass_initiated', viewedSharedMemoryIds: [], storageUsedBytes: 0,
          };
          await setDoc(userDocRef, { ...appUserInitial, createdAt: serverTimestamp() });
        }
        
        const appUserWithPassStatus = await checkAndUpdatePassStatus(appUserInitial);
        setUser(appUserWithPassStatus);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
  }, [checkAndUpdatePassStatus]);

  // This effect manages the core auth listener. It runs only once.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, onAuthChange);
    return () => unsubscribe();
  }, [onAuthChange]);

  // Centralize Firestore listeners. This now depends only on `user.id`.
  useEffect(() => {
    let memoriesUnsubscribe: Unsubscribe | undefined;
    let promptsUnsubscribe: Unsubscribe | undefined;

    if (user?.id) {
      setIsDataLoading(true);
      const memoriesQuery = query(collection(db, "users", user.id, "memories"), orderBy('date', 'desc'));
      memoriesUnsubscribe = onSnapshot(memoriesQuery, (snapshot) => {
        const fetchedMemories = snapshot.docs.map(docSnap => ({
          id: docSnap.id, ...docSnap.data(),
          date: (docSnap.data().date as Timestamp)?.toDate ? (docSnap.data().date as Timestamp).toDate().toISOString() : docSnap.data().date as string,
          createdAt: (docSnap.data().createdAt as Timestamp)?.toDate ? (docSnap.data().createdAt as Timestamp).toDate().toISOString() : undefined,
          updatedAt: (docSnap.data().updatedAt as Timestamp)?.toDate ? (docSnap.data().updatedAt as Timestamp).toDate().toISOString() : undefined,
        })) as MemoryType[];
        setMemories(fetchedMemories);
        setCompletedPromptIds(new Set(fetchedMemories.map(m => m.promptId).filter(Boolean) as string[]));
      }, (error) => console.error("Error listening to memories:", error));

      const promptFlagsDocRef = doc(db, 'userPromptFlags', user.id);
      promptsUnsubscribe = onSnapshot(promptFlagsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFlaggedPromptIds(new Set(Object.entries(data).filter(([_, v]) => v === true).map(([k]) => k)));
        } else {
          setFlaggedPromptIds(new Set());
        }
      }, (error) => console.error("Error listening to prompt flags:", error));
      
      setIsDataLoading(false);
    } else {
      setMemories([]); setCompletedPromptIds(new Set()); setFlaggedPromptIds(new Set()); setIsDataLoading(false);
    }

    return () => {
      if (memoriesUnsubscribe) memoriesUnsubscribe();
      if (promptsUnsubscribe) promptsUnsubscribe();
    };
  }, [user?.id]); // STABLE DEPENDENCY: This now only runs when the user logs in/out.


  useEffect(() => {
    if (loading) return;
    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    const isPublic = publicPaths.includes(pathname);
    if (isAuthenticated && isPublic) {
      router.push(userMode === 'host' ? '/prompts' : '/timeline');
    } else if (!isAuthenticated && !isPublic) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, pathname, router, userMode]);

  // STABLE: All functions provided by the context are now wrapped in useCallback.
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful", description: "Welcome back!" });
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
      setLoading(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const appUserInitial: User = { id: userCredential.user.uid, email, name, sharedAccessStatus: 'no_pass_initiated', hostPassStatus: 'no_pass_initiated', viewedSharedMemoryIds: [], storageUsedBytes: 0, };
      await setDoc(userDocRef, { ...appUserInitial, createdAt: serverTimestamp() });
      toast({ title: "Registration Successful", description: "Welcome! Your account has been created." });
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message || "Could not create account.", variant: "destructive" });
      setLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/');
      setUserModeState('host');
      setGuestPassPriceDetails(null);
      setHostPassPriceDetails(null);
    } catch (error: any) {
      toast({ title: "Logout Failed", variant: "destructive" });
    }
  }, [router]);
  
  const fetchGuestPassPrice = useCallback(async () => {
    if (isFetchingGuestPassPrice || guestPassPriceDetails) return;
    setIsFetchingGuestPassPrice(true);
    try {
      const priceData = await getGuestPassPriceAction({ city: user?.city || 'London', country: user?.countryOfBirth || 'UK' });
      setGuestPassPriceDetails(priceData);
    } catch (error) {
      console.error("AuthContext: Failed to fetch GUEST pass price:", error);
    } finally { setIsFetchingGuestPassPrice(false); }
  }, [isFetchingGuestPassPrice, guestPassPriceDetails, user?.city, user?.countryOfBirth]);

  const fetchHostPassPrice = useCallback(async () => {
    if (isFetchingHostPassPrice || hostPassPriceDetails) return;
    setIsFetchingHostPassPrice(true);
    try {
      const priceData = await getHostPassPriceAction({ city: user?.city || 'London', country: user?.countryOfBirth || 'UK' });
      setHostPassPriceDetails(priceData);
    } catch (error) {
      console.error("AuthContext: Failed to fetch HOST pass price:", error);
    } finally { setIsFetchingHostPassPrice(false); }
  }, [isFetchingHostPassPrice, hostPassPriceDetails, user?.city, user?.countryOfBirth]);

  const activateFreeGuestPass = useCallback(async () => {
    if (user && user.sharedAccessStatus === 'no_pass_initiated') {
      const now = new Date();
      await updateUserProfileInFirestore(user.id, { sharedAccessStatus: 'free_pass_active', freePassActivatedDate: now.toISOString() });
      toast({ title: "Free Guest Pass Activated!", description: `Your 6-month free access starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000 });
    }
  }, [user, updateUserProfileInFirestore]);

  const purchasePaidGuestPass = useCallback(async () => {
    if (user) {
        const now = new Date(); let startDate = now;
        if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(now, parseISO(user.paidPassExpiryDate))) { startDate = parseISO(user.paidPassExpiryDate); }
        const newExpiryDate = addDays(startDate, 31);
        await updateUserProfileInFirestore(user.id, { sharedAccessStatus: 'paid_pass_active', paidPassExpiryDate: newExpiryDate.toISOString() });
        toast({ title: "Guest Pass Activated (Payment Simulated)!", description: `Your 31-day pass is active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000 });
    }
  }, [user, updateUserProfileInFirestore]);

  const activateFreeHostPass = useCallback(async () => {
    if (user && user.hostPassStatus === 'no_pass_initiated') {
      const now = new Date();
      await updateUserProfileInFirestore(user.id, { hostPassStatus: 'free_host_pass_active', freeHostPassActivatedDate: now.toISOString() });
      toast({ title: "Free Host Pass Activated!", description: `Your 6-month free host pass starts now. Ends ${format(addMonths(now, 6), 'PPP')}.`, duration: 7000 });
    }
  }, [user, updateUserProfileInFirestore]);

  const purchasePaidHostPass = useCallback(async () => {
    if (user) {
      const now = new Date(); let startDate = now;
      if (user.hostPassStatus === 'paid_host_pass_active' && user.paidHostPassExpiryDate && isBefore(now, parseISO(user.paidHostPassExpiryDate))) { startDate = parseISO(user.paidHostPassExpiryDate); }
      const newExpiryDate = addDays(startDate, 31);
      await updateUserProfileInFirestore(user.id, { hostPassStatus: 'paid_host_pass_active', paidHostPassExpiryDate: newExpiryDate.toISOString() });
      toast({ title: "Host Pass Activated (Payment Simulated)!", description: `Your 31-day host pass is active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000 });
    }
  }, [user, updateUserProfileInFirestore]);

  const markSharedMemoryAsViewed = useCallback(async (memoryId: string) => {
    if (user) {
      const currentViewedIds = user.viewedSharedMemoryIds || [];
      if (!currentViewedIds.includes(memoryId)) {
        await updateUserProfileInFirestore(user.id, { viewedSharedMemoryIds: [...currentViewedIds, memoryId] });
      }
    }
  }, [user, updateUserProfileInFirestore]);

  const calculateAndUpdateStorageUsage = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
        const q = query(collection(db, "users", userId, "memories"));
        const snapshot = await getDocs(q);
        const usedBytes = snapshot.docs.reduce((acc, docSnap) => {
          const memory = docSnap.data() as MemoryType;
          return acc + (memory.mediaAttachments || []).reduce((sum, att) => sum + (att.size || 0), 0);
        }, 0);
        await updateUserProfileInFirestore(userId, { storageUsedBytes: usedBytes });
    } catch (error) {
        console.error(`AuthContext: Error calculating storage usage for user ${userId}:`, error);
    }
  }, [updateUserProfileInFirestore]);
  
  const getStorageQuotaBytes = useCallback((): number => (user && (user.hostPassStatus === 'free_host_pass_active' || user.hostPassStatus === 'paid_host_pass_active')) ? STANDARD_HOST_STORAGE_QUOTA_BYTES : 0, [user]);

  const resetHostPassForTesting = useCallback(async () => {
    if (user) {
      await updateUserProfileInFirestore(user.id, { hostPassStatus: 'no_pass_initiated', freeHostPassActivatedDate: undefined, paidHostPassExpiryDate: undefined });
      setHostPassPriceDetails(null); 
      toast({ title: "Host Pass Reset (Testing)", description: "Host pass status has been reset." });
    }
  }, [user, updateUserProfileInFirestore]);
  
  const checkAndUpdateGuestPassStatus = useCallback(() => { if (user) checkAndUpdatePassStatus(user); }, [user, checkAndUpdatePassStatus]);
  const checkAndUpdateHostPassStatus = useCallback(() => { if (user) checkAndUpdatePassStatus(user); }, [user, checkAndUpdatePassStatus]);
  const checkIfGuestHasUnviewedMemories = useCallback(async (): Promise<boolean> => { return false; }, []);

  const setPendingRequestCount = useCallback((count: number) => { setPendingRequestCountState(count); }, []);
  const toggleUserMode = useCallback(() => { setUserModeState(p => p === 'host' ? 'guest' : 'host'); }, []);
  const setHasNewSharedMemories = useCallback((status: boolean) => { setHasNewSharedMemoriesState(status); }, []);


  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, login, register, logout, loading,
      pendingRequestCount, setPendingRequestCount,
      userMode, toggleUserMode, setUserMode: setUserModeState,
      activateFreeGuestPass, purchasePaidGuestPass, checkAndUpdateGuestPassStatus,
      hasNewSharedMemories, setHasNewSharedMemories,
      markSharedMemoryAsViewed, checkIfGuestHasUnviewedMemories,
      guestPassPriceDetails, fetchGuestPassPrice, isFetchingGuestPassPrice,
      activateFreeHostPass, purchasePaidHostPass, checkAndUpdateHostPassStatus,
      hostPassStatus: user?.hostPassStatus || 'no_pass_initiated',
      hostPassPriceDetails, fetchHostPassPrice, isFetchingHostPassPrice,
      resetHostPassForTesting,
      storageQuotaBytes: getStorageQuotaBytes(),
      calculateAndUpdateStorageUsage,
      updateUserProfileInFirestore,
      memories,
      completedPromptIds,
      flaggedPromptIds,
      isDataLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
