
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

const PRIVATE_ROUTES = ['/dashboard', '/timeline', '/add-memory', '/prompts', '/settings', '/requests', '/create'];
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
    // onIdTokenChanged handles token refreshes and expirations, making it robust.
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      // If user is null, it means they are logged out or the token is invalid.
      if (!firebaseUser) {
        // Check if there was a user before. This prevents firing on initial load.
        const wasLoggedIn = !!user;
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

      // If user exists, listen for their profile data from Firestore.
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
  }, [router, user]);

  useEffect(() => {
    if (loading) return;

    const isPrivateRoute = PRIVATE_ROUTES.some(route => pathname.startsWith(route));
    const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.some(route => pathname.startsWith(route));

    if (isAuthenticated) {
      if (isPublicOnlyRoute) {
        router.push('/timeline');
      }
    } else {
      if (isPrivateRoute) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

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
    console.log('TESTIMONY_REG_01: Registration process started.');
    try {
      console.log('TESTIMONY_REG_02: Attempting to create user with email and password.');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('TESTIMONY_REG_03: User created successfully in Firebase Auth. UID:', firebaseUser.uid);
      
      console.log('TESTIMONY_REG_04: Attempting to get ID token.');
      const idToken = await firebaseUser.getIdToken();
      console.log('TESTIMONY_REG_05: ID token retrieved. Attempting to create session.');
      await createSessionAction(idToken);
      console.log('TESTIMONY_REG_06: Session created successfully.');

      console.log('TESTIMONY_REG_07: Attempting to update user profile display name.');
      await updateProfile(firebaseUser, { displayName: name });
      console.log('TESTIMONY_REG_08: User profile display name updated.');
      
      const userProfile: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: name,
        createdAt: new Date().toISOString(),
        hostPassStatus: 'free_host_pass_active',
        freeHostPassActivatedDate: new Date().toISOString(),
        sharedAccessStatus: 'no_pass_initiated',
        storageUsedBytes: 0,
        storageQuota: { total: STANDARD_HOST_STORAGE_QUOTA_BYTES, used: 0 },
      };
      
      console.log('TESTIMONY_REG_09: Attempting to create user profile in Firestore.');
      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
      console.log('TESTIMONY_REG_10: User profile created in Firestore.');
      
      toast({ title: 'Registration Successful', description: "Welcome to Memory Weaver! Your complimentary 6-month Host Pass has been activated.", variant: 'success' });
      
      console.log('TESTIMONY_REG_11: All registration steps complete. Redirecting to /timeline...');
      router.push('/timeline');
    } catch (error: any)
      {
      console.error('TESTIMONY_REG_ERR: Registration failed.', error);
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
