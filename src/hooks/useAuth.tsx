
'use client';

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { onIdTokenChanged, type User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from './use-toast';
import type { User } from '@/types';
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from '@/lib/constants';

type CombinedUser = FirebaseUser & Partial<User>;

interface AuthContextType {
  user: CombinedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  userMode: 'host' | 'guest';
  updateUserProfileInFirestore: (data: Partial<User>) => Promise<void>;
  hostPassStatus: 'no_pass_initiated' | 'free_host_pass_active' | 'paid_host_pass_active' | 'free_host_pass_expired' | 'paid_host_pass_expired';
  storageQuotaBytes: { total: number; used: number };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PRIVATE_ROUTES = ['/timeline', '/add-memory', '/prompts', '/settings', '/requests'];
const PUBLIC_ONLY_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CombinedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMode, setUserMode] = useState<'host' | 'guest'>('host');
  
  // These will be derived from user object now
  const hostPassStatus = user?.hostPassStatus || 'no_pass_initiated';
  const storageQuotaBytes = user?.storageQuota || { total: 0, used: 0 };

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userProfileRef = doc(db, 'users', firebaseUser.uid);
        const profileUnsubscribe = onSnapshot(userProfileRef, (doc) => {
          if (doc.exists()) {
            const userProfile = doc.data() as User;
            setUser({ ...firebaseUser, ...userProfile });
          } else {
            // This case might occur on first registration before Firestore doc is created
            setUser(firebaseUser as CombinedUser);
          }
          setLoading(false);
        }, (error) => {
           console.error("Firestore onSnapshot error:", error);
           setUser(firebaseUser as CombinedUser); // Fallback to firebaseUser if profile fails to load
           setLoading(false);
        });
        return () => profileUnsubscribe();
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
        fetch('/api/auth/session', { method: 'DELETE' });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    
    const isPrivateRoute = PRIVATE_ROUTES.some(route => pathname.startsWith(route));
    const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.includes(pathname);

    if (!user && isPrivateRoute) {
      router.push('/login');
    } else if (user && isPublicOnlyRoute) {
      router.push('/prompts');
    }
  }, [user, loading, pathname, router]);

  const createSession = useCallback(async (firebaseUser: FirebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      throw new Error('Failed to create session');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await createSession(userCredential.user);
      toast({ title: 'Login Successful', description: "Welcome back!", variant: 'success' });
      // Redirection is handled by the useEffect hook
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      throw error;
    }
  }, [createSession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name });
      
      const userProfile: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: name,
        createdAt: new Date().toISOString(),
        hostPassStatus: 'no_pass_initiated',
        sharedAccessStatus: 'no_pass_initiated',
        storageUsedBytes: 0,
        storageQuota: { total: STANDARD_HOST_STORAGE_QUOTA_BYTES, used: 0 },
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
      
      await createSession(firebaseUser);
      toast({ title: 'Registration Successful', description: "Welcome to Memory Weaver!", variant: 'success' });
      // Redirection is handled by the useEffect hook
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
      throw error;
    }
  }, [createSession]);

  const updateUserProfileInFirestore = useCallback(async (data: Partial<User>) => {
    if (!user?.uid) throw new Error("User not authenticated to update profile");
    const userProfileRef = doc(db, 'users', user.uid);
    await updateDoc(userProfileRef, { ...data, updatedAt: serverTimestamp() });
  }, [user?.uid]);

  const value = {
    user,
    loading,
    login,
    register,
    userMode,
    updateUserProfileInFirestore,
    hostPassStatus,
    storageQuotaBytes,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
