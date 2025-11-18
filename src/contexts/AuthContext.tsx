
"use client";

import type { User, UserMode, Memory as MemoryType } from '@/types';
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { addMonths, addDays, isBefore, parseISO, format } from 'date-fns';
import SplashScreen from '@/components/layout/SplashScreen'; 
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
  pendingRequestCount: number;
  setPendingRequestCount: (count: number) => void;
  userMode: UserMode;
  toggleUserMode: () => void;
  setUserMode: (mode: UserMode) => void;
  
  hostPassStatus: User['hostPassStatus'];
  
  storageQuotaBytes: number;
  calculateAndUpdateStorageUsage: (userId: string) => Promise<void>;
  updateUserProfileInFirestore: (userId: string, updates: Partial<User>) => Promise<void>;
  
  memories: MemoryType[];
  getLatestMemories: () => MemoryType[];
  completedPromptIds: Set<string>;
  flaggedPromptIds: Set<string>;
  isDataLoading: boolean; 
  loading: boolean; // Centralized loading state
  markSharedMemoryAsViewed: (memoryId: string) => Promise<void>;
  hasNewSharedMemories: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setIsLoading] = useState(true); // Centralized loading state for auth & initial data
  const [isDataLoading, setIsDataLoading] = useState(true); 
  const [userMode, setUserModeState] = useState<UserMode>('host');
  
  const [pendingRequestCount, setPendingRequestCountState] = useState<number>(0);
  
  const [memories, setMemories] = useState<MemoryType[]>([]);
  const [completedPromptIds, setCompletedPromptIds] = useState<Set<string>>(new Set());
  const [flaggedPromptIds, setFlaggedPromptIds] = useState<Set<string>>(new Set());
  
  const [hasNewSharedMemories, setHasNewSharedMemories] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const updateUserProfileInFirestore = useCallback(async (userId: string, updates: Partial<User>) => {
    const userDocRef = doc(db, "users", userId);
    try {
      console.log(`AuthContext: Attempting to update user profile for ${userId}.`);
      await updateDoc(userDocRef, { ...updates, lastUpdated: serverTimestamp() });
    } catch (error: any) {
      console.error(`AuthContext: Error updating user profile in Firestore for user ${userId}:`, error);
      throw error;
    }
  }, []);

  // Listener and State Management
  useEffect(() => {
    console.log("AuthContext: Setting up onAuthStateChanged listener.");
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log(`AuthContext: Auth state changed. User found with ID: ${firebaseUser.uid}`);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        // Use onSnapshot to listen for real-time updates to the user document
        const unsubscribeUser = onSnapshot(userDocRef, (userDocSnap) => {
          if (userDocSnap.exists()) {
            console.log(`AuthContext: User document snapshot received for ${firebaseUser.uid}.`);
            const userData = { id: firebaseUser.uid, ...userDocSnap.data() } as User;
            setUser(userData);
          } else {
             // This case is unlikely if registration is handled correctly, but good for resilience.
             console.log(`AuthContext: User document does not exist for UID ${firebaseUser.uid}. This might happen on first registration before doc is created.`);
          }
        });

        // Detach the user listener when the auth state changes (e.g., on logout)
        return () => {
           console.log("AuthContext: Cleaning up user document onSnapshot listener.");
           unsubscribeUser();
        };

      } else {
        console.log("AuthContext: Auth state changed. No user found.");
        setUser(null);
        setMemories([]);
        setCompletedPromptIds(new Set());
        setFlaggedPromptIds(new Set());
        setIsLoading(false); 
        setIsDataLoading(false);
      }
    });

    return () => {
      console.log("AuthContext: Cleaning up onAuthStateChanged listener.");
      unsubscribeAuth();
    }
  }, []);

  // Data fetching listeners that depend on user.id
  useEffect(() => {
    if (!user?.id) {
      if (!loading) { 
        setIsDataLoading(false);
      }
      return;
    }
    
    console.log(`AuthContext: User ID ${user.id} found. Setting up data listeners.`);
    setIsDataLoading(true);

    const checkAndUpdatePassStatuses = async () => {
        const now = new Date();
        let updatesToSave: Partial<User> = {};
        if (user.sharedAccessStatus === 'free_pass_active' && user.freePassActivatedDate && isBefore(addMonths(parseISO(user.freePassActivatedDate), 6), now)) updatesToSave.sharedAccessStatus = 'free_pass_expired';
        if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(parseISO(user.paidPassExpiryDate), now)) updatesToSave.sharedAccessStatus = 'paid_pass_expired';
        if (user.hostPassStatus === 'free_host_pass_active' && user.freeHostPassActivatedDate && isBefore(addMonths(parseISO(user.freeHostPassActivatedDate), 6), now)) updatesToSave.hostPassStatus = 'free_host_pass_expired';
        if (user.hostPassStatus === 'paid_host_pass_active' && user.paidHostPassExpiryDate && isBefore(parseISO(user.paidHostPassExpiryDate), now)) updatesToSave.hostPassStatus = 'paid_host_pass_expired';
        if (Object.keys(updatesToSave).length > 0) {
          console.log(`AuthContext: Updating expired pass statuses for ${user.id}.`, updatesToSave);
          await updateUserProfileInFirestore(user.id, updatesToSave);
        }
    };
    checkAndUpdatePassStatuses();

    const memoriesQuery = query(collection(db, "users", user.id, "memories"), orderBy('date', 'desc'));
    const unsubscribeMemories = onSnapshot(memoriesQuery, (snapshot) => {
      console.log(`AuthContext: Memories snapshot received. ${snapshot.docs.length} documents found.`);
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
      
      console.log("AuthContext: Memories data processed. Setting isDataLoading to false.");
      setIsDataLoading(false); // Data is loaded
    }, (error) => {
        console.error("AuthContext: Error listening to memories:", error);
        toast({ title: "Data Error", description: "Could not load memories. Please refresh.", variant: "destructive"});
        setIsDataLoading(false); 
    });

    const promptFlagsDocRef = doc(db, 'userPromptFlags', user.id);
    const unsubscribePrompts = onSnapshot(promptFlagsDocRef, (docSnap) => {
      console.log("AuthContext: Prompt flags snapshot received.");
      setFlaggedPromptIds(new Set(Object.entries(docSnap.data() || {}).filter(([, v]) => v === true).map(([k]) => k)));
    }, (error) => console.error("AuthContext: Error listening to prompt flags:", error));

    return () => {
      console.log(`AuthContext: Cleaning up data listeners for user ${user.id}.`);
      unsubscribeMemories();
      unsubscribePrompts();
    };
  }, [user?.id, user?.viewedSharedMemoryIds, updateUserProfileInFirestore, loading]);


  // Navigation Logic
  useEffect(() => {
    // This effect now combines loading state management with navigation
    if (loading && !isDataLoading) {
        setIsLoading(false);
    }
    
    // The navigation logic should only run once the loading is complete.
    if (!loading) {
      console.log(`AuthContext: Navigation check. Path: ${pathname}, IsAuthenticated: ${!!user}.`);
      const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
      console.log(`AuthContext: Public paths: ${publicPaths.join(', ')}`);
      const isPublic = publicPaths.includes(pathname);
      if (user && isPublic) {
        const destination = userMode === 'host' ? '/prompts' : '/timeline';
        console.log(`AuthContext: Authenticated user on public page. Redirecting to ${destination}.`);
        router.push(destination);
      } else if (!user && !isPublic) {
        console.log("AuthContext: Unauthenticated user on private page. Redirecting to /login.");
        router.push('/login');
      }
    }
  }, [user, loading, isDataLoading, pathname, router, userMode]);

  // Memoized Functions for Context API

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      console.log(`AuthContext: Attempting to log in user with email: ${email}.`);
      setIsLoading(true); // Start loading on login attempt
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful", description: "Welcome back!", variant: "success" });
    } catch (error: any) {
      setIsLoading(false); // Stop loading on failure
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    try {
      console.log(`AuthContext: Attempting to register user with email: ${email}.`);
      setIsLoading(true); // Start loading on register attempt
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: Omit<User, 'id'> = {
          email: email,
          name: name,
          sharedAccessStatus: 'no_pass_initiated',
          hostPassStatus: 'no_pass_initiated',
          viewedSharedMemoryIds: [],
          storageUsedBytes: 0,
      };
      await setDoc(doc(db, "users", cred.user.uid), { ...newUser, createdAt: serverTimestamp() });
      toast({ title: "Registration Successful", description: "Welcome! Your account has been created.", variant: "success" });
    } catch (error: any) {
      setIsLoading(false); // Stop loading on failure
      toast({ title: "Registration Failed", description: error.message || "Could not create account.", variant: "destructive" });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log("AuthContext: Attempting to log out user.");
      await firebaseSignOut(auth);
      setUserModeState('host');
      setIsLoading(true); // Reset loading state for next login
      router.push('/');
    } catch (error: any) {
      toast({ title: "Logout Failed", variant: "destructive" });
    }
  }, [router]);
  
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

  
  // --- Final Context Value ---
  const contextValue = useMemo(() => ({
      isAuthenticated: !!user,
      user,
      login, register, logout,
      pendingRequestCount, setPendingRequestCount: setPendingRequestCountState,
      userMode, toggleUserMode: () => setUserModeState(p => p === 'host' ? 'guest' : 'host'), setUserMode: setUserModeState,
      hostPassStatus: user?.hostPassStatus || 'no_pass_initiated',
      storageQuotaBytes: getStorageQuotaBytes(),
      calculateAndUpdateStorageUsage,
      updateUserProfileInFirestore,
      memories,
      getLatestMemories: () => memories,
      completedPromptIds,
      flaggedPromptIds,
      isDataLoading,
      loading,
      markSharedMemoryAsViewed,
      hasNewSharedMemories,
  }), [ 
      user, loading, pendingRequestCount, userMode,
      memories, completedPromptIds, flaggedPromptIds, isDataLoading, hasNewSharedMemories,
      login, register, logout,
      markSharedMemoryAsViewed,
      getStorageQuotaBytes,
      calculateAndUpdateStorageUsage, updateUserProfileInFirestore
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? <SplashScreen /> : children}
    </AuthContext.Provider>
  );
};
