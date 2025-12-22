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
    console.log('[AUTH_PROVIDER] Setting up Firebase auth state listener.');
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      console.log(`[AUTH_PROVIDER] Auth state changed. User is ${firebaseUser ? 'SIGNED IN' : 'SIGNED OUT'}.`);
      setLoading(true);

      if (firebaseUser) {
        console.log('[AUTH_PROVIDER] User is signed in. Getting ID token...');
        const idToken = await firebaseUser.getIdToken();
        console.log('[AUTH_PROVIDER] Got ID token. Sending to /api/auth/session to create session...');

        try {
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`[AUTH_PROVIDER] Failed to create session. Server responded with ${response.status}: ${errorBody}`);
          }

          console.log('[AUTH_PROVIDER] Successfully created session. Setting user in state.');
          setUser(firebaseUser);

        } catch (error) {
          console.error('[AUTH_PROVIDER] CRITICAL: Error creating session cookie:', error);
          setUser(null); // Ensure user is not authenticated in the app if session creation fails
        }

      } else {
        console.log('[AUTH_PROVIDER] User is signed out. Sending request to /api/auth/session to delete session...');
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
          console.log('[AUTH_PROVIDER] Successfully deleted session.');
        } catch (error) {
          console.error('[AUTH_PROVIDER] Error deleting session cookie:', error);
        }
        setUser(null);
      }
      setLoading(false);
      console.log(`[AUTH_PROVIDER] Finished processing auth state change. Loading is ${false}.`);
    });

    return () => {
      console.log('[AUTH_PROVIDER] Cleaning up Firebase auth state listener.');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return; // Do not run routing logic while auth state is being determined

    const isPrivateRoute = PRIVATE_ROUTES.some(route => pathname.startsWith(route));

    if (!user && isPrivateRoute) {
      console.log(`[AUTH_PROVIDER] User is not authenticated and is on a private route (${pathname}). Redirecting to /login.`);
      router.push('/login');
    }
    
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (user && isPublicRoute && pathname !== '/') {
        console.log(`[AUTH_PROVIDER] User is authenticated and on a public route (${pathname}). Redirecting to /prompts.`);
        router.push('/prompts');
    }

  }, [user, loading, pathname, router]);

  // ... (rest of the component is unchanged)
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
