'use client';

import { useEffect, useCallback, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export function useRecaptcha(siteKey: string | undefined) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!siteKey) return;
    if (window.grecaptcha) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Optional: Clean up script if component unmounts, 
      // but usually better to keep it for SPA navigation
    };
  }, [siteKey]);

  const executeAction = useCallback(async (actionName: string): Promise<string | null> => {
    if (!siteKey || !window.grecaptcha) {
      console.warn('[useRecaptcha] Script not loaded or siteKey missing.');
      return null;
    }

    return new Promise((resolve) => {
      window.grecaptcha.enterprise.ready(async () => {
        try {
          const token = await window.grecaptcha.enterprise.execute(siteKey, { action: actionName });
          resolve(token);
        } catch (error) {
          console.error('[useRecaptcha] Execution failed:', error);
          resolve(null);
        }
      });
    });
  }, [siteKey]);

  return { isLoaded, executeAction };
}
