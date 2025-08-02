
"use client";

import type { User, UserMode, Memory as MemoryType } from '@/types';
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, Timestamp, onSnapshot, Unsubscribe, orderBy } from 'firebase/firestore';


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

  activateFreeGuestPass: () => Promise<void>;
  purchasePaidGuestPass: () => Promise<void>;
  guestPassPriceDetails: GetGuestPassPriceOutput | null;
  isFetchingGuestPassPrice: boolean;

  activateFreeHostPass: () => Promise<void>;
  purchasePaidHostPass: () => Promise<void>;
  hostPassStatus: User['hostPassStatus'];
  hostPassPriceDetails: GetHostPassPriceOutput | null;
  isFetchingHostPassPrice: boolean;
  
  storageQuotaBytes: number;
  calculateAndUpdateStorageUsage: (userId: string) => Promise<void>;
  updateUserProfileInFirestore: (userId: string, updates: Partial<User>) => Promise<void>;
  
  memories: MemoryType[];
  completedPromptIds: Set<string>;
  flaggedPromptIds: Set<string>;
  isDataLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMode, setUserModeState] = useState<UserMode>('host');
  
  const [pendingRequestCount, setPendingRequestCountState] = useState<number>(0);
  const [hasNewSharedMemories, setHasNewSharedMemoriesState] = useState(false); // Retained for future use
  const [guestPassPriceDetails, setGuestPassPriceDetails] = useState<GetGuestPassPriceOutput | null>(null);
  const [isFetchingGuestPassPrice, setIsFetchingGuestPassPrice] = useState(false);
  const [hostPassPriceDetails, setHostPassPriceDetails] = useState<GetHostPassPriceOutput | null>(null);
  const [isFetchingHostPassPrice, setIsFetchingHostPassPrice] = useState(false);
  
  const [memories, setMemories] = useState<MemoryType[]>([]);
  const [completedPromptIds, setCompletedPromptIds] = useState<Set<string>>(new Set());
  const [flaggedPromptIds, setFlaggedPromptIds] = useState<Set<string>>(new Set());
  const [isDataLoading, setIsDataLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  // --- Listener and State Management ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        // This onSnapshot listener will handle ALL user document updates.
        const userUnsubscribe = onSnapshot(userDocRef, async (userDocSnap) => {
          if (userDocSnap.exists()) {
            let dbUser = userDocSnap.data() as User;
            
            // Check for and apply pass status updates if needed
            const now = new Date();
            let updatesToSave: Partial<User> = {};
            if (dbUser.sharedAccessStatus === 'free_pass_active' && dbUser.freePassActivatedDate && isBefore(addMonths(parseISO(dbUser.freePassActivatedDate), 6), now)) {
              updatesToSave.sharedAccessStatus = 'free_pass_expired';
            } else if (dbUser.sharedAccessStatus === 'paid_pass_active' && dbUser.paidPassExpiryDate && isBefore(parseISO(dbUser.paidPassExpiryDate), now)) {
              updatesToSave.sharedAccessStatus = 'paid_pass_expired';
            }
            if (dbUser.hostPassStatus === 'free_host_pass_active' && dbUser.freeHostPassActivatedDate && isBefore(addMonths(parseISO(dbUser.freeHostPassActivatedDate), 6), now)) {
              updatesToSave.hostPassStatus = 'free_host_pass_expired';
            } else if (dbUser.hostPassStatus === 'paid_host_pass_active' && dbUser.paidHostPassExpiryDate && isBefore(parseISO(dbUser.paidHostPassExpiryDate), now)) {
              updatesToSave.hostPassStatus = 'paid_host_pass_expired';
            }

            if (Object.keys(updatesToSave).length > 0) {
              await updateDoc(userDocRef, { ...updatesToSave, lastUpdated: serverTimestamp() });
              // The listener will re-fire with the updated data, so we don't need to set state here.
            } else {
              setUser({ ...dbUser, id: firebaseUser.uid, email: firebaseUser.email || dbUser.email });
            }
          } else {
            // Create user doc if it doesn't exist (first registration)
            const newUser: User = {
              id: firebaseUser.uid, email: firebaseUser.email!, name: firebaseUser.displayName || "New User",
              sharedAccessStatus: 'no_pass_initiated', hostPassStatus: 'no_pass_initiated', viewedSharedMemoryIds: [], storageUsedBytes: 0,
            };
            await setDoc(userDocRef, { ...newUser, createdAt: serverTimestamp() });
            setUser(newUser);
          }
        });
        setLoading(false);
        return () => userUnsubscribe();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let memoriesUnsubscribe: Unsubscribe | undefined;
    let promptsUnsubscribe: Unsubscribe | undefined;

    if (user?.id) {
      setIsDataLoading(true);
      const memoriesQuery = query(collection(db, "users", user.id, "memories"), orderBy('date', 'desc'));
      memoriesUnsubscribe = onSnapshot(memoriesQuery, (snapshot) => {
        const fetchedMemories = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id, ...data,
            date: (data.date as Timestamp)?.toDate ? (data.date as Timestamp).toDate().toISOString() : data.date,
          } as MemoryType;
        });
        setMemories(fetchedMemories);
        setCompletedPromptIds(new Set(fetchedMemories.map(m => m.promptId).filter(Boolean) as string[]));
        setIsDataLoading(false);
      }, (error) => { console.error("Error listening to memories:", error); setIsDataLoading(false); });

      const promptFlagsDocRef = doc(db, 'userPromptFlags', user.id);
      promptsUnsubscribe = onSnapshot(promptFlagsDocRef, (docSnap) => {
        setFlaggedPromptIds(new Set(Object.entries(docSnap.data() || {}).filter(([, v]) => v === true).map(([k]) => k)));
      }, (error) => console.error("Error listening to prompt flags:", error));
      
    } else {
      setMemories([]); setCompletedPromptIds(new Set()); setFlaggedPromptIds(new Set()); setIsDataLoading(false);
    }
    return () => {
      if (memoriesUnsubscribe) memoriesUnsubscribe();
      if (promptsUnsubscribe) promptsUnsubscribe();
    };
  }, [user?.id]); // Depend only on user.id

  // --- Navigation Logic ---

  useEffect(() => {
    if (loading) return;
    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    const isPublic = publicPaths.some(path => pathname.startsWith(path));
    if (user && isPublic) {
      router.push(userMode === 'host' ? '/prompts' : '/timeline');
    } else if (!user && !isPublic) {
      router.push('/login');
    }
  }, [user, loading, pathname, router, userMode]);

  // --- Memoized Functions for Context API ---

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful", description: "Welcome back!" });
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener handles user document creation.
      toast({ title: "Registration Successful", description: "Welcome! Your account has been created." });
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message || "Could not create account.", variant: "destructive" });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      // State reset is handled by onAuthStateChanged
      setUserModeState('host');
      setGuestPassPriceDetails(null);
      setHostPassPriceDetails(null);
      router.push('/');
    } catch (error: any) {
      toast({ title: "Logout Failed", variant: "destructive" });
    }
  }, [router]);
  
  const updateUserProfileInFirestore = useCallback(async (userId: string, updates: Partial<User>) => {
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { ...updates, lastUpdated: serverTimestamp() });
    } catch (error: any) {
      console.error(`AuthContext: Error updating user profile in Firestore for user ${userId}:`, error);
      throw error;
    }
  }, []);

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
    try {
        const q = query(collection(db, "users", userId, "memories"));
        const snapshot = await getDocs(q);
        const usedBytes = snapshot.docs.reduce((acc, docSnap) => acc + (docSnap.data().mediaAttachments || []).reduce((sum: number, att: any) => sum + (att.size || 0), 0), 0);
        await updateUserProfileInFirestore(userId, { storageUsedBytes: usedBytes });
    } catch (error) {
        console.error(`AuthContext: Error calculating storage usage for user ${userId}:`, error);
    }
  }, [updateUserProfileInFirestore]);
  
  const getStorageQuotaBytes = useCallback((): number => (user && (user.hostPassStatus === 'free_host_pass_active' || user.hostPassStatus === 'paid_host_pass_active')) ? STANDARD_HOST_STORAGE_QUOTA_BYTES : 0, [user]);

  const fetchGuestPassPrice = useCallback(async () => {
    if (isFetchingGuestPassPrice || guestPassPriceDetails || !user) return;
    setIsFetchingGuestPassPrice(true);
    try {
      const priceData = await getGuestPassPriceAction({ city: user.city || 'London', country: user.countryOfBirth || 'UK' });
      setGuestPassPriceDetails(priceData);
    } catch (error) {
      console.error("AuthContext: Failed to fetch GUEST pass price:", error);
    } finally { setIsFetchingGuestPassPrice(false); }
  }, [isFetchingGuestPassPrice, guestPassPriceDetails, user]);

  const fetchHostPassPrice = useCallback(async () => {
    if (isFetchingHostPassPrice || hostPassPriceDetails || !user) return;
    setIsFetchingHostPassPrice(true);
    try {
      const priceData = await getHostPassPriceAction({ city: user.city || 'London', country: user.countryOfBirth || 'UK' });
      setHostPassPriceDetails(priceData);
    } catch (error) {
      console.error("AuthContext: Failed to fetch HOST pass price:", error);
    } finally { setIsFetchingHostPassPrice(false); }
  }, [isFetchingHostPassPrice, hostPassPriceDetails, user]);
  
  useEffect(() => {
    if (user && userMode === 'guest') {
        fetchGuestPassPrice();
    } else if (user && userMode === 'host') {
        fetchHostPassPrice();
    }
  }, [user, userMode, fetchGuestPassPrice, fetchHostPassPrice]);


  // --- Final Context Value ---

  const contextValue = useMemo(() => ({
      isAuthenticated: !!user,
      user,
      login, register, logout, loading,
      pendingRequestCount, setPendingRequestCount: setPendingRequestCountState,
      userMode, toggleUserMode: () => setUserModeState(p => p === 'host' ? 'guest' : 'host'), setUserMode: setUserModeState,
      activateFreeGuestPass, purchasePaidGuestPass,
      guestPassPriceDetails, isFetchingGuestPassPrice,
      activateFreeHostPass, purchasePaidHostPass,
      hostPassStatus: user?.hostPassStatus || 'no_pass_initiated',
      hostPassPriceDetails, isFetchingHostPassPrice,
      storageQuotaBytes: getStorageQuotaBytes(),
      calculateAndUpdateStorageUsage,
      updateUserProfileInFirestore,
      memories,
      completedPromptIds,
      flaggedPromptIds,
      isDataLoading,
      // Deprecated/stubbed functions removed for clarity
      setHasNewSharedMemories: () => {},
      markSharedMemoryAsViewed,
  }), [
      user, loading, pendingRequestCount, userMode,
      guestPassPriceDetails, isFetchingGuestPassPrice, hostPassPriceDetails, isFetchingHostPassPrice,
      memories, completedPromptIds, flaggedPromptIds, isDataLoading,
      login, register, logout, activateFreeGuestPass, purchasePaidGuestPass,
      markSharedMemoryAsViewed, fetchGuestPassPrice, activateFreeHostPass, purchasePaidHostPass,
      fetchHostPassPrice, getStorageQuotaBytes,
      calculateAndUpdateStorageUsage, updateUserProfileInFirestore
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
