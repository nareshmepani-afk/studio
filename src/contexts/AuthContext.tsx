
"use client";

import type { User } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string) => void; // Simplified login
  logout: () => void;
  loading: boolean;
  pendingRequestCount: number;
  setPendingRequestCount: (count: number) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [pendingRequestCount, setPendingRequestCountState] = useState<number>(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Mock checking for a stored token or session
    const storedUser = localStorage.getItem('memoryWeaverUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated && !['/login', '/register'].includes(pathname)) {
      router.push('/login');
    }
    if (!loading && isAuthenticated && ['/login', '/register'].includes(pathname)) {
      router.push('/');
    }
  }, [isAuthenticated, loading, pathname, router]);

  const login = (email: string) => {
    // Mock login: In a real app, call an API, get a token, user data
    const mockUser: User = { id: '1', email, name: email.split('@')[0] };
    localStorage.setItem('memoryWeaverUser', JSON.stringify(mockUser));
    setUser(mockUser);
    setIsAuthenticated(true);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('memoryWeaverUser');
    setUser(null);
    setIsAuthenticated(false);
    setPendingRequestCountState(0); // Reset on logout
    router.push('/login');
  };

  const setPendingRequestCount = useCallback((count: number) => {
    setPendingRequestCountState(count);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading, pendingRequestCount, setPendingRequestCount }}>
      {children}
    </AuthContext.Provider>
  );
};
