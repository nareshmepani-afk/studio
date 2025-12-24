'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/types';

interface AuthContextType {
  user: (FirebaseUser & User) | null;
  loading: boolean;
  userMode: 'host' | 'guest';
  updateUserProfileInFirestore: (data: Partial<User>) => Promise<void>; 
  hostPassStatus: 'no_pass_initiated' | 'free_host_pass_active' | 'paid_host_pass_active' | 'free_host_pass_expired' | 'paid_host_pass_expired';
  storageQuotaBytes: { total: number; used: number };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PRIVATE_ROUTES = ['/timeline', '/add-memory', '/prompts', '/settings', '/requests'];
const PUBLIC_ROUTES = ['/', '/login', '/register', '/reset-password'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(FirebaseUser & User) | null>(null);
  const [loading, setLoading] = useState(true);
  const [hostPassStatus, setHostPassStatus] = useState<'no_pass_initiated' | 'free_host_pass_active' | 'paid_host_pass_active' | 'free_host_pass_expired' | 'paid_host_pass_expired'>('no_pass_initiated');
  const [storageQuotaBytes, setStorageQuotaBytes] = useState({ total: 100 * 1024 * 1024, used: 0 });
  const [userMode, setUserMode] = useState<'host' | 'guest'>('host');

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authUnsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userProfileRef = doc(db, 'users', firebaseUser.uid);
        const profileUnsubscribe = onSnapshot(userProfileRef, async (doc) => {
          setLoading(true);
          try {
            const idToken = await firebaseUser.getIdToken();
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            });

            if (doc.exists()) {
              const userProfile = doc.data() as User;
              setUser({ ...firebaseUser, ...userProfile, uid: firebaseUser.uid });
              setHostPassStatus(userProfile.hostPassStatus || 'no_pass_initiated');
              if (userProfile.storageQuota) {
                setStorageQuotaBytes(userProfile.storageQuota);
              }
            } else {
              // Handle case where user exists in Auth but not in Firestore
              const newUser: User & FirebaseUser = {
                ...firebaseUser,
                uid: firebaseUser.uid,
                hostPassStatus: 'no_pass_initiated',
                sharedAccessStatus: 'no_pass_initiated',
                storageQuota: { total: 0, used: 0 },
                createdAt: new Date().toISOString(),
              } as User & FirebaseUser;
              await setDoc(userProfileRef, newUser);
              setUser(newUser);
            }
          } catch (error) {
            console.error("Error during auth state change:", error);
            setUser(null);
          } finally {
            setLoading(false);
          }
        });
        return () => profileUnsubscribe();
      } else {
        // User is signed out
        fetch('/api/auth/session', { method: 'DELETE' }).catch(err => console.error("error deleting session", err));
        setUser(null);
        setLoading(false);
        return;
      }
    });
    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const isPrivateRoute = PRIVATE_ROUTES.some(route => pathname.startsWith(route));
    if (!user && isPrivateRoute) {
      router.push('/login');
    }
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    if (user && isPublicRoute && pathname !== '/') {
        router.push('/prompts');
    }
  }, [user, loading, pathname, router]);

  const updateUserProfileInFirestore = async (data: Partial<User>) => {
    if (!user?.uid) {
      throw new Error("User not authenticated to update profile");
    }
    try {
      const userProfileRef = doc(db, 'users', user.uid);
      await updateDoc(userProfileRef, data);
    } catch (error) {
      console.error("[AUTH_PROVIDER] Error updating user profile:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    userMode,
    updateUserProfileInFirestore,
    hostPassStatus,
    storageQuotaBytes,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
