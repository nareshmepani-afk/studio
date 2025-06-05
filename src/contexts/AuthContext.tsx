
"use client";

import type { User, UserMode } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { addMonths, addDays, isBefore, parseISO, format } from 'date-fns';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string) => void; // Simplified login
  logout: () => void;
  loading: boolean;
  pendingRequestCount: number;
  setPendingRequestCount: (count: number) => void;
  userMode: UserMode;
  toggleUserMode: () => void;
  setUserMode: (mode: UserMode) => void;
  activateFreePass: () => void;
  purchasePaidPass: () => void;
  checkAndUpdatePassStatus: () => void;
  hasNewSharedMemories: boolean;
  setHasNewSharedMemories: (status: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [pendingRequestCount, setPendingRequestCountState] = useState<number>(0);
  const [userMode, setUserModeState] = useState<UserMode>('host');
  const [hasNewSharedMemories, setHasNewSharedMemoriesState] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const updateUserInStateAndStorage = (updatedUser: User | null) => {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem('memoryWeaverUser', JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem('memoryWeaverUser');
    }
  };
  
  const checkAndUpdatePassStatus = useCallback(() => {
    if (!user) return;

    let newStatus = user.sharedAccessStatus;
    const now = new Date();

    if (user.sharedAccessStatus === 'free_pass_active' && user.freePassActivatedDate) {
      const freePassEndDate = addMonths(parseISO(user.freePassActivatedDate), 6);
      if (isBefore(freePassEndDate, now)) {
        newStatus = 'free_pass_expired';
      }
    } else if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate) {
      if (isBefore(parseISO(user.paidPassExpiryDate), now)) {
        newStatus = 'paid_pass_expired';
      }
    }

    if (newStatus !== user.sharedAccessStatus) {
      const updatedUser = { ...user, sharedAccessStatus: newStatus };
      updateUserInStateAndStorage(updatedUser);
    }
  }, [user]);


  useEffect(() => {
    const storedUserJson = localStorage.getItem('memoryWeaverUser');
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson);
        const hydratedUser: User = {
          id: storedUser.id || '1',
          email: storedUser.email,
          name: storedUser.name,
          profileInfo: storedUser.profileInfo,
          avatarUrl: storedUser.avatarUrl,
          dateOfBirth: storedUser.dateOfBirth,
          countryOfBirth: storedUser.countryOfBirth,
          city: storedUser.city,
          townArea: storedUser.townArea,
          sharedAccessStatus: storedUser.sharedAccessStatus || 'no_pass_initiated',
          freePassActivatedDate: storedUser.freePassActivatedDate,
          paidPassExpiryDate: storedUser.paidPassExpiryDate,
        };
        setUser(hydratedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('memoryWeaverUser');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      checkAndUpdatePassStatus();
    }
  }, [loading, user, checkAndUpdatePassStatus, pathname]); // check on path change too

  useEffect(() => {
    if (!loading && !isAuthenticated && !['/login', '/register'].includes(pathname)) {
      router.push('/login');
    }
    if (!loading && isAuthenticated && ['/login', '/register'].includes(pathname)) {
      router.push('/');
    }
  }, [isAuthenticated, loading, pathname, router]);

  const login = (email: string) => {
    const storedUserJson = localStorage.getItem('memoryWeaverUser');
    let currentUser: User | null = null;
    if (storedUserJson) {
        try {
            const storedUser = JSON.parse(storedUserJson);
            if (storedUser.email === email) {
                 currentUser = {
                    id: storedUser.id || Date.now().toString(),
                    email: storedUser.email,
                    name: storedUser.name,
                    profileInfo: storedUser.profileInfo,
                    avatarUrl: storedUser.avatarUrl,
                    dateOfBirth: storedUser.dateOfBirth,
                    countryOfBirth: storedUser.countryOfBirth,
                    city: storedUser.city,
                    townArea: storedUser.townArea,
                    sharedAccessStatus: storedUser.sharedAccessStatus || 'no_pass_initiated',
                    freePassActivatedDate: storedUser.freePassActivatedDate,
                    paidPassExpiryDate: storedUser.paidPassExpiryDate,
                };
            }
        } catch (e) {
            console.error("Failed to parse user from localStorage during login", e);
        }
    }

    if (!currentUser) {
        currentUser = { 
            id: Date.now().toString(), 
            email, 
            name: email.split('@')[0],
            sharedAccessStatus: 'no_pass_initiated', // Default for new user
        };
    }
    
    updateUserInStateAndStorage(currentUser);
    setIsAuthenticated(true);
    setUserModeState('host'); 
    if (['/login', '/register'].includes(pathname) || pathname === "") {
        router.push('/');
    }
  };

  const logout = () => {
    updateUserInStateAndStorage(null);
    setIsAuthenticated(false);
    setPendingRequestCountState(0);
    setHasNewSharedMemoriesState(false);
    setUserModeState('host');
    router.push('/login');
  };

  const setPendingRequestCount = useCallback((count: number) => {
    setPendingRequestCountState(count);
  }, []);

  const toggleUserMode = useCallback(() => {
    setUserModeState(prevMode => {
        const newMode = prevMode === 'host' ? 'guest' : 'host';
        if (newMode === 'guest') {
            if (user) checkAndUpdatePassStatus();
            setHasNewSharedMemoriesState(false); // Clear notification
        }
        return newMode;
    });
  }, [user, checkAndUpdatePassStatus]);
  
  const setUserMode = useCallback((mode: UserMode) => {
    setUserModeState(mode);
    if (mode === 'guest') {
        if (user) checkAndUpdatePassStatus();
        setHasNewSharedMemoriesState(false); // Clear notification
    }
  }, [user, checkAndUpdatePassStatus]);

  const activateFreePass = useCallback(() => {
    if (user && user.sharedAccessStatus === 'no_pass_initiated') {
      const now = new Date();
      const updatedUser: User = {
        ...user,
        sharedAccessStatus: 'free_pass_active',
        freePassActivatedDate: now.toISOString(),
      };
      updateUserInStateAndStorage(updatedUser);
      toast({
        title: "Free Pass Activated!",
        description: `Your 6-month free access to shared memories starts now and will end on ${format(addMonths(now, 6), 'PPP')}.`,
        duration: 7000,
      });
    }
  }, [user]);

  const purchasePaidPass = useCallback(() => {
    if (user) {
      const now = new Date();
      let startDate = now;
      // If there's an existing paid pass, extend from its expiry, otherwise from now
      if (user.sharedAccessStatus === 'paid_pass_active' && user.paidPassExpiryDate && isBefore(now, parseISO(user.paidPassExpiryDate))) {
        startDate = parseISO(user.paidPassExpiryDate);
      }
      
      const newExpiryDate = addDays(startDate, 31);
      const updatedUser: User = {
        ...user,
        sharedAccessStatus: 'paid_pass_active',
        paidPassExpiryDate: newExpiryDate.toISOString(),
      };
      updateUserInStateAndStorage(updatedUser);
      toast({
        title: "Pass Purchased (Mock)!",
        description: `Your 31-day pass is now active and will end on ${format(newExpiryDate, 'PPP')}.`,
        duration: 7000,
      });
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
        isAuthenticated, 
        user, 
        login, 
        logout, 
        loading, 
        pendingRequestCount, 
        setPendingRequestCount, 
        userMode, 
        toggleUserMode, 
        setUserMode,
        activateFreePass,
        purchasePaidPass,
        checkAndUpdatePassStatus,
        hasNewSharedMemories,
        setHasNewSharedMemories: setHasNewSharedMemoriesState
    }}>
      {children}
    </AuthContext.Provider>
  );
};
