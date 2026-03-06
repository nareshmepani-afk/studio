
'use client';

import React, { useState, useEffect, createContext, useContext, useCallback, useRef, useMemo } from 'react';
import { onIdTokenChanged, type User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from './use-toast';
import type { User } from '@/types';
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from '@/lib/constants';
import { createSessionAction, deleteSessionAction } from '@/actions/createSessionAction';

type CombinedUser = FirebaseUser & Partial<User>;

interface AuthContextType {
  user: CombinedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  userMode: 'host' | 'guest';
  updateUserProfileInFirestore: (data: Partial<User>) => Promise<void>;
  hostPassStatus: 'no_pass_initiated' | 'free_host_pass_active' | 'paid_host_pass_active' | 'free_host_pass_expired' | 'paid_host_pass_expired';
  storageQuotaBytes: { total: number; used: number };
  isAuthenticated: boolean;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PRIVATE_ROUTES = ['/dashboard', '/timeline', '/add-memory', '/prompts', '/settings', '/requests', '/create'];
const PUBLIC_ROUTES = ['/', '/forgot-password', '/reset-password'];
const PUBLIC_ONLY_ROUTES = ['/login', '/register'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CombinedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMode, setUserMode] = useState<'host' | 'guest'>('host');
  
  const router = useRouter();
  const pathname = usePathname();
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        const wasLoggedIn = !!userRef.current;
        setUser(null);
        setLoading(false);
        if (wasLoggedIn) {
          await deleteSessionAction();
          toast({
            variant: "destructive",
            title: "Session Expired",
            description: "Your session has expired. Please log in again to continue.",
          });
          router.push('/login?reason=expired');
        }
        return;
      }

      const idToken = await firebaseUser.getIdToken();
      await createSessionAction(idToken);

      const userProfileRef = doc(db, 'users', firebaseUser.uid);
      const profileUnsubscribe = onSnapshot(userProfileRef, (doc) => {
        const fullUser = {
          ...firebaseUser,
          email: firebaseUser.email ?? "",
          ...(doc.exists() ? (doc.data() as User) : {}),
        };
        setUser(fullUser as CombinedUser);
        setLoading(false);
      }, (error) => {
         console.error("Error fetching user profile:", error);
         setUser(firebaseUser as CombinedUser); 
         setLoading(false);
      });
      return () => profileUnsubscribe();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // This effect handles redirecting logged-in users away from public-only routes.
    // Private route protection is now handled exclusively by the middleware.
    if (loading || !user) return;

    const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.some(route => pathname.startsWith(route));

    if (isPublicOnlyRoute) {
      router.push('/timeline');
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      await createSessionAction(idToken);
      toast({ title: 'Login Successful', description: "Welcome back!", variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        const idToken = await firebaseUser.getIdToken();
        await createSessionAction(idToken);
        await updateProfile(firebaseUser, { displayName: name });
        
        toast({ title: 'Registration Successful', description: "Welcome to Memory Weaver! Your complimentary 6-month Host Pass has been activated.", variant: 'success' });
        
        router.push('/prompts');
        
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
      throw error;
    }
  }, [router]);


  const logout = useCallback(async () => {
    await signOut(auth);
    await deleteSessionAction();
    setUser(null);
    router.push('/');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  }, [router]);

  const updateUserProfileInFirestore = useCallback(async (data: Partial<User>) => {
    if (!user?.uid) throw new Error("User not authenticated to update profile");
    const userProfileRef = doc(db, 'users', user.uid);
    await updateDoc(userProfileRef, { ...data, updatedAt: serverTimestamp() });
  }, [user?.uid]);
  
  const getIdToken = useCallback(async () => {
    if (!user) return null;
    return await user.getIdToken();
  }, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    userMode,
    updateUserProfileInFirestore,
    hostPassStatus: user?.hostPassStatus || 'no_pass_initiated',
    storageQuotaBytes: user?.storageQuota || { total: 0, used: 0 },
    isAuthenticated: !!user,
    getIdToken,
  }), [user, loading, login, register, logout, userMode, updateUserProfileInFirestore, getIdToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
