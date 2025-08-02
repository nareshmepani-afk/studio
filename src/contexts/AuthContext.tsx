
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

  // Centralize Firestore listeners
  useEffect(() => {
    let memoriesUnsubscribe: Unsubscribe | undefined;
    let promptsUnsubscribe: Unsubscribe | undefined;

    if (user?.id) {
      setIsDataLoading(true);

      // Listener for memories
      const memoriesQuery = query(collection(db, "users", user.id, "memories"), orderBy('date', 'desc'));
      memoriesUnsubscribe = onSnapshot(memoriesQuery, (snapshot) => {
        const fetchedMemories = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          date: (docSnap.data().date as Timestamp)?.toDate ? (docSnap.data().date as Timestamp).toDate().toISOString() : docSnap.data().date as string,
          createdAt: (docSnap.data().createdAt as Timestamp)?.toDate ? (docSnap.data().createdAt as Timestamp).toDate().toISOString() : undefined,
          updatedAt: (docSnap.data().updatedAt as Timestamp)?.toDate ? (docSnap.data().updatedAt as Timestamp).toDate().toISOString() : undefined,
        })) as MemoryType[];
        setMemories(fetchedMemories);

        const promptIds = new Set(fetchedMemories.map(m => m.promptId).filter(Boolean) as string[]);
        setCompletedPromptIds(promptIds);
        
        // This is a good place to also update storage usage if needed
        // calculateAndUpdateStorageUsage(user.id);
      }, (error) => {
        console.error("Error listening to memories:", error);
        toast({ title: "Error Loading Memories", variant: "destructive" });
      });

      // Listener for prompt flags
      const promptFlagsDocRef = doc(db, 'userPromptFlags', user.id);
      promptsUnsubscribe = onSnapshot(promptFlagsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const flaggedIdsFromDb = Object.entries(data)
            .filter(([_, value]) => value === true)
            .map(([key, _]) => key);
          setFlaggedPromptIds(new Set(flaggedIdsFromDb));
        } else {
          setFlaggedPromptIds(new Set());
        }
      }, (error) => {
        console.error("Error listening to prompt flags:", error);
        toast({ title: "Error Loading Journey Flags", variant: "destructive" });
      });
      
      setIsDataLoading(false);

    } else {
      // No user, clear data
      setMemories([]);
      setCompletedPromptIds(new Set());
      setFlaggedPromptIds(new Set());
      setIsDataLoading(false);
    }

    // Cleanup function
    return () => {
      if (memoriesUnsubscribe) {
        memoriesUnsubscribe();
      }
      if (promptsUnsubscribe) {
        promptsUnsubscribe();
      }
    };
  }, [user?.id]);


  const updateUserProfileInFirestore = useCallback(async (userId: string, updates: Partial<User>) => {
    if (!userId) {
      return;
    }
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { ...updates, lastUpdated: serverTimestamp() });
      setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
    } catch (error: any) {
      console.error(`AuthContext: Error updating user profile in Firestore for user ${userId}:`, error);
    }
  }, []);


  const calculateAndUpdateStorageUsage = useCallback(async (userId: string) => {
    if (!userId) {
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

        const currentUser = user;
        if (currentUser && currentUser.id === userId && currentUser.storageUsedBytes !== usedBytes) {
            await updateUserProfileInFirestore(userId, { storageUsedBytes: usedBytes });
        }
    } catch (error) {
        console.error(`AuthContext: Error calculating storage usage from Firestore for user ${userId}:`, error);
    }
  }, [updateUserProfileInFirestore, user]);


  const checkIfGuestHasUnviewedMemories = useCallback(async (): Promise<boolean> => {
    if (!user || userMode !== 'guest') {
      return false;
    }
    return false;
  }, [user, userMode]);

  const checkAndUpdatePassStatus = useCallback(async (currentUser: User): Promise<User> => {
    let updatedUser = { ...currentUser };
    const now = new Date();
    let updatesToSave: Partial<User> = {};

    // Guest Pass Check
    if (updatedUser.sharedAccessStatus === 'free_pass_active' && updatedUser.freePassActivatedDate) {
      if (isBefore(addMonths(parseISO(updatedUser.freePassActivatedDate), 6), now)) {
        updatesToSave.sharedAccessStatus = 'free_pass_expired';
      }
    } else if (updatedUser.sharedAccessStatus === 'paid_pass_active' && updatedUser.paidPassExpiryDate) {
      if (isBefore(parseISO(updatedUser.paidPassExpiryDate), now)) {
        updatesToSave.sharedAccessStatus = 'paid_pass_expired';
      }
    }

    // Host Pass Check
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

  const onAuthChange = useCallback(async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        let userDocSnap;
        try {
          userDocSnap = await getDoc(userDocRef);
        } catch (error: any) {
          console.error(`AuthContext: Firestore getDoc FAILED for user ${firebaseUser.uid}:`, error);
          toast({ title: "Profile Load Error", description: `Error loading profile: ${error.message}. Check connection and Firebase setup.`, variant: "destructive", duration: 10000 });
          setUser(null); setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
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
          try {
            await setDoc(userDocRef, { ...appUserInitial, createdAt: serverTimestamp() });
          } catch (error) {
            console.error(`AuthContext: Firestore setDoc FAILED for new user ${firebaseUser.uid}:`, error);
          }
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, onAuthChange);
    return () => unsubscribe();
  }, [onAuthChange]);


  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    const isPublic = publicPaths.includes(pathname);

    if (isAuthenticated && isPublic) {
      const targetPath = userMode === 'host' ? '/prompts' : '/timeline';
      if (!isRedirectingFromAuthGuard.current) {
        isRedirectingFromAuthGuard.current = true;
        router.push(targetPath);
      }
    } else if (!isAuthenticated && !isPublic) {
      if (!isRedirectingFromAuthGuard.current) {
        isRedirectingFromAuthGuard.current = true;
        router.push('/login');
      }
    } else {
      isRedirectingFromAuthGuard.current = false;
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
      // Now that user is created, create their document in Firestore.
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const appUserInitial: User = {
        id: userCredential.user.uid,
        email: email,
        name: name,
        sharedAccessStatus: 'no_pass_initiated',
        hostPassStatus: 'no_pass_initiated',
        viewedSharedMemoryIds: [],
        storageUsedBytes: 0,
      };
      await setDoc(userDocRef, { ...appUserInitial, createdAt: serverTimestamp() });

      toast({ title: "Registration Successful", description: "Welcome! Your account has been created." });
    } catch (error: any) {
      console.error("AuthContext: Registration error:", error);
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
    } catch (error) {
      console.error("AuthContext: Logout error:", error);
      toast({ title: "Logout Failed", variant: "destructive" });
    }
  }, [router]);
  
  const fetchGuestPassPriceLogic = useCallback(async () => {
    if (isFetchingGuestPassPrice || guestPassPriceDetails) return;
    setIsFetchingGuestPassPrice(true);
    try {
      const cityForPrice = user?.city || 'London';
      const countryForPrice = user?.countryOfBirth || 'UK';
      const priceData = await getGuestPassPriceAction({ city: cityForPrice, country: countryForPrice });
      setGuestPassPriceDetails(priceData);
    } catch (error) {
      console.error("AuthContext: Failed to fetch GUEST pass price:", error);
    } finally { setIsFetchingGuestPassPrice(false); }
  }, [isFetchingGuestPassPrice, guestPassPriceDetails, user]);

  const fetchHostPassPriceLogic = useCallback(async () => {
    if (isFetchingHostPassPrice || hostPassPriceDetails) return;
    setIsFetchingHostPassPrice(true);
    try {
      const cityForPrice = user?.city || 'London';
      const countryForPrice = user?.countryOfBirth || 'UK';
      const priceData = await getHostPassPriceAction({ city: cityForPrice, country: countryForPrice });
      setHostPassPriceDetails(priceData);
    } catch (error) {
      console.error("AuthContext: Failed to fetch HOST pass price:", error);
    } finally { setIsFetchingHostPassPrice(false); }
  }, [isFetchingHostPassPrice, hostPassPriceDetails, user]);

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
        const now = new Date(); let startDate = now;
        if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(now, parseISO(user.paidPassExpiryDate))) { startDate = parseISO(user.paidPassExpiryDate); }
        const newExpiryDate = addDays(startDate, 31);
        const updates: Partial<User> = { sharedAccessStatus: 'paid_pass_active', paidPassExpiryDate: newExpiryDate.toISOString() };
        await updateUserProfileInFirestore(user.id, updates);
        toast({ title: "Guest Pass Activated (Payment Simulated)!", description: `Your 31-day guest pass is now active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000 });
    }
  }, [user, updateUserProfileInFirestore]);

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
      const now = new Date(); let startDate = now;
      if (user.hostPassStatus === 'paid_host_pass_active' && user.paidHostPassExpiryDate && isBefore(now, parseISO(user.paidHostPassExpiryDate))) { startDate = parseISO(user.paidHostPassExpiryDate); }
      const newExpiryDate = addDays(startDate, 31);
      const updates: Partial<User> = { hostPassStatus: 'paid_host_pass_active', paidHostPassExpiryDate: newExpiryDate.toISOString() };
      await updateUserProfileInFirestore(user.id, updates);
      toast({ title: "Host Pass Activated (Payment Simulated)!", description: `Your 31-day host pass is now active. Ends ${format(newExpiryDate, 'PPP')}.`, duration: 7000 });
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

  const getStorageQuotaBytes = useCallback((): number => (user && (user.hostPassStatus === 'free_host_pass_active' || user.hostPassStatus === 'paid_host_pass_active')) ? STANDARD_HOST_STORAGE_QUOTA_BYTES : 0, [user]);

  const resetHostPassForTesting = useCallback(async () => {
    if (user) {
      const updates: Partial<User> = { hostPassStatus: 'no_pass_initiated', freeHostPassActivatedDate: undefined, paidHostPassExpiryDate: undefined };
      await updateUserProfileInFirestore(user.id, updates);
      setHostPassPriceDetails(null); 
      toast({ title: "Host Pass Reset (Testing)", description: "Host pass status has been reset." });
    }
  }, [user, updateUserProfileInFirestore]);
  
  const checkAndUpdateGuestPassStatus = useCallback(() => {
    if (user) {
        checkAndUpdatePassStatus(user);
    }
  }, [user, checkAndUpdatePassStatus]);
  
  const checkAndUpdateHostPassStatus = useCallback(() => {
    if (user) {
        checkAndUpdatePassStatus(user);
    }
  }, [user, checkAndUpdatePassStatus]);


  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, login, register, logout, loading,
      pendingRequestCount, setPendingRequestCount: setPendingRequestCountState,
      userMode, toggleUserMode: () => setUserModeState(p => p === 'host' ? 'guest' : 'host'), setUserMode: setUserModeState,
      activateFreeGuestPass, purchasePaidGuestPass, checkAndUpdateGuestPassStatus,
      hasNewSharedMemories, setHasNewSharedMemories: setHasNewSharedMemoriesState,
      markSharedMemoryAsViewed, checkIfGuestHasUnviewedMemories,
      guestPassPriceDetails, fetchGuestPassPrice: fetchGuestPassPriceLogic, isFetchingGuestPassPrice,
      activateFreeHostPass, purchasePaidHostPass, checkAndUpdateHostPassStatus,
      hostPassStatus: user?.hostPassStatus || 'no_pass_initiated',
      hostPassPriceDetails, fetchHostPassPrice: fetchHostPassPriceLogic, isFetchingHostPassPrice,
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

    