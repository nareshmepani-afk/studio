
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
import { Loader2 } from 'lucide-react';


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
  getLatestMemories: () => MemoryType[];
  completedPromptIds: Set<string>;
  flaggedPromptIds: Set<string>;
  isDataLoading: boolean; 
  markSharedMemoryAsViewed: (memoryId: string) => Promise<void>;
  hasNewSharedMemories: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); 
  const [isDataLoading, setIsDataLoading] = useState(true); 
  const [userMode, setUserModeState] = useState<UserMode>('host');
  
  const [pendingRequestCount, setPendingRequestCountState] = useState<number>(0);
  const [guestPassPriceDetails, setGuestPassPriceDetails] = useState<GetGuestPassPriceOutput | null>(null);
  const [isFetchingGuestPassPrice, setIsFetchingGuestPassPrice] = useState(false);
  const [hostPassPriceDetails, setHostPassPriceDetails] = useState<GetHostPassPriceOutput | null>(null);
  const [isFetchingHostPassPrice, setIsFetchingHostPassPrice] = useState(false);
  
  const [memories, setMemories] = useState<MemoryType[]>([]);
  const [completedPromptIds, setCompletedPromptIds] = useState<Set<string>>(new Set());
  const [flaggedPromptIds, setFlaggedPromptIds] = useState<Set<string>>(new Set());
  
  const [hasNewSharedMemories, setHasNewSharedMemories] = useState(false);


  const router = useRouter();
  const pathname = usePathname();

  const updateUserProfileInFirestore = useCallback(async (userId: string, updates: Partial<User>) => {
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { ...updates, lastUpdated: serverTimestamp() });
    } catch (error: any) {
      console.error(`AuthContext: Error updating user profile in Firestore for user ${userId}:`, error);
      throw error;
    }
  }, []);

  // Listener and State Management
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, async (userDocSnap) => {
          if (userDocSnap.exists()) {
            const userData = { id: firebaseUser.uid, ...userDocSnap.data() } as User;
            setUser(userData);
            
            const checkAndUpdatePassStatuses = async () => {
                const now = new Date();
                let updatesToSave: Partial<User> = {};
                if (userData.sharedAccessStatus === 'free_pass_active' && userData.freePassActivatedDate && isBefore(addMonths(parseISO(userData.freePassActivatedDate), 6), now)) updatesToSave.sharedAccessStatus = 'free_pass_expired';
                if (userData.sharedAccessStatus === 'paid_pass_active' && userData.paidPassExpiryDate && isBefore(parseISO(userData.paidPassExpiryDate), now)) updatesToSave.sharedAccessStatus = 'paid_pass_expired';
                if (userData.hostPassStatus === 'free_host_pass_active' && userData.freeHostPassActivatedDate && isBefore(addMonths(parseISO(userData.freeHostPassActivatedDate), 6), now)) updatesToSave.hostPassStatus = 'free_host_pass_expired';
                if (userData.hostPassStatus === 'paid_host_pass_active' && userData.paidHostPassExpiryDate && isBefore(parseISO(userData.paidHostPassExpiryDate), now)) updatesToSave.hostPassStatus = 'paid_host_pass_expired';
                if (Object.keys(updatesToSave).length > 0) await updateUserProfileInFirestore(userData.id, updatesToSave);
            };
            checkAndUpdatePassStatuses();

          } else {
            const newUser: User = {
              id: firebaseUser.uid, email: firebaseUser.email!, name: firebaseUser.displayName || "New User",
              sharedAccessStatus: 'no_pass_initiated', hostPassStatus: 'no_pass_initiated', viewedSharedMemoryIds: [], storageUsedBytes: 0,
            };
            await setDoc(userDocRef, { ...newUser, createdAt: serverTimestamp() });
            setUser(newUser);
          }
        });
        return () => unsubscribeUser();
      } else {
        setUser(null);
        setMemories([]);
        setCompletedPromptIds(new Set());
        setFlaggedPromptIds(new Set());
        setLoading(false);
        setIsDataLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [updateUserProfileInFirestore]);

  // Data fetching listeners that depend on user.id
  useEffect(() => {
    if (!user?.id) {
      if (!loading) { // Only set loading to false if it's not already false from auth turning null
        setLoading(false);
      }
      setIsDataLoading(false); // No user, so no data to load.
      return;
    }
    
    setIsDataLoading(true);

    const memoriesQuery = query(collection(db, "users", user.id, "memories"), orderBy('date', 'desc'));
    const unsubscribeMemories = onSnapshot(memoriesQuery, (snapshot) => {
      const fetchedMemories = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id, ...data,
          date: (data.date as Timestamp)?.toDate ? (data.date as Timestamp).toDate().toISOString() : data.date,
        } as MemoryType;
      });
      setMemories(fetchedMemories);
      setCompletedPromptIds(new Set(fetchedMemories.map(m => m.promptId).filter(Boolean) as string[]));
      
      const viewedIds = new Set(user.viewedSharedMemoryIds || []);
      const hasNew = fetchedMemories.some(mem => !viewedIds.has(mem.id));
      setHasNewSharedMemories(hasNew);
      
      // THIS IS THE KEY CHANGE: setLoading and setIsDataLoading only after first successful fetch
      setLoading(false); 
      setIsDataLoading(false);
    }, (error) => { 
        console.error("Error listening to memories:", error); 
        toast({ title: "Data Error", description: "Could not load memories. Please refresh.", variant: "destructive"});
        setLoading(false);
        setIsDataLoading(false); 
    });

    const promptFlagsDocRef = doc(db, 'userPromptFlags', user.id);
    const unsubscribePrompts = onSnapshot(promptFlagsDocRef, (docSnap) => {
      setFlaggedPromptIds(new Set(Object.entries(docSnap.data() || {}).filter(([, v]) => v === true).map(([k]) => k)));
    }, (error) => console.error("Error listening to prompt flags:", error));

    return () => {
      unsubscribeMemories();
      unsubscribePrompts();
    };
  }, [user?.id, user?.viewedSharedMemoryIds]);


  // Navigation Logic
  useEffect(() => {
    if (loading) return; // Wait for auth and initial data load to complete.
    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    const isPublic = publicPaths.some(path => pathname.startsWith(path));
    if (user && isPublic) {
      router.push(userMode === 'host' ? '/prompts' : '/timeline');
    } else if (!user && !isPublic) {
      router.push('/login');
    }
  }, [user, loading, pathname, router, userMode]);

  // Memoized Functions for Context API

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
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: User = {
          id: cred.user.uid,
          email: email,
          name: name,
          sharedAccessStatus: 'no_pass_initiated',
          hostPassStatus: 'no_pass_initiated',
          viewedSharedMemoryIds: [],
          storageUsedBytes: 0,
      };
      await setDoc(doc(db, "users", cred.user.uid), { ...newUser, createdAt: serverTimestamp() });
      toast({ title: "Registration Successful", description: "Welcome! Your account has been created." });
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message || "Could not create account.", variant: "destructive" });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUserModeState('host');
      setGuestPassPriceDetails(null);
      setHostPassPriceDetails(null);
      router.push('/');
    } catch (error: any) {
      toast({ title: "Logout Failed", variant: "destructive" });
    }
  }, [router]);
  
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
    if (user && userMode === 'guest' && (user.sharedAccessStatus === 'free_pass_expired' || user.sharedAccessStatus === 'paid_pass_expired')) {
        fetchGuestPassPrice();
    } else if (user && userMode === 'host' && (user.hostPassStatus === 'free_host_pass_expired' || user.hostPassStatus === 'paid_host_pass_expired')) {
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
      getLatestMemories: () => memories,
      completedPromptIds,
      flaggedPromptIds,
      isDataLoading,
      markSharedMemoryAsViewed,
      hasNewSharedMemories,
  }), [
      user, loading, pendingRequestCount, userMode,
      guestPassPriceDetails, isFetchingGuestPassPrice, hostPassPriceDetails, isFetchingHostPassPrice,
      memories, completedPromptIds, flaggedPromptIds, isDataLoading, hasNewSharedMemories,
      login, register, logout, activateFreeGuestPass, purchasePaidGuestPass,
      markSharedMemoryAsViewed, activateFreeHostPass, purchasePaidHostPass,
      getStorageQuotaBytes,
      calculateAndUpdateStorageUsage, updateUserProfileInFirestore
  ]);
  
  if (loading) {
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-headline text-muted-foreground">Loading Memory Weaver...</p>
          </div>
       </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
