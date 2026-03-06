
'use client';

import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { onIdTokenChanged, type User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { toast } from './use-toast';
import type { User } from '@/types';
import { createSessionAction, deleteSessionAction } from '@/actions/createSessionAction';

type CombinedUser = FirebaseUser & Partial<User>;

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
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
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
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/prompts');
      toast({ title: 'Login Successful', description: "Welcome back!", variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      throw error;
    }
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName: name });
      router.push('/prompts');
      toast({ title: 'Registration Successful', description: "Welcome to Memory Weaver!", variant: 'success' });
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
