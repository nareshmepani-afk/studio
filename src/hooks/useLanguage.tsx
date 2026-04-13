'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageMode = 'en' | 'gu' | 'dual';

interface LanguageContextType {
  mode: LanguageMode;
  setMode: (mode: LanguageMode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to dual for the premium cinematic experience
  const [mode, setModeState] = useState<LanguageMode>('dual');

  // Load from localStorage on mount to persist user preference
  useEffect(() => {
    const savedMode = localStorage.getItem('mw-language-mode') as LanguageMode;
    if (savedMode && ['en', 'gu', 'dual'].includes(savedMode)) {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: LanguageMode) => {
    setModeState(newMode);
    localStorage.setItem('mw-language-mode', newMode);
  };

  return (
    <LanguageContext.Provider value={{ mode, setMode }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
