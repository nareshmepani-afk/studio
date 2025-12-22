'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie'; // Using js-cookie to manage auth token

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
const AUTH_COOKIE_NAME = 'firebase-auth-token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hostPassStatus, setHostPassStatus] = useState<'free_host_pass_active' | 'paid_host_pass_active' | 'inactive'>('inactive');
  const [storageQuotaBytes, setStorageQuotaBytes] = useState({ total: 100 * 1024 * 1024, used: 0 });

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        console.log("[AUTH] User signed in. Setting cookie.");
        const token = await firebaseUser.getIdToken();
        Cookies.set(AUTH_COOKIE_NAME, token, { expires: 7, secure: true, sameSite: 'lax' });
        setUser(firebaseUser);
      } else {
        console.log("[AUTH] User signed out. Removing cookie.");
        Cookies.remove(AUTH_COOKIE_NAME);
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
          console.log(`[AUTH] User logged in on public page ${pathname}. Redirecting to /prompts.`);
          router.push('/prompts');
        }
      } else {
        if (isPrivateRoute) {
          console.log(`[AUTH] User not logged in on private page. Redirecting to /login.`);
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
