'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { onIdTokenChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

interface UserProfile {
  hostPassStatus?: 'free_host_pass_active' | 'paid_host_pass_active' | 'inactive';
  storageQuota?: {
    total: number;
    used: number;
  };
  // Add any other fields that might be in your user profile document
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userMode: 'host' | 'guest'; // Added userMode
  updateUserProfileInFirestore: (data: Partial<UserProfile>) => Promise<void>; // Added function
  hostPassStatus: 'free_host_pass_active' | 'paid_host_pass_active' | 'inactive';
  storageQuotaBytes: { total: number; used: number };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PRIVATE_ROUTES = ['/timeline', '/add-memory', '/prompts', '/settings', '/requests'];
const PUBLIC_ROUTES = ['/', '/login', '/register', '/reset-password'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hostPassStatus, setHostPassStatus] = useState<'free_host_pass_active' | 'paid_host_pass_active' | 'inactive'>('inactive');
  const [storageQuotaBytes, setStorageQuotaBytes] = useState({ total: 100 * 1024 * 1024, used: 0 });
  const [userMode, setUserMode] = useState<'host' | 'guest'>('host'); // Default to 'host'

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          setUser(firebaseUser);
        } catch (error) {
          console.error('[AUTH_PROVIDER] CRITICAL: Error creating session cookie:', error);
          setUser(null);
        }
      } else {
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (error) {
          console.error('[AUTH_PROVIDER] Error deleting session cookie:', error);
        }
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
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

  useEffect(() => {
    if (user?.uid) {
      const userProfileRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userProfileRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserProfile;
          setHostPassStatus(data.hostPassStatus || 'inactive');
          if (data.storageQuota) {
            setStorageQuotaBytes(data.storageQuota);
          }
        }
      });
      return () => unsubscribe();
    } else {
      setHostPassStatus('inactive');
      setStorageQuotaBytes({ total: 100 * 1024 * 1024, used: 0 });
    }
  }, [user?.uid]);

  const updateUserProfileInFirestore = async (data: Partial<UserProfile>) => {
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
