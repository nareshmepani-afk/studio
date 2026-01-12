
'use client';

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PRIVATE_ROUTES = ['/dashboard', '/timeline', '/add-memory', '/prompts', '/settings', '/requests'];
const PUBLIC_ROUTES = ['/', '/forgot-password', '/reset-password'];
const PUBLIC_ONLY_ROUTES = ['/login', '/register'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CombinedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMode, setUserMode] = useState<'host' | 'guest'>('host');
  
  const hostPassStatus = user?.hostPassStatus || 'no_pass_initiated';
  const storageQuotaBytes = user?.storageQuota || { total: 0, used: 0 };
  const isAuthenticated = !!user;

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        await createSessionAction(idToken);
        
        const userProfileRef = doc(db, 'users', firebaseUser.uid);
        const profileUnsubscribe = onSnapshot(userProfileRef, (doc) => {
          if (doc.exists()) {
            const userProfile = doc.data() as User;
            setUser({ ...firebaseUser, ...userProfile });
          } else {
            setUser(firebaseUser as CombinedUser);
          }
          setLoading(false);
        }, (error) => {
           setUser(firebaseUser as CombinedUser); 
           setLoading(false);
        });
        return () => profileUnsubscribe();
      } else {
        await deleteSessionAction();
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPrivateRoute = PRIVATE_ROUTES.some(route => pathname.startsWith(route));
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.some(route => pathname.startsWith(route));

    if (isAuthenticated) {
      if (isPublicOnlyRoute) {
        router.push('/dashboard');
      }
    } else {
      if (isPrivateRoute) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    const testStepId = 'auth-tc1-ts6';
    console.log(`TESTIMONY - ${testStepId} - START`);
    console.log('State Before: Not authenticated.');
    console.log(`Action: Attempting login for user: ${email}`);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('State After: Login successful.');
      console.log('New User State:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      });
      toast({ title: 'Login Successful', description: "Welcome back!", variant: 'success' });
    } catch (error: any) {
      console.error(`TESTIMONY - ${testStepId} - ERROR: Login failed.`, error);
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      throw error;
    } finally {
        console.log(`TESTIMONY - ${testStepId} - END`);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const testStepId = 'auth-tc1-ts2';
    console.log(`TESTIMONY - ${testStepId} - START`);
    console.log('State Before: No user is registered or logged in.');
    console.log(`Action: Attempting to register new user with email: ${email} and name: ${name}.`);

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
      
      console.log('State After: Registration successful. New user created in Firebase Auth and Firestore.');
      console.log('New User State (Auth):', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
      });
      console.log('New User State (Firestore):', userProfile);

      toast({ title: 'Registration Successful', description: "Welcome to Memory Weaver!", variant: 'success' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(`TESTIMONY - ${testStepId} - ERROR: Registration failed.`, error);
      toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
      throw error;
    } finally {
        console.log(`TESTIMONY - ${testStepId} - END`);
    }
  }, [router]);

  const logout = useCallback(async () => {
    const testStepId = 'auth-tc1-ts4';
    console.log(`TESTIMONY - ${testStepId} - START`);
    console.log(`State Before: User is logged in. User:`, { email: user?.email, uid: user?.uid });
    console.log('Action: Logging out user.');

    await signOut(auth);
    
    console.log('State After: User is logged out. Redirecting to homepage.');
    router.push('/');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    console.log(`TESTIMONY - ${testStepId} - END`);
  }, [user, router]);

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
    logout,
    userMode,
    updateUserProfileInFirestore,
    hostPassStatus,
    storageQuotaBytes,
    isAuthenticated,
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
