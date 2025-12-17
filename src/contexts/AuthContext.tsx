
"use client";

import type { User, UserMode } from '@/types';
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { addMonths, isBefore, parseISO } from 'date-fns';
import SplashScreen from '@/components/layout/SplashScreen'; 
import { app } from '@/lib/firebase';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type IdTokenResult,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  userMode: UserMode;
  toggleUserMode: () => void;
  setUserMode: (mode: UserMode) => void;
  hostPassStatus: User['hostPassStatus'];
  storageQuotaBytes: number;
  updateUserProfileInFirestore: (userId: string, updates: Partial<User>) => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setIsLoading] = useState(true);
  const [userMode, setUserModeState] = useState<UserMode>('host');
  
  const router = useRouter();
  const pathname = usePathname();

  const auth = getAuth(app);
  const db = getFirestore(app);

  const updateUserProfileInFirestore = useCallback(async (userId: string, updates: Partial<User>) => {
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { ...updates, lastUpdated: serverTimestamp() });
    } catch (error: any) {
      console.error(`AuthContext: Error updating user profile in Firestore for user ${userId}:`, error);
      throw error;
    }
  }, [db]);

  // This useEffect is the core of the authentication bridge.
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // --- Start: Bridge to Server --- //
        const token = await firebaseUser.getIdToken();
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        // --- End: Bridge to Server --- //

        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = { id: firebaseUser.uid, ...userDocSnap.data() } as User;
          
          const now = new Date();
          let updatesToSave: Partial<User> = {};
          if (userData.sharedAccessStatus === 'free_pass_active' && userData.freePassActivatedDate && isBefore(addMonths(parseISO(userData.freePassActivatedDate), 6), now)) updatesToSave.sharedAccessStatus = 'free_pass_expired';
          if (userData.sharedAccessStatus === 'paid_pass_active' && userData.paidPassExpiryDate && isBefore(parseISO(userData.paidPassExpiryDate), now)) updatesToSave.sharedAccessStatus = 'paid_pass_expired';
          if (userData.hostPassStatus === 'free_host_pass_active' && userData.freeHostPassActivatedDate && isBefore(addMonths(parseISO(userData.freeHostPassActivatedDate), 6), now)) updatesToSave.hostPassStatus = 'free_host_pass_expired';
          if (userData.hostPassStatus === 'paid_host_pass_active' && userData.paidHostPassExpiryDate && isBefore(parseISO(userData.paidHostPassExpiryDate), now)) updatesToSave.hostPassStatus = 'paid_host_pass_expired';
          if (Object.keys(updatesToSave).length > 0) {
            await updateUserProfileInFirestore(firebaseUser.uid, updatesToSave);
            setUser({ ...userData, ...updatesToSave });
          } else {
            setUser(userData);
          }
        }
      } else {
        // --- Start: Bridge to Server (Logout) --- //
        await fetch('/api/auth/session', { method: 'DELETE' });
        // --- End: Bridge to Server (Logout) --- //
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, [auth, db, updateUserProfileInFirestore]);

  useEffect(() => {
    if (!loading) {
      const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
      
      // CHANGE: Use an exact match for the root '/', but startsWith for others
      const isPublic = pathname === '/' || publicPaths.filter(p => p !== '/').some(p => pathname.startsWith(p));

      if (user && isPublic) {
        // Only redirect if they are actually on a landing/login page
        const destination = userMode === 'host' ? '/prompts' : '/timeline';
        console.log("[AUTH] User is on public page, redirecting to:", destination);
        router.push(destination);
      } else if (!user && !isPublic) {
        console.log("[AUTH] User is unauthenticated on private page, redirecting to login");
        router.push('/login');
      }
    }
  }, [user, loading, pathname, router, userMode]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful", description: "Welcome back!", variant: "success" });
    } catch (error: any) {
      setIsLoading(false);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
      throw error;
    }
  }, [auth]);

  const register = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
      toast({ title: "Registration Failed", description: error.message || "Could not create account.", variant: "destructive" });
      throw error;
    }
  }, [auth, db]);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUserModeState('host');
      setIsLoading(true);
      router.push('/');
    } catch (error: any) {
      toast({ title: "Logout Failed", variant: "destructive" });
    }
  }, [auth, router]);
  
  const getStorageQuotaBytes = useCallback((): number => (user && (user.hostPassStatus === 'free_host_pass_active' || user.hostPassStatus === 'paid_host_pass_active')) ? STANDARD_HOST_STORAGE_QUOTA_BYTES : 0, [user]);

  const contextValue = useMemo(() => ({
      isAuthenticated: !!user,
      user,
      loading,
      login, 
      register, 
      logout,
      userMode, 
      toggleUserMode: () => setUserModeState(p => p === 'host' ? 'guest' : 'host'), 
      setUserMode: setUserModeState,
      hostPassStatus: user?.hostPassStatus || 'no_pass_initiated',
      storageQuotaBytes: getStorageQuotaBytes(),
      updateUserProfileInFirestore,
  }), [ 
      user, loading, userMode,
      login, register, logout,
      getStorageQuotaBytes,
      updateUserProfileInFirestore
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? <SplashScreen /> : children}
    </AuthContext.Provider>
  );
};