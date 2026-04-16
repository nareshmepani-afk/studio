
'use client';

import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { onIdTokenChanged, type User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore'; // Added setDoc
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { User, Director, UserAccount } from '@/types'; 
import { createSessionAction, deleteSessionAction } from '@/actions/createSessionAction';

type CombinedUser = FirebaseUser & Partial<UserAccount & Director>;

interface AuthContextType {
  user: CombinedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfileInFirestore: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CombinedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      // Clean up previous profile listener if any
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (firebaseUser) {
        // Silent Background Sync (Non-blocking)
        firebaseUser.getIdToken().then(idToken => {
          createSessionAction(idToken).catch(err => 
            console.error("[useAuth] Background session sync failed:", err)
          );
        });

        const userProfileRef = doc(db, 'users', firebaseUser.uid);
        profileUnsubscribe = onSnapshot(userProfileRef, (doc) => {
          const userData = doc.exists() ? (doc.data() as UserAccount) : { isPremium: false };
          
          const fullUser = {
            ...firebaseUser,
            email: firebaseUser.email ?? "",
            ...userData,
          };
          setUser(fullUser as CombinedUser);
          setLoading(false);
        }, (error) => {
           console.error("[useAuth] Error fetching user profile:", error);
           setUser(firebaseUser as CombinedUser); 
           setLoading(false);
        });
      } else {
        // Break the redirect loop: If no client session, ensure server session is also gone
        deleteSessionAction().catch(err => console.error("[useAuth] Failed to clear session cookie:", err));
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Surgical Refresh
      const idToken = await userCredential.user.getIdToken();
      await createSessionAction(idToken);
      router.refresh();
      router.push('/studio');
      toast.success('Login Successful', { description: "Welcome back!" });
    } catch (error: any) {
      toast.error('Login Failed', { description: error.message });
      throw error;
    }
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: name });

      // Create the Host profile in Firestore
      const userProfileRef = doc(db, 'users', firebaseUser.uid);
      const newUserProfile: Director = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: name,
        role: 'Director',
        subscriptionStatus: 'trial',
        storageQuota: {
          used: 0,
          total: 5 * 1024 * 1024 * 1024, // 5 GB
        },
        // @ts-ignore
        createdAt: serverTimestamp(),
        // @ts-ignore
        updatedAt: serverTimestamp(),
      };

      await setDoc(userProfileRef, newUserProfile);
      
      // Surgical Refresh
      const idToken = await firebaseUser.getIdToken();
      await createSessionAction(idToken);
      router.refresh();
      
      router.push('/studio');
      toast.success('Registration Successful', { description: "Welcome to Memory Weaver!" });
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error('Registration Failed', { description: error.message });
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    await signOut(auth);
    await deleteSessionAction();
    setUser(null);
    router.refresh();
    router.push('/');
    toast.info('Logged Out', { description: 'You have been successfully logged out.' });
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
    updateUserProfileInFirestore,
    isAuthenticated: !!user,
    getIdToken,
  }), [user, loading, login, register, logout, updateUserProfileInFirestore, getIdToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
