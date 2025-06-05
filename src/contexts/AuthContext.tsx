
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
    const storedUserJson = localStorage.getItem('memoryWeaverUser');
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson);
         // Ensure all expected fields are at least present or defaulted if necessary
        const hydratedUser: User = {
          id: storedUser.id || '1', // default id if missing
          email: storedUser.email,
          name: storedUser.name,
          profileInfo: storedUser.profileInfo,
          avatarUrl: storedUser.avatarUrl,
          dateOfBirth: storedUser.dateOfBirth,
          countryOfBirth: storedUser.countryOfBirth,
          city: storedUser.city,
          townArea: storedUser.townArea,
        };
        setUser(hydratedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('memoryWeaverUser'); // Clear corrupted data
      }
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
    // If user already exists in localStorage with this email, load it. Otherwise, create a new mock user.
    const storedUserJson = localStorage.getItem('memoryWeaverUser');
    let currentUser: User | null = null;
    if (storedUserJson) {
        try {
            const storedUser = JSON.parse(storedUserJson);
            if (storedUser.email === email) {
                 currentUser = {
                    id: storedUser.id || '1',
                    email: storedUser.email,
                    name: storedUser.name,
                    profileInfo: storedUser.profileInfo,
                    avatarUrl: storedUser.avatarUrl,
                    dateOfBirth: storedUser.dateOfBirth,
                    countryOfBirth: storedUser.countryOfBirth,
                    city: storedUser.city,
                    townArea: storedUser.townArea,
                };
            }
        } catch (e) {
            console.error("Failed to parse user from localStorage during login", e);
        }
    }

    if (!currentUser) {
        currentUser = { id: Date.now().toString(), email, name: email.split('@')[0] }; // Create new if not found or error
    }
    
    localStorage.setItem('memoryWeaverUser', JSON.stringify(currentUser));
    setUser(currentUser);
    setIsAuthenticated(true);
    // Only push to '/' if not already trying to go somewhere specific or on login/register
    if (['/login', '/register'].includes(pathname) || pathname === "") {
        router.push('/');
    }
  };

  const logout = () => {
    localStorage.removeItem('memoryWeaverUser');
    setUser(null);
    setIsAuthenticated(false);
    setPendingRequestCountState(0);
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
