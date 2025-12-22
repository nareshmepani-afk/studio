'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { onIdTokenChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

interface UserProfile {
  hostPassStatus?: 'free_host_pass_active' | 'paid_host_pass_active' | 'inactive';
  storageQuota?: {
    total: number;
    used: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
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

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        try {
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          });
          if (!response.ok) throw new Error('Failed to create session cookie');
          setUser(firebaseUser);
        } catch (error) {
          console.error("Error creating session cookie:", error);
          setUser(null);
        }
      } else {
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (error) {
          console.error("Error deleting session cookie:", error);
        }
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      const isPrivateRoute = PRIVATE_ROUTES.some(route => pathname.startsWith(route));
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

      if (user) {
        // If user is on a public page that is not the landing page, redirect to prompts.
        if (isPublicRoute && pathname !== '/') {
          router.push('/prompts');
        }
      } else {
        if (isPrivateRoute) {
          router.push('/login');
        }
      }
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

  return (
    <AuthContext.Provider value={{ user, loading, hostPassStatus, storageQuotaBytes }}>
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
